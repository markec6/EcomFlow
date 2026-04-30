create or replace function public.spend_credit_for_scan(
  p_user_id uuid,
  p_product_id uuid,
  p_action_type text default 'deep_scan'
)
returns table(ok boolean, reason text, remaining_credits int4)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining int4;
begin
  select ai_credits_remaining
  into v_remaining
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return query select false, 'profile_missing', 0::int4;
    return;
  end if;

  if v_remaining < 1 then
    return query select false, 'insufficient_credits', v_remaining;
    return;
  end if;

  begin
    insert into public.credit_spend_events (user_id, product_id, action_type)
    values (p_user_id, p_product_id, coalesce(nullif(trim(p_action_type), ''), 'deep_scan'));
  exception
    when unique_violation then
      return query select false, 'duplicate', v_remaining;
      return;
  end;

  update public.profiles
  set ai_credits_remaining = ai_credits_remaining - 1
  where id = p_user_id
  returning ai_credits_remaining into v_remaining;

  return query select true, 'ok', v_remaining;
end;
$$;
