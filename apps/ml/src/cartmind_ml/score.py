"""Scores the live Postgres users/products with the trained models and
writes the results into the ml_user_scores / ml_product_similarity /
ml_model_metrics tables that apps/api/src/lib/ml/pythonScores.ts reads."""

from __future__ import annotations

import json

import joblib
import numpy as np

from .config import MODEL_VERSION, MODELS_DIR
from .db import execute, execute_many, get_connection
from .feature_specs import ABANDON_FEATURES, CHURN_FEATURES, CONVERSION_FEATURES, SEGMENTATION_FEATURES
from .features_live import fetch_live_user_features
from .recommend import compute_product_similarity


def _require_models() -> dict:
    required = [
        "churn_model.joblib",
        "abandonment_model.joblib",
        "conversion_model.joblib",
        "segmentation_pipeline.joblib",
        "segmentation_cohort_map.joblib",
        "metrics.json",
    ]
    missing = [name for name in required if not (MODELS_DIR / name).exists()]
    if missing:
        raise FileNotFoundError(
            f"Missing trained model artifacts: {missing}. Run `python -m cartmind_ml.pipeline train` first."
        )

    return {
        "churn": joblib.load(MODELS_DIR / "churn_model.joblib"),
        "abandonment": joblib.load(MODELS_DIR / "abandonment_model.joblib"),
        "conversion": joblib.load(MODELS_DIR / "conversion_model.joblib"),
        "segmentation": joblib.load(MODELS_DIR / "segmentation_pipeline.joblib"),
        "cohort_map": joblib.load(MODELS_DIR / "segmentation_cohort_map.joblib"),
    }


def score_users(conn, models: dict) -> int:
    df = fetch_live_user_features(conn)
    if df.empty:
        return 0

    df["churn_risk"] = models["churn"].predict_proba(df[CHURN_FEATURES])[:, 1] * 100

    abandon_proba = models["abandonment"].predict_proba(df[ABANDON_FEATURES])[:, 1] * 100
    # Abandonment is only meaningful once a checkout was actually started.
    df["cart_abandonment_risk"] = np.where(df["checkouts_started"].to_numpy() > 0, abandon_proba, 0.0)

    df["conversion_propensity"] = models["conversion"].predict_proba(df[CONVERSION_FEATURES])[:, 1] * 100

    cluster_labels = models["segmentation"].predict(df[SEGMENTATION_FEATURES])
    df["cohort"] = [models["cohort_map"][c] for c in cluster_labels]

    rows = [
        (
            row.user_id,
            round(float(row.churn_risk), 1),
            round(float(row.cart_abandonment_risk), 1),
            round(float(row.conversion_propensity), 1),
            row.cohort,
            MODEL_VERSION,
        )
        for row in df.itertuples()
    ]

    execute(conn, "DELETE FROM ml_user_scores")
    execute_many(
        conn,
        """
        INSERT INTO ml_user_scores
          (user_id, churn_risk, cart_abandonment_risk, conversion_propensity, cohort, model_version)
        VALUES %s
        """,
        rows,
    )
    return len(rows)


def score_product_similarity(conn) -> int:
    similarity_df = compute_product_similarity(conn)
    execute(conn, "DELETE FROM ml_product_similarity")
    if similarity_df.empty:
        return 0

    rows = [
        (row.product_id, row.similar_product_id, float(row.similarity), MODEL_VERSION)
        for row in similarity_df.itertuples()
    ]
    execute_many(
        conn,
        """
        INSERT INTO ml_product_similarity (product_id, similar_product_id, similarity, model_version)
        VALUES %s
        """,
        rows,
    )
    return len(rows)


def write_model_metrics(conn) -> None:
    with open(MODELS_DIR / "metrics.json") as f:
        metrics = json.load(f)

    execute(conn, "DELETE FROM ml_model_metrics")
    rows = [
        ("churn", metrics["churn"]["algorithm"], json.dumps(metrics["churn"])),
        ("cart_abandonment", metrics["cart_abandonment"]["algorithm"], json.dumps(metrics["cart_abandonment"])),
        ("conversion", metrics["conversion"]["algorithm"], json.dumps(metrics["conversion"])),
        ("segmentation", metrics["segmentation"]["algorithm"], json.dumps(metrics["segmentation"])),
    ]
    execute_many(
        conn,
        "INSERT INTO ml_model_metrics (model_name, algorithm, metrics) VALUES %s",
        rows,
    )


def main() -> None:
    models = _require_models()
    with get_connection() as conn:
        user_count = score_users(conn, models)
        similarity_count = score_product_similarity(conn)
        write_model_metrics(conn)

    print(f"Scored {user_count} users, {similarity_count} product-similarity pairs.")


if __name__ == "__main__":
    main()
