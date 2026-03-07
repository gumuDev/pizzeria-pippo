-- ============================================================
-- 001_schema.sql
-- Schema completo para Pizzería Pippo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLAS
-- ============================================================

-- Sucursales
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz default now()
);

-- Perfiles de usuario (extiende Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'cajero', 'cocinero')),
  branch_id uuid references branches(id),
  full_name text,
  created_at timestamptz default now()
);

-- Productos
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('pizza', 'bebida', 'otro')),
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- Variantes de producto (Personal, Mediana, Familiar)
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null check (name in ('Personal', 'Mediana', 'Familiar')),
  base_price numeric(10,2) not null check (base_price >= 0),
  created_at timestamptz default now()
);

-- Precios por variante por sucursal (override del precio base)
create table branch_prices (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  price numeric(10,2) not null check (price >= 0),
  created_at timestamptz default now(),
  unique (branch_id, variant_id)
);

-- Insumos
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null check (unit in ('g', 'kg', 'ml', 'l', 'unidad')),
  created_at timestamptz default now()
);

-- Stock de insumos por sucursal
create table branch_stock (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity numeric(10,3) not null default 0 check (quantity >= 0),
  min_quantity numeric(10,3) not null default 0 check (min_quantity >= 0),
  updated_at timestamptz default now(),
  unique (branch_id, ingredient_id)
);

-- Recetas internas por variante
create table recipes (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity numeric(10,3) not null check (quantity > 0),
  unique (variant_id, ingredient_id)
);

-- Movimientos de stock
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id),
  ingredient_id uuid not null references ingredients(id),
  quantity numeric(10,3) not null,
  type text not null check (type in ('compra', 'venta', 'ajuste')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Promociones
create table promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('BUY_X_GET_Y', 'PERCENTAGE', 'COMBO')),
  days_of_week integer[] not null default '{}',
  start_date date not null,
  end_date date not null,
  branch_id uuid references branches(id),
  active boolean default true,
  created_at timestamptz default now(),
  check (end_date >= start_date)
);

-- Reglas de promociones
create table promotion_rules (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references promotions(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  buy_qty integer check (buy_qty > 0),
  get_qty integer check (get_qty > 0),
  discount_percent numeric(5,2) check (discount_percent > 0 and discount_percent <= 100),
  combo_price numeric(10,2) check (combo_price >= 0)
);

-- Órdenes / Ventas
create table orders (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id),
  cashier_id uuid not null references auth.users(id),
  total numeric(10,2) not null check (total >= 0),
  created_at timestamptz default now()
);

-- Detalle de órdenes
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  qty integer not null check (qty > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  discount_applied numeric(10,2) not null default 0 check (discount_applied >= 0)
);


-- ============================================================
-- FUNCIÓN: trigger para crear perfil al registrar usuario
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'cajero'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table branches enable row level security;
alter table profiles enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table branch_prices enable row level security;
alter table ingredients enable row level security;
alter table branch_stock enable row level security;
alter table recipes enable row level security;
alter table stock_movements enable row level security;
alter table promotions enable row level security;
alter table promotion_rules enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Helper: obtiene el rol del usuario actual
create or replace function get_user_role()
returns text
language sql
security definer
as $$
  select role from profiles where id = auth.uid();
$$;

-- Helper: obtiene el branch_id del usuario actual
create or replace function get_user_branch_id()
returns uuid
language sql
security definer
as $$
  select branch_id from profiles where id = auth.uid();
$$;

-- branches: admin ve todo, cajero ve solo la suya
create policy "branches_select" on branches for select
  using (get_user_role() = 'admin' or id = get_user_branch_id());
create policy "branches_admin_insert" on branches
  for insert with check (get_user_role() = 'admin');
create policy "branches_admin_update" on branches
  for update using (get_user_role() = 'admin');
create policy "branches_admin_delete" on branches
  for delete using (get_user_role() = 'admin');

-- profiles: cada usuario ve su propio perfil, admin ve todos
create policy "profiles_select_own" on profiles for select
  using (id = auth.uid() or get_user_role() = 'admin');
create policy "profiles_admin_insert" on profiles
  for insert with check (get_user_role() = 'admin');
create policy "profiles_admin_update" on profiles
  for update using (get_user_role() = 'admin');
create policy "profiles_admin_delete" on profiles
  for delete using (get_user_role() = 'admin');

-- products: lectura pública (display y POS), escritura solo admin
create policy "products_select_all" on products for select using (true);
create policy "products_admin_insert" on products
  for insert with check (get_user_role() = 'admin');
create policy "products_admin_update" on products
  for update using (get_user_role() = 'admin');
create policy "products_admin_delete" on products
  for delete using (get_user_role() = 'admin');

-- product_variants: lectura pública, escritura solo admin
create policy "variants_select_all" on product_variants for select using (true);
create policy "variants_admin_insert" on product_variants
  for insert with check (get_user_role() = 'admin');
create policy "variants_admin_update" on product_variants
  for update using (get_user_role() = 'admin');
create policy "variants_admin_delete" on product_variants
  for delete using (get_user_role() = 'admin');

-- branch_prices: lectura pública, escritura solo admin
create policy "branch_prices_select_all" on branch_prices for select using (true);
create policy "branch_prices_admin_insert" on branch_prices
  for insert with check (get_user_role() = 'admin');
create policy "branch_prices_admin_update" on branch_prices
  for update using (get_user_role() = 'admin');
create policy "branch_prices_admin_delete" on branch_prices
  for delete using (get_user_role() = 'admin');

-- ingredients: lectura pública, escritura solo admin
create policy "ingredients_select_all" on ingredients for select using (true);
create policy "ingredients_admin_insert" on ingredients
  for insert with check (get_user_role() = 'admin');
create policy "ingredients_admin_update" on ingredients
  for update using (get_user_role() = 'admin');
create policy "ingredients_admin_delete" on ingredients
  for delete using (get_user_role() = 'admin');

-- branch_stock: admin ve todo, cajero ve solo su sucursal
create policy "stock_select" on branch_stock for select
  using (get_user_role() = 'admin' or branch_id = get_user_branch_id());
create policy "stock_admin_insert" on branch_stock
  for insert with check (get_user_role() = 'admin');
create policy "stock_admin_update" on branch_stock
  for update using (get_user_role() = 'admin');
create policy "stock_admin_delete" on branch_stock
  for delete using (get_user_role() = 'admin');

-- recipes: lectura pública (POS necesita descontar), escritura solo admin
create policy "recipes_select_all" on recipes for select using (true);
create policy "recipes_admin_insert" on recipes
  for insert with check (get_user_role() = 'admin');
create policy "recipes_admin_update" on recipes
  for update using (get_user_role() = 'admin');
create policy "recipes_admin_delete" on recipes
  for delete using (get_user_role() = 'admin');

-- stock_movements: admin ve todo, cajero ve solo su sucursal
create policy "movements_select" on stock_movements for select
  using (get_user_role() = 'admin' or branch_id = get_user_branch_id());
create policy "movements_insert" on stock_movements for insert
  with check (get_user_role() = 'admin' or branch_id = get_user_branch_id());
create policy "movements_admin_update" on stock_movements
  for update using (get_user_role() = 'admin');
create policy "movements_admin_delete" on stock_movements
  for delete using (get_user_role() = 'admin');

-- promotions: lectura pública (POS), escritura solo admin
create policy "promotions_select_all" on promotions for select using (true);
create policy "promotions_admin_insert" on promotions
  for insert with check (get_user_role() = 'admin');
create policy "promotions_admin_update" on promotions
  for update using (get_user_role() = 'admin');
create policy "promotions_admin_delete" on promotions
  for delete using (get_user_role() = 'admin');

-- promotion_rules: lectura pública, escritura solo admin
create policy "promo_rules_select_all" on promotion_rules for select using (true);
create policy "promo_rules_admin_insert" on promotion_rules
  for insert with check (get_user_role() = 'admin');
create policy "promo_rules_admin_update" on promotion_rules
  for update using (get_user_role() = 'admin');
create policy "promo_rules_admin_delete" on promotion_rules
  for delete using (get_user_role() = 'admin');

-- orders: admin ve todo, cajero ve solo su sucursal
create policy "orders_select" on orders for select
  using (get_user_role() = 'admin' or branch_id = get_user_branch_id());
create policy "orders_insert" on orders for insert
  with check (get_user_role() = 'admin' or branch_id = get_user_branch_id());
create policy "orders_admin_update" on orders
  for update using (get_user_role() = 'admin');
create policy "orders_admin_delete" on orders
  for delete using (get_user_role() = 'admin');

-- order_items: acceso via order (mismo control de sucursal)
create policy "order_items_select" on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id
      and (get_user_role() = 'admin' or o.branch_id = get_user_branch_id())
    )
  );
create policy "order_items_insert" on order_items for insert
  with check (
    exists (
      select 1 from orders o
      where o.id = order_id
      and (get_user_role() = 'admin' or o.branch_id = get_user_branch_id())
    )
  );


-- ============================================================
-- SEED DATA
-- ============================================================

-- Sucursales
insert into branches (id, name, address) values
  ('a0000000-0000-0000-0000-000000000001', 'Sucursal A', 'Av. Principal 123'),
  ('a0000000-0000-0000-0000-000000000002', 'Sucursal B', 'Calle Secundaria 456');

-- Ingredientes base
insert into ingredients (id, name, unit) values
  ('b0000000-0000-0000-0000-000000000001', 'Harina', 'g'),
  ('b0000000-0000-0000-0000-000000000002', 'Salsa de tomate', 'g'),
  ('b0000000-0000-0000-0000-000000000003', 'Mozzarella', 'g'),
  ('b0000000-0000-0000-0000-000000000004', 'Pepperoni', 'g'),
  ('b0000000-0000-0000-0000-000000000005', 'Jamón', 'g'),
  ('b0000000-0000-0000-0000-000000000006', 'Coca-Cola 500ml', 'unidad'),
  ('b0000000-0000-0000-0000-000000000007', 'Agua 500ml', 'unidad');

-- Productos
insert into products (id, name, category, description) values
  ('c0000000-0000-0000-0000-000000000001', 'Pizza Pepperoni', 'pizza', 'Pepperoni, mozzarella, salsa de tomate'),
  ('c0000000-0000-0000-0000-000000000002', 'Pizza Jamón', 'pizza', 'Jamón, mozzarella, salsa de tomate'),
  ('c0000000-0000-0000-0000-000000000003', 'Coca-Cola', 'bebida', 'Coca-Cola 500ml bien fría');

-- Variantes Pizza Pepperoni
insert into product_variants (id, product_id, name, base_price) values
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Personal', 800),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Mediana', 1200),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Familiar', 1800);

-- Variantes Pizza Jamón
insert into product_variants (id, product_id, name, base_price) values
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'Personal', 750),
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'Mediana', 1150),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'Familiar', 1700);

-- Variante Coca-Cola
insert into product_variants (id, product_id, name, base_price) values
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'Personal', 300);

-- Recetas — Pizza Pepperoni Personal
insert into recipes (variant_id, ingredient_id, quantity) values
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 150),
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 80),
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 100),
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 60);

-- Recetas — Pizza Pepperoni Mediana
insert into recipes (variant_id, ingredient_id, quantity) values
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 250),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 150),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 180),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 100);

-- Recetas — Pizza Pepperoni Familiar
insert into recipes (variant_id, ingredient_id, quantity) values
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 380),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 220),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 270),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 150);

-- Recetas — Pizza Jamón Personal
insert into recipes (variant_id, ingredient_id, quantity) values
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 150),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 80),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 100),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 80);

-- Recetas — Coca-Cola (sin receta, solo descuenta unidad)
insert into recipes (variant_id, ingredient_id, quantity) values
  ('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000006', 1);

-- Stock inicial — Sucursal A
insert into branch_stock (branch_id, ingredient_id, quantity, min_quantity) values
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 5000, 1000),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 3000, 500),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 3000, 500),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 2000, 300),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 2000, 300),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 50, 10),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 30, 10);

-- Stock inicial — Sucursal B
insert into branch_stock (branch_id, ingredient_id, quantity, min_quantity) values
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 4000, 1000),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 2500, 500),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 2500, 500),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 1500, 300),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 1500, 300),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 40, 10),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000007', 25, 10);
