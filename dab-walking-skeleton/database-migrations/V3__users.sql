CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO users (name) SELECT 'User ' || (n)::text FROM generate_series(1, 100000) n;