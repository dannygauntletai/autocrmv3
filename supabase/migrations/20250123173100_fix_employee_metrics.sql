-- Drop existing triggers
DROP TRIGGER IF EXISTS refresh_employee_metrics_on_ticket_update ON tickets;
DROP TRIGGER IF EXISTS refresh_employee_metrics_on_assignment_update ON ticket_assignments;
DROP TRIGGER IF EXISTS refresh_employee_metrics_on_message_update ON ticket_messages;

-- Drop existing function
DROP FUNCTION IF EXISTS refresh_employee_metrics();

-- Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS employee_metrics;

-- Create a regular view instead
CREATE OR REPLACE VIEW employee_metrics AS
SELECT 
    e.id as employee_id,
    e.name as employee_name,
    COUNT(DISTINCT ta.ticket_id) as assigned_tickets_count,
    COUNT(DISTINCT CASE WHEN t.status = 'closed' THEN t.id END) as closed_tickets_count,
    AVG(EXTRACT(EPOCH FROM (tm_first.created_at - t.created_at))) as avg_first_response_time,
    AVG(EXTRACT(EPOCH FROM (t.updated_at - t.created_at))) as avg_resolution_time,
    NOW() as last_calculated_at
FROM 
    employees e
    LEFT JOIN ticket_assignments ta ON e.id = ta.employee_id
    LEFT JOIN tickets t ON ta.ticket_id = t.id
    LEFT JOIN LATERAL (
        SELECT created_at, ticket_id
        FROM ticket_messages
        WHERE sender_type = 'employee'
        ORDER BY created_at ASC
        LIMIT 1
    ) tm_first ON t.id = tm_first.ticket_id
GROUP BY e.id, e.name; 