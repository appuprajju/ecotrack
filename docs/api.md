# EcoTrack AI API Documentation

All API requests require the base path `/api`. Authenticated endpoints require a `Bearer <token>` payload in the `Authorization` request header.

---

## Authentication Endpoints

### 1. Register Account
* **Endpoint**: `POST /api/auth/register`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "email": "user@domain.com",
  "password": "PasswordString123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "country": "United States"
}
```
* **Response (201 Created)**:
```json
{
  "message": "User registered successfully.",
  "user": {
    "id": "uuid-v4-string",
    "email": "user@domain.com",
    "firstName": "Jane",
    "role": "USER"
  }
}
```

### 2. Login
* **Endpoint**: `POST /api/auth/login`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "email": "user@domain.com",
  "password": "PasswordString123!"
}
```
* **Response (200 OK)**:
```json
{
  "user": {
    "id": "uuid-v4-string",
    "email": "user@domain.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "USER",
    "country": "United States"
  },
  "tokens": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### 3. Refresh Access Token
* **Endpoint**: `POST /api/auth/refresh`
* **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```
* **Response (200 OK)**:
```json
{
  "accessToken": "new-eyJhbGciOi...",
  "refreshToken": "new-eyJhbGciOi..."
}
```

---

## Carbon Tracking Endpoints

### 1. Submit Carbon Entry
* **Endpoint**: `POST /api/carbon/log`
* **Headers**: `Authorization: Bearer <Access_Token>`
* **Request Body**:
```json
{
  "category": "transportation",
  "subCategory": "car",
  "value": 25.5
}
```
* **Response (201 Created)**:
```json
{
  "id": "uuid-log-id",
  "userId": "uuid-v4-string",
  "category": "transportation",
  "subCategory": "car",
  "value": 25.5,
  "unit": "km",
  "co2EquivalentKg": 4.59,
  "loggedAt": "2026-06-17T23:55:00.000Z",
  "createdAt": "2026-06-17T23:55:00.000Z"
}
```

### 2. Get Activity Journal
* **Endpoint**: `GET /api/carbon/logs`
* **Headers**: `Authorization: Bearer <Access_Token>`
* **Response (200 OK)**:
```json
[
  {
    "id": "uuid-log-id",
    "category": "transportation",
    "subCategory": "car",
    "value": 25.5,
    "unit": "km",
    "co2EquivalentKg": 4.59,
    "loggedAt": "2026-06-17T23:55:00.000Z"
  }
]
```

### 3. Delete Log Entry
* **Endpoint**: `DELETE /api/carbon/logs/:id`
* **Headers**: `Authorization: Bearer <Access_Token>`
* **Response (200 OK)**:
```json
{
  "message": "Carbon log deleted successfully."
}
```

---

## Analytics & AI Insights

### 1. Get Dashboard Analytics
* **Endpoint**: `GET /api/analytics/dashboard`
* **Headers**: `Authorization: Bearer <Access_Token>`
* **Response (200 OK)**:
```json
{
  "sustainabilityScore": 78,
  "totalEmissionsKg": 250.4,
  "byCategory": {
    "transportation": 120.2,
    "energy": 80.0,
    "food": 35.2,
    "waste": 12.0,
    "water": 3.0
  },
  "recentLogs": [],
  "weeklyTrend": [
    { "day": "Mon", "co2": 15.4 }
  ],
  "historicalComparisons": [
    { "month": "Jun 26", "co2": 250.4 }
  ]
}
```

### 2. Get Recommendations Feed
* **Endpoint**: `GET /api/recommendations`
* **Headers**: `Authorization: Bearer <Access_Token>`
* **Response (200 OK)**:
```json
[
  {
    "id": "rec_1",
    "title": "Adopt Public Transit Commuting",
    "description": "Swap 3 drives a week for train or bus commuting to cut transportation footprint.",
    "category": "transportation",
    "impactLevel": "HIGH",
    "estimatedCo2ReductionKg": 45.5,
    "difficulty": "MODERATE",
    "costSavingsEst": 15.0
  }
]
```

---

## Goals & Challenges

### 1. Create Goals
* **Endpoint**: `POST /api/goals`
* **Request Body**:
```json
{
  "title": "Reduce travel carbon",
  "category": "transportation",
  "targetCo2Kg": 100.0,
  "startDate": "2026-06-01",
  "endDate": "2026-06-30"
}
```
* **Response (201 Created)**:
```json
{
  "id": "uuid-goal-id",
  "title": "Reduce travel carbon",
  "status": "ACTIVE",
  "targetCo2Kg": 100.0,
  "startDate": "2026-06-01T00:00:00.000Z",
  "endDate": "2026-06-30T00:00:00.000Z"
}
```

---

## Admin Console

### 1. Update Conversion Factor
* **Endpoint**: `PATCH /api/admin/emission-factors/:subCategory`
* **Headers**: `Authorization: Bearer <Admin_Access_Token>`
* **Request Body**:
```json
{
  "factor": 0.20,
  "unit": "km",
  "source": "IPCC Revised Guidelines"
}
```
* **Response (200 OK)**:
```json
{
  "id": "factor-uuid",
  "category": "transportation",
  "subCategory": "car",
  "factor": 0.20,
  "unit": "km",
  "source": "IPCC Revised Guidelines"
}
```
