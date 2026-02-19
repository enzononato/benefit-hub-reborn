
-- Create profiles for auth users that don't have one yet
INSERT INTO profiles (user_id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE p.id IS NULL
  AND u.id != 'a1ace2ca-e0d5-4821-885c-5053f6f8ffc3'; -- exclude existing admin

-- Assign agente_dp role to all auth users except the admin
-- First, insert role for users that don't have any role yet
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'agente_dp'::app_role
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.id != 'a1ace2ca-e0d5-4821-885c-5053f6f8ffc3';

-- Update existing colaborador roles to agente_dp for these auth users (except admin)
UPDATE user_roles
SET role = 'agente_dp'
WHERE user_id IN (
  SELECT u.id FROM auth.users u
  WHERE u.id != 'a1ace2ca-e0d5-4821-885c-5053f6f8ffc3'
)
AND role = 'colaborador';
