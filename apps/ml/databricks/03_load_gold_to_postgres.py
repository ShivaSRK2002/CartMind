"""Step 3 (run locally) — load the Gold user-feature table back into Postgres.

After the Databricks notebook runs, download
`/FileStore/cartmind/out/gold_csv/gold_user_features/part-00000-*.csv` and
point this script at it (a file or the Spark output directory both work):

    python apps/ml/databricks/03_load_gold_to_postgres.py --features path/to/gold_user_features.csv

Upserts into ml_user_features. Then run `npm run ml:score` — score.py picks
up these Databricks-computed features instead of its own live SQL aggregate.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from cartmind_ml.db import execute, execute_many, get_connection  # noqa: E402

FEATURE_COLUMNS = [
    "user_id",
    "name",
    "email",
    "order_count",
    "lifetime_value",
    "days_since_last_order",
    "events_30d",
    "product_views",
    "add_to_cart",
    "checkouts_started",
    "payments",
    "checkout_abandoned",
    "wishlist_adds",
    "days_since_signup",
    "cart_to_view_ratio",
    "checkout_to_cart_ratio",
]


def _resolve_csv(path: Path) -> Path:
    if path.is_dir():
        parts = sorted(path.glob("*.csv"))
        if not parts:
            raise FileNotFoundError(f"No .csv part file under {path}")
        return parts[0]
    return path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--features",
        required=True,
        help="gold_user_features CSV file or the Spark output directory",
    )
    args = parser.parse_args()

    csv_path = _resolve_csv(Path(args.features))
    df = pd.read_csv(csv_path)
    missing = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"CSV is missing expected columns: {missing}")

    df = df[FEATURE_COLUMNS].fillna(
        {"name": "", "email": ""}
    )
    numeric = [c for c in FEATURE_COLUMNS if c not in ("user_id", "name", "email")]
    df[numeric] = df[numeric].fillna(0)

    rows = [tuple(r) for r in df.itertuples(index=False, name=None)]

    with get_connection() as conn:
        execute(conn, "DELETE FROM ml_user_features")
        execute_many(
            conn,
            f"INSERT INTO ml_user_features ({', '.join(FEATURE_COLUMNS)}) VALUES %s",
            rows,
        )

    print(f"Loaded {len(rows)} rows into ml_user_features from {csv_path.name}")
    print("Next: npm run ml:score")


if __name__ == "__main__":
    main()
