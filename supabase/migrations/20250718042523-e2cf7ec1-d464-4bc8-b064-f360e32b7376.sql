-- Phase 2: Farm Data Management Schema

-- Create animals table for livestock tracking
CREATE TABLE public.animals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cow', 'chicken')),
  breed TEXT,
  birth_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deceased')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milk production records
CREATE TABLE public.milk_production (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_time TEXT NOT NULL CHECK (session_time IN ('morning', 'afternoon', 'evening')),
  liters DECIMAL(5,2) NOT NULL CHECK (liters >= 0),
  quality_notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(animal_id, date, session_time)
);

-- Create egg collection records
CREATE TABLE public.egg_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL CHECK (count >= 0),
  broken_count INTEGER DEFAULT 0 CHECK (broken_count >= 0),
  collection_time TEXT NOT NULL CHECK (collection_time IN ('morning', 'afternoon', 'evening')),
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feed inventory table
CREATE TABLE public.feed_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_type TEXT NOT NULL,
  quantity_kg DECIMAL(8,2) NOT NULL CHECK (quantity_kg >= 0),
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  low_stock_threshold DECIMAL(8,2) DEFAULT 100,
  supplier TEXT,
  notes TEXT,
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feed usage records
CREATE TABLE public.feed_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_inventory_id UUID NOT NULL REFERENCES public.feed_inventory(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_used DECIMAL(8,2) NOT NULL CHECK (quantity_used > 0),
  animal_type TEXT NOT NULL CHECK (animal_type IN ('cow', 'chicken', 'mixed')),
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egg_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for animals
CREATE POLICY "Farm staff can view animals" 
ON public.animals FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm staff can manage animals" 
ON public.animals FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

-- RLS Policies for milk production
CREATE POLICY "Farm staff can view milk production" 
ON public.milk_production FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm staff can record milk production" 
ON public.milk_production FOR INSERT 
WITH CHECK (
  recorded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm staff can update milk production" 
ON public.milk_production FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

-- RLS Policies for egg collection
CREATE POLICY "Farm staff can view egg collection" 
ON public.egg_collection FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm staff can record egg collection" 
ON public.egg_collection FOR INSERT 
WITH CHECK (
  recorded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm staff can update egg collection" 
ON public.egg_collection FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

-- RLS Policies for feed inventory
CREATE POLICY "Farm staff can view feed inventory" 
ON public.feed_inventory FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm staff can manage feed inventory" 
ON public.feed_inventory FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

-- RLS Policies for feed usage
CREATE POLICY "Farm staff can view feed usage" 
ON public.feed_usage FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

CREATE POLICY "Farm staff can record feed usage" 
ON public.feed_usage FOR INSERT 
WITH CHECK (
  recorded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('farm_owner', 'farm_manager')
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_animals_updated_at
BEFORE UPDATE ON public.animals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_milk_production_updated_at
BEFORE UPDATE ON public.milk_production
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_egg_collection_updated_at
BEFORE UPDATE ON public.egg_collection
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feed_inventory_updated_at
BEFORE UPDATE ON public.feed_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feed_usage_updated_at
BEFORE UPDATE ON public.feed_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample animals
INSERT INTO public.animals (name, type, breed) VALUES
('Bessie', 'cow', 'Holstein'),
('Moobert', 'cow', 'Jersey'),
('Clarabelle', 'cow', 'Holstein'),
('Daisy', 'cow', 'Guernsey'),
('Rosie', 'cow', 'Holstein'),
('Buttercup', 'cow', 'Jersey'),
('Milky Way', 'cow', 'Holstein');

-- Insert sample feed inventory
INSERT INTO public.feed_inventory (feed_type, quantity_kg, low_stock_threshold, updated_by) VALUES
('Cow Feed Mix', 150.0, 100.0, (SELECT id FROM auth.users LIMIT 1)),
('Chicken Feed', 75.0, 50.0, (SELECT id FROM auth.users LIMIT 1)),
('Hay Bales', 500.0, 200.0, (SELECT id FROM auth.users LIMIT 1));