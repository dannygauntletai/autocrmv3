-- Remove embedding_status column from files table
ALTER TABLE public.files 
DROP COLUMN IF EXISTS embedding_status;