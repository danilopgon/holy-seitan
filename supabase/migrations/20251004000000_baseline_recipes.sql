-- Baseline: the recipes schema as it was created by hand in October 2025, before migrations were tracked.
-- It only exists so a local stack (`supabase start`) can build the database from scratch. In production it is
-- recorded as already applied (supabase_migrations.schema_migrations), so it never runs there.
-- The policies below are the original ones; 20261028110632_recipes_admin_only_writes replaces them.

create type public.difficulty_level as enum ('easy', 'medium', 'hard');

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug varchar(160) not null unique,
  title varchar(200) not null,
  description varchar(280) not null,
  content_md text not null,
  emoji varchar(16) not null,
  prep_time integer not null default 0,
  cook_time integer not null default 0,
  servings integer not null default 1,
  difficulty public.difficulty_level not null default 'easy',
  tags text[],
  is_published boolean not null default true,
  created_by uuid not null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint chk_servings_positive check (servings >= 1),
  constraint chk_times_non_negative check (prep_time >= 0 and cook_time >= 0)
);

create index idx_recipes_created_at on public.recipes (created_at desc);
create index idx_recipes_tags_gin on public.recipes using gin (tags);
create index idx_recipes_is_published on public.recipes (is_published);

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_set_updated_at before update on public.recipes
  for each row execute function public.set_updated_at();

alter table public.recipes enable row level security;

grant select, insert, update, delete on public.recipes to anon, authenticated;

create policy public_can_read_published_recipes on public.recipes for select to anon, authenticated
  using (is_published = true);
create policy author_can_read_own_unpublished on public.recipes for select to authenticated
  using (created_by = auth.uid());
create policy auth_can_insert_own on public.recipes for insert to authenticated
  with check (created_by = auth.uid());
create policy author_can_update_own on public.recipes for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy author_can_delete_own on public.recipes for delete to authenticated
  using (created_by = auth.uid());
create policy admin_all_on_recipes on public.recipes for all to authenticated
  using (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin')
  with check (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin');
create policy recipes_update_own_or_admin on public.recipes for update to authenticated
  using ((created_by = auth.uid()) or (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
  with check ((created_by = auth.uid()) or (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));
