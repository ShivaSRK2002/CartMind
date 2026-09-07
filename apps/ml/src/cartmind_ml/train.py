"""Trains the four models the use-case doc calls for, on synthetic data,
and records real evaluation metrics.

  Churn              -> LogisticRegression vs RandomForestClassifier (best AUC wins)
  Cart abandonment   -> XGBClassifier
  Conversion         -> XGBClassifier
  Segmentation       -> KMeans(n_clusters=4), cluster->cohort mapped by centroid stats
"""

from __future__ import annotations

import json

import joblib
import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from .config import MODEL_VERSION, MODELS_DIR, RANDOM_SEED
from .feature_specs import (
    ABANDON_FEATURES,
    CHURN_FEATURES,
    CONVERSION_FEATURES,
    COHORTS,
    SEGMENTATION_FEATURES,
)
from .synthetic import generate_user_dataset


def _eval_binary(y_true, y_pred, y_proba) -> dict:
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, y_proba)), 4),
    }


def train_churn(df) -> dict:
    X = df[CHURN_FEATURES]
    y = df["churned"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=RANDOM_SEED, stratify=y
    )

    candidates = {
        "Logistic Regression": Pipeline(
            [("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, max_depth=6, random_state=RANDOM_SEED
        ),
    }

    best_name, best_model, best_auc, best_metrics = None, None, -1.0, None
    for name, model in candidates.items():
        model.fit(X_train, y_train)
        proba = model.predict_proba(X_test)[:, 1]
        pred = model.predict(X_test)
        metrics = _eval_binary(y_test, pred, proba)
        if metrics["roc_auc"] > best_auc:
            best_name, best_model, best_auc, best_metrics = name, model, metrics["roc_auc"], metrics

    best_model.fit(X, y)  # refit winner on full dataset
    joblib.dump(best_model, MODELS_DIR / "churn_model.joblib")
    return {"algorithm": best_name, "features": CHURN_FEATURES, **best_metrics}


def train_xgb_classifier(df, features: list[str], label: str, row_filter=None) -> tuple[dict, object]:
    data = df if row_filter is None else df[row_filter(df)]
    X = data[features]
    y = data[label]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=RANDOM_SEED, stratify=y
    )

    model = XGBClassifier(
        n_estimators=200,
        max_depth=3,
        learning_rate=0.1,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="logloss",
        random_state=RANDOM_SEED,
    )
    model.fit(X_train, y_train)
    proba = model.predict_proba(X_test)[:, 1]
    pred = model.predict(X_test)
    metrics = _eval_binary(y_test, pred, proba)

    model.fit(X, y)  # refit on full dataset
    return {"algorithm": "XGBoost (Gradient Boosting)", "features": features, **metrics}, model


def train_segmentation(df) -> dict:
    X = df[SEGMENTATION_FEATURES]
    pipeline = Pipeline([("scaler", StandardScaler()), ("kmeans", KMeans(n_clusters=4, n_init=10, random_state=RANDOM_SEED))])
    labels = pipeline.fit_predict(X)

    cluster_means = X.groupby(labels).mean()
    # Rank clusters on each axis to map them to business cohorts:
    #  - high-value: highest lifetime_value & order_count
    #  - at-risk: elevated churn-correlated signal (low payments relative to events) but has ordered before
    #  - browser: high product_views, low payments
    #  - impulse: whatever remains (moderate everything, quick converters)
    remaining = set(cluster_means.index)
    cohort_map: dict[int, str] = {}

    high_value_cluster = cluster_means["lifetime_value"].idxmax()
    cohort_map[high_value_cluster] = "high-value"
    remaining.discard(high_value_cluster)

    browser_cluster = cluster_means.loc[list(remaining)]["product_views"].idxmax()
    cohort_map[browser_cluster] = "browser"
    remaining.discard(browser_cluster)

    engagement = cluster_means.loc[list(remaining)]["payments"] / cluster_means.loc[list(remaining)]["events_30d"].clip(lower=1)
    at_risk_cluster = engagement.idxmin()
    cohort_map[at_risk_cluster] = "at-risk"
    remaining.discard(at_risk_cluster)

    impulse_cluster = next(iter(remaining))
    cohort_map[impulse_cluster] = "impulse"

    joblib.dump(pipeline, MODELS_DIR / "segmentation_pipeline.joblib")
    joblib.dump(cohort_map, MODELS_DIR / "segmentation_cohort_map.joblib")

    return {
        "algorithm": "K-Means Clustering (k=4)",
        "features": SEGMENTATION_FEATURES,
        "cluster_sizes": {cohort_map[c]: int((labels == c).sum()) for c in cluster_means.index},
    }


def main() -> None:
    df = generate_user_dataset()

    churn_metrics = train_churn(df)

    abandon_metrics, abandon_model = train_xgb_classifier(
        df, ABANDON_FEATURES, "abandoned", row_filter=lambda d: d["checkouts_started"] > 0
    )
    joblib.dump(abandon_model, MODELS_DIR / "abandonment_model.joblib")

    conversion_metrics, conversion_model = train_xgb_classifier(df, CONVERSION_FEATURES, "converted")
    joblib.dump(conversion_model, MODELS_DIR / "conversion_model.joblib")

    segmentation_metrics = train_segmentation(df)

    metrics = {
        "model_version": MODEL_VERSION,
        "trained_on": "synthetic (n=%d)" % len(df),
        "churn": churn_metrics,
        "cart_abandonment": abandon_metrics,
        "conversion": conversion_metrics,
        "segmentation": segmentation_metrics,
    }

    with open(MODELS_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
