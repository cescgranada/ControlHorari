-- Migració per afegir estat a les absències
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'absence_status') THEN
        CREATE TYPE public.absence_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

ALTER TABLE public.absences 
ADD COLUMN IF NOT EXISTS status public.absence_status NOT NULL DEFAULT 'pending';

-- Actualitzem les existents: baixes mèdiques a 'approved', la resta a 'approved' per retrocompatibilitat
UPDATE public.absences 
SET status = 'approved';

-- A partir d'ara, el default dependrà del tipus en la lògica d'aplicació o triggers, 
-- però per simplificar la DB ho deixem com a pending i l'acció ho canviarà si és sick.

-- Assegurem que els admins poden actualitzar l'estat (ja està cobert per la política existent, però la validem)
-- La política 'absences_update_own_or_admin' ja permet a l'admin fer updates.
