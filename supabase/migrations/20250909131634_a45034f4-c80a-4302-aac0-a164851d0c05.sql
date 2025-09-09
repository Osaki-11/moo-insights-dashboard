-- Fix RLS issue - enable RLS on inventory table that was missing it
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory table
CREATE POLICY "Farm owners and managers can view inventory" 
ON public.inventory 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY(ARRAY['farm_owner'::user_role, 'farm_manager'::user_role])
));

CREATE POLICY "Farm owners and managers can manage inventory" 
ON public.inventory 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY(ARRAY['farm_owner'::user_role, 'farm_manager'::user_role])
));