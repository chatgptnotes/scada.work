-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Enable PostGIS for geographic data (optional, for location features)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- VENDORS TABLE
-- ============================================================================
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  billing_rate NUMERIC(10,2) NOT NULL DEFAULT 0.50, -- rate per m³
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_code ON vendors(code);

-- ============================================================================
-- SUPPLY LINES TABLE
-- ============================================================================
CREATE TABLE supply_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  flow_meter_id TEXT NOT NULL UNIQUE,
  location GEOGRAPHY(POINT) NULL, -- lat/long for mapping
  max_flow_rate NUMERIC(10,2), -- L/s
  max_daily_volume NUMERIC(10,2), -- m³
  status TEXT CHECK (status IN ('active', 'maintenance', 'offline')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supply_lines_vendor ON supply_lines(vendor_id);
CREATE INDEX idx_supply_lines_status ON supply_lines(status);
CREATE INDEX idx_supply_lines_meter_id ON supply_lines(flow_meter_id);

-- ============================================================================
-- FLOW DATA TABLE (TimescaleDB Hypertable)
-- ============================================================================
CREATE TABLE flow_data (
  time TIMESTAMPTZ NOT NULL,
  supply_line_id UUID NOT NULL REFERENCES supply_lines(id) ON DELETE CASCADE,
  flow_rate NUMERIC(10,3), -- L/s
  total_volume NUMERIC(15,3), -- cumulative m³
  pressure NUMERIC(10,2), -- bar
  valve_position INTEGER CHECK (valve_position >= 0 AND valve_position <= 100), -- 0-100%
  status TEXT CHECK (status IN ('normal', 'warning', 'alarm')) DEFAULT 'normal',
  PRIMARY KEY (time, supply_line_id)
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('flow_data', 'time');

-- Create indexes
CREATE INDEX idx_flow_data_supply_line ON flow_data(supply_line_id, time DESC);
CREATE INDEX idx_flow_data_status ON flow_data(status, time DESC);

-- ============================================================================
-- CONTINUOUS AGGREGATES (for performance)
-- ============================================================================

-- 1-minute aggregates
CREATE MATERIALIZED VIEW flow_data_1min
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 minute', time) AS bucket,
  supply_line_id,
  AVG(flow_rate) AS avg_flow_rate,
  MAX(flow_rate) AS max_flow_rate,
  MIN(flow_rate) AS min_flow_rate,
  LAST(total_volume, time) AS total_volume,
  AVG(pressure) AS avg_pressure,
  AVG(valve_position) AS avg_valve_position
FROM flow_data
GROUP BY bucket, supply_line_id;

-- Add refresh policy (refresh every 1 minute)
SELECT add_continuous_aggregate_policy('flow_data_1min',
  start_offset => INTERVAL '2 hours',
  end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute');

-- 1-hour aggregates
CREATE MATERIALIZED VIEW flow_data_1hour
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  supply_line_id,
  AVG(flow_rate) AS avg_flow_rate,
  MAX(flow_rate) AS max_flow_rate,
  MIN(flow_rate) AS min_flow_rate,
  LAST(total_volume, time) AS total_volume,
  AVG(pressure) AS avg_pressure,
  AVG(valve_position) AS avg_valve_position
FROM flow_data
GROUP BY bucket, supply_line_id;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('flow_data_1hour',
  start_offset => INTERVAL '1 week',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- 1-day aggregates
CREATE MATERIALIZED VIEW flow_data_1day
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time) AS bucket,
  supply_line_id,
  AVG(flow_rate) AS avg_flow_rate,
  MAX(flow_rate) AS max_flow_rate,
  MIN(flow_rate) AS min_flow_rate,
  LAST(total_volume, time) AS total_volume,
  AVG(pressure) AS avg_pressure,
  AVG(valve_position) AS avg_valve_position
FROM flow_data
GROUP BY bucket, supply_line_id;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('flow_data_1day',
  start_offset => INTERVAL '1 month',
  end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');

-- ============================================================================
-- DATA RETENTION AND COMPRESSION POLICIES
-- ============================================================================

-- Compress data older than 7 days
SELECT add_compression_policy('flow_data', INTERVAL '7 days');

-- Drop raw data older than 90 days (keep only aggregates)
SELECT add_retention_policy('flow_data', INTERVAL '90 days');

-- ============================================================================
-- ALARMS TABLE
-- ============================================================================
CREATE TABLE alarms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_line_id UUID NOT NULL REFERENCES supply_lines(id) ON DELETE CASCADE,
  alarm_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')) NOT NULL,
  message TEXT NOT NULL,
  value NUMERIC(10,2),
  threshold NUMERIC(10,2),
  status TEXT CHECK (status IN ('active', 'acknowledged', 'closed')) DEFAULT 'active',
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alarms_supply_line ON alarms(supply_line_id);
CREATE INDEX idx_alarms_status ON alarms(status);
CREATE INDEX idx_alarms_severity ON alarms(severity);
CREATE INDEX idx_alarms_created ON alarms(created_at DESC);

-- ============================================================================
-- BILLING REPORTS TABLE
-- ============================================================================
CREATE TABLE billing_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  supply_line_id UUID NOT NULL REFERENCES supply_lines(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_volume NUMERIC(15,3), -- m³
  peak_flow_rate NUMERIC(10,3), -- L/s
  average_flow_rate NUMERIC(10,3), -- L/s
  downtime_minutes INTEGER DEFAULT 0,
  amount NUMERIC(12,2), -- billing amount
  report_url TEXT,
  status TEXT CHECK (status IN ('draft', 'sent', 'paid')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_vendor ON billing_reports(vendor_id);
CREATE INDEX idx_billing_period ON billing_reports(period_start, period_end);
CREATE INDEX idx_billing_status ON billing_reports(status);

-- ============================================================================
-- USER PROFILES TABLE (extends auth.users)
-- ============================================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  role TEXT CHECK (role IN ('admin', 'vendor', 'operator')) NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_vendor ON user_profiles(vendor_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- ============================================================================
-- ALARM RULES TABLE (for configuration)
-- ============================================================================
CREATE TABLE alarm_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_line_id UUID REFERENCES supply_lines(id) ON DELETE CASCADE,
  parameter TEXT CHECK (parameter IN ('flow_rate', 'pressure', 'valve_position', 'total_volume')) NOT NULL,
  condition TEXT CHECK (condition IN ('greater_than', 'less_than', 'equals', 'not_equals')) NOT NULL,
  threshold NUMERIC(10,2) NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')) NOT NULL,
  message_template TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alarm_rules_supply_line ON alarm_rules(supply_line_id);
CREATE INDEX idx_alarm_rules_enabled ON alarm_rules(enabled);

-- ============================================================================
-- SYSTEM LOGS TABLE
-- ============================================================================
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT CHECK (level IN ('info', 'warn', 'error', 'debug')) NOT NULL,
  component TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarm_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see everything
CREATE POLICY "Admins full access" ON vendors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins full access" ON supply_lines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Vendors can only see their own data
CREATE POLICY "Vendors see own vendors" ON vendors
  FOR SELECT
  USING (
    id IN (
      SELECT vendor_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Vendors see own supply lines" ON supply_lines
  FOR SELECT
  USING (
    vendor_id IN (
      SELECT vendor_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Vendors see own flow data" ON flow_data
  FOR SELECT
  USING (
    supply_line_id IN (
      SELECT id FROM supply_lines
      WHERE vendor_id IN (
        SELECT vendor_id FROM user_profiles
        WHERE user_profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Vendors see own alarms" ON alarms
  FOR SELECT
  USING (
    supply_line_id IN (
      SELECT id FROM supply_lines
      WHERE vendor_id IN (
        SELECT vendor_id FROM user_profiles
        WHERE user_profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Vendors see own billing reports" ON billing_reports
  FOR SELECT
  USING (
    vendor_id IN (
      SELECT vendor_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

-- Policy: Users can see their own profile
CREATE POLICY "Users see own profile" ON user_profiles
  FOR SELECT
  USING (id = auth.uid());

-- Policy: Users can update their own profile
CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE
  USING (id = auth.uid());

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supply_lines_updated_at BEFORE UPDATE ON supply_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alarm_rules_updated_at BEFORE UPDATE ON alarm_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate billing amount
CREATE OR REPLACE FUNCTION calculate_billing_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate amount based on total volume and vendor billing rate
  SELECT (NEW.total_volume * v.billing_rate) INTO NEW.amount
  FROM vendors v
  WHERE v.id = NEW.vendor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate billing amount
CREATE TRIGGER calculate_billing_amount_trigger
  BEFORE INSERT OR UPDATE ON billing_reports
  FOR EACH ROW
  EXECUTE FUNCTION calculate_billing_amount();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Latest flow data for each supply line
CREATE VIEW latest_flow_data AS
SELECT DISTINCT ON (supply_line_id)
  *
FROM flow_data
ORDER BY supply_line_id, time DESC;

-- View: Active alarms with supply line and vendor info
CREATE VIEW active_alarms_detailed AS
SELECT
  a.*,
  sl.name AS supply_line_name,
  sl.flow_meter_id,
  v.name AS vendor_name,
  v.code AS vendor_code
FROM alarms a
JOIN supply_lines sl ON a.supply_line_id = sl.id
JOIN vendors v ON sl.vendor_id = v.id
WHERE a.status = 'active'
ORDER BY a.severity DESC, a.created_at DESC;

-- View: Vendor dashboard summary
CREATE VIEW vendor_dashboard_summary AS
SELECT
  v.id AS vendor_id,
  v.name AS vendor_name,
  COUNT(DISTINCT sl.id) AS supply_line_count,
  COUNT(DISTINCT CASE WHEN a.status = 'active' THEN a.id END) AS active_alarm_count,
  SUM(lfd.total_volume) AS total_consumption,
  AVG(lfd.flow_rate) AS avg_flow_rate
FROM vendors v
LEFT JOIN supply_lines sl ON v.id = sl.vendor_id
LEFT JOIN latest_flow_data lfd ON sl.id = lfd.supply_line_id
LEFT JOIN alarms a ON sl.id = a.supply_line_id
GROUP BY v.id, v.name;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to read views
GRANT SELECT ON latest_flow_data TO authenticated;
GRANT SELECT ON active_alarms_detailed TO authenticated;
GRANT SELECT ON vendor_dashboard_summary TO authenticated;
GRANT SELECT ON flow_data_1min TO authenticated;
GRANT SELECT ON flow_data_1hour TO authenticated;
GRANT SELECT ON flow_data_1day TO authenticated;
