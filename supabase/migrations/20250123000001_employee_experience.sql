-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('agent', 'admin', 'supervisor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for employees updated_at
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create ticket_assignments table
CREATE TABLE IF NOT EXISTS ticket_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unassigned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ticket_id, employee_id, assigned_at)
);

-- Create trigger for ticket_assignments updated_at
CREATE TRIGGER update_ticket_assignments_updated_at
    BEFORE UPDATE ON ticket_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('employee', 'customer', 'system')),
    message_body TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for ticket_messages updated_at
CREATE TRIGGER update_ticket_messages_updated_at
    BEFORE UPDATE ON ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create macros_templates table
CREATE TABLE IF NOT EXISTS macros_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    shared BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for macros_templates updated_at
CREATE TRIGGER update_macros_templates_updated_at
    BEFORE UPDATE ON macros_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create employee_metrics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS employee_metrics AS
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

-- Create index on employee_metrics
CREATE UNIQUE INDEX IF NOT EXISTS employee_metrics_employee_id_idx ON employee_metrics (employee_id);

-- Create function to refresh employee_metrics
CREATE OR REPLACE FUNCTION refresh_employee_metrics()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY employee_metrics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh employee_metrics
CREATE TRIGGER refresh_employee_metrics_on_ticket_update
    AFTER INSERT OR UPDATE ON tickets
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_employee_metrics();

CREATE TRIGGER refresh_employee_metrics_on_assignment_update
    AFTER INSERT OR UPDATE ON ticket_assignments
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_employee_metrics();

CREATE TRIGGER refresh_employee_metrics_on_message_update
    AFTER INSERT OR UPDATE ON ticket_messages
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_employee_metrics(); 