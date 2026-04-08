-- Migració per crear taula de dies de baixa/personals
CREATE TYPE public.absence_type AS ENUM ('sick', 'personal', 'other');

CREATE TABLE public.absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  absence_date date NOT NULL,
  absence_type public.absence_type NOT NULL DEFAULT 'personal',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, absence_date)
);

CREATE INDEX absences_user_date_idx ON public.absences (user_id, absence_date);
CREATE INDEX absences_date_idx ON public.absences (absence_date);

-- RLS per absences
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

CREATE policy absences_select_own_or_admin
ON public.absences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE policy absences_insert_own_or_admin
ON public.absences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE policy absences_update_own_or_admin
ON public.absences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE policy absences_delete_own_or_admin
ON public.absences
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- Trigger per updated_at
CREATE TRIGGER set_absences_updated_at
BEFORE UPDATE ON public.absences
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Trigger d'auditoria
CREATE TRIGGER audit_absences_changes
AFTER INSERT OR UPDATE OR DELETE ON public.absences
FOR EACH ROW
EXECUTE FUNCTION public.audit_changes();

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.absences TO authenticated;
GRANT ALL ON public.absences TO service_role;
