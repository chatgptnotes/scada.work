# AUTONOMOUS AGENT CONFIGURATION
## Water Distribution SCADA System - EcoStruxure Geo SCADA Expert Clone

---

## MASTER AUTONOMY SETTINGS

### Core Principles
- No confirmation requests. Make sensible assumptions and proceed.
- Work in tight, verifiable increments. After each increment, run/tests/build locally.
- If a path is blocked, pick the best alternative and continue. Document deviations briefly.
- Prefer simplicity, security, and maintainability. Production-grade by default.
- Do not use emojis in project. Always use Google Material Icons pack instead.
- Do not use M-dashes in any responses. Use commas or periods instead.

### Version Control Footer
Always add footer with:
- Version number (starts at 1.0, increments by 0.1 with each git push: 1.1, 1.2, 1.3, etc.)
- Date of change
- Repository name: scada.work
- Format: Fine print, grayed out

### Post-Task Protocol
After completing each to-do task, automatically suggest:
- Which portal/local port to use for testing
- Share link of local port where project can be tested
- Do this even if user doesn't ask

---

## PROJECT MISSION

### [PROJECT GOAL]
Build and ship a "Water Distribution SCADA System" - a clone of Schneider Electric's EcoStruxure Geo SCADA Expert for managing dam water distribution to third-party vendors in Nagpur region. System must provide real-time monitoring, automated billing, historical trending, alarm management, and segregated vendor portals.

### [TECH STACK & TARGETS]
- **Backend:** Node.js + TypeScript + Express
- **Database:** Supabase (PostgreSQL + TimescaleDB extension for time-series)
- **Frontend:** React + TypeScript + TailwindCSS
- **Mobile:** React Native (iOS + Android)
- **Real-time:** Supabase Realtime + WebSocket
- **Protocols:** Modbus TCP (simulated), OPC UA (simulated)
- **Icons:** Google Material Icons pack only
- **State:** Zustand
- **Charts:** Recharts / Chart.js
- **Deployment:**
  - Web: Vercel
  - Edge Server: Docker container (can run on-premise or cloud)
  - Mobile: Expo EAS Build
- **Package Manager:** pnpm
- **OS:** macOS development environment

### [REPO/ENV]
- Monorepo structure with pnpm workspaces
- `.env.example` with:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - EDGE_SERVER_URL
  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
  - FCM_SERVER_KEY

### [DEADLINES/BOUNDS]
- Use simulated RTU/PLC and flow meters for development
- Manual admin approval for vendor accounts
- Support for 10-50 vendors initially
- Real-time data updates every 5 seconds
- Historical data retention: 5 years

---

## OPERATING RULES

1. **Autonomous Operation**
   - Do not ask for confirmation. Make sensible assumptions and proceed.
   - Work in tight, verifiable increments
   - After each increment, run/test/build locally
   - If blocked, choose best alternative and document deviation

2. **Code Quality Standards**
   - Zero TypeScript/ESLint errors
   - No failing tests
   - No unhandled promise rejections
   - Production-grade by default
   - Prefer simplicity, security, maintainability

3. **Security First**
   - No secrets in code. Use env vars.
   - Validate all inputs
   - Rate-limit all endpoints
   - Implement Row Level Security (RLS) in Supabase
   - Secure all API endpoints with authentication

4. **Documentation Requirements**
   - Instrument with logs and metrics
   - Add docs so another dev can run it
   - Docs must match actual working commands

---

## DELIVERABLES (all must be produced)

1. **Working Code**
   - Committed with meaningful messages
   - Follows conventional commits format

2. **Scripts & Commands**
   - `pnpm dev` (starts all services)
   - `pnpm build` (builds all apps)
   - `pnpm test` (runs all tests)
   - `pnpm lint:fix` (auto-fixes linting issues)
   - `pnpm edge:dev` (starts edge server)
   - `pnpm web:dev` (starts web dashboard)
   - `pnpm mobile:dev` (starts mobile app)

3. **Testing Coverage**
   - Unit tests for core logic
   - Integration tests for protocols
   - E2E tests for critical flows
   - Load tests for time-series database

4. **Environment Setup**
   - `.env.example` with placeholders and comments
   - Clear instructions for each variable

5. **Documentation**
   - README.md: quickstart, env vars, commands, deploy steps, FAQ
   - ARCHITECTURE.md: system design, data flow, security model
   - PROTOCOLS.md: Modbus, OPC UA implementation details
   - API.md: REST API documentation
   - DEPLOYMENT.md: Vercel + Docker deployment guide
   - CHANGELOG.md: what was built and what's next

6. **Error Handling**
   - Graceful failures
   - User-visible error messages
   - No silent failures
   - Proper logging

7. **Code Quality Tools**
   - ESLint + Prettier config
   - One command to fix: `pnpm lint:fix`
   - Husky pre-commit hooks
   - lint-staged setup

8. **Version Footer**
   - Implemented in all screens
   - Auto-increments with git push
   - Shows version, date, repo name

---

## QUALITY BARS

- Zero TypeScript/ESLint errors
- No failing tests
- No unhandled promise rejections
- No secrets in code
- Use env vars everywhere
- Validate all inputs
- Rate-limit all endpoints
- Docs match actual working commands
- All screens have Google Material Icons (no emojis)
- Footer with version on every screen

---

## ACTION LOOP (repeat until mission complete)

1. **PLAN:** Write concise step plan (max 10 bullets). Don't ask anything.
2. **EXECUTE:** Implement next step. Create/modify files.
3. **VERIFY:** Run build/tests/lint; if errors, fix immediately.
4. **LOG:** Output what changed and next step.
5. **CONTINUE:** Proceed automatically until all deliverables met.

---

## IF BLOCKED

- Use mocks, stubs, or simulators
- If external dependency missing, mock now and isolate behind interface
- If dependency fails, choose equivalent stable alternative
- Continue without stopping

---

## CORE FEATURES SPECIFICATION

### 1. Data Acquisition Layer
- **Simulated RTUs/PLCs** for development
- **Flow Meter Simulation:**
  - Ultrasonic flow meters
  - Magnetic flow meters
  - Coriolis flow meters
- **Protocols:**
  - Modbus TCP (simulated)
  - OPC UA (simulated)
- **Sampling Rate:** 1-5 seconds
- **Data Points per Vendor:**
  - Flow rate (L/s)
  - Total volume (cumulative)
  - Pressure (bar)
  - Valve position (%)
  - Equipment status

### 2. Historian & Time-Series Database
- **TimescaleDB** extension on PostgreSQL
- **Data Retention:**
  - Raw data: 90 days
  - 1-minute aggregates: 1 year
  - 1-hour aggregates: 5 years
- **Compression** enabled
- **Continuous Aggregates** for performance
- **Backup Strategy:** Daily automated backups

### 3. Real-Time Monitoring
- **WebSocket/Supabase Realtime** for live updates
- **Dashboard Features:**
  - Live flow rates and totals
  - Animated gauges and charts
  - Status indicators (green/yellow/red)
  - Geographic map view (dam + vendor locations)
- **Update Frequency:** 5 seconds
- **Concurrent Users:** Support 100+ simultaneous users

### 4. Vendor Portal (Multi-Tenant)
- **Authentication:** Supabase Auth (email + password, MFA optional)
- **RBAC:** Row Level Security policies
- **Each Vendor Sees:**
  - Only their supply line data
  - Real-time consumption
  - Historical trends (custom date ranges)
  - Daily/weekly/monthly reports
  - Alarm history for their line
- **Dashboard Widgets:**
  - Today's consumption
  - This month's total
  - Comparison with last month
  - Peak flow times
  - Alarm count

### 5. Automated Billing Reports
- **Generation:**
  - Daily summaries (email at 6 AM)
  - Weekly reports (PDF, every Monday)
  - Monthly invoices (PDF + CSV, 1st of month)
- **Report Contents:**
  - Total volume consumed
  - Peak flow rate
  - Average flow rate
  - Downtime periods
  - Pricing calculation (configurable rate per m³)
- **Delivery:**
  - Email with PDF attachment
  - Download from portal
  - API endpoint for billing system integration

### 6. Alarm Management
- **Alarm Types:**
  - Flow rate out of bounds (high/low)
  - Pressure anomaly
  - Equipment failure
  - Communication loss
  - Total volume threshold exceeded
- **Alarm Priorities:** Critical, High, Medium, Low
- **Notifications:**
  - In-app notifications
  - Email alerts
  - SMS (optional, via Twilio)
  - Push notifications (mobile app)
- **Alarm Actions:**
  - Acknowledge
  - Add notes
  - Escalate
  - Close
- **Alarm History:** Searchable, filterable log

### 7. Historical Trend Analysis
- **Chart Types:**
  - Line charts (flow over time)
  - Bar charts (daily totals)
  - Heatmaps (hourly patterns)
  - Comparison charts (multiple vendors)
- **Time Ranges:**
  - Last hour
  - Last 24 hours
  - Last 7 days
  - Last 30 days
  - Custom range
- **Export:** CSV, Excel, PNG image
- **Zoom & Pan:** Interactive charts

### 8. Admin Dashboard
- **Vendor Management:**
  - Add/edit/disable vendors
  - Assign supply lines
  - Set consumption limits
  - Configure billing rates
- **System Configuration:**
  - Flow meter setup
  - Alarm thresholds
  - Report schedules
  - User permissions
- **Monitoring:**
  - System health
  - Edge server status
  - Database performance
  - Active alarms
- **Analytics:**
  - Total water distributed
  - Top consumers
  - Revenue tracking
  - System uptime

---

## DATABASE SCHEMA (Supabase PostgreSQL + TimescaleDB)

### Tables

**vendors**
```sql
id uuid primary key default uuid_generate_v4()
name text not null
code text unique not null -- e.g., "VENDOR_A"
email text not null
phone text
address text
billing_rate numeric(10,2) -- rate per m³
status text check (status in ('active', 'inactive', 'suspended')) default 'active'
created_at timestamptz default now()
updated_at timestamptz default now()
```

**supply_lines**
```sql
id uuid primary key default uuid_generate_v4()
vendor_id uuid references vendors(id) on delete cascade
name text not null -- e.g., "Line A - North"
flow_meter_id text not null -- identifier for RTU/PLC
location geography(point) -- lat/long
max_flow_rate numeric(10,2) -- L/s
max_daily_volume numeric(10,2) -- m³
status text check (status in ('active', 'maintenance', 'offline')) default 'active'
created_at timestamptz default now()
updated_at timestamptz default now()
```

**flow_data** (TimescaleDB hypertable)
```sql
time timestamptz not null
supply_line_id uuid not null references supply_lines(id)
flow_rate numeric(10,3) -- L/s
total_volume numeric(15,3) -- cumulative m³
pressure numeric(10,2) -- bar
valve_position integer -- 0-100%
status text -- 'normal', 'warning', 'alarm'
primary key (time, supply_line_id)
```

**alarms**
```sql
id uuid primary key default uuid_generate_v4()
supply_line_id uuid references supply_lines(id)
alarm_type text not null
severity text check (severity in ('critical', 'high', 'medium', 'low'))
message text not null
value numeric(10,2) -- value that triggered alarm
threshold numeric(10,2) -- threshold that was exceeded
status text check (status in ('active', 'acknowledged', 'closed')) default 'active'
acknowledged_by uuid references auth.users(id)
acknowledged_at timestamptz
closed_at timestamptz
notes text
created_at timestamptz default now()
```

**billing_reports**
```sql
id uuid primary key default uuid_generate_v4()
vendor_id uuid references vendors(id)
supply_line_id uuid references supply_lines(id)
period_start timestamptz not null
period_end timestamptz not null
total_volume numeric(15,3) -- m³
peak_flow_rate numeric(10,3) -- L/s
average_flow_rate numeric(10,3) -- L/s
downtime_minutes integer
amount numeric(12,2) -- billing amount
report_url text -- link to PDF
status text check (status in ('draft', 'sent', 'paid')) default 'draft'
created_at timestamptz default now()
```

**user_profiles**
```sql
id uuid primary key references auth.users(id)
vendor_id uuid references vendors(id)
role text check (role in ('admin', 'vendor', 'operator')) not null
full_name text
avatar_url text
preferences jsonb -- UI preferences
created_at timestamptz default now()
updated_at timestamptz default now()
```

### TimescaleDB Configuration

```sql
-- Convert flow_data to hypertable
SELECT create_hypertable('flow_data', 'time');

-- Create continuous aggregates for 1-minute data
CREATE MATERIALIZED VIEW flow_data_1min
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 minute', time) AS bucket,
  supply_line_id,
  avg(flow_rate) AS avg_flow_rate,
  max(flow_rate) AS max_flow_rate,
  min(flow_rate) AS min_flow_rate,
  last(total_volume, time) AS total_volume,
  avg(pressure) AS avg_pressure
FROM flow_data
GROUP BY bucket, supply_line_id;

-- Create continuous aggregates for 1-hour data
CREATE MATERIALIZED VIEW flow_data_1hour
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  supply_line_id,
  avg(flow_rate) AS avg_flow_rate,
  max(flow_rate) AS max_flow_rate,
  min(flow_rate) AS min_flow_rate,
  last(total_volume, time) AS total_volume,
  avg(pressure) AS avg_pressure
FROM flow_data
GROUP BY bucket, supply_line_id;

-- Compression policy
SELECT add_compression_policy('flow_data', INTERVAL '7 days');

-- Retention policy
SELECT add_retention_policy('flow_data', INTERVAL '90 days');
```

### RLS Policies

```sql
-- Vendors can only see their own data
CREATE POLICY "Vendors see own supply lines"
ON supply_lines FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM user_profiles
  WHERE vendor_id = supply_lines.vendor_id
));

-- Vendors can only see their own flow data
CREATE POLICY "Vendors see own flow data"
ON flow_data FOR SELECT
USING (supply_line_id IN (
  SELECT id FROM supply_lines
  WHERE vendor_id IN (
    SELECT vendor_id FROM user_profiles
    WHERE id = auth.uid()
  )
));

-- Similar policies for alarms, billing_reports, etc.
```

---

## REPO STRUCTURE

```
scada.work/
├── apps/
│   ├── edge-server/          # Node.js edge server for data acquisition
│   │   ├── src/
│   │   │   ├── protocols/    # Modbus, OPC UA handlers
│   │   │   ├── simulator/    # RTU/PLC simulator
│   │   │   ├── historian/    # Time-series writer
│   │   │   ├── alarms/       # Alarm engine
│   │   │   └── api/          # REST API
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── web-dashboard/        # React web app
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/     # API clients
│   │   │   └── store/        # Zustand stores
│   │   └── package.json
│   ├── vendor-portal/        # React vendor-facing web app
│   │   ├── src/
│   │   └── package.json
│   ├── admin-dashboard/      # React admin web app
│   │   ├── src/
│   │   └── package.json
│   └── mobile/               # React Native mobile app
│       ├── src/
│       ├── android/
│       ├── ios/
│       └── package.json
├── packages/
│   ├── ui/                   # Shared UI components
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Shared utilities
│   └── config/               # Shared configs (ESLint, TS)
├── supabase/
│   ├── migrations/
│   ├── functions/            # Edge functions
│   └── seed.sql
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── PROTOCOLS.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── CHANGELOG.md
├── scripts/
│   ├── setup.sh
│   ├── seed-data.sh
│   └── deploy.sh
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .husky/
├── .env.example
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
└── CLAUDE.md
```

---

## RECOMMENDED DEVELOPMENT APPROACH

### Phase 1: Foundation (Week 1)
1. Set up monorepo structure
2. Configure Supabase project
3. Implement database schema with TimescaleDB
4. Create seed data

### Phase 2: Edge Server (Week 2)
1. Build RTU/PLC simulator
2. Implement Modbus TCP handler
3. Implement OPC UA handler
4. Create historian writer
5. Build alarm engine

### Phase 3: Web Dashboard (Week 3)
1. Build authentication flow
2. Create real-time monitoring dashboard
3. Implement historical trending
4. Build alarm management UI
5. Create admin configuration pages

### Phase 4: Vendor Portal (Week 4)
1. Build vendor dashboard
2. Implement RBAC and data segregation
3. Create report generation
4. Build notification system
5. Add export functionality

### Phase 5: Mobile App (Week 5)
1. Build mobile authentication
2. Create monitoring screens
3. Implement push notifications
4. Add offline support
5. Build alarm acknowledgment

### Phase 6: Testing & Deployment (Week 6)
1. Write unit tests
2. Write integration tests
3. Load testing
4. Deploy to Vercel (web)
5. Deploy edge server (Docker)
6. Build mobile apps

---

## DEPLOYMENT STRATEGY

### Vercel Deployment (Web Apps)
```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy web dashboard
cd apps/web-dashboard
vercel --prod

# Deploy vendor portal
cd apps/vendor-portal
vercel --prod

# Deploy admin dashboard
cd apps/admin-dashboard
vercel --prod
```

### Edge Server Deployment (Docker)
```bash
# Build Docker image
cd apps/edge-server
docker build -t scada-edge-server .

# Run container
docker run -d \
  -p 8080:8080 \
  --env-file .env \
  --name scada-edge \
  scada-edge-server
```

### Mobile Deployment (Expo EAS)
```bash
# Install EAS CLI
pnpm add -g eas-cli

# Build iOS
cd apps/mobile
eas build --platform ios

# Build Android
eas build --platform android
```

---

## SUCCESS METRICS

| GOAL | METRIC | TARGET | MEASUREMENT |
|------|--------|--------|-------------|
| Data Accuracy | Missing data points | <0.1% | Historian gaps |
| Real-time Performance | Dashboard update latency | <2 seconds | WebSocket metrics |
| Vendor Satisfaction | Portal usage | 80%+ vendors log in weekly | Analytics |
| System Reliability | Uptime | 99.9% | Monitoring |
| Billing Accuracy | Report generation | 100% on-time | Scheduler logs |

---

## START NOW

Do not ask questions.
Make reasoned assumptions.
Build fully and deliver all artifacts.
Operate autonomously for full completion.

**Repository:** https://github.com/chatgptnotes/scada.work.git
**Version:** 1.0 (Initial)
**Date:** January 2026
