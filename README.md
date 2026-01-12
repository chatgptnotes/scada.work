# Water Distribution SCADA System

A comprehensive SCADA (Supervisory Control and Data Acquisition) system for managing dam water distribution to third-party vendors, inspired by Schneider Electric's EcoStruxure Geo SCADA Expert.

## Overview

This system provides real-time monitoring, automated billing, historical trend analysis, alarm management, and segregated vendor portals for water distribution management in the Nagpur region.

## Key Features

- **Real-Time Monitoring**: Live flow rates, pressure, and volume tracking
- **Multi-Vendor Support**: Segregated portals with RBAC for each vendor
- **Automated Billing**: Daily, weekly, and monthly consumption reports
- **Historical Trending**: Time-series analysis with up to 5 years of data retention
- **Alarm Management**: Configurable thresholds with multi-channel notifications
- **Mobile Access**: iOS and Android apps for remote monitoring
- **Hybrid Architecture**: Local edge server + cloud vendor portals

## Tech Stack

- **Backend**: Node.js, TypeScript, Express
- **Database**: Supabase (PostgreSQL + TimescaleDB)
- **Frontend**: React, TypeScript, TailwindCSS
- **Mobile**: React Native
- **Real-time**: Supabase Realtime, WebSocket
- **Protocols**: Modbus TCP, OPC UA (simulated for development)
- **Deployment**: Vercel (web), Docker (edge server), Expo EAS (mobile)

## Repository Structure

```
scada.work/
├── apps/
│   ├── edge-server/          # Data acquisition & protocol handlers
│   ├── web-dashboard/        # Main monitoring dashboard
│   ├── vendor-portal/        # Vendor-facing portal
│   ├── admin-dashboard/      # Admin configuration
│   └── mobile/               # React Native mobile app
├── packages/
│   ├── ui/                   # Shared UI components
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Shared utilities
│   └── config/               # Shared configs
├── supabase/
│   ├── migrations/           # Database migrations
│   ├── functions/            # Edge functions
│   └── seed.sql              # Seed data
├── docs/                     # Documentation
└── scripts/                  # Utility scripts
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Supabase account
- Docker (for edge server deployment)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/chatgptnotes/scada.work.git
cd scada.work
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your Supabase credentials and other configurations
```

### 4. Set up Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Seed database (optional)
supabase db seed
```

### 5. Start development servers

```bash
# Start all services
pnpm dev

# Or start individual services:
pnpm edge:dev      # Edge server (port 8080)
pnpm web:dev       # Web dashboard (port 3000)
pnpm vendor:dev    # Vendor portal (port 3001)
pnpm admin:dev     # Admin dashboard (port 3002)
pnpm mobile:dev    # Mobile app (Expo)
```

## Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all apps for production
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all code
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Format code with Prettier

## Environment Variables

See `.env.example` for all available environment variables. Key variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- `EDGE_SERVER_URL` - Edge server URL (default: http://localhost:8080)
- `SIMULATOR_ENABLED` - Enable RTU/PLC simulator for development

## Testing

### Running the system locally

1. **Edge Server**: http://localhost:8080
   - REST API: http://localhost:8080/api
   - Health check: http://localhost:8080/health
   - Simulator dashboard: http://localhost:8080/simulator

2. **Web Dashboard**: http://localhost:3000
   - Login with admin credentials
   - View real-time monitoring

3. **Vendor Portal**: http://localhost:3001
   - Login with vendor credentials
   - View consumption data

4. **Admin Dashboard**: http://localhost:3002
   - Configure vendors and supply lines
   - Manage alarms and reports

5. **Mobile App**: Expo Go
   - Scan QR code from terminal
   - Test on physical device or emulator

## Deployment

### Deploy Web Apps to Vercel

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

### Deploy Edge Server (Docker)

```bash
cd apps/edge-server

# Build image
docker build -t scada-edge-server .

# Run container
docker run -d \
  -p 8080:8080 \
  --env-file .env \
  --name scada-edge \
  scada-edge-server

# Or use docker-compose
docker-compose up -d
```

### Deploy Mobile Apps

```bash
cd apps/mobile

# Install EAS CLI
pnpm add -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

## Architecture

### System Components

1. **Edge Server** (Node.js)
   - Data acquisition from RTU/PLCs
   - Protocol handlers (Modbus, OPC UA)
   - Time-series data writing
   - Alarm detection and triggering
   - Local historian

2. **Cloud Database** (Supabase)
   - PostgreSQL with TimescaleDB extension
   - Real-time subscriptions
   - Row Level Security (RLS)
   - Automated backups

3. **Web Applications** (React)
   - Web dashboard (operators)
   - Vendor portal (vendors)
   - Admin dashboard (administrators)

4. **Mobile Application** (React Native)
   - iOS and Android support
   - Real-time monitoring
   - Push notifications
   - Offline support

### Data Flow

```
RTU/PLC → Edge Server → Supabase → Web/Mobile Apps
              ↓
          Local Historian
              ↓
          Alarm Engine
              ↓
        Notifications
```

## Database Schema

The system uses PostgreSQL with TimescaleDB for efficient time-series data storage. Key tables:

- `vendors` - Vendor information
- `supply_lines` - Water supply lines linked to vendors
- `flow_data` - Time-series flow meter data (hypertable)
- `alarms` - Active and historical alarms
- `billing_reports` - Generated consumption reports
- `user_profiles` - User accounts and roles

See `supabase/migrations/` for complete schema.

## Security

- **Authentication**: Supabase Auth with email/password and MFA
- **Authorization**: Row Level Security (RLS) policies
- **Data Segregation**: Vendors can only access their own data
- **API Security**: Rate limiting on all endpoints
- **Environment Variables**: No secrets in code
- **HTTPS**: All communications encrypted

## Testing the Vendor Portal

### Test Vendors

After seeding the database, you can log in with these test accounts:

- **Vendor A**: vendora@example.com / password123
- **Vendor B**: vendorb@example.com / password123
- **Vendor C**: vendorc@example.com / password123

Each vendor can only see their own supply line data.

### Admin Account

- **Admin**: admin@scada.work / admin123

## Monitoring and Logs

- **Application Logs**: stdout/stderr in JSON format
- **Edge Server Metrics**: http://localhost:8080/metrics
- **Database Performance**: Supabase dashboard
- **Error Tracking**: Console logs (integrate Sentry for production)

## Troubleshooting

### Edge server not connecting to database

- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify network connectivity
- Check Supabase project is active

### No data appearing in dashboard

- Verify edge server is running: http://localhost:8080/health
- Check `SIMULATOR_ENABLED=true` in .env
- Check browser console for errors

### Mobile app not connecting

- Update `EDGE_SERVER_URL` to use your IP (not localhost)
- Check firewall allows connections
- Verify Expo Go is installed

## FAQ

**Q: Can I use real Modbus/OPC UA devices?**
A: Yes. Set `SIMULATOR_ENABLED=false` and configure `MODBUS_HOST`, `MODBUS_PORT`, and `OPCUA_ENDPOINT` in .env.

**Q: How do I add a new vendor?**
A: Use the admin dashboard to create a vendor account, or insert directly into the `vendors` table.

**Q: How much data can the system handle?**
A: With TimescaleDB, the system can handle millions of data points per day. Compression and retention policies keep database size manageable.

**Q: Is this production-ready?**
A: The core functionality is production-ready. For critical infrastructure, conduct thorough testing, add redundancy, and implement proper security hardening.

**Q: Can I deploy on-premise?**
A: Yes. Self-host Supabase using Docker, and deploy all apps on your infrastructure.

## Contributing

This is an autonomous project. See CLAUDE.md for development guidelines.

## License

MIT License (or specify your license)

## Support

For issues and questions:
- GitHub Issues: https://github.com/chatgptnotes/scada.work/issues
- Documentation: See `docs/` folder

---

**Version:** 1.2
**Date:** January 2026
**Repository:** scada.work
**Live Demo:** https://www.scada.work
**Production URL:** https://scada-work-ag2z0cztt-chatgptnotes-6366s-projects.vercel.app
