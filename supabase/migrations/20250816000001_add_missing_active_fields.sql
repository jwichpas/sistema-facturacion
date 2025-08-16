-- Add missing active fields to brands and categories tables
-- This migration addresses TypeScript type compatibility issues where the application
-- expects 'active' fields that don't exist in the database schema

-- Add active field to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Add active field to categories table  
ALTER TABLE categories ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Add indexes for performance on active field queries
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(active);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);

-- Add comments to document the fields
COMMENT ON COLUMN brands.active IS 'Indica si la marca está activa y disponible para uso';
COMMENT ON COLUMN categories.active IS 'Indica si la categoría está activa y disponible para uso';

-- Update existing records to be active by default
UPDATE brands SET active = true WHERE active IS NULL;
UPDATE categories SET active = true WHERE active IS NULL;