-- Delete all non-admin accounts and related data
-- 1. Delete exam attempts for non-admin users
DELETE FROM public.exam_attempts
WHERE user_id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

-- 2. Delete access tokens assigned to non-admin users
DELETE FROM public.access_tokens
WHERE assigned_to IS NOT NULL AND assigned_to NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

-- 3. Remove non-admin roles (admin roles stay)
DELETE FROM public.user_roles
WHERE role != 'admin';

-- 4. Remove non-admin users from auth
DELETE FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');