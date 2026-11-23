do $$ begin
  create type app_role as enum ('Admin', 'Supply Officer', 'Personnel');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_status as enum ('Available', 'Issued', 'Damaged', 'Under-maintenance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum ('Pending', 'Approved', 'Rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type issuance_status as enum ('Issued', 'Returned', 'Overdue', 'Damaged', 'Missing');
exception when duplicate_object then null; end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text,
  role app_role not null default 'Personnel',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  item_type text not null check (item_type in ('Armory Equipment', 'Other Supplies')),
  quantity integer not null default 0 check (quantity >= 0),
  available_quantity integer not null default 0 check (available_quantity >= 0),
  issued_quantity integer not null default 0 check (issued_quantity >= 0),
  damaged_quantity integer not null default 0 check (damaged_quantity >= 0),
  condition text not null check (condition in ('Excellent', 'Good', 'Fair', 'Damaged')),
  status inventory_status not null default 'Available',
  storage_location text not null,
  min_stock_level integer not null default 0 check (min_stock_level >= 0),
  unit text not null default 'units',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid references inventory(id) on delete set null,
  transaction_type text not null check (transaction_type in ('Receiving', 'Issuance', 'Return', 'Adjustment')),
  quantity integer not null check (quantity >= 0),
  source_destination text,
  reference_number text,
  notes text,
  performed_by text,
  created_at timestamptz not null default now()
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  requested_by text not null,
  inventory_id uuid references inventory(id) on delete set null,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  purpose text,
  status request_status not null default 'Pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create table if not exists issuances (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references inventory(id) on delete restrict,
  issued_to text not null,
  quantity integer not null check (quantity > 0),
  purpose text,
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  returned_at timestamptz,
  condition_on_return text check (condition_on_return in ('Excellent', 'Good', 'Fair', 'Damaged', 'Missing')),
  status issuance_status not null default 'Issued',
  reference_number text,
  issued_by text
);

create table if not exists report_exports (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  object_key text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_category_idx on inventory(category);
create index if not exists transactions_created_idx on transactions(created_at desc);
create index if not exists requests_status_idx on requests(status);
create index if not exists issuances_status_idx on issuances(status);

create or replace function receive_inventory(
  p_inventory_id uuid,
  p_quantity integer,
  p_source text,
  p_reference text default null,
  p_notes text default null,
  p_performed_by text default 'Supply Officer'
)
returns inventory
language plpgsql
as $$
declare
  v_result inventory;
begin
  if p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;

  update inventory
  set quantity = quantity + p_quantity,
      available_quantity = available_quantity + p_quantity,
      status = 'Available',
      updated_at = now()
  where id = p_inventory_id
  returning * into v_result;

  if v_result.id is null then raise exception 'Inventory item not found'; end if;

  insert into transactions (
    inventory_id, transaction_type, quantity, source_destination,
    reference_number, notes, performed_by
  ) values (
    p_inventory_id, 'Receiving', p_quantity, p_source,
    p_reference, p_notes, p_performed_by
  );
  return v_result;
end;
$$;

create or replace function issue_inventory(
  p_inventory_id uuid,
  p_quantity integer,
  p_issued_to text,
  p_purpose text default null,
  p_due_at timestamptz default null,
  p_reference text default null,
  p_issued_by text default 'Supply Officer'
)
returns issuances
language plpgsql
as $$
declare
  v_available integer;
  v_issuance issuances;
begin
  if p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;

  select available_quantity into v_available
  from inventory
  where id = p_inventory_id
  for update;

  if v_available is null then raise exception 'Inventory item not found'; end if;
  if p_quantity > v_available then
    raise exception 'Cannot issue % units; only % available', p_quantity, v_available;
  end if;

  update inventory
  set available_quantity = available_quantity - p_quantity,
      issued_quantity = issued_quantity + p_quantity,
      status = (case
        when available_quantity - p_quantity = 0 then 'Issued'
        else 'Available'
      end)::inventory_status,
      updated_at = now()
  where id = p_inventory_id;

  insert into issuances (
    inventory_id, issued_to, quantity, purpose, due_at, status,
    reference_number, issued_by
  ) values (
    p_inventory_id, p_issued_to, p_quantity, p_purpose, p_due_at, 'Issued',
    p_reference, p_issued_by
  ) returning * into v_issuance;

  insert into transactions (
    inventory_id, transaction_type, quantity, source_destination,
    reference_number, notes, performed_by
  ) values (
    p_inventory_id, 'Issuance', p_quantity, p_issued_to,
    p_reference, p_purpose, p_issued_by
  );
  return v_issuance;
end;
$$;

create or replace function return_inventory(
  p_issuance_id uuid,
  p_condition text,
  p_notes text default null,
  p_performed_by text default 'Supply Officer'
)
returns issuances
language plpgsql
as $$
declare
  v_issuance issuances;
  v_good_return boolean;
begin
  if p_condition not in ('Excellent', 'Good', 'Fair', 'Damaged', 'Missing') then
    raise exception 'Invalid return condition';
  end if;

  select * into v_issuance
  from issuances
  where id = p_issuance_id
  for update;

  if v_issuance.id is null then raise exception 'Issuance not found'; end if;
  if v_issuance.status = 'Returned' then raise exception 'Issuance already returned'; end if;

  v_good_return := p_condition in ('Excellent', 'Good', 'Fair');

  update issuances
  set returned_at = now(),
      condition_on_return = p_condition,
      status = (case
        when p_condition = 'Missing' then 'Missing'
        when p_condition = 'Damaged' then 'Damaged'
        else 'Returned'
      end)::issuance_status
  where id = p_issuance_id
  returning * into v_issuance;

  if v_good_return then
    update inventory
    set available_quantity = available_quantity + v_issuance.quantity,
        issued_quantity = greatest(issued_quantity - v_issuance.quantity, 0),
        status = 'Available',
        updated_at = now()
    where id = v_issuance.inventory_id;
  else
    update inventory
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

  insert into transactions (
    inventory_id, transaction_type, quantity, source_destination,
    reference_number, notes, performed_by
  ) values (
    v_issuance.inventory_id, 'Return', v_issuance.quantity, v_issuance.issued_to,
    v_issuance.reference_number, p_notes, p_performed_by
  );
  return v_issuance;
end;
$$;

create table if not exists invite_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  role app_role not null default 'Personnel',
  created_by uuid references users(id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  used_by uuid references users(id) on delete set null,
  revoked_at timestamptz
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id) on delete set null,
  actor_name text not null,
  actor_email text not null,
  actor_role app_role not null default 'Personnel',
  action text not null,
  entity text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists rate_limits (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);

create index if not exists invite_tokens_token_idx on invite_tokens(token);
create index if not exists audit_logs_created_idx on audit_logs(created_at desc);
create index if not exists audit_logs_actor_idx on audit_logs(actor_id);
