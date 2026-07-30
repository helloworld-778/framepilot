# FramePilot — Implementation Plan (v1, mock-first)

> AI creative-director workspace. Turns a rough video idea into a cinematic,
> generator-ready production plan. Not a video model — a pre-production and
> prompt-intelligence layer.

**Status:** planning, awaiting approval. No application code written yet.

## Environment & pinned versions

Workspace: `C:\Users\Hidanshu\OneDrive\Desktop\FramePilot` (empty)
Toolchain: Node 24.15.0, npm 11.12.1

| Package | Version |
| --- | --- |
| next | 16.2.12 |
| react / react-dom | 19.2.8 |
| tailwindcss | 4.3.3 |
| shadcn (CLI) | 4.16.0 |
| framer-motion | 12.43.0 |
| zod | 4.4.3 |
| react-hook-form | 7.83.0 |
| @hookform/resolvers | 5.5.7 |
| lucide-react | 1.28.0 |
| vitest | 4.1.10 |
| @testing-library/react | 16.3.2 |

Two consequences of these versions:

- **Tailwind 4 is CSS-first.** There is no `tailwind.config.js`; design tokens
  live in an `@theme` block inside `app/globals.css`.
- **Zod 4 requires `@hookform/resolvers` v5+.** Pinned accordingly.

---

## 1. Implementation plan

### Architecture stance

One pure functional core, thin UI shell.

`generateDirection(brief) → DirectorOutput` is a **pure, deterministic,
side-effect-free** function in `lib/director/`. It never touches `window`,
`Date.now()`, or `Math.random()`. Everything creative comes from curated
directory data plus a seeded PRNG. That single boundary is what Phase 11 swaps
for a server route later — same signature, same return contract, so the UI and
tests do not change.

Three layers:

- **Data layer** (`data/`) — the four creative directories as structured,
  original filmmaking rulesets. This is where the product's taste lives. Not
  prose blobs: each directory carries camera grammar, lighting rules, palette,
  sound signature, transition vocabulary, negative emphasis, and shot
  archetypes with duration weights.
- **Logic layer** (`lib/`) — seed hashing, PRNG, brief-signal extraction,
  duration allocation, prompt composition, quality scoring, storage.
- **UI layer** (`app/`, `components/`) — server components for the static
  shell, client components only where interactivity is needed (form,
  workspace, shot editing).

### How mock output avoids feeling like Mad Libs

The honest risk with a mock-first generator is that all four directories
produce the same sentence with swapped adjectives. Three defenses:

1. **Different shot counts and rhythms per directory.** Nonlinear Suspense at
   15s gets 4 long shots with a withheld reveal in shot 3. Premium Product Film
   at 15s gets 5 short shots with a macro beat. The *structure* differs, not
   just the wording.
2. **Directory-specific archetype sequences.**
   - Nonlinear Suspense: `withhold → fragment → reveal → hold`
   - Whimsical Fantasy: `invite → wonder → play → lift`
   - Documentary Realism: `place → person → action → context`
   - Premium Product Film: `hero → macro → gesture → context → resolve`
3. **Signal extraction from the description.** `lib/brief-signals.ts` pulls
   concrete tokens (weather, time of day, interior/exterior, motion verbs,
   subject nouns) with a small keyword lexicon and folds them into templates.
   The Jaipur monsoon café brief yields rain-on-glass, steam, warm interior
   spill — because those signals were detected, not because the template said
   "atmosphere."

### Safety posture (built in, not bolted on)

- `data/banned-references.ts` holds a lexicon of proscribed reference *kinds*:
  director/artist surname patterns, studio names, franchise names, brand names,
  plus phrases like "in the style of", "looks like", "shot like".
- A `lint-generated-text` unit test asserts that no string in any generated
  `DirectorOutput` — across all 4 directories × 3 durations × 4 purposes × the
  4 demo briefs — contains a banned token.
- The readiness rubric includes an IP-safety check that **fails** if the user's
  own brief contains a banned reference, with a suggestion that rewrites it as
  a look description.
- Every negative prompt includes `no logos, no brand marks, no recognizable
  trademarks, no celebrity likeness, no copyrighted characters, no watermark`.
- All four demo projects are written originals about generic local businesses.

---

## 2. Phased task list (dependency-ordered)

### Phase 0 — Scaffold
`create-next-app` (TS, App Router, Tailwind 4) → `shadcn init` → add primitives
→ Vitest + RTL + jsdom with two projects (node for `lib`, jsdom for components)
→ `@/*` path alias → strict TS with `noUncheckedIndexedAccess` → design tokens
in `globals.css` → self-hosted fonts.
**Exit:** `build`, `test`, `lint` all green on an empty app.

### Phase 1 — Canonical contract
`types/` + `lib/schemas.ts`. Zod is the source of truth; types are inferred via
`z.infer`. Nothing else may be written until this is fixed.
**Exit:** schema unit tests pass; no UI file imports a hand-written duplicate
type.

### Phase 2 — Data layer
`data/directories.ts` (4 full rulesets), `data/banned-references.ts`,
`data/demo-projects.ts` (4 demo briefs), `data/negative-prompt-base.ts`.
**Exit:** directory data validated by Zod at test time; banned-lexicon test
passes over the directory copy itself.

### Phase 3 — Deterministic engine (the heart)
`lib/seed.ts`, `lib/prng.ts`, `lib/brief-signals.ts`, `lib/duration-plan.ts`,
`lib/prompt-composer.ts`, `lib/mock-director.ts`, `lib/director/index.ts`
facade.
**Exit:** determinism, differentiation, duration-sum, and banned-term tests all
pass. The engine works with zero UI.

### Phase 4 — Quality engine
`lib/quality-check.ts` implementing the rubric.
**Exit:** table-driven rubric tests pass; score is always an integer 0–100.

### Phase 5 — Storage
`lib/storage.ts` — versioned, Zod-validated, SSR-safe, quota-safe.
**Exit:** storage tests including corrupt-data recovery and cap enforcement.

### Phase 6 — Shared UI + landing
`components/shared/` primitives, then `components/landing/`, then
`app/page.tsx`.
**Exit:** landing renders at 375/768/1440, keyboard-navigable, accessibility
clean by inspection.

### Phase 7 — Scene Brief form
`components/scene-form/`, `app/create/page.tsx`. RHF + zodResolver, inline
errors, demo-brief prefill chips.
**Exit:** invalid submit blocked with field-level messages; valid submit writes
the draft and routes to `/workspace`.

### Phase 8 — Results Workspace
`components/workspace/` — timeline, shot cards, edit mode, prompt panels,
readiness panel, action bar.
**Exit:** full flow from `/create` to editable results; all five action buttons
functional.

### Phase 9 — Projects & persistence
`app/projects/page.tsx`, `app/projects/[id]/page.tsx`, save/rename/delete,
Reset Demo.
**Exit:** survives reload by hand plus unit tests.

### Phase 10 — Polish & harden
Reduced-motion audit, focus-visible audit, contrast audit, empty and error
states, `not-found`, metadata, README.
**Exit:** all Phase 1 acceptance criteria (§10) met.

### Phase 11 — Deferred, not in v1
`app/api/direct/route.ts` server-side LLM behind the same facade,
feature-flagged, with mock fallback. Listed only to prove the seam exists.

---

## 3. Route map

| Route | Type | Purpose |
| --- | --- | --- |
| `/` | server | Landing: positioning, four directory cards, demo-case strip, CTA |
| `/create` | client | Scene Brief form; accepts `?demo=<slug>` to prefill |
| `/workspace` | client | Results workspace for the current draft; redirects to `/create` if no draft |
| `/projects` | client | Saved project list (title, directory, duration, score, date) |
| `/projects/[id]` | client | Same workspace bound to a saved project; edits update that project |
| `/directories` | server | Reference page explaining the four rulesets |
| `not-found` | server | 404 |

No API routes in v1.

---

## 4. Data schemas and example mock data

### Enums and unions

```ts
// types/index.ts — all inferred from lib/schemas.ts
export type DirectoryId =
  | 'nonlinear-suspense' | 'whimsical-fantasy'
  | 'documentary-realism' | 'premium-product-film';

export type ScenePurpose = 'promotion' | 'invitation' | 'awareness' | 'short-story';
export type SceneDuration = 8 | 15 | 30;
export type AspectRatio = '9:16' | '16:9' | '1:1';
export type ShotRole =
  | 'establish' | 'withhold' | 'reveal' | 'develop' | 'detail' | 'resolve';
export type CheckStatus = 'pass' | 'warn' | 'fail';
```

### SceneBrief — user input

```ts
interface SceneBrief {
  description: string;        // required, 24–600 chars
  directoryId: DirectoryId;   // required
  purpose: ScenePurpose;      // required, default 'promotion'
  duration: SceneDuration;    // required, default 15
  aspectRatio: AspectRatio;   // required, default '9:16'
  primarySubject: string;     // optional, ≤ 80
  targetAudience: string;     // optional, ≤ 80
  onScreenText: string;       // optional, ≤ 60
}
```

### CreativeDirectory — curated, not generated

```ts
interface CreativeDirectory {
  id: DirectoryId;
  name: string;
  tagline: string;
  summary: string;
  principles: string[];                        // 4–6 original practical rules
  palette: { label: string; hex: string }[];   // 4 swatches, CSS-rendered
  cameraGrammar: string[];
  lightingRules: string[];
  compositionRules: string[];
  soundSignature: string[];
  transitionVocabulary: string[];
  negativeEmphasis: string[];                  // folded into negative prompt
  pacing: 'deliberate' | 'flowing' | 'observational' | 'precise';
  shotPlan: Record<SceneDuration, ShotArchetype[]>;  // 3 / 4 / 5 shots
  accentClass: string;                         // per-directory accent token
}

interface ShotArchetype {
  role: ShotRole;
  weight: number;              // duration share, normalized at runtime
  shotTypes: string[];         // PRNG picks one
  cameraMoves: string[];
  lightingNotes: string[];
  compositionNotes: string[];
  soundNotes: string[];
  transitions: string[];
  visualTemplates: string[];   // slots: {subject} {setting} {texture} {action} {text}
  titleTemplates: string[];
}
```

### StoryboardShot

```ts
interface StoryboardShot {
  id: string;               // stable: `${seed}-s${order}`
  order: number;            // 1-based
  role: ShotRole;
  title: string;
  durationSeconds: number;  // integer ≥ 2
  shotType: string;
  visualDirection: string;
  camera: string;
  lighting: string;
  composition: string;
  sound: string;
  transition: string;
  edited: boolean;          // true after a local user edit
}
```

### ReadinessCheck

```ts
interface ReadinessCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;        // what was observed
  suggestion?: string;   // only when warn/fail
  weight: number;        // sums to 100 across checks
}
```

### DirectorOutput

```ts
interface DirectorOutput {
  schemaVersion: 1;
  projectTitle: string;
  logline: string;
  directoryId: DirectoryId;
  brief: SceneBrief;
  creativeRationale: string;        // 2–3 sentences, directory-specific
  shots: StoryboardShot[];          // 3–5, durations sum === brief.duration
  masterPrompt: string;
  negativePrompt: string;
  readinessScore: number;           // integer 0–100
  readinessChecks: ReadinessCheck[];
  suggestions: string[];            // derived from warn/fail checks
  meta: {
    generator: 'mock' | 'llm';
    generatorVersion: string;       // 'mock-1.0.0'
    seed: string;                   // hex
    totalDurationSeconds: number;
    createdAt: string;              // ISO, injected — not read from a clock inside the engine
  };
}
```

### SavedProject

```ts
interface SavedProject {
  id: string;            // `${seed}-${counter}`
  title: string;
  createdAt: string;
  updatedAt: string;
  brief: SceneBrief;
  output: DirectorOutput;
}
```

### Example directory data (abridged, original)

```ts
{
  id: 'nonlinear-suspense',
  name: 'Nonlinear Suspense',
  tagline: 'Tell it out of order. Show less than you know.',
  principles: [
    'Withhold the subject for at least one full shot.',
    'Let negative space carry more frame area than the subject.',
    'Light from one direction only; let the unlit side stay unlit.',
    'Move the camera slower than the viewer expects.',
  ],
  palette: [
    { label: 'Slate deep',  hex: '#0E1116' },
    { label: 'Cold steel',  hex: '#3A4552' },
    { label: 'Pale signal', hex: '#9FB3C8' },
    { label: 'Held warmth', hex: '#C9A277' },
  ],
  pacing: 'deliberate',
  // …cameraGrammar, lightingRules, soundSignature, shotPlan
}
```

### Example generated output (demo brief 1, illustrative shape)

Brief: *"A small Jaipur café during the first monsoon shower. Rain on the
window, steam rising from a fresh cup, a monsoon coffee offer."*
Premium Product Film · promotion · 15s · 9:16 · subject "hand-brewed monsoon
coffee" · audience "Jaipur students and young professionals"

```
projectTitle: "Monsoon Pour — Premium Product Film"
logline:      "Rain outside, heat in the cup: a 15-second product film built
               around one honest pour."
shots (5):    4s hero → 3s macro → 3s gesture → 3s context → 2s resolve
score:        88 — Ready to generate
```

Shot 2 sample:

```
title:       "Macro — Crema Bloom"
duration:    3s
shotType:    "Extreme close-up, 100mm macro equivalent"
visual:      "Crema blooms across the surface of the cup; a single controlled
              highlight tracks the ripple. Rain-lit window reads as a soft
              rectangle behind, defocused to shape only."
camera:      "Locked tripod, 6% slow push, no handheld drift"
lighting:    "Single large soft source at 45° camera-left, black card
              camera-right to protect the rim highlight"
composition: "Cup rim on the lower third, negative space above reserved for
              on-screen text"
sound:       "Close pour detail, rain bed at low level, no music sting"
transition:  "Match cut on the highlight into the next shot"
```

Master prompt shape (single copyable block):

```
SUBJECT: … | SETTING: … | SEQUENCE: 5 shots — … | CAMERA: … |
LIGHTING: … | PALETTE: … | TEXTURE: … | SOUND: … |
FORMAT: 9:16, 15s, 24fps feel | RULES: …
```

Negative prompt shape:

```
no logos, no brand marks, no recognizable trademarks, no celebrity likeness,
no copyrighted characters, no watermark, no text artifacts, no distorted hands,
no oversaturated HDR, no lens flare spam, no fake bokeh halos,
no cluttered background, no plastic skin, no warped product geometry, …
```

---

## 5. Component tree

```
app/layout.tsx
├─ app/page.tsx                          (server)
│  └─ components/landing/
│     ├─ hero-section.tsx                (CSS-only cinematic backdrop)
│     ├─ how-it-works.tsx
│     ├─ directory-grid.tsx
│     │  └─ directory-card.tsx           (palette swatches, principles)
│     ├─ demo-cases-strip.tsx            (4 briefs → /create?demo=slug)
│     └─ landing-cta.tsx
│
├─ app/create/page.tsx                   (client)
│  └─ components/scene-form/
│     ├─ scene-brief-form.tsx            (RHF + zodResolver, orchestrator)
│     ├─ description-field.tsx           (textarea + live char/word counter)
│     ├─ directory-select-field.tsx      (radio-group cards, not a dropdown)
│     ├─ purpose-field.tsx
│     ├─ duration-field.tsx              (segmented 8/15/30)
│     ├─ aspect-ratio-field.tsx          (visual frame previews)
│     ├─ optional-details-fields.tsx     (subject / audience / on-screen text)
│     ├─ demo-prefill-chips.tsx
│     └─ form-summary-rail.tsx           (sticky live brief recap, desktop)
│
├─ app/workspace/page.tsx                (client)
│  └─ components/workspace/
│     ├─ results-workspace.tsx           (owns output state + edit reducer)
│     ├─ workspace-header.tsx            (title, directory badge, meta)
│     ├─ rationale-panel.tsx
│     ├─ storyboard-timeline.tsx         ★ primary visual
│     │  └─ timeline-segment.tsx         (width ∝ duration, keyboard nav)
│     ├─ shot-card-list.tsx
│     │  └─ shot-card.tsx
│     │     ├─ shot-card-view.tsx
│     │     └─ shot-card-edit-form.tsx   (local RHF, save / cancel / revert)
│     ├─ prompt-panel.tsx                (master + negative, copy each)
│     ├─ readiness-panel.tsx
│     │  ├─ readiness-score-dial.tsx     (CSS conic-gradient, no chart lib)
│     │  └─ readiness-check-row.tsx
│     ├─ suggestions-panel.tsx
│     └─ workspace-action-bar.tsx        (Copy ×2, Download JSON, Save, Reset)
│
├─ app/projects/page.tsx + [id]/page.tsx
│  └─ components/projects/
│     ├─ project-list.tsx
│     ├─ project-card.tsx
│     └─ projects-empty-state.tsx
│
└─ components/shared/
   ├─ copy-button.tsx        (clipboard + confirm state + fallback)
   ├─ section-heading.tsx
   ├─ label-value.tsx
   ├─ status-pill.tsx
   ├─ palette-strip.tsx
   ├─ motion-provider.tsx    (MotionConfig reducedMotion="user")
   ├─ page-shell.tsx
   ├─ site-header.tsx / site-footer.tsx
   └─ confirm-dialog.tsx     (Reset Demo, Delete project)
```

`results-workspace.tsx` is the only stateful owner: a `useReducer` over
`DirectorOutput` handling `EDIT_SHOT`, `REVERT_SHOT`, `REGENERATE`, `RESET`.
Shot editing recomputes readiness immediately, so the score reacts to user
edits — that is what makes it feel like a workspace rather than a report.

---

## 6. localStorage data model

```
framepilot:schema-version   "1"
framepilot:draft:v1         { schemaVersion: 1, brief, output, updatedAt }
framepilot:projects:v1      { schemaVersion: 1, projects: SavedProject[] }
framepilot:prefs:v1         { lastDirectoryId, lastAspectRatio, lastDuration }
```

Rules enforced in `lib/storage.ts`:

- Single namespace prefix, version in the key **and** in the payload.
- Every read goes through Zod `safeParse`. Invalid or corrupt payload → the key
  is quarantined to `framepilot:corrupt:<key>:<ts>`, a fresh default is
  returned, and the UI shows a non-blocking notice. No crash, no silent data
  mutation.
- `typeof window === 'undefined'` guard on every accessor so nothing breaks
  during prerender.
- Project cap 25, FIFO eviction of the oldest by `updatedAt`, warned in the UI
  at 20.
- `setItem` wrapped in try/catch for `QuotaExceededError` → user-facing toast
  suggesting deletion.
- Reset Demo clears `draft` and `projects` only after explicit dialog
  confirmation, then reseeds the four demo projects.

---

## 7. Deterministic mock-generation approach

```
brief
 └─ canonicalize()      trim, collapse whitespace, lowercase description,
                        sort keys → stable JSON string
 └─ fnv1a32()           → seed (hex)
 └─ mulberry32(seed)    → rng
 └─ extractSignals()    subject, setting, timeOfDay, weather, textures[],
                        actions[], interiority, socialPurpose
 └─ selectShotPlan()    directory.shotPlan[brief.duration]  (3 | 4 | 5)
 └─ allocateDurations() weights → largest-remainder → min 2s → drift fix
 └─ composeShots()      rng.pick over archetype banks + signal slotting
 └─ composeRationale()  directory principles × purpose × signals
 └─ composePrompts()    master (structured) + negative (base ∪ directory ∪ purpose)
 └─ runQualityCheck()   → score, checks, suggestions
 └─ DirectorOutput
```

Guarantees, each backed by a test:

- **Deterministic.** Same brief → byte-identical output (excluding the injected
  `createdAt`). Verified by `toEqual` on two independent calls and by a
  committed snapshot per demo brief.
- **Differentiated.** Same brief across the four directories → different shot
  counts or rhythms, and a Jaccard similarity of the joined text below a
  threshold.
- **Duration-exact.** `sum(shots.duration) === brief.duration` for all 4 × 3
  combinations, every shot ≥ 2s.
- **Pure.** No `Math.random`, no `Date`, no `window` inside `lib/director/`.
  Enforced by an ESLint `no-restricted-globals` rule scoped to that folder plus
  a test asserting stability under a frozen clock.

Largest-remainder allocation, concretely: weights
`[0.30, 0.22, 0.20, 0.16, 0.12]` × 15s → `[4.5, 3.3, 3.0, 2.4, 1.8]` → floor
`[4,3,3,2,1] = 13` → distribute the 2 remaining seconds to the largest
fractional parts → `[5,3,3,3,2]`, then apply the min-2s clamp and re-balance so
the total stays exactly 15.

---

## 8. Quality-score rubric (100 points)

| # | Check | Weight | Pass | Warn | Fail |
| --- | --- | --- | --- | --- | --- |
| 1 | Scene specificity | 20 | ≥ 18 words with a concrete noun + action verb | 10–17 words | < 10 words or abstract only |
| 2 | Subject clarity | 15 | `primarySubject` present, ≥ 2 words | present, 1 word | empty |
| 3 | Audience defined | 10 | present, ≥ 2 words | present, 1 word | empty |
| 4 | Duration ↔ shot fit | 15 | durations sum exactly and average shot length inside the directory's comfortable range | sum exact, rhythm outside range | sum mismatch |
| 5 | Format fit for purpose | 10 | aspect matches purpose heuristic (9:16 promo/invite, 16:9 story/awareness, 1:1 either) | plausible mismatch | — |
| 6 | On-screen text discipline | 10 | ≤ 8 words, or intentionally absent for short-story | > 8 words, or absent for promotion/invitation | > 14 words |
| 7 | Direction coverage | 10 | every shot has all 7 direction fields non-empty | one field thin after editing | any field emptied |
| 8 | Originality / IP safety | 10 | no banned reference tokens in brief or on-screen text | soft signal ("cinematic like…") | direct named reference |

`score = round(Σ weight × factor)` where `pass = 1`, `warn = 0.5`, `fail = 0`.

Bands:

| Score | Band |
| --- | --- |
| 85–100 | Ready to generate |
| 65–84 | Nearly ready |
| 40–64 | Needs sharpening |
| 0–39 | Rework the brief |

Every non-pass check emits one actionable, specific suggestion — no generic
"add more detail."

---

## 9. Test plan

Two Vitest projects: `unit` (node) for `lib/` and `data/`, `dom` (jsdom) for
components.

### Unit

- `schemas` — accept valid, reject each invalid field, defaults applied.
- `seed` / `prng` — hash stability across key order and whitespace; PRNG
  reproducible from a seed.
- `duration-plan` — exhaustive 4 directories × 3 durations: exact sum, count
  3–5, min 2s.
- `mock-director` — determinism; differentiation matrix; committed snapshots
  for all four demo briefs; prompts contain the aspect ratio and duration;
  negative prompt deduped and non-empty.
- `ip-safety` — sweep every string of every generated output over the full
  brief matrix against the banned lexicon.
- `quality-check` — table-driven per rubric row; bounds 0–100; integer;
  suggestion emitted on every non-pass; edited-shot degradation path.
- `storage` — round-trip, update, delete, cap eviction, corrupt-JSON
  quarantine, schema mismatch, SSR no-window, quota exceeded.

### Component (RTL + user-event)

- **Form:** required-field errors on empty submit; description min-length
  message; demo chip prefill; valid submit produces the expected brief object.
- **Shot card:** enter edit → change camera → save updates the card and marks
  it edited; cancel discards; revert restores the generated value.
- **Timeline:** segment widths proportional to duration; arrow keys move focus;
  segment activation focuses the matching card.
- **Prompt panel:** copy buttons write the exact master/negative strings
  (mocked clipboard) and announce success.
- **Readiness:** score and band render; a warn check renders its suggestion.
- **Action bar:** Download JSON builds a blob with valid parseable
  `DirectorOutput`; Save persists; Reset requires confirmation.
- **A11y:** every control has an accessible name; inputs are label-associated;
  a `prefers-reduced-motion` mock suppresses transform animations.

Not in scope for v1: end-to-end / Playwright, visual regression. Noted as
follow-ups rather than claimed as covered.

---

## 10. Phase 1 (v1 release) acceptance criteria

### Functional

1. `/` explains the product and renders all four directories with distinct
   original names, principles, and CSS palette swatches.
2. "Create a Scene" reaches `/create` with all nine fields; description and
   directory are enforced as required with visible inline errors.
3. "Direct My Scene" produces a `DirectorOutput` with no network request —
   verifiable with an empty DevTools Network tab.
4. The same brief always produces identical output; the same brief under a
   different directory produces visibly different structure and language.
5. The storyboard has 3–5 ordered shots whose durations sum **exactly** to the
   selected 8/15/30 seconds.
6. Every shot card shows duration, shot type, visual direction, camera,
   lighting, composition, sound, and transition — all non-empty.
7. Each shot has a working Edit mode; edits persist locally, mark the shot
   edited, and recompute the readiness score.
8. Master prompt and negative prompt render in full and copy exactly, with a
   confirmation state.
9. Readiness score is an integer 0–100 with itemized checks and at least one
   actionable suggestion whenever the score is below 100.
10. Copy Prompt, Copy Negative Prompt, Download JSON, Save Project, and Reset
    Demo all work; Reset Demo is confirmation-gated.
11. Saved projects survive a full page reload and reopen with brief, edits, and
    score intact.
12. All four demo briefs are one click away from a full result.

### Quality gates

13. `npm run build` clean; TypeScript strict with zero errors and zero `any` in
    `lib/`, `data/`, `types/`.
14. All Vitest suites pass; `lib/` logic covered including determinism,
    duration, rubric, IP safety, and storage recovery.
15. No LLM, image, video, or third-party API call anywhere in the codebase. No
    API route in v1.
16. No named director, artist, studio, franchise, or brand reference in code,
    data, copy, or generated output — asserted by test.
17. `generateDirection` remains pure and is the single generation entry point,
    ready for the Phase 11 swap.

### Design and accessibility

18. Usable and uncluttered at 375, 768, 1024, and 1440px.
19. Body and UI text meet WCAG AA contrast on the dark palette. Full WCAG
    conformance requires manual assistive-technology testing and expert review;
    contrast and keyboard operation will be verified, certification will not be
    claimed.
20. Every interactive element is reachable by keyboard with a visible focus
    ring; no keyboard traps.
21. `prefers-reduced-motion: reduce` disables transform/opacity animation;
    Framer Motion is limited to entrance fades, timeline focus, and edit-mode
    height.
22. Lucide is the only icon source; zero external image files and no remote
    fonts beyond the self-hosted family.

---

## 11. Files to create or modify

All files are new — the workspace is empty.

**Config (9)**
`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`,
`components.json`, `vitest.config.ts`, `vitest.setup.ts`, `eslint.config.mjs`,
`.gitignore`

**Types and schemas (3)**
`types/index.ts`, `types/director.ts`, `lib/schemas.ts`

**Data (4)**
`data/directories.ts`, `data/banned-references.ts`, `data/demo-projects.ts`,
`data/negative-prompt-base.ts`

**Lib (11)**
`lib/constants.ts`, `lib/utils.ts`, `lib/seed.ts`, `lib/prng.ts`,
`lib/brief-signals.ts`, `lib/duration-plan.ts`, `lib/prompt-composer.ts`,
`lib/mock-director.ts`, `lib/quality-check.ts`, `lib/storage.ts`,
`lib/director/index.ts`

**App (10)**
`app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/create/page.tsx`,
`app/workspace/page.tsx`, `app/projects/page.tsx`,
`app/projects/[id]/page.tsx`, `app/directories/page.tsx`,
`app/not-found.tsx`, `app/error.tsx`

**Components (~40)**
As per §5, plus shadcn/ui primitives under `components/ui/` (button, input,
textarea, label, radio-group, select, card, badge, separator, dialog, tooltip,
progress, sonner, skeleton, tabs).

**Tests (12)**
`lib/__tests__/` × 7, `components/__tests__/` × 5

**Docs (1)**
`README.md` — run, test, architecture, Phase 11 seam.

Roughly 100 files. Everything outside `components/ui/` is hand-written.

---

## Open decisions

1. **Draft handoff.** Plan: persist the draft to `localStorage` and navigate to
   `/workspace`. Alternative: encode the brief in the URL, which makes results
   shareable and reload-proof but produces long links. Leaning localStorage for
   a hackathon demo.
2. **Tailwind 4.** No `tailwind.config.js`; tokens go in `@theme` in
   `globals.css`. This is the current shadcn-supported path. Tailwind 3 is
   available instead if familiarity matters more.

## Design tokens (reference)

| Token | Value | Use |
| --- | --- | --- |
| `--color-canvas` | `#0B0B0F` | page background |
| `--color-surface` | `#12131A` | cards, panels |
| `--color-surface-raised` | `#191B24` | elevated / hover |
| `--color-ink` | `#F4F1EA` | primary warm ivory text |
| `--color-ink-muted` | `#A8A49B` | secondary text |
| `--color-accent` | `#7C6CF0` | violet primary accent |
| `--color-accent-deep` | `#5B62E8` | indigo, focus rings |
| `--color-highlight` | `#E8B562` | restrained amber, used sparingly |
| `--color-hairline` | `#262833` | 1px dividers and borders |

Visual treatment is CSS-only: layered radial gradients at very low opacity,
fine noise via SVG filter, hairline rules, and a proportional timeline. No
glassmorphism, no stock imagery, no fake dashboards.
