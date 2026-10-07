# Wibe Architecture Document

## Overview

Wibe is a real-time communication platform built with Flutter (frontend) and Node.js/TypeScript (backend). The architecture follows clean architecture principles with feature-based modules, designed for scalability, maintainability, and security.

---

## 1. Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Android    │  │      iOS     │  │    Web*      │           │
│  │   (Flutter)  │  │   (Flutter)  │  │  (Flutter)   │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
└─────────┼─────────────────┼─────────────────┼────────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                    ┌───────▼───────┐
                    │  API Gateway  │
                    │   (NGINX)     │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Auth Service │  │  API Service  │  │  WS Gateway   │
│  (REST)       │  │  (REST)       │  │  (WebSocket)  │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PostgreSQL   │  │    Redis      │  │  Object Store │
│  (Primary DB) │  │  (Cache/PubSub)│  │  (Media)      │
└───────────────┘  └───────────────┘  └───────────────┘
```

*Web support planned for future phases

---

## 2. Frontend Architecture (Flutter)

### 2.1 Project Structure

```
lib/
├── core/
│   ├── constants/
│   ├── errors/
│   ├── network/
│   ├── utils/
│   └── theme/
├── data/
│   ├── datasources/
│   │   ├── local/
│   │   └── remote/
│   ├── models/
│   └── repositories/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── usecases/
├── presentation/
│   ├── features/
│   │   ├── auth/
│   │   ├── chats/
│   │   ├── calls/
│   │   ├── contacts/
│   │   ├── groups/
│   │   ├── media/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── status/
│   ├── shared/
│   │   ├── widgets/
│   │   └── providers/
│   └── routes/
└── main.dart
```

### 2.2 State Management

- **Riverpod** for global state management
- **Stream-based** real-time updates via WebSocket
- **Local-first** approach with SQLite (drift) for offline support

### 2.3 Key Design Decisions

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Navigation | GoRouter | Declarative, deep linking support |
| DI | Riverpod + get_it | Compile-time safety, testability |
| Local DB | Drift (SQLite) | Type-safe, reactive, performant |
| Networking | Dio + WebSocket | Interceptors, retry logic, WebSocket support |
| Images | CachedNetworkImage | Memory/disk caching, placeholders |
| Permissions | permission_handler | Cross-platform permission management |

---

## 3. Backend Architecture (Node.js/TypeScript)

### 3.1 Project Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── guards/
│   │   └── auth.module.ts
│   ├── users/
│   ├── conversations/
│   ├── messages/
│   ├── groups/
│   ├── media/
│   ├── presence/
│   ├── notifications/
│   ├── calls/
│   └── admin/
├── shared/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── repositories/
│   ├── websocket/
│   │   ├── gateway/
│   │   ├── handlers/
│   │   └── events/
│   ├── config/
│   ├── utils/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── exceptions/
├── main.ts
└── app.module.ts
```

### 3.2 Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| **auth** | Registration, login, OTP, sessions, device management |
| **users** | Profiles, privacy settings, blocking, contacts |
| **conversations** | Direct/group conversations, pinning, archiving, muting |
| **messages** | CRUD, reactions, replies, forwarding, search, status lifecycle |
| **groups** | Creation, membership, admin permissions, settings |
| **media** | Upload/download, validation, thumbnails, CDN integration |
| **presence** | Online/offline, typing indicators, last seen |
| **notifications** | Push notifications (FCM/APNs), preferences |
| **calls** | WebRTC signaling, call metadata, missed calls |
| **admin** | User management, reports, system stats |

### 3.3 Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ (LTS) |
| Framework | NestJS |
| Language | TypeScript 5+ |
| Database | PostgreSQL 15+ |
| ORM | Prisma |
| Cache/PubSub | Redis 7+ |
| WebSocket | Socket.io |
| Object Storage | S3-compatible (MinIO for dev) |
| Auth | JWT (access + refresh tokens) |
| Validation | class-validator + class-transformer |
| Logging | Pino |
| Testing | Jest + Supertest |

---

## 4. Database Architecture

### 4.1 Core Entities (ER Diagram Overview)

```
users ──┬── user_profiles
        ├── devices
        ├── sessions
        ├── conversation_members ── conversations ── messages ── message_attachments
        │                               │                    ├── message_reactions
        │                               │                    ├── message_read_receipts
        │                               │                    └── message_forwards
        │                               └── groups ── group_members
        ├── statuses ── status_views
        ├── calls
        ├── blocked_users
        ├── reports
        └── notifications
```

### 4.2 Key Tables

**users**
- `id` (UUID, PK)
- `phone_number` (VARCHAR, UNIQUE)
- `is_verified` (BOOLEAN)
- `created_at`, `updated_at`, `deleted_at`

**user_profiles**
- `user_id` (UUID, FK, PK)
- `display_name` (VARCHAR)
- `avatar_url` (VARCHAR)
- `about` (TEXT)
- `privacy_last_seen` (ENUM: everyone, contacts, none)
- `privacy_profile_photo` (ENUM: everyone, contacts, none)
- `privacy_about` (ENUM: everyone, contacts, none)
- `privacy_read_receipts` (BOOLEAN)
- `privacy_status` (ENUM: contacts, contacts_except, selected)

**conversations**
- `id` (UUID, PK)
- `type` (ENUM: direct, group)
- `created_by` (UUID, FK)
- `created_at`, `updated_at`

**messages**
- `id` (UUID, PK)
- `conversation_id` (UUID, FK)
- `sender_id` (UUID, FK)
- `type` (ENUM: text, image, video, document, audio, contact, location)
- `content` (TEXT)
- `status` (ENUM: created, sending, sent, delivered, read, failed)
- `reply_to_id` (UUID, FK, nullable)
- `edited_at` (TIMESTAMP, nullable)
- `deleted_at` (TIMESTAMP, nullable)
- `deleted_for_everyone` (BOOLEAN)
- `created_at`, `updated_at`

### 4.3 Indexing Strategy

- Composite indexes on frequently queried columns (conversation_id + created_at, sender_id + created_at)
- Partial indexes for soft deletes
- Foreign keys with CASCADE/SET NULL as appropriate

---

## 5. Authentication Architecture

### 5.1 Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│  Client │────▶│  Auth   │────▶│  Backend│
│  Phone  │     │  App    │     │ Service │     │  (OTP)  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                                            │
                                            ▼
                                    ┌─────────────┐
                                    │  SMS/OTP    │
                                    │  Provider   │
                                    │  (Dev: Mock)│
                                    └─────────────┘
```

### 5.2 Token Strategy

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token | 15 min | Memory (Flutter) | API authorization |
| Refresh Token | 30 days | Secure Storage (Keychain/Keystore) | Token renewal |
| Device Token | Permanent | Secure Storage | Push notifications |

### 5.3 Development Mode

- Mock OTP provider (fixed code: `123456`)
- Configurable via `DEV_MODE=true` environment variable
- Never enabled in production

---

## 6. Real-time Messaging Architecture

### 6.1 WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `new_message` | Server → Client | Message object |
| `message_updated` | Server → Client | Message ID + updates |
| `message_deleted` | Server → Client | Message ID + scope |
| `message_delivered` | Server → Client | Message ID + user ID |
| `message_read` | Server → Client | Message ID + user ID |
| `typing_started` | Bidirectional | Conversation ID + user ID |
| `typing_stopped` | Bidirectional | Conversation ID + user ID |
| `user_online` | Server → Client | User ID |
| `user_offline` | Server → Client | User ID + last_seen |
| `reaction_added` | Server → Client | Message ID + reaction |
| `reaction_removed` | Server → Client | Message ID + reaction |
| `group_updated` | Server → Client | Group ID + changes |
| `call_started` | Server → Client | Call metadata |
| `call_ended` | Server → Client | Call ID + duration |

### 6.2 Connection Management

- **Reconnection**: Exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **Heartbeat**: Ping/pong every 25s
- **Auth**: JWT in connection handshake
- **Rooms**: Per-conversation rooms for message broadcast
- **Presence**: Redis-backed user presence with TTL

### 6.3 Message Delivery Guarantees

- **At-least-once** delivery with client-side deduplication
- **Idempotent** message processing via `client_message_id`
- **Offline queue** in Redis for disconnected users
- **Acknowledgment** flow: sent → delivered → read

---

## 7. Media Architecture

### 7.1 Upload Flow

```
Client → Presigned URL → Object Storage → CDN
  │                         │
  └── Metadata → Backend → Database
```

### 7.2 Media Types & Limits

| Type | Max Size | Validation |
|------|----------|------------|
| Image | 16 MB | MIME, dimensions, magic bytes |
| Video | 64 MB | MIME, duration, codec |
| Document | 100 MB | MIME, extension, magic bytes |
| Audio (voice) | 16 MB | MIME, duration, format |

### 7.3 Processing

- **Thumbnails**: Generated server-side (Sharp)
- **Compression**: Client-side for images/videos
- **Progress**: WebSocket events for upload/download
- **Cleanup**: Cron job for orphaned files (24h TTL)

---

## 8. Calling Architecture (WebRTC)

### 8.1 Signaling Flow

```
Caller ──▶ Signaling Server ──▶ Callee
  │                              │
  │         SDP Offer/Answer     │
  │                              │
  │         ICE Candidates       │
  ▼                              ▼
Peer Connection ←─────────────→ Peer Connection
       │                           │
       └────── Media (SRTP) ───────┘
```

### 8.2 Components

| Component | Technology |
|-----------|------------|
| Signaling | Socket.io (dedicated namespace) |
| STUN/TURN | coturn (self-hosted) |
| Media | WebRTC (flutter_webrtc) |
| Codecs | VP8/H.264 (video), Opus (audio) |

### 8.3 Call Metadata Stored

- `call_id`, `caller_id`, `callee_id`, `type` (voice/video)
- `status` (ringing, answered, ended, missed, rejected)
- `started_at`, `ended_at`, `duration_seconds`
- **No media content stored**

---

## 9. Security Model

### 9.1 Defense Layers

| Layer | Measures |
|-------|----------|
| Transport | TLS 1.3, HSTS, Certificate Pinning |
| Application | Helmet, CORS, Rate Limiting, Input Validation |
| Authentication | JWT with short expiry, refresh rotation, device binding |
| Authorization | RBAC, resource-level permissions, ownership checks |
| Data | Parameterized queries, encryption at rest (TDE), field-level encryption for PII |
| Infrastructure | VPC, security groups, secrets management, audit logs |

### 9.2 Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| SQL Injection | Prisma ORM (parameterized) |
| XSS | Output encoding, CSP headers |
| CSRF | SameSite cookies, CSRF tokens for state-changing ops |
| Replay Attacks | Nonce in WebSocket, short-lived JWT |
| Brute Force | Rate limiting, exponential backoff, account lockout |
| Media Abuse | Type validation, size limits, virus scanning (ClamAV) |

### 9.3 Secrets Management

- **Development**: `.env.local` (gitignored)
- **Staging/Production**: HashiCorp Vault / AWS Secrets Manager
- **Rotation**: Automated for JWT secrets, DB passwords

---

## 10. Notification Architecture

### 10.1 Push Providers

| Platform | Provider |
|----------|----------|
| Android | FCM |
| iOS | APNs |
| Web* | Web Push (VAPID) |

### 10.2 Notification Types

| Type | Payload | Priority |
|------|---------|----------|
| New Message | Conversation ID, preview (if enabled) | High |
| Group Mention | Group ID, sender | High |
| Incoming Call | Call ID, caller | Critical |
| Missed Call | Call ID, caller | Normal |
| Status Update | Status ID | Low |

### 10.3 Privacy Compliance

- No message content in payload if `show_previews = false`
- Batched notifications for grouped conversations
- Respect mute/do-not-disturb settings

---

## 11. Scaling Strategy

### 11.1 Horizontal Scaling

| Component | Strategy |
|-----------|----------|
| API Services | Stateless, Kubernetes HPA (CPU > 70%) |
| WebSocket Gateway | Sticky sessions via Redis PubSub, horizontal scaling |
| Database | Read replicas, connection pooling (PgBouncer) |
| Redis | Cluster mode, sharding by user ID |
| Object Storage | S3/MinIO (automatically scalable) |

### 11.2 Performance Targets

| Metric | Target |
|--------|--------|
| API P99 Latency | < 200ms |
| WebSocket Message Delivery | < 100ms |
| Media Upload (10MB) | < 5s |
| Call Setup Time | < 2s |
| Concurrent Connections | 100k per gateway node |

---

## 12. Error Handling

### 12.1 Error Classification

| Category | HTTP Code | Retryable | User-Facing |
|----------|-----------|-----------|-------------|
| Validation | 400 | No | Specific field errors |
| Unauthorized | 401 | No | "Session expired" |
| Forbidden | 403 | No | "Permission denied" |
| Not Found | 404 | No | "Not found" |
| Rate Limited | 429 | Yes (after retry-after) | "Too many requests" |
| Server Error | 500 | Yes | "Something went wrong" |
| Service Unavailable | 503 | Yes | "Service temporarily unavailable" |

### 12.2 Client-Side Handling

- Automatic retry with exponential backoff for 5xx/429
- Offline queue for failed mutations
- User-friendly error messages (no stack traces)
- Error boundary for UI crashes

---

## 13. Testing Strategy

### 13.1 Test Pyramid

```
        ┌─────────────┐
        │   E2E Tests │  (Critical paths: auth, messaging, calls)
        ├─────────────┤
        │ Integration │  (API, WebSocket, DB, external services)
        ├─────────────┤
        │   Unit Tests│  (Business logic, utilities, validators)
        └─────────────┘
```

### 13.2 Coverage Targets

| Layer | Target |
|-------|--------|
| Domain/Business Logic | 90%+ |
| API Controllers | 80%+ |
| WebSocket Handlers | 80%+ |
| Frontend Widgets | 70%+ |

### 13.3 Test Types

- **Unit**: Jest (backend), flutter_test (frontend)
- **Integration**: Testcontainers (PostgreSQL, Redis), Supertest
- **E2E**: Detox (mobile), Playwright (web)
- **Contract**: Pact (API contracts)
- **Load**: k6 (API, WebSocket)

---

## 14. Deployment Strategy

### 14.1 Environments

| Environment | Purpose | Infrastructure |
|-------------|---------|----------------|
| Development | Local dev | Docker Compose |
| Staging | Integration testing | Kubernetes (dev cluster) |
| Production | Live traffic | Kubernetes (prod cluster, multi-AZ) |

### 14.2 CI/CD Pipeline

```
Push → Lint/Typecheck → Unit Tests → Build Images → 
Security Scan → Deploy Staging → Integration Tests → 
Manual Approval → Deploy Production (Blue/Green)
```

### 14.3 Observability

- **Logs**: Structured JSON (Pino) → Loki/Grafana
- **Metrics**: Prometheus + Grafana dashboards
- **Traces**: OpenTelemetry → Tempo/Jaeger
- **Alerts**: Alertmanager → PagerDuty/Slack

---

## 15. Development Phases Summary

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| **Phase 0** | Architecture | This document + ROADMAP + README |
| **Phase 1** | Foundation | Project structure, DB, Auth, Profile, Navigation |
| **Phase 2** | Messaging MVP | 1:1 chat, WebSocket, delivery/read, typing, offline |
| **Phase 3** | Media | Images, videos, files, voice messages |
| **Phase 4** | Groups | Creation, members, admins, permissions |
| **Phase 5** | Social | Status, reactions, forwarding, replies |
| **Phase 6** | Calls | Voice/Video, WebRTC, signaling |
| **Phase 7** | Privacy & Security | Full audit, penetration testing |
| **Phase 8** | Performance | Load testing, optimization |
| **Phase 9** | Production | Monitoring, backups, DR, docs |
| **Phase 10** | Operations | Incident mgmt, analytics, feedback, crash triage |
| **Phase 11** | Advanced Platform | Multi-device, search, media, groups, calling, accessibility, i18n, AI |
| **Phase 12** | Wibe Intelligence | AI assistance, translation, summaries, search, safety |
| **Phase 13** | Global Scale & Trust | Multi-region, data residency, trust & safety, data governance |
| **Phase 14** | Next-Gen Communication | Sync engine, media, calls, themes, AI tools, safety |
| **Phase 15** | Platform Ecosystem | Public API, OAuth, webhooks, integrations |
| **Phase 16** | Enterprise | Organizations, SSO, admin controls, policies |
| **Phase 17** | Advanced Collaboration | Shared notes, polls, events, collaborative objects |
| **Phase 18** | Wibe Events | Event creation, invitations, RSVPs, reminders |
| **Phase 19** | Advanced Social | Public profiles, follow, communities, channels |
| **Phase 20** | Communities & Channels | Large communities, moderation, governance |
| **Phase 21** | Creator Tools | Rich status, short-form video, analytics |
| **Phase 22** | Advanced Media | Pipeline, CDN, adaptive video, optimization |
| **Phase 23** | Search Platform | Full-text search, filters, incremental indexing |
| **Phase 24** | Next-Gen Calling | Group calls, screen share, recording, noise suppression |
| **Phase 25** | Real-Time Collaboration | Whiteboards, drawing, live polls, annotations |
| **Phase 26** | Edge & Offline | Offline-first, delta sync, conflict resolution |
| **Phase 27** | Privacy Architecture | Data flow review, minimization, privacy-by-design |
| **Phase 28** | Advanced Encryption / E2EE | True E2EE, key management, device verification |
| **Phase 29** | Security Engineering | CI scanning, pen testing, threat modeling, vuln mgmt |
| **Phase 30** | Bug Bounty | Disclosure policy, scope, response workflow |
| **Phase 31** | Disaster Recovery 2.0 | Full-scale exercises, RTO/RPO, chaos testing |
| **Phase 31** | Global Infrastructure 2.0 | Multi-region DB, global routing, automated failover |
| **Phase 32** | Reliability Engineering | SLOs, error budgets, capacity planning, chaos testing |
| **Phase 32** | Observability 2.0 | Unified logs/metrics/traces, distributed tracing |
| **Phase 33** | Automated Operations | Scaling, failover, cert renewal, backup verification |
| **Phase 33** | Progressive Deployment | Canary, regional rollout, automated rollback |
| **Phase 34** | Developer Platform 2.0 | Portal, SDKs, sandbox, webhooks, audit logs |
| **Phase 34** | Mobile Optimization | Low-end devices, memory, startup, battery |
| **Phase 34** | Accessibility 2.0 | Formal audit, screen readers, keyboard, contrast |
| **Phase 35** | Internationalization 2.0 | RTL, time zones, calendars, pluralization, QA |
| **Phase 35** | Trust & Safety 2.0 | Appeals, case mgmt, evidence, transparency reporting |
| **Phase 36** | Child Safety | Age-appropriate defaults, reporting, moderation |
| **Phase 36** | Data Lifecycle Automation | Retention policies, automated cleanup |
| **Phase 37** | Data Portability | Export/import, standard formats |
| **Phase 37** | Privacy-Preserving Analytics | Aggregate metrics, no content collection |
| **Phase 37** | Platform Health | Health dashboard, incident detection |
| **Phase 38** | Incident Management | Detection → Triage → Mitigation → RCA |
| **Phase 38** | Backup Verification | Automated backup + restore testing |
| **Phase 38** | Architecture Review | Boundary eval, debt reduction, cost optimization |
| **Phase 39** | Mature Wibe Release | Product, security, privacy, infra, quality, ops gates |
| **Phase 39** | Continuous Evolution | Feedback → Research → Prototype → Security → Implement |

---

## 16. Appendix: Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-07 | Flutter + NestJS | Cross-platform, type-safe, mature ecosystems |
| 2026-10-07 | PostgreSQL + Prisma | Relational integrity, type-safe ORM, migrations |
| 2026-10-07 | Socket.io for WebSocket | Auto-reconnection, rooms, scaling support |
| 2026-10-07 | Riverpod for state | Compile-time safety, no code gen, testable |
| 2026-10-07 | JWT (access + refresh) | Stateless, scalable, industry standard |
| 2026-10-07 | S3-compatible storage | Vendor-neutral, CDN integration, presigned URLs |
| 2026-10-07 | WebRTC for calls | P2P media, standard, mobile support |

---

*Document Version: 1.0*
*Last Updated: 2026-10-07*
*Status: DRAFT - Pending review before Phase 1 implementation*