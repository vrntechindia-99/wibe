# Wibe API Documentation

## Overview

This document describes the REST API and WebSocket events for the Wibe messaging platform.

**Base URL**: `http://localhost:3000/api/v1`

**Authentication**: JWT Bearer token in Authorization header

---

## Authentication

### Register
```
POST /auth/register
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "deviceId": "device-uuid",
  "platform": "ANDROID",
  "pushToken": "fcm-token",
  "appVersion": "1.0.0",
  "osVersion": "14"
}
```

**Response**: 201 - OTP sent

### Verify OTP (Registration)
```
POST /auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "otp": "123456",
  "deviceId": "device-uuid",
  "platform": "ANDROID"
}
```

**Response**: 200 - User created, tokens returned

### Login (Request OTP)
```
POST /auth/login
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "deviceId": "device-uuid",
  "platform": "ANDROID"
}
```

**Response**: 200 - OTP sent

### Verify OTP (Login)
```
POST /auth/verify-login
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "otp": "123456",
  "deviceId": "device-uuid",
  "platform": "ANDROID"
}
```

**Response**: 200 - User profile and tokens returned

### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token-string"
}
```

**Response**: 200 - New access and refresh tokens

### Logout
```
POST /auth/logout
Content-Type: application/json

{
  "deviceId": "device-uuid"
}
```

### Get Profile
```
GET /auth/profile
Authorization: Bearer <access-token>
```

---

## Users

### Get Current User
```
GET /users/me
Authorization: Bearer <access-token>
```

### Search Users
```
GET /users/search?q=john&limit=20
Authorization: Bearer <access-token>
```

### Get User Profile
```
GET /users/:userId
Authorization: Bearer <access-token>
```

### Update Profile
```
PUT /users/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "displayName": "John Doe",
  "about": "Hey there!"
}
```

### Get Avatar Upload URL
```
POST /users/avatar/upload-url
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "fileName": "avatar.jpg",
  "contentType": "image/jpeg"
}
```

**Response**: `{ "uploadUrl": "...", "downloadUrl": "...", "fileName": "..." }`

### Confirm Avatar Upload
```
PUT /users/avatar
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "avatarUrl": "https://cdn.example.com/avatars/user-id/..."
}
```

### Delete Avatar
```
DELETE /users/avatar
Authorization: Bearer <access-token>
```

### Privacy Settings
```
GET /users/privacy/settings
PUT /users/privacy/settings
Authorization: Bearer <access-token>
```

**Privacy Settings Body**:
```json
{
  "lastSeen": "CONTACTS",
  "profilePhoto": "CONTACTS",
  "about": "CONTACTS",
  "readReceipts": true,
  "status": "CONTACTS",
  "groups": "CONTACTS"
}
```

### Block User
```
POST /users/block/:userId
DELETE /users/block/:userId
GET /users/blocked
Authorization: Bearer <access-token>
```

---

## Conversations

### List Conversations
```
GET /conversations?page=1&limit=20&sortBy=updatedAt&sortOrder=desc&includeArchived=false
Authorization: Bearer <access-token>
```

**Response**:
```json
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
}
```

### Create Direct Conversation
```
POST /conversations
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "userId": "target-user-id"
}
```

### Create Group Conversation
```
POST /conversations
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Group Name",
  "description": "Group description",
  "userId": "optional-member-id"
}
```

### Get Conversation
```
GET /conversations/:conversationId
Authorization: Bearer <access-token>
```

### Update Conversation
```
PATCH /conversations/:conversationId
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "New Group Name",
  "description": "New description",
  "avatarUrl": "https://..."
}
```

### Pin/Unpin
```
POST /conversations/:conversationId/pin
DELETE /conversations/:conversationId/pin
```

### Mute/Unmute
```
POST /conversations/:conversationId/mute
DELETE /conversations/:conversationId/mute
Content-Type: application/json

{
  "duration": 3600
}
```

### Archive/Unarchive
```
POST /conversations/:conversationId/archive
DELETE /conversations/:conversationId/archive
```

### Mark Unread
```
POST /conversations/:conversationId/mark-unread
```

### Mark as Read
```
POST /conversations/:conversationId/read?messageId=optional
```

### Mark as Delivered
```
POST /conversations/:conversationId/delivered
Content-Type: application/json

{
  "messageId": "message-id"
}
```

### Delete Conversation
```
DELETE /conversations/:conversationId?forEveryone=false
```

---

## Messages

### Send Message
```
POST /conversations/:conversationId/messages
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "clientMessageId": "unique-client-id",
  "content": "Hello!",
  "replyToId": "optional-message-id"
}
```

### Get Messages
```
GET /conversations/:conversationId/messages?page=1&limit=50&before=2024-01-01T00:00:00Z
Authorization: Bearer <access-token>
```

### Search Messages
```
GET /conversations/:conversationId/messages/search?q=hello&limit=20
Authorization: Bearer <access-token>
```

### Get Message
```
GET /conversations/:conversationId/messages/:messageId
Authorization: Bearer <access-token>
```

### Update Message
```
PATCH /conversations/:conversationId/messages/:messageId
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "content": "Updated content"
}
```

### Delete Message
```
DELETE /conversations/:conversationId/messages/:messageId?forEveryone=false
Authorization: Bearer <access-token>
```

---

## Presence

### Get User Presence
```
GET /presence/user/:userId
Authorization: Bearer <access-token>
```

### Get Multiple Users Presence
```
GET /presence/users?ids=user1,user2,user3
Authorization: Bearer <access-token>
```

### Get Conversation Members Presence
```
GET /presence/conversation/:conversationId
Authorization: Bearer <access-token>
```

---

## Search

### Search Users
```
GET /search/users?q=john&limit=20
Authorization: Bearer <access-token>
```

### Search Conversations
```
GET /search/conversations?q=hello&limit=20
Authorization: Bearer <access-token>
```

### Search Messages
```
GET /search/messages?q=hello&conversationId=optional&limit=20
Authorization: Bearer <access-token>
```

---

## Notifications

### Get Notifications
```
GET /notifications?page=1&limit=20&unreadOnly=false
Authorization: Bearer <access-token>
```

### Get Unread Count
```
GET /notifications/unread-count
Authorization: Bearer <access-token>
```

### Mark as Read
```
PATCH /notifications/:notificationId/read
Authorization: Bearer <access-token>
```

### Mark All as Read
```
PATCH /notifications/read-all
Authorization: Bearer <access-token>
```

---

## WebSocket Events

### Connection
```
Namespace: /
Auth: { token: "access-token" } in handshake auth
```

### Client → Server Events

#### Subscribe to Conversations
```javascript
socket.emit('subscribe', { conversationIds: ['conv-1', 'conv-2'] });
```

#### Unsubscribe
```javascript
socket.emit('unsubscribe', { conversationIds: ['conv-1'] });
```

#### Typing Started
```javascript
socket.emit('typing_started', { conversationId: 'conv-1' });
```

#### Typing Stopped
```javascript
socket.emit('typing_stopped', { conversationId: 'conv-1' });
```

#### Message Read
```javascript
socket.emit('message_read', { conversationId: 'conv-1', messageId: 'msg-1' });
```

#### Message Delivered
```javascript
socket.emit('message_delivered', { conversationId: 'conv-1', messageId: 'msg-1' });
```

#### Ping
```javascript
socket.emit('ping');
```

### Server → Client Events

#### New Message
```javascript
socket.on('new_message', (data) => {
  // { conversationId, message: {...} }
});
```

#### Message Updated
```javascript
socket.on('message_updated', (data) => {
  // { conversationId, message: {...} }
});
```

#### Message Deleted
```javascript
socket.on('message_deleted', (data) => {
  // { conversationId, messageId, forEveryone }
});
```

#### Message Delivered
```javascript
socket.on('message_delivered', (data) => {
  // { conversationId, messageId, userId }
});
```

#### Message Read
```javascript
socket.on('message_read', (data) => {
  // { conversationId, messageId, userId }
});
```

#### Typing Started
```javascript
socket.on('typing_started', (data) => {
  // { conversationId, userId }
});
```

#### Typing Stopped
```javascript
socket.on('typing_stopped', (data) => {
  // { conversationId, userId }
});
```

#### User Online
```javascript
socket.on('user_online', (data) => {
  // { userId, timestamp }
});
```

#### User Offline
```javascript
socket.on('user_offline', (data) => {
  // { userId, timestamp, lastSeen }
});
```

#### Presence
```javascript
socket.on('presence', (data) => {
  // { type: 'user_online'|'user_offline', payload: {...} }
});
```

---

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ErrorCode",
    "message": "Human readable message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/..."
}
```

### Common Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | BadRequest | Validation error |
| 401 | Unauthorized | Invalid or expired token |
| 403 | Forbidden | Insufficient permissions |
| 404 | NotFound | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | TooManyRequests | Rate limited |
| 500 | InternalServerError | Server error |
| 503 | ServiceUnavailable | Service temporarily unavailable |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth endpoints | 10 requests | 15 minutes |
| Message sending | 30 messages | 1 minute |
| Search | 20 requests | 1 minute |
| File upload | 10 requests | 1 minute |

---

## Pagination

All list endpoints support:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sortBy` and `sortOrder` where applicable

Response includes:
```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```