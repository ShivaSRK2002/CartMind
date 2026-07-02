-- Up Migration

CREATE TYPE event_type AS ENUM (
  'product_viewed',
  'add_to_cart',
  'remove_from_cart',
  'checkout_started',
  'payment_success',
  'wishlist_add',
  'coupon_applied',
  'search_query',
  'checkout_abandoned'
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type event_type NOT NULL,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  anonymous_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- events: time-windowed queries per event type (e.g. "all payment_success in
-- the last 7 days") filter on event_type and range-scan occurred_at; the
-- composite index serves both in a single pass.
CREATE INDEX idx_events_event_type_occurred_at ON events (event_type, occurred_at);

-- events: per-user journey reconstruction fetches all of one user's events
-- ordered by time — composite index covers the equality filter and the sort.
CREATE INDEX idx_events_user_id_occurred_at ON events (user_id, occurred_at);

-- events: session replay looks up all events for one session_id by exact
-- match; per-session volume is small enough to sort in memory after the hit.
CREATE INDEX idx_events_session_id ON events (session_id);

-- Down Migration

DROP TABLE IF EXISTS events;
DROP TYPE IF EXISTS event_type;
