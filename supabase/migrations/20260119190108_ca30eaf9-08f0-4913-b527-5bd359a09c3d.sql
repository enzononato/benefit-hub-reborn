-- Add status column to profiles table for tracking active/terminated collaborators
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativo';

-- Create index for performance on status queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Add comment for documentation
COMMENT ON COLUMN profiles.status IS 'Status do colaborador: ativo ou demitido';