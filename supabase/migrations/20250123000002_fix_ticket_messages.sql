-- Drop existing ticket_messages table if it exists
DROP TABLE IF EXISTS ticket_messages;

-- Create ticket_messages table with proper foreign key relationships
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

-- Create index for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- Add updated_at trigger if it doesn't exist
DO $$ BEGIN
    CREATE TRIGGER update_ticket_messages_updated_at
        BEFORE UPDATE ON ticket_messages
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$; 