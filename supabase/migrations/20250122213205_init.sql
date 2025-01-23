-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT CHECK (status IN ('open', 'pending', 'resolved')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    category TEXT CHECK (category IN ('technical_support', 'billing', 'feature_request', 'general_inquiry')),
    email TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb
);

-- Create ticket_history table
CREATE TABLE IF NOT EXISTS ticket_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    changed_by TEXT NOT NULL,
    changes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create schema_definitions table
CREATE TABLE IF NOT EXISTS schema_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_name TEXT NOT NULL UNIQUE,
    field_type TEXT CHECK (field_type IN ('text', 'number', 'date', 'boolean')),
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT CHECK (action_type IN ('SCHEMA_UPDATE', 'TICKET_CREATE', 'TICKET_UPDATE')),
    action_details JSONB NOT NULL,
    performed_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schema_definitions_updated_at
    BEFORE UPDATE ON schema_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 