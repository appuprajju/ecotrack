#!/usr/bin/env bash

# ==============================================================================
# EcoTrack AI Platform - GCP Provisioning & Deployment Script
# ==============================================================================

set -euo pipefail

# Configuration Settings
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
INSTANCE_NAME="ecotrack-db"
DB_NAME="ecotrackdb"
DB_USER="ecouser"
DB_PASSWORD="EcoPasswordSecure2026!"
REDIS_INSTANCE="ecotrack-redis"
SECRET_NAME="ecotrack-secrets"
REPOSITORY_NAME="ecotrack-repo"

# Database Configuration Source
DATABASE_URL=${DATABASE_URL:-""}
USE_SUPABASE=false

if [ -n "$DATABASE_URL" ]; then
  echo "Using database connection string from environment: $DATABASE_URL"
  USE_SUPABASE=true
else
  echo "Select your database hosting provider:"
  echo "  1) Google Cloud SQL (provision new GCP Postgres instance)"
  echo "  2) Supabase (or other external PostgreSQL connection string)"
  read -rp "Enter choice [1-2]: " DB_CHOICE

  if [ "$DB_CHOICE" = "2" ]; then
    read -rp "Enter your Supabase/PostgreSQL connection string (DATABASE_URL): " DATABASE_URL
    if [ -z "$DATABASE_URL" ]; then
      echo "Error: Connection string cannot be empty when using Supabase."
      exit 1
    fi
    USE_SUPABASE=true
  fi
fi

echo "------------------------------------------------------------"
echo "Initializing GCP Provisioning for project: $PROJECT_ID"
echo "------------------------------------------------------------"

# 1. Enable Core APIs
echo "Enabling required Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  redis.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  vpcaccess.googleapis.com

# 2. Create Artifact Registry repository
echo "Creating Artifact Registry repository: $REPOSITORY_NAME..."
gcloud artifacts repositories create "$REPOSITORY_NAME" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Docker Repository for EcoTrack Platform" || true

if [ "$USE_SUPABASE" = false ]; then
  # 3. Provision Cloud SQL PostgreSQL database
  echo "Creating Cloud SQL PostgreSQL Instance (Postgres 15)..."
  gcloud sql instances create "$INSTANCE_NAME" \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup || true

  echo "Setting database user credentials..."
  gcloud sql users create "$DB_USER" \
    --instance="$INSTANCE_NAME" \
    --password="$DB_PASSWORD" || true

  echo "Creating primary database schema..."
  gcloud sql databases create "$DB_NAME" \
    --instance="$INSTANCE_NAME" || true

  # 4. Provision Memorystore Redis Cache
  echo "Creating Google Memorystore Redis instance..."
  gcloud redis instances create "$REDIS_INSTANCE" \
    --size=1 \
    --region="$REGION" \
    --redis-version=redis_7_0 || true

  REDIS_IP=$(gcloud redis instances describe "$REDIS_INSTANCE" --region="$REGION" --format="value(host)")
  echo "Redis Instance IP: $REDIS_IP"
  REDIS_URL="redis://$REDIS_IP:6379"
  DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
else
  echo "Using Supabase database. Skipping GCP Cloud SQL and Memorystore Redis provisioning."
  REDIS_URL=""
fi

# 5. Configure Secret Manager Secrets
echo "Creating application secrets in Secret Manager..."
JWT_ACCESS_SECRET="eco_track_access_secret_key_$(openssl rand -hex 16)"
JWT_REFRESH_SECRET="eco_track_refresh_secret_key_$(openssl rand -hex 16)"

SECRET_JSON="{\"DATABASE_URL\":\"$DATABASE_URL\",\"JWT_ACCESS_SECRET\":\"$JWT_ACCESS_SECRET\",\"JWT_REFRESH_SECRET\":\"$JWT_REFRESH_SECRET\",\"REDIS_URL\":\"$REDIS_URL\"}"

gcloud secrets create "$SECRET_NAME" \
  --replication-policy="automatic" || true

echo -n "$SECRET_JSON" | gcloud secrets versions add "$SECRET_NAME" --data-file=-

# 6. Build and Submit Containers
echo "Submitting docker container images to Artifact Registry..."
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_GCP_REGION="$REGION",_REGISTRY_NAME="$REPOSITORY_NAME",_DATABASE_URL="$DATABASE_URL"

echo "------------------------------------------------------------"
echo "ECOTRACK AI PLATFORM HAS BEEN PROVISIONED SUCCESSFUL!"
echo "------------------------------------------------------------"
