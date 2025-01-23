-- Rename the table
ALTER TABLE IF EXISTS skills RENAME TO team_skills;

-- Add team_id column
ALTER TABLE team_skills 
ADD COLUMN team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE;

-- Add a unique constraint to prevent duplicate skills within a team
ALTER TABLE team_skills 
ADD CONSTRAINT unique_skill_per_team UNIQUE (team_id, skill_name); 