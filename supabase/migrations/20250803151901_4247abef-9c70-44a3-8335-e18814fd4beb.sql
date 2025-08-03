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

-- Create RLS policies for sales_records
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

-- Insert sample data for demonstration
-- Sample cows
INSERT INTO public.cows (name, breed, health_status, birth_date, last_milking_amount) VALUES
('Bella', 'Holstein', 'healthy', '2020-03-15', 15.2),
('Daisy', 'Jersey', 'healthy', '2019-08-22', 12.8),
('Luna', 'Holstein', 'sick', '2021-01-10', 8.5),
('Ruby', 'Guernsey', 'healthy', '2020-11-05', 14.3),
('Rosie', 'Friesian', 'healthy', '2019-12-12', 16.1);

-- Sample milk records (last 7 days)
INSERT INTO public.milk_records (cow_id, amount, date, milking_time) 
SELECT 
  c.id,
  (random() * 10 + 8)::DECIMAL(5,2),
  CURRENT_DATE - interval '1 day' * generate_series(0, 6),
  '06:00:00'
FROM public.cows c, generate_series(0, 6) AS days;

-- Sample egg records
INSERT INTO public.egg_records (count, date) VALUES
(24, CURRENT_DATE),
(26, CURRENT_DATE - 1),
(22, CURRENT_DATE - 2),
(28, CURRENT_DATE - 3),
(25, CURRENT_DATE - 4),
(23, CURRENT_DATE - 5),
(27, CURRENT_DATE - 6);

-- Sample slaughter records
INSERT INTO public.slaughter_records (animal_type, count, date, weight_kg) VALUES
('chicken', 2, CURRENT_DATE, 3.2),
('chicken', 0, CURRENT_DATE - 1, 0),
('chicken', 1, CURRENT_DATE - 2, 2.8),
('chicken', 3, CURRENT_DATE - 3, 8.9);

-- Sample feed inventory
INSERT INTO public.feed_inventory (feed_type, current_stock, reorder_level, unit, cost_per_unit, supplier) VALUES
('Dairy Concentrate', 50, 100, 'kg', 2.50, 'Feed Suppliers Ltd'),
('Hay', 25, 50, 'bales', 15.00, 'Local Farm'),
('Chicken Feed', 150, 100, 'kg', 1.80, 'Poultry Supply Co'),
('Mineral Supplements', 200, 150, 'kg', 5.00, 'Nutrition Plus');

-- Sample sales records
INSERT INTO public.sales_records (shop_id, product_type, quantity, amount, date) VALUES
(1, 'Fresh Milk', 45.5, 2275.00, CURRENT_DATE),
(2, 'Fresh Milk', 32.0, 1600.00, CURRENT_DATE),
(1, 'Eggs', 24, 480.00, CURRENT_DATE),
(2, 'Eggs', 18, 360.00, CURRENT_DATE),
(1, 'Fresh Milk', 42.3, 2115.00, CURRENT_DATE - 1),
(2, 'Fresh Milk', 38.5, 1925.00, CURRENT_DATE - 1),
(1, 'Chicken Meat', 3.2, 960.00, CURRENT_DATE - 1),
(2, 'Eggs', 26, 520.00, CURRENT_DATE - 1);