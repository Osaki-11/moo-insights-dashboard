-- Remove processing fields from milk_records and create separate processing table
ALTER TABLE milk_records 
DROP COLUMN IF EXISTS mala_amount,
DROP COLUMN IF EXISTS yoghurt_amount;

-- Create milk processing records table
CREATE TABLE milk_processing_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mala_amount NUMERIC NOT NULL DEFAULT 0,
  yoghurt_amount NUMERIC NOT NULL DEFAULT 0,
  total_milk_used NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE milk_processing_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Farm roles can manage processing records" 
ON milk_processing_records 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY(ARRAY['farm_owner'::user_role, 'farm_manager'::user_role])
));

CREATE POLICY "Farm roles can view processing records" 
ON milk_processing_records 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY(ARRAY['farm_owner'::user_role, 'farm_manager'::user_role])
));

-- Add trigger for timestamps
CREATE TRIGGER update_milk_processing_records_updated_at
BEFORE UPDATE ON milk_processing_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();