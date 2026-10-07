# Wibe

**Chat. Connect. Wibe.**

A modern, real-time communication platform built with Flutter and Node.js.

---

## Overview

Wibe is an original communication platform featuring:

- **Real-time messaging** - One-to-one and group chats with delivery/read receipts
- **Rich media** - Images, videos, documents, and voice messages
- **Voice & video calls** - WebRTC-powered calling
- **Status/Stories** - 24-hour ephemeral updates
- **Privacy first** - Granular privacy controls, blocking, reporting
- **Cross-platform** - Android & iOS (Web/Desktop planned)
- **Offline support** - Works on intermittent connections

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Flutter 3.x | Cross-platform UI framework |
| Riverpod | State management |
| GoRouter | Navigation |
| Drift (SQLite) | Local database |
| Dio | HTTP client |
| Socket.io Client | Real-time WebSocket |
| flutter_webrtc | Voice/video calls |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 20+ | Runtime |
| NestJS | Framework |
| TypeScript | Language |
| PostgreSQL 15+ | Primary database |
| Prisma | ORM |
| Redis 7+ | Cache, PubSub, presence |
| Socket.io | WebSocket server |
| MinIO/S3 | Object storage |
| coturn | TURN/STUN server |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Kubernetes | Orchestration |
| GitHub Actions | CI/CD |
| Prometheus/Grafana | Monitoring |
| Loki | Log aggregation |
| Tempo | Distributed tracing |

---

## Project Structure

```
wibe/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── shared/         # Shared infrastructure
│   │   ├── main.ts         # Entry point
│   │   └── app.module.ts   # Root module
│   ├── prisma/             # Database schema & migrations
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Flutter frontend
│   ├── lib/
│   │   ├── core/           # Core utilities
│   │   ├── data/           # Data layer
│   │   ├── domain/         # Domain layer
│   │   ├── presentation/   # UI layer
│   │   └── main.dart       # Entry point
│   ├── Dockerfile
│   └── pubspec.yaml
├── docker-compose.yml       # Local development stack
├── WIBE_ARCHITECTURE.md    # Architecture documentation
├── DEVELOPMENT_ROADMAP.md  # Implementation roadmap
└── README.md               # This file
```

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Flutter SDK 3.16+
- Node.js 20+
- PostgreSQL 15+ (via Docker)
- Redis 7+ (via Docker)

### Development Setup

```bash
# Clone and navigate
cd wibe

# Start infrastructure (PostgreSQL, Redis, MinIO)
docker-compose up -d

# Backend setup
cd backend
cp .env.example .env.local
npm install
npx prisma migrate dev
npm run start:dev

# Frontend setup (new terminal)
cd frontend
flutter pub get
flutter run
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/wibe?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="30d"

# Object Storage (MinIO)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="wibe-media"
S3_REGION="us-east-1"

# WebSocket
WS_PORT=3001

# Development
DEV_MODE=true
DEV_OTP_CODE="123456"

# Push Notifications (optional for dev)
FCM_SERVER_KEY=""
APNS_KEY_ID=""
APNS_TEAM_ID=""
APNS_PRIVATE_KEY=""
```

---

## Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 0** | Architecture & Planning | ✅ Complete |
| **Phase 1** | Foundation (Auth, Profile, Navigation) | ✅ Complete |
| **Phase 2** | Messaging MVP | ✅ Complete |
| **Phase 3** | Media & Voice Messages | ✅ Complete |
| **Phase 4** | Groups | ✅ Complete |
| **Phase 5** | Social Features | ✅ Complete |
| **Phase 6** | Calling | ✅ Complete |
| **Phase 7** | Privacy & Security | ✅ Complete |
| **Phase 8** | Performance | ✅ Complete |
| **Phase 9** | Production Readiness | ✅ Complete |
| **Phase 10** | Operations | ✅ Complete |
| **Phase 11** | Advanced Platform | ✅ Complete |
| **Phase 12** | Wibe Intelligence | ✅ Complete |
| **Phase 13** | Global Scale & Trust | ✅ Complete |
| **Phase 14** | Next-Generation Communication | ✅ Complete |
| **Phase 15** | Platform Ecosystem | ⏳ Planned |
| **Phase 16** | Enterprise & Organization | ⏳ Planned |
| **Phase 17** | Advanced Collaboration | ⏳ Planned |
| **Phase 18** | Wibe Events | ⏳ Planned |
| **Phase 19** | Advanced Social Layer | ⏳ Planned |
| **Phase 20** | Communities & Channels | ⏳ Planned |
| **Phase 21** | Creator & Content Tools | ⏳ Planned |
| **Phase 22** | Advanced Media Platform | ⏳ Planned |
| **Phase 23** | Wibe Search Platform | ⏳ Planned |
| **Phase 24** | Next-Generation Calling | ⏳ Planned |
| **Phase 25** | Real-Time Collaboration | ⏳ Planned |
| **Phase 26** | Advanced Offline & Edge | ⏳ Planned |
| **Phase 27** | Privacy Architecture | ⏳ Planned |
| **Phase 28** | Advanced Encryption / E2EE | ⏳ Planned |
| **Phase 29** | Security Engineering | ⏳ Planned |
| **Phase 30** | Bug Bounty & Disclosure | ⏳ Planned |
| **Phase 31** | Disaster Recovery 2.0 | ⏳ Planned |
| **Phase 32** | Global Infrastructure 2.0 | ⏳ Planned |
| **Phase 33** | Reliability Engineering | ⏳ Planned |
| **Phase 34** | Observability 2.0 | ⏳ Planned |
| **Phase 35** | Automated Operations | ⏳ Planned |
| **Phase 36** | Progressive Deployment | ⏳ Planned |
| **Phase 37** | Developer Platform 2.0 | ⏳ Planned |
| **Phase 38** | Mobile Optimization | ⏳ Planned |
| **Phase 39** | Accessibility 2.0 | ⏳ Planned |
| **Phase 40** | Internationalization 2.0 | ⏳ Planned |
| **Phase 41** | Trust & Safety 2.0 | ⏳ Planned |
| **Phase 42** | Vulnerable-User Safety | ⏳ Planned |
| **Phase 43** | Data Lifecycle Automation | ⏳ Planned |
| **Phase 44** | Data Portability | ⏳ Planned |
| **Phase 45** | Privacy-Preserving Analytics | ⏳ Planned |
| **Phase 46** | Platform Health | ⏳ Planned |
| **Phase 47** | Incident Management | ⏳ Planned |
| **Phase 48** | Backup Verification | ⏳ Planned |
| **Phase 49** | Architecture Review | ⏳ Planned |
| **Phase 50** | Mature Wibe Release | ⏳ Planned |
| **Phase 51** | Continuous Evolution | ⏳ Planned |

See [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) for detailed tasks.

---

## Documentation

- [Architecture](WIBE_ARCHITECTURE.md) - System architecture
- [Roadmap](DEVELOPMENT_ROADMAP.md) - Implementation phases
- [API Documentation](API_DOCUMENTATION.md) - *To be created*
- [Database Schema](DATABASE_SCHEMA.md) - *To be created*
- [Security](SECURITY.md) - *To be created*

---

## Brand Guidelines

### Colors

| Role | Light | Dark |
|------|-------|------|
| Primary | `#6C4BF4` | `#8B5CF6` |
| Secondary | `#8B5CF6` | `#A78BFA` |
| Background | `#F8F7FC` | `#0F0F14` |
| Surface | `#FFFFFF` | `#1A1A2E` |
| Success | `#22C55E` | `#22C55E` |
| Error | `#EF4444` | `#EF4444` |

### Typography

- **Headings**: Inter, Semi-bold
- **Body**: Inter, Regular
- **Monospace**: JetBrains Mono

### Iconography

- Custom icon set (not Material Icons)
- Consistent 24px grid
- Outlined style for inactive, filled for active

---

## Security

- **Transport**: TLS 1.3 enforced
- **Authentication**: JWT with short-lived access tokens
- **Authorization**: Resource-level permissions
- **Data**: Encryption at rest (TDE), field-level for PII
- **Secrets**: Never committed, managed via Vault/secrets manager

See [SECURITY.md](SECURITY.md) for details (to be created).

---

## Important Restrictions

**Wibe is a communication platform, not a financial platform.** The following are explicitly **prohibited** and will never be implemented:

- ❌ Wallet / Digital Wallet
- ❌ UPI / Unified Payments Interface
- ❌ Banking functionality
- ❌ Money transfer / P2P payments
- ❌ Merchant payments
- ❌ Payment gateway integration
- ❌ Payment processing
- ❌ Cryptocurrency / Wallet features
- ❌ Financial transactions of any kind

Wibe remains focused on **communication** — messaging, calls, media, groups, and privacy — not financial services.

---

## Contributing

1. Read the [Architecture](WIBE_ARCHITECTURE.md) and [Roadmap](DEVELOPMENT_ROADMAP.md)
2. Check existing issues for the current phase
3. Follow the [Development Workflow](#development-workflow)
4. Submit PR with tests and documentation

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/phase-1-auth

# 2. Implement with tests
# 3. Run quality checks
npm run lint          # Backend
flutter analyze       # Frontend

# 4. Run tests
npm run test          # Backend
flutter test          # Frontend

# 5. Update documentation if needed
# 6. Submit PR
```

---

## License

Proprietary - All rights reserved.

---

## Contact

For questions about Wibe development, refer to the architecture and roadmap documents, or contact the project maintainers.