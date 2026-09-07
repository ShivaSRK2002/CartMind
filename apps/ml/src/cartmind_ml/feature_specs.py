"""Shared feature column lists so train.py, score.py, and features_live.py
stay in lock-step on what each model expects, in what order."""

CHURN_FEATURES = [
    "order_count",
    "days_since_last_order",
    "events_30d",
    "days_since_signup",
    "product_views",
]

ABANDON_FEATURES = [
    "cart_to_view_ratio",
    "checkout_to_cart_ratio",
    "checkouts_started",
    "add_to_cart",
    "events_30d",
]

CONVERSION_FEATURES = [
    "cart_to_view_ratio",
    "checkout_to_cart_ratio",
    "wishlist_adds",
    "events_30d",
    "days_since_signup",
]

SEGMENTATION_FEATURES = [
    "order_count",
    "lifetime_value",
    "events_30d",
    "product_views",
    "payments",
]

COHORTS = ["high-value", "at-risk", "impulse", "browser"]
