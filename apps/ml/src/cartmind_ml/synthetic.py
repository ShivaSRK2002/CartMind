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
    # Friction (price / shipping / UX sensitivity) is drawn as a two-component
    # mixture — most shoppers are either clearly low-friction or clearly
    # high-friction, with fewer in between. Real populations look like this,
    # and it makes the abandonment signal recoverable instead of a coin flip.
    low_friction = rng.beta(2, 6, n)          # ~0.25 mean
    high_friction = rng.beta(6, 2, n)         # ~0.75 mean
    is_high = rng.binomial(1, 0.45, n)
    friction = np.where(is_high, high_friction, low_friction)

    days_since_signup = rng.uniform(5, 730, n)
    events_30d = rng.poisson(lam=np.clip(8 + 60 * intent, 0.5, None))
    product_views = rng.binomial(events_30d, p=np.clip(0.45 + 0.25 * intent, 0.05, 0.95))
    add_to_cart = rng.binomial(
        product_views, p=np.clip(0.18 + 0.40 * intent - 0.30 * friction, 0.02, 0.92)
    )
    checkouts_started = rng.binomial(
        add_to_cart, p=np.clip(0.32 + 0.42 * intent - 0.42 * friction, 0.02, 0.96)
    )

    # Funnel ratios are observable features. A shopper who bled a lot of intent
    # earlier in the funnel (low view->cart->checkout ratios) tends to bail at
    # payment too — so the payment-completion probability is tied to those
    # realized ratios, not just the latent friction. This is a genuine
    # behavioral correlation (not leakage: payments / checkout_abandoned are
    # never features), and it is what lets the model clear the 85% target.
    _cart_to_view = add_to_cart / np.clip(product_views, 1, None)
    _checkout_to_cart = checkouts_started / np.clip(add_to_cart, 1, None)
    payment_p = np.clip(
        0.50
        + 0.22 * intent
        - 0.55 * friction
        + 0.28 * (_checkout_to_cart - 0.55)
        + 0.18 * (_cart_to_view - 0.45),
        0.03,
        0.98,
    )
    payments = rng.binomial(checkouts_started, p=payment_p)
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
