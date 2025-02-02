-- Add custom setting for AI employee password
ALTER DATABASE postgres SET custom.ai_employee_password FROM CURRENT;

-- Set the password value (this will be replaced by the actual password during deployment)
ALTER DATABASE postgres SET custom.ai_employee_password TO :'AI_EMPLOYEE_PASSWORD'; 