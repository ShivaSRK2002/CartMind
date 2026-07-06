-- Demo seed data for local development.
-- Safe to re-run: truncates dependent tables first.
-- Demo password for all seeded users: "password123"
-- Product/banner images are generated locally (see apps/api/src/db/seed.ts,
-- which runs after this file) as category-colored SVG placeholders rather
-- than external stock photos, so they always render with no network
-- dependency and stay visually grouped by category.

TRUNCATE TABLE order_items, orders, events, product_images, products, users, banners RESTART IDENTITY CASCADE;

INSERT INTO users (email, password_hash, name, role) VALUES
  ('admin@cartmind.ai', '$2b$10$Tr4qUDgq17.0qlhiwJNpCuThYIFbthpZvLut.5ZQngjzRjIMX2X6O', 'Ava Administrator', 'admin'),
  ('alice@example.com', '$2b$10$Tr4qUDgq17.0qlhiwJNpCuThYIFbthpZvLut.5ZQngjzRjIMX2X6O', 'Alice Nguyen', 'customer'),
  ('bob@example.com', '$2b$10$Tr4qUDgq17.0qlhiwJNpCuThYIFbthpZvLut.5ZQngjzRjIMX2X6O', 'Bob Martinez', 'customer'),
  ('carol@example.com', '$2b$10$Tr4qUDgq17.0qlhiwJNpCuThYIFbthpZvLut.5ZQngjzRjIMX2X6O', 'Carol Singh', 'customer'),
  ('dave@example.com', '$2b$10$Tr4qUDgq17.0qlhiwJNpCuThYIFbthpZvLut.5ZQngjzRjIMX2X6O', 'Dave Okafor', 'customer');

INSERT INTO products (name, description, price, category, stock) VALUES
  -- Electronics
  ('Wireless Noise-Cancelling Headphones', 'Over-ear Bluetooth headphones with active noise cancellation.', 149.99, 'Electronics', 42),
  ('4K Streaming Media Player', 'Compact streaming box with 4K HDR support.', 49.99, 'Electronics', 65),
  ('Portable Bluetooth Speaker', 'Waterproof speaker with 12-hour battery life.', 39.99, 'Electronics', 80),
  ('Smartwatch Series 5', 'Fitness tracking smartwatch with heart-rate monitor.', 199.99, 'Electronics', 30),
  ('27-inch 4K Monitor', 'IPS panel monitor with USB-C connectivity.', 329.99, 'Electronics', 18),
  ('Mechanical Keyboard', 'Hot-swappable mechanical keyboard with RGB backlight.', 89.99, 'Electronics', 55),

  -- Apparel
  ('Classic Denim Jacket', 'Unisex denim jacket with button closure.', 59.99, 'Apparel', 40),
  ('Running Sneakers', 'Lightweight breathable running shoes.', 79.99, 'Apparel', 60),
  ('Merino Wool Sweater', 'Soft crew-neck sweater for cold weather.', 64.99, 'Apparel', 35),
  ('Slim Fit Chinos', 'Cotton-blend chinos, tailored fit.', 44.99, 'Apparel', 50),
  ('Rain Shell Jacket', 'Packable waterproof jacket for hiking and travel.', 89.99, 'Apparel', 28),
  ('Cotton Crew Socks (3-Pack)', 'Breathable cotton-blend crew socks.', 14.99, 'Apparel', 100),

  -- Home & Kitchen
  ('Stainless Steel Cookware Set', '10-piece cookware set, dishwasher safe.', 129.99, 'Home & Kitchen', 20),
  ('Programmable Coffee Maker', '12-cup drip coffee maker with auto-brew timer.', 54.99, 'Home & Kitchen', 45),
  ('Memory Foam Pillow', 'Contoured memory foam pillow for neck support.', 29.99, 'Home & Kitchen', 70),
  ('Robot Vacuum Cleaner', 'Wi-Fi enabled robot vacuum with app control.', 249.99, 'Home & Kitchen', 15),
  ('Ceramic Dinnerware Set', '16-piece dinnerware set for four.', 74.99, 'Home & Kitchen', 25),
  ('Air Fryer', '5.8-quart digital air fryer with 8 presets.', 89.99, 'Home & Kitchen', 38),

  -- Books
  ('The Pragmatic Programmer', 'Classic guide to software craftsmanship.', 34.99, 'Books', 50),
  ('Atomic Habits', 'Practical guide to building good habits.', 17.99, 'Books', 90),
  ('A Brief History of Time', 'Stephen Hawking''s classic on cosmology.', 15.99, 'Books', 40),
  ('The Design of Everyday Things', 'Foundational text on design and usability.', 22.99, 'Books', 33),
  ('Sapiens: A Brief History of Humankind', 'A sweeping history of the human species.', 19.99, 'Books', 60),
  ('Deep Work', 'Rules for focused success in a distracted world.', 18.99, 'Books', 47),

  -- Sports & Outdoors
  ('Yoga Mat', 'Non-slip 6mm yoga mat with carry strap.', 24.99, 'Sports & Outdoors', 75),
  ('Adjustable Dumbbell Set', 'Pair of adjustable dumbbells, 5-25 lbs each.', 149.99, 'Sports & Outdoors', 22),
  ('Insulated Water Bottle', '32oz stainless steel insulated bottle.', 27.99, 'Sports & Outdoors', 85),
  ('2-Person Camping Tent', 'Lightweight waterproof tent for backpacking.', 119.99, 'Sports & Outdoors', 19),
  ('Cycling Helmet', 'Aerodynamic helmet with adjustable fit system.', 49.99, 'Sports & Outdoors', 41),
  ('Resistance Bands Set', '5-band resistance set with door anchor.', 19.99, 'Sports & Outdoors', 66);

INSERT INTO banners (title, image_url, link_url, display_order, is_active) VALUES
  ('Big Electronics Sale — Up to 40% Off', '', '/products?category=Electronics', 1, true),
  ('New Season Apparel Just Dropped', '', '/products?category=Apparel', 2, true),
  ('Kit Out Your Kitchen — Home & Kitchen Deals', '', '/products?category=Home+%26+Kitchen', 3, true),
  ('Gear Up for the Outdoors', '', '/products?category=Sports+%26+Outdoors', 4, true);
