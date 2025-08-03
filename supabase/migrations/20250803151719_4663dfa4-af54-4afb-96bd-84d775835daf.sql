-- Create farm management tables with fixed RLS policies

-- Create cows table
CREATE TABLE public.cows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  breed TEXT,
  health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'sick', 'pregnant', 'treatment')),
  birth_date DATE,
  last_milking_amount DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milk_records table
CREATE TABLE public.milk_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cow_id UUID REFERENCES public.cows(id) ON DELETE CASCADE,
  amount DECIMAL(5,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  milking_time TIME,
  quality_grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create egg_records table
CREATE TABLE public.egg_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  count INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quality_grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create slaughter_records table
CREATE TABLE public.slaughter_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_type TEXT NOT NULL DEFAULT 'chicken',
  count INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(6,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feed_inventory table
CREATE TABLE public.feed_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_type TEXT NOT NULL,
  current_stock DECIMAL(8,2) NOT NULL,
  reorder_level DECIMAL(8,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  cost_per_unit DECIMAL(8,2),
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales_records table
CREATE TABLE public.sales_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id INTEGER REFERENCES public.shops(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egg_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slaughter_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cows
CREATE POLICY "Farm roles can view cows" ON public.cows FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm roles can manage cows" ON public.cows FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

-- Create RLS policies for milk_records
CREATE POLICY "Farm roles can view milk records" ON public.milk_records FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm roles can manage milk records" ON public.milk_records FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

-- Create RLS policies for egg_records
CREATE POLICY "Farm roles can view egg records" ON public.egg_records FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm roles can manage egg records" ON public.egg_records FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

-- Create RLS policies for slaughter_records
CREATE POLICY "Farm roles can view slaughter records" ON public.slaughter_records FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm roles can manage slaughter records" ON public.slaughter_records FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

-- Create RLS policies for feed_inventory
CREATE POLICY "Farm roles can view feed inventory" ON public.feed_inventory FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm roles can manage feed inventory" ON public.feed_inventory FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

-- Create RLS policies for sales_records (FIXED)
CREATE POLICY "All authenticated users can view sales records" ON public.sales_records FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Shop managers can create sales for their shop" ON public.sales_records FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (role = 'farm_owner' OR (role = 'shop_manager' AND shop_id = sales_records.shop_id))
  )
);

CREATE POLICY "Farm owners and shop managers can update sales" ON public.sales_records FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (role = 'farm_owner' OR (role = 'shop_manager' AND shop_id = sales_records.shop_id))
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_cows_updated_at
  BEFORE UPDATE ON public.cows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_milk_records_updated_at
  BEFORE UPDATE ON public.milk_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_egg_records_updated_at
  BEFORE UPDATE ON public.egg_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slaughter_records_updated_at
  BEFORE UPDATE ON public.slaughter_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feed_inventory_updated_at
  BEFORE UPDATE ON public.feed_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_records_updated_at
  BEFORE UPDATE ON public.sales_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();