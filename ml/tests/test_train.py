"""
Tests for ml/train.py.

The datasets below are SYNTHETIC TEST FIXTURES used only to check that the code works
(refusal rules, export format, calibration, and Node/Python prediction parity). They are written
to a temporary folder and are never used to train the model the application uses.

    cd ml && .venv/Scripts/python -m unittest discover -s tests -v
"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np

ML_DIR = Path(__file__).resolve().parents[1]
BACKEND = ML_DIR.parent / "backend"
sys.path.insert(0, str(ML_DIR))

import train  # noqa: E402

FEATURES = ["completeness", "evidence_institution_match", "grad_year_plausible", "has_evidence", "name_similarity_evidence"]


def fixture(n_pos, n_neg, seed=0, missing_rate=0.2):
    """Synthetic rows: 'verified' rows tend to have evidence that matches; some values are missing."""
    rng = np.random.default_rng(seed)
    rows = []
    for label, count in ((1, n_pos), (0, n_neg)):
        for _ in range(count):
            f = {
                "has_evidence": int(rng.random() < (0.9 if label else 0.5)),
                "evidence_institution_match": int(rng.random() < (0.9 if label else 0.3)),
                "grad_year_plausible": int(rng.random() < (0.95 if label else 0.6)),
                "name_similarity_evidence": round(float(np.clip(rng.normal(0.85 if label else 0.5, 0.15), 0, 1)), 2),
                "completeness": round(float(rng.uniform(0.4, 1.0)), 2),
            }
            for k in ("evidence_institution_match", "name_similarity_evidence"):
                if rng.random() < missing_rate:
                    f[k] = None
            rows.append({"id": f"t{len(rows)}", "label": label, "features": f, "ruleScoreAtDecision": None, "profileSource": "self_registered"})
    return {"featureVersion": 1, "featureNames": FEATURES, "rows": rows}


class TrainTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.data = self.tmp / "labels.json"
        self.out = self.tmp / "verification-model.json"

    def write(self, payload):
        self.data.write_text(json.dumps(payload), encoding="utf-8")

    def test_refuses_without_enough_real_labels(self):
        self.write(fixture(30, 4))
        self.assertEqual(train.train(self.data, self.out, allow_small=True), 2)
        self.assertFalse(self.out.exists())

    def test_refuses_below_recommended_minimum_unless_allowed(self):
        self.write(fixture(30, 15))
        self.assertEqual(train.train(self.data, self.out), 2)
        self.assertFalse(self.out.exists())

        self.assertEqual(train.train(self.data, self.out, allow_small=True), 0)
        model = json.loads(self.out.read_text())
        self.assertFalse(model["meetsMinimumData"])  # backend ignores it by default

    def test_full_training_exports_model_card_and_metrics(self):
        self.write(fixture(90, 40))
        self.assertEqual(train.train(self.data, self.out), 0)
        m = json.loads(self.out.read_text())
        self.assertTrue(m["meetsMinimumData"])
        self.assertIn(m["algorithm"], ("logistic_regression", "random_forest"))
        self.assertEqual(set(m["evaluation"]["crossValidation"]), {"logistic_regression", "random_forest"})
        self.assertIn("roc_auc", m["evaluation"]["crossValidation"][m["algorithm"]])
        self.assertIn("always_base_rate", m["evaluation"]["baselines"])
        self.assertIn("evidence_institution_match", m["preprocessing"]["missingIndicators"])
        self.assertTrue((self.out.parent / "MODEL_CARD.md").exists())

    def test_node_backend_reproduces_python_probabilities(self):
        payload = fixture(90, 40, seed=3)
        self.write(payload)
        _, names, X, y, _, _ = train.load_dataset(self.data)
        for kind in ("random_forest", "logistic_regression"):
            with self.subTest(kind=kind):
                model = train.CalibratedModel(kind, names).fit(X, y)
                expected = model.predict_proba(X)
                exported = {
                    "format": "alumni-verification-model",
                    "formatVersion": 1,
                    "version": "test",
                    "algorithm": kind,
                    "featureVersion": 1,
                    "meetsMinimumData": True,
                    "preprocessing": model.base.pre.to_json(),
                    "model": model.base.export(),
                    "calibration": {"method": "platt", "a": model.a, "b": model.b},
                }
                model_path = self.tmp / f"{kind}.json"
                rows_path = self.tmp / "rows.json"
                model_path.write_text(json.dumps(exported))
                rows_path.write_text(json.dumps([r["features"] for r in payload["rows"]]))
                script = (
                    "import fs from 'node:fs';"
                    "import { buildPredictor } from './src/services/ml-model.service.js';"
                    f"const p = buildPredictor(JSON.parse(fs.readFileSync({json.dumps(str(model_path))}, 'utf8')));"
                    f"const rows = JSON.parse(fs.readFileSync({json.dumps(str(rows_path))}, 'utf8'));"
                    "console.log(JSON.stringify(rows.map((r) => p.predict(r))));"
                )
                res = subprocess.run(["node", "--input-type=module", "-e", script], cwd=BACKEND, capture_output=True, text=True, check=True)
                got = np.array(json.loads(res.stdout))
                np.testing.assert_allclose(got, expected, atol=2e-4)  # Node rounds to 4 decimals


if __name__ == "__main__":
    unittest.main()
