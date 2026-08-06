CREATE VIEW chatbot_transcripts AS
SELECT
  s.session_id,
  s.org_id,
  s.channel,
  s.status,
  s.lead_id,
  l.student_first_name,
  l.stage         AS lead_stage,
  m.message_id,
  m.sender,
  m.content,
  m.intent,
  m.confidence_score,
  m.created_at    AS message_at
FROM chatbot_sessions s
JOIN chatbot_messages m ON m.session_id = s.session_id
LEFT JOIN leads l ON l.lead_id = s.lead_id
ORDER BY s.session_id, m.created_at;
