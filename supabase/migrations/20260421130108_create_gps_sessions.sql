/*
  # Create GPS Sessions Table

  1. New Tables
    - `gps_sessions`
      - `id` (uuid, primary key)
      - `session_id` (text, unique session identifier generated client-side)
      - `mode` (text, movement mode: walking/driving/running/bike)
      - `points` (jsonb, array of GPS points with lat/lon/timestamp/speed/heading/mode)
      - `total_distance` (float, total distance in meters)
      - `duration_seconds` (int, recording duration in seconds)
      - `started_at` (timestamptz, when recording started)
      - `completed_at` (timestamptz, when recording stopped)
      - `created_at` (timestamptz, when record was inserted)

  2. Security
    - Enable RLS on `gps_sessions` table
    - No client-facing policies; data is inserted exclusively via service-role edge function
    - Service role bypasses RLS, ensuring only the trusted upload endpoint can write data

  3. Notes
    - This table stores GPS trajectory data for AI/LSTM model training
    - Points are stored as JSONB for flexible schema and efficient bulk insertion
    - The edge function (upload-gps) uses the service role key and is the sole write path
*/

CREATE TABLE IF NOT EXISTS gps_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  mode text NOT NULL DEFAULT 'walking',
  points jsonb NOT NULL DEFAULT '[]',
  total_distance float DEFAULT 0,
  duration_seconds int DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gps_sessions_session_id_idx ON gps_sessions(session_id);
CREATE INDEX IF NOT EXISTS gps_sessions_mode_idx ON gps_sessions(mode);
CREATE INDEX IF NOT EXISTS gps_sessions_created_at_idx ON gps_sessions(created_at DESC);

ALTER TABLE gps_sessions ENABLE ROW LEVEL SECURITY;
