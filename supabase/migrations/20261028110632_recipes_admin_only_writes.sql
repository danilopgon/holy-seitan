-- Only the two admins write recipes. Admin comes from app_metadata, which only the server can set:
-- the previous policy read user_metadata, which any user can write at sign-up, and any signed-in user
-- could insert recipes (published by default). Sign-ups are also disabled in Supabase Auth.
--
-- Rollback (restores the previous policies):
--   drop policy admin_all_on_recipes on public.recipes;
--   create policy admin_all_on_recipes on public.recipes for all to authenticated
--     using (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin')
--     with check (((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin');
--   create policy auth_can_insert_own on public.recipes for insert to authenticated with check (created_by = auth.uid());
--   create policy author_can_update_own on public.recipes for update to authenticated
--     using (created_by = auth.uid()) with check (created_by = auth.uid());
--   create policy author_can_delete_own on public.recipes for delete to authenticated using (created_by = auth.uid());
--   create policy recipes_update_own_or_admin on public.recipes for update to authenticated
--     using ((created_by = auth.uid()) or (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
--     with check ((created_by = auth.uid()) or (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));
--   alter function public.set_updated_at() reset search_path;

drop policy if exists admin_all_on_recipes on public.recipes;
drop policy if exists auth_can_insert_own on public.recipes;
drop policy if exists author_can_update_own on public.recipes;
drop policy if exists author_can_delete_own on public.recipes;
drop policy if exists recipes_update_own_or_admin on public.recipes;

create policy admin_all_on_recipes on public.recipes
  for all
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Advisor 0011: pin the trigger function's search_path
alter function public.set_updated_at() set search_path = '';
