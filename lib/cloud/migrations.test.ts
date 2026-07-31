import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CREATIVE_DIRECTORIES } from "@/data/directories";
import { directoryTheme } from "@/lib/directory-theme";
import { DIRECTORY_IDS } from "@/lib/schemas";

/**
 * Static integrity checks for the v2 migrations.
 *
 * These deliberately do NOT try to parse SQL. They assert a small set of
 * high-value structural facts that would be security or correctness regressions
 * if they silently disappeared, plus a real data comparison of the seeded
 * directions against the canonical v1 source.
 *
 * No Supabase project, Docker daemon, network, or credential is involved.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

const migrationFiles = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort();

function read(name: string): string {
  return readFileSync(join(MIGRATIONS_DIR, name), "utf8");
}

const allSql = migrationFiles.map(read).join("\n");
const schemaSql = read(
  migrationFiles.find((name) => name.includes("foundation_schema")) ?? "",
);
const seedSql = read(
  migrationFiles.find((name) => name.includes("seed_reference_data")) ?? "",
);

/**
 * Strips `--` line comments so "must not contain" assertions test the SQL that
 * actually runs, not the prose explaining it. Without this, a comment saying
 * "not SECURITY DEFINER" would fail a check for SECURITY DEFINER.
 */
function stripSqlComments(sql: string): string {
  return sql
    .split("\n")
    .map((line) => {
      const marker = line.indexOf("--");
      return marker === -1 ? line : line.slice(0, marker);
    })
    .join("\n");
}

const schemaExec = stripSqlComments(schemaSql);
const seedExec = stripSqlComments(seedSql);
const allExec = stripSqlComments(allSql);

const V2_TABLES = [
  "workspace_profiles",
  "creative_directions",
  "prompt_policies",
  "cloud_projects",
  "cloud_project_versions",
  "generation_runs",
  "reference_assets",
] as const;

const OWNED_TABLES = [
  "workspace_profiles",
  "cloud_projects",
  "reference_assets",
] as const;

describe("migration files", () => {
  it("exist and are ordered so the schema applies before the seed", () => {
    expect(migrationFiles.length).toBeGreaterThanOrEqual(2);

    const schemaIndex = migrationFiles.findIndex((n) => n.includes("foundation_schema"));
    const seedIndex = migrationFiles.findIndex((n) => n.includes("seed_reference_data"));

    expect(schemaIndex).toBeGreaterThanOrEqual(0);
    expect(seedIndex).toBeGreaterThan(schemaIndex);
  });

  it("uses the CLI's timestamp-prefixed naming convention", () => {
    for (const name of migrationFiles) {
      expect(name).toMatch(/^\d{14}_[a-z0-9_]+\.sql$/);
    }
  });
});

describe("schema coverage", () => {
  it("creates every Phase 1 table in the public schema", () => {
    for (const table of V2_TABLES) {
      expect(schemaSql).toContain(`create table if not exists public.${table}`);
    }
  });

  it("declares all four enums", () => {
    for (const type of [
      "record_status",
      "provenance_mode",
      "generation_run_status",
      "reference_asset_status",
    ]) {
      expect(schemaSql).toContain(`create type public.${type} as enum`);
    }
  });

  it("defines the shared updated_at trigger function without SECURITY DEFINER", () => {
    expect(schemaSql).toContain("create or replace function public.set_updated_at()");
    expect(schemaSql).toContain("set search_path = ''");
    expect(schemaExec.toLowerCase()).not.toContain("security definer");
  });

  it("attaches updated_at only to mutable tables", () => {
    for (const table of [
      "workspace_profiles",
      "creative_directions",
      "prompt_policies",
      "cloud_projects",
      "reference_assets",
    ]) {
      expect(schemaSql).toContain(`create trigger ${table}_set_updated_at`);
    }

    // Append-only tables must have neither the column nor the trigger.
    expect(schemaSql).not.toContain("cloud_project_versions_set_updated_at");
    expect(schemaSql).not.toContain("generation_runs_set_updated_at");
  });

  it("owns user data through auth.users with cascade or explicit null", () => {
    for (const table of OWNED_TABLES) {
      expect(schemaSql).toContain(
        `owner_id uuid not null references auth.users (id) on delete cascade`,
      );
      expect(schemaSql).toContain(`create table if not exists public.${table}`);
    }

    // The audit trail is anonymised rather than deleted.
    expect(schemaSql).toContain(
      "owner_id uuid references auth.users (id) on delete set null",
    );
  });

  it("adds the current-version foreign key after the versions table exists", () => {
    const versionsTable = schemaExec.indexOf(
      "create table if not exists public.cloud_project_versions",
    );
    const fkAdd = schemaExec.indexOf(
      "cloud_projects_current_version_same_project_fkey",
    );

    expect(versionsTable).toBeGreaterThan(-1);
    expect(fkAdd).toBeGreaterThan(versionsTable);
  });
});

/**
 * `cloud_projects.current_version_id` must never point at a version belonging to
 * a different project. These assertions pin the database-level mechanism that
 * guarantees it, so the weaker single-column key cannot silently come back.
 */
describe("current-version same-project integrity", () => {
  it("offers a referenceable (project_id, id) target on the versions table", () => {
    // A composite FK can only reference a unique constraint or unique index.
    expect(schemaExec).toContain("cloud_project_versions_project_id_key");
    expect(schemaExec).toMatch(
      /constraint cloud_project_versions_project_id_key\s+unique \(project_id, id\)/,
    );
  });

  it("enforces the same-project rule with a composite foreign key", () => {
    expect(schemaExec).toMatch(
      /foreign key \(id, current_version_id\)\s+references public\.cloud_project_versions \(project_id, id\)/,
    );
  });

  it("no longer relies on the standalone current_version_id relationship alone", () => {
    // The old key proved only "this version exists somewhere", which allowed a
    // same-owner cross-project pointer.
    expect(schemaExec).not.toMatch(
      /foreign key \(current_version_id\)\s+references public\.cloud_project_versions \(id\)/,
    );
    // And a database built from the earlier draft converges on the stronger rule.
    expect(schemaExec).toContain(
      "drop constraint cloud_projects_current_version_id_fkey",
    );
  });

  it("clears only the pointer when a version is deleted, never the project id", () => {
    // Naming a column subset is what keeps the primary key out of the SET NULL.
    expect(schemaExec).toContain("on delete set null (current_version_id)");
    expect(schemaExec).not.toMatch(/on delete set null \(\s*id\s*\)/);
    expect(schemaExec).not.toMatch(/on delete set null \(id, current_version_id\)/);
  });

  it("keeps the composite key inert while the pointer is null", () => {
    // MATCH SIMPLE is the default and skips the check when any key column is
    // null. Declaring MATCH FULL would wrongly reject every project that has no
    // current version yet, because `id` is never null.
    const constraintBlock = schemaExec.slice(
      schemaExec.indexOf("cloud_projects_current_version_same_project_fkey"),
    );
    expect(constraintBlock).not.toContain("match full");
    expect(schemaExec).toContain("current_version_id uuid");
    expect(schemaExec).not.toMatch(/current_version_id uuid not null/);
  });

  it("indexes the reverse lookup the constraint performs on version delete", () => {
    expect(schemaExec).toContain("cloud_projects_current_version_idx");
  });

  it("adds the constraint idempotently and does not fall back to a trigger", () => {
    expect(schemaExec).toContain(
      "where conname = 'cloud_projects_current_version_same_project_fkey'",
    );
    // A declarative constraint was achievable, so no rejection trigger exists.
    expect(schemaExec).not.toContain("cloud_projects_current_version_guard");
  });

  it("leaves version immutability and project ownership untouched", () => {
    // Phase 1A must not weaken anything established in Phase 1.
    expect(schemaExec).not.toContain("on public.cloud_project_versions for update");
    expect(schemaExec).not.toContain("on public.cloud_project_versions for delete");
    expect(schemaExec).toContain("unique (project_id, version_number)");
    expect(schemaExec).toMatch(
      /project_id uuid not null\s+references public\.cloud_projects \(id\) on delete cascade/,
    );
  });
});

describe("schema constraints", () => {

  it("declares the key uniqueness and value constraints", () => {
    expect(schemaSql).toContain("unique (project_id, version_number)");
    expect(schemaSql).toContain("workspace_profiles_owner_active_name_key");
    // One active policy per slug, via a partial unique index.
    expect(schemaSql).toContain("prompt_policies_one_active_per_slug_key");
    expect(schemaSql).toContain("where status = 'active'");
    expect(schemaSql).toContain("prompt_policies_max_reference_chunks_non_negative");
    expect(schemaSql).toContain("prompt_policies_version_positive");
    expect(schemaSql).toContain("reference_assets_byte_size_positive");
    expect(schemaSql).toContain("generation_runs_latency_non_negative");
    expect(schemaSql).toContain("cloud_project_versions_brief_is_object");
    expect(schemaSql).toContain("cloud_project_versions_output_is_object");
    expect(schemaSql).toContain("workspace_profiles_profile_is_object");
  });

  it("indexes the ownership lookup paths the RLS policies imply", () => {
    for (const index of [
      "workspace_profiles_owner_status_idx",
      "cloud_projects_owner_status_idx",
      "cloud_project_versions_project_number_idx",
      "generation_runs_owner_created_at_idx",
      "reference_assets_owner_status_idx",
      "creative_directions_status_idx",
      "prompt_policies_slug_status_idx",
    ]) {
      expect(schemaSql).toContain(index);
    }
  });
});

describe("row level security", () => {
  it("enables RLS on every table it creates", () => {
    for (const table of V2_TABLES) {
      expect(schemaSql).toContain(
        `alter table public.${table}`,
      );
      expect(schemaSql).toMatch(
        new RegExp(`alter table public\\.${table}\\s+enable row level security`),
      );
    }
  });

  it("scopes owned tables to auth.uid() on every operation", () => {
    for (const table of OWNED_TABLES) {
      for (const op of ["select", "insert", "update", "delete"]) {
        expect(schemaSql).toContain(`on public.${table} for ${op}`);
      }
    }
    // Inserts must pin ownership, not merely filter reads.
    expect(schemaSql).toContain("with check (owner_id = (select auth.uid()))");
  });

  it("keeps cloud_project_versions append-only", () => {
    expect(schemaSql).toContain("on public.cloud_project_versions for select");
    expect(schemaSql).toContain("on public.cloud_project_versions for insert");

    // The guarantee: no UPDATE or DELETE policy exists, so both are denied.
    expect(schemaSql).not.toContain("on public.cloud_project_versions for update");
    expect(schemaSql).not.toContain("on public.cloud_project_versions for delete");
  });

  it("proves version ownership through the parent project", () => {
    expect(schemaSql).toContain("from public.cloud_projects p");
    expect(schemaSql).toContain("p.owner_id = (select auth.uid())");
  });

  it("keeps generation_runs read-only for users", () => {
    expect(schemaSql).toContain("on public.generation_runs for select");

    // Provenance must not be forgeable by the account it describes.
    expect(schemaSql).not.toContain("on public.generation_runs for insert");
    expect(schemaSql).not.toContain("on public.generation_runs for update");
    expect(schemaSql).not.toContain("on public.generation_runs for delete");
  });

  it("limits reference-data reads to active rows and grants no client writes", () => {
    for (const table of ["creative_directions", "prompt_policies"]) {
      expect(schemaSql).toContain(`on public.${table} for select`);
      expect(schemaSql).not.toContain(`on public.${table} for insert`);
      expect(schemaSql).not.toContain(`on public.${table} for update`);
      expect(schemaSql).not.toContain(`on public.${table} for delete`);
    }
    expect(schemaSql).toContain("using (status = 'active')");
  });

  it("never uses a blanket USING (true) policy", () => {
    expect(schemaExec.toLowerCase()).not.toContain("using (true)");
  });

  it("grants no policy to the anon role except published reference reads", () => {
    const anonPolicies = schemaExec
      .split("create policy")
      .filter((block) => /to\s+anon/.test(block));

    expect(anonPolicies).toHaveLength(2);
    for (const block of anonPolicies) {
      expect(block).toContain("for select");
      expect(block).toContain("status = 'active'");
    }
  });
});

describe("no secrets or out-of-scope surfaces", () => {
  it("never references a service-role key", () => {
    expect(allExec.toLowerCase()).not.toContain("service_role");
    expect(allExec.toLowerCase()).not.toContain("service-role");
  });

  it("creates no storage bucket, embedding table, or edge function", () => {
    const lower = allExec.toLowerCase();
    expect(lower).not.toContain("storage.buckets");
    expect(lower).not.toContain("create extension if not exists vector");
    expect(lower).not.toContain("embedding");
    expect(lower).not.toContain("create schema storage");
  });
});

describe("seeded reference data", () => {
  /** Pulls each `$json$…$json$` block out of the seed file, in order. */
  const jsonBlocks = [...seedSql.matchAll(/\$json\$([\s\S]*?)\$json\$/g)].map((match) =>
    JSON.parse(match[1]!),
  );

  it("seeds exactly the four canonical direction ids", () => {
    for (const id of DIRECTORY_IDS) {
      expect(seedSql).toContain(`'${id}'`);
    }
    expect(DIRECTORY_IDS).toHaveLength(4);

    // Four direction rule blocks, plus safety/ip/output blocks for the policy.
    expect(jsonBlocks).toHaveLength(7);
  });

  it("seeds each direction's label and summary verbatim from data/directories.ts", () => {
    for (const directory of CREATIVE_DIRECTORIES) {
      expect(seedSql).toContain(directory.name);
      expect(seedSql).toContain(directory.summary);
    }
  });

  it("seeds mood words verbatim from lib/directory-theme.ts", () => {
    for (const id of DIRECTORY_IDS) {
      const words = directoryTheme(id).moodWords;
      expect(seedSql).toContain(
        `array[${words.map((word) => `'${word}'`).join(", ")}]`,
      );
    }
  });

  it("seeds rules that match the canonical direction data exactly", () => {
    // The real anti-drift guard: parsed seed JSON compared field by field with
    // the v1 source of truth.
    CREATIVE_DIRECTORIES.forEach((directory, index) => {
      const rules = jsonBlocks[index] as Record<string, unknown>;

      expect(rules.tagline).toBe(directory.tagline);
      expect(rules.pacing).toBe(directory.pacing);
      expect(rules.principles).toEqual(directory.principles);
      expect(rules.palette).toEqual(directory.palette);
      expect(rules.cameraGrammar).toEqual(directory.cameraGrammar);
      expect(rules.lightingRules).toEqual(directory.lightingRules);
      expect(rules.compositionRules).toEqual(directory.compositionRules);
      expect(rules.soundSignature).toEqual(directory.soundSignature);
      expect(rules.transitionVocabulary).toEqual(directory.transitionVocabulary);
      expect(rules.negativeEmphasis).toEqual(directory.negativeEmphasis);
      expect(rules.textureWords).toEqual(directory.textureWords);
      expect(rules.comfortableShotSeconds).toEqual(directory.comfortableShotSeconds);
    });
  });

  it("seeds directions in the same order as the canonical list", () => {
    const seededOrder = CREATIVE_DIRECTORIES.map((directory) =>
      seedSql.indexOf(`'${directory.id}',`),
    );

    for (const position of seededOrder) {
      expect(position).toBeGreaterThan(-1);
    }
    expect([...seededOrder].sort((a, b) => a - b)).toEqual(seededOrder);
  });

  it("omits generator internals so there is only one source of truth", () => {
    // Archetypes and shot plans belong to the v1 engine, not to reference data.
    expect(seedExec).not.toContain("archetypes");
    expect(seedExec).not.toContain("shotPlan");
    expect(seedExec).not.toContain("titleTemplates");
    expect(seedExec).not.toContain("rationaleTemplates");
  });

  it("seeds one active global prompt policy at version 1", () => {
    expect(seedSql).toContain("insert into public.prompt_policies");
    expect(seedSql).toContain("'framepilot-global'");
    expect(seedSql).toMatch(/'framepilot-global',\s*\n\s*1,\s*\n\s*'active'/);
  });

  it("gives the policy a zero reference-chunk budget, since retrieval does not exist", () => {
    const policyBlock = seedSql.slice(seedSql.indexOf("insert into public.prompt_policies"));
    expect(policyBlock).toMatch(/\n\s*0,\s*\n\s*now\(\)/);
  });

  it("states FramePilot's actual boundaries in the policy content", () => {
    const [safetyRules, ipRules, outputRequirements] = jsonBlocks.slice(4) as [
      string[],
      string[],
      Record<string, unknown>,
    ];

    expect(Array.isArray(safetyRules)).toBe(true);
    expect(Array.isArray(ipRules)).toBe(true);

    // Original direction only, no protected-style imitation.
    expect(ipRules.join(" ").toLowerCase()).toContain("do not imitate");
    expect(ipRules.join(" ").toLowerCase()).toContain("trademarked");
    // Structured, schema-valid pre-production output.
    expect(outputRequirements.mustMatchDirectorOutputSchema).toBe(true);
    expect(outputRequirements.schemaVersion).toBe(1);
    expect(outputRequirements.shots).toEqual({ min: 3, max: 5 });
    // No claim to generate video.
    expect(JSON.stringify(outputRequirements).toLowerCase()).toContain(
      "not generated video",
    );
    expect(seedSql).toContain("You do not generate, render, or produce video");
  });

  it("stays idempotent on re-run", () => {
    expect(seedSql).toContain("on conflict (id) do nothing");
    expect(seedSql).toContain("on conflict (slug) do nothing");
  });
});
