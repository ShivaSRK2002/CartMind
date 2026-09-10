-- Up Migration

-- Landing zone for the Gold user-feature table produced by the Databricks
-- medallion pipeline (apps/ml/databricks). When populated, apps/ml/score.py
-- reads features from here instead of recomputing them with a live SQL
-- aggregate — matching the use-case architecture
-- (PostgreSQL -> Databricks pipeline -> Python ML engine).
CREATE TABLE ml_user_features (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  order_count NUMERIC NOT NULL DEFAULT 0,
  lifetime_value NUMERIC NOT NULL DEFAULT 0,
  days_since_last_order NUMERIC NOT NULL DEFAULT 365,
  events_30d NUMERIC NOT NULL DEFAULT 0,
  product_views NUMERIC NOT NULL DEFAULT 0,
  add_to_cart NUMERIC NOT NULL DEFAULT 0,
  checkouts_started NUMERIC NOT NULL DEFAULT 0,
  payments NUMERIC NOT NULL DEFAULT 0,
  checkout_abandoned NUMERIC NOT NULL DEFAULT 0,
  wishlist_adds NUMERIC NOT NULL DEFAULT 0,
  days_since_signup NUMERIC NOT NULL DEFAULT 0,
  cart_to_view_ratio NUMERIC NOT NULL DEFAULT 0,
  checkout_to_cart_ratio NUMERIC NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'databricks',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Down Migration

DROP TABLE IF EXISTS ml_user_features;
