-- Add cost tracking table for farm expenses
CREATE TABLE public.farm_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL, -- feed, labor, veterinary, utilities, equipment, etc.
  amount numeric NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for farm expenses
CREATE POLICY "Farm roles can manage expenses" 
ON public.farm_expenses 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY(ARRAY['farm_owner'::user_role, 'farm_manager'::user_role])
));

CREATE POLICY "Farm roles can view expenses" 
ON public.farm_expenses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY(ARRAY['farm_owner'::user_role, 'farm_manager'::user_role])
));

-- Add payment tracking to sales records
ALTER TABLE public.sales_records 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
ADD COLUMN IF NOT EXISTS payment_date date,
ADD COLUMN IF NOT EXISTS due_date date DEFAULT (date + INTERVAL '30 days');

-- Add cost per unit tracking to production
ALTER TABLE public.milk_processing_records 
ADD COLUMN IF NOT EXISTS production_cost numeric DEFAULT 0;

-- Create trigger for automatic updated_at
CREATE TRIGGER update_farm_expenses_updated_at
BEFORE UPDATE ON public.farm_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();