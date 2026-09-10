# CartMind AI — Databricks pipeline

The `PostgreSQL → Databricks Data Pipeline` stage of the use-case
architecture, built for **Databricks Community Edition**. A medallion
(Bronze → Silver → Gold) PySpark job turns the raw behavioral tables into
the feature and analytics tables the Python ML engine and Power BI consume.

```
Postgres ──(01 export)──> parquet ──upload──> Databricks CE
                                                   │  02 medallion notebook
                                                   ▼
                                          Bronze → Silver → Gold (Delta)
                                                   │  gold_csv/*
                                          download ▼
Postgres  <──(03 load)── gold_user_features.csv
   │
   └─ npm run ml:score  →  ml_user_scores / ml_product_similarity / ml_model_metrics
```

## Why file-based

Community Edition clusters run in Databricks' cloud and **cannot reach a
database on your machine**, and CE has no Jobs scheduler or external-storage
mounts. So the pipeline round-trips through files: export locally, upload,
run, download, load. On a paid workspace you'd instead read/write Postgres
directly over JDBC and schedule `02_medallion_pipeline.py` as a Job — the
transform code is identical.

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
python apps/ml/databricks/01_export_from_postgres.py
```

Produces `apps/ml/databricks/data/raw/*.parquet` and `data/cartmind_raw.zip`.

Optionally dry-run the whole transform locally first — the local run uses a
pandas writer (no `winutils.exe` needed on Windows) and drops one CSV per
Gold table under `data/out/gold_csv/`:

```bash
python apps/ml/databricks/02_medallion_pipeline.py \
  --input apps/ml/databricks/data --output apps/ml/databricks/data/out
```

### 2. Databricks Community Edition

1. Sign up / log in at <https://community.cloud.databricks.com>.
2. **Compute ▸ Create Cluster** (defaults are fine — single node, latest LTS runtime). Wait for it to start.
3. **Catalog ▸ (DBFS) ▸ Upload** — or the *Data* page — put the five `.parquet` files under `dbfs:/FileStore/cartmind/raw/`.
4. **Workspace ▸ Import ▸ File** — import `02_medallion_pipeline.py` (it imports as a notebook).
5. Attach the notebook to the cluster, confirm `DBFS_INPUT` / `DBFS_OUTPUT` near the bottom, **Run All**.
6. The last cell displays `gold_user_features`. Download the CSV from
   `dbfs:/FileStore/cartmind/out/gold_csv/gold_user_features/` — its part
   file is served at
   `https://community.cloud.databricks.com/files/cartmind/out/gold_csv/gold_user_features/part-00000-....csv`.

### 3. Load Gold back into Postgres (local)

```bash
# from Databricks CE download:
python apps/ml/databricks/03_load_gold_to_postgres.py --features ~/Downloads/part-00000-xxxx.csv
# or from a local dry-run:
python apps/ml/databricks/03_load_gold_to_postgres.py --features apps/ml/databricks/data/out/gold_csv/gold_user_features.csv
npm run ml:score
```

`score.py` now prints `feature source: databricks gold` and scores users
from the Databricks-computed features. If `ml_user_features` is empty it
silently falls back to the live SQL aggregate, so nothing breaks without this
pipeline.

## Files

| File | Runs on | Purpose |
|------|---------|---------|
| `01_export_from_postgres.py` | local | Postgres → parquet + zip |
| `02_medallion_pipeline.py` | Databricks **or** local `pyspark` | Bronze → Silver → Gold |
| `03_load_gold_to_postgres.py` | local | `gold_user_features.csv` → `ml_user_features` |
