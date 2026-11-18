-- 편성표: 방송 예정 시각(선택). 대기 중인 방송을 예정 시각 순으로 보여준다.
alter table broadcasts add column scheduled_at timestamptz;

create index broadcasts_scheduled_at on broadcasts (scheduled_at) where status = 'waiting';
