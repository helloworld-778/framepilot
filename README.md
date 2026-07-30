# FramePilot

**AI creative direction for video.** Turn a rough video idea into a structured
cinematic storyboard, shot plan, and generator-ready prompt.

FramePilot is not a video model. It is the pre-production layer that runs
*before* a generator — and in this release it makes **no model, network, or API
calls at all**. Every plan is produced by a deterministic generator running in
your browser.

---

## The problem

Video generators do what you ask. That is the problem. Most people ask for
"a cinematic video of my café" and get something generic, because the thinking
that makes a shot work — what to withhold, where the light comes from, how long
a beat runs, what the cut does — never happened.

FramePilot does that thinking first, then hands you a prompt worth pasting.

### Who it is for

- Creators who want a shot plan instead of a vibe
- Student teams working to a deadline with no crew
- Community organisations that need a clear, respectful message
- Local businesses making their own promos

The four demo briefs are built around exactly these: a Jaipur café promoting a
monsoon coffee offer, a college cultural-fest invitation on a rainy evening, a
women-led craft collective selling direct, and a community message about
single-use plastic.

## Key features

- **Scene brief in one screen** — description, creative direction, purpose,
  runtime, aspect ratio, plus optional subject, audience, and on-screen text.
- **3–5 shot storyboard** whose durations always total exactly 8, 15, or 30
  seconds.
- **Per-shot direction**: shot type, visual direction, camera, lighting,
  composition, sound, and transition.
- **Inline shot editing** with revert-to-generated, and readiness that
  recalculates as you edit.
- **Storyboard timeline** with proportional segment widths and full keyboard
  operation.
- **Master prompt and negative prompt**, both one click to copy.
- **Production-readiness score out of 100** with eight itemised checks and
  specific, actionable suggestions.
- **Saved projects** — save, rename, reopen, and delete, all in-browser.
- **Download JSON** of the whole plan.
- **Deterministic output**: the same brief always produces the same direction.

## The four creative directions

All original. No reference to any real director, studio, franchise, or brand.

| Direction | Idea | Signature |
| --- | --- | --- |
| **Nonlinear Suspense** | Tell it out of order. Show less than you know. | Controlled reveals, negative space, single hard key, deliberate pacing |
| **Whimsical Fantasy** | Warm, lit from within, always moving forward. | Continuous glides, warm practicals, one impossible detail per frame |
| **Documentary Realism** | Real light, real hands, nothing staged. | Available light, eye-level framing, actions allowed to finish |
| **Premium Product Film** | One product, one honest highlight. | Mechanical camera moves, controlled reflections, macro material detail |

Each direction carries its own camera grammar, lighting rules, palette, sound
signature, transition vocabulary, and — crucially — its own **shot structure per
runtime**:

| Direction | 30s structure |
| --- | --- |
| Nonlinear Suspense | withhold → fragment → reveal → develop → resolve |
| Whimsical Fantasy | establish → develop → reveal → detail → resolve |
| Documentary Realism | establish → develop → detail → reveal → resolve |
| Premium Product Film | establish → detail → develop → reveal → resolve |

A test asserts those four structures stay distinct at every runtime, and that
the generated language across directions stays below a similarity threshold.
That is the difference between four real directions and one direction with four
sets of adjectives.

## Architecture

```
app/            routes (App Router, server components by default)
components/
  landing/      marketing sections
  scene-form/   the brief form
  workspace/    the results workspace (the product centrepiece)
  projects/     saved-project list, card, rename dialog
  shared/       small reusable pieces
  ui/           shadcn/ui primitives (only the nine actually used)
data/           creative directions, demo briefs, negative-prompt base, IP lexicon
lib/            schemas, engine, rubric, storage, stores
  director/     the single generation seam
types/          types inferred from the Zod schemas
```

### Routes

| Route | Purpose |
| --- | --- |
| `/` | Positioning, the four directions, demo briefs |
| `/create` | Scene Brief form (`?demo=` and `?direction=` prefill) |
| `/workspace` | The current draft, editable |
| `/projects` | Saved projects |
| `/projects/[id]` | A saved project, in the same workspace |
| `/directories` | The four rulesets in full |
| `not-found`, `error` | Dead ends with real ways out |

### One functional core

Everything creative happens in one pure function:

```ts
generateDirection(brief: SceneBrief, options?: { now?: string }): DirectorOutput
```

No `Date`, no `Math.random()`, no `window`, no network. The same brief always
produces byte-identical direction. That determinism is load-bearing, not
decorative: "revert this shot" works by regenerating the original from the brief
rather than caching a copy.

The `unit` test project runs in Node with **no DOM at all**, so the engine
cannot accidentally depend on the browser and still pass.

### Zod is the source of truth

`lib/schemas.ts` defines every domain shape; `types/index.ts` only infers from
it. The same schemas validate form input, generated output, and everything read
back out of storage. There are no hand-written duplicate domain types and no
`any` in the engine, data, or storage layers.

### How the deterministic mock-first engine works

```
brief
 └─ canonicalise()      trim, collapse whitespace, lowercase, fixed key order
 └─ fnv1a32()           → 8-character hex seed
 └─ mulberry32(seed)    → reproducible number stream, one per shot
 └─ extractSignals()    place, time of day, weather, materials, actions
 └─ shotPlan[duration]  ordered beats for this direction and runtime
 └─ allocateDurations() largest remainder + minimum-length clamp
 └─ composeShots()      seeded picks from the archetype banks, signals slotted in
 └─ composePrompts()    master prompt + negative prompt
 └─ evaluateReadiness() score, checks, suggestions
 └─ DirectorOutput
```

`lib/brief-signals.ts` pulls concrete detail out of the description with a small
keyword lexicon. That is why a monsoon café brief yields rain-marked glass and
rising steam rather than generic "atmosphere".

Shot lengths come from beat weights via largest-remainder allocation with a
minimum-length clamp, so totals hit the chosen runtime exactly — verified across
all four directions × three runtimes.

## Originality and IP safety

`data/banned-references.ts` deliberately contains **no real names**. Listing
directors, studios, or brands in order to detect them would put exactly the
content we forbid into the repository. Instead it matches the *shape* of a
borrowed-style request: "in the style of", "shot like", "same vibe as",
franchise terms, likeness terms.

- The readiness rubric **fails** a brief that points at existing work, and
  explains how to describe the look instead.
- A test sweeps every generated string across 4 directions × 3 runtimes × 4
  purposes plus the demo briefs and asserts no pattern matches.
- `negativePrompt` is exempt from that sweep, because naming exclusions like
  "no brand marks" is precisely its job.
- Every negative prompt excludes logos, brand marks, trademarks, celebrity
  likeness, and copyrighted characters.

## Data privacy

- Everything is stored in **your browser's localStorage**. Nothing is uploaded.
- **No account, no sign-in, no payments.**
- **No model call and no external API call anywhere in this release.** There are
  no API routes in the app.
- Reset Demo clears the draft and every saved project on confirmation, and
  touches nothing else.

Keys used, all namespaced and versioned:

```
framepilot:draft:v1      the current scene (brief + output)
framepilot:projects:v1   saved projects, capped at 25
framepilot:prefs:v1      last direction, runtime, aspect ratio
framepilot:schema-version
```

Every read is re-validated with Zod. Anything corrupt or from an older format is
moved aside to `framepilot:corrupt:<key>:<timestamp>` and the app carries on
with a non-blocking notice rather than crashing. Writes report quota failures
with advice to delete older projects. At the 25-project cap the oldest project
by `updatedAt` is evicted, with a warning from 20 onward. Every accessor is
guarded for server rendering, and the UI reads storage through
`useSyncExternalStore`.

## Tech stack

Next.js 16 (App Router, Turbopack, React Compiler) · React 19 · TypeScript
strict · Tailwind CSS 4 (CSS-first tokens) · shadcn/ui on Radix · Lucide React ·
Framer Motion · React Hook Form · Zod 4 · Vitest 4 · React Testing Library

## Local setup

Requires **Node.js 20.9 or newer** (Next.js 16's minimum) and npm 10+.

```bash
git clone <repository-url>
cd FramePilot
npm install      # or `npm ci` for an exact lockfile install
npm run dev      # http://localhost:3000
```

No `.env` file is needed. `.env.example` exists only to document that fact.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint, including the React Compiler rules |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm test` | Vitest, both projects, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run verify` | lint → typecheck → test → build |

## Deployment

Deploys to **Vercel** with no configuration beyond the defaults.

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Build command | `npm run build` |
| Install command | `npm install` (or `npm ci`) |
| Output directory | *(leave as the Next.js default)* |
| Node version | 20.9 or newer |
| Environment variables | **None required** |

Steps:

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, **Add New → Project** and import the repository.
3. Leave the detected Next.js preset and build command as they are.
4. Add no environment variables — this mock-first release makes no model, API,
   or database calls, so there is nothing to configure.
5. **Deploy.** Six routes prerender as static content; `/projects/[id]` is
   server-rendered on demand and is only a shell, since project ids exist solely
   in the visitor's browser.

**Storage is browser-local.** Drafts and saved projects live in the visitor's
`localStorage`, so they stay on that device and in that browser profile. Nothing
synchronises between devices or browsers, there is no server-side copy, and a
deployment carries no user data with it. Clearing site data — or using Reset
Demo — removes saved work permanently.

## Design

Dark editorial, single theme. Tokens live in `@theme` inside `app/globals.css`
(Tailwind 4 is CSS-first — there is no `tailwind.config.js`). All atmosphere is
CSS: layered low-opacity radial pools, a masked hairline weave, a filmstrip
rule. No imagery, no glassmorphism, no fake dashboards. Icons are Lucide only.

Framer Motion is limited to entrance fades and the shot-card edit transition.
`MotionConfig reducedMotion="user"` plus a CSS media query mean the OS
reduced-motion setting is honoured globally.

Accessibility work: labelled controls, visible focus rings on every interactive
element, a keyboard-operable timeline (arrows, Home, End), a skip link, semantic
headings, `aria-live` confirmation for copy, save, rename, delete, and storage
recovery, and secondary text at roughly 5.8:1 or better on its background.
Full WCAG conformance requires manual assistive-technology testing and expert
review, which has not been done — no certification is claimed.

## Known limitations

- **Browser-local only.** Projects live in one browser profile; there is no sync
  and no export beyond Download JSON.
- **25-project cap** with oldest-first eviction, to stay well inside storage
  quotas.
- **`/projects/[id]` renders on demand** rather than prerendering, since project
  ids only exist in the browser. It is a static shell with no server data.
- **Dev-toolchain advisories.** `npm audit` reports advisories that all trace to
  `brace-expansion` via `minimatch@3` inside the ESLint 9 chain. Nothing reaches
  the shipped bundle; the only offered fix is a major ESLint upgrade, so it is
  deliberately deferred.
- **Fonts are fetched at build time** by `next/font` and then self-hosted. Zero
  runtime external requests, but the build itself is not fully offline.
- **Signal extraction is lexicon-based**, so an unusual brief falls back to
  sensible generic phrasing rather than inventing detail.
- **No end-to-end or visual-regression tests.** Pixel-level review is still a
  human job.

## Future work

The generation seam exists so this stays honest about what it is today and where
it goes next. `generateDirection` is the only entry point the UI knows about, so
a server-side structured LLM route can replace it later — validating the model's
response against the same `DirectorOutput` schema, with the deterministic
generator kept as the fallback. The UI, the storage format, and the tests would
not need to change.
