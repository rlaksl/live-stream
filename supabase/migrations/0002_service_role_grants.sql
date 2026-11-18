-- 새 테이블이 Data API에 자동 노출되지 않는 프로젝트를 위해, 앱 서버가 쓰는 service_role에만 권한을 준다.
-- 브라우저용 역할(anon, authenticated)에는 주지 않는다. (docs/adr/0001)

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;

-- API 서버(PostgREST)가 테이블 목록을 다시 읽게 한다
notify pgrst, 'reload schema';

-- 확인용: 5개 테이블이 보여야 한다
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'broadcasts', 'comments', 'donations', 'recordings')
order by table_name;
