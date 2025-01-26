-- Add token and expires_at columns to feedback table
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours';

-- Update existing records with a default token
UPDATE public.feedback 
SET token = encode(gen_random_bytes(16), 'hex')
WHERE token IS NULL;

-- Now make the columns required for future records
ALTER TABLE public.feedback
ALTER COLUMN token SET NOT NULL,
ALTER COLUMN expires_at SET NOT NULL;
