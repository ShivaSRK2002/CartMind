-- Up Migration

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- banners: the homepage carousel always queries "active banners in display
-- order"; the composite index serves that filter + sort together.
CREATE INDEX idx_banners_active_display_order ON banners (is_active, display_order);

-- Down Migration

DROP TABLE IF EXISTS banners;
