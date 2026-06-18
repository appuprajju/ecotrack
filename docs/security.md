# Security Architecture & Threat Model

EcoTrack AI is built on Zero Trust Principles, ensuring every component validates its inputs, authorizes actions, and logs operations securely.

---

## Security Architecture Design

```
[ Client Portal ] 
      |
      | HTTPS (TLS 1.3)
      v
[ API Rate Limiter ] --> Block brute-force calls (>100 reqs/15m)
      |
[ Helmet Core Headers ] -> CSP, X-Frame-Options, XSS Audits
      |
[ JWT Auth Middleware ] -> Signature checking on Access Tokens (RSA256/HMAC)
      v
[ Use-Case Controllers ] -> Strict TypeScript inputs verification
      |
[ Database Access ] ------> Prisma Parameterized Queries (SQLi Protection)
```

---

## Cryptographic Protections

### 1. Token Lifecycles
- **Access Tokens**: Short-lived (15 minutes), signed using HMAC SHA256. Stored in memory on client portals.
- **Refresh Tokens**: Long-lived (7 days), signed using distinct HMAC keys. Saved inside the database. Rotated on reuse. Can be revoked immediately from user profile settings.

### 2. Password Policies
- Plain text passwords are encrypted before storage using **bcrypt** with a salt factor of 10.
- Raw password strings are never returned in queries or written to log files.

---

## Threat Model (STRIDE)

| Threat Category | Potential Risk | Mitigation Design |
| :--- | :--- | :--- |
| **Spoofing** | Session theft or password guessing | Bcrypt password encryption. Rate limiters to block login brute-forces. |
| **Tampering** | Modifying emission calculations or logs | JWT signatures. Use-case boundary controls to prevent editing other user logs. |
| **Repudiation** | Denying modifying system constants | System Audit Logging mapping actor ID, action, timestamp, IP, and agent details. |
| **Info Leak** | Accessing database tables | SSL/TLS forced encryption. Strict fields filtering on JSON controllers return payloads. |
| **Denial of Service** | Flooding carbon log submissions | Express Rate Limiting middleware. Horizontal scaling on Google Cloud Run. |
| **Elevation of Privileges** | Regular user accessing admin console | Express `roleGuard` validating `req.user.role === 'ADMIN'` on sensitive paths. |

---

## Security Audit Checklist

- [x] **OWASP A01 (Broken Access Control)**: Verified that user endpoints require JWT verification. Implemented role boundaries for admin endpoints.
- [x] **OWASP A02 (Cryptographic Failures)**: Use of bcrypt for credential hashing. Encryption for in-transit traffic (HTTPS/TLS).
- [x] **OWASP A03 (Injection)**: Prisma ORM generates parameterized queries natively, blocking SQL injections.
- [x] **OWASP A04 (Insecure Design)**: Clean Architecture isolates business domain models from database adapters and routing handlers.
- [x] **OWASP A05 (Security Misconfiguration)**: Implemented `helmet` to supply X-Frame, XSS, and Content-Security-Policy headers. Disabled detailed stack traces in production environment.
- [x] **OWASP A07 (Identification and Authentication Failures)**: Implemented secure refresh token lifecycle with rotation.
- [x] **OWASP A08 (Software and Data Integrity Failures)**: Strict dependency checking and lockfile checking in the CI pipeline.
