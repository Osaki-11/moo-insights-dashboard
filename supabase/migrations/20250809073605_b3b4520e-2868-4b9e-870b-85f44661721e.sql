-- Update RLS policies to only allow farm owners and farm managers to update product prices
DROP POLICY IF EXISTS "Allowed roles can update product prices" ON public.product_prices;
DROP POLICY IF EXISTS "Allowed roles can insert product prices" ON public.product_prices;

CREATE POLICY "Farm owners and managers can update product prices" 
ON public.product_prices 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role IN ('farm_owner', 'farm_manager')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role IN ('farm_owner', 'farm_manager')
));

CREATE POLICY "Farm owners and managers can insert product prices" 
ON public.product_prices 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role IN ('farm_owner', 'farm_manager')
));