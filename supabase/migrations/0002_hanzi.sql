-- ============================================================
--  汉字圈 — caractères à lire et à écrire, révision espacée
--  S'ajoute au schéma StudyAI (0001_init.sql) sans rien casser.
-- ============================================================

-- Les cours gardent la table existante ; on ajoute les phrases et le titre en pinyin / français.
alter table public.courses
  add column if not exists title_py  text default '',
  add column if not exists title_fr  text default '',
  add column if not exists sentences jsonb default '[]'::jsonb;  -- [{zh, py, fr}]

-- Un caractère = une ligne par utilisateur, avec deux progressions séparées.
create table if not exists public.characters (
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  char           text not null check (char_length(char) = 1),
  pinyin         text not null default '',
  meaning_fr     text not null default '',
  created_at     timestamptz not null default now(),
  has_strokes    boolean not null default true,
  -- lecture
  read_level     int not null default 0,
  read_due       date,
  read_lapses    int not null default 0,
  read_last      timestamptz,
  -- écriture
  write_level    int not null default 0,
  write_due      date,
  write_lapses   int not null default 0,
  write_last     timestamptz,
  write_unlocked boolean not null default false,
  primary key (user_id, char)
);

create table if not exists public.character_courses (
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  char      text not null,
  course_id uuid not null references public.courses(id) on delete cascade,
  primary key (user_id, char, course_id),
  foreign key (user_id, char) references public.characters(user_id, char) on delete cascade
);
create index if not exists character_courses_course_idx on public.character_courses (course_id);

create table if not exists public.review_log (
  id       bigserial primary key,
  user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  char     text not null,
  track    text not null check (track in ('read','write')),
  ok       boolean not null,
  mistakes int not null default 0,
  at       timestamptz not null default now()
);
create index if not exists review_log_user_at_idx on public.review_log (user_id, at desc);

-- ---------- Row Level Security : chacun ne voit que ses données ----------
alter table public.characters        enable row level security;
alter table public.character_courses enable row level security;
alter table public.review_log        enable row level security;

drop policy if exists "own characters" on public.characters;
create policy "own characters" on public.characters for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own character_courses" on public.character_courses;
create policy "own character_courses" on public.character_courses for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own review_log" on public.review_log;
create policy "own review_log" on public.review_log for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
