-- Up Migration

CREATE TABLE ml_user_scores (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  churn_risk NUMERIC NOT NULL,
  cart_abandonment_risk NUMERIC NOT NULL,
  conversion_propensity NUMERIC NOT NULL,
  cohort TEXT NOT NULL,
  model_version TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ml_product_similarity (
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  similar_product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  similarity NUMERIC NOT NULL,
  model_version TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, similar_product_id)
);

-- ml_product_similarity: recommendation lookups fetch all similar products
-- for one seed product ordered by score — index covers the equality filter.
CREATE INDEX idx_ml_product_similarity_product_id ON ml_product_similarity (product_id, similarity DESC);

CREATE TABLE ml_model_metrics (
  model_name TEXT PRIMARY KEY,
  algorithm TEXT NOT NULL,
  metrics JSONB NOT NULL,
  trained_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Down Migration

DROP TABLE IF EXISTS ml_model_metrics;
DROP TABLE IF EXISTS ml_product_similarity;
DROP TABLE IF EXISTS ml_user_scores;
