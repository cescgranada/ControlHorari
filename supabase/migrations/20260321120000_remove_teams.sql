-- ============================================
-- MIGRACIÓ: ELIMINAR EQUIPS
-- ============================================
-- Aquesta migració elimina totes les referències als equips:
-- 1. Elimina polítiques RLS relacionades amb equips
-- 2. Elimina funcions de coordinador i equips
-- 3. Elimina taules teams i team_members
-- 4. Redefineix funcions d'accés sense equips
-- ============================================

-- PAS 1: Eliminar polítiques RLS relacionades amb equips
DROP POLICY IF EXISTS teams_select_visible ON public.teams;
DROP POLICY IF EXISTS teams_manage_admin ON public.teams;
DROP POLICY IF EXISTS team_members_select_visible ON public.team_members;
DROP POLICY IF EXISTS team_members_manage_admin ON public.team_members;

-- PAS 2: Eliminar funcions que depenen de les taules d'equips
DROP FUNCTION IF EXISTS public.coordinator_can_access_user(target_user_id uuid);
DROP FUNCTION IF EXISTS public.can_access_team(target_team_id uuid);
DROP FUNCTION IF EXISTS public.can_manage_team(target_team_id uuid);

-- PAS 3: Eliminar taules (en ordre per les foreign keys)
DROP TABLE IF EXISTS public.team_members;
DROP TABLE IF EXISTS public.teams;

-- PAS 4: Redefinir funcions d'accés sense la part de coordinador
-- Funció can_access_user: només administrador o l'usuari mateix
CREATE OR REPLACE FUNCTION public.can_access_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    auth.uid() = target_user_id
    OR public.is_admin()
  )
$$;

-- Funció can_manage_user: només administrador (sense coordinadors)
CREATE OR REPLACE FUNCTION public.can_manage_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_admin()
  )
$$;

-- PAS 5: Redefinir funció can_access_audit_row sense coordinadors
CREATE OR REPLACE FUNCTION public.can_access_audit_row(target_table_name text, target_row_id text, target_actor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if public.is_admin() then
    return true;
  end if;

  if target_actor_id = auth.uid() then
    return true;
  end if;

  if target_table_name = 'profiles' and target_row_id ~* '^[0-9a-f-]{36}$' then
    return public.can_access_user(target_row_id::uuid);
  end if;

  if target_table_name = 'time_entries' and target_row_id ~* '^[0-9a-f-]{36}$' then
    return exists (
      select 1
      from public.time_entries te
      where te.id = target_row_id::uuid
        and public.can_access_user(te.user_id)
    );
  end if;

  if target_table_name = 'breaks' and target_row_id ~* '^[0-9a-f-]{36}$' then
    return exists (
      select 1
      from public.breaks b
      join public.time_entries te on te.id = b.entry_id
      where b.id = target_row_id::uuid
        and public.can_access_user(te.user_id)
    );
  end if;

  return false;
end;
$$;

-- PAS 6: Eliminar funció is_coordinator (opcional)
DROP FUNCTION IF EXISTS public.is_coordinator();

-- ============================================
-- FIM
-- ============================================