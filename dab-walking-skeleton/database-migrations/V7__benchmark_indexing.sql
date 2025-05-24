CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0
);

INSERT INTO products (name, stock_quantity)
SELECT
  'Product ' || n AS name,
  (FLOOR(RANDOM() * 1000) + 1)::INTEGER AS stock_quantity
FROM generate_series(1, 1000000) AS s(n);