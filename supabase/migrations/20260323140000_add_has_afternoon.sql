-- Migració per afegir columna has_afternoon a weekly_schedules
ALTER TABLE weekly_schedules 
ADD COLUMN IF NOT EXISTS has_afternoon boolean NOT NULL DEFAULT true;
