// Database Types
export interface Vendor {
  id: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  address?: string;
  billing_rate: number; // rate per m³
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface SupplyLine {
  id: string;
  vendor_id: string;
  name: string;
  flow_meter_id: string;
  location?: {
    lat: number;
    lng: number;
  };
  max_flow_rate: number; // L/s
  max_daily_volume: number; // m³
  status: 'active' | 'maintenance' | 'offline';
  created_at: string;
  updated_at: string;
}

export interface FlowData {
  time: string;
  supply_line_id: string;
  flow_rate: number; // L/s
  total_volume: number; // cumulative m³
  pressure: number; // bar
  valve_position: number; // 0-100%
  status: 'normal' | 'warning' | 'alarm';
}

export interface Alarm {
  id: string;
  supply_line_id: string;
  alarm_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  value: number;
  threshold: number;
  status: 'active' | 'acknowledged' | 'closed';
  acknowledged_by?: string;
  acknowledged_at?: string;
  closed_at?: string;
  notes?: string;
  created_at: string;
}

export interface BillingReport {
  id: string;
  vendor_id: string;
  supply_line_id: string;
  period_start: string;
  period_end: string;
  total_volume: number; // m³
  peak_flow_rate: number; // L/s
  average_flow_rate: number; // L/s
  downtime_minutes: number;
  amount: number; // billing amount
  report_url?: string; // link to PDF
  status: 'draft' | 'sent' | 'paid';
  created_at: string;
}

export interface UserProfile {
  id: string;
  vendor_id?: string;
  role: 'admin' | 'vendor' | 'operator';
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Protocol Types
export interface ModbusConfig {
  host: string;
  port: number;
  unit_id: number;
  enabled: boolean;
}

export interface OPCUAConfig {
  endpoint: string;
  enabled: boolean;
}

export interface FlowMeterReading {
  meter_id: string;
  timestamp: Date;
  flow_rate: number; // L/s
  total_volume: number; // m³
  pressure: number; // bar
  temperature?: number; // °C
  valve_position: number; // 0-100%
  status: 'ok' | 'warning' | 'error';
}

// Simulator Types
export interface SimulatorConfig {
  enabled: boolean;
  vendor_count: number;
  flow_min: number;
  flow_max: number;
  pressure_min: number;
  pressure_max: number;
  update_interval: number;
}

export interface SimulatedDevice {
  id: string;
  supply_line_id: string;
  type: 'ultrasonic' | 'magnetic' | 'coriolis';
  current_flow: number;
  current_pressure: number;
  total_volume: number;
  valve_position: number;
}

// Alarm Configuration
export interface AlarmConfig {
  check_interval: number;
  flow_high_threshold: number;
  flow_low_threshold: number;
  pressure_high_threshold: number;
  pressure_low_threshold: number;
  enable_email: boolean;
  enable_sms: boolean;
  enable_push: boolean;
}

export interface AlarmRule {
  id: string;
  supply_line_id: string;
  parameter: 'flow_rate' | 'pressure' | 'valve_position' | 'total_volume';
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message_template: string;
  enabled: boolean;
}

// Report Types
export interface ReportConfig {
  schedule_daily: string; // cron expression
  schedule_weekly: string;
  schedule_monthly: string;
  storage_path: string;
  email_recipients: string[];
}

export interface ConsumptionSummary {
  supply_line_id: string;
  vendor_name: string;
  period_start: string;
  period_end: string;
  total_volume: number;
  peak_flow: number;
  average_flow: number;
  min_flow: number;
  uptime_percentage: number;
  alarm_count: number;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserProfile;
  access_token: string;
  refresh_token: string;
}

export interface DashboardData {
  supply_lines: SupplyLine[];
  latest_readings: FlowData[];
  active_alarms: Alarm[];
  daily_consumption: number;
  monthly_consumption: number;
}

export interface TrendDataRequest {
  supply_line_id: string;
  start_time: string;
  end_time: string;
  interval: '1min' | '5min' | '15min' | '1hour' | '1day';
}

export interface TrendDataResponse {
  data: Array<{
    time: string;
    avg_flow_rate: number;
    max_flow_rate: number;
    min_flow_rate: number;
    total_volume: number;
    avg_pressure: number;
  }>;
}

// WebSocket Message Types
export interface WSMessage {
  type: 'flow_data' | 'alarm' | 'status' | 'heartbeat';
  payload: unknown;
  timestamp: string;
}

export interface FlowDataWSMessage extends WSMessage {
  type: 'flow_data';
  payload: FlowData;
}

export interface AlarmWSMessage extends WSMessage {
  type: 'alarm';
  payload: Alarm;
}

// Historian Types
export interface HistorianConfig {
  batch_size: number;
  flush_interval: number; // milliseconds
  buffer_max_size: number;
}

export interface HistorianRecord {
  timestamp: Date;
  supply_line_id: string;
  tags: Record<string, string | number>;
  values: Record<string, number>;
}

// System Status Types
export interface SystemStatus {
  edge_server: {
    status: 'online' | 'offline' | 'degraded';
    uptime: number;
    cpu_usage: number;
    memory_usage: number;
    active_connections: number;
  };
  database: {
    status: 'online' | 'offline';
    connections: number;
    query_time_avg: number;
  };
  simulator: {
    enabled: boolean;
    active_devices: number;
  };
  protocols: {
    modbus: {
      enabled: boolean;
      status: 'connected' | 'disconnected';
    };
    opcua: {
      enabled: boolean;
      status: 'connected' | 'disconnected';
    };
  };
}

// Notification Types
export interface EmailNotification {
  to: string[];
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export interface SMSNotification {
  to: string;
  message: string;
}

export interface PushNotification {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Chart Data Types
export interface ChartDataPoint {
  x: string | number;
  y: number;
}

export interface LineChartData {
  label: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface GaugeData {
  value: number;
  min: number;
  max: number;
  threshold_warning: number;
  threshold_critical: number;
  unit: string;
}

// Version Information
export interface VersionInfo {
  version: string;
  date: string;
  repository: string;
}
