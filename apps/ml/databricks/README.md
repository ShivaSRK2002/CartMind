# CartMind AI — Databricks pipeline

The `PostgreSQL → Databricks Data Pipeline` stage of the use-case
architecture, built for **Databricks Free Edition** (serverless — no cluster
to create). A medallion (Bronze → Silver → Gold) PySpark job turns the raw
behavioral tables into the feature and analytics tables the Python ML engine
and Power BI consume.

```
Postgres ──(01 export)──> parquet ──upload──> Databricks Free Edition
                                                   │  02 medallion notebook (serverless)
                                                   ▼
                                    Bronze → Silver → Gold  (workspace.default.gold_*)
                                                   │  /Volumes/.../out/*.csv
                                          download ▼
Postgres  <──(03 load)── gold_user_features.csv
   │
   └─ npm run ml:score  →  ml_user_scores / ml_product_similarity / ml_model_metrics
```

## Why file-based

Free Edition runs in Databricks' cloud and **cannot reach a database on your
machine**, and it has no Jobs-over-JDBC or cross-account networking. So the
pipeline round-trips through files: export locally, upload to a Volume, run,
download, load. On a paid workspace you'd instead read/write Postgres
directly over JDBC and schedule `02_medallion_pipeline.py` as a Job — the
transform code (`build_silver` / `build_gold`) is identical.

## Gold tables produced

| Table | Feeds | Contents |
|-------|-------|----------|
| `gold_user_features` | Python ML engine (`score.py`) | Per-customer behavioral aggregates + engineered ratios — same schema as `features_live.py` |
| `gold_revenue_daily` | Power BI | Daily revenue, orders, AOV |
| `gold_event_funnel` | Power BI | Event counts by type per day |
| `gold_product_interactions` | Recommendation engine | Weighted user↔product interaction matrix (view 1 / cart 3 / purchase 5) |

## Run it

### 0. One-time local setup (for testing before upload)

```bash
cd apps/ml
.venv\Scripts\activate
pip install -r databricks/requirements.txt      # pyspark, local only
```

### 1. Export raw tables (local)

```bash
npm run ml:export        # = python apps/ml/databricks/01_export_from_postgres.py
```

Produces `apps/ml/databricks/data/raw/*.parquet` and `data/cartmind_raw.zip`.

Optionally dry-run the whole transform locally first — the local run uses a
pandas writer (no `winutils.exe` needed on Windows) and drops one CSV per
Gold table under `data/out/gold_csv/`:

```bash
npm run ml:medallion
```

### 2. Databricks Free Edition

You're on serverless — **there is no cluster to create**. "Default
Interactive Compute" in *Compute* is what the notebook uses.

1. Log in at <https://free.databricks.com> (the workspace whose sidebar has
   *Catalog*, *Jobs & Pipelines*, *Compute*).
2. **Catalog** → expand the `workspace` catalog → `default` schema →
   **Create ▸ Volume**, name it `cartmind`. That is
   `/Volumes/workspace/default/cartmind/`.
3. Open the `cartmind` volume → **Upload to this volume** → create a folder
   `raw` and drop in the five `.parquet` files from step 1.
4. **Workspace** → **Import** → *File* → pick `02_medallion_pipeline.py`
   (imports as a notebook).
5. Open it, top-left **Connect** → *Default Interactive Compute*. If you used
   a different catalog/schema/volume, edit `DATABRICKS_SCHEMA` /
   `VOLUME_BASE` near the bottom. **Run all**.
6. It writes tables `workspace.default.gold_user_features` etc. (browse them
   under *Catalog*) and CSVs to `/Volumes/workspace/default/cartmind/out/`.
   The last cell displays `gold_user_features`.
7. **Catalog** → `cartmind` volume → `out/` → download `gold_user_features.csv`.

### 3. Load Gold back into Postgres (local)

```bash
python apps/ml/databricks/03_load_gold_to_postgres.py --features ~/Downloads/gold_user_features.csv
# or, from a local dry-run:
python apps/ml/databricks/03_load_gold_to_postgres.py --features apps/ml/databricks/data/out/gold_csv/gold_user_features.csv
npm run ml:score
```

`score.py` then prints `feature source: databricks gold` and scores users
from the Databricks-computed features. If `ml_user_features` is empty it
silently falls back to the live SQL aggregate, so nothing breaks without this
pipeline.

## Files

| File | Runs on | Purpose |
|------|---------|---------|
| `01_export_from_postgres.py` | local | Postgres → parquet + zip |
| `02_medallion_pipeline.py` | Databricks (serverless) **or** local `pyspark` | Bronze → Silver → Gold |
| `03_load_gold_to_postgres.py` | local | `gold_user_features.csv` → `ml_user_features` |
