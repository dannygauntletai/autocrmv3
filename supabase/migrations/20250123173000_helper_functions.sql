-- Function to disable employee metrics trigger
CREATE OR REPLACE FUNCTION disable_employee_metrics_trigger()
RETURNS void AS $$
BEGIN
  ALTER TABLE tickets DISABLE TRIGGER refresh_employee_metrics_on_ticket_update;
END;
$$ LANGUAGE plpgsql;

-- Function to enable employee metrics trigger
CREATE OR REPLACE FUNCTION enable_employee_metrics_trigger()
RETURNS void AS $$
BEGIN
  ALTER TABLE tickets ENABLE TRIGGER refresh_employee_metrics_on_ticket_update;
END;
$$ LANGUAGE plpgsql; 