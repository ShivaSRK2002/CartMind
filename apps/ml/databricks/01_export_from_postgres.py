"""Step 1 (run locally) — dump the raw tables Databricks needs.

Databricks Community Edition cannot reach a database on your laptop, so the
pipeline is file-based: export here, upload the files to CE, run the
notebook, download the Gold output, load it back (step 3).

    python apps/ml/databricks/01_export_from_postgres.py

Writes Parquet files to apps/ml/databricks/data/raw/ and bundles them into
apps/ml/databricks/data/cartmind_raw.zip for a single upload to CE
(Data > Add > Upload File, or Workspace > FileStore).
"""

from __future__ import annotations

import sys
import zipfile
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from cartmind_ml.db import get_connection  # noqa: E402

OUT_DIR = Path(__file__).resolve().parent / "data" / "raw"

# Only the columns the medallion pipeline actually consumes.
EXPORTS = {
    "users": "SELECT id, name, email, role, created_at FROM users",
    "products": "SELECT id, name, category, price, created_at FROM products",
    "orders": "SELECT id, user_id, status, total_amount, created_at FROM orders",
    "order_items": "SELECT id, order_id, product_id, quantity, unit_price FROM order_items",
    "events": (
        "SELECT id, event_type::text AS event_type, user_id, session_id, "
        "payload::text AS payload, occurred_at FROM events"
    ),
}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    with get_connection() as conn:
        for table, query in EXPORTS.items():
            df = pd.read_sql(query, conn)
            path = OUT_DIR / f"{table}.parquet"
            df.to_parquet(path, index=False)
            written.append(path)
            print(f"  {table:<12} {len(df):>6} rows -> {path.name}")

    bundle = OUT_DIR.parent / "cartmind_raw.zip"
    with zipfile.ZipFile(bundle, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in written:
            zf.write(path, arcname=f"raw/{path.name}")
    print(f"\nBundled -> {bundle}")
    print("Upload that zip (or the individual .parquet files) to Databricks CE.")


if __name__ == "__main__":
    main()
