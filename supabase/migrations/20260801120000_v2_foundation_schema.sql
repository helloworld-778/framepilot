-- ============================================================================
-- FramePilot v2 — Phase 1 foundation schema
-- ----------------------------------------------------------------------------
-- Creates the relational foundation for the OPTIONAL v2 cloud layer. FramePilot
-- v1 remains local-first and browser-only; no application code reads any of
-- these tables yet.
--
-- Security posture for this migration:
--   * RLS is enabled on every table created here. There is no table without it.
--   * Ownership is always `owner_id = auth.uid()`. No cross-user read path exists.
--   * Immutable history: cloud_project_versions has no UPDATE or DELETE policy.
--   * generation_runs is read-only to users; only a future trusted server
--     boundary will write audit rows.
--   * Reference data (creative_directions, prompt_policies) is world-readable but
--     only for rows with status = 'active'. Writes have no client policy at all.
--   * No service-role usage is implied or required by this migration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
-- Guarded with DO blocks so re-running the migration is safe. CREATE TYPE has no
-- IF NOT EXISTS form in PostgreSQL.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'record_status') then
    create type public.record_status as enum ('draft', 'active', 'archived');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'provenance_mode') then
    -- 'local'    — produced by the v1 deterministic engine in the browser
    -- 'ai'       — produced by a future server-side model call
    -- 'imported' — brought in from an external source
    create type public.provenance_mode as enum ('local', 'ai', 'imported');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'generation_run_status') then
    create type public.generation_run_status as enum (
      'queued', 'running', 'succeeded', 'failed', 'rejected'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'reference_asset_status') then
    create type public.reference_asset_status as enum (
      'pending', 'approved', 'rejected', 'archived'
    );
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 2. Shared updated_at trigger
-- ----------------------------------------------------------------------------
-- `search_path` is pinned to empty and the function is not SECURITY DEFINER, so
-- it cannot be hijacked by a mutable search path. Attached only to mutable
-- tables; append-only tables (cloud_project_versions, generation_runs) do not
-- get it because they have no updated_at column by design.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Maintains updated_at on mutable v2 tables. Runs with invoker rights and a pinned empty search_path.';

-- ----------------------------------------------------------------------------
-- 3. workspace_profiles — per-user reusable production context
-- ----------------------------------------------------------------------------

create table if not exists public.workspace_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  status public.record_status not null default 'active',
  version integer not null default 1,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_profiles_name_not_blank
    check (length(btrim(name)) > 0),
  constraint workspace_profiles_version_positive
    check (version > 0),
  -- A JSON scalar or array would break every consumer that expects a record.
  constraint workspace_profiles_profile_is_object
    check (jsonb_typeof(profile) = 'object')
);

comment on table public.workspace_profiles is
  'Per-user production context. No global/shared profile exists in Phase 1.';

-- One *active* profile name per owner. Archived and draft rows may reuse a name,
-- which keeps renaming and archiving from deadlocking against each other.
create unique index if not exists workspace_profiles_owner_active_name_key
  on public.workspace_profiles (owner_id, lower(btrim(name)))
  where status = 'active';

create index if not exists workspace_profiles_owner_status_idx
  on public.workspace_profiles (owner_id, status);

drop trigger if exists workspace_profiles_set_updated_at on public.workspace_profiles;
create trigger workspace_profiles_set_updated_at
  before update on public.workspace_profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. creative_directions — admin-managed, versioned reference data
-- ----------------------------------------------------------------------------
-- Mirrors the four canonical directions already shipped in data/directories.ts.
-- Text primary key so the ID matches the existing v1 DirectoryId union exactly.

create table if not exists public.creative_directions (
  id text primary key,
  label text not null,
  summary text not null,
  mood_words text[] not null,
  rules jsonb not null,
  version integer not null default 1,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creative_directions_id_not_blank
    check (length(btrim(id)) > 0),
  constraint creative_directions_version_positive
    check (version > 0),
  constraint creative_directions_rules_is_object
    check (jsonb_typeof(rules) = 'object'),
  constraint creative_directions_mood_words_present
    check (array_length(mood_words, 1) >= 1)
);

comment on table public.creative_directions is
  'Published creative directions. Client-readable when active; writes only from a trusted server boundary (later phase).';

create index if not exists creative_directions_status_idx
  on public.creative_directions (status);

drop trigger if exists creative_directions_set_updated_at on public.creative_directions;
create trigger creative_directions_set_updated_at
  before update on public.creative_directions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. prompt_policies — versioned generation policy, data only in Phase 1
-- ----------------------------------------------------------------------------

create table if not exists public.prompt_policies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  version integer not null,
  status public.record_status not null default 'draft',
  system_instruction text not null,
  safety_rules jsonb not null default '[]'::jsonb,
  ip_rules jsonb not null default '[]'::jsonb,
  output_requirements jsonb not null default '{}'::jsonb,
  max_reference_chunks integer not null default 0,
  effective_from timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prompt_policies_slug_not_blank
    check (length(btrim(slug)) > 0),
  constraint prompt_policies_version_positive
    check (version > 0),
  constraint prompt_policies_max_reference_chunks_non_negative
    check (max_reference_chunks >= 0),
  constraint prompt_policies_system_instruction_not_blank
    check (length(btrim(system_instruction)) > 0),
  constraint prompt_policies_safety_rules_is_array
    check (jsonb_typeof(safety_rules) = 'array'),
  constraint prompt_policies_ip_rules_is_array
    check (jsonb_typeof(ip_rules) = 'array'),
  constraint prompt_policies_output_requirements_is_object
    check (jsonb_typeof(output_requirements) = 'object')
);

comment on table public.prompt_policies is
  'Stored generation policy. Phase 1 is data only: no application code reads this yet.';

-- At most one active policy per slug, so a future resolver can never be handed
-- an ambiguous answer. Draft and archived revisions are unconstrained.
create unique index if not exists prompt_policies_one_active_per_slug_key
  on public.prompt_policies (slug)
  where status = 'active';

create index if not exists prompt_policies_slug_status_idx
  on public.prompt_policies (slug, status);

drop trigger if exists prompt_policies_set_updated_at on public.prompt_policies;
create trigger prompt_policies_set_updated_at
  before update on public.prompt_policies
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. cloud_projects + cloud_project_versions
-- ----------------------------------------------------------------------------
-- Nothing migrates browser localStorage into these tables. v1 projects stay in
-- the browser until a user explicitly opts in, in a later phase.

create table if not exists public.cloud_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  status public.record_status not null default 'active',
  -- FK added after cloud_project_versions exists; see below.
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cloud_projects_title_not_blank
    check (length(btrim(title)) > 0)
);

comment on table public.cloud_projects is
  'Optional cloud mirror of a saved project. Local-first v1 storage is unaffected.';

create index if not exists cloud_projects_owner_status_idx
  on public.cloud_projects (owner_id, status);

create index if not exists cloud_projects_owner_updated_at_idx
  on public.cloud_projects (owner_id, updated_at desc);

drop trigger if exists cloud_projects_set_updated_at on public.cloud_projects;
create trigger cloud_projects_set_updated_at
  before update on public.cloud_projects
  for each row execute function public.set_updated_at();

-- Append-only history. No updated_at column: a version row is never mutated.
create table if not exists public.cloud_project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null
    references public.cloud_projects (id) on delete cascade,
  version_number integer not null,
  provenance public.provenance_mode not null,
  brief jsonb not null,
  output jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint cloud_project_versions_number_positive
    check (version_number > 0),
  -- Structural guard only. Full DirectorOutput validation stays in application
  -- code (lib/schemas.ts) rather than being duplicated and drifting in SQL.
  constraint cloud_project_versions_brief_is_object
    check (jsonb_typeof(brief) = 'object'),
  constraint cloud_project_versions_output_is_object
    check (jsonb_typeof(output) = 'object'),
  constraint cloud_project_versions_metadata_is_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint cloud_project_versions_project_version_key
    unique (project_id, version_number),
  -- Redundant against the primary key on its own, but it is the referenceable
  -- target that lets cloud_projects prove a current version belongs to *it*.
  -- See the composite foreign key below.
  constraint cloud_project_versions_project_id_key
    unique (project_id, id)
);

comment on table public.cloud_project_versions is
  'Immutable project history. Append-only: no UPDATE or DELETE policy is granted to authenticated users.';

create index if not exists cloud_project_versions_project_number_idx
  on public.cloud_project_versions (project_id, version_number desc);

-- Now that the target table exists, point cloud_projects at its current version.
--
-- This is a COMPOSITE foreign key on (id, current_version_id) rather than a
-- plain one on (current_version_id). That is the whole integrity guarantee: a
-- single-column key could only prove "this version exists somewhere", which
-- allowed a project to point at another project's version. Referencing
-- (project_id, id) forces the referenced version's project_id to equal this
-- project's own id, so a cross-project pointer is rejected by the database.
--
-- Why this is safe for a nullable pointer: the default MATCH SIMPLE semantics
-- skip the check entirely when any referencing column is null. `id` is the
-- primary key and never null, so the constraint is inert exactly while
-- current_version_id is null, and fully enforced as soon as it is set.
--
-- ON DELETE SET NULL (current_version_id) names a SUBSET of the key columns, so
-- deleting a version clears only the pointer and leaves `id` intact. Without the
-- column list, PostgreSQL would try to null the primary key too and the delete
-- would fail. The column-list form requires PostgreSQL 15+; supabase/config.toml
-- pins major_version 17.
do $$
begin
  -- Supersedes the earlier single-column key, which permitted a same-owner
  -- cross-project pointer. Dropped first so a database created from a previous
  -- draft of this migration converges on the stronger constraint.
  if exists (
    select 1 from pg_constraint
    where conname = 'cloud_projects_current_version_id_fkey'
      and conrelid = 'public.cloud_projects'::regclass
  ) then
    alter table public.cloud_projects
      drop constraint cloud_projects_current_version_id_fkey;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'cloud_projects_current_version_same_project_fkey'
      and conrelid = 'public.cloud_projects'::regclass
  ) then
    alter table public.cloud_projects
      add constraint cloud_projects_current_version_same_project_fkey
      foreign key (id, current_version_id)
      references public.cloud_project_versions (project_id, id)
      on delete set null (current_version_id);
  end if;
end
$$;

comment on constraint cloud_projects_current_version_same_project_fkey
  on public.cloud_projects is
  'Guarantees current_version_id, when set, identifies a version of this same project. Composite key against (project_id, id); MATCH SIMPLE leaves it inert while the pointer is null.';

-- Supports the reverse lookup the constraint performs when a version is deleted.
create index if not exists cloud_projects_current_version_idx
  on public.cloud_projects (current_version_id);

-- ----------------------------------------------------------------------------
-- 7. generation_runs — provenance and audit
-- ----------------------------------------------------------------------------
-- owner_id is ON DELETE SET NULL, not CASCADE: an audit trail should survive
-- account deletion in anonymised form. No raw prompts, API keys, or unbounded
-- request/response bodies are stored — only hashes and a safe error message.

create table if not exists public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  cloud_project_id uuid references public.cloud_projects (id) on delete set null,
  mode public.provenance_mode not null,
  status public.generation_run_status not null default 'queued',
  model_id text,
  policy_slug text,
  policy_version integer,
  direction_id text references public.creative_directions (id),
  direction_version integer,
  workspace_profile_id uuid
    references public.workspace_profiles (id) on delete set null,
  reference_asset_ids uuid[] not null default '{}'::uuid[],
  input_hash text,
  output_hash text,
  latency_ms integer,
  error_code text,
  safe_error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint generation_runs_latency_non_negative
    check (latency_ms is null or latency_ms >= 0),
  constraint generation_runs_policy_version_positive
    check (policy_version is null or policy_version > 0),
  constraint generation_runs_direction_version_positive
    check (direction_version is null or direction_version > 0),
  constraint generation_runs_completed_after_created
    check (completed_at is null or completed_at >= created_at)
);

comment on table public.generation_runs is
  'Audit/provenance for direction generation. Read-only to users; written by a future trusted server boundary. Never stores secrets or raw request logs.';

create index if not exists generation_runs_owner_created_at_idx
  on public.generation_runs (owner_id, created_at desc);

create index if not exists generation_runs_project_idx
  on public.generation_runs (cloud_project_id);

create index if not exists generation_runs_status_idx
  on public.generation_runs (status);

-- ----------------------------------------------------------------------------
-- 8. reference_assets — metadata only
-- ----------------------------------------------------------------------------
-- No Storage bucket, upload path, extraction pipeline, or embeddings table is
-- created in Phase 1. storage_path is an unenforced metadata string for now.

create table if not exists public.reference_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  workspace_profile_id uuid
    references public.workspace_profiles (id) on delete set null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null,
  status public.reference_asset_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reference_assets_storage_path_not_blank
    check (length(btrim(storage_path)) > 0),
  constraint reference_assets_file_name_not_blank
    check (length(btrim(file_name)) > 0),
  constraint reference_assets_mime_type_not_blank
    check (length(btrim(mime_type)) > 0),
  constraint reference_assets_byte_size_positive
    check (byte_size > 0),
  constraint reference_assets_metadata_is_object
    check (jsonb_typeof(metadata) = 'object')
);

comment on table public.reference_assets is
  'Curated reference metadata only. Phase 1 creates no bucket, upload, extraction, or retrieval path.';

create index if not exists reference_assets_owner_status_idx
  on public.reference_assets (owner_id, status);

create index if not exists reference_assets_profile_idx
  on public.reference_assets (workspace_profile_id);

drop trigger if exists reference_assets_set_updated_at on public.reference_assets;
create trigger reference_assets_set_updated_at
  before update on public.reference_assets
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 9. Row Level Security
-- ============================================================================
-- Every table below gets `enable row level security`. Policies are additive in
-- PostgreSQL, so an operation with no policy is denied — that is how the
-- append-only and read-only guarantees are enforced.

alter table public.workspace_profiles      enable row level security;
alter table public.creative_directions     enable row level security;
alter table public.prompt_policies         enable row level security;
alter table public.cloud_projects          enable row level security;
alter table public.cloud_project_versions  enable row level security;
alter table public.generation_runs         enable row level security;
alter table public.reference_assets        enable row level security;

-- ---- workspace_profiles: full ownership ------------------------------------

drop policy if exists workspace_profiles_select_own on public.workspace_profiles;
create policy workspace_profiles_select_own
  on public.workspace_profiles for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists workspace_profiles_insert_own on public.workspace_profiles;
create policy workspace_profiles_insert_own
  on public.workspace_profiles for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists workspace_profiles_update_own on public.workspace_profiles;
create policy workspace_profiles_update_own
  on public.workspace_profiles for update
  to authenticated
  using (owner_id = (select auth.uid()))
  -- WITH CHECK repeats the predicate so a row cannot be reassigned to another user.
  with check (owner_id = (select auth.uid()));

drop policy if exists workspace_profiles_delete_own on public.workspace_profiles;
create policy workspace_profiles_delete_own
  on public.workspace_profiles for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- ---- cloud_projects: full ownership ----------------------------------------

drop policy if exists cloud_projects_select_own on public.cloud_projects;
create policy cloud_projects_select_own
  on public.cloud_projects for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists cloud_projects_insert_own on public.cloud_projects;
create policy cloud_projects_insert_own
  on public.cloud_projects for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists cloud_projects_update_own on public.cloud_projects;
create policy cloud_projects_update_own
  on public.cloud_projects for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists cloud_projects_delete_own on public.cloud_projects;
create policy cloud_projects_delete_own
  on public.cloud_projects for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- ---- reference_assets: full ownership --------------------------------------

drop policy if exists reference_assets_select_own on public.reference_assets;
create policy reference_assets_select_own
  on public.reference_assets for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists reference_assets_insert_own on public.reference_assets;
create policy reference_assets_insert_own
  on public.reference_assets for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists reference_assets_update_own on public.reference_assets;
create policy reference_assets_update_own
  on public.reference_assets for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists reference_assets_delete_own on public.reference_assets;
create policy reference_assets_delete_own
  on public.reference_assets for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- ---- cloud_project_versions: read/append via parent ownership --------------
-- Ownership is proven through the parent project, so a user can never read or
-- append history for someone else's project.
-- Intentionally absent: UPDATE and DELETE. Versions are immutable.

drop policy if exists cloud_project_versions_select_own_project
  on public.cloud_project_versions;
create policy cloud_project_versions_select_own_project
  on public.cloud_project_versions for select
  to authenticated
  using (
    exists (
      select 1
      from public.cloud_projects p
      where p.id = cloud_project_versions.project_id
        and p.owner_id = (select auth.uid())
    )
  );

drop policy if exists cloud_project_versions_insert_own_project
  on public.cloud_project_versions;
create policy cloud_project_versions_insert_own_project
  on public.cloud_project_versions for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.cloud_projects p
      where p.id = cloud_project_versions.project_id
        and p.owner_id = (select auth.uid())
    )
  );

-- ---- generation_runs: read-only to users -----------------------------------
-- Intentionally absent: INSERT, UPDATE, DELETE. Audit rows must be written by a
-- future trusted server boundary, never by a client, so provenance cannot be
-- forged by the account it describes.

drop policy if exists generation_runs_select_own on public.generation_runs;
create policy generation_runs_select_own
  on public.generation_runs for select
  to authenticated
  using (owner_id = (select auth.uid()));

-- ---- creative_directions: published reads only -----------------------------
-- The single narrowly-scoped broad read in this migration. It is restricted to
-- status = 'active' rather than `USING (true)`: draft and archived revisions stay
-- invisible. This is published, non-personal reference data.
-- Intentionally absent: INSERT, UPDATE, DELETE for anon and authenticated.
-- Admin writes will arrive from a secure server boundary in a later phase.

drop policy if exists creative_directions_select_active on public.creative_directions;
create policy creative_directions_select_active
  on public.creative_directions for select
  to anon, authenticated
  using (status = 'active');

-- ---- prompt_policies: published reads only ---------------------------------
-- Same reasoning. No client write policy exists in any role.

drop policy if exists prompt_policies_select_active on public.prompt_policies;
create policy prompt_policies_select_active
  on public.prompt_policies for select
  to anon, authenticated
  using (status = 'active');
