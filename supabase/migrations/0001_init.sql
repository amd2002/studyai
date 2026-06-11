-- ============================================================
--  StudyAI — Schéma de base de données + Sécurité (RLS)
--  À exécuter dans Supabase : SQL Editor > coller > Run
-- ============================================================

-- Table des cours (leçons analysées, croquis d'ardoise, notes audio)
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),

  -- Lien vers l'utilisateur connecté. auth.users est géré par Supabase Auth.
  user_id     uuid not null references auth.users(id) on delete cascade,

  kind        text not null default 'lesson',     -- 'lesson' | 'slate' | 'audio'
  title       text not null,
  subject     text default 'Autre',
  summary     text default '',
  explanation text default '',

  -- Contenu riche stocké en JSONB (rapide à requêter sur Postgres)
  words       jsonb default '[]'::jsonb,
  grammar     jsonb default '[]'::jsonb,
  quiz        jsonb default '[]'::jsonb,
  plan        jsonb default '[]'::jsonb,
  tags        jsonb default '[]'::jsonb,

  media_url   text default '',                     -- URL Supabase Storage (image/audio)

  created_at  timestamptz not null default now()
);

-- Index pour lister rapidement les cours d'un utilisateur, du plus récent
create index if not exists courses_user_created_idx
  on public.courses (user_id, created_at desc);

-- ============================================================
--  Row Level Security : LA pièce maîtresse.
--  Chaque utilisateur ne peut voir/modifier QUE ses propres cours.
--  Cette règle est appliquée par la base elle-même, pas par le code.
-- ============================================================
alter table public.courses enable row level security;

-- Lecture : seulement ses propres lignes
create policy "Users read own courses"
  on public.courses for select
  using (auth.uid() = user_id);

-- Insertion : on ne peut créer que pour soi-même
create policy "Users insert own courses"
  on public.courses for insert
  with check (auth.uid() = user_id);

-- Mise à jour : seulement ses lignes
create policy "Users update own courses"
  on public.courses for update
  using (auth.uid() = user_id);

-- Suppression : seulement ses lignes
create policy "Users delete own courses"
  on public.courses for delete
  using (auth.uid() = user_id);

-- ============================================================
--  Storage : bucket pour les images de cours et notes audio
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Politique : chaque utilisateur gère ses fichiers dans son dossier
create policy "Users manage own media"
  on storage.objects for all
  using (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);
