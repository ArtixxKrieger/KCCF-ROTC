create extension if not exists pgcrypto;

create type public.app_role as enum ('Admin', 'Supply Officer', 'Personnel');
create type public.inventory_status as enum ('Available', 'Issued', 'Damaged', 'Under-maintenance');
create type public.request_status as enum ('Pending', 'Approved', 'Rejected');
create type public.issuance_status as enum ('Issued', 'Returned', 'Overdue', 'Damaged', 'Missing');

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  role public.app_role not null default 'Personnel',
  department text,
  rank text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  item_type text not null check (item_type in ('Armory Equipment', 'Other Supplies')),
  quantity integer not null default 0 check (quantity >= 0),
  available_quantity integer not null default 0 check (available_quantity >= 0),
  issued_quantity integer not null default 0 check (issued_quantity >= 0),
  damaged_quantity integer not null default 0 check (damaged_quantity >= 0),
  condition text not null check (condition in ('Excellent', 'Good', 'Fair', 'Damaged')),
  status public.inventory_status not null default 'Available',
  storage_location text not null,
  min_stock_level integer not null default 0 check (min_stock_level >= 0),
  unit text not null default 'units',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid references public.inventory(id) on delete set null,
  transaction_type text not null check (transaction_type in ('Receiving', 'Issuance', 'Return', 'Adjustment')),
  quantity integer not null check (quantity >= 0),
  source_destination text,
  reference_number text,
  notes text,
  performed_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  requested_by text not null,
  inventory_id uuid references public.inventory(id) on delete set null,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  purpose text,
  status public.request_status not null default 'Pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create table if not exists public.issuances (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.inventory(id) on delete restrict,
  issued_to text not null,
  quantity integer not null check (quantity > 0),
  purpose text,
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  returned_at timestamptz,
  condition_on_return text check (condition_on_return in ('Excellent', 'Good', 'Fair', 'Damaged', 'Missing')),
  status public.issuance_status not null default 'Issued',
  reference_number text,
  issued_by text
);

create index if not exists inventory_name_idx on public.inventory using gin (to_tsvector('simple', name));
create index if not exists inventory_category_idx on public.inventory(category);
create index if not exists transactions_created_idx on public.transactions(created_at desc);
create index if not exists requests_status_idx on public.requests(status);
create index if not exists issuances_status_idx on public.issuances(status);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text
  from public.users
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_user_id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'Personnel'
  )
  on conflict (email) do update
  set auth_user_id = excluded.auth_user_id,
      full_name = coalesce(public.users.full_name, excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.inventory enable row level security;
alter table public.transactions enable row level security;
alter table public.requests enable row level security;
alter table public.issuances enable row level security;

create policy "Read inventory" on public.inventory
  for select to anon, authenticated using (true);
create policy "Supply officers manage inventory" on public.inventory
  for all to authenticated
  using (public.current_user_role() in ('Admin', 'Supply Officer'))
  with check (public.current_user_role() in ('Admin', 'Supply Officer'));

create policy "Read transactions" on public.transactions
  for select to anon, authenticated using (true);
create policy "Supply officers log transactions" on public.transactions
  for insert to authenticated
  with check (public.current_user_role() in ('Admin', 'Supply Officer'));

create policy "Authenticated users read requests" on public.requests
  for select to authenticated using (true);
create policy "Personnel create requests" on public.requests
  for insert to authenticated with check (true);
create policy "Supply officers review requests" on public.requests
  for update to authenticated
  using (public.current_user_role() in ('Admin', 'Supply Officer'))
  with check (public.current_user_role() in ('Admin', 'Supply Officer'));

create policy "Authenticated users read issuances" on public.issuances
  for select to authenticated using (true);
create policy "Supply officers manage issuances" on public.issuances
  for all to authenticated
  using (public.current_user_role() in ('Admin', 'Supply Officer'))
  with check (public.current_user_role() in ('Admin', 'Supply Officer'));

create policy "Users read own profile" on public.users
  for select to authenticated using (auth_user_id = auth.uid());
create policy "Admins read all users" on public.users
  for select to authenticated using (public.current_user_role() = 'Admin');
create policy "Admins manage users" on public.users
  for all to authenticated
  using (public.current_user_role() = 'Admin')
  with check (public.current_user_role() = 'Admin');

create or replace function public.receive_inventory(
  p_inventory_id uuid,
  p_quantity integer,
  p_source text,
  p_reference text default null,
  p_notes text default null
)
returns public.inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.inventory;
begin
  if p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  update public.inventory
  set quantity = quantity + p_quantity,
      available_quantity = available_quantity + p_quantity,
      status = case
        when damaged_quantity > 0 and available_quantity + p_quantity = 0 then 'Damaged'
        else 'Available'
      end,
      updated_at = now()
  where id = p_inventory_id
  returning * into v_result;

  if v_result.id is null then raise exception 'Inventory item not found'; end if;

  insert into public.transactions (
    inventory_id, transaction_type, quantity, source_destination,
    reference_number, notes, performed_by
  ) values (
    p_inventory_id, 'Receiving', p_quantity, p_source,
    p_reference, p_notes, coalesce(auth.jwt()->>'email', 'System')
  );
  return v_result;
end;
$$;

create or replace function public.issue_inventory(
  p_inventory_id uuid,
  p_quantity integer,
  p_issued_to text,
  p_purpose text default null,
  p_due_at timestamptz default null,
  p_reference text default null
)
returns public.issuances
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available integer;
  v_issuance public.issuances;
begin
  if p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  select available_quantity into v_available
  from public.inventory
  where id = p_inventory_id
  for update;

  if v_available is null then raise exception 'Inventory item not found'; end if;
  if p_quantity > v_available then
    raise exception 'Cannot issue % units; only % available', p_quantity, v_available;
  end if;

  update public.inventory
  set available_quantity = available_quantity - p_quantity,
      issued_quantity = issued_quantity + p_quantity,
      status = case
        when available_quantity - p_quantity = 0 then 'Issued'
        else 'Available'
      end,
      updated_at = now()
  where id = p_inventory_id;

  insert into public.issuances (
    inventory_id, issued_to, quantity, purpose, due_at, status,
    reference_number, issued_by
  ) values (
    p_inventory_id, p_issued_to, p_quantity, p_purpose, p_due_at, 'Issued',
    p_reference, coalesce(auth.jwt()->>'email', 'System')
  ) returning * into v_issuance;

  insert into public.transactions (
    inventory_id, transaction_type, quantity, source_destination,
    reference_number, notes, performed_by
  ) values (
    p_inventory_id, 'Issuance', p_quantity, p_issued_to,
    p_reference, p_purpose, coalesce(auth.jwt()->>'email', 'System')
  );
  return v_issuance;
end;
$$;

create or replace function public.return_inventory(
  p_issuance_id uuid,
  p_condition text,
  p_notes text default null
)
returns public.issuances
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issuance public.issuances;
  v_inventory public.inventory;
  v_good_return boolean;
begin
  if p_condition not in ('Excellent', 'Good', 'Fair', 'Damaged', 'Missing') then
    raise exception 'Invalid return condition';
  end if;

  select * into v_issuance
  from public.issuances
  where id = p_issuance_id
  for update;
  if v_issuance.id is null then raise exception 'Issuance not found'; end if;
  if v_issuance.status = 'Returned' then raise exception 'Issuance already returned'; end if;

  v_good_return := p_condition in ('Excellent', 'Good', 'Fair');

  update public.issuances
  set returned_at = now(),
      condition_on_return = p_condition,
      status = case
        when p_condition = 'Missing' then 'Missing'
        when p_condition = 'Damaged' then 'Damaged'
        else 'Returned'
      end
  where id = p_issuance_id
  returning * into v_issuance;

  select * into v_inventory
  from public.inventory
  where id = v_issuance.inventory_id
  for update;

  if v_good_return then
    update public.inventory
    set available_quantity = available_quantity + v_issuance.quantity,
        issued_quantity = greatest(issued_quantity - v_issuance.quantity, 0),
        status = 'Available',
        updated_at = now()
    where id = v_issuance.inventory_id;
  else
    update public.inventory
    set issued_quantity = greatest(issued_quantity - v_issuance.quantity, 0),
        damaged_quantity = damaged_quantity +
          case when p_condition = 'Damaged' then v_issuance.quantity else 0 end,
        quantity = quantity -
          case when p_condition = 'Missing' then v_issuance.quantity else 0 end,
        status = case
          when p_condition = 'Damaged' then 'Damaged'
          else status
        end,
        updated_at = now()
    where id = v_issuance.inventory_id;
  end if;

  insert into public.transactions (
    inventory_id, transaction_type, quantity, source_destination,
    reference_number, notes, performed_by
  ) values (
    v_issuance.inventory_id, 'Return', v_issuance.quantity, v_issuance.issued_to,
    v_issuance.reference_number, p_notes, coalesce(auth.jwt()->>'email', 'System')
  );
  return v_issuance;
end;
$$;

grant execute on function public.receive_inventory(uuid, integer, text, text, text) to authenticated;
grant execute on function public.issue_inventory(uuid, integer, text, text, timestamptz, text) to authenticated;
grant execute on function public.return_inventory(uuid, text, text) to authenticated;
