# CartMind ML

Real Python/scikit-learn training pipeline behind Orbit's AI Prediction Engine — the
piece of the [use-case doc](../../docs) that the TypeScript heuristics in
`apps/api/src/lib/ml/{predict,scoring,kmeans}.ts` approximate. This package trains
actual models, evaluates them, and scores the live Velora database.

| Use-case doc module | Algorithm here |
|---|---|
| Churn Prediction | `LogisticRegression` vs `RandomForestClassifier` (best AUC-ROC wins) |
| Conversion / Cart-Abandonment Prediction | `XGBClassifier` (gradient boosting) |
| Behavioral Segmentation | `KMeans(k=4)`, mapped to `high-value \| at-risk \| impulse \| browser` |
| Recommendation Engine | Item-item collaborative filtering (cosine similarity) |

## Why synthetic training data

The seeded Velora database has only 5 users — nowhere near enough to fit or evaluate a
classifier. `synthetic.py` simulates a larger shopper population from latent "intent"
and "friction" variables, derives observable behavioral features (same column names
`features_live.py` produces from Postgres) and labels from those latents with noise, so
the models learn genuine signal without leaking the label into a feature. Training
happens on synthetic data; **scoring runs against the real live database**.

## Setup

```bash
cd apps/ml
python -m venv .venv
.venv\Scripts\activate        # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
copy .env.example .env        # set DATABASE_URL if different from the default
```

## Run

From the repo root (after `npm run db:migrate` has applied `0006_ml_pipeline.sql`):

```bash
npm run ml:train      # train on synthetic data, write models/*.joblib + models/metrics.json
npm run ml:score      # score the live DB, write ml_user_scores / ml_product_similarity / ml_model_metrics
npm run ml:pipeline   # both, in order
```

The `npm run ml:*` scripts auto-detect `apps/ml/.venv` (via `scripts/py.mjs`),
so you don't need to activate it first. Or run directly with the venv active:
`python apps/ml/pipeline.py train|score|all`.

## Output

- `models/*.joblib` — trained model artifacts (gitignored).
- `models/metrics.json` — real precision/recall/AUC-ROC per model.
- Postgres tables `ml_user_scores`, `ml_product_similarity`, `ml_model_metrics` — read by
  `apps/api/src/lib/ml/pythonScores.ts`. The API prefers these when populated and falls
  back to the TS heuristics in `apps/api/src/lib/ml/scoring.ts` otherwise, so Orbit works
  without a Python setup and gets real scores once this pipeline has been run.

## Databricks stage

`databricks/` holds the Bronze → Silver → Gold PySpark pipeline (the
`PostgreSQL → Databricks` stage of the use-case architecture), built for
Databricks Community Edition. When its Gold `gold_user_features` table is
loaded into `ml_user_features`, `score.py` scores from those features
instead of its own live SQL aggregate. See **[databricks/README.md](databricks/README.md)**.
