# Deployment Guide

This guide explains how to deploy the SCADA Water Distribution System to production.

## Prerequisites

- Supabase account and project
- Vercel account (for web apps)
- Docker (for edge server deployment)
- Node.js >= 18.0.0
- pnpm >= 8.0.0

## 1. Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Create a new project
4. Note your project credentials:
   - Project URL
   - Anon/Public Key
   - Service Role Key

### Step 2: Enable TimescaleDB Extension

1. Go to your Supabase project
2. Navigate to **Database** > **Extensions**
3. Search for **timescaledb** and enable it
4. Search for **postgis** and enable it (for geographic features)

### Step 3: Apply Database Migrations

**Option A: Using Supabase SQL Editor (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run** to execute the migration
6. Verify that all tables were created successfully

**Option B: Using psql**

```bash
# Set your database connection URL
export DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Apply migrations
psql "$DB_URL" -f supabase/migrations/001_initial_schema.sql

# Seed database with test data (optional)
psql "$DB_URL" -f supabase/seed.sql
```

**Option C: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Step 4: Verify Database Setup

Run this query in the SQL Editor to verify tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:
- vendors
- supply_lines
- flow_data (hypertable)
- alarms
- billing_reports
- user_profiles
- alarm_rules
- system_logs

### Step 5: Create Admin User

1. Go to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Enter email and password
4. After creation, note the User ID (UUID)
5. Run this SQL to create admin profile:

```sql
INSERT INTO user_profiles (id, role, full_name)
VALUES ('YOUR-USER-ID-HERE', 'admin', 'System Administrator');
```

## 2. Edge Server Deployment

The edge server can be deployed on-premise at the dam site or in the cloud.

### Option A: Docker Deployment (Recommended)

**Step 1: Create Dockerfile**

Already created at `apps/edge-server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/edge-server/package.json ./apps/edge-server/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/edge-server ./apps/edge-server
COPY packages/types ./packages/types

# Build
WORKDIR /app/apps/edge-server
RUN pnpm build

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "dist/index.js"]
```

**Step 2: Build Docker Image**

```bash
cd apps/edge-server
docker build -t scada-edge-server:1.0 .
```

**Step 3: Run Container**

```bash
docker run -d \
  -p 8080:8080 \
  -e SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  -e SIMULATOR_ENABLED="false" \
  -e MODBUS_ENABLED="true" \
  -e MODBUS_HOST="192.168.1.100" \
  -e MODBUS_PORT="502" \
  --name scada-edge \
  --restart unless-stopped \
  scada-edge-server:1.0
```

**Step 4: Using Docker Compose**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  edge-server:
    build: ./apps/edge-server
    container_name: scada-edge
    ports:
      - "8080:8080"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SIMULATOR_ENABLED=${SIMULATOR_ENABLED}
      - DATA_ACQUISITION_INTERVAL=5000
      - HISTORIAN_BATCH_SIZE=100
      - ALARM_CHECK_INTERVAL=5000
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Run with:

```bash
docker-compose up -d
```

### Option B: Direct Node.js Deployment

```bash
# Clone repository
git clone https://github.com/chatgptnotes/scada.work.git
cd scada.work

# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Build edge server
pnpm edge:build

# Start with PM2 (for production)
npm install -g pm2
pm2 start apps/edge-server/dist/index.js --name scada-edge

# Save PM2 config
pm2 save
pm2 startup
```

### Verify Edge Server

Test the edge server is running:

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-01-12T15:00:00.000Z",
  "uptime": 123.45,
  "version": "1.0.0"
}
```

## 3. Web Applications Deployment (Vercel)

### Prerequisites

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

### Deploy Web Dashboard

```bash
cd apps/web-dashboard

# First deployment (follow prompts)
vercel

# Production deployment
vercel --prod
```

### Deploy Vendor Portal

```bash
cd apps/vendor-portal
vercel --prod
```

### Deploy Admin Dashboard

```bash
cd apps/admin-dashboard
vercel --prod
```

### Environment Variables on Vercel

For each deployment, add these environment variables in Vercel dashboard:

1. Go to your project on Vercel
2. Navigate to **Settings** > **Environment Variables**
3. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `NEXT_PUBLIC_EDGE_SERVER_URL`: Your edge server URL (e.g., http://your-server:8080)

## 4. Mobile App Deployment (Expo)

### Prerequisites

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login
```

### Configure EAS

```bash
cd apps/mobile

# Initialize EAS
eas build:configure
```

### Build iOS App

```bash
# Build for iOS
eas build --platform ios --profile production

# Or submit to App Store
eas submit --platform ios
```

### Build Android App

```bash
# Build for Android
eas build --platform android --profile production

# Or submit to Google Play
eas submit --platform android
```

## 5. Production Configuration

### Edge Server Production Settings

Update `.env` for production:

```bash
# Disable simulator
SIMULATOR_ENABLED=false

# Enable real protocols
MODBUS_ENABLED=true
MODBUS_HOST=192.168.1.100
MODBUS_PORT=502

OPCUA_ENABLED=true
OPCUA_ENDPOINT=opc.tcp://192.168.1.101:4840

# Production logging
LOG_LEVEL=warn
NODE_ENV=production

# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security
JWT_SECRET=generate-a-strong-random-string-here
```

### Database Backup

Set up automated backups:

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump "$DB_URL" > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

# Upload to S3 or your backup storage
aws s3 cp "${BACKUP_FILE}.gz" s3://your-bucket/backups/
EOF

chmod +x backup.sh

# Schedule with cron (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Monitoring and Logging

**Option 1: Using Sentry**

```bash
npm install @sentry/node

# Add to edge server index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

**Option 2: Using Logflare (Supabase integration)**

1. Enable Logflare in Supabase dashboard
2. View logs in Supabase Logs section

### SSL/TLS Configuration

For production edge server with HTTPS:

```bash
# Use nginx as reverse proxy
sudo apt install nginx

# Configure nginx
cat > /etc/nginx/sites-available/scada << 'EOF'
server {
    listen 443 ssl;
    server_name scada.yourdomain.com;

    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/scada /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## 6. Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] TimescaleDB extension enabled
- [ ] Admin user created
- [ ] Edge server running and accessible
- [ ] Simulator disabled in production
- [ ] Real Modbus/OPC UA devices connected (if applicable)
- [ ] Web apps deployed to Vercel
- [ ] Mobile app built and deployed
- [ ] Environment variables configured
- [ ] SSL/TLS configured
- [ ] Backup script scheduled
- [ ] Monitoring/logging configured
- [ ] Test vendor login and data segregation
- [ ] Test alarm notifications
- [ ] Test report generation
- [ ] Load testing completed

## 7. Troubleshooting

### Edge Server Won't Start

```bash
# Check logs
docker logs scada-edge

# Or with PM2
pm2 logs scada-edge

# Common issues:
# 1. Missing environment variables
# 2. Cannot connect to Supabase
# 3. Port 8080 already in use
```

### Database Connection Issues

```bash
# Test connection
psql "$DB_URL" -c "SELECT version();"

# Check Supabase project status
# Go to https://supabase.com/dashboard

# Verify service role key is correct
```

### Web App Not Loading

```bash
# Check Vercel deployment logs
vercel logs

# Verify environment variables
vercel env ls

# Test edge server connectivity
curl https://your-edge-server/health
```

## 8. Scaling Considerations

### Edge Server Scaling

For multiple dam sites:

1. Deploy one edge server per site
2. All edge servers write to the same Supabase database
3. Use unique supply_line_id per site
4. Configure load balancing for API requests

### Database Scaling

TimescaleDB optimizations:

```sql
-- Adjust chunk size based on data volume
SELECT set_chunk_time_interval('flow_data', INTERVAL '1 day');

-- Add more aggressive compression
SELECT add_compression_policy('flow_data', INTERVAL '1 day');

-- Adjust continuous aggregate policies
SELECT alter_continuous_aggregate_policy('flow_data_1min',
  start_offset => INTERVAL '1 hour',
  end_offset => INTERVAL '30 seconds',
  schedule_interval => INTERVAL '30 seconds');
```

### High Availability

Set up redundant edge servers:

```yaml
# docker-compose-ha.yml
version: '3.8'

services:
  edge-server-1:
    build: ./apps/edge-server
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  edge-server-2:
    build: ./apps/edge-server
    ports:
      - "8081:8080"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - edge-server-1
      - edge-server-2
```

---

**Version:** 1.0
**Date:** January 2026
**Repository:** scada.work
