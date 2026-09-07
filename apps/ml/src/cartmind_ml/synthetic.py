"""Synthetic-but-realistic training data.

The real seeded database only has 5 users, which is nowhere near enough to
train or evaluate a classifier. Instead we simulate a larger population of
shoppers from latent "intent" (purchase drive) and "friction" (price /
shipping / UX sensitivity) variables, then derive observable behavioral
features and labels from those latents with added noise. This keeps the
features genuinely predictive of the labels (as they are in real behavioral
data) without directly encoding the label into a feature (no leakage).

Feature names mirror `apps/api/src/lib/ml/scoring.ts` (`fetchUserFeatures`)
so `features_live.py` can produce vectors the trained models were fit on.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .config import RANDOM_SEED


def _sigmoid(z: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-z))


def generate_user_dataset(n: int = 5000, seed: int = RANDOM_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    intent = rng.beta(2, 2, n)  # overall purchase drive, 0-1
    friction = rng.beta(2, 2, n)  # price/shipping/UX sensitivity, 0-1

    days_since_signup = rng.uniform(5, 730, n)
    events_30d = rng.poisson(lam=np.clip(8 + 60 * intent, 0.5, None))
    product_views = rng.binomial(events_30d, p=np.clip(0.45 + 0.25 * intent, 0.05, 0.95))
    add_to_cart = rng.binomial(
        product_views, p=np.clip(0.15 + 0.35 * intent - 0.25 * friction, 0.02, 0.9)
    )
    checkouts_started = rng.binomial(
        add_to_cart, p=np.clip(0.30 + 0.35 * intent - 0.35 * friction, 0.02, 0.95)
    )
    payments = rng.binomial(
        checkouts_started, p=np.clip(0.55 + 0.20 * intent - 0.65 * friction, 0.02, 0.97)
    )
    checkout_abandoned = checkouts_started - payments
    wishlist_adds = rng.poisson(lam=np.clip(1 + 3 * intent, 0.2, None))

    historic_orders = rng.poisson(lam=np.clip(intent * 3, 0, None))
    order_count = payments + historic_orders

    avg_order_value = np.clip(rng.normal(70, 25, n), 12, 400)
    lifetime_value = order_count * avg_order_value

    days_since_last_order = np.where(
        order_count > 0,
        np.clip(rng.exponential(scale=np.clip(65 - 45 * intent, 5, None)), 0, 400),
        365.0,
    )

    # Recency/frequency-style churn label, generated directly from the
    # realized aggregate features (as real churn definitions work) rather
    # than the abstract latents — keeps the label recoverable by the model
    # instead of diluted through two independent layers of sampling noise.
    churn_logit = (
        -1.6
        + 0.024 * days_since_last_order
        + np.where(order_count == 0, 1.3, 0.0)
        - 0.22 * order_count
        - 0.02 * events_30d
        + 0.0035 * days_since_signup
        - 0.01 * product_views
        + rng.normal(0, 0.6, n)
    )
    churned = rng.binomial(1, _sigmoid(churn_logit))

    converted = (payments > 0).astype(int)
    abandoned = (checkout_abandoned > 0).astype(int)

    cart_to_view_ratio = add_to_cart / np.clip(product_views, 1, None)
    checkout_to_cart_ratio = checkouts_started / np.clip(add_to_cart, 1, None)

    return pd.DataFrame(
        {
            "order_count": order_count,
            "lifetime_value": lifetime_value,
            "days_since_last_order": days_since_last_order,
            "events_30d": events_30d,
            "product_views": product_views,
            "add_to_cart": add_to_cart,
            "checkouts_started": checkouts_started,
            "payments": payments,
            "checkout_abandoned": checkout_abandoned,
            "wishlist_adds": wishlist_adds,
            "days_since_signup": days_since_signup,
            "cart_to_view_ratio": cart_to_view_ratio,
            "checkout_to_cart_ratio": checkout_to_cart_ratio,
            "churned": churned,
            "converted": converted,
            "abandoned": abandoned,
        }
    )
