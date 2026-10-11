-- One-shot: reorder list items so unchecked come first, then checked.
-- Within each group, keep relative order by current "position".
-- Reindex position to 0..n-1. Run once in Supabase SQL Editor.

update public.lists as l
set
  items = sub.reordered,
  updated_at = now()
from (
  select
    id,
    coalesce(
      (
        select jsonb_agg(elem.item || jsonb_build_object('position', elem.ord - 1) order by elem.ord)
        from (
          select
            item,
            row_number() over (
              order by
                case when coalesce((item->>'checked')::boolean, false) then 1 else 0 end,
                coalesce((item->>'position')::int, 2147483647)
            ) as ord
          from jsonb_array_elements(coalesce(l2.items, '[]'::jsonb)) as item
        ) as elem
      ),
      '[]'::jsonb
    ) as reordered
  from public.lists as l2
) as sub
where l.id = sub.id
  and l.items is distinct from sub.reordered;
