-- Create a security definer function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Farm owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Farm owners can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Farm owners can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Farm owners can delete profiles" ON public.profiles;

-- Create new policies using the security definer function
CREATE POLICY "Farm owners can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  public.get_current_user_role() = 'farm_owner'
  OR 
  auth.uid() = user_id
);

CREATE POLICY "Farm owners can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  public.get_current_user_role() = 'farm_owner'
  OR 
  auth.uid() = user_id
);

CREATE POLICY "Farm owners can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  public.get_current_user_role() = 'farm_owner'
);

CREATE POLICY "Farm owners can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
  public.get_current_user_role() = 'farm_owner'
);