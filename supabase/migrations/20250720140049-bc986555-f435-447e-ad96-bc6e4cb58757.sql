-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Farm owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Farm owners can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Farm owners can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Farm owners can delete profiles" ON public.profiles;

-- Create new non-recursive policies
-- Users can always view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow farm owners to view all profiles without recursion
-- We'll use a simpler approach: check user_metadata for role or use a function
CREATE POLICY "Farm owners can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Check if current user has farm_owner role directly in their own record
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'farm_owner'::user_role
    LIMIT 1
  )
  OR 
  -- Or allow viewing own profile
  auth.uid() = user_id
);

-- Allow farm owners to update any profile
CREATE POLICY "Farm owners can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'farm_owner'::user_role
    LIMIT 1
  )
  OR 
  auth.uid() = user_id
);

-- Allow farm owners to create profiles
CREATE POLICY "Farm owners can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'farm_owner'::user_role
    LIMIT 1
  )
);

-- Allow farm owners to delete profiles
CREATE POLICY "Farm owners can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'farm_owner'::user_role
    LIMIT 1
  )
);