-- MyApp module tables for the Spisak Supabase project.
-- Run in SQL Editor. Does NOT recreate settings or lists.

-- ── Medicine (Tabletka) ──────────────────────────────────────────

create table if not exists public.medicines (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  unit text not null default 'pcs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists medicines_user_id_idx on public.medicines (user_id);
create index if not exists medicines_user_updated_idx on public.medicines (user_id, updated_at desc);

alter table public.medicines enable row level security;

drop policy if exists "medicines_select_own" on public.medicines;
drop policy if exists "medicines_insert_own" on public.medicines;
drop policy if exists "medicines_update_own" on public.medicines;
drop policy if exists "medicines_delete_own" on public.medicines;

create policy "medicines_select_own" on public.medicines
  for select using (auth.uid() = user_id);
create policy "medicines_insert_own" on public.medicines
  for insert with check (auth.uid() = user_id);
create policy "medicines_update_own" on public.medicines
  for update using (auth.uid() = user_id);
create policy "medicines_delete_own" on public.medicines
  for delete using (auth.uid() = user_id);

create table if not exists public.consumptions (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  medicine_id uuid not null references public.medicines (id) on delete cascade,
  quantity numeric not null check (quantity > 0),
  consumed_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists consumptions_user_id_idx on public.consumptions (user_id);
create index if not exists consumptions_user_date_idx on public.consumptions (user_id, consumed_on desc);
create index if not exists consumptions_medicine_idx on public.consumptions (medicine_id);

alter table public.consumptions enable row level security;

drop policy if exists "consumptions_select_own" on public.consumptions;
drop policy if exists "consumptions_insert_own" on public.consumptions;
drop policy if exists "consumptions_update_own" on public.consumptions;
drop policy if exists "consumptions_delete_own" on public.consumptions;

create policy "consumptions_select_own" on public.consumptions
  for select using (auth.uid() = user_id);
create policy "consumptions_insert_own" on public.consumptions
  for insert with check (auth.uid() = user_id);
create policy "consumptions_update_own" on public.consumptions
  for update using (auth.uid() = user_id);
create policy "consumptions_delete_own" on public.consumptions
  for delete using (auth.uid() = user_id);

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
