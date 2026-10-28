-- pgTAP: `npx supabase test db`. Needs the local seed (supabase/seed.sql): two admins, one user without
-- permissions, 27 published recipes and the unpublished 'receta-de-prueba'.
begin;
select plan(24);

create function pg_temp.as_user(uid uuid, app_meta jsonb, client_id text default null) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', uid, 'role', 'authenticated', 'app_metadata', app_meta, 'client_id', client_id
  )::text, true);
  execute 'set local role authenticated';
end;
$$;

create function pg_temp.test_recipe_id() returns uuid language sql as $$
  select id from public.recipes where slug = 'receta-de-prueba'
$$;

-- Visitors
set local role anon;
select is((select count(*)::int from public.recipes), 27, 'anon reads the 27 published recipes');
select is((select count(*)::int from public.recipes where slug = 'receta-de-prueba'), 0, 'anon cannot see the unpublished test recipe');
select throws_ok(
  $$ select public.apply_recipe_update(gen_random_uuid(), 1, '{"title":"x"}') $$,
  '42501', null, 'anon cannot call apply_recipe_update'
);
reset role;

-- Signed-in user without the admin role
select pg_temp.as_user('33333333-3333-3333-3333-333333333333', '{}');
select throws_ok(
  format($$ select public.apply_recipe_update(%L, 1, '{"title":"hackeada"}') $$, (select id from public.recipes where slug = 'dhal')),
  '42501', 'not_allowed', 'a user without the admin role cannot change a recipe'
);
select throws_ok(
  $$ insert into public.recipes (slug, title, description, content_md, emoji, created_by)
     values ('spam', 'spam', 'spam', 'spam', 'x', '33333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'a user without the admin role cannot create recipes'
);
select is((select count(*)::int from public.recipe_revisions), 0, 'a user without the admin role sees no history');
select throws_ok(
  $$ update public.recipe_revisions set summary = 'x' $$, '42501', null, 'nobody can rewrite the history directly'
);
reset role;

-- Forged user_metadata does not make anyone an admin
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '33333333-3333-3333-3333-333333333333', 'role', 'authenticated',
  'user_metadata', jsonb_build_object('role', 'admin'), 'app_metadata', '{}'::jsonb
)::text, true);
set local role authenticated;
select throws_ok(
  format($$ select public.apply_recipe_update(%L, 1, '{"title":"hackeada"}') $$, (select id from public.recipes where slug = 'dhal')),
  '42501', 'not_allowed', 'user_metadata.role = admin grants nothing'
);
reset role;

-- Admin through an MCP client
select pg_temp.as_user('11111111-1111-1111-1111-111111111111', '{"role":"admin"}', 'claude-code-test');
select is((select version from public.recipes where slug = 'receta-de-prueba'), 1, 'the test recipe starts at version 1');

select is(
  (public.apply_recipe_update(pg_temp.test_recipe_id(), 1,
    '{"content_md":"## Instrucciones\n\n1. Pochamos la cebolla.","title":"Receta de prueba editada"}', 'Primer cambio')).version,
  2, 'an admin change moves the recipe to version 2'
);
select is((select title from public.recipes where slug = 'receta-de-prueba'), 'Receta de prueba editada', 'the change is stored');
select is((select description from public.recipes where slug = 'receta-de-prueba'),
  'Receta para probar la edición por agentes (MCP). No publicada.', 'fields not in the change are kept');
select results_eq(
  $$ select version, title, summary, client_id, changed_by from public.recipe_revisions where recipe_id = pg_temp.test_recipe_id() $$,
  $$ values (1, 'Receta de prueba'::varchar, 'Primer cambio', 'claude-code-test', '11111111-1111-1111-1111-111111111111'::uuid) $$,
  'the history keeps the previous version with who, which client and why'
);

select throws_ok(
  format($$ select public.apply_recipe_update(%L, 1, '{"title":"tarde"}') $$, pg_temp.test_recipe_id()),
  '40001', null, 'a stale version is a conflict, not an overwrite'
);
select throws_ok(
  format($$ select public.apply_recipe_update(%L, 2, '{"slug":"otra","is_published":true}') $$, pg_temp.test_recipe_id()),
  '22023', null, 'fields outside the editable set are rejected'
);
select throws_ok(
  format($$ select public.apply_recipe_update(%L, 2, '{"ingredients":[{"id":"x","name":"sal","quantity":{"min":0}}]}') $$, pg_temp.test_recipe_id()),
  '23514', null, 'an invalid ingredient list is rejected by the database'
);
select throws_ok(
  format($$ select public.apply_recipe_update(%L, 2, '{"ingredients":[{"id":"x","name":"a"},{"id":"x","name":"b"}]}') $$, pg_temp.test_recipe_id()),
  '23514', null, 'duplicate ingredient ids are rejected'
);
select throws_ok(
  $$ select public.apply_recipe_update(gen_random_uuid(), 1, '{"title":"x"}') $$, 'P0002', 'recipe_not_found', 'a missing recipe is reported as such'
);

select is(
  (public.apply_recipe_update(pg_temp.test_recipe_id(), 2,
    '{"ingredients":[{"id":"prueba-1","name":"cebolla","quantity":{"min":2}}]}', 'Segundo cambio')).version,
  3, 'ingredients can change on their own'
);

select is(
  (public.restore_recipe_revision(pg_temp.test_recipe_id(), 1, 3)).version,
  4, 'restoring version 1 creates version 4'
);
select results_eq(
  $$ select title, content_md, ingredients from public.recipes where slug = 'receta-de-prueba' $$,
  $$ select title, content_md, ingredients from public.recipe_revisions where recipe_id = pg_temp.test_recipe_id() and version = 1 $$,
  'the restored recipe matches version 1 exactly'
);
select is(
  (select summary from public.recipe_revisions where recipe_id = pg_temp.test_recipe_id() and version = 3),
  'Restaurada la versión 1', 'the restore itself is in the history, so it can be undone'
);
select throws_ok(
  format($$ select public.restore_recipe_revision(%L, 99, 4) $$, pg_temp.test_recipe_id()),
  'P0002', 'revision_not_found', 'restoring a version that does not exist fails cleanly'
);
reset role;

-- Admin from the panel (no OAuth client): client_id stays null
select pg_temp.as_user('22222222-2222-2222-2222-222222222222', '{"role":"admin"}');
update public.recipes set servings = 3 where slug = 'receta-de-prueba';
select is(
  (select client_id from public.recipe_revisions where recipe_id = pg_temp.test_recipe_id() order by version desc limit 1),
  null, 'panel edits are recorded without a client id'
);
reset role;

select * from finish();
rollback;
