-- Migració per afegir control de franges horàries a les absències
ALTER TABLE public.absences 
ADD COLUMN IF NOT EXISTS is_full_day boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS start_time time,
ADD COLUMN IF NOT EXISTS end_time time;

-- Actualitzem les existents
UPDATE public.absences SET is_full_day = true;

COMMENT ON COLUMN public.absences.is_full_day IS 'Indica si l''absència és per tot el dia (true) o només una part (false)';
COMMENT ON COLUMN public.absences.start_time IS 'Hora d''inici si no és dia sencer';
COMMENT ON COLUMN public.absences.end_time IS 'Hora de fi si no és dia sencer';
