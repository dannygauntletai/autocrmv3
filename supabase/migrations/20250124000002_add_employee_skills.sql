-- Create employee_skills table
CREATE TABLE IF NOT EXISTS employee_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skills JSONB NOT NULL DEFAULT '{}', -- Will store key-value pairs of skill_name: proficiency (1-5)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate entries for the same employee
ALTER TABLE employee_skills
ADD CONSTRAINT unique_employee_skills UNIQUE (employee_id);

-- Create trigger for updated_at
CREATE TRIGGER update_employee_skills_updated_at
    BEFORE UPDATE ON employee_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 