# DevOps, Production Readiness & Disaster Recovery Plan

This document details the configuration, backup strategies, and rollback runbooks for hosting the EcoTrack AI Platform in production environments.

---

## High Availability Deployment Architecture

```
                 [ Google Cloud DNS ]
                         |
           [ Cloud CDN & Load Balancer ]
             |                       |
      (us-central1)            (europe-west1)
  [ Cloud Run Instance ]   [ Cloud Run Instance ]
             \                       /
              \                     /
            [ Serverless VPC Access Connector ]
             |                       |
     [ Cloud SQL Primary ] <--> [ Cloud SQL Replica ]
```

### Infrastructure Components
1. **Google Cloud Run**: Hosts containerized applications in auto-scaling, serverless clusters (min instances: 1, max instances: 100).
2. **Cloud SQL (PostgreSQL)**: Fully-managed database with Multi-Zone high availability replication.
3. **Memorystore for Redis**: Caches calculated dashboard metrics to reduce database load.
4. **Secret Manager**: Securely stores database passwords, JWT signing secrets, and configuration credentials.

---

## Deployments and Rollbacks

### 1. Zero-Downtime Blue-Green Deployments
- Continuous integration is managed by the [ci-cd.yml](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/.github/workflows/ci-cd.yml) file.
- Cloud Run provisions a new container version (Green) alongside the running version (Blue).
- Cloud Run performs automated health checks against the `/health` API endpoint.
- Once checks pass, traffic is gradually migrated to the new container.

### 2. Immediate Rollback Runbook
If errors rise during a release, execute the following command to route traffic back to the previous stable release instantly:
```bash
# 1. Identify previous stable revision ID
gcloud run revisions list --service=ecotrack-backend --region=us-central1

# 2. Rollback traffic allocation (e.g. allocate 100% to version 'ecotrack-backend-v1')
gcloud run services update-traffic ecotrack-backend \
  --to-revisions=ecotrack-backend-v1=100 \
  --region=us-central1
```

---

## Disaster Recovery (DR) Plan

### 1. Database Backups
- **Automatic Backups**: Scheduled daily in Cloud SQL, keeping a 7-day retention period.
- **Point-in-Time Recovery (PITR)**: Enabled in Cloud SQL transaction logs. Allows database recovery down to a specific second.

### 2. Offsite Manual Backups Runbook
To create and save a secondary database snapshot to Cloud Storage:
```bash
# 1. Export database to SQL dump file in GCS bucket
gcloud sql export sql ecotrack-db gs://ecotrack-backups-bucket/db-manual-export-$(date +%F).sql \
  --database=ecotrackdb

# 3. Restore dump file to database
gcloud sql import sql ecotrack-db gs://ecotrack-backups-bucket/db-manual-export-2026-06-17.sql \
  --database=ecotrackdb --quiet
```

### 3. Recovery Time Objective (RTO) and Recovery Point Objective (RPO)
- **RTO (Target Restoration Time)**: Less than 15 minutes (using rapid DNS traffic redirection or database zone failover).
- **RPO (Maximum Target Data Loss)**: Less than 5 minutes (via write-ahead transaction log synchronization).
