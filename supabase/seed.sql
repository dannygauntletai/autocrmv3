-- Seed employees
INSERT INTO employees (id, name, email, role, created_at) VALUES
    ('d7f77a1e-a4d0-4f11-b4c3-2b6e3f885d09', 'Danny Mota', 'danny.mota@gauntletai.com', 'admin', NOW() - INTERVAL '30 days'),
    ('b5f6c472-4c91-4c5c-9a3d-169573b5194d', 'John Smith', 'john.smith@example.com', 'agent', NOW() - INTERVAL '25 days'),
    ('e9b6f5d4-3c2b-4a1d-9e8f-147852369abc', 'Sarah Johnson', 'sarah.j@example.com', 'supervisor', NOW() - INTERVAL '20 days'),
    ('f8c7b9a5-8e44-6f38-7777-8e88e6de6e5c', 'Bob Wilson', 'bob@autocrm.app', 'agent', NOW() - INTERVAL '15 days'),
    ('a1b2c3d4-9f55-7e49-6666-7d99d7ed7f6d', 'Alice Brown', 'alice@autocrm.app', 'admin', NOW() - INTERVAL '10 days');

-- Seed tickets
INSERT INTO tickets (id, status, priority, category, email, title, description, tags, created_at) VALUES
    ('f4d7e1a9-8c6b-4b3a-9f2d-5e7c8d9a1b3c', 'open', 'high', 'technical_support', 'customer1@example.com', 'Cannot access dashboard', 'Getting 404 error when trying to access the main dashboard', ARRAY['bug', 'urgent'], NOW() - INTERVAL '5 days'),
    ('c2b1a8d6-7e4f-4c3d-8b2a-1f9e7d6c5b4a', 'pending', 'medium', 'billing', 'customer2@example.com', 'Billing cycle question', 'Need clarification about the billing cycle dates', ARRAY['billing'], NOW() - INTERVAL '3 days'),
    ('a9b8c7d6-e5f4-4c2d-9e8f-5a4b3c2d1e0f', 'resolved', 'low', 'feature_request', 'customer3@example.com', 'Dark mode suggestion', 'Would love to see a dark mode option', ARRAY['feature', 'ui'], NOW() - INTERVAL '10 days');

-- Seed ticket assignments
INSERT INTO ticket_assignments (ticket_id, employee_id, assigned_at) VALUES
    ('f4d7e1a9-8c6b-4b3a-9f2d-5e7c8d9a1b3c', 'b5f6c472-4c91-4c5c-9a3d-169573b5194d', NOW() - INTERVAL '4 days'),
    ('c2b1a8d6-7e4f-4c3d-8b2a-1f9e7d6c5b4a', 'e9b6f5d4-3c2b-4a1d-9e8f-147852369abc', NOW() - INTERVAL '2 days');

-- Seed ticket messages
INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message_body, is_internal, created_at) VALUES
    ('f4d7e1a9-8c6b-4b3a-9f2d-5e7c8d9a1b3c', 'b5f6c472-4c91-4c5c-9a3d-169573b5194d', 'employee', 'I''ll look into this right away. Can you please provide your dashboard URL?', false, NOW() - INTERVAL '4 days'),
    ('f4d7e1a9-8c6b-4b3a-9f2d-5e7c8d9a1b3c', 'b5f6c472-4c91-4c5c-9a3d-169573b5194d', 'employee', 'Checking server logs for any recent 404 errors', true, NOW() - INTERVAL '4 days'),
    ('c2b1a8d6-7e4f-4c3d-8b2a-1f9e7d6c5b4a', 'e9b6f5d4-3c2b-4a1d-9e8f-147852369abc', 'employee', 'Your billing cycle starts on the 1st of each month. Would you like me to explain the pro-rating?', false, NOW() - INTERVAL '2 days'),
    ('f4d7e1a9-8c6b-4b3a-9f2d-5e7c8d9a1b3c', 'f4d7e1a9-8c6b-4b3a-9f2d-5e7c8d9a1b3c', 'customer', 'I cannot log into my account. It says invalid credentials.', false, NOW() - INTERVAL '2 days'),
    ('c2b1a8d6-7e4f-4c3d-8b2a-1f9e7d6c5b4a', 'c2b1a8d6-7e4f-4c3d-8b2a-1f9e7d6c5b4a', 'customer', 'Why was I charged twice this month?', false, NOW() - INTERVAL '1 day');

-- Seed macros/templates
INSERT INTO macros_templates (title, content, owner_id, shared, created_at) VALUES
    ('Greeting Template', 'Hello! Thank you for reaching out to our support team. I''d be happy to help you with your inquiry.', 'd7f77a1e-a4d0-4f11-b4c3-2b6e3f885d09', true, NOW() - INTERVAL '15 days'),
    ('Technical Issue Response', 'I understand you''re experiencing technical difficulties. Let me investigate this for you. Could you please provide the following details:\n\n1. Browser and version\n2. Operating System\n3. Steps to reproduce the issue', 'b5f6c472-4c91-4c5c-9a3d-169573b5194d', true, NOW() - INTERVAL '10 days'),
    ('Billing Clarification', 'Our billing cycle runs from the 1st to the last day of each month. Your subscription will be pro-rated if you start mid-month.', 'e9b6f5d4-3c2b-4a1d-9e8f-147852369abc', true, NOW() - INTERVAL '5 days'),
    ('Password Reset Instructions', 'To reset your password, please follow these steps:\n1. Click on "Forgot Password"\n2. Enter your email address\n3. Check your email for reset instructions\n4. Click the reset link and create a new password', 'd7f77a1e-a4d0-4f11-b4c3-2b6e3f885d09', true, NOW() - INTERVAL '4 days'),
    ('Internal Escalation Note', 'This ticket requires supervisor review due to billing discrepancy. Please check payment gateway logs.', 'e9b6f5d4-3c2b-4a1d-9e8f-147852369abc', false, NOW() - INTERVAL '3 days');

-- Seed schema definitions
INSERT INTO schema_definitions (field_name, field_type, is_required) VALUES
    ('account_number', 'text', true),
    ('subscription_tier', 'text', true),
    ('last_login_date', 'date', false);

-- Seed audit logs
INSERT INTO audit_logs (action_type, action_details, performed_by) VALUES
    ('SCHEMA_UPDATE', '{"field": "account_number", "action": "add"}', 'danny.mota@gauntletai.com'),
    ('TICKET_CREATE', '{"ticket_id": "f4d7e1a9-8c6b-4b3a-9f2d-5e7c8d9a1b3c"}', 'system'),
    ('TICKET_UPDATE', '{"ticket_id": "c2b1a8d6-7e4f-4c3d-8b2a-1f9e7d6c5b4a", "changes": {"status": "pending"}}', 'sarah.j@example.com');

-- Seed API keys (for testing)
INSERT INTO api_keys (key_value, description, permissions) VALUES
    ('test_key_1', 'Development Testing Key', '{"read": true, "write": false}'::jsonb),
    ('test_key_2', 'Full Access Testing Key', '{"read": true, "write": true}'::jsonb);

-- Seed webhooks
INSERT INTO webhooks (url, event_types, secret, is_active) VALUES
    ('https://example.com/webhook1', ARRAY['ticket.created', 'ticket.updated'], 'webhook_secret_1', true),
    ('https://example.com/webhook2', ARRAY['ticket.resolved'], 'webhook_secret_2', true);

-- Seed API logs
INSERT INTO api_logs (api_key_id, endpoint_accessed, request_payload, response_code) 
SELECT 
    id,
    '/api/v1/tickets',
    '{"method": "GET"}'::jsonb,
    200
FROM api_keys 
WHERE key_value = 'test_key_1';

-- Refresh employee metrics
REFRESH MATERIALIZED VIEW employee_metrics; 