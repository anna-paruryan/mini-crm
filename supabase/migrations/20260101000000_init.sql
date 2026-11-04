-- =====================================================================
-- Мини-CRM «Объекты и задачи»: схема, RLS, смена статусов, история


-- ---------- Типы ----------
create type public.user_role  as enum ('manager', 'executor');
create type public.task_status as enum ('new', 'in_progress', 'in_review', 'accepted', 'needs_rework');

-- ---------- Таблицы ----------
create table public.profiles (
                                 id         uuid primary key references auth.users(id) on delete cascade,
                                 full_name  text not null default '',
                                 role       public.user_role not null default 'executor',
                                 created_at timestamptz not null default now()
);

create table public.objects (
                                id         uuid primary key default gen_random_uuid(),
                                name       text not null check (char_length(btrim(name)) between 1 and 200),
                                address    text not null check (char_length(btrim(address)) between 1 and 500),
                                created_at timestamptz not null default now()
);

create table public.tasks (
                              id          uuid primary key default gen_random_uuid(),
                              title       text not null check (char_length(btrim(title)) between 1 and 200),
                              description text not null default '' check (char_length(description) <= 5000),
                              object_id   uuid not null references public.objects(id) on delete restrict,
                              assignee_id uuid references public.profiles(id) on delete set null,
                              status      public.task_status not null default 'new',
                              author_id   uuid not null default auth.uid() references public.profiles(id),
                              created_at  timestamptz not null default now()
);

create table public.task_history (
                                     id          bigint generated always as identity primary key,
                                     task_id     uuid not null references public.tasks(id) on delete cascade,
                                     changed_by  uuid not null references public.profiles(id),
                                     from_status public.task_status,            -- null = создание задачи
                                     to_status   public.task_status not null,
                                     comment     text,
                                     created_at  timestamptz not null default now()
);

create index tasks_assignee_idx on public.tasks(assignee_id);
create index tasks_object_idx   on public.tasks(object_id);
create index history_task_idx   on public.task_history(task_id, created_at);

-- ---------- Профиль создаётся автоматически; роль ВСЕГДА executor ----------
-- Постановщика назначает администратор вручную:
--   update public.profiles set role = 'manager' where id = '<uuid>';
create function public.handle_new_user() returns trigger
    language plpgsql security definer set search_path = '' as $$
begin
insert into public.profiles (id, full_name)
values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email, ''));
return new;
end $$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------- Хелперы для политик ----------
create function public.is_manager() returns boolean
    language sql stable security definer set search_path = '' as $$
select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'manager'
);
$$;

-- ---------- Триггер-охранник задач ----------
-- 1) исполнитель задачи обязан иметь роль executor
-- 2) статус нельзя менять иначе как через change_task_status()
-- 3) автор и дата создания неизменны
create function public.tasks_guard() returns trigger
    language plpgsql security definer set search_path = '' as $$
begin
  if new.assignee_id is not null and not exists (
    select 1 from public.profiles where id = new.assignee_id and role = 'executor'
  ) then
    raise exception 'Исполнителем может быть только пользователь с ролью «исполнитель»';
end if;

  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status
       and coalesce(current_setting('app.allow_status_change', true), 'off') <> 'on' then
      raise exception 'Статус можно менять только через change_task_status()';
end if;
    if new.author_id <> old.author_id or new.created_at <> old.created_at then
      raise exception 'Автора и дату создания менять нельзя';
end if;
end if;

return new;
end $$;

create trigger tasks_guard_trg
    before insert or update on public.tasks
                         for each row execute function public.tasks_guard();

-- ---------- Первая запись истории при создании задачи ----------
create function public.tasks_log_create() returns trigger
    language plpgsql security definer set search_path = '' as $$
begin
insert into public.task_history (task_id, changed_by, from_status, to_status)
values (new.id, new.author_id, null, new.status);
return new;
end $$;

create trigger tasks_log_create_trg
    after insert on public.tasks
    for each row execute function public.tasks_log_create();

-- ---------- Единственный путь смены статуса ----------
create function public.change_task_status(
    p_task_id    uuid,
    p_new_status public.task_status,
    p_comment    text default null
) returns public.tasks
language plpgsql security definer set search_path = '' as $$
declare
v_uid        uuid := auth.uid();
  v_is_manager boolean;
  v_task       public.tasks;
  v_comment    text := nullif(btrim(p_comment), '');
  v_actor      text;   -- кто вправе делать этот переход: 'assignee' | 'manager'
  v_from       public.task_status;
begin
  if v_uid is null then
    raise exception 'Требуется авторизация' using errcode = '28000';
end if;
  if v_comment is not null and char_length(v_comment) > 2000 then
    raise exception 'Комментарий слишком длинный (максимум 2000 символов)';
end if;

  v_is_manager := public.is_manager();

select * into v_task from public.tasks where id = p_task_id for update;

-- чужую задачу не раскрываем: ответ как для несуществующей
if not found or (not v_is_manager and v_task.assignee_id is distinct from v_uid) then
    raise exception 'Задача не найдена' using errcode = 'P0002';
end if;

  -- таблица допустимых переходов
  if    v_task.status = 'new'          and p_new_status = 'in_progress'  then v_actor := 'assignee';
  elsif v_task.status = 'in_progress'  and p_new_status = 'in_review'    then v_actor := 'assignee';
  elsif v_task.status = 'in_review'    and p_new_status = 'accepted'     then v_actor := 'manager';
  elsif v_task.status = 'in_review'    and p_new_status = 'needs_rework' then v_actor := 'manager';
  elsif v_task.status = 'needs_rework' and p_new_status = 'in_progress'  then v_actor := 'assignee';
else
    raise exception 'Переход % -> % запрещён', v_task.status, p_new_status
      using errcode = '42501';
end if;

  if v_actor = 'manager' and not v_is_manager then
    raise exception 'Этот переход доступен только постановщику' using errcode = '42501';
end if;
  if v_actor = 'assignee' and v_task.assignee_id is distinct from v_uid then
    raise exception 'Этот переход доступен только назначенному исполнителю' using errcode = '42501';
end if;

  if p_new_status = 'needs_rework' and v_comment is null then
    raise exception 'При возврате на доработку комментарий обязателен' using errcode = '23514';
end if;

  v_from := v_task.status;
  perform set_config('app.allow_status_change', 'on', true);
update public.tasks set status = p_new_status
where id = p_task_id
    returning * into v_task;
perform set_config('app.allow_status_change', 'off', true);

insert into public.task_history (task_id, changed_by, from_status, to_status, comment)
values (p_task_id, v_uid, v_from, p_new_status, v_comment);

return v_task;
end $$;

-- ---------- Права на уровне GRANT (первый рубеж) ----------
revoke all on public.profiles, public.objects, public.tasks, public.task_history
    from anon, authenticated;

grant select on public.profiles     to authenticated;   -- только id, имя, роль (email в auth.users недоступен)
grant select, insert, update, delete on public.objects to authenticated;

grant select, delete on public.tasks to authenticated;
grant insert (title, description, object_id, assignee_id) on public.tasks to authenticated;
grant update (title, description, object_id, assignee_id) on public.tasks to authenticated;

grant select on public.task_history to authenticated;   -- писать/менять/удалять нельзя

-- Функции: по умолчанию PUBLIC может их вызывать, закрываем.
revoke execute on all functions in schema public from public, anon, authenticated;
grant  execute on function public.is_manager()                                           to authenticated;
grant  execute on function public.change_task_status(uuid, public.task_status, text)     to authenticated;

-- ---------- RLS (второй рубеж) ----------
alter table public.profiles     enable row level security;
alter table public.objects      enable row level security;
alter table public.tasks        enable row level security;
alter table public.task_history enable row level security;

-- profiles: читать могут все вошедшие (нужно для имён исполнителей), менять — никто через API
create policy profiles_select on public.profiles
  for select to authenticated using (true);

-- objects
create policy objects_select on public.objects
  for select to authenticated
                 using (
                 public.is_manager()
                 or exists (select 1 from public.tasks t
                 where t.object_id = objects.id and t.assignee_id = auth.uid())
                 );
create policy objects_insert on public.objects
  for insert to authenticated with check (public.is_manager());
create policy objects_update on public.objects
  for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy objects_delete on public.objects
  for delete to authenticated using (public.is_manager());

-- tasks
create policy tasks_select on public.tasks
  for select to authenticated
                                     using (public.is_manager() or assignee_id = auth.uid());
create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (public.is_manager() and author_id = auth.uid() and status = 'new');
create policy tasks_update on public.tasks
  for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy tasks_delete on public.tasks
  for delete to authenticated using (public.is_manager());

-- task_history: только чтение, и только для задач, которые пользователь видит
create policy history_select on public.task_history
  for select to authenticated
                                     using (exists (select 1 from public.tasks t where t.id = task_history.task_id));