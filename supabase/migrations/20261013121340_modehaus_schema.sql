create schema if not exists private;

create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create type public.user_role as enum ('owner', 'store_manager', 'accountant', 'shop', 'customer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.item_kind as enum ('material', 'finished');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.item_unit as enum ('m', 'pcs');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('paid', 'part_paid', 'due');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.batch_stage as enum ('cutting', 'stitching', 'finished');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.dispatch_status as enum ('pending', 'shipped', 'delivered');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.invoice_status as enum ('open', 'paid', 'overdue');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_direction as enum ('in', 'out');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_channel as enum ('retail', 'wholesale');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum ('confirmed', 'preparing', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.stock_reason as enum (
    'purchase', 'production_consume', 'production_output', 'dispatch', 'sale', 'adjustment'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text not null,
  credit_limit bigint not null default 0 check (credit_limit >= 0),
  price_tier text not null default 'retail',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'customer',
  shop_id uuid references public.shops (id),
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  contact text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id),
  name text not null,
  description text not null default '',
  kind public.item_kind not null,
  unit public.item_unit not null,
  retail_price bigint not null default 0 check (retail_price >= 0),
  wholesale_price bigint not null default 0 check (wholesale_price >= 0),
  image_url text,
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.item_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  color text,
  size text,
  sku text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  supplier_id uuid not null references public.suppliers (id),
  purchased_on date not null,
  payment_status public.payment_status not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  item_variant_id uuid not null references public.item_variants (id),
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_cost bigint not null check (unit_cost >= 0)
);

create table if not exists public.production_batches (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  output_variant_id uuid not null references public.item_variants (id),
  material_variant_id uuid not null references public.item_variants (id),
  material_qty numeric(12, 2) not null check (material_qty > 0),
  expected_units numeric(12, 2) not null check (expected_units > 0),
  wastage_percent numeric(5, 2) not null default 0 check (wastage_percent >= 0),
  tailoring_cost bigint not null default 0 check (tailoring_cost >= 0),
  stage public.batch_stage not null,
  due_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.dispatches (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  shop_id uuid not null references public.shops (id),
  status public.dispatch_status not null,
  delivery_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.dispatch_lines (
  id uuid primary key default gen_random_uuid(),
  dispatch_id uuid not null references public.dispatches (id) on delete cascade,
  item_variant_id uuid not null references public.item_variants (id),
  quantity numeric(12, 2) not null check (quantity > 0)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  user_id uuid references public.profiles (id),
  shop_id uuid references public.shops (id),
  channel public.order_channel not null,
  status public.order_status not null default 'confirmed',
  payment_method text not null check (payment_method in ('cod', 'online')),
  total bigint not null check (total >= 0),
  created_at timestamptz not null default now(),
  constraint orders_party_check check (
    (channel = 'retail' and user_id is not null)
    or (channel = 'wholesale' and shop_id is not null)
  )
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  item_variant_id uuid not null references public.item_variants (id),
  quantity integer not null check (quantity > 0),
  unit_price bigint not null check (unit_price >= 0)
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  note text not null default '',
  occurred_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  shop_id uuid references public.shops (id),
  customer_id uuid references public.profiles (id),
  dispatch_id uuid references public.dispatches (id),
  order_id uuid references public.orders (id),
  amount bigint not null check (amount >= 0),
  due_on date,
  status public.invoice_status not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices (id),
  shop_id uuid references public.shops (id),
  direction public.payment_direction not null,
  amount bigint not null check (amount > 0),
  memo text not null,
  occurred_on date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  item_variant_id uuid not null references public.item_variants (id),
  quantity integer not null check (quantity > 0),
  unique (cart_id, item_variant_id)
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_variant_id uuid not null references public.item_variants (id),
  qty numeric(12, 2) not null check (qty <> 0),
  reason public.stock_reason not null,
  source_table text,
  source_id uuid,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists profiles_shop_id_idx on public.profiles (shop_id);
create index if not exists items_category_id_idx on public.items (category_id);
create index if not exists item_variants_item_id_idx on public.item_variants (item_id);
create index if not exists purchases_supplier_id_idx on public.purchases (supplier_id);
create index if not exists purchase_lines_purchase_id_idx on public.purchase_lines (purchase_id);
create index if not exists purchase_lines_variant_id_idx on public.purchase_lines (item_variant_id);
create index if not exists production_batches_output_idx on public.production_batches (output_variant_id);
create index if not exists production_batches_material_idx on public.production_batches (material_variant_id);
create index if not exists dispatches_shop_id_idx on public.dispatches (shop_id);
create index if not exists dispatch_lines_dispatch_id_idx on public.dispatch_lines (dispatch_id);
create index if not exists dispatch_lines_variant_id_idx on public.dispatch_lines (item_variant_id);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_shop_id_idx on public.orders (shop_id);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_variant_id_idx on public.order_items (item_variant_id);
create index if not exists order_events_order_id_idx on public.order_events (order_id);
create index if not exists invoices_shop_id_idx on public.invoices (shop_id);
create index if not exists invoices_customer_id_idx on public.invoices (customer_id);
create index if not exists invoices_dispatch_id_idx on public.invoices (dispatch_id);
create index if not exists invoices_order_id_idx on public.invoices (order_id);
create index if not exists payments_invoice_id_idx on public.payments (invoice_id);
create index if not exists payments_shop_id_idx on public.payments (shop_id);
create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);
create index if not exists cart_items_variant_id_idx on public.cart_items (item_variant_id);
create index if not exists wishlist_items_user_id_idx on public.wishlist_items (user_id);
create index if not exists wishlist_items_item_id_idx on public.wishlist_items (item_id);
create index if not exists stock_movements_variant_created_idx
  on public.stock_movements (item_variant_id, created_at);

create or replace function private.has_role(allowed public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = any (allowed)
  );
$$;

create or replace function private.current_shop_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select shop_id
  from public.profiles
  where id = (select auth.uid());
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'Customer'),
    'customer'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function private.sync_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role or new.shop_id is distinct from old.shop_id then
      if (select auth.uid()) is not null
         and not private.has_role(array['owner']::public.user_role[]) then
        raise exception 'Only the owner can change roles or shop assignment';
      end if;
    end if;
  end if;

  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role::text)
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

drop trigger if exists on_profile_role_change on public.profiles;
create trigger on_profile_role_change
  after insert or update of role, shop_id on public.profiles
  for each row execute function private.sync_profile_role();

insert into public.profiles (id, full_name, role)
select
  users.id,
  coalesce(nullif(users.raw_user_meta_data ->> 'full_name', ''), split_part(users.email, '@', 1), 'Customer'),
  'customer'
from auth.users as users
left join public.profiles as existing on existing.id = users.id
where existing.id is null;

create or replace view public.inventory_balances
with (security_invoker = true) as
select
  variants.id as item_variant_id,
  variants.item_id,
  items.name as item_name,
  variants.color,
  variants.size,
  items.kind,
  items.unit,
  coalesce(sum(movements.qty) filter (
    where movements.reason in ('purchase', 'production_output')
  ), 0) as bought,
  coalesce(sum(-movements.qty) filter (
    where movements.reason in ('dispatch', 'sale', 'production_consume')
  ), 0) as distributed,
  coalesce(sum(movements.qty), 0) as remaining
from public.item_variants as variants
join public.items as items on items.id = variants.item_id
left join public.stock_movements as movements on movements.item_variant_id = variants.id
where (select private.has_role(array['owner', 'store_manager', 'accountant']::public.user_role[]))
group by variants.id, items.id;

create or replace view public.retail_catalog
with (security_invoker = true) as
select
  items.id,
  items.category_id,
  categories.name as category_name,
  items.name,
  items.description,
  items.retail_price,
  items.image_url,
  items.low_stock_threshold,
  variants.id as variant_id,
  variants.color,
  variants.size,
  variants.sku
from public.items as items
join public.item_variants as variants on variants.item_id = items.id
left join public.categories as categories on categories.id = items.category_id
where items.kind = 'finished'
  and items.is_active;

revoke all on function private.has_role(public.user_role[]) from public;
revoke all on function private.current_shop_id() from public;
revoke all on function private.handle_new_user() from public;
revoke all on function private.sync_profile_role() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.has_role(public.user_role[]) to anon, authenticated;
grant execute on function private.current_shop_id() to anon, authenticated;
alter table public.shops enable row level security;
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.item_variants enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_lines enable row level security;
alter table public.production_batches enable row level security;
alter table public.dispatches enable row level security;
alter table public.dispatch_lines enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.stock_movements enable row level security;

revoke all on all tables in schema public from public, anon;
revoke all on public.inventory_balances from public, anon, authenticated;
revoke all on public.retail_catalog from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant all on all tables in schema public to service_role;

grant select (
  id, category_id, name, description, kind, unit, retail_price,
  image_url, low_stock_threshold, is_active, created_at
) on public.items to anon;
grant select on public.item_variants to anon;
grant select on public.categories to anon;
grant select on public.retail_catalog to anon, authenticated;
grant select on public.inventory_balances to authenticated;

revoke insert, update, delete, truncate on public.inventory_balances, public.retail_catalog from authenticated, anon, service_role;
grant select on public.inventory_balances to authenticated, service_role;
grant select on public.retail_catalog to anon, authenticated, service_role;

create policy profiles_select on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or (select private.has_role(array['owner', 'store_manager', 'accountant']::public.user_role[]))
);

create policy profiles_update on public.profiles
for update to authenticated
using (
  id = (select auth.uid())
  or (select private.has_role(array['owner']::public.user_role[]))
)
with check (
  id = (select auth.uid())
  or (select private.has_role(array['owner']::public.user_role[]))
);

create policy shops_select on public.shops
for select to authenticated
using (
  (select private.has_role(array['owner', 'store_manager', 'accountant']::public.user_role[]))
  or id = (select private.current_shop_id())
);

create policy shops_insert on public.shops for insert to authenticated
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy shops_update on public.shops for update to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])))
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy shops_delete on public.shops for delete to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));

create policy suppliers_select on public.suppliers
for select to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy suppliers_insert on public.suppliers for insert to authenticated
with check ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy suppliers_update on public.suppliers for update to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])))
with check ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy suppliers_delete on public.suppliers for delete to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])));

create policy categories_select on public.categories
for select to anon, authenticated
using (
  (select private.has_role(array['owner', 'store_manager', 'accountant']::public.user_role[]))
  or exists (
    select 1 from public.items
    where items.category_id = categories.id and items.kind = 'finished' and items.is_active
  )
);
create policy categories_insert on public.categories for insert to authenticated
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy categories_update on public.categories for update to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])))
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy categories_delete on public.categories for delete to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));

create policy items_select on public.items
for select to anon, authenticated
using (
  (kind = 'finished' and is_active)
  or (select private.has_role(array['owner', 'store_manager', 'accountant']::public.user_role[]))
);
create policy items_insert on public.items for insert to authenticated
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy items_update on public.items for update to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])))
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy items_delete on public.items for delete to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));

create policy item_variants_select on public.item_variants
for select to anon, authenticated
using (exists (select 1 from public.items where items.id = item_variants.item_id));
create policy item_variants_insert on public.item_variants for insert to authenticated
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy item_variants_update on public.item_variants for update to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])))
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy item_variants_delete on public.item_variants for delete to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));

create policy purchases_select on public.purchases
for select to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy purchases_insert on public.purchases for insert to authenticated
with check ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy purchases_update on public.purchases for update to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])))
with check ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy purchases_delete on public.purchases for delete to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])));

create policy purchase_lines_select on public.purchase_lines
for select to authenticated
using (exists (select 1 from public.purchases where purchases.id = purchase_lines.purchase_id));
create policy purchase_lines_insert on public.purchase_lines for insert to authenticated
with check ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy purchase_lines_update on public.purchase_lines for update to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])))
with check ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy purchase_lines_delete on public.purchase_lines for delete to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])));

create policy production_batches_select on public.production_batches
for select to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy production_batches_insert on public.production_batches for insert to authenticated
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy production_batches_update on public.production_batches for update to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])))
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy production_batches_delete on public.production_batches for delete to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));

create policy dispatches_select on public.dispatches
for select to authenticated
using (
  (select private.has_role(array['owner', 'store_manager', 'accountant']::public.user_role[]))
  or shop_id = (select private.current_shop_id())
);
create policy dispatches_insert on public.dispatches for insert to authenticated
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy dispatches_update on public.dispatches for update to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])))
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy dispatches_delete on public.dispatches for delete to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));

create policy dispatch_lines_select on public.dispatch_lines
for select to authenticated
using (exists (select 1 from public.dispatches where dispatches.id = dispatch_lines.dispatch_id));
create policy dispatch_lines_insert on public.dispatch_lines for insert to authenticated
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy dispatch_lines_update on public.dispatch_lines for update to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])))
with check ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));
create policy dispatch_lines_delete on public.dispatch_lines for delete to authenticated
using ((select private.has_role(array['owner', 'store_manager']::public.user_role[])));

create policy orders_select on public.orders
for select to authenticated
using (
  (select private.has_role(array['owner', 'store_manager', 'accountant']::public.user_role[]))
  or user_id = (select auth.uid())
  or shop_id = (select private.current_shop_id())
);
create policy orders_insert on public.orders
for insert to authenticated
with check (
  (select private.has_role(array['owner', 'store_manager']::public.user_role[]))
  or (channel = 'retail' and user_id = (select auth.uid()))
  or (
    channel = 'wholesale'
    and shop_id = (select private.current_shop_id())
    and (select private.has_role(array['shop']::public.user_role[]))
  )
);
create policy orders_update on public.orders
for update to authenticated
using (
  (select private.has_role(array['owner', 'store_manager']::public.user_role[]))
  or user_id = (select auth.uid())
  or (shop_id = (select private.current_shop_id()) and (select private.has_role(array['shop']::public.user_role[])))
)
with check (
  (select private.has_role(array['owner', 'store_manager']::public.user_role[]))
  or user_id = (select auth.uid())
  or (shop_id = (select private.current_shop_id()) and (select private.has_role(array['shop']::public.user_role[])))
);

create policy order_items_select on public.order_items
for select to authenticated
using (exists (select 1 from public.orders where orders.id = order_items.order_id));
create policy order_items_insert on public.order_items for insert to authenticated
with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (
        (select private.has_role(array['owner', 'store_manager']::public.user_role[]))
        or orders.user_id = (select auth.uid())
        or (orders.shop_id = (select private.current_shop_id()) and (select private.has_role(array['shop']::public.user_role[])))
      )
  )
);
create policy order_items_update on public.order_items for update to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (
        (select private.has_role(array['owner', 'store_manager']::public.user_role[]))
        or orders.user_id = (select auth.uid())
        or (orders.shop_id = (select private.current_shop_id()) and (select private.has_role(array['shop']::public.user_role[])))
      )
  )
)
with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (
        (select private.has_role(array['owner', 'store_manager']::public.user_role[]))
        or orders.user_id = (select auth.uid())
        or (orders.shop_id = (select private.current_shop_id()) and (select private.has_role(array['shop']::public.user_role[])))
      )
  )
);
create policy order_items_delete on public.order_items for delete to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (
        (select private.has_role(array['owner', 'store_manager']::public.user_role[]))
        or orders.user_id = (select auth.uid())
        or (orders.shop_id = (select private.current_shop_id()) and (select private.has_role(array['shop']::public.user_role[])))
      )
  )
);

create policy order_events_select on public.order_events
for select to authenticated
using (exists (select 1 from public.orders where orders.id = order_events.order_id));
create policy order_events_insert on public.order_events for insert to authenticated
with check (
  exists (
    select 1 from public.orders
    where orders.id = order_events.order_id
      and (select private.has_role(array['owner', 'store_manager']::public.user_role[]))
  )
);

create policy invoices_select on public.invoices
for select to authenticated
using (
  (select private.has_role(array['owner', 'store_manager', 'accountant']::public.user_role[]))
  or shop_id = (select private.current_shop_id())
  or customer_id = (select auth.uid())
);
create policy invoices_insert on public.invoices for insert to authenticated
with check ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy invoices_update on public.invoices for update to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])))
with check ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy invoices_delete on public.invoices for delete to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])));

create policy payments_select on public.payments
for select to authenticated
using (
  (select private.has_role(array['owner', 'store_manager', 'accountant']::public.user_role[]))
  or shop_id = (select private.current_shop_id())
);
create policy payments_insert on public.payments for insert to authenticated
with check ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy payments_update on public.payments for update to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])))
with check ((select private.has_role(array['owner', 'accountant']::public.user_role[])));
create policy payments_delete on public.payments for delete to authenticated
using ((select private.has_role(array['owner', 'accountant']::public.user_role[])));

create policy carts_select on public.carts for select to authenticated
using (user_id = (select auth.uid()));
create policy carts_insert on public.carts for insert to authenticated
with check (user_id = (select auth.uid()));
create policy carts_update on public.carts for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy carts_delete on public.carts for delete to authenticated
using (user_id = (select auth.uid()));

create policy cart_items_select on public.cart_items for select to authenticated
using (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid())));
create policy cart_items_insert on public.cart_items for insert to authenticated
with check (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid())));
create policy cart_items_update on public.cart_items for update to authenticated
using (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid())))
with check (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid())));
create policy cart_items_delete on public.cart_items for delete to authenticated
using (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid())));

create policy wishlist_select on public.wishlist_items for select to authenticated
using (user_id = (select auth.uid()));
create policy wishlist_insert on public.wishlist_items for insert to authenticated
with check (user_id = (select auth.uid()));
create policy wishlist_update on public.wishlist_items for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy wishlist_delete on public.wishlist_items for delete to authenticated
using (user_id = (select auth.uid()));

create policy stock_movements_select on public.stock_movements
for select to authenticated
using ((select private.has_role(array['owner', 'store_manager', 'accountant']::public.user_role[])));
create policy stock_movements_insert on public.stock_movements
for insert to authenticated
with check ((select private.has_role(array['owner', 'store_manager', 'accountant']::public.user_role[])));
-- Development password for every seeded login: Modehaus123

create or replace function private.seed_login(p_email text, p_name text, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_id uuid;
begin
  select id into user_id from auth.users where email = p_email;

  if user_id is null then
    user_id := gen_random_uuid();

    insert into auth.users (
      id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      user_id,
      'authenticated',
      'authenticated',
      p_email,
      extensions.crypt('Modehaus123', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_name),
      now(),
      now()
    );

    insert into auth.identities (
      user_id, provider, provider_id, identity_data, created_at, updated_at
    ) values (
      user_id,
      'email',
      user_id::text,
      jsonb_build_object('sub', user_id::text, 'email', p_email, 'email_verified', true),
      now(),
      now()
    );
  end if;

  update public.profiles
  set full_name = p_name,
      role = p_role
  where id = user_id;
end;
$$;

select private.seed_login('hamza.modehaus@gmail.com', 'Hamza', 'owner');
select private.seed_login('theo.modehaus@gmail.com', 'Theo', 'store_manager');
select private.seed_login('nadia.modehaus@gmail.com', 'Nadia', 'accountant');
select private.seed_login('north.modehaus@gmail.com', 'North & Co.', 'shop');
select private.seed_login('maya.modehaus@gmail.com', 'Maya', 'customer');

insert into public.shops (id, name, city, credit_limit, price_tier) values
  ('a1000000-0000-4000-8000-000000000001', 'North & Co.', 'Lahore', 1500000, 'wholesale'),
  ('a1000000-0000-4000-8000-000000000002', 'Luma Boutique', 'Karachi', 900000, 'wholesale'),
  ('a1000000-0000-4000-8000-000000000003', 'Studio Nine', 'Islamabad', 700000, 'wholesale'),
  ('a1000000-0000-4000-8000-000000000004', 'The Edit Shop', 'Lahore', 400000, 'wholesale')
on conflict (id) do nothing;

update public.profiles
set shop_id = 'a1000000-0000-4000-8000-000000000001'
where id = (select id from auth.users where email = 'north.modehaus@gmail.com');

insert into public.suppliers (id, name, contact) values
  ('a2000000-0000-4000-8000-000000000001', 'Sora Garments', 'Karachi'),
  ('a2000000-0000-4000-8000-000000000002', 'Arman Textiles', 'Faisalabad'),
  ('a2000000-0000-4000-8000-000000000003', 'Rui Fabrics', 'Lahore')
on conflict (id) do nothing;

insert into public.categories (id, name) values
  ('a3000000-0000-4000-8000-000000000001', 'Cloth'),
  ('a3000000-0000-4000-8000-000000000002', 'Dresses'),
  ('a3000000-0000-4000-8000-000000000003', 'Shirts'),
  ('a3000000-0000-4000-8000-000000000004', 'Trousers'),
  ('a3000000-0000-4000-8000-000000000005', 'Co-ords')
on conflict (id) do nothing;

insert into public.items (
  id, category_id, name, description, kind, unit, retail_price, wholesale_price, image_url, low_stock_threshold
) values
  ('a4000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'Natural linen', 'Undyed linen cloth for cutting.', 'material', 'm', 0, 450, null, 100),
  ('a4000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000001', 'Cotton cloth', 'Cotton cloth for shirting.', 'material', 'm', 0, 280, null, 100),
  ('a4000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000002', 'Linen Wrap Dress', 'Washed linen wrap dress.', 'finished', 'pcs', 14800, 9800, 'https://images.unsplash.com/photo-1700748909387-7c3691ef29bc?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=700', 40),
  ('a4000000-0000-4000-8000-000000000004', 'a3000000-0000-4000-8000-000000000003', 'Cotton Poplin Shirt', 'Crisp cotton poplin shirt.', 'finished', 'pcs', 8900, 6200, 'https://images.unsplash.com/photo-1755372397633-b8b4f2124b71?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=700', 40),
  ('a4000000-0000-4000-8000-000000000005', 'a3000000-0000-4000-8000-000000000002', 'Satin Midi Dress', 'Bias-cut satin midi dress.', 'finished', 'pcs', 16500, 11200, 'https://images.unsplash.com/photo-1745962978498-13fac949e357?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=700', 10),
  ('a4000000-0000-4000-8000-000000000006', 'a3000000-0000-4000-8000-000000000004', 'Tailored Wide Trouser', 'High-rise wide trouser.', 'finished', 'pcs', 11200, 7600, 'https://images.unsplash.com/photo-1650388033943-72790a65095c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=700', 80),
  ('a4000000-0000-4000-8000-000000000007', 'a3000000-0000-4000-8000-000000000005', 'Studio Co-ord', 'Matching shirt and trouser set.', 'finished', 'pcs', 18900, 12800, 'https://images.unsplash.com/photo-1700748909387-7c3691ef29bc?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=700', 30)
on conflict (id) do nothing;

insert into public.item_variants (id, item_id, color, size, sku) values
  ('b1000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'Natural', null, 'MH-LINEN'),
  ('b1000000-0000-4000-8000-000000000002', 'a4000000-0000-4000-8000-000000000002', 'White', null, 'MH-COTTON'),
  ('b1000000-0000-4000-8000-000000000003', 'a4000000-0000-4000-8000-000000000003', 'Sand', 'S–XL', 'MH-WRAP'),
  ('b1000000-0000-4000-8000-000000000004', 'a4000000-0000-4000-8000-000000000004', 'White', 'S–XL', 'MH-SHIRT'),
  ('b1000000-0000-4000-8000-000000000005', 'a4000000-0000-4000-8000-000000000005', 'Black', 'S–XL', 'MH-SATIN'),
  ('b1000000-0000-4000-8000-000000000006', 'a4000000-0000-4000-8000-000000000006', 'Stone', 'S–XL', 'MH-TROUSER'),
  ('b1000000-0000-4000-8000-000000000007', 'a4000000-0000-4000-8000-000000000007', 'Olive', 'S–XL', 'MH-COORD')
on conflict (id) do nothing;

insert into public.purchases (id, number, supplier_id, purchased_on, payment_status, notes) values
  ('c1000000-0000-4000-8000-000000000001', 'PUR-1064', 'a2000000-0000-4000-8000-000000000003', current_date - 40, 'paid', 'Opening linen cloth.'),
  ('c1000000-0000-4000-8000-000000000002', 'PUR-1082', 'a2000000-0000-4000-8000-000000000002', current_date - 6, 'due', 'Linen top-up.'),
  ('c1000000-0000-4000-8000-000000000003', 'PUR-1080', 'a2000000-0000-4000-8000-000000000001', current_date - 18, 'part_paid', 'Cotton cloth.')
on conflict (id) do nothing;

insert into public.purchase_lines (id, purchase_id, item_variant_id, quantity, unit_cost) values
  ('c1100000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 560, 450),
  ('c1100000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 240, 450),
  ('c1100000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000002', 360, 280)
on conflict (id) do nothing;

insert into public.production_batches (
  id, number, output_variant_id, material_variant_id, material_qty, expected_units, wastage_percent, tailoring_cost, stage, due_on
) values
  ('c2000000-0000-4000-8000-000000000001', 'PB-018', 'b1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 480, 680, 12, 420000, 'finished', current_date - 10),
  ('c2000000-0000-4000-8000-000000000002', 'PB-017', 'b1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 180, 200, 8, 180000, 'cutting', current_date + 5)
on conflict (id) do nothing;

insert into public.dispatches (id, number, shop_id, status, delivery_on) values
  ('e1000000-0000-4000-8000-000000000001', 'DSP-2041', 'a1000000-0000-4000-8000-000000000001', 'delivered', current_date - 12),
  ('e1000000-0000-4000-8000-000000000002', 'DSP-2044', 'a1000000-0000-4000-8000-000000000002', 'delivered', current_date - 8),
  ('e1000000-0000-4000-8000-000000000003', 'DSP-2048', 'a1000000-0000-4000-8000-000000000003', 'shipped', current_date - 2),
  ('e1000000-0000-4000-8000-000000000004', 'DSP-2050', 'a1000000-0000-4000-8000-000000000004', 'pending', current_date + 3)
on conflict (id) do nothing;

insert into public.dispatch_lines (id, dispatch_id, item_variant_id, quantity) values
  ('e1100000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000003', 120),
  ('e1100000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000004', 140),
  ('e1100000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000005', 80),
  ('e1100000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000006', 90),
  ('e1100000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000007', 40),
  ('e1100000-0000-4000-8000-000000000006', 'e1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000003', 84),
  ('e1100000-0000-4000-8000-000000000007', 'e1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000004', 97),
  ('e1100000-0000-4000-8000-000000000008', 'e1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000005', 110),
  ('e1100000-0000-4000-8000-000000000009', 'e1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000006', 150),
  ('e1100000-0000-4000-8000-000000000010', 'e1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000007', 50),
  ('e1100000-0000-4000-8000-000000000011', 'e1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', 64),
  ('e1100000-0000-4000-8000-000000000012', 'e1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000004', 60),
  ('e1100000-0000-4000-8000-000000000013', 'e1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000005', 70),
  ('e1100000-0000-4000-8000-000000000014', 'e1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000006', 100),
  ('e1100000-0000-4000-8000-000000000015', 'e1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000007', 20),
  ('e1100000-0000-4000-8000-000000000016', 'e1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000004', 40),
  ('e1100000-0000-4000-8000-000000000017', 'e1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000005', 40),
  ('e1100000-0000-4000-8000-000000000018', 'e1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000006', 36),
  ('e1100000-0000-4000-8000-000000000019', 'e1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000007', 13)
on conflict (id) do nothing;

insert into public.invoices (id, number, shop_id, dispatch_id, amount, due_on, status) values
  ('f1000000-0000-4000-8000-000000000001', 'INV-1042', 'a1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 824000, current_date - 5, 'overdue'),
  ('f1000000-0000-4000-8000-000000000002', 'INV-1038', 'a1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000003', 468000, current_date, 'open'),
  ('f1000000-0000-4000-8000-000000000003', 'INV-1047', 'a1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000004', 292000, current_date + 2, 'open'),
  ('f1000000-0000-4000-8000-000000000004', 'INV-1031', 'a1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002', 340000, current_date - 8, 'paid')
on conflict (id) do nothing;

insert into public.payments (id, invoice_id, shop_id, direction, amount, memo, occurred_on) values
  ('f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002', 'in', 340000, 'Luma Boutique receipt', current_date - 7),
  ('f2000000-0000-4000-8000-000000000002', null, null, 'out', 124000, 'Tailoring', current_date - 9),
  ('f2000000-0000-4000-8000-000000000003', null, null, 'out', 420000, 'Sora Garments cloth', current_date - 18)
on conflict (id) do nothing;

insert into public.orders (id, number, user_id, channel, status, payment_method, total)
select
  'f3000000-0000-4000-8000-000000000001',
  'ORD-1001',
  users.id,
  'retail',
  'confirmed',
  'cod',
  14800
from auth.users as users
where users.email = 'maya.modehaus@gmail.com'
on conflict (id) do nothing;

insert into public.order_items (id, order_id, item_variant_id, quantity, unit_price) values
  ('f3100000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000003', 1, 14800)
on conflict (id) do nothing;

insert into public.order_events (id, order_id, status, note) values
  ('f3200000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'confirmed', 'Retail order placed.')
on conflict (id) do nothing;

insert into public.carts (id, user_id)
select 'f3300000-0000-4000-8000-000000000001', users.id
from auth.users as users
where users.email = 'maya.modehaus@gmail.com'
on conflict (id) do nothing;

insert into public.cart_items (id, cart_id, item_variant_id, quantity) values
  ('f3400000-0000-4000-8000-000000000001', 'f3300000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000004', 1)
on conflict (id) do nothing;

insert into public.wishlist_items (id, user_id, item_id)
select 'f3500000-0000-4000-8000-000000000001', users.id, 'a4000000-0000-4000-8000-000000000005'
from auth.users as users
where users.email = 'maya.modehaus@gmail.com'
on conflict (id) do nothing;

-- Linen: +560 +240 -480 = 320. Cotton: +360 -180 = 180.
-- Wrap: +680 -268 dispatched -164 adjustment = 248.
-- Shirt 520-337=183. Satin 300-300=0. Trouser 440-376=64. Co-ord 220-123=97.
insert into public.stock_movements (id, item_variant_id, qty, reason, source_table, source_id, occurred_on) values
  ('a5000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 560, 'purchase', 'purchases', 'c1000000-0000-4000-8000-000000000001', current_date - 40),
  ('a5000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 240, 'purchase', 'purchases', 'c1000000-0000-4000-8000-000000000002', current_date - 6),
  ('a5000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', -480, 'production_consume', 'production_batches', 'c2000000-0000-4000-8000-000000000001', current_date - 10),
  ('a5000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 360, 'purchase', 'purchases', 'c1000000-0000-4000-8000-000000000003', current_date - 18),
  ('a5000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', -180, 'production_consume', 'production_batches', 'c2000000-0000-4000-8000-000000000002', current_date - 1),
  ('a5000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000003', 680, 'production_output', 'production_batches', 'c2000000-0000-4000-8000-000000000001', current_date - 10),
  ('a5000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000003', -164, 'adjustment', 'adjustment', null, current_date - 4),
  ('a5000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000004', 520, 'production_output', null, null, current_date - 20),
  ('a5000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000005', 300, 'production_output', null, null, current_date - 20),
  ('a5000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000006', 440, 'production_output', null, null, current_date - 20),
  ('a5000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000007', 220, 'production_output', null, null, current_date - 20)
on conflict (id) do nothing;

insert into public.stock_movements (id, item_variant_id, qty, reason, source_table, source_id, occurred_on)
select
  ('a6000000-0000-4000-8000-' || lpad(row_number() over (order by lines.id)::text, 12, '0'))::uuid,
  lines.item_variant_id,
  -lines.quantity,
  'dispatch',
  'dispatches',
  lines.dispatch_id,
  dispatches.delivery_on
from public.dispatch_lines as lines
join public.dispatches as dispatches on dispatches.id = lines.dispatch_id
on conflict (id) do nothing;

drop function private.seed_login(text, text, public.user_role);
