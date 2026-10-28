-- Issue #9: optimistic concurrency, history and rollback for recipes, shared by the admin panel and the MCP server.
--
-- recipes.version increases on every update. Every update also stores the row as it was before the change in
-- recipe_revisions, whoever made it (panel or MCP client). apply_recipe_update and restore_recipe_revision only
-- write when the caller still has the version it read, so two edits never silently overwrite each other.
-- Both run as the caller (security invoker): RLS keeps writes to the admins.

-- Ingredient shape, checked in the database so the panel and the MCP share one rule.
-- Mirrors core/models/recipe-ingredient.ts.
create function public.is_valid_ingredients(value jsonb) returns boolean
language sql immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'array'
    and not exists (
      select 1
      from jsonb_array_elements(value) as e(item)
      where case
        when jsonb_typeof(e.item) <> 'object' then true
        when jsonb_typeof(e.item -> 'id') is distinct from 'string' or e.item ->> 'id' = '' then true
        when jsonb_typeof(e.item -> 'name') is distinct from 'string' or btrim(e.item ->> 'name') = '' then true
        when e.item ? 'unit' and jsonb_typeof(e.item -> 'unit') <> 'string' then true
        when e.item ? 'note' and jsonb_typeof(e.item -> 'note') <> 'string' then true
        when e.item ? 'group' and jsonb_typeof(e.item -> 'group') <> 'string' then true
        when not e.item ? 'quantity' then false
        when jsonb_typeof(e.item -> 'quantity') <> 'object' then true
        when jsonb_typeof(e.item -> 'quantity' -> 'min') is distinct from 'number' then true
        when (e.item -> 'quantity' ->> 'min')::numeric <= 0 then true
        when not (e.item -> 'quantity') ? 'max' then false
        when jsonb_typeof(e.item -> 'quantity' -> 'max') is distinct from 'number' then true
        else (e.item -> 'quantity' ->> 'max')::numeric <= (e.item -> 'quantity' ->> 'min')::numeric
      end
    )
    and (select count(*) from jsonb_array_elements(value)) =
        (select count(distinct item ->> 'id') from jsonb_array_elements(value) as e(item));
$$;

alter table public.recipes drop constraint recipes_ingredients_is_array;
alter table public.recipes add constraint recipes_ingredients_valid check (public.is_valid_ingredients(ingredients));

alter table public.recipes add column version integer not null default 1;

create table public.recipe_revisions (
  id bigint generated always as identity primary key,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  -- The version this snapshot had; the recipe moved to version + 1 with the change
  version integer not null,
  title varchar(200) not null,
  description varchar(280) not null,
  content_md text not null,
  ingredients jsonb not null,
  emoji varchar(16) not null,
  prep_time integer not null,
  cook_time integer not null,
  servings integer not null,
  difficulty public.difficulty_level not null,
  tags text[],
  is_published boolean not null,
  changed_by uuid,
  -- OAuth client that made the change (the MCP connection); null for the admin panel
  client_id text,
  summary text,
  created_at timestamptz not null default now(),
  unique (recipe_id, version)
);

create index recipe_revisions_recipe_id_idx on public.recipe_revisions (recipe_id, version desc);

alter table public.recipe_revisions enable row level security;

-- Reads only, whatever the project's default privileges are: writes come from the trigger alone
revoke all on public.recipe_revisions from anon, authenticated;
grant select on public.recipe_revisions to authenticated;

create policy admin_read_recipe_revisions on public.recipe_revisions
  for select
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Trigger functions live outside the exposed schema: nobody can call them through the API
create schema if not exists private;

create function private.bump_recipe_version() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  return new;
end;
$$;

-- security definer so history is written even though nobody (not even admins) can insert into it directly
create function private.record_recipe_revision() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.recipe_revisions (
    recipe_id, version, title, description, content_md, ingredients, emoji, prep_time, cook_time, servings,
    difficulty, tags, is_published, changed_by, client_id, summary
  ) values (
    old.id, old.version, old.title, old.description, old.content_md, old.ingredients, old.emoji, old.prep_time,
    old.cook_time, old.servings, old.difficulty, old.tags, old.is_published, auth.uid(),
    nullif(auth.jwt() ->> 'client_id', ''),
    nullif(current_setting('holy_seitan.revision_summary', true), '')
  );
  return null;
end;
$$;

revoke all on function private.record_recipe_revision() from public, anon, authenticated;

create trigger trg_bump_recipe_version before update on public.recipes
  for each row execute function private.bump_recipe_version();

create trigger trg_record_recipe_revision after update on public.recipes
  for each row execute function private.record_recipe_revision();

-- Explains why a guarded update touched no row: missing, stale version, or not allowed by RLS
create function private.raise_recipe_write_error(p_recipe_id uuid, p_expected_version integer) returns void
language plpgsql
set search_path = ''
as $$
declare
  current_version integer;
begin
  select version into current_version from public.recipes where id = p_recipe_id;
  if current_version is null then
    raise exception 'recipe_not_found' using errcode = 'P0002';
  elsif current_version <> p_expected_version then
    raise exception 'version_conflict: expected %, current %', p_expected_version, current_version
      using errcode = '40001';
  else
    raise exception 'not_allowed' using errcode = '42501';
  end if;
end;
$$;

grant usage on schema private to authenticated;
grant execute on function private.raise_recipe_write_error(uuid, integer) to authenticated;

-- Partial update of the fields an agent may change. Unknown keys are rejected, not ignored.
create function public.apply_recipe_update(
  p_recipe_id uuid,
  p_expected_version integer,
  p_changes jsonb,
  p_summary text default null
) returns public.recipes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated public.recipes;
  unknown_keys text;
begin
  if jsonb_typeof(p_changes) is distinct from 'object' or p_changes = '{}'::jsonb then
    raise exception 'invalid_changes: expected a non-empty object' using errcode = '22023';
  end if;

  select string_agg(k, ', ') into unknown_keys
  from jsonb_object_keys(p_changes) as k
  where k not in ('title', 'description', 'content_md', 'ingredients');
  if unknown_keys is not null then
    raise exception 'invalid_changes: fields not allowed: %', unknown_keys using errcode = '22023';
  end if;

  perform set_config('holy_seitan.revision_summary', coalesce(p_summary, ''), true);

  update public.recipes set
    title = coalesce(p_changes ->> 'title', title),
    description = coalesce(p_changes ->> 'description', description),
    content_md = coalesce(p_changes ->> 'content_md', content_md),
    ingredients = coalesce(p_changes -> 'ingredients', ingredients)
  where id = p_recipe_id and version = p_expected_version
  returning * into updated;

  if updated.id is null then
    perform private.raise_recipe_write_error(p_recipe_id, p_expected_version);
  end if;
  return updated;
end;
$$;

-- Brings back every content field of a past version. The restore is itself a new version in the history.
create function public.restore_recipe_revision(
  p_recipe_id uuid,
  p_revision_version integer,
  p_expected_version integer
) returns public.recipes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  rev public.recipe_revisions;
  updated public.recipes;
begin
  select * into rev from public.recipe_revisions where recipe_id = p_recipe_id and version = p_revision_version;
  if rev.id is null then
    raise exception 'revision_not_found' using errcode = 'P0002';
  end if;

  perform set_config('holy_seitan.revision_summary', format('Restaurada la versión %s', p_revision_version), true);

  update public.recipes set
    title = rev.title,
    description = rev.description,
    content_md = rev.content_md,
    ingredients = rev.ingredients,
    emoji = rev.emoji,
    prep_time = rev.prep_time,
    cook_time = rev.cook_time,
    servings = rev.servings,
    difficulty = rev.difficulty,
    tags = rev.tags
  where id = p_recipe_id and version = p_expected_version
  returning * into updated;

  if updated.id is null then
    perform private.raise_recipe_write_error(p_recipe_id, p_expected_version);
  end if;
  return updated;
end;
$$;

revoke all on function public.apply_recipe_update(uuid, integer, jsonb, text) from public, anon;
revoke all on function public.restore_recipe_revision(uuid, integer, integer) from public, anon;
grant execute on function public.apply_recipe_update(uuid, integer, jsonb, text) to authenticated;
grant execute on function public.restore_recipe_revision(uuid, integer, integer) to authenticated;
