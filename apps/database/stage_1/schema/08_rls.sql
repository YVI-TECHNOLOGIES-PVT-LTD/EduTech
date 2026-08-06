ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_chatbot_sessions ON chatbot_sessions
  USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- chatbot_messages has no org_id of its own; scope it via its parent session.
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_chatbot_messages ON chatbot_messages
  USING (
    session_id IN (
      SELECT session_id FROM chatbot_sessions
      WHERE org_id = current_setting('app.current_org_id', true)::UUID
    )
  );