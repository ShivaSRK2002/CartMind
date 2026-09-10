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
   `VOLUME_BASE` near the bottom. Click **Run all** (running a single cell on
   its own fails — the later cells need the functions defined by the earlier
   ones).
6. It writes tables `workspace.default.gold_user_features` etc. (browse them
   under *Catalog*) and, if the Volume is writable, CSVs to
   `/Volumes/workspace/default/cartmind/out/`. The last cell displays
   `gold_user_features`.
7. Get the CSV out either way:
   - **From the table grid:** on the `gold_user_features` output of the last
     cell, click the download ⤓ icon → *Download full results* → CSV.
   - **Or from the Volume:** **Catalog** → `cartmind` → `out/` →
     `gold_user_features.csv` → download.

### 3. Load Gold back into Postgres (local)

```bash
npm run ml:load-gold -- --features ~/Downloads/gold_user_features.csv
# or, from a local dry-run:
npm run ml:load-gold -- --features apps/ml/databricks/data/out/gold_csv/gold_user_features.csv
npm run ml:score
```

`score.py` then prints `feature source: databricks gold` and scores users
from the Databricks-computed features. If `ml_user_features` is empty it
silently falls back to the live SQL aggregate, so nothing breaks without this
pipeline.

## Dashboard (Databricks AI/BI)

The visualization layer runs natively in Databricks — no Power BI Desktop
needed. Queries are in [`dashboard_queries.sql`](dashboard_queries.sql).

1. **Dashboards** (left sidebar) → **Create dashboard** → name it `CartMind AI`.
2. **Data** tab → **Create from SQL** → paste the first block from
   `dashboard_queries.sql`, name the dataset exactly as its comment says
   (`kpis`), **Run**, **Save**. Repeat for all 8 datasets. (A serverless SQL
   warehouse starts automatically on first run.)
3. **Canvas** tab → **Add a visualization** for each widget below → pick the
   dataset → set the type and fields:

   | Widget | Dataset | Type | Fields |
   |--------|---------|------|--------|
   | Total revenue / Orders / AOV | `kpis` | 3× Counter | one measure each |
   | Conversion % / Cart-abandon % | `rates` | 2× Counter | one measure each |
   | Revenue & orders over time | `revenue_trend` | Line | X `day`, Y `revenue`, `orders` |
   | Conversion funnel | `conversion_funnel` | Bar (horizontal) | X `events`, Y `stage` |
   | Event mix by day | `events_over_time` | Area (stacked) | X `day`, Y `event_count`, color `event_type` |
   | Customers by segment | `segments` | Pie | angle `customers`, color `segment` |
   | Avg LTV by segment | `segments` | Bar | X `segment`, Y `avg_ltv` |
   | Customer detail | `customers` | Table | all columns |
   | Top products by engagement | `top_products` | Bar | X `engagement_score`, Y `product_id` |

4. **Publish** (top-right) → share / screenshot for the README.

Mirrors the use-case doc's dashboard modules — revenue trends, conversion
funnels, event analytics, segmentation — the part the doc assigns to Power
BI. Churn/purchase-intent scores stay in Orbit (backed by the trained
models in `apps/ml`).

## Files

| File | Runs on | Purpose |
|------|---------|---------|
| `01_export_from_postgres.py` | local | Postgres → parquet + zip |
| `02_medallion_pipeline.py` | Databricks (serverless) **or** local `pyspark` | Bronze → Silver → Gold |
| `03_load_gold_to_postgres.py` | local | `gold_user_features.csv` → `ml_user_features` |
| `dashboard_queries.sql` | Databricks SQL | 8 datasets for the AI/BI dashboard |
