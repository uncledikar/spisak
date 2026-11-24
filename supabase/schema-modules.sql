-- SmartLife finances tables for the Spisak Supabase project.
-- Run in SQL Editor. Does NOT recreate or alter settings or lists.
-- Medicine tables were removed; these drops are idempotent and do not touch other tables.

drop table if exists public.consumptions;
drop table if exists public.medicines;

-- ── Finances ─────────────────────────────────────────────────────

create table if not exists public.expense_categories (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  icon text not null default '💳',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists expense_categories_user_id_idx on public.expense_categories (user_id);
create index if not exists expense_categories_user_updated_idx on public.expense_categories (user_id, updated_at desc);

alter table public.expense_categories enable row level security;

drop policy if exists "expense_categories_select_own" on public.expense_categories;
drop policy if exists "expense_categories_insert_own" on public.expense_categories;
drop policy if exists "expense_categories_update_own" on public.expense_categories;
drop policy if exists "expense_categories_delete_own" on public.expense_categories;

create policy "expense_categories_select_own" on public.expense_categories
  for select using (auth.uid() = user_id);
create policy "expense_categories_insert_own" on public.expense_categories
  for insert with check (auth.uid() = user_id);
create policy "expense_categories_update_own" on public.expense_categories
  for update using (auth.uid() = user_id);
create policy "expense_categories_delete_own" on public.expense_categories
  for delete using (auth.uid() = user_id);

create table if not exists public.expenses (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  category_id uuid not null references public.expense_categories (id) on delete cascade,
  amount numeric not null check (amount > 0),
  spent_on date not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_id_idx on public.expenses (user_id);
create index if not exists expenses_user_date_idx on public.expenses (user_id, spent_on desc);
create index if not exists expenses_category_idx on public.expenses (category_id);

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_own" on public.expenses;
drop policy if exists "expenses_insert_own" on public.expenses;
drop policy if exists "expenses_update_own" on public.expenses;
drop policy if exists "expenses_delete_own" on public.expenses;

create policy "expenses_select_own" on public.expenses
  for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on public.expenses
  for update using (auth.uid() = user_id);
create policy "expenses_delete_own" on public.expenses
  for delete using (auth.uid() = user_id);
