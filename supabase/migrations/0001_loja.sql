-- Morena Pratas — banco da loja (Supabase / Lovable Cloud)
-- Peças e estoque são escritos só pela Edge Function sync-estoque (service role).
-- Pedidos são escritos só pelas funções de checkout e webhook. Nenhum dado de cartão é guardado.

create table if not exists public.products (
  id          text primary key,              -- SKU base, ex.: AN-P925-COR-004
  slug        text unique not null,
  name        text not null,
  category    text not null check (category in ('aneis','aparadores','colares','pulseiras','brincos','tornozeleiras')),
  material    text not null check (material in ('prata','ouro')),
  description text not null default '',
  photo       text,
  drawing     jsonb not null default '{}'::jsonb,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table if not exists public.variants (
  sku        text primary key,               -- SKU completo, ex.: AN-P925-COR-004-14
  product_id text not null references public.products(id) on delete cascade,
  size       text not null,
  price      numeric(10,2) not null check (price > 0),
  stock      integer not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists variants_product_idx on public.variants(product_id);

-- O que o site lê: só peça ativa, com preço e saldo
create or replace view public.catalog_public as
select
  p.id, p.slug, p.name, p.category, p.material, p.description, p.photo, p.drawing,
  jsonb_agg(jsonb_build_object('sku', v.sku, 'size', v.size, 'price', v.price, 'stock', v.stock) order by v.size) as variants,
  min(v.price) as "priceFrom"
from public.products p
join public.variants v on v.product_id = p.id and v.stock > 0
where p.active
group by p.id;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  email            text,
  status           text not null default 'pending',   -- pending | approved | in_process | rejected | cancelled | shipped | delivered
  total            numeric(10,2) not null,
  items            jsonb not null,                     -- [{sku, name, size, qty, price}]
  mp_preference_id text,
  mp_payment_id    text,
  stock_applied    boolean not null default false,     -- evita baixar estoque duas vezes
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id);

alter table public.products enable row level security;
alter table public.variants enable row level security;
alter table public.orders   enable row level security;

drop policy if exists "catálogo é público" on public.products;
create policy "catálogo é público" on public.products for select using (true);
drop policy if exists "variações são públicas" on public.variants;
create policy "variações são públicas" on public.variants for select using (true);
drop policy if exists "cliente vê os próprios pedidos" on public.orders;
create policy "cliente vê os próprios pedidos" on public.orders for select using (auth.uid() = user_id);

grant select on public.catalog_public to anon, authenticated;

-- Baixa de estoque atômica, chamada pelo webhook quando o pagamento é aprovado
create or replace function public.apply_order_stock(order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare it jsonb;
begin
  if (select stock_applied from orders where id = order_id) then return; end if;
  for it in select * from jsonb_array_elements((select items from orders where id = order_id)) loop
    update variants set stock = greatest(stock - (it->>'qty')::int, 0), updated_at = now() where sku = it->>'sku';
  end loop;
  update orders set stock_applied = true, updated_at = now() where id = order_id;
end $$;
revoke all on function public.apply_order_stock(uuid) from public, anon, authenticated;

-- Sincronização automática a cada 15 minutos (requer as extensões pg_cron e pg_net ativas).
-- Troque <PROJETO> e <SERVICE_ROLE_KEY> antes de rodar este bloco.
-- select cron.schedule('sync-estoque', '*/15 * * * *', $$
--   select net.http_post(
--     url := 'https://<PROJETO>.supabase.co/functions/v1/sync-estoque',
--     headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
--   );
-- $$);
