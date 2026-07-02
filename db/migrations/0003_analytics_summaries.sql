-- Up Migration

CREATE TABLE analytics_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_type TEXT NOT NULL,
  dimension TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (summary_type, dimension, period_start, period_end)
);

-- Down Migration

DROP TABLE IF EXISTS analytics_summaries;
