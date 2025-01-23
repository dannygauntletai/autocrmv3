-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_teams junction table
CREATE TABLE employee_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('team_lead', 'agent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, team_id)
);

-- Rename ticket_assignments to employee_ticket_assignments
ALTER TABLE ticket_assignments 
    RENAME TO employee_ticket_assignments;

-- Create team_ticket_assignments table
CREATE TABLE team_ticket_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unassigned_at TIMESTAMP WITH TIME ZONE
);

-- Create a partial unique index for active team assignments
CREATE UNIQUE INDEX team_ticket_active_assignment_idx 
    ON team_ticket_assignments (ticket_id, team_id) 
    WHERE unassigned_at IS NULL;

-- Add updated_at trigger for teams
CREATE TRIGGER set_timestamp_teams
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
