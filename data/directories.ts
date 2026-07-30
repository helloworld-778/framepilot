import type { CreativeDirectory, DirectoryId } from "@/types";

/**
 * Original creative directions. Every rule here is written as practical craft
 * guidance — framing, exposure, movement, sound — and deliberately references
 * no real director, studio, franchise, or brand.
 *
 * Template slots available to `visualTemplates` and `titleTemplates`:
 *   {subject} {setting} {texture} {action} {audience} {text}
 */

const nonlinearSuspense: CreativeDirectory = {
  id: "nonlinear-suspense",
  name: "Nonlinear Suspense",
  tagline: "Tell it out of order. Show less than you know.",
  summary:
    "Controlled reveals and negative space. The frame withholds the subject, offers a fragment, then pays it off — lit from one direction and cut a beat later than comfortable.",
  pacing: "deliberate",
  principles: [
    "Withhold the subject for at least one full shot.",
    "Let negative space hold more of the frame than the subject does.",
    "Light from one direction only, and let the unlit side stay unlit.",
    "Move the camera slower than the viewer expects, or not at all.",
    "Cut on stillness, not on action, so the tension carries across the edit.",
  ],
  palette: [
    { label: "Slate deep", hex: "#0e1116" },
    { label: "Cold steel", hex: "#3a4552" },
    { label: "Pale signal", hex: "#9fb3c8" },
    { label: "Held warmth", hex: "#c9a277" },
  ],
  cameraGrammar: [
    "Locked frames as the default; movement is an event",
    "Push-ins under 6% of frame width, completed slowly",
    "Lateral dollies that uncover rather than follow",
  ],
  lightingRules: [
    "Single hard key, no fill on the shadow side",
    "Motivated practicals inside frame carry the exposure",
    "Raise the key one stop only at the moment of reveal",
  ],
  compositionRules: [
    "Reserve one empty third for the eventual reveal",
    "Occlude the subject with a foreground layer",
    "Keep horizons low so the void reads as pressure",
  ],
  soundSignature: [
    "Room tone as the bed, music withheld until the turn",
    "One isolated close detail per shot, dry and unprocessed",
    "A half-beat of near-silence before the reveal",
  ],
  transitionVocabulary: [
    "Hard cut on a settled frame",
    "Cut one frame early to keep the tension unresolved",
    "Match cut between two identical compositions",
  ],
  negativeEmphasis: [
    "no bright even lighting",
    "no fast cuts or whip pans",
    "no cheerful score",
    "no crowded backgrounds",
  ],
  textureWords: ["cold glass", "wet concrete", "dust in a light beam", "worn metal", "still water"],
  comfortableShotSeconds: { min: 3, max: 9 },
  rationaleTemplates: [
    "This cut opens on {setting} with {subject} deliberately out of frame, so the first thing the audience does is look for something. A single hard key and a held frame keep the pressure on until the reveal lands in the third beat.",
    "The order is the idea: fragment first, explanation later. {setting} is lit from one side and left mostly unresolved, so when {subject} finally reads in full, the earlier shot re-reads with it.",
  ],
  titlePatterns: ["{subject} — Withheld", "Held Frame: {subject}", "Cold Open on {setting}"],
  archetypes: [
    {
      role: "withhold",
      titleTemplates: ["Withhold — {setting}", "Cold Open — Empty Frame"],
      shotTypes: [
        "Wide, subject absent, 28mm equivalent",
        "Medium-wide on empty space, 35mm equivalent",
      ],
      cameraMoves: [
        "Locked frame, no movement at all",
        "Very slow push, under 4% of frame width",
      ],
      lightingNotes: [
        "Single hard source from frame left; opposite side falls to near-black",
        "Motivated practical only — one lamp inside frame, nothing filled",
      ],
      compositionNotes: [
        "Subject withheld; leave the strongest third of the frame empty",
        "Low horizon, negative space carrying two thirds of the frame",
      ],
      soundNotes: [
        "Room tone only, no music",
        "Distant ambient bed with one isolated mechanical tick",
      ],
      transitions: ["Hard cut on stillness", "Cut a beat later than feels comfortable"],
      visualTemplates: [
        "{setting} before anything happens. {texture} reads in the low light. {subject} is nowhere in frame yet.",
        "An empty view of {setting}, held. Only {texture} moves. The frame refuses to show {subject}.",
        "Cool darkness across {setting}; one edge of light finds {texture}. No sign of {subject} anywhere.",
      ],
    },
    {
      role: "fragment",
      titleTemplates: ["Fragment — {texture}", "Partial View"],
      shotTypes: [
        "Tight close-up, partial subject, 85mm equivalent",
        "Insert on detail, shallow depth of field",
      ],
      cameraMoves: [
        "Handheld, braced, almost no drift",
        "Locked frame; the action crosses the frame edge",
      ],
      lightingNotes: [
        "Edge light only — read shape, not detail",
        "Key falls across one third of the subject, the rest unlit",
      ],
      compositionNotes: [
        "Crop through the subject so the whole is never available",
        "Shoot past a foreground obstruction that occludes half the subject",
      ],
      soundNotes: [
        "One close detail sound, isolated and dry",
        "Low sustained tone under a single sharp foley hit",
      ],
      transitions: ["Cut on movement inside the frame", "Straight cut, no dissolve"],
      visualTemplates: [
        "A fragment of {subject}: {action}, glimpsed past {texture}. The rest stays out of frame.",
        "Only part of {subject} is legible — {texture} and shadow carry the remainder.",
        "{action}, cropped tight. The frame offers one clue and withholds the others.",
      ],
    },
    {
      role: "reveal",
      titleTemplates: ["Reveal — {subject}", "The Turn"],
      shotTypes: [
        "Medium, subject finally legible, 50mm equivalent",
        "Wide reveal with the subject placed off-centre",
      ],
      cameraMoves: [
        "The slow push completes, then settles and holds two beats",
        "Lateral dolly that uncovers the subject from behind a foreground edge",
      ],
      lightingNotes: [
        "Key up one stop for the reveal; background stays unlit",
        "Let the practical spill reach the subject for the first time",
      ],
      compositionNotes: [
        "Place the subject in the empty third established in the opening shot",
        "Subject on the vertical third, void held behind",
      ],
      soundNotes: [
        "Music enters low on one sustained note",
        "Room tone drops for half a beat, then the close detail returns",
      ],
      transitions: ["Hold, then cut on the settle", "Cut on the last frame of the move"],
      visualTemplates: [
        "{subject} finally resolves inside {setting}. {action} — and the withheld information lands.",
        "The frame gives up {subject} at last: cool light, {texture} behind, the earlier fragment now explained.",
        "{subject} in full for the first time — {action}, unhurried, unmistakable.",
      ],
    },
    {
      role: "develop",
      titleTemplates: ["Develop — Consequence", "After the Turn"],
      shotTypes: [
        "Medium with context, subject and setting sharing the frame",
        "Over-shoulder onto the thing that now matters",
      ],
      cameraMoves: [
        "Quarter-step arc, slow and even",
        "Locked frame; the action plays out inside a still composition",
      ],
      lightingNotes: [
        "Add a low cool source behind to separate subject from background",
        "Hold the contrast; no fill from the shadow side",
      ],
      compositionNotes: [
        "Balance the subject against the space it was hiding in",
        "Sharp foreground layer, subject mid-ground, void behind",
      ],
      soundNotes: [
        "Sustained low tone beneath close detail",
        "Sparse foley, no dialogue",
      ],
      transitions: ["Cut on a completed gesture", "Cut a frame early to hold tension"],
      visualTemplates: [
        "The scene keeps running in {setting} — {action} — and the consequence of the reveal reads without explanation.",
        "{subject} and {setting} share the frame now, {texture} carrying the mood.",
        "The scene settles into its new information — {action}, held longer than expected.",
      ],
    },
    {
      role: "resolve",
      titleTemplates: ["Resolve — Back to Empty", "Last Held Frame"],
      shotTypes: [
        "Wide, matching the opening framing exactly",
        "Close on the detail that started the sequence",
      ],
      cameraMoves: [
        "Locked, identical framing to the opening shot",
        "Slow pull back, ending on stillness",
      ],
      lightingNotes: [
        "Return to the opening key, one stop lower",
        "Kill the reveal light; back to single-source dark",
      ],
      compositionNotes: [
        "Rhyme the opening frame and reserve clear space for on-screen text",
        "Subject exits; the frame stays exactly where it was",
      ],
      soundNotes: [
        "Music resolves and stops before the cut",
        "Return to room tone and end dry",
      ],
      transitions: ["Cut to black on the beat", "End on a hold, no fade"],
      visualTemplates: [
        "Back to {setting}, nearly as it began — but it reads differently now. Clear space holds {text}.",
        "{subject} leaves frame. {texture} remains. The empty space is the point, with {text} settling in the void.",
        "A final held frame of {setting}; the withheld information now sits behind everything, {text} last.",
      ],
    },
  ],
  shotPlan: {
    8: [
      { role: "withhold", weight: 0.4 },
      { role: "fragment", weight: 0.28 },
      { role: "reveal", weight: 0.32 },
    ],
    15: [
      { role: "withhold", weight: 0.3 },
      { role: "fragment", weight: 0.22 },
      { role: "reveal", weight: 0.28 },
      { role: "resolve", weight: 0.2 },
    ],
    30: [
      { role: "withhold", weight: 0.24 },
      { role: "fragment", weight: 0.18 },
      { role: "reveal", weight: 0.22 },
      { role: "develop", weight: 0.2 },
      { role: "resolve", weight: 0.16 },
    ],
  },
};

const whimsicalFantasy: CreativeDirectory = {
  id: "whimsical-fantasy",
  name: "Whimsical Fantasy",
  tagline: "Warm, lit from within, and always moving forward.",
  summary:
    "A warm magical palette with graceful, continuous movement. Character action stays expressive and readable, atmosphere glows softly, and every shot hands off motion to the next.",
  pacing: "flowing",
  principles: [
    "Give every shot one clear, readable action — no ambiguous staging.",
    "Keep the camera moving with the subject, never against it.",
    "Light warm and from within the scene, so glow looks earned.",
    "Let one impossible detail per shot carry the magic, never three.",
    "Hand movement across the cut so the sequence feels continuous.",
  ],
  palette: [
    { label: "Lantern amber", hex: "#e8b562" },
    { label: "Dusk rose", hex: "#d98a8a" },
    { label: "Deep violet", hex: "#5b4b8a" },
    { label: "Warm ivory", hex: "#f6ecd9" },
  ],
  cameraGrammar: [
    "Continuous glides on a gimbal, easing in and out",
    "Rising cranes that open the space as the action lands",
    "Follow moves that stay a half step behind the subject",
  ],
  lightingRules: [
    "Warm practicals inside frame as the primary source",
    "Soft top light for atmosphere, never hard shadows on faces",
    "One glowing element per frame to lead the eye",
  ],
  compositionRules: [
    "Keep the subject's action unobstructed and centred-left",
    "Layer foreground sparkle, mid-ground subject, soft background",
    "Leave headroom for the space to feel generous",
  ],
  soundSignature: [
    "Light melodic motif carried on strings or bells",
    "Airy room ambience with a soft low hum underneath",
    "One bright accent sound on the magical beat",
  ],
  transitionVocabulary: [
    "Motion-matched cut that continues the movement",
    "Soft light wipe as a glowing element crosses frame",
    "Rising cut on the upward move",
  ],
  negativeEmphasis: [
    "no harsh contrast or hard shadows",
    "no desaturated or clinical colour",
    "no static locked-off framing",
    "no menacing tone",
  ],
  textureWords: [
    "drifting light motes",
    "hand-thrown ceramic",
    "worn wooden beams",
    "soft woven cloth",
    "warm rain on glass",
  ],
  comfortableShotSeconds: { min: 2, max: 7 },
  rationaleTemplates: [
    "The sequence keeps moving so {audience} never has to work to follow it: a warm invitation into {setting}, one clear moment of wonder around {subject}, then a lift out. Glow comes from practicals inside frame, so the magic reads as part of the place.",
    "Everything is staged for readability — {subject} does one legible thing per shot while the camera glides with them. Warm light and a single impossible detail per frame keep {setting} charming instead of busy.",
  ],
  titlePatterns: ["{subject} — A Warm Invitation", "Wonder at {setting}", "The Lift: {subject}"],
  archetypes: [
    {
      role: "establish",
      titleTemplates: ["Invite — {setting}", "Open Warm on {setting}"],
      shotTypes: [
        "Wide establishing, 24mm equivalent, generous headroom",
        "Medium-wide moving entry into the space",
      ],
      cameraMoves: [
        "Slow glide forward into the space, easing to a stop",
        "Gentle rise from low to eye level as the space opens",
      ],
      lightingNotes: [
        "Warm practicals inside frame doing the lighting work",
        "Soft golden top light with no hard shadow on faces",
      ],
      compositionNotes: [
        "Subject centred-left with the space opening to the right",
        "Foreground sparkle, subject mid-ground, softly falling background",
      ],
      soundNotes: [
        "Light melodic motif enters immediately",
        "Airy ambience with a soft low hum underneath",
      ],
      transitions: [
        "Motion-matched cut that continues the forward glide",
        "Soft light wipe as a glowing element crosses frame",
      ],
      visualTemplates: [
        "{setting} opens warm and lived-in; {texture} catches the light as {subject} arrives.",
        "A generous view of {setting}, glowing from within. {subject} enters and {action} begins.",
        "Golden light across {setting}. {texture} drifts through the air, inviting {audience} in.",
      ],
    },
    {
      role: "develop",
      titleTemplates: ["Wonder — {subject}", "The Turn Toward Magic"],
      shotTypes: [
        "Medium on the subject, 40mm equivalent",
        "Moving three-quarter shot that keeps the action readable",
      ],
      cameraMoves: [
        "Follow move a half step behind the subject",
        "Slow orbit around the action, easing at the end",
      ],
      lightingNotes: [
        "Add one glowing element to lead the eye through frame",
        "Warm rim light to lift the subject off the background",
      ],
      compositionNotes: [
        "Keep the action unobstructed with clear space in front of the subject",
        "Balance the glow against a soft, uncluttered background",
      ],
      soundNotes: [
        "Motif rises a step as the action develops",
        "One bright accent sound on the magical beat",
      ],
      transitions: [
        "Cut on continuing movement",
        "Rising cut as the camera lifts",
      ],
      visualTemplates: [
        "{subject} {action}; one impossible detail appears in the warm light and {texture} answers it.",
        "The camera stays with {subject} as {action} unfolds — light gathers where it shouldn't, gently.",
        "Warmth builds around {subject}. {action} carries the frame, {texture} glowing at the edges.",
      ],
    },
    {
      role: "detail",
      titleTemplates: ["Play — {texture}", "Small Delight"],
      shotTypes: [
        "Close-up on hands or object, 65mm equivalent",
        "Tight insert with soft falloff",
      ],
      cameraMoves: [
        "Small handheld float, smooth and unhurried",
        "Slight push in that finishes on the detail",
      ],
      lightingNotes: [
        "Soft directional light with a warm bounce filling the shadow",
        "Let a practical flare gently at the frame edge",
      ],
      compositionNotes: [
        "Fill two thirds of frame with the detail, keep the rest soft",
        "Diagonal placement so the eye travels through the frame",
      ],
      soundNotes: [
        "Close, friendly foley — cloth, ceramic, paper",
        "Motif thins to a single instrument",
      ],
      transitions: ["Soft cut on the settle", "Light wipe into the next beat"],
      visualTemplates: [
        "Close on {texture} while {action}, in miniature — the charm is in the craft.",
        "Hands and {texture} fill the frame; {subject} is present through the detail alone.",
        "A small delight: {texture} catching the warm light while {action} continues just off frame.",
      ],
    },
    {
      role: "reveal",
      titleTemplates: ["Open Up — {setting}", "The Wide Wonder"],
      shotTypes: [
        "Wide reveal, 21mm equivalent",
        "Rising wide that shows the whole place at once",
      ],
      cameraMoves: [
        "Crane up and back, revealing the full space",
        "Continuous glide out that widens the frame",
      ],
      lightingNotes: [
        "Push atmospheric haze so the light beams read",
        "Warm key from behind the subject, ivory bounce in front",
      ],
      compositionNotes: [
        "Subject small in a generous frame, still clearly readable",
        "Layered depth: glow near, subject mid, soft sky or wall far",
      ],
      soundNotes: [
        "Motif opens into full arrangement",
        "Ambience widens with a gentle swell",
      ],
      transitions: ["Rising cut on the crane", "Cut wide on the swell"],
      visualTemplates: [
        "The frame opens: {setting} in full, {subject} small but clear, {texture} drifting through the light.",
        "A wide, glowing view of {setting} — {action} reads even at this scale.",
        "Everything widens around {subject}; warm haze and {texture} fill the space for {audience}.",
      ],
    },
    {
      role: "resolve",
      titleTemplates: ["Lift — {subject}", "Warm Close"],
      shotTypes: [
        "Medium-close on the subject, settled",
        "Soft wide holding the glow",
      ],
      cameraMoves: [
        "Gentle ease to a stop, no hard landing",
        "Small lift that finishes with clear space for text",
      ],
      lightingNotes: [
        "Brightest warm beat of the sequence, still soft",
        "Practical glow blooms slightly at the edges",
      ],
      compositionNotes: [
        "Leave clean space above the subject for on-screen text",
        "Centre the glow so the closing text sits in it comfortably",
      ],
      soundNotes: [
        "Motif resolves upward and holds",
        "Ambience settles under the final line",
      ],
      transitions: ["Ease out and hold", "Soft cut on the resolved note"],
      visualTemplates: [
        "{subject} settles into the warm light; {text} rests in the clear space above.",
        "A last glowing frame of {setting}, {texture} still drifting, {text} landing softly.",
        "The scene lifts and holds — {subject}, warm light, and {text} sitting in the glow.",
      ],
    },
  ],
  shotPlan: {
    8: [
      { role: "establish", weight: 0.34 },
      { role: "develop", weight: 0.34 },
      { role: "resolve", weight: 0.32 },
    ],
    15: [
      { role: "establish", weight: 0.26 },
      { role: "develop", weight: 0.28 },
      { role: "reveal", weight: 0.22 },
      { role: "resolve", weight: 0.24 },
    ],
    30: [
      { role: "establish", weight: 0.22 },
      { role: "develop", weight: 0.22 },
      { role: "reveal", weight: 0.2 },
      { role: "detail", weight: 0.16 },
      { role: "resolve", weight: 0.2 },
    ],
  },
};

const documentaryRealism: CreativeDirectory = {
  id: "documentary-realism",
  name: "Documentary Realism",
  tagline: "Real light, real hands, nothing staged that could be observed.",
  summary:
    "Natural or motivated light in grounded locations. The camera observes from a respectful distance, favours authentic human detail, and keeps a clear social purpose in view.",
  pacing: "observational",
  principles: [
    "Use the light that is already there; add only what the location implies.",
    "Frame people at their own eye level, never above them.",
    "Let actions finish on their own instead of cutting for pace.",
    "Show hands and work — competence is more persuasive than polish.",
    "Keep one honest imperfection in every frame.",
  ],
  palette: [
    { label: "Daylight grey", hex: "#b9bcbd" },
    { label: "Terracotta", hex: "#b0654a" },
    { label: "Indigo cloth", hex: "#3c4a63" },
    { label: "Sunlit lime", hex: "#c8cf9f" },
  ],
  cameraGrammar: [
    "Shoulder-mounted with settled, unforced framing",
    "Static tripod frames when the subject is speaking or working",
    "Reframes that follow the action a moment late, as an observer would",
  ],
  lightingRules: [
    "Available daylight through existing windows and doorways",
    "Motivated top-up only, matched to the room's colour",
    "Protect highlights; let shadows stay where they fall",
  ],
  compositionRules: [
    "Eye level with the subject, headroom honest and unstyled",
    "Include enough location to explain the work",
    "Prefer real background depth over shallow separation",
  ],
  soundSignature: [
    "Location sound as the spine — voices, tools, street",
    "No score under the first shot; let the place speak",
    "Sparse, low instrumentation only where it clarifies feeling",
  ],
  transitionVocabulary: [
    "Straight cut on a completed action",
    "Cut on a look or a change of task",
    "Ambient cross-fade between locations",
  ],
  negativeEmphasis: [
    "no studio lighting look",
    "no staged smiles to camera",
    "no glossy colour grade",
    "no stock-footage staging",
  ],
  textureWords: [
    "worn workbench",
    "hand-dyed cloth",
    "chipped enamel",
    "dust on a windowsill",
    "rain-dark pavement",
  ],
  comfortableShotSeconds: { min: 3, max: 10 },
  rationaleTemplates: [
    "This is built to be believed. {setting} is shot in its own light at eye level, {subject} is shown doing real work with their hands, and the cut waits for actions to finish so {audience} reads competence rather than performance.",
    "The sequence observes instead of stages: place first, person second, then the work itself in close detail. Nothing is lit that the room could not have lit, which is what makes the purpose land for {audience}.",
  ],
  titlePatterns: ["{subject} — On Location", "{setting}, Observed", "The Work: {subject}"],
  archetypes: [
    {
      role: "establish",
      titleTemplates: ["Place — {setting}", "Where This Happens"],
      shotTypes: [
        "Wide establishing on location, 28mm equivalent",
        "Medium-wide from a doorway or across the street",
      ],
      cameraMoves: [
        "Static tripod frame, no movement",
        "Slow shoulder-mounted reframe as life crosses the frame",
      ],
      lightingNotes: [
        "Available daylight through existing openings, no added units",
        "Overcast soft light; protect the window highlights",
      ],
      compositionNotes: [
        "Include enough of the location to explain what happens here",
        "Real depth front to back; no artificial separation",
      ],
      soundNotes: [
        "Location sound only — street, weather, distant voices",
        "No score; let the place establish itself",
      ],
      transitions: ["Straight cut on a completed action", "Ambient cross-fade into the interior"],
      visualTemplates: [
        "{setting} in its own daylight. {texture} in the foreground, ordinary activity carrying on.",
        "A plain, honest view of {setting}: nothing arranged, {texture} where it actually sits.",
        "{setting} from an observer's distance. Weather and light exactly as found, {subject} not yet the focus.",
      ],
    },
    {
      role: "develop",
      titleTemplates: ["Person — {subject}", "At Eye Level"],
      shotTypes: [
        "Medium at eye level, 35mm equivalent",
        "Loose medium-close, subject working rather than posing",
      ],
      cameraMoves: [
        "Shoulder-mounted, settled, following a moment late",
        "Static frame while the subject speaks or works",
      ],
      lightingNotes: [
        "Window light as key, room bounce as the only fill",
        "Motivated top-up matched to the room's colour temperature",
      ],
      compositionNotes: [
        "Eye level with the subject, honest headroom",
        "Keep the work visible in frame alongside the face",
      ],
      soundNotes: [
        "Close voice and clothing movement, room tone intact",
        "Tool and material sound left unpolished",
      ],
      transitions: ["Cut on a look or a change of task", "Straight cut once the action finishes"],
      visualTemplates: [
        "{subject} at eye level in {setting}, {action} without performing for the camera.",
        "A steady frame on {subject}: {action}, hands busy, attention on the work rather than the lens.",
        "{subject} mid-task among {texture}. Nothing styled — the competence is the point.",
      ],
    },
    {
      role: "detail",
      titleTemplates: ["Hands — {texture}", "The Work Itself"],
      shotTypes: [
        "Close-up on hands and material, 50mm equivalent",
        "Insert on the tool or product at the moment of contact",
      ],
      cameraMoves: [
        "Handheld close, braced on the bench",
        "Static insert; let the action complete inside the frame",
      ],
      lightingNotes: [
        "Same window key, small white bounce for the shadow side",
        "Keep the specular highlights honest, do not polish them out",
      ],
      compositionNotes: [
        "Fill the frame with the work; crop the face out entirely",
        "Keep one honest imperfection visible in frame",
      ],
      soundNotes: [
        "Close material sound — thread, wood, ceramic, water",
        "No music under the detail beat",
      ],
      transitions: ["Cut when the action completes", "Straight cut to the wider context"],
      visualTemplates: [
        "Hands and {texture} fill the frame while {action}, in close detail.",
        "Close on the work: {texture} under working light, {action} unhurried and precise.",
        "The tool meets the material — {texture}, real wear, {action} carried through to the end.",
      ],
    },
    {
      role: "reveal",
      titleTemplates: ["Context — Why It Matters", "The Wider Frame"],
      shotTypes: [
        "Medium-wide placing the subject in the community or street",
        "Two-shot with a customer, neighbour, or colleague",
      ],
      cameraMoves: [
        "Static frame; people move within it",
        "Slow reframe to include the second person",
      ],
      lightingNotes: [
        "Available exterior light, no reflectors in frame",
        "Match interior and exterior exposure honestly, let windows blow slightly",
      ],
      compositionNotes: [
        "Show the relationship between the subject and the people they serve",
        "Keep the location legible behind the interaction",
      ],
      soundNotes: [
        "Overlapping voices and ambient street sound",
        "Sparse low instrumentation may enter here if it clarifies feeling",
      ],
      transitions: ["Cut on the exchange", "Ambient cross-fade toward the close"],
      visualTemplates: [
        "{subject} with the people this is actually for; {action} in the middle of ordinary life at {setting}.",
        "The wider frame explains the purpose: {setting}, real exchange, {texture} still present at the edges.",
        "Context arrives — {subject} and {audience} in the same frame, nothing staged between them.",
      ],
    },
    {
      role: "resolve",
      titleTemplates: ["Close — {setting}", "Leave It Standing"],
      shotTypes: [
        "Wide return to the location, now understood",
        "Held medium on the finished work",
      ],
      cameraMoves: [
        "Static frame, held a beat longer than a cut would need",
        "Small settle, then stop moving entirely",
      ],
      lightingNotes: [
        "Whatever the light has become by the end of the day",
        "No added light; let the room close the film",
      ],
      compositionNotes: [
        "Leave a clean area for on-screen text without covering the work",
        "Rhyme the opening frame so the sequence feels closed",
      ],
      soundNotes: [
        "Location sound resolves; last sound is the place, not music",
        "Any instrumentation fades before the final frame",
      ],
      transitions: ["Hold, then cut", "Fade ambient to end"],
      visualTemplates: [
        "Back to {setting} at the end of the day; {texture} where it always was, {text} in the clear area.",
        "The finished work sits in the room it was made in. {text} reads plainly against {texture}.",
        "A last honest frame of {setting} — {action} done, {text} carrying the ask.",
      ],
    },
  ],
  shotPlan: {
    8: [
      { role: "establish", weight: 0.32 },
      { role: "develop", weight: 0.36 },
      { role: "detail", weight: 0.32 },
    ],
    15: [
      { role: "establish", weight: 0.24 },
      { role: "develop", weight: 0.3 },
      { role: "detail", weight: 0.24 },
      { role: "resolve", weight: 0.22 },
    ],
    30: [
      { role: "establish", weight: 0.2 },
      { role: "develop", weight: 0.24 },
      { role: "detail", weight: 0.2 },
      { role: "reveal", weight: 0.2 },
      { role: "resolve", weight: 0.16 },
    ],
  },
};

const premiumProductFilm: CreativeDirectory = {
  id: "premium-product-film",
  name: "Premium Product Film",
  tagline: "One product, one honest highlight, nothing competing.",
  summary:
    "Clean visual hierarchy with the product at the centre. Controlled reflections, macro detail, and refined camera moves — premium in finish but attainable in feel.",
  pacing: "precise",
  principles: [
    "One product, one highlight; kill every competing reflection.",
    "Move the camera on a mechanical path, never by hand.",
    "Reserve the top or bottom third for text before you shoot.",
    "Show the material honestly — texture sells more than shine.",
    "End on the product at rest, not on motion.",
  ],
  palette: [
    { label: "Graphite", hex: "#1c1d21" },
    { label: "Warm sand", hex: "#cdb094" },
    { label: "Cream light", hex: "#f2ece2" },
    { label: "Copper edge", hex: "#b5764a" },
  ],
  cameraGrammar: [
    "Slider moves at constant speed, no acceleration",
    "Locked macro frames with focus pulls instead of camera moves",
    "Slow product-axis orbit, quarter turn maximum",
  ],
  lightingRules: [
    "One large soft source as key, positioned for the material",
    "Black cards to carve reflections back out of the product",
    "A single controlled highlight defines the product edge",
  ],
  compositionRules: [
    "Product on a third with clean negative space for text",
    "Symmetry or deliberate offset, never accidental placement",
    "Keep the background one value away from the product",
  ],
  soundSignature: [
    "Close material foley — pour, click, fabric, glass",
    "Low sustained pad with a clean, unhurried floor",
    "One soft accent on the final product frame",
  ],
  transitionVocabulary: [
    "Match cut on the highlight travelling across frame",
    "Cut on the focus landing",
    "Speed-matched cut between two slider moves",
  ],
  negativeEmphasis: [
    "no visible logos or brand marks",
    "no cluttered surfaces or props competing with the product",
    "no warped product geometry",
    "no blown-out specular highlights",
    "no handheld camera shake",
  ],
  textureWords: [
    "brushed metal",
    "condensation on glass",
    "unglazed ceramic",
    "raw linen",
    "fresh crema",
  ],
  comfortableShotSeconds: { min: 2, max: 6 },
  rationaleTemplates: [
    "The product leads every frame. {setting} is reduced to one clean value behind {subject}, a single soft key defines the edge, and the sequence moves hero, macro, gesture, rest so {audience} reads quality before they read the offer.",
    "This is built around one honest highlight on {subject}. Mechanical camera moves and controlled reflections keep the finish premium, while {texture} in macro keeps it attainable rather than glossy.",
  ],
  titlePatterns: ["{subject} — Product Film", "{subject}, Centred", "Clean Frame: {subject}"],
  archetypes: [
    {
      role: "establish",
      titleTemplates: ["Hero — {subject}", "Product, Centred"],
      shotTypes: [
        "Hero medium on the product, 50mm equivalent",
        "Clean three-quarter product frame on a seamless surface",
      ],
      cameraMoves: [
        "Slider left to right at constant speed",
        "Locked frame with a 4% push, mechanically even",
      ],
      lightingNotes: [
        "One large soft source at 45 degrees, black card opposite to shape the edge",
        "Soft top light with a gradient background one value darker than the product",
      ],
      compositionNotes: [
        "Product on the lower third, negative space above reserved for text",
        "Deliberate symmetry with the background falling off evenly",
      ],
      soundNotes: [
        "Low sustained pad, clean floor, no clutter",
        "Single soft material accent as the product settles",
      ],
      transitions: [
        "Match cut on the highlight travelling across frame",
        "Speed-matched cut into the macro beat",
      ],
      visualTemplates: [
        "{subject} centred in {setting}, one controlled highlight along its edge, {texture} reading clearly.",
        "A clean hero frame: {subject} on a seamless surface, background one value darker, space held for text.",
        "{subject} lit by a single soft source; {texture} carries the material story, nothing else in frame.",
      ],
    },
    {
      role: "detail",
      titleTemplates: ["Macro — {texture}", "Material Detail"],
      shotTypes: [
        "Extreme close-up, 100mm macro equivalent",
        "Tight insert on the surface where the material reads",
      ],
      cameraMoves: [
        "Locked tripod with a slow focus pull across the surface",
        "6% push on a slider, no acceleration",
      ],
      lightingNotes: [
        "Single large soft source raking across the surface at 45 degrees",
        "Black card opposite the key to protect the rim highlight",
      ],
      compositionNotes: [
        "Fill the frame with material; keep one clean edge for the eye to rest on",
        "Place the highlight on a third so it does not sit dead centre",
      ],
      soundNotes: [
        "Close material foley, dry and specific",
        "Pad thins to a single sustained note",
      ],
      transitions: ["Cut on the focus landing", "Match cut on the highlight"],
      visualTemplates: [
        "Macro on {texture}: the surface of {subject} in full detail, one highlight tracking across it.",
        "Extreme close on {texture} while {action} — material honesty at maximum magnification.",
        "The surface fills the frame: {texture}, controlled reflection, {subject} unmistakable even this close.",
      ],
    },
    {
      role: "develop",
      titleTemplates: ["Gesture — {action}", "In Use"],
      shotTypes: [
        "Medium-close on hands using the product, 65mm equivalent",
        "Tabletop two-thirds frame with the product in motion",
      ],
      cameraMoves: [
        "Slider follows the gesture at matched speed",
        "Locked frame; the gesture moves through a still composition",
      ],
      lightingNotes: [
        "Key held constant so the product does not shift value mid-gesture",
        "Add a small backlight to separate hands from background",
      ],
      compositionNotes: [
        "Hands enter from the softer side of frame, product stays on its third",
        "Keep the surface clear — nothing competing with the gesture",
      ],
      soundNotes: [
        "Close, real foley for the gesture: pour, click, fabric",
        "Pad steady underneath, no swell",
      ],
      transitions: [
        "Cut as the gesture completes",
        "Speed-matched cut to the context frame",
      ],
      visualTemplates: [
        "Hands and {subject} together: {action}, clean surface, {texture} catching the key light.",
        "{action} in one continuous, unhurried gesture — {subject} stays the centre of the frame.",
        "The product in use: {action}, controlled reflections, {texture} still legible in motion.",
      ],
    },
    {
      role: "reveal",
      titleTemplates: ["Context — {setting}", "Where It Belongs"],
      shotTypes: [
        "Wider tabletop frame with the product in its setting",
        "Medium-wide lifestyle frame, product still dominant",
      ],
      cameraMoves: [
        "Quarter-turn orbit on the product axis",
        "Slow slider back that widens without losing the product",
      ],
      lightingNotes: [
        "Let the setting's practicals appear, key still doing the work on the product",
        "Control every reflection the wider frame introduces",
      ],
      compositionNotes: [
        "Product remains the brightest and sharpest element in frame",
        "Background props kept below the product in visual weight",
      ],
      soundNotes: [
        "Room ambience enters low under the pad",
        "Material foley continues at reduced level",
      ],
      transitions: ["Cut on the orbit settling", "Speed-matched cut to the final frame"],
      visualTemplates: [
        "{subject} in {setting} — wider now, but still the brightest, sharpest thing in frame.",
        "The context arrives: {setting} around {subject}, {texture} tying them together for {audience}.",
        "A wider frame with everything controlled: {subject} dominant, {setting} supporting, no clutter.",
      ],
    },
    {
      role: "resolve",
      titleTemplates: ["At Rest — {subject}", "Final Frame"],
      shotTypes: [
        "Locked hero frame, product at rest",
        "Clean medium with generous space for the closing line",
      ],
      cameraMoves: [
        "Fully locked; no movement at all",
        "Final 2% settle, then stop",
      ],
      lightingNotes: [
        "Key held exactly as the opening frame for continuity",
        "One clean highlight, no additional sources",
      ],
      compositionNotes: [
        "Reserve the upper or lower third entirely for on-screen text",
        "Rhyme the opening hero frame so the film closes cleanly",
      ],
      soundNotes: [
        "One soft accent as the product settles, then let the pad resolve",
        "End clean, no reverb tail",
      ],
      transitions: ["Hold on the final frame", "Cut to clean text card"],
      visualTemplates: [
        "{subject} at rest in the opening frame's light; {text} sits in the reserved third.",
        "The last frame is the product and nothing else — {texture} sharp, {text} clear.",
        "Product settled, highlight steady, {text} landing in clean negative space.",
      ],
    },
  ],
  shotPlan: {
    8: [
      { role: "establish", weight: 0.36 },
      { role: "detail", weight: 0.32 },
      { role: "resolve", weight: 0.32 },
    ],
    15: [
      { role: "establish", weight: 0.28 },
      { role: "detail", weight: 0.22 },
      { role: "develop", weight: 0.26 },
      { role: "resolve", weight: 0.24 },
    ],
    30: [
      { role: "establish", weight: 0.24 },
      { role: "detail", weight: 0.18 },
      { role: "develop", weight: 0.22 },
      { role: "reveal", weight: 0.2 },
      { role: "resolve", weight: 0.16 },
    ],
  },
};

export const CREATIVE_DIRECTORIES: CreativeDirectory[] = [
  nonlinearSuspense,
  whimsicalFantasy,
  documentaryRealism,
  premiumProductFilm,
];

export const DIRECTORY_BY_ID: Record<DirectoryId, CreativeDirectory> = {
  "nonlinear-suspense": nonlinearSuspense,
  "whimsical-fantasy": whimsicalFantasy,
  "documentary-realism": documentaryRealism,
  "premium-product-film": premiumProductFilm,
};

export function getDirectory(id: DirectoryId): CreativeDirectory {
  return DIRECTORY_BY_ID[id];
}
