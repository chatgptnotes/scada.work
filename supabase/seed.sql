-- Seed data for SCADA Water Distribution System

-- ============================================================================
-- SEED VENDORS
-- ============================================================================
INSERT INTO vendors (id, name, code, email, phone, address, billing_rate, status)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Vendor A - Industrial Estate', 'VENDOR_A', 'vendora@example.com', '+919876543210', 'Industrial Area, Nagpur', 0.50, 'active'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Vendor B - Tech Park', 'VENDOR_B', 'vendorb@example.com', '+919876543211', 'IT Park, Nagpur', 0.45, 'active'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Vendor C - Manufacturing Hub', 'VENDOR_C', 'vendorc@example.com', '+919876543212', 'MIDC Area, Nagpur', 0.55, 'active'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Vendor D - Agricultural Cooperative', 'VENDOR_D', 'vendord@example.com', '+919876543213', 'Rural Area, Nagpur District', 0.30, 'active'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Vendor E - Residential Complex', 'VENDOR_E', 'vendore@example.com', '+919876543214', 'Residential Zone, Nagpur', 0.60, 'active');

-- ============================================================================
-- SEED SUPPLY LINES
-- ============================================================================
INSERT INTO supply_lines (id, vendor_id, name, flow_meter_id, location, max_flow_rate, max_daily_volume, status)
VALUES
  -- Vendor A supply lines
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Line A-1 North Pipeline', 'FM-A1-001', ST_SetSRID(ST_MakePoint(79.0882, 21.1458), 4326), 80.0, 5000.0, 'active'),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Line A-2 South Pipeline', 'FM-A2-002', ST_SetSRID(ST_MakePoint(79.0892, 21.1448), 4326), 60.0, 4000.0, 'active'),

  -- Vendor B supply lines
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Line B-1 Main Supply', 'FM-B1-003', ST_SetSRID(ST_MakePoint(79.0902, 21.1468), 4326), 100.0, 7000.0, 'active'),

  -- Vendor C supply lines
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Line C-1 East Pipeline', 'FM-C1-004', ST_SetSRID(ST_MakePoint(79.0912, 21.1478), 4326), 120.0, 8000.0, 'active'),
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'Line C-2 West Pipeline', 'FM-C2-005', ST_SetSRID(ST_MakePoint(79.0872, 21.1438), 4326), 90.0, 6000.0, 'active'),

  -- Vendor D supply lines
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', 'Line D-1 Agricultural Supply', 'FM-D1-006', ST_SetSRID(ST_MakePoint(79.0850, 21.1500), 4326), 150.0, 10000.0, 'active'),

  -- Vendor E supply lines
  ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', 'Line E-1 Residential Main', 'FM-E1-007', ST_SetSRID(ST_MakePoint(79.0920, 21.1420), 4326), 70.0, 4500.0, 'active');

-- ============================================================================
-- SEED ALARM RULES
-- ============================================================================
INSERT INTO alarm_rules (supply_line_id, parameter, condition, threshold, severity, message_template, enabled)
VALUES
  -- Flow rate high alarms
  ('650e8400-e29b-41d4-a716-446655440001', 'flow_rate', 'greater_than', 75.0, 'high', 'Flow rate exceeded threshold on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440002', 'flow_rate', 'greater_than', 55.0, 'high', 'Flow rate exceeded threshold on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440003', 'flow_rate', 'greater_than', 95.0, 'critical', 'Critical flow rate exceeded on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440004', 'flow_rate', 'greater_than', 115.0, 'critical', 'Critical flow rate exceeded on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440005', 'flow_rate', 'greater_than', 85.0, 'high', 'Flow rate exceeded threshold on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440006', 'flow_rate', 'greater_than', 145.0, 'critical', 'Critical flow rate exceeded on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440007', 'flow_rate', 'greater_than', 65.0, 'high', 'Flow rate exceeded threshold on {supply_line_name}', true),

  -- Flow rate low alarms
  ('650e8400-e29b-41d4-a716-446655440001', 'flow_rate', 'less_than', 5.0, 'medium', 'Low flow rate detected on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440002', 'flow_rate', 'less_than', 5.0, 'medium', 'Low flow rate detected on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440003', 'flow_rate', 'less_than', 10.0, 'medium', 'Low flow rate detected on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440004', 'flow_rate', 'less_than', 10.0, 'medium', 'Low flow rate detected on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440005', 'flow_rate', 'less_than', 5.0, 'medium', 'Low flow rate detected on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440006', 'flow_rate', 'less_than', 15.0, 'medium', 'Low flow rate detected on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440007', 'flow_rate', 'less_than', 5.0, 'medium', 'Low flow rate detected on {supply_line_name}', true),

  -- Pressure high alarms
  ('650e8400-e29b-41d4-a716-446655440001', 'pressure', 'greater_than', 9.0, 'high', 'High pressure detected on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440002', 'pressure', 'greater_than', 9.0, 'high', 'High pressure detected on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440003', 'pressure', 'greater_than', 10.0, 'critical', 'Critical pressure detected on {supply_line_name}', true),

  -- Pressure low alarms
  ('650e8400-e29b-41d4-a716-446655440001', 'pressure', 'less_than', 1.5, 'medium', 'Low pressure detected on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440002', 'pressure', 'less_than', 1.5, 'medium', 'Low pressure detected on {supply_line_name}', true),
  ('650e8400-e29b-41d4-a716-446655440003', 'pressure', 'less_than', 2.0, 'medium', 'Low pressure detected on {supply_line_name}', true);

-- ============================================================================
-- NOTE: User profiles and auth.users must be created through Supabase Auth
-- ============================================================================

-- Example user profile inserts (assuming auth.users IDs are known):
-- After creating users through Supabase Auth, run:
/*
INSERT INTO user_profiles (id, vendor_id, role, full_name)
VALUES
  ('auth-user-id-1', '550e8400-e29b-41d4-a716-446655440001', 'vendor', 'Vendor A Admin'),
  ('auth-user-id-2', '550e8400-e29b-41d4-a716-446655440002', 'vendor', 'Vendor B Admin'),
  ('auth-user-id-3', '550e8400-e29b-41d4-a716-446655440003', 'vendor', 'Vendor C Admin'),
  ('auth-user-id-4', NULL, 'admin', 'System Administrator'),
  ('auth-user-id-5', NULL, 'operator', 'System Operator');
*/

-- ============================================================================
-- SEED INITIAL FLOW DATA (last 1 hour of simulated data)
-- ============================================================================

-- This will generate sample flow data for the last hour
-- In production, this would be generated by the simulator or real devices

DO $$
DECLARE
  line_id UUID;
  current_time TIMESTAMPTZ;
  flow_val NUMERIC;
  volume_val NUMERIC := 0;
BEGIN
  FOR line_id IN SELECT id FROM supply_lines LOOP
    current_time := NOW() - INTERVAL '1 hour';
    volume_val := 0;

    WHILE current_time <= NOW() LOOP
      -- Generate random but realistic flow data
      flow_val := (RANDOM() * 50 + 30)::NUMERIC(10,3);
      volume_val := volume_val + (flow_val * 5 / 1000)::NUMERIC(15,3); -- accumulate volume

      INSERT INTO flow_data (time, supply_line_id, flow_rate, total_volume, pressure, valve_position, status)
      VALUES (
        current_time,
        line_id,
        flow_val,
        volume_val,
        (RANDOM() * 5 + 3)::NUMERIC(10,2), -- pressure 3-8 bar
        (RANDOM() * 20 + 70)::INTEGER, -- valve position 70-90%
        'normal'
      );

      current_time := current_time + INTERVAL '5 seconds';
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- SEED SAMPLE ALARMS (a few historical alarms)
-- ============================================================================
INSERT INTO alarms (supply_line_id, alarm_type, severity, message, value, threshold, status, created_at)
VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'flow_rate_high', 'high', 'Flow rate exceeded threshold on Line A-1 North Pipeline', 78.5, 75.0, 'closed', NOW() - INTERVAL '2 days'),
  ('650e8400-e29b-41d4-a716-446655440003', 'pressure_high', 'critical', 'Critical pressure detected on Line B-1 Main Supply', 10.2, 10.0, 'closed', NOW() - INTERVAL '1 day'),
  ('650e8400-e29b-41d4-a716-446655440004', 'flow_rate_low', 'medium', 'Low flow rate detected on Line C-1 East Pipeline', 4.2, 10.0, 'acknowledged', NOW() - INTERVAL '6 hours'),
  ('650e8400-e29b-41d4-a716-446655440006', 'flow_rate_high', 'critical', 'Critical flow rate exceeded on Line D-1 Agricultural Supply', 148.0, 145.0, 'active', NOW() - INTERVAL '30 minutes');

-- ============================================================================
-- SEED SAMPLE BILLING REPORTS (last month)
-- ============================================================================
INSERT INTO billing_reports (vendor_id, supply_line_id, period_start, period_end, total_volume, peak_flow_rate, average_flow_rate, downtime_minutes, status)
VALUES
  -- Vendor A reports
  ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001',
   (NOW() - INTERVAL '1 month')::DATE, NOW()::DATE, 142500.50, 78.5, 45.2, 120, 'sent'),
  ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002',
   (NOW() - INTERVAL '1 month')::DATE, NOW()::DATE, 98750.25, 58.0, 38.5, 60, 'sent'),

  -- Vendor B reports
  ('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003',
   (NOW() - INTERVAL '1 month')::DATE, NOW()::DATE, 205000.75, 98.0, 72.5, 45, 'paid'),

  -- Vendor C reports
  ('550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440004',
   (NOW() - INTERVAL '1 month')::DATE, NOW()::DATE, 287500.00, 118.0, 95.0, 90, 'sent'),
  ('550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440005',
   (NOW() - INTERVAL '1 month')::DATE, NOW()::DATE, 175250.50, 88.0, 62.5, 150, 'sent'),

  -- Vendor D reports
  ('550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440006',
   (NOW() - INTERVAL '1 month')::DATE, NOW()::DATE, 425000.00, 148.0, 125.0, 30, 'sent'),

  -- Vendor E reports
  ('550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440007',
   (NOW() - INTERVAL '1 month')::DATE, NOW()::DATE, 132750.25, 68.5, 52.0, 180, 'sent');

-- ============================================================================
-- LOG INITIAL SETUP
-- ============================================================================
INSERT INTO system_logs (level, component, message, metadata)
VALUES
  ('info', 'database', 'Initial seed data loaded successfully', '{"vendors": 5, "supply_lines": 7, "alarm_rules": 19}');
