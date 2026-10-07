-- Phase 2: Add database indexes for messaging performance

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON messages(sender_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_client_idempotency ON messages(conversation_id, sender_id, client_message_id) WHERE deleted_at IS NULL;

-- Conversation members indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_members_user_conversation ON conversation_members(user_id, conversation_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_user ON conversation_members(conversation_id, user_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_archived ON conversation_members(user_id, is_archived) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_pinned ON conversation_members(user_id, is_pinned) WHERE left_at IS NULL;

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);

-- Message read receipts
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user ON message_read_receipts(user_id);

-- Message reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_reactions_unique ON message_reactions(message_id, user_id, emoji);

-- Status indexes
CREATE INDEX IF NOT EXISTS idx_statuses_user_expires ON statuses(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_views_status ON status_views(status_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_status_views_unique ON status_views(status_id, user_id);

-- Calls indexes
CREATE INDEX IF NOT EXISTS idx_calls_caller_created ON calls(caller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_callee_created ON calls(callee_id, created_at DESC);

-- Blocked users
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Groups
CREATE INDEX IF NOT EXISTS idx_groups_conversation ON groups(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id) WHERE left_at IS NULL;