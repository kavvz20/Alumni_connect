# ML-based alumni verification

This folder trains the model that gives each alumni profile a **confidence score**: the estimated
probability that an admin, after reviewing the evidence, would verify the person as a genuine
alumnus of Thapar Institute of Engineering & Technology (TIET).

The score **supports** the admin's decision. It never verifies or rejects anyone on its own.

## 1. The problem: no labelled data at the start

There was no official alumni database and no labelled dataset. So the system:

1. **Collects genuine profiles voluntarily.** Alumni sign up (Google or email/password), or the
   admin adds them from institutional records (form or CSV). Each alumnus uploads their own
   LinkedIn profile PDF (LinkedIn → More → Save to PDF). LinkedIn pages are not scraped; that is
   not permitted by LinkedIn's terms.
2. **Uses a transparent rule-based evidence score until there is data.** The score is the share of
   weighted checks that match (institute in education, degree, graduation year, course duration,
   department, name, PDF-vs-URL, institutional email, duplicate accounts). The UI always labels it
   *"Rule-based evidence score (not machine learning)"*.
3. **Turns every admin decision into a label.** When an admin approves (1) or rejects (0) a profile in
   the verification dashboard, the backend stores the profile's feature vector *as it was at that
   moment* in the `VerificationDecision` collection. Admins are expected to check real evidence
   (degree certificate, convocation list, college email, institution records) before deciding.
4. **Trains the ML model only when enough real labels exist** (default ≥ 100 decisions with ≥ 20 of
   each class). No synthetic, fabricated or "augmented" training rows are used.

## 2. Pipeline

```
LinkedIn PDF ─▶ existing parser (server) ─▶ evidence ─┐
Admin record (form / CSV) ─────────────────────────────┼─▶ feature extraction ─▶ rule score  (until trained)
Self-reported profile ─────────────────────────────────┘          │           └▶ ML model    (after training)
                                                                  ▼
                                     admin decision ─▶ VerificationDecision (label + features)
                                                                  │
                         npm run ml:export ─▶ ml/data/verification_labels.json ─▶ train.py
                                                                  │
                         backend/ml-models/verification-model.json + MODEL_CARD.md ─▶ Node backend
```

Feature extraction lives in `backend/src/services/verification.service.js` (one implementation,
used for both training and prediction). Examples: `evidence_institution_match`, `degree_recognised`,
`grad_year_plausible`, `duration_diff`, `profile_batch_matches_evidence`, `admin_batch_matches_evidence`,
`name_similarity_evidence`, `linkedin_url_matches_evidence`, `institutional_email`,
`possible_duplicate`, `completeness`.

**Missing information** (e.g. no PDF, no education section) is kept as missing (`null`). During
training each feature is median-imputed *and* gets a `<feature>__missing` indicator, so the model
learns from the absence of evidence instead of from a guessed value.

`profileSource` (admin-created vs self-registered) is **not** a model input; otherwise the model
would just learn "admin-created ⇒ genuine". It is reported only in the bias check.

## 3. Models, calibration, evaluation

- **Candidates:** Logistic Regression (standardised features) and Random Forest (100 shallow trees,
  `max_depth=5`, `min_samples_leaf=3`). Both use `class_weight="balanced"`.
- **Calibration:** Platt scaling fitted on inner out-of-fold predictions, so a score of 0.8 means
  "about 80% of similar profiles were verified by admins".
- **Evaluation:** repeated stratified k-fold cross-validation. Calibration is refitted inside every
  training fold, so nothing leaks from the test fold. Reported metrics: ROC-AUC, PR-AUC, Brier score,
  log loss, accuracy, a reliability table, and two baselines on the same labels: always predicting
  the base rate, and the rule-based score.
- **Selection:** lowest cross-validated log loss (ties → Logistic Regression, the simpler model).
- **Deployment:** the chosen model is exported as plain JSON (trees, or coefficients, plus preprocessing
  and calibration) and evaluated by the Node backend. A test checks that Node and scikit-learn give
  the same probabilities.

## 4. How the score is shown

- **Admin dashboard:**
  - each request shows the score with its method ("Rule-based" or "ML vN")
  - every check (match / mismatch / missing) is listed with the values compared
  - the active method, model metrics and the number of labels collected so far are shown
- **Alumnus profile:** the same score and checks, minus admin-only details (institution record values,
  other accounts), plus the disclaimer that a high score does not prove alumni status.
- **Status rules:**
  - a hard mismatch moves *Pending* to *Needs manual review*
  - only an admin can set *Verified* or *Rejected*

## 5. Running it

```bash
# one-time setup (isolated from the system Python)
cd ml
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt     # macOS/Linux: .venv/bin/python

# whenever enough decisions have been made
cd ../backend && npm run ml:export
cd ../ml && .venv/Scripts/python train.py
# then click "Recompute all scores" in the admin dashboard (or restart the backend)
```

`train.py` refuses to train below the minimum. `--allow-small` writes an *experimental* model for
classroom demonstration; the backend ignores it unless `ML_ALLOW_SMALL_MODEL=true` is set.

Tests: `.venv/Scripts/python -m unittest discover -s tests -v`. They use small synthetic fixtures only
to check the code (refusal rules, export format, Node/Python parity), never to train the real model.

## 6. Limitations

- The model can only be as good and as unbiased as the admin decisions it learns from.
- Only alumni who chose to register are represented; early on these are not a random sample.
- LinkedIn PDFs can be edited before upload. Cross-checks against the admin's institutional record and
  the LinkedIn URL reduce this risk but do not remove it.
- With small datasets the metrics have wide uncertainty; the model card reports their spread across
  CV repeats.
- Whenever the features change (`FEATURE_VERSION`), old decisions must be relabelled or the model
  retrained; the backend refuses to use a model trained on a different feature version.
