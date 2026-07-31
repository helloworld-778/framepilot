-- ============================================================================
-- FramePilot v2 — Phase 1 reference data seed
-- ----------------------------------------------------------------------------
-- Seeds the four canonical creative directions and the single active global
-- prompt policy.
--
-- Provenance of the direction rows: every value below is copied verbatim from
-- `data/directories.ts` (id, name -> label, summary, tagline, pacing, principles,
-- palette, cameraGrammar, lightingRules, compositionRules, soundSignature,
-- transitionVocabulary, negativeEmphasis, textureWords, comfortableShotSeconds)
-- and `lib/directory-theme.ts` (moodWords). Nothing is invented or paraphrased.
--
-- Generator-internal fields (archetypes, shotPlan, rationaleTemplates,
-- titlePatterns) are deliberately NOT seeded: they belong to the v1 deterministic
-- engine, and duplicating them here would create a second source of truth.
--
-- `lib/cloud/migrations.test.ts` parses this file and asserts the seeded JSON
-- still matches CREATIVE_DIRECTORIES, so drift fails the build rather than
-- silently shipping.
--
-- Idempotent: ON CONFLICT keeps re-runs safe without clobbering later revisions.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Creative directions
-- ----------------------------------------------------------------------------

insert into public.creative_directions
  (id, label, summary, mood_words, rules, version, status)
values
  (
    'nonlinear-suspense',
    'Nonlinear Suspense',
    'Controlled reveals and negative space. The frame withholds the subject, offers a fragment, then pays it off — lit from one direction and cut a beat later than comfortable.',
    array['cold', 'withheld', 'deliberate'],
    $json${
      "tagline": "Tell it out of order. Show less than you know.",
      "pacing": "deliberate",
      "principles": [
        "Withhold the subject for at least one full shot.",
        "Let negative space hold more of the frame than the subject does.",
        "Light from one direction only, and let the unlit side stay unlit.",
        "Move the camera slower than the viewer expects, or not at all.",
        "Cut on stillness, not on action, so the tension carries across the edit."
      ],
      "palette": [
        { "label": "Slate deep", "hex": "#0e1116" },
        { "label": "Cold steel", "hex": "#3a4552" },
        { "label": "Pale signal", "hex": "#9fb3c8" },
        { "label": "Held warmth", "hex": "#c9a277" }
      ],
      "cameraGrammar": [
        "Locked frames as the default; movement is an event",
        "Push-ins under 6% of frame width, completed slowly",
        "Lateral dollies that uncover rather than follow"
      ],
      "lightingRules": [
        "Single hard key, no fill on the shadow side",
        "Motivated practicals inside frame carry the exposure",
        "Raise the key one stop only at the moment of reveal"
      ],
      "compositionRules": [
        "Reserve one empty third for the eventual reveal",
        "Occlude the subject with a foreground layer",
        "Keep horizons low so the void reads as pressure"
      ],
      "soundSignature": [
        "Room tone as the bed, music withheld until the turn",
        "One isolated close detail per shot, dry and unprocessed",
        "A half-beat of near-silence before the reveal"
      ],
      "transitionVocabulary": [
        "Hard cut on a settled frame",
        "Cut one frame early to keep the tension unresolved",
        "Match cut between two identical compositions"
      ],
      "negativeEmphasis": [
        "no bright even lighting",
        "no fast cuts or whip pans",
        "no cheerful score",
        "no crowded backgrounds"
      ],
      "textureWords": [
        "cold glass",
        "wet concrete",
        "dust in a light beam",
        "worn metal",
        "still water"
      ],
      "comfortableShotSeconds": { "min": 3, "max": 9 }
    }$json$::jsonb,
    1,
    'active'
  ),
  (
    'whimsical-fantasy',
    'Whimsical Fantasy',
    'A warm magical palette with graceful, continuous movement. Character action stays expressive and readable, atmosphere glows softly, and every shot hands off motion to the next.',
    array['golden', 'drifting', 'alive'],
    $json${
      "tagline": "Warm, lit from within, and always moving forward.",
      "pacing": "flowing",
      "principles": [
        "Give every shot one clear, readable action — no ambiguous staging.",
        "Keep the camera moving with the subject, never against it.",
        "Light warm and from within the scene, so glow looks earned.",
        "Let one impossible detail per shot carry the magic, never three.",
        "Hand movement across the cut so the sequence feels continuous."
      ],
      "palette": [
        { "label": "Lantern amber", "hex": "#e8b562" },
        { "label": "Dusk rose", "hex": "#d98a8a" },
        { "label": "Deep violet", "hex": "#5b4b8a" },
        { "label": "Warm ivory", "hex": "#f6ecd9" }
      ],
      "cameraGrammar": [
        "Continuous glides on a gimbal, easing in and out",
        "Rising cranes that open the space as the action lands",
        "Follow moves that stay a half step behind the subject"
      ],
      "lightingRules": [
        "Warm practicals inside frame as the primary source",
        "Soft top light for atmosphere, never hard shadows on faces",
        "One glowing element per frame to lead the eye"
      ],
      "compositionRules": [
        "Keep the subject's action unobstructed and centred-left",
        "Layer foreground sparkle, mid-ground subject, soft background",
        "Leave headroom for the space to feel generous"
      ],
      "soundSignature": [
        "Light melodic motif carried on strings or bells",
        "Airy room ambience with a soft low hum underneath",
        "One bright accent sound on the magical beat"
      ],
      "transitionVocabulary": [
        "Motion-matched cut that continues the movement",
        "Soft light wipe as a glowing element crosses frame",
        "Rising cut on the upward move"
      ],
      "negativeEmphasis": [
        "no harsh contrast or hard shadows",
        "no desaturated or clinical colour",
        "no static locked-off framing",
        "no menacing tone"
      ],
      "textureWords": [
        "drifting light motes",
        "hand-thrown ceramic",
        "worn wooden beams",
        "soft woven cloth",
        "warm rain on glass"
      ],
      "comfortableShotSeconds": { "min": 2, "max": 7 }
    }$json$::jsonb,
    1,
    'active'
  ),
  (
    'documentary-realism',
    'Documentary Realism',
    'Natural or motivated light in grounded locations. The camera observes from a respectful distance, favours authentic human detail, and keeps a clear social purpose in view.',
    array['grounded', 'honest', 'unstyled'],
    $json${
      "tagline": "Real light, real hands, nothing staged that could be observed.",
      "pacing": "observational",
      "principles": [
        "Use the light that is already there; add only what the location implies.",
        "Frame people at their own eye level, never above them.",
        "Let actions finish on their own instead of cutting for pace.",
        "Show hands and work — competence is more persuasive than polish.",
        "Keep one honest imperfection in every frame."
      ],
      "palette": [
        { "label": "Daylight grey", "hex": "#b9bcbd" },
        { "label": "Terracotta", "hex": "#b0654a" },
        { "label": "Indigo cloth", "hex": "#3c4a63" },
        { "label": "Sunlit lime", "hex": "#c8cf9f" }
      ],
      "cameraGrammar": [
        "Shoulder-mounted with settled, unforced framing",
        "Static tripod frames when the subject is speaking or working",
        "Reframes that follow the action a moment late, as an observer would"
      ],
      "lightingRules": [
        "Available daylight through existing windows and doorways",
        "Motivated top-up only, matched to the room's colour",
        "Protect highlights; let shadows stay where they fall"
      ],
      "compositionRules": [
        "Eye level with the subject, headroom honest and unstyled",
        "Include enough location to explain the work",
        "Prefer real background depth over shallow separation"
      ],
      "soundSignature": [
        "Location sound as the spine — voices, tools, street",
        "No score under the first shot; let the place speak",
        "Sparse, low instrumentation only where it clarifies feeling"
      ],
      "transitionVocabulary": [
        "Straight cut on a completed action",
        "Cut on a look or a change of task",
        "Ambient cross-fade between locations"
      ],
      "negativeEmphasis": [
        "no studio lighting look",
        "no staged smiles to camera",
        "no glossy colour grade",
        "no stock-footage staging"
      ],
      "textureWords": [
        "worn workbench",
        "hand-dyed cloth",
        "chipped enamel",
        "dust on a windowsill",
        "rain-dark pavement"
      ],
      "comfortableShotSeconds": { "min": 3, "max": 10 }
    }$json$::jsonb,
    1,
    'active'
  ),
  (
    'premium-product-film',
    'Premium Product Film',
    'Clean visual hierarchy with the product at the centre. Controlled reflections, macro detail, and refined camera moves — premium in finish but attainable in feel.',
    array['clean', 'measured', 'material'],
    $json${
      "tagline": "One product, one honest highlight, nothing competing.",
      "pacing": "precise",
      "principles": [
        "One product, one highlight; kill every competing reflection.",
        "Move the camera on a mechanical path, never by hand.",
        "Reserve the top or bottom third for text before you shoot.",
        "Show the material honestly — texture sells more than shine.",
        "End on the product at rest, not on motion."
      ],
      "palette": [
        { "label": "Graphite", "hex": "#1c1d21" },
        { "label": "Warm sand", "hex": "#cdb094" },
        { "label": "Cream light", "hex": "#f2ece2" },
        { "label": "Copper edge", "hex": "#b5764a" }
      ],
      "cameraGrammar": [
        "Slider moves at constant speed, no acceleration",
        "Locked macro frames with focus pulls instead of camera moves",
        "Slow product-axis orbit, quarter turn maximum"
      ],
      "lightingRules": [
        "One large soft source as key, positioned for the material",
        "Black cards to carve reflections back out of the product",
        "A single controlled highlight defines the product edge"
      ],
      "compositionRules": [
        "Product on a third with clean negative space for text",
        "Symmetry or deliberate offset, never accidental placement",
        "Keep the background one value away from the product"
      ],
      "soundSignature": [
        "Close material foley — pour, click, fabric, glass",
        "Low sustained pad with a clean, unhurried floor",
        "One soft accent on the final product frame"
      ],
      "transitionVocabulary": [
        "Match cut on the highlight travelling across frame",
        "Cut on the focus landing",
        "Speed-matched cut between two slider moves"
      ],
      "negativeEmphasis": [
        "no visible logos or brand marks",
        "no cluttered surfaces or props competing with the product",
        "no warped product geometry",
        "no blown-out specular highlights",
        "no handheld camera shake"
      ],
      "textureWords": [
        "brushed metal",
        "condensation on glass",
        "unglazed ceramic",
        "raw linen",
        "fresh crema"
      ],
      "comfortableShotSeconds": { "min": 2, "max": 6 }
    }$json$::jsonb,
    1,
    'active'
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Global prompt policy
-- ----------------------------------------------------------------------------
-- Content mirrors the boundaries FramePilot already enforces in v1: original
-- direction only, no protected-style imitation, a structured pre-production plan,
-- an explicit disclaimer that no video is generated, and schema-valid output.
--
-- Phase 1 stores this row and nothing reads it. `max_reference_chunks` is 0
-- because reference retrieval does not exist yet; raising it is a deliberate
-- later decision, not a default.

insert into public.prompt_policies (
  slug,
  version,
  status,
  system_instruction,
  safety_rules,
  ip_rules,
  output_requirements,
  max_reference_chunks,
  effective_from
)
values (
  'framepilot-global',
  1,
  'active',
  'You are FramePilot, a pre-production direction assistant. Produce a structured, shot-by-shot pre-production plan for a short scene: shot roles, durations, camera, lighting, composition, sound, and transitions. Work only from the brief and the selected creative direction. You do not generate, render, or produce video, audio, or images; you produce a plan a human crew or a separate generation tool can act on. Write original craft guidance in your own words. Return only output that satisfies the caller-supplied schema.',
  $json$[
    "Refuse briefs that depict or sexualise minors.",
    "Refuse briefs promoting violence, self-harm, hatred, or illegal activity.",
    "Do not describe real identifiable private individuals.",
    "Keep guidance to craft: framing, exposure, movement, sound, and edit.",
    "Surface a safe, non-technical refusal message rather than partial output."
  ]$json$::jsonb,
  $json$[
    "Do not imitate or reference any named director, studio, franchise, or brand.",
    "Do not reproduce trademarked names, logos, characters, or slogans.",
    "Do not describe a look as being in the style of a protected work.",
    "Express direction as original, practical craft technique only.",
    "Keep on-screen text generic unless the brief supplies the wording."
  ]$json$::jsonb,
  $json${
    "format": "json",
    "mustMatchDirectorOutputSchema": true,
    "schemaVersion": 1,
    "shots": { "min": 3, "max": 5 },
    "shotDurationsMustSumToBriefDuration": true,
    "requiredFields": [
      "projectTitle",
      "logline",
      "directoryId",
      "creativeRationale",
      "shots",
      "masterPrompt",
      "negativePrompt",
      "readinessScore",
      "readinessChecks",
      "suggestions"
    ],
    "disclaimers": [
      "FramePilot produces a pre-production plan, not generated video."
    ]
  }$json$::jsonb,
  0,
  now()
)
on conflict (slug) do nothing;
