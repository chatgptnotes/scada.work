#!/bin/bash

# Script to apply database migrations to Supabase

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
  exit 1
fi

# Extract database connection details
DB_HOST=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/\.supabase\.co//')
DB_URL="postgresql://postgres:Chindwada@1@db.${DB_HOST}.supabase.co:5432/postgres"

echo "Applying migrations to Supabase database..."
echo "Database: $DB_HOST"

# Apply migrations
for migration in supabase/migrations/*.sql; do
  echo "Applying migration: $migration"
  psql "$DB_URL" -f "$migration"
done

echo "Migrations applied successfully!"
echo ""
echo "Seeding database..."
psql "$DB_URL" -f supabase/seed.sql

echo "Database setup complete!"
