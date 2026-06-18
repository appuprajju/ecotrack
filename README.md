# EcoTrack AI Platform

EcoTrack AI is a cloud-native sustainability platform designed to help users track, analyze, and reduce their carbon footprint. By combining Domain-Driven Design (DDD), clean architecture, local mathematical intelligence models, and modern user interfaces, EcoTrack AI delivers a premium tracking portal.

---

## Repository File Index

- **Backend Service (Node.js & TypeScript)**:
  - [package.json](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/backend/package.json): Script definitions and dependencies.
  - [Prisma Database Schema](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/backend/prisma/schema.prisma): PostgreSQL database mappings.
  - [Database Seed Script](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/backend/prisma/seed.ts): IPCC emission factors, challenges, and user seeds.
  - [Carbon Domain Service](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/backend/src/domain/carbon.ts): Carbon formulas and sustainability scoring rules.
  - [Carbon Intelligence Engine](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/backend/src/infrastructure/ai-engine.ts): Heuristic trend projection and goal success forecasting.
  - [API Routing Layer](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/backend/src/presentation/routes.ts): REST endpoints and controller orchestrators.
  - [Unit and Integration Tests](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/backend/tests/system.test.ts): Footprint calculations, scoring algorithms, and AI predictions verification tests.

- **Frontend Application (React & TypeScript & Vite)**:
  - [Vite Package Config](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/frontend/package.json): Asset compiling pipelines.
  - [Vite Node Configuration](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/frontend/vite.config.ts): Server port mappings and backend API proxy settings.
  - [Global CSS Stylesheet](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/frontend/src/index.css): Theme styling variables, layout variables, SVG canvas properties, and micro-animations.
  - [API Services Client](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/frontend/src/services/api.ts): Wrapper for client fetch calls.
  - [User Dashboard Portal](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/frontend/src/pages/Dashboard.tsx): Interactive SVG charts, circular progress, and AI actions page.
  - [Carbon Calculator Page](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/frontend/src/pages/Calculator.tsx): Sliding forms and historical journal entries table.
  - [Goal Tracker Portal](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/frontend/src/pages/Goals.tsx): Goal limits creator and carbon success probability forecaster.
  - [Admin Management Panel](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/frontend/src/pages/AdminConsole.tsx): Emission multiplier manager, user accounts listing, and security audit log logs.

- **Cloud & DevOps Configurations**:
  - [Docker Compose local launcher](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/docker-compose.yml): Coordinates database, caching, APIs, and client runtimes.
  - [GCP Cloud Build trigger config](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/cloudbuild.yaml): Remote compilation instructions.
  - [GCP Resource Setup script](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/deploy-gcp.sh): Shell script automating Cloud SQL, Secret Manager, Redis, and Cloud Run creation.
  - [GitHub Actions workflow](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/.github/workflows/ci-cd.yml): CI/CD pipelines.

- **Supporting Documentation**:
  - [REST API Specifications](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/docs/api.md): Parameters and payloads lists.
  - [Security Architecture & STRIDE Threat Model](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/docs/security.md): System audit trails, SQLi protections, and JWT lifecycle designs.
  - [WCAG 2.2 Accessibility Guidelines](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/docs/accessibility.md): Dynamic text sizing rules, keyboard navigation indexes, and visual contrast parameters.
  - [Production DevOps Handbooks](file:///C:/Users/appup/.gemini/antigravity-ide/scratch/ecotrack-ai-platform/docs/devops_readiness.md): Disaster recovery failovers, database exports, and blue-green revision rollbacks.

---

## Getting Started: Local Verification

To start all services locally, install Docker and launch:
```bash
# Start PostgreSQL database, Redis Cache, Backend API, and Frontend application
docker-compose up --build
```
This builds and links all servers:
- **Frontend App**: accessible at `http://localhost:3000`
- **Backend API**: running at `http://localhost:5000`
- **PostgreSQL Database**: exposed locally on port `5432`
- **Redis Cache**: bound to port `6379`

### Seeding Initial Data
Database schemas and initial factors are automatically configured inside docker. To seed the database manually, run:
```bash
cd backend
npm install
npm run prisma:generate
# Configure database URL inside your environment variables, then:
npm run prisma:migrate
npm run prisma:seed
```
Default administrator credentials:
- **Email**: `admin@ecotrack.ai`
- **Password**: `AdminPassword123!`

---

## Run Unit & Integration Tests

We use Jest to verify business formulas and algorithm projections:
```bash
cd backend
npm run test
```
The test suite validates:
- Carbon equivalent calculation outputs.
- CarbonIntelligenceEngine linear trend forecasting.
- Goal success probability curves.
- Outliers detection and personalized recommendation selection.
