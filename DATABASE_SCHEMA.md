# Wibe Database Schema

## Overview

This document describes the PostgreSQL database schema for the Wibe messaging platform.

## Entity Relationship Diagram

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

---

## Core Tables

### users
Primary user table with authentication info.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| phone_number | VARCHAR(20) | UNIQUE, NOT NULL | E.164 format phone |
| is_verified | BOOLEAN | DEFAULT false | Phone verified |
| role | user_role | DEFAULT 'USER' | USER, ADMIN, SUPER_ADMIN |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |
| deleted_at | TIMESTAMPTZ | NULLABLE | Soft delete |

**Indexes**: `phone_number` (unique)

---

### user_profiles
Extended profile information and privacy settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK, FK → users.id | One-to-one with users |
| display_name | VARCHAR(100) | NULLABLE | Display name |
| avatar_url | VARCHAR(500) | NULLABLE | Profile photo URL |
| about | TEXT | NULLABLE | About/bio text |
| privacy_last_seen | privacy_level | DEFAULT 'CONTACTS' | Who sees last seen |
| privacy_profile_photo | privacy_level | DEFAULT 'CONTACTS' | Who sees avatar |
| privacy_about | privacy_level | DEFAULT 'CONTACTS' | Who sees about |
| privacy_read_receipts | BOOLEAN | DEFAULT true | Read receipts enabled |
| privacy_status | privacy_level | DEFAULT 'CONTACTS' | Status visibility |
| privacy_groups | privacy_level | DEFAULT 'CONTACTS' | Group add permission |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Foreign Key**: `user_id` → `users.id` ON DELETE CASCADE

---

### devices
Registered user devices for push notifications and multi-device support.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | Owner |
| device_id | VARCHAR(100) | UNIQUE | Device fingerprint |
| platform | device_platform | NOT NULL | ANDROID, IOS, WEB, DESKTOP |
| push_token | VARCHAR(500) | NULLABLE | FCM/APNs token |
| app_version | VARCHAR(20) | NULLABLE | App version |
| os_version | VARCHAR(20) | NULLABLE | OS version |
| last_active_at | TIMESTAMPTZ | NULLABLE | Last activity |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes**: `user_id`

**Foreign Key**: `user_id` → `users.id` ON DELETE CASCADE

---

### sessions
Active user sessions for token management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | Owner |
| device_id | VARCHAR(100) | FK → devices.device_id | Device |
| refresh_token | VARCHAR(500) | UNIQUE | Hashed refresh token |
| access_token | VARCHAR(500) | NULLABLE | Current access token |
| expires_at | TIMESTAMPTZ | NOT NULL | Expiration |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| revoked_at | TIMESTAMPTZ | NULLABLE | Revocation time |

**Indexes**: `user_id`, `refresh_token`

**Foreign Keys**: 
- `user_id` → `users.id` ON DELETE CASCADE
- `device_id` → `devices.device_id` ON DELETE CASCADE

---

## Conversation Tables

### conversations
Core conversation entity (both direct and group).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| type | conversation_type | DEFAULT 'DIRECT' | DIRECT, GROUP |
| name | VARCHAR(100) | NULLABLE | Group name |
| description | TEXT | NULLABLE | Group description |
| avatar_url | VARCHAR(500) | NULLABLE | Group avatar |
| created_by | UUID | FK → users.id | Creator |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |
| deleted_at | TIMESTAMPTZ | NULLABLE | Soft delete |

**Indexes**: `created_by`, `updated_at`

---

### conversation_members
Conversation membership with per-user settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| conversation_id | UUID | FK → conversations.id | Conversation |
| user_id | UUID | FK → users.id | Member |
| role | group_role | DEFAULT 'MEMBER' | MEMBER, ADMIN, OWNER |
| joined_at | TIMESTAMPTZ | DEFAULT now() | Join time |
| left_at | TIMESTAMPTZ | NULLABLE | Leave time (soft delete) |
| is_pinned | BOOLEAN | DEFAULT false | Pinned to top |
| is_archived | BOOLEAN | DEFAULT false | Archived |
| is_muted | BOOLEAN | DEFAULT false | Muted |
| mute_until | TIMESTAMPTZ | NULLABLE | Mute expiration |
| last_read_message_id | UUID | FK → messages.id | Read cursor |
| unread_count | INTEGER | DEFAULT 0 | Unread count |

**Unique**: `(conversation_id, user_id)`

**Indexes**: `user_id`, `(conversation_id, is_archived)`

**Foreign Keys**:
- `conversation_id` → `conversations.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE CASCADE
- `last_read_message_id` → `messages.id` ON DELETE SET NULL

---

## Message Tables

### messages
Core message table with full lifecycle tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| client_message_id | VARCHAR(100) | UNIQUE | Idempotency key |
| conversation_id | UUID | FK → conversations.id | Conversation |
| sender_id | UUID | FK → users.id | Sender |
| type | message_type | DEFAULT 'TEXT' | TEXT, IMAGE, VIDEO, DOCUMENT, AUDIO, CONTACT, LOCATION, STICKER |
| content | TEXT | NULLABLE | Text content or caption |
| status | message_status | DEFAULT 'CREATED' | CREATED, SENDING, SENT, DELIVERED, READ, FAILED |
| reply_to_id | UUID | FK → messages.id | Reply reference |
| edited_at | TIMESTAMPTZ | NULLABLE | Edit timestamp |
| deleted_at | TIMESTAMPTZ | NULLABLE | Soft delete |
| deleted_for_everyone | BOOLEAN | DEFAULT false | Delete for everyone |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes**:
- `(conversation_id, created_at DESC)`
- `(conversation_id, id DESC)`
- `(sender_id, created_at DESC)`
- `client_message_id` (unique)
- `reply_to_id`

**Foreign Keys**:
- `conversation_id` → `conversations.id` ON DELETE CASCADE
- `sender_id` → `users.id` ON DELETE CASCADE
- `reply_to_id` → `messages.id` ON DELETE SET NULL

**Unique Constraint for Idempotency**:
```sql
UNIQUE (conversation_id, sender_id, client_message_id)
WHERE deleted_at IS NULL
```

---

### message_attachments
Media and file attachments for messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| message_id | UUID | FK → messages.id | Parent message |
| type | attachment_type | NOT NULL | IMAGE, VIDEO, DOCUMENT, AUDIO, THUMBNAIL |
| url | VARCHAR(500) | NOT NULL | CDN/storage URL |
| thumbnail_url | VARCHAR(500) | NULLABLE | Thumbnail URL |
| file_name | VARCHAR(255) | NULLABLE | Original filename |
| mime_type | VARCHAR(100) | NOT NULL | MIME type |
| file_size | INTEGER | NOT NULL | Size in bytes |
| width | INTEGER | NULLABLE | Image/video width |
| height | INTEGER | NULLABLE | Image/video height |
| duration | INTEGER | NULLABLE | Audio/video duration (seconds) |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Index**: `message_id`

**Foreign Key**: `message_id` → `messages.id` ON DELETE CASCADE

---

### message_reactions
Emoji reactions on messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| message_id | UUID | FK → messages.id | Message |
| user_id | UUID | FK → users.id | Reactor |
| emoji | VARCHAR(10) | NOT NULL | Unicode emoji |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Unique**: `(message_id, user_id, emoji)`

**Index**: `message_id`

**Foreign Keys**:
- `message_id` → `messages.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE CASCADE

---

### message_read_receipts
Read receipts for messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| message_id | UUID | FK → messages.id | Message |
| user_id | UUID | FK → users.id | Reader |
| read_at | TIMESTAMPTZ | DEFAULT now() | Read time |

**Unique**: `(message_id, user_id)`

**Index**: `message_id`

**Foreign Keys**:
- `message_id` → `messages.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE CASCADE

---

### message_forwards
Message forwarding tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| original_message_id | UUID | FK → messages.id | Original |
| forwarded_message_id | UUID | FK → messages.id | Forwarded copy |
| forwarded_by_id | UUID | FK → users.id | Forwarder |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes**: `original_message_id`, `forwarded_by_id`

**Foreign Keys**:
- `original_message_id` → `messages.id` ON DELETE CASCADE
- `forwarded_message_id` → `messages.id` ON DELETE CASCADE
- `forwarded_by_id` → `users.id` ON DELETE CASCADE

---

## Group Tables

### groups
Group-specific metadata (extends conversations).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| conversation_id | UUID | UNIQUE, FK → conversations.id | Linked conversation |
| name | VARCHAR(100) | NOT NULL | Group name |
| description | TEXT | NULLABLE | Group description |
| avatar_url | VARCHAR(500) | NULLABLE | Group avatar |
| created_by | UUID | FK → users.id | Creator |
| settings | JSONB | NULLABLE | Group settings |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Foreign Key**: `conversation_id` → `conversations.id` ON DELETE CASCADE

---

### group_members
Group-specific membership (extends conversation_members).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| group_id | UUID | FK → groups.id | Group |
| user_id | UUID | FK → users.id | Member |
| role | group_role | DEFAULT 'MEMBER' | MEMBER, ADMIN, OWNER |
| joined_at | TIMESTAMPTZ | DEFAULT now() | Join time |
| left_at | TIMESTAMPTZ | NULLABLE | Leave time |
| invited_by | UUID | FK → users.id | Inviter |
| is_muted | BOOLEAN | DEFAULT false | Muted |
| mute_until | TIMESTAMPTZ | NULLABLE | Mute expiration |

**Unique**: `(group_id, user_id)`

**Index**: `user_id`

**Foreign Keys**:
- `group_id` → `groups.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE CASCADE
- `invited_by` → `users.id` ON DELETE SET NULL

---

## Status/Stories Tables

### statuses
Ephemeral status updates (24-hour expiry).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | Author |
| type | message_type | DEFAULT 'TEXT' | TEXT, IMAGE, VIDEO |
| content | TEXT | NULLABLE | Text content/caption |
| media_url | VARCHAR(500) | NULLABLE | Media URL |
| thumbnail_url | VARCHAR(500) | NULLABLE | Thumbnail |
| privacy | privacy_level | DEFAULT 'CONTACTS' | Visibility |
| selected_users | UUID[] | DEFAULT '{}' | For SELECTED privacy |
| expires_at | TIMESTAMPTZ | NOT NULL | 24h from creation |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes**: `(user_id, expires_at DESC)`, `expires_at`

**Foreign Key**: `user_id` → `users.id` ON DELETE CASCADE

---

### status_views
Status view tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| status_id | UUID | FK → statuses.id | Status |
| user_id | UUID | FK → users.id | Viewer |
| viewed_at | TIMESTAMPTZ | DEFAULT now() | View time |

**Unique**: `(status_id, user_id)`

**Foreign Keys**:
- `status_id` → `statuses.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE CASCADE

---

## Calls

### calls
Call metadata (no media content stored).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| caller_id | UUID | FK → users.id | Caller |
| callee_id | UUID | FK → users.id | Callee |
| type | call_type | NOT NULL | VOICE, VIDEO |
| status | call_status | DEFAULT 'RINGING' | RINGING, ANSWERED, ENDED, MISSED, REJECTED, FAILED |
| started_at | TIMESTAMPTZ | NULLABLE | Answer time |
| ended_at | TIMESTAMPTZ | NULLABLE | End time |
| duration | INTEGER | NULLABLE | Duration in seconds |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes**: `(caller_id, created_at DESC)`, `(callee_id, created_at DESC)`

**Foreign Keys**:
- `caller_id` → `users.id` ON DELETE CASCADE
- `callee_id` → `users.id` ON DELETE CASCADE

---

## Privacy & Moderation

### blocked_users
User blocking relationships.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| blocker_id | UUID | FK → users.id | Blocker |
| blocked_id | UUID | FK → users.id | Blocked |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Unique**: `(blocker_id, blocked_id)`

**Indexes**: `blocker_id`, `blocked_id`

**Foreign Keys**:
- `blocker_id` → `users.id` ON DELETE CASCADE
- `blocked_id` → `users.id` ON DELETE CASCADE

---

### reports
Abuse reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| reporter_id | UUID | FK → users.id | Reporter |
| reported_id | UUID | FK → users.id | Reported user |
| category | report_category | NOT NULL | SPAM, HARASSMENT, etc. |
| description | TEXT | NULLABLE | Details |
| status | report_status | DEFAULT 'PENDING' | PENDING, REVIEWING, RESOLVED, DISMISSED |
| metadata | JSONB | NULLABLE | Additional context |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| reviewed_at | TIMESTAMPTZ | NULLABLE | Review time |
| reviewed_by | UUID | FK → users.id | Reviewer |

**Indexes**: `reporter_id`, `reported_id`, `status`

**Foreign Keys**:
- `reporter_id` → `users.id` ON DELETE CASCADE
- `reported_id` → `users.id` ON DELETE CASCADE
- `reviewed_by` → `users.id` ON DELETE SET NULL

---

## Notifications

### notifications
In-app and push notification tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | Recipient |
| type | VARCHAR(50) | NOT NULL | Event type |
| title | VARCHAR(200) | NOT NULL | Title |
| body | TEXT | NULLABLE | Body |
| data | JSONB | NULLABLE | Payload |
| is_read | BOOLEAN | DEFAULT false | Read state |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes**: `(user_id, is_read)`, `(user_id, created_at DESC)`

**Foreign Key**: `user_id` → `users.id` ON DELETE CASCADE

---

## Enums

### user_role
- `USER` - Regular user
- `ADMIN` - Admin user
- `SUPER_ADMIN` - Super admin

### conversation_type
- `DIRECT` - One-to-one
- `GROUP` - Group chat

### message_type
- `TEXT` - Text message
- `IMAGE` - Image
- `VIDEO` - Video
- `DOCUMENT` - Document/file
- `AUDIO` - Audio/voice message
- `CONTACT` - Contact card
- `LOCATION` - Location share
- `STICKER` - Sticker

### message_status
- `CREATED` - Created locally
- `SENDING` - Sending to server
- `SENT` - Received by server
- `DELIVERED` - Delivered to recipient
- `READ` - Read by recipient
- `FAILED` - Failed to send

### group_role
- `MEMBER` - Regular member
- `ADMIN` - Group admin
- `OWNER` - Group owner

### privacy_level
- `EVERYONE` - Everyone can see
- `CONTACTS` - Only contacts
- `CONTACTS_EXCEPT` - Contacts except selected
- `SELECTED` - Only selected users
- `NONE` - Nobody

### attachment_type
- `IMAGE` - Image file
- `VIDEO` - Video file
- `DOCUMENT` - Document
- `AUDIO` - Audio
- `THUMBNAIL` - Generated thumbnail

### call_type
- `VOICE` - Voice call
- `VIDEO` - Video call

### call_status
- `RINGING` - Call initiated
- `ANSWERED` - Call answered
- `ENDED` - Call ended normally
- `MISSED` - Not answered
- `REJECTED` - Explicitly rejected
- `FAILED` - Connection failed

### report_category
- `SPAM` - Spam
- `HARASSMENT` - Harassment
- `INAPPROPRIATE_CONTENT` - Inappropriate
- `FAKE_ACCOUNT` - Fake account
- `OTHER` - Other

### report_status
- `PENDING` - Awaiting review
- `REVIEWING` - Under review
- `RESOLVED` - Action taken
- `DISMISSED` - No action needed

### device_platform
- `ANDROID` - Android
- `IOS` - iOS
- `WEB` - Web
- `DESKTOP` - Desktop

---

## Performance Indexes

### Messages
```sql
-- Primary query patterns
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, id DESC);

-- Idempotency check
CREATE UNIQUE INDEX idx_messages_client_idempotency 
  ON messages(conversation_id, sender_id, client_message_id) 
  WHERE deleted_at IS NULL;
```

### Conversation Members
```sql
-- Membership lookups
CREATE UNIQUE INDEX idx_conversation_members_user_conversation 
  ON conversation_members(user_id, conversation_id) 
  WHERE left_at IS NULL;

CREATE INDEX idx_conversation_members_conversation_user 
  ON conversation_members(conversation_id, user_id) 
  WHERE left_at IS NULL;

-- Pinned/archived queries
CREATE INDEX idx_conversation_members_user_pinned 
  ON conversation_members(user_id, is_pinned DESC) 
  WHERE left_at IS NULL;

CREATE INDEX idx_conversation_members_user_archived 
  ON conversation_members(user_id, is_archived) 
  WHERE left_at IS NULL;
```

### Conversations
```sql
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC) 
  WHERE deleted_at IS NULL;
```

### Search
```sql
-- Full-text search on messages (if using PostgreSQL FTS)
CREATE INDEX idx_messages_content_fts 
  ON messages USING gin(to_tsvector('english', content));
```

---

## Migration Strategy

All schema changes managed via Prisma migrations:

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply in production
npx prisma migrate deploy

# View migration status
npx prisma migrate status
```

---

## Data Retention

| Table | Retention Policy |
|-------|------------------|
| messages | Indefinite (user deletable) |
| statuses | 24 hours (auto-expire) |
| status_views | 24 hours |
| calls | 1 year |
| notifications | 90 days |
| reports | 2 years |
| sessions | 30 days inactive |
| devices | 90 days inactive |

---

## Backup Strategy

- **Continuous**: WAL archiving to S3
- **Daily**: Full pg_dump to encrypted S3
- **Point-in-time recovery**: Enabled via WAL
- **Cross-region replication**: For disaster recovery