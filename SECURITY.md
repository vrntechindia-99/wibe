# Wibe Security Documentation

## Overview

This document describes the security architecture, controls, and best practices for the Wibe messaging platform.

---

## Security Principles

1. **Defense in Depth** - Multiple layers of security controls
2. **Zero Trust** - Never trust, always verify
3. **Least Privilege** - Minimal access necessary
4. **Secure by Default** - Security enabled out of the box
5. **Privacy by Design** - Privacy built into architecture
6. **Fail Secure** - Failures default to secure state

---

## Authentication & Authorization

### JWT Token Strategy

| Token Type | Lifetime | Storage | Purpose |
|------------|----------|---------|---------|
| Access Token | 15 minutes | Memory (Flutter) | API authorization |
| Refresh Token | 30 days | Secure Storage (Keychain/Keystore) | Token renewal |
| Device Token | Permanent | Secure Storage | Push notifications |

### Token Security

- **Algorithm**: RS256 (asymmetric) or HS256 with strong secrets
- **Rotation**: Automatic on refresh
- **Revocation**: Immediate on logout, password change, security events
- **Binding**: Tokens bound to device ID
- **Claims**: `sub` (user ID), `deviceId`, `sessionId`, `type`, `iat`, `exp`

### Passwordless Authentication

- **Method**: Phone number + OTP (SMS)
- **Development Mode**: Fixed OTP `123456` (never in production)
- **Rate Limiting**: 3 attempts per 5 minutes per phone
- **OTP Expiry**: 5 minutes
- **Replay Protection**: Single-use OTPs with Redis tracking

### Session Management

- **Concurrent Sessions**: Multiple devices supported
- **Session Tracking**: Per-device sessions in database
- **Revocation**: Individual or all devices
- **Expiration**: 30 days inactivity
- **Cleanup**: Automated expired session removal

---

## Transport Security

### TLS Configuration

- **Minimum Version**: TLS 1.3
- **Cipher Suites**: Modern, AEAD-only
- **HSTS**: Enabled with 1-year max-age
- **Certificate Pinning**: On mobile clients
- **Certificate Transparency**: Enforced

### API Security

- **Helmet.js**: Security headers (CSP, X-Frame-Options, etc.)
- **CORS**: Restricted to known origins
- **Rate Limiting**: Per-endpoint configurable limits
- **Request Validation**: Class-validator on all inputs
- **Body Size Limits**: 10MB default, configurable

---

## Data Protection

### Encryption at Rest

| Data Type | Method | Key Management |
|-----------|--------|----------------|
| Database | TDE (Transparent Data Encryption) | Cloud KMS / Vault |
| PII Fields | Field-level encryption (AES-256-GCM) | Envelope encryption |
| Object Storage | SSE-S3 / SSE-KMS | Cloud KMS |
| Backups | AES-256 | Separate backup keys |

### Encryption in Transit

- **Client ↔ API**: TLS 1.3
- **Client ↔ WebSocket**: TLS 1.3 (WSS)
- **API ↔ Database**: TLS 1.3
- **API ↔ Redis**: TLS 1.3
- **API ↔ Object Storage**: TLS 1.3
- **Inter-service**: mTLS (production)

### Key Management

- **Development**: `.env.local` (gitignored)
- **Staging/Production**: HashiCorp Vault / AWS Secrets Manager
- **Rotation**: Automated (90 days for encryption keys)
- **Access**: Audit logged, least privilege

---

## Input Validation & Sanitization

### API Layer

- **Framework**: Class-validator + Class-transformer
- **Whitelisting**: Strip unknown properties
- **Size Limits**: Configurable per endpoint
- **Type Coercion**: Explicit with `enableImplicitConversion`

### Database Layer

- **ORM**: Prisma (parameterized queries)
- **SQL Injection**: Prevented by ORM
- **Constraint Validation**: Database-level CHECK constraints

### File Uploads

- **Validation**: MIME type, magic bytes, extension
- **Size Limits**: Per-type configurable
- **Processing**: Server-side thumbnail generation
- **Storage**: Isolated buckets, no direct execution
- **Scanning**: ClamAV integration (production)

---

## WebSocket Security

### Authentication

- **Handshake**: JWT in auth object / query / header
- **Validation**: Server-side on every connection
- **Rejection**: Invalid/expired tokens disconnected

### Authorization

- **Room Access**: Verified per conversation membership
- **Event Validation**: All client-supplied data validated
- **Rate Limiting**: Per-connection event limits

### Events Not Trusted from Client

- `conversationId` - Verified against membership
- `senderId` - From authenticated session
- `messageId` - Verified ownership
- `readState` / `deliveryState` - Server-authoritative

---

## Privacy Controls

### User-Controlled Privacy

| Setting | Levels | Enforcement |
|---------|--------|-------------|
| Last Seen | Everyone / Contacts / Contacts Except / Selected / None | Server-side |
| Profile Photo | Everyone / Contacts / Contacts Except / Selected / None | Server-side |
| About | Everyone / Contacts / Contacts Except / Selected / None | Server-side |
| Read Receipts | On / Off | Server-side |
| Status | Contacts / Contacts Except / Selected | Server-side |
| Group Adds | Everyone / Contacts / Contacts Except / Selected | Server-side |

### Implementation

- **Privacy Service**: Centralized privacy check logic
- **Database**: Settings stored in `user_profiles`
- **Enforcement**: Every data access checks privacy
- **Block List**: Mutual blocking hides all presence/info

---

## Blocking & Reporting

### Blocking

- **Effect**: Prevents direct communication
- **Enforcement**: Server-side on all messaging endpoints
- **Data**: Preserved per retention policy
- **Mutual**: Both users see blocked state

### Reporting

- **Categories**: Spam, Harassment, Inappropriate, Fake Account, Other
- **Metadata**: Optional context (message IDs, timestamps)
- **Workflow**: Pending → Reviewing → Resolved/Dismissed
- **Actions**: Warning, Suspension, Ban, Content Removal

---

## Audit Logging

### Logged Events

- Authentication (login, logout, token refresh, failures)
- Authorization (permission denied, admin actions)
- Data Access (profile views, message exports)
- Admin Actions (user management, moderation)
- Security Events (rate limit, suspicious activity)

### Not Logged

- Passwords / OTPs / Tokens
- Private message content
- Encryption keys
- PII in query parameters

### Log Format

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info|warn|error",
  "service": "api|websocket|worker",
  "userId": "uuid",
  "action": "event_name",
  "result": "success|failure",
  "metadata": {}
}
```

---

## Rate Limiting

### Configuration

| Category | Limit | Window | Scope |
|----------|-------|--------|-------|
| Auth (login/register) | 10 | 15 min | IP + Phone |
| OTP Requests | 3 | 5 min | Phone |
| Message Send | 30 | 1 min | User |
| Search | 20 | 1 min | User |
| File Upload | 10 | 1 min | User |
| WebSocket Events | 100 | 1 min | Connection |

### Implementation

- **Storage**: Redis with sliding window
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
- **Response**: 429 with `Retry-After` header

---

## Security Headers

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' wss: https:; frame-ancestors 'none';
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## Vulnerability Management

### Dependency Scanning

- **Tools**: npm audit, GitHub Dependabot, Snyk
- **Frequency**: Continuous (PR checks) + Weekly scheduled
- **Policy**: Critical/High fixed within 7 days

### Container Security

- **Base Images**: Official, minimal (Alpine/Distroless)
- **Scanning**: Trivy / Grype in CI
- **Updates**: Automated weekly rebuilds

### Penetration Testing

- **Frequency**: Annual + major releases
- **Scope**: API, WebSocket, Mobile Apps, Infrastructure
- **Remediation**: Tracked in security backlog

---

## Incident Response

### Security Incident Classification

| Severity | Examples | Response Time |
|----------|----------|---------------|
| Critical | Active breach, data exfiltration | 1 hour |
| High | Auth bypass, privilege escalation | 4 hours |
| Medium | XSS, info disclosure | 24 hours |
| Low | Minor config issue | 1 week |

### Response Process

1. **Detection** - Alerts, user reports, audit logs
2. **Triage** - Classify severity, assign owner
3. **Containment** - Isolate affected systems
4. **Investigation** - Root cause analysis
5. **Remediation** - Fix, deploy, verify
6. **Communication** - Users, regulators (if required)
7. **Post-mortem** - Document, improve

---

## Compliance

### GDPR

- **Lawful Basis**: Consent (marketing), Contract (service), Legitimate Interest (security)
- **Data Subject Rights**: Access, Rectification, Erasure, Portability, Restriction, Objection
- **DPIA**: Completed for messaging/presence
- **DPO**: Designated

### Data Processing Agreement

- **Subprocessors**: Listed and monitored
- **International Transfers**: SCCs where applicable
- **Retention**: Documented per data category

---

## Secure Development

### Code Review Requirements

- Security-focused review for auth, crypto, data handling
- Threat modeling for new features
- No secrets in code (enforced by pre-commit)

### Testing

- **SAST**: Semgrep / CodeQL in CI
- **DAST**: OWASP ZAP on staging
- **Penetration**: Annual third-party
- **Dependency**: Continuous scanning

### Secrets Management

- **Pre-commit**: GitLeaks / TruffleHog
- **Runtime**: Vault / AWS Secrets Manager
- **Rotation**: Automated with audit trail

---

## Mobile Security (Flutter)

### Certificate Pinning

```dart
// dio adapter with pinned certificates
```

### Secure Storage

- **iOS**: Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly)
- **Android**: EncryptedSharedPreferences + Keystore
- **Keys**: Never in SharedPreferences/UserDefaults

### Network Security

- **Cleartext**: Disabled (ATS / Network Security Config)
- **Pinning**: SHA-256 of SPKI
- **TrustKit** (iOS) / **Network Security Config** (Android)

---

## Infrastructure Security

### Network

- **VPC**: Private subnets for databases
- **Security Groups**: Least privilege
- **WAF**: AWS WAF / Cloudflare for API
- **DDoS**: Shield / Cloudflare

### Kubernetes

- **RBAC**: Least privilege roles
- **Network Policies**: Pod-to-pod restrictions
- **Pod Security Standards**: Restricted
- **Secrets**: External Secrets Operator → Vault
- **Images**: Signed, verified (cosign)

### Monitoring

- **SIEM**: Centralized logs (Loki + Promtail)
- **Alerting**: Security events → PagerDuty
- **Audit Trail**: Immutable (CloudTrail / Audit Logs)

---

## Cryptographic Standards

| Purpose | Algorithm | Parameters |
|---------|-----------|------------|
| Password Hashing | Argon2id | t=3, m=64MB, p=4 |
| Symmetric Encryption | AES-256-GCM | 96-bit nonce |
| Asymmetric Signatures | Ed25519 | - |
| Key Derivation | HKDF-SHA256 | - |
| TLS | TLS 1.3 | X25519, AES-256-GCM |
| JWT Signing | RS256 / ES256 | 2048-bit RSA / P-256 |

---

## End-to-End Encryption (Future)

### Planned Implementation

- **Protocol**: Signal Protocol (Double Ratchet)
- **Library**: libsignal (via FFI) or Dart implementation
- **Key Exchange**: X3DH
- **Verification**: Safety Numbers / QR Codes
- **Backup**: Encrypted key backup to cloud

### Current State

- **Transport**: TLS 1.3
- **At Rest**: AES-256 (server-side)
- **E2EE**: Not yet implemented
- **Claim**: "Encrypted in transit and at rest"

---

## Security Contacts

- **Security Team**: security@wibe.example.com
- **Bug Bounty**: HackerOne (planned)
- **Responsible Disclosure**: 90-day coordinated disclosure

---

## Appendix: Security Checklist for Releases

- [ ] All dependencies scanned
- [ ] SAST/DAST passed
- [ ] Penetration test (if major)
- [ ] Security headers verified
- [ ] Rate limits tested
- [ ] Auth/Authorization tested
- [ ] Privacy controls verified
- [ ] Encryption verified
- [ ] Secrets rotated
- [ ] Audit logging verified
- [ ] Incident response plan current
- [ ] Compliance documentation updated