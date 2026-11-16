"""
Alumni verification model: training, evaluation, calibration and export.

    cd backend && npm run ml:export                 # 1. export real admin decisions (labels)
    cd ../ml && .venv/Scripts/python train.py        # 2. train + evaluate + export

Input : ml/data/verification_labels.json  (written by `npm run ml:export`)
Output: backend/ml-models/verification-model.json  (loaded by the Node backend)
        backend/ml-models/MODEL_CARD.md             (human-readable report)

Method
------
* Labels are ONLY real admin decisions: verified = 1, rejected = 0 (latest decision per alumnus).
  No synthetic or "augmented" training rows are ever created.
* Missing information stays missing: each feature is median-imputed AND gets a "<name>__missing"
  indicator, so the model can learn that e.g. "no LinkedIn PDF" matters.
* Two candidates, both with class_weight="balanced":
    - Logistic Regression (standardised features)      -> simple, interpretable baseline
    - Random Forest (shallow trees, min leaf size)     -> captures interactions
* Calibration: Platt scaling fitted on out-of-fold predictions (inner CV), so the output can be read
  as a probability ("of profiles scored ~0.8, about 80% were verified by admins").
* Evaluation: repeated stratified k-fold CV (outer loop), with calibration refitted inside every
  training fold (no leakage). Reported: ROC-AUC, PR-AUC, Brier score, log loss, accuracy and a
  reliability table. The rule-based evidence score is evaluated on the same labels as a baseline.
* Model choice: lowest mean cross-validated log loss (ties -> Logistic Regression).
* Training is refused below MIN_TOTAL labels or MIN_PER_CLASS per class. `--allow-small` writes an
  "experimental" model that the backend ignores unless ML_ALLOW_SMALL_MODEL=true.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, log_loss, roc_auc_score
from sklearn.model_selection import RepeatedStratifiedKFold, StratifiedKFold

ROOT = Path(__file__).resolve().parent
DEFAULT_DATA = ROOT / "data" / "verification_labels.json"
DEFAULT_OUT = ROOT.parent / "backend" / "ml-models" / "verification-model.json"

MIN_TOTAL = 100
MIN_PER_CLASS = 20
ABSOLUTE_MIN_TOTAL = 20  # below this even --allow-small refuses (cross-validation is meaningless)
ABSOLUTE_MIN_PER_CLASS = 5
SEED = 42
EPS = 1e-6


# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------
def _num(v):
    return np.nan if v is None else float(v)


def load_dataset(path: Path):
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    names = payload["featureNames"]
    rows = payload["rows"]
    X = np.array([[_num(r["features"].get(n)) for n in names] for r in rows], dtype=float).reshape(len(rows), len(names))
    y = np.array([int(r["label"]) for r in rows], dtype=int)
    rule = np.array([_num(r.get("ruleScoreAtDecision")) for r in rows], dtype=float)
    sources = [r.get("profileSource") or "unknown" for r in rows]
    return payload, names, X, y, rule, sources


# ---------------------------------------------------------------------------
# Preprocessing (explicit so the Node backend can reproduce it exactly)
# ---------------------------------------------------------------------------
class Preprocessor:
    def fit(self, X: np.ndarray, names: list[str]):
        self.names = list(names)
        with np.errstate(all="ignore"):
            med = np.array([np.nanmedian(X[:, i]) if (~np.isnan(X[:, i])).any() else 0.0 for i in range(X.shape[1])])
        self.medians = np.nan_to_num(med, nan=0.0)
        self.indicator_idx = [i for i in range(X.shape[1]) if np.isnan(X[:, i]).any()]
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        filled = np.where(np.isnan(X), self.medians, X)
        ind = np.isnan(X[:, self.indicator_idx]).astype(float) if self.indicator_idx else np.zeros((len(X), 0))
        return np.hstack([filled, ind])

    @property
    def output_names(self):
        return self.names + [f"{self.names[i]}__missing" for i in self.indicator_idx]

    def to_json(self):
        return {
            "features": self.names,
            "medians": {n: float(m) for n, m in zip(self.names, self.medians)},
            "missingIndicators": [self.names[i] for i in self.indicator_idx],
        }


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
def _logit(p):
    p = np.clip(p, EPS, 1 - EPS)
    return np.log(p / (1 - p))


def _sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))


class BaseModel:
    """Preprocessing + either Logistic Regression or Random Forest, returning uncalibrated P(verified)."""

    def __init__(self, kind: str, names: list[str]):
        self.kind = kind
        self.names = names

    def fit(self, X, y):
        self.pre = Preprocessor().fit(X, self.names)
        Z = self.pre.transform(X)
        if self.kind == "logistic_regression":
            self.mean = Z.mean(axis=0)
            self.scale = Z.std(axis=0)
            self.scale[self.scale == 0] = 1.0
            self.clf = LogisticRegression(C=1.0, class_weight="balanced", max_iter=2000)
            self.clf.fit((Z - self.mean) / self.scale, y)
        else:
            self.clf = RandomForestClassifier(
                n_estimators=100,
                max_depth=5,
                min_samples_leaf=3,
                class_weight="balanced",
                random_state=SEED,
                n_jobs=-1,
            )
            self.clf.fit(Z, y)
        return self

    def predict_raw(self, X):
        Z = self.pre.transform(X)
        if self.kind == "logistic_regression":
            return self.clf.predict_proba((Z - self.mean) / self.scale)[:, 1]
        return self.clf.predict_proba(Z)[:, 1]

    def export(self):
        if self.kind == "logistic_regression":
            return {
                "type": "logistic_regression",
                "inputs": self.pre.output_names,
                "mean": self.mean.tolist(),
                "scale": self.scale.tolist(),
                "coef": self.clf.coef_[0].tolist(),
                "intercept": float(self.clf.intercept_[0]),
            }
        trees = []
        pos = list(self.clf.classes_).index(1)
        for est in self.clf.estimators_:
            t = est.tree_
            v = t.value[:, 0, :]
            p1 = (v[:, pos] / np.clip(v.sum(axis=1), EPS, None)).round(6)
            trees.append(
                {
                    "left": t.children_left.tolist(),
                    "right": t.children_right.tolist(),
                    "feature": t.feature.tolist(),
                    "threshold": [float(x) for x in t.threshold],  # full precision: rounding moves boundary cases
                    "p": p1.tolist(),
                }
            )
        return {"type": "random_forest", "inputs": self.pre.output_names, "trees": trees}

    def importances(self, top=10):
        names = self.pre.output_names
        if self.kind == "logistic_regression":
            vals = self.clf.coef_[0]
            order = np.argsort(-np.abs(vals))[:top]
            return [{"feature": names[i], "weight": round(float(vals[i]), 4)} for i in order]
        vals = self.clf.feature_importances_
        order = np.argsort(-vals)[:top]
        return [{"feature": names[i], "importance": round(float(vals[i]), 4)} for i in order]


class CalibratedModel:
    """Base model + Platt scaling learned from inner out-of-fold predictions."""

    def __init__(self, kind, names):
        self.kind = kind
        self.names = names

    def fit(self, X, y):
        n_inner = int(min(5, np.bincount(y, minlength=2).min()))
        self.a, self.b = 1.0, 0.0
        if n_inner >= 2:
            oof = np.zeros(len(y))
            for tr, te in StratifiedKFold(n_splits=n_inner, shuffle=True, random_state=SEED).split(X, y):
                oof[te] = BaseModel(self.kind, self.names).fit(X[tr], y[tr]).predict_raw(X[te])
            platt = LogisticRegression(C=1e6, max_iter=2000).fit(_logit(oof).reshape(-1, 1), y)
            self.a, self.b = float(platt.coef_[0][0]), float(platt.intercept_[0])
        self.base = BaseModel(self.kind, self.names).fit(X, y)
        return self

    def predict_proba(self, X):
        return _sigmoid(self.a * _logit(self.base.predict_raw(X)) + self.b)


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------
def metrics(y, p):
    out = {
        "brier": float(brier_score_loss(y, p)),
        "log_loss": float(log_loss(y, np.clip(p, EPS, 1 - EPS), labels=[0, 1])),
        "accuracy_at_0_5": float(((p >= 0.5).astype(int) == y).mean()),
    }
    if len(set(y)) == 2:
        out["roc_auc"] = float(roc_auc_score(y, p))
        out["pr_auc"] = float(average_precision_score(y, p))
    tp = int(((p >= 0.5) & (y == 1)).sum())
    fp = int(((p >= 0.5) & (y == 0)).sum())
    fn = int(((p < 0.5) & (y == 1)).sum())
    tn = int(((p < 0.5) & (y == 0)).sum())
    out["confusion_at_0_5"] = {"tp": tp, "fp": fp, "fn": fn, "tn": tn}
    return out


def reliability(y, p, bins=5):
    edges = np.linspace(0, 1, bins + 1)
    table = []
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (p >= lo) & ((p < hi) if hi < 1 else (p <= hi))
        if m.sum():
            table.append(
                {"bin": f"{lo:.1f}-{hi:.1f}", "count": int(m.sum()), "mean_predicted": round(float(p[m].mean()), 3), "fraction_verified": round(float(y[m].mean()), 3)}
            )
    return table


def cross_validate(kind, names, X, y, repeats=3):
    k = int(min(5, np.bincount(y, minlength=2).min()))
    rskf = RepeatedStratifiedKFold(n_splits=k, n_repeats=repeats, random_state=SEED)
    preds = np.zeros((repeats, len(y)))
    for i, (tr, te) in enumerate(rskf.split(X, y)):
        preds[i // k, te] = CalibratedModel(kind, names).fit(X[tr], y[tr]).predict_proba(X[te])
    per_repeat = [metrics(y, preds[r]) for r in range(repeats)]
    keys = [key for key in per_repeat[0] if key != "confusion_at_0_5"]
    summary = {key: {"mean": round(float(np.mean([m[key] for m in per_repeat])), 4), "std": round(float(np.std([m[key] for m in per_repeat])), 4)} for key in keys}
    summary["confusion_at_0_5"] = per_repeat[0]["confusion_at_0_5"]
    summary["folds"] = k
    summary["repeats"] = repeats
    return summary, preds[0]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def train(data_path: Path, out_path: Path, allow_small=False, min_total=MIN_TOTAL, min_per_class=MIN_PER_CLASS):
    payload, names, X, y, rule, sources = load_dataset(data_path)
    n, n_pos = len(y), int(y.sum())
    n_neg = n - n_pos
    print(f"Labelled alumni: {n} ({n_pos} verified, {n_neg} rejected), {len(names)} features (v{payload['featureVersion']})")

    meets_minimum = n >= min_total and min(n_pos, n_neg) >= min_per_class
    if n < ABSOLUTE_MIN_TOTAL or min(n_pos, n_neg) < ABSOLUTE_MIN_PER_CLASS:
        print(
            f"REFUSED: at least {ABSOLUTE_MIN_TOTAL} labels and {ABSOLUTE_MIN_PER_CLASS} of each class are needed even for an "
            f"experimental model. Keep reviewing real profiles in the admin dashboard; the rule-based score stays active."
        )
        return 2
    if not meets_minimum and not allow_small:
        print(
            f"REFUSED: the recommended minimum is {min_total} labels with {min_per_class} of each class "
            f"(have {n}: {n_pos}/{n_neg}). Re-run with --allow-small for an experimental model the backend will not use by default."
        )
        return 2

    results = {}
    oof = {}
    for kind in ("logistic_regression", "random_forest"):
        results[kind], oof[kind] = cross_validate(kind, names, X, y)
        r = results[kind]
        print(f"  {kind:20s} log loss {r['log_loss']['mean']:.3f}  Brier {r['brier']['mean']:.3f}  ROC-AUC {r.get('roc_auc', {}).get('mean', float('nan')):.3f}")

    chosen = min(results, key=lambda k: (round(results[k]["log_loss"]["mean"], 3), 0 if k == "logistic_regression" else 1))
    print(f"Chosen: {chosen}")

    # Baselines on the same labels
    baselines = {"always_base_rate": metrics(y, np.full(n, y.mean()))}
    has_rule = ~np.isnan(rule)
    if has_rule.sum() >= 2 and len(set(y[has_rule])) == 2:
        baselines["rule_based_score"] = {**metrics(y[has_rule], rule[has_rule]), "n": int(has_rule.sum()), "note": "The rule score is not a calibrated probability; compare ROC-AUC, not Brier."}

    final = CalibratedModel(chosen, names).fit(X, y)
    p_train = final.predict_proba(X)

    bias = {}
    for s in sorted(set(sources)):
        m = np.array([src == s for src in sources])
        bias[s] = {"n": int(m.sum()), "verified_rate": round(float(y[m].mean()), 3), "mean_cv_prediction": round(float(oof[chosen][m].mean()), 3)}

    stamp = datetime.now(timezone.utc)
    version = f"v{stamp.strftime('%Y%m%d')}-{'rf' if chosen == 'random_forest' else 'lr'}"
    model_json = {
        "format": "alumni-verification-model",
        "formatVersion": 1,
        "version": version,
        "trainedAt": stamp.isoformat(),
        "featureVersion": payload["featureVersion"],
        "algorithm": chosen,
        "meetsMinimumData": bool(meets_minimum),
        "minimums": {"total": min_total, "perClass": min_per_class},
        "trainingCounts": {"total": n, "verified": n_pos, "rejected": n_neg},
        "preprocessing": final.base.pre.to_json(),
        "model": final.base.export(),
        "calibration": {"method": "platt", "a": final.a, "b": final.b},
        "evaluation": {
            "crossValidation": results,
            "chosenBy": "lowest mean cross-validated log loss",
            "reliability": reliability(y, oof[chosen]),
            "baselines": baselines,
            "trainingSetMeanPrediction": round(float(p_train.mean()), 4),
        },
        "importances": final.base.importances(),
        "biasCheckByProfileSource": bias,
        "libraries": {"scikit-learn": sklearn.__version__, "numpy": np.__version__},
        "limitations": [
            "Trained only on alumni an admin has already approved or rejected; profiles that differ a lot from these may be scored poorly.",
            "Admin decisions can contain mistakes or bias; the model learns them too.",
            "The score supports human review. It must never verify or reject anyone automatically.",
            "LinkedIn PDFs can be edited before upload; consistency checks reduce but do not remove this risk.",
        ],
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(model_json, indent=1), encoding="utf-8")
    (out_path.parent / "MODEL_CARD.md").write_text(model_card(model_json), encoding="utf-8")
    print(f"Saved {out_path} and MODEL_CARD.md ({'meets minimum data' if meets_minimum else 'EXPERIMENTAL: below minimum data'})")
    return 0


def model_card(m: dict) -> str:
    cv = m["evaluation"]["crossValidation"]
    lines = [
        f"# Alumni verification model {m['version']}",
        "",
        f"- Trained: {m['trainedAt']}  |  Algorithm: **{m['algorithm']}**  |  Feature version: {m['featureVersion']}",
        f"- Labels: {m['trainingCounts']['total']} real admin decisions ({m['trainingCounts']['verified']} verified, {m['trainingCounts']['rejected']} rejected)",
        f"- Meets minimum data ({m['minimums']['total']} total, {m['minimums']['perClass']} per class): **{'yes' if m['meetsMinimumData'] else 'NO: experimental'}**",
        f"- Calibration: Platt scaling (a={m['calibration']['a']:.3f}, b={m['calibration']['b']:.3f})",
        "",
        "## Cross-validated performance (mean ± std over repeats)",
        "",
        "| Model | ROC-AUC | PR-AUC | Brier | Log loss | Accuracy@0.5 |",
        "|---|---|---|---|---|---|",
    ]
    for k, r in cv.items():
        g = lambda key: f"{r[key]['mean']:.3f} ± {r[key]['std']:.3f}" if key in r else "n/a"
        lines.append(f"| {k}{' (chosen)' if k == m['algorithm'] else ''} | {g('roc_auc')} | {g('pr_auc')} | {g('brier')} | {g('log_loss')} | {g('accuracy_at_0_5')} |")
    b = m["evaluation"]["baselines"]
    lines += ["", "## Baselines on the same labels", ""]
    for k, r in b.items():
        auc = f"{r['roc_auc']:.3f}" if "roc_auc" in r else "n/a"
        lines.append(f"- **{k}**: ROC-AUC {auc}, Brier {r['brier']:.3f}" + (f" ({r['note']})" if "note" in r else ""))
    lines += ["", "## Reliability (cross-validated predictions)", "", "| Predicted range | Count | Mean predicted | Fraction verified |", "|---|---|---|---|"]
    for row in m["evaluation"]["reliability"]:
        lines.append(f"| {row['bin']} | {row['count']} | {row['mean_predicted']} | {row['fraction_verified']} |")
    lines += ["", "## Most influential inputs", ""]
    for imp in m["importances"]:
        val = imp.get("importance", imp.get("weight"))
        lines.append(f"- `{imp['feature']}`: {val}")
    lines += ["", "## Bias check by profile source (not a model input)", "", "| Source | n | Verified rate | Mean CV prediction |", "|---|---|---|---|"]
    for s, r in m["biasCheckByProfileSource"].items():
        lines.append(f"| {s} | {r['n']} | {r['verified_rate']} | {r['mean_cv_prediction']} |")
    lines += ["", "## Limitations", ""] + [f"- {x}" for x in m["limitations"]]
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", type=Path, default=DEFAULT_DATA)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--allow-small", action="store_true", help="write an experimental model below the recommended minimum")
    ap.add_argument("--min-total", type=int, default=MIN_TOTAL)
    ap.add_argument("--min-per-class", type=int, default=MIN_PER_CLASS)
    args = ap.parse_args()
    if not args.data.exists():
        print(f"No training data at {args.data}. Run `npm run ml:export` in backend/ first.")
        sys.exit(1)
    sys.exit(train(args.data, args.out, args.allow_small, args.min_total, args.min_per_class))
