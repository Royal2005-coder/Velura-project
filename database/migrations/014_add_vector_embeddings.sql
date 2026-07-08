-- 014_add_vector_embeddings.sql
-- Enables the pgvector extension and adds embedding columns and RPC search functions.

begin;

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Add embedding columns (dimension 3072 matches models/gemini-embedding-001)
alter table public.product add column if not exists embedding vector(3072);
alter table public.policy add column if not exists embedding vector(3072);
alter table public.blog add column if not exists embedding vector(3072);

-- 3. Create semantic search RPCs
create or replace function public.match_products(
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
returns table (
  product_id uuid,
  sku text,
  name text,
  slug text,
  description text,
  image_url text,
  base_price numeric,
  sale_price numeric,
  is_featured boolean,
  status text,
  similarity float
)
language plpgsql security definer
set search_path = public, pg_catalog
as $$
begin
  return query
  select
    p.product_id,
    p.sku,
    p.name,
    p.slug,
    p.description,
    p.image_url,
    p.base_price,
    p.sale_price,
    p.is_featured,
    p.status,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.product p
  where p.status = 'on_sale'
    and 1 - (p.embedding <=> query_embedding) > match_threshold
  order by p.embedding <=> query_embedding
  limit match_count;
end;
$$;

create or replace function public.match_policies(
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
returns table (
  policy_id uuid,
  slug text,
  title text,
  summary text,
  content jsonb,
  similarity float
)
language plpgsql security definer
set search_path = public, pg_catalog
as $$
begin
  return query
  select
    p.policy_id,
    p.slug,
    p.title,
    p.summary,
    p.content,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.policy p
  where p.status = 'published'
    and 1 - (p.embedding <=> query_embedding) > match_threshold
  order by p.embedding <=> query_embedding
  limit match_count;
end;
$$;

create or replace function public.match_blogs(
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
returns table (
  blog_id uuid,
  slug text,
  title text,
  excerpt text,
  content text,
  image_url text,
  author text,
  read_minutes int,
  similarity float
)
language plpgsql security definer
set search_path = public, pg_catalog
as $$
begin
  return query
  select
    b.blog_id,
    b.slug,
    b.title,
    b.excerpt,
    b.content,
    b.image_url,
    b.author,
    b.read_minutes,
    1 - (b.embedding <=> query_embedding) as similarity
  from public.blog b
  where b.status = 'published'
    and 1 - (b.embedding <=> query_embedding) > match_threshold
  order by b.embedding <=> query_embedding
  limit match_count;
end;
$$;

commit;
