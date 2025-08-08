-- Create product_prices table to manage per-shop product prices
CREATE TABLE public.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id integer REFERENCES public.shops(id) ON DELETE CASCADE,
  product_type text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_shop_product UNIQUE (shop_id, product_type)
);

-- Enable RLS
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow farm_owner and farm_manager to view all prices; shop_manager can view prices for their own shop
CREATE POLICY "Allowed roles can view product prices"
ON public.product_prices
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (
        p.role = 'farm_owner'::public.user_role OR
        p.role = 'farm_manager'::public.user_role OR
        (p.role = 'shop_manager'::public.user_role AND p.shop_id = product_prices.shop_id)
      )
  )
);

-- Allow farm_owner and farm_manager to manage any; shop_manager can manage their own shop
CREATE POLICY "Allowed roles can insert product prices"
ON public.product_prices
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (
        p.role = 'farm_owner'::public.user_role OR
        p.role = 'farm_manager'::public.user_role OR
        (p.role = 'shop_manager'::public.user_role AND p.shop_id = product_prices.shop_id)
      )
  )
);

CREATE POLICY "Allowed roles can update product prices"
ON public.product_prices
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (
        p.role = 'farm_owner'::public.user_role OR
        p.role = 'farm_manager'::public.user_role OR
        (p.role = 'shop_manager'::public.user_role AND p.shop_id = product_prices.shop_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (
        p.role = 'farm_owner'::public.user_role OR
        p.role = 'farm_manager'::public.user_role OR
        (p.role = 'shop_manager'::public.user_role AND p.shop_id = product_prices.shop_id)
      )
  )
);

-- Allow farm_owner to delete
CREATE POLICY "Farm owner can delete product prices"
ON public.product_prices
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'farm_owner'::public.user_role
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_prices_updated_at
BEFORE UPDATE ON public.product_prices
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();