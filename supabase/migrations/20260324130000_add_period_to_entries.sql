-- Add period field to time_entries to distinguish morning/afternoon
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS period text CHECK (period IN ('morning', 'afternoon', 'full')) DEFAULT 'full';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS time_entries_period_idx ON time_entries (period);
