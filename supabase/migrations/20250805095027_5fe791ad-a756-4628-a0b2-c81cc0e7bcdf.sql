-- Add fields for milking period and milk processing
ALTER TABLE milk_records 
ADD COLUMN milking_period text CHECK (milking_period IN ('morning', 'afternoon', 'evening')),
ADD COLUMN mala_amount numeric DEFAULT 0,
ADD COLUMN yoghurt_amount numeric DEFAULT 0;