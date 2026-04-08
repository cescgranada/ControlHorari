-- Allow workers to update their own closed entries from the last 7 days
-- Modify the guard_time_entry_mutation function to allow updates for recent entries
CREATE OR REPLACE FUNCTION public.guard_time_entry_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
declare
  is_manager boolean;
  changed_core_fields boolean;
  days_since_entry integer;
begin
  if tg_op = 'INSERT' then
    is_manager := public.can_manage_user(new.user_id);

    if auth.uid() is null then
      raise exception 'Authentication required';
    end if;

    if new.user_id <> auth.uid() and not is_manager then
      raise exception 'You cannot create entries for another user';
    end if;

    if new.clock_out is not null and new.clock_out < new.clock_in then
      raise exception 'clock_out must be greater than or equal to clock_in';
    end if;

    if is_manager and (new.user_id <> auth.uid() or new.clock_out is not null or new.is_manual) then
      if coalesce(btrim(new.edit_reason), '') = '' then
        raise exception 'edit_reason is required for manual entries';
      end if;
      new.is_manual := true;
      new.edited_by := auth.uid();
    else
      new.is_manual := false;
      new.edited_by := null;
      new.edit_reason := null;
      if new.clock_out is not null then
        raise exception 'Workers cannot create closed entries directly';
      end if;
    end if;

    return new;
  end if;

  is_manager := public.can_manage_user(old.user_id);

  if new.user_id is distinct from old.user_id then
    raise exception 'user_id cannot be changed';
  end if;

  if new.clock_out is not null and new.clock_out < new.clock_in then
    raise exception 'clock_out must be greater than or equal to clock_in';
  end if;

  changed_core_fields :=
    new.clock_in is distinct from old.clock_in
    or new.clock_out is distinct from old.clock_out
    or new.clock_in_lat is distinct from old.clock_in_lat
    or new.clock_in_lng is distinct from old.clock_in_lng
    or new.clock_in_accuracy_meters is distinct from old.clock_in_accuracy_meters
    or new.clock_out_lat is distinct from old.clock_out_lat
    or new.clock_out_lng is distinct from old.clock_out_lng
    or new.clock_out_accuracy_meters is distinct from old.clock_out_accuracy_meters
    or new.clock_in_timezone is distinct from old.clock_in_timezone
    or new.clock_out_timezone is distinct from old.clock_out_timezone
    or new.notes is distinct from old.notes;

  if is_manager and (auth.uid() <> old.user_id or coalesce(btrim(new.edit_reason), '') <> '') then
    if changed_core_fields and coalesce(btrim(new.edit_reason), '') = '' then
      raise exception 'edit_reason is required when correcting an entry';
    end if;
    new.is_manual := true;
    new.edited_by := auth.uid();
    return new;
  end if;

  if old.user_id <> auth.uid() then
    raise exception 'You cannot update another user entry';
  end if;

  -- Calculate days since entry
  days_since_entry := date_part('day', now() - old.clock_in);
  
  -- Allow workers to update their own entries if:
  -- 1. Entry is still open (clock_out is null), OR
  -- 2. Entry is closed but within the last 7 days
  if old.clock_out is not null and days_since_entry >= 7 then
    raise exception 'Closed entries older than 7 days cannot be modified by workers';
  end if;

  -- For closed entries within 7 days, require edit_reason
  if old.clock_out is not null and days_since_entry < 7 then
    if coalesce(btrim(new.edit_reason), '') = '' then
      raise exception 'edit_reason is required when correcting a closed entry';
    end if;
    new.is_manual := true;
    new.edited_by := auth.uid();
    return new;
  end if;

  -- For open entries, existing rules apply
  if new.clock_in is distinct from old.clock_in
     or new.user_id is distinct from old.user_id
     or new.clock_in_lat is distinct from old.clock_in_lat
     or new.clock_in_lng is distinct from old.clock_in_lng
     or new.clock_in_accuracy_meters is distinct from old.clock_in_accuracy_meters
     or new.is_manual is distinct from old.is_manual
     or new.edited_by is distinct from old.edited_by
     or new.edit_reason is distinct from old.edit_reason then
    raise exception 'Workers can only close their active entry and update notes';
  end if;

  return new;
end;
$$;

-- Update RLS policy to allow updates for recent closed entries
DROP POLICY IF EXISTS time_entries_update_self_active_only ON public.time_entries;

CREATE POLICY time_entries_update_self_recent
ON public.time_entries
FOR update
TO authenticated
USING (
  auth.uid() = user_id AND (
    clock_out IS NULL 
    OR clock_in >= now() - interval '7 days'
  )
)
WITH CHECK (auth.uid() = user_id);

-- Update RLS policy for breaks to allow updates for recent entries
DROP POLICY IF EXISTS breaks_update_self_active_only ON public.breaks;

CREATE POLICY breaks_update_self_recent
ON public.breaks
FOR update
TO authenticated
USING (
  ended_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.time_entries te
    WHERE te.id = entry_id
      AND te.user_id = auth.uid()
      AND (te.clock_out IS NULL OR te.clock_in >= now() - interval '7 days')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.time_entries te
    WHERE te.id = entry_id
      AND te.user_id = auth.uid()
      AND (te.clock_out IS NULL OR te.clock_in >= now() - interval '7 days')
  )
);