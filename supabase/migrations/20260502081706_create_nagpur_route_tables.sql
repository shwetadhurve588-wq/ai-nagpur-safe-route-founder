/*
  # Nagpur Smart Route - Database Schema

  1. New Tables
    - `construction_zones`
      - `id` (uuid, primary key) - Unique zone identifier
      - `name` (text) - Name/description of the construction zone
      - `description` (text) - Detailed description of construction activity
      - `latitude` (float) - Center latitude of the zone
      - `longitude` (float) - Center longitude of the zone
      - `radius_meters` (integer) - Affected radius in meters
      - `severity` (text) - 'low', 'medium', 'high', 'critical'
      - `zone_type` (text) - 'metro_construction', 'road_repair', 'utility_work', 'event'
      - `status` (text) - 'active', 'planned', 'completed'
      - `start_date` (date) - When construction began
      - `end_date` (date) - Expected completion date
      - `affected_roads` (text array) - List of affected road names
      - `created_at` (timestamp) - Record creation time
      - `updated_at` (timestamp) - Last update time

    - `traffic_disruptions`
      - `id` (uuid, primary key) - Unique disruption identifier
      - `title` (text) - Short title of the disruption
      - `description` (text) - Detailed description
      - `latitude` (float) - Location latitude
      - `longitude` (float) - Location longitude
      - `disruption_type` (text) - 'accident', 'congestion', 'road_closure', 'waterlogging', 'procession'
      - `severity` (text) - 'low', 'medium', 'high', 'critical'
      - `status` (text) - 'active', 'cleared'
      - `reported_at` (timestamp) - When the disruption was reported
      - `cleared_at` (timestamp) - When it was cleared (nullable)
      - `affected_roads` (text array) - List of affected road names
      - `created_at` (timestamp) - Record creation time

    - `saved_routes`
      - `id` (uuid, primary key) - Unique route identifier
      - `user_id` (uuid) - Reference to auth.users
      - `name` (text) - User-given route name
      - `origin_lat` (float) - Origin latitude
      - `origin_lng` (float) - Origin longitude
      - `origin_label` (text) - Origin display name
      - `dest_lat` (float) - Destination latitude
      - `dest_lng` (float) - Destination longitude
      - `dest_label` (text) - Destination display name
      - `waypoints` (jsonb) - Array of {lat, lng} waypoints
      - `avoid_zones` (uuid array) - Construction zone IDs to avoid
      - `created_at` (timestamp) - Record creation time

  2. Security
    - Enable RLS on all tables
    - Construction zones and traffic disruptions are publicly readable
    - Only service role can insert/update zones and disruptions
    - Users can only read/write their own saved routes
*/

-- Construction Zones table
CREATE TABLE IF NOT EXISTS construction_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius_meters integer NOT NULL DEFAULT 200,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  zone_type text NOT NULL DEFAULT 'metro_construction' CHECK (zone_type IN ('metro_construction', 'road_repair', 'utility_work', 'event')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'planned', 'completed')),
  start_date date,
  end_date date,
  affected_roads text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Traffic Disruptions table
CREATE TABLE IF NOT EXISTS traffic_disruptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  disruption_type text NOT NULL DEFAULT 'congestion' CHECK (disruption_type IN ('accident', 'congestion', 'road_closure', 'waterlogging', 'procession')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cleared')),
  reported_at timestamptz DEFAULT now(),
  cleared_at timestamptz,
  affected_roads text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Saved Routes table
CREATE TABLE IF NOT EXISTS saved_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Route',
  origin_lat double precision NOT NULL,
  origin_lng double precision NOT NULL,
  origin_label text DEFAULT '',
  dest_lat double precision NOT NULL,
  dest_lng double precision NOT NULL,
  dest_label text DEFAULT '',
  waypoints jsonb DEFAULT '[]',
  avoid_zones uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE construction_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;

-- Construction zones: public read, service role write
CREATE POLICY "Public can view construction zones"
  ON construction_zones FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can insert construction zones"
  ON construction_zones FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can update construction zones"
  ON construction_zones FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Traffic disruptions: public read, service role write
CREATE POLICY "Public can view traffic disruptions"
  ON traffic_disruptions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can insert traffic disruptions"
  ON traffic_disruptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can update traffic disruptions"
  ON traffic_disruptions FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Saved routes: users can only access their own
CREATE POLICY "Users can view own saved routes"
  ON saved_routes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved routes"
  ON saved_routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved routes"
  ON saved_routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved routes"
  ON saved_routes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_construction_zones_status ON construction_zones(status);
CREATE INDEX IF NOT EXISTS idx_construction_zones_type ON construction_zones(zone_type);
CREATE INDEX IF NOT EXISTS idx_traffic_disruptions_status ON traffic_disruptions(status);
CREATE INDEX IF NOT EXISTS idx_traffic_disruptions_type ON traffic_disruptions(disruption_type);
CREATE INDEX IF NOT EXISTS idx_saved_routes_user_id ON saved_routes(user_id);
