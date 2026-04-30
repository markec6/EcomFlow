alter table if exists profiles
  alter column ai_credits_remaining set default 300;

alter table if exists profiles
  add column if not exists avatar_url text;

update profiles
set ai_credits_remaining = case
  when lower(coalesce(email, '')) = 'marjanovica773@gmail.com' then 420
  when ai_credits_remaining is null or ai_credits_remaining <= 0 then 300
  else ai_credits_remaining
end;
