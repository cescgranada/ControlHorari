-- Simplified trigger to allow workers to close their own open entries
CREATE OR REPLACE FUNCTION public.guard_time_entry_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
declare
  is_manager boolean;
  days_since_entry integer;
begin
  -- INSERT logic (creating new entries)
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

    -- Only managers can create closed entries directly
    if new.clock_out is not null and not is_manager then
      raise exception 'Workers cannot create closed entries directly';
    end if;

    -- Managers need edit_reason for manual entries
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
    end if;

    return new;
  end if;

  -- UPDATE logic (modifying existing entries)
  is_manager := public.can_manage_user(old.user_id);

  if new.user_id is distinct from old.user_id then
    raise exception 'user_id cannot be changed';
  end if;

  if new.clock_out is not null and new.clock_out < new.clock_in then
    raise exception 'clock_out must be greater than or equal to clock_in';
  end if;

  -- Managers can update anything with edit_reason
  if is_manager and coalesce(btrim(new.edit_reason), '') <> '' then
    new.is_manual := true;
    new.edited_by := auth.uid();
    return new;
  end if;

  -- Non-managers can only update their own entries
  if old.user_id <> auth.uid() then
    raise exception 'You cannot update another user entry';
  end if;

  -- Calculate days since entry
  days_since_entry := date_part('day', now() - old.clock_in);
  
  -- Workers cannot modify entries older than 7 days
  if days_since_entry >= 7 then
    raise exception 'Entries older than 7 days cannot be modified by workers';
  end if;

  -- Workers can close their own open entries (set clock_out)
  if old.clock_out is null and new.clock_out is not null then
    -- Closing an open entry
    if new.clock_in is distinct from old.clock_in then
      raise exception 'Workers cannot change clock_in when closing an entry';
    end if;
    new.is_manual := true;
    new.edited_by := auth.uid();
    return new;
  end if;

  -- Workers can update notes on open entries
  if old.clock_out is null and new.clock_out is null then
    if new.clock_in is distinct from old.clock_in
       or new.clock_in_lat is distinct from old.clock_in_lat
       or new.clock_in_lng is distinct from old.clock_in_lng then
      raise exception 'Workers can only update notes on open entries';
    end if;
    return new;
  end if;

  -- Workers editing closed entries within 7 days require edit_reason
  if old.clock_out is not null then
    if coalesce(btrim(new.edit_reason), '') = '' then
      raise exception 'edit_reason is required when correcting a closed entry';
    end if;
    new.is_manual := true;
    new.edited_by := auth.uid();
    return new;
  end if;

  return new;
end;
$$;
