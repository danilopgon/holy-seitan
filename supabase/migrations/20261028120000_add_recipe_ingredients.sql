-- Issue #7: structured ingredients, separate from content_md.
-- Additive and safe to run before the data migration: existing recipes get '[]' and keep rendering their Markdown.
alter table public.recipes
  add column if not exists ingredients jsonb not null default '[]'::jsonb;

alter table public.recipes
  add constraint recipes_ingredients_is_array check (jsonb_typeof(ingredients) = 'array');
