-- Clear data_payload for expired exports
UPDATE data_requests
SET data_payload = NULL
WHERE status = 'completed'
  AND request_type = 'export'
  AND expires_at IS NOT NULL
  AND expires_at < now()
  AND data_payload IS NOT NULL;
