-- Add list ordering for SmartLife.
-- Run in Supabase SQL Editor (Spisak project).

alter table public.lists
  add column if not exists position integer;

-- Preserve previous UI order (newest updated first) as ascending positions.
with ranked as (
  select
    id,
    (row_number() over (
      partition by user_id
      order by updated_at desc nulls last, created_at desc nulls last, id
    ) - 1)::integer as pos
  from public.lists
  where deleted_at is null
)
update public.lists as l
set position = ranked.pos
from ranked
where l.id = ranked.id;

-- Soft-deleted and any remaining nulls
update public.lists
set position = 0
where position is null;

alter table public.lists
  alter column position set default 0;

alter table public.lists
  alter column position set not null;

create index if not exists lists_user_position_idx
  on public.lists (user_id, position);
