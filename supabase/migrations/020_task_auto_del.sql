create extension if not exists pg_cron with schema extensions;

create index if not exists tasks_status_updated_idx
  on public.tasks(status, updated_at);

create or replace function public.delete_old_done_tasks()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.tasks
  where status = 'done'
    and coalesce(status_since, updated_at, created_at) < now() - interval '24 hours';
end;
$$;

select cron.schedule(
  'delete_old_done_tasks_daily',
  '5 0 * * *',
  $$select public.delete_old_done_tasks();$$
);
