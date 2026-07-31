# FramePilot v2 — Architecture

Developer notes for the optional cloud layer. Phase 1 (this pass) is foundation
only: schema, security, contracts, and configuration. No user-visible behaviour
changed.

## 1. The v1/v2 boundary

**v1 is the product today, and it stays supported.**

| | v1 (current, deployed) | v2 (optional, in progress) |
|---|---|---|
| Direction generation | Deterministic local engine (`lib/director`) | Server-side model call, later phase |
| Persistence | `localStorage` (`lib/storage.ts`) | Postgres via Supabase |
| Account | None required | Optional sign-in, later phase |
| Network | None | Supabase, server-side model |

Local deterministic mode is not a fallback or a degraded tier. It is a supported
mode, and every v1 route works with no Supabase configuration present at all.
`isSupabaseConfigured()` returning `false` is a normal state, not an error.

Nothing in v1 imports `lib/supabase/*` or `lib/cloud/*`.

## 2. Phase 1 scope

**Built:**

- Supabase CLI scaffolding (`supabase/config.toml`) and version-controlled SQL
  migrations.
- Seven `public` tables with RLS enabled on all of them.
- Seed data: the four canonical creative directions, one active global prompt
  policy.
- Shared TypeScript contracts (`lib/cloud/types.ts`).
- Safe environment helper and client factories (`lib/supabase/*`).
- Static integrity and contract tests that need no database.

**Explicitly not built:**

- Sign-in/sign-up UI, auth flows, OAuth, magic links, session middleware.
- Cloud project UI, cloud import, or any localStorage migration.
- Gemini/LLM calls, API routes, server actions, Edge Functions.
- Storage buckets, uploads, document extraction, embeddings, RAG, semantic search.
- Any change to the deterministic engine, local storage, draft guard, routes,
  visual design, or Vercel configuration.

No Supabase project has been created or linked. No migration has been applied
anywhere. No secret exists in this repository.

## 3. Trust boundary

```
Browser                      │ Trusted server (later phase)     │ Postgres
─────────────────────────────┼──────────────────────────────────┼──────────────
NEXT_PUBLIC_SUPABASE_URL     │ (same public vars)               │ RLS policies
NEXT_PUBLIC_SUPABASE_        │ GEMINI_API_KEY        ✗ never    │ enforce
  PUBLISHABLE_KEY            │ SUPABASE_SERVICE_ROLE ✗ never    │ ownership
                             │   _KEY                  to client│
```

Three rules:

1. **The browser gets the publishable key only.** That key is designed to ship to
   clients. Row Level Security, not key secrecy, is what protects user data. This
   is why every table has RLS enabled with no gaps.
2. **The model key and service-role key never leave the server.** They are absent
   from this repository entirely, are never prefixed `NEXT_PUBLIC_`, and must not
   appear in `.env.example`. `lib/supabase/server.ts` deliberately uses the
   *publishable* key so it remains RLS-constrained; a service-role client is a
   separate, explicitly reviewed addition later.
3. **Provenance is written server-side.** `generation_runs` grants users SELECT
   only. A client cannot insert or edit the audit record describing its own run.

`lib/supabase/env.ts` reports only variable *names* when configuration is missing,
never values, so a misconfiguration cannot leak a key into a log or error surface.

## 4. Data model

```
auth.users
  ├── workspace_profiles      (owner_id, cascade)
  ├── cloud_projects          (owner_id, cascade)
  │     └── cloud_project_versions   (project_id, cascade)  ← append-only
  │           ▲
  │           └── cloud_projects (id, current_version_id)
  │                 → cloud_project_versions (project_id, id)
  │                 composite, same-project enforced, set null (pointer only)
  ├── reference_assets        (owner_id, cascade)
  └── generation_runs         (owner_id, SET NULL — audit outlives the account)

creative_directions ◄── generation_runs.direction_id
prompt_policies         (referenced by slug + version, not by FK)
```

| Table | Purpose | Mutability |
|---|---|---|
| `workspace_profiles` | Reusable per-user production context | Mutable |
| `creative_directions` | Published, versioned direction reference data | Admin-only |
| `prompt_policies` | Versioned generation policy; data only in Phase 1 | Admin-only |
| `cloud_projects` | Optional cloud mirror of a saved project | Mutable |
| `cloud_project_versions` | Immutable plan history | **Append-only** |
| `generation_runs` | Audit/provenance for each generation | **Server-write only** |
| `reference_assets` | Reference file *metadata* only | Mutable |

Notable choices:

- **`creative_directions.id` is `text`**, matching the existing `DirectoryId`
  union exactly (`nonlinear-suspense`, etc.) so v1 and v2 agree on identity.
- **`jsonb_typeof(...) = 'object'` checks** guard `profile`, `rules`, `brief`,
  `output`, `metadata`, and `output_requirements`. Structural only: full
  `DirectorOutput` validation stays in `lib/schemas.ts` rather than being
  duplicated in SQL where it would drift.
- **Partial unique indexes** enforce one active prompt policy per slug and one
  active profile name per owner, leaving draft/archived revisions unconstrained.
- **`generation_runs.owner_id` is `ON DELETE SET NULL`**, not cascade, so deleting
  an account anonymises the audit trail instead of erasing it.
- **`current_version_id` uses a composite foreign key**, not a single-column one:
  `(id, current_version_id) → cloud_project_versions (project_id, id)`. This is
  what makes a cross-project pointer impossible at the database level. See §6.
- **No raw secrets or request bodies** are stored. Runs keep hashes, a model id, a
  latency, an error code, and a user-safe message.

## 5. RLS ownership model

RLS is enabled on all seven tables. PostgreSQL policies are additive, so **an
operation with no policy is denied** — that is the mechanism behind the
append-only and read-only guarantees below.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `workspace_profiles` | own | own | own | own |
| `cloud_projects` | own | own | own | own |
| `reference_assets` | own | own | own | own |
| `cloud_project_versions` | via parent | via parent | **denied** | **denied** |
| `generation_runs` | own | **denied** | **denied** | **denied** |
| `creative_directions` | `status='active'` | **denied** | **denied** | **denied** |
| `prompt_policies` | `status='active'` | **denied** | **denied** | **denied** |

- "own" means `owner_id = (select auth.uid())`, and every INSERT/UPDATE repeats
  the predicate in `WITH CHECK` so a row cannot be created for, or reassigned to,
  another user.
- "via parent" proves ownership with an `EXISTS` subquery against
  `cloud_projects`, so history is unreachable for projects you do not own.
- `auth.uid()` is wrapped in `(select ...)` so the planner evaluates it once per
  query rather than per row.
- The only broad read is `USING (status = 'active')` on the two published
  reference tables, granted to `anon` and `authenticated`. It is scoped to active
  rows rather than `USING (true)`, so drafts and archived revisions stay private.
  No `USING (true)` policy exists anywhere.
- Admin writes to reference tables will arrive from a secure server boundary in a
  later phase. There is intentionally no client write path today.

## 6. Versioning and provenance

Plans are versioned by append, never by overwrite:

1. A new plan inserts a `cloud_project_versions` row with the next
   `version_number` (unique per project).
2. `cloud_projects.current_version_id` moves to point at it.
3. History is immutable — there is no UPDATE or DELETE policy — so an audit can
   always reconstruct what was produced and when.

### Same-project integrity of the current-version pointer

A plain `current_version_id → cloud_project_versions (id)` key would only prove
*"this version exists somewhere"*, which permits a project to point at a
different project's version. The pointer is therefore a **composite** key:

```sql
foreign key (id, current_version_id)
  references public.cloud_project_versions (project_id, id)
  on delete set null (current_version_id)
```

Three details make this work:

- `cloud_project_versions` carries an extra `unique (project_id, id)` constraint
  purely as the referenceable target. It is redundant against the primary key for
  uniqueness, but a composite FK can only reference a unique constraint or index.
- Because the referenced `project_id` is matched against the project's own `id`,
  a cross-project pointer is rejected by the database rather than by application
  code.
- `ON DELETE SET NULL (current_version_id)` names a **subset** of the key columns,
  so deleting a version clears only the pointer. Without the column list
  PostgreSQL would try to null the primary key too and the delete would fail. The
  column-list form needs PostgreSQL 15+; `supabase/config.toml` pins
  `major_version = 17`.

The constraint is inert while the pointer is null, because the default
`MATCH SIMPLE` semantics skip the check when any referencing column is null and
`id` is never null. `MATCH FULL` would have been wrong here — it would reject
every project that does not yet have a current version. This also keeps the
natural insert order working: create the project with a null pointer, insert
version 1, then set the pointer.

Every generated plan carries a `provenance` object recording `mode`
(`local` | `ai` | `imported`), the model id, and the **policy slug + version** and
**direction id + version** in force at generation time. Because policies and
directions are themselves versioned, a run stays explainable after they change.

The AI response envelope keeps provenance strictly beside the plan:

```ts
{ output: DirectorOutput, provenance: GenerationProvenance }
```

`output` is the *existing, unmodified* `directorOutputSchema`. That is deliberate:
a v2 plan drops into the current v1 workspace UI with no shape negotiation, and
`lib/cloud/types.test.ts` asserts this compatibility.

## 7. Planned sequence

| Phase | Work | Gate |
|---|---|---|
| **1 (done)** | Schema, RLS, seeds, contracts, env/client factories | No behaviour change |
| 2 | Auth: add `@supabase/ssr`, cookie sessions, sign-in UI, session refresh | v1 still works signed out |
| 3 | Cloud projects: opt-in save/load, explicit local→cloud import | Local storage stays authoritative until the user opts in |
| 4 | Workspace profiles UI | — |
| 5 | Reference assets: Storage bucket, RLS-scoped upload, curation | Metadata table already exists |
| 6 | Extraction + retrieval, raising `max_reference_chunks` above 0 | Deliberate decision, not a default |
| 7 | Gemini integration: server-only key, policy resolution, run auditing, schema validation of model output | Local deterministic mode remains the default |

Each phase must leave local deterministic mode fully working.

## 8. Applying migrations (not executed)

**None of these commands have been run.** No project exists, nothing is linked,
and no remote database has been touched. Run them only when you intend to create
real cloud infrastructure.

```bash
# 1. Install the CLI (once), e.g.
npm install -g supabase

# 2. Authenticate against your own Supabase account.
supabase login

# 3. Link this repository to a project you have created in the dashboard.
#    <project-ref> comes from the dashboard URL. The ref is recorded in
#    supabase/.temp/, which is git-ignored.
supabase link --project-ref <project-ref>

# 4. Review what would change before applying anything.
supabase db diff --linked

# 5. Apply the version-controlled migrations to the linked project.
supabase db push
```

Local-only alternative, which needs Docker and touches nothing remote:

```bash
supabase start          # boots local Postgres + auth
supabase db reset       # applies every migration, then the seeds
supabase stop
```

After linking, set the two public variables in `.env.local` (git-ignored):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never place `SUPABASE_SERVICE_ROLE_KEY` or a model API key in `.env.local` while
it is readable by client code, and never prefix either with `NEXT_PUBLIC_`.

## 9. Open items for review

- **RLS is verified statically, not executed.** `lib/cloud/migrations.test.ts`
  asserts policy declarations and the absence of forbidden ones, but no test runs
  against a real Postgres instance. Before Phase 2 ships, run
  `supabase db reset` locally and confirm cross-user isolation with two test
  users.
- **`reference_assets.storage_path` is unenforced metadata.** Once a bucket
  exists, a Storage RLS policy must independently confirm the path prefix belongs
  to `auth.uid()`; the table's unique constraint alone is not an authorisation
  check.
- ~~**`cloud_projects.current_version_id` is not constrained to the same
  project.**~~ Resolved in Phase 1A by the composite foreign key described in §6.
  Still worth exercising against a real instance as part of the `supabase db
  reset` check above: confirm that pointing a project at another project's
  version is rejected, and that deleting a referenced version nulls the pointer
  without deleting the project.
