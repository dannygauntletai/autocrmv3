-- Create enum type for employee status
CREATE TYPE employee_status AS ENUM ('pending', 'active', 'inactive');

-- Add status column to employees table with default value of 'pending'
ALTER TABLE employees 
ADD COLUMN status employee_status NOT NULL DEFAULT 'pending';

-- Add comment to explain the column
COMMENT ON COLUMN employees.status IS 'Status of the employee account. pending: invite sent but not confirmed, active: account confirmed and active, inactive: account disabled'; 