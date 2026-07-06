-- Up Migration

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- product_images: the detail page always fetches "all images for one
-- product, in gallery order" — composite index serves both together.
CREATE INDEX idx_product_images_product_id_display_order ON product_images (product_id, display_order);

-- Down Migration

DROP TABLE IF EXISTS product_images;
