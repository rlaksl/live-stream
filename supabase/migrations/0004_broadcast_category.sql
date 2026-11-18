-- 방송 카테고리. 목록은 코드(src/features/broadcasts/types.ts의 CATEGORY_LABEL)와 같아야 한다.
-- 기존 방송은 '기타'(etc)가 된다.
alter table broadcasts
  add column category text not null default 'etc'
  check (category in ('game', 'music', 'talk', 'study', 'dev', 'etc'));

create index broadcasts_category_created_at on broadcasts (category, created_at desc);
