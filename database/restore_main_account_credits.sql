-- One-time repair: preserve exact credits for the main account.
update public.profiles
set ai_credits_remaining = 420
where lower(coalesce(email, '')) = 'marjanovica773@gmail.com';
