-- Drop the existing role constraint if it exists
ALTER TABLE employee_teams
DROP CONSTRAINT IF EXISTS employee_teams_role_check;

-- Add a new check constraint that allows both 'agent' and 'supervisor'
ALTER TABLE employee_teams
ADD CONSTRAINT employee_teams_role_check
CHECK (role IN ('agent', 'supervisor')); 