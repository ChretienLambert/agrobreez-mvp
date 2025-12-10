CREATE TABLE IF NOT EXISTS machines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  last_seen TIMESTAMP,
  status TEXT DEFAULT 'unknown'
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id SERIAL PRIMARY KEY,
  machine_id INTEGER,
  ts TIMESTAMP DEFAULT NOW(),
  metric TEXT,
  value DOUBLE PRECISION
);