-- =====================================================================
-- Тесты безопасности. Запускать в SQL Editor ПОСЛЕ миграции и ПОСЛЕ
-- создания трёх пользователей в Authentication -> Users (Auto confirm):
--   manager@test.local, exec1@test.local, exec2@test.local
-- Всё выполняется в транзакции и откатывается: данные не остаются.
-- Успех = в Messages только «OK: ...» и итог «ALL TESTS PASSED».
-- =====================================================================
begin;

do $$
declare
v_mgr   uuid; v_e1 uuid; v_e2 uuid;
  v_obj1  uuid; v_obj2 uuid;
  v_t1    uuid;  -- задача исполнителя 1
  v_t2    uuid;  -- задача исполнителя 2
  v_n     int;
begin
select id into v_mgr from auth.users where email = 'manager@test.local';
select id into v_e1  from auth.users where email = 'exec1@test.local';
select id into v_e2  from auth.users where email = 'exec2@test.local';
if v_mgr is null or v_e1 is null or v_e2 is null then
    raise exception 'Сначала создайте пользователей manager@/exec1@/exec2@test.local';
end if;

  -- подготовка данных от имени владельца базы
update public.profiles set role = 'manager'  where id = v_mgr;
update public.profiles set role = 'executor' where id in (v_e1, v_e2);

insert into public.objects(name, address) values ('Объект 1', 'ул. Тестовая, 1') returning id into v_obj1;
insert into public.objects(name, address) values ('Объект 2', 'ул. Тестовая, 2') returning id into v_obj2;
insert into public.tasks(title, object_id, assignee_id, author_id) values ('Задача E1', v_obj1, v_e1, v_mgr) returning id into v_t1;
insert into public.tasks(title, object_id, assignee_id, author_id) values ('Задача E2', v_obj2, v_e2, v_mgr) returning id into v_t2;

------------------------------------------------------------------
-- ИСПОЛНИТЕЛЬ 1
------------------------------------------------------------------
perform set_config('request.jwt.claims', json_build_object('sub', v_e1, 'role', 'authenticated')::text, true);
set local role authenticated;

select count(*) into v_n from public.tasks where assignee_id is distinct from v_e1;
if v_n <> 0 then raise exception 'TEST FAILED: исполнитель видит % чужих задач', v_n; end if;
select count(*) into v_n from public.tasks where id = v_t1;
if v_n <> 1 then raise exception 'TEST FAILED: исполнитель не видит свою задачу'; end if;
  raise notice 'OK: исполнитель видит только свои задачи';

select count(*) into v_n from public.tasks where id = v_t2;
if v_n <> 0 then raise exception 'TEST FAILED: виден чужой task'; end if;
  raise notice 'OK: чужая задача не читается';

select count(*) into v_n from public.objects where id = v_obj2;
if v_n <> 0 then raise exception 'TEST FAILED: виден объект без его задач'; end if;
select count(*) into v_n from public.objects where id = v_obj1;
if v_n <> 1 then raise exception 'TEST FAILED: не виден объект со своей задачей'; end if;
  raise notice 'OK: виден только объект, где есть его задача';

select count(*) into v_n from public.task_history where task_id = v_t2;
if v_n <> 0 then raise exception 'TEST FAILED: видна история чужой задачи'; end if;
  raise notice 'OK: история чужой задачи не читается';

  -- прямой апдейт чужой задачи: 0 строк
update public.tasks set title = 'взлом' where id = v_t2;
get diagnostics v_n = row_count;
if v_n <> 0 then raise exception 'TEST FAILED: изменена чужая задача'; end if;
  raise notice 'OK: чужую задачу изменить нельзя';

  -- прямой апдейт СВОЕЙ задачи (название): тоже нельзя, исполнитель только меняет статус
update public.tasks set title = 'взлом' where id = v_t1;
get diagnostics v_n = row_count;
if v_n <> 0 then raise exception 'TEST FAILED: исполнитель изменил название'; end if;
  raise notice 'OK: исполнитель не может редактировать задачу';

  -- прямой апдейт статуса своей задачи
begin
update public.tasks set status = 'accepted' where id = v_t1;
raise exception 'TEST FAILED: прямой апдейт статуса прошёл';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: прямой апдейт статуса запрещён (%)', sqlerrm;
end;

  -- смена статуса чужой задачи через RPC
begin
    perform public.change_task_status(v_t2, 'in_progress');
    raise exception 'TEST FAILED: взята чужая задача';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: чужую задачу через RPC взять нельзя (%)', sqlerrm;
end;

  -- запрещённый переход: new -> in_review
begin
    perform public.change_task_status(v_t1, 'in_review');
    raise exception 'TEST FAILED: new -> in_review прошёл';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: new -> in_review запрещён';
end;

  -- исполнитель не может принять собственную задачу
  perform public.change_task_status(v_t1, 'in_progress');
  perform public.change_task_status(v_t1, 'in_review');
begin
    perform public.change_task_status(v_t1, 'accepted');
    raise exception 'TEST FAILED: исполнитель принял свою задачу';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: исполнитель не может принять задачу (%)', sqlerrm;
end;
  raise notice 'OK: цикл new -> in_progress -> in_review работает для исполнителя';

  -- подделка и удаление истории
begin
insert into public.task_history(task_id, changed_by, from_status, to_status) values (v_t1, v_e1, 'in_review', 'accepted');
raise exception 'TEST FAILED: вставка в историю прошла';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: подделать историю нельзя';
end;
begin
delete from public.task_history where task_id = v_t1;
raise exception 'TEST FAILED: удаление истории прошло';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: удалить историю нельзя';
end;
begin
update public.task_history set comment = 'x' where task_id = v_t1;
raise exception 'TEST FAILED: изменение истории прошло';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: изменить историю нельзя';
end;

  -- повышение себя до постановщика
begin
update public.profiles set role = 'manager' where id = v_e1;
raise exception 'TEST FAILED: исполнитель сменил свою роль';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: сменить свою роль нельзя';
end;

  -- создание объектов/задач исполнителем
begin
insert into public.objects(name, address) values ('x', 'x');
raise exception 'TEST FAILED: исполнитель создал объект';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: исполнитель не может создавать объекты';
end;
begin
insert into public.tasks(title, object_id, assignee_id) values ('x', v_obj1, v_e1);
raise exception 'TEST FAILED: исполнитель создал задачу';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: исполнитель не может создавать задачи';
end;

  -- удаление чужого/своего
delete from public.tasks where id in (v_t1, v_t2);
get diagnostics v_n = row_count;
if v_n <> 0 then raise exception 'TEST FAILED: исполнитель удалил задачи'; end if;
  raise notice 'OK: исполнитель не может удалять задачи';

  reset role;

  ------------------------------------------------------------------
  -- ПОСТАНОВЩИК
  ------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', v_mgr, 'role', 'authenticated')::text, true);
set local role authenticated;

select count(*) into v_n from public.tasks where id in (v_t1, v_t2);
if v_n <> 2 then raise exception 'TEST FAILED: постановщик видит % тестовых задач вместо 2', v_n; end if;
  raise notice 'OK: постановщик видит всё';

  -- принять нельзя из статуса, где задача не «на проверке»
begin
    perform public.change_task_status(v_t2, 'accepted');
    raise exception 'TEST FAILED: new -> accepted прошёл';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: new -> accepted запрещён';
end;

  -- постановщик не может сам взять задачу в работу
begin
    perform public.change_task_status(v_t2, 'in_progress');
    raise exception 'TEST FAILED: постановщик взял задачу в работу';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: постановщик не выполняет шаги исполнителя';
end;

  -- возврат без комментария
begin
    perform public.change_task_status(v_t1, 'needs_rework');
    raise exception 'TEST FAILED: возврат без комментария прошёл';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: возврат на доработку требует комментарий';
end;

  -- прямая вставка с чужим статусом / чужим автором
begin
insert into public.tasks(title, object_id, assignee_id, status) values ('x', v_obj1, v_e1, 'accepted');
raise exception 'TEST FAILED: задача создана со статусом accepted';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: задачу можно создать только в статусе «Новая»';
end;

  -- назначить исполнителем постановщика нельзя
begin
insert into public.tasks(title, object_id, assignee_id) values ('x', v_obj1, v_mgr);
raise exception 'TEST FAILED: исполнителем назначен постановщик';
exception when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'OK: исполнителем может быть только исполнитель';
end;

  -- корректный возврат и повторный цикл
  perform public.change_task_status(v_t1, 'needs_rework', 'Переделать фундамент');
  raise notice 'OK: возврат с комментарием';

  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', v_e1, 'role', 'authenticated')::text, true);
set local role authenticated;
perform public.change_task_status(v_t1, 'in_progress');
  perform public.change_task_status(v_t1, 'in_review');
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', v_mgr, 'role', 'authenticated')::text, true);
set local role authenticated;
perform public.change_task_status(v_t1, 'accepted');

  -- в истории: создание + 6 переходов = 7 записей
select count(*) into v_n from public.task_history where task_id = v_t1;
if v_n <> 7 then raise exception 'TEST FAILED: в истории % записей вместо 7', v_n; end if;
  raise notice 'OK: история полна (7 записей)';

  reset role;
  raise notice 'ALL TESTS PASSED';
end $$;

rollback;