# STRAIT OF HORMUZ — CONTENT SYSTEM
## Architecture, Schema, and Authoring Guide

---

## The Problem with the Current Setup

Content is scattered across 12 JSON files with overlapping concerns, inconsistent schemas, and no validation. Adding a new morning briefing means knowing that it lives in `briefings.json` under `characterBriefing.[charId]`, that the format is an array of strings, and that the code in `narrative.js` picks from it based on conditions evaluated in `generateMorningBriefing()`. There's no way to know this without reading the code.

The new system separates **authoring** from **runtime**. You write content in organized, human-readable files. A build script compiles them into the 12 JSON files the game expects. Nothing about the game code changes — only the workflow for creating content.

---

## Directory Structure

```
content/
├── build.js                    ← Compiles everything into data/*.json
├── validate.js                 ← Checks all content for errors
├── schema.js                   ← Shared schema definitions
│
├── characters/
│   ├── _template.json          ← Empty template for new characters
│   ├── trump.json              ← All Trump content in one place
│   ├── hegseth.json
│   ├── kushner.json
│   ├── asmongold.json
│   └── fuentes.json
│
├── briefings/
│   ├── _template.json
│   ├── openings.json           ← Situation-dependent opening lines
│   ├── closers.json            ← Advisor recommendations
│   ├── iran-intel.json         ← Iran intelligence assessment pools
│   └── advisor-names.json      ← Named advisor pools
│
├── events/
│   ├── _template.json
│   ├── shared/                 ← Events any character can see
│   │   ├── crisis.json         ← 5 crisis events
│   │   ├── aipac.json          ← 4 AIPAC events
│   │   ├── diplomatic.json     ← Diplomatic events
│   │   ├── military.json       ← Military events
│   │   ├── economic.json       ← Economic events
│   │   └── chains.json         ← Multi-event chains (backchannel, hostage, etc.)
│   └── character/              ← Character-exclusive events
│       ├── trump.json          ← T01-T04 + chains
│       ├── hegseth.json        ← H01-H04 + chains
│       ├── kushner.json        ← K01-K07 + chains
│       ├── asmongold.json      ← A01-A04 + chains
│       └── fuentes.json        ← F01-F04 + chains
│
├── scenes/
│   ├── _template.json
│   ├── actions/                ← Scene text for player actions
│   │   ├── core.json           ← 27 core actions × 3 variants
│   │   ├── bible.json          ← 15 bible actions × 3 variants
│   │   ├── contacts.json       ← Kushner contact action scenes
│   │   └── character-overrides.json  ← Per-character action rewrites
│   ├── events/                 ← Scene text for decision events
│   │   └── all.json            ← 91+ event scenes with consequences
│   └── day-endings/
│       ├── reflections.json    ← 5 chars × 7 moods × 3 variants
│       └── cliffhangers.json   ← 13 categories
│
├── dialogue/
│   ├── _template.json
│   ├── reactions.json          ← Advisor reactions (per char × situation)
│   ├── idle-asides.json        ← Character asides during idle
│   ├── card-reactions.json     ← Reactions to card selection
│   └── restriction-refusals.json ← "I won't do that" voice lines
│
├── headlines/
│   ├── initial.json            ← Day 1 headlines
│   ├── actions.json            ← Headlines triggered by player actions
│   ├── ambient.json            ← Background wire traffic by tension
│   ├── polymarket.json         ← Prediction market headlines
│   ├── iran-provocations.json  ← Iran-side headlines
│   └── overnight.json          ← Overnight filler headlines
│
├── cards/
│   ├── strategy.json           ← 27 strategy cards
│   ├── bonus.json              ← 5 character bonus cards
│   ├── contacts.json           ← 5 Kushner contact cards
│   └── synergies.json          ← 7 card synergies
│
├── intel/
│   ├── snippets.json           ← 29+ intel briefing texts
│   ├── false-intel.json        ← 12+ false intel items
│   └── key-drivers.json        ← Key driver descriptions
│
├── interrupts/
│   └── all.json                ← 35 interrupts with scenes
│
└── images/
    └── manifest.json           ← Master image map (event→image, char→image)
```

---

## Content Schemas

### Character File (`characters/trump.json`)

One file per character. Contains EVERYTHING about that character.

```json
{
  "id": "trump",
  "name": "Donald Trump",
  "title": "45th & 47th President",
  "portraitImage": "assets/trump.png",
  "selectImage": "assets/char-trump.png",
  "reactionImages": {
    "angry": "assets/trump-angry.png",
    "smug": "assets/trump-smug.png"
  },

  "ability": "Art of the Deal",
  "abilityDesc": "All cards available. 1.5× effect multiplier. 4 card picks.",

  "lore": [
    "Paragraph 1 of character backstory..."
  ],

  "uniqueResource": {
    "name": "Political Capital",
    "start": 80,
    "max": 100,
    "inverted": false
  },

  "aipacStart": 70,

  "morningBriefings": {
    "calm":              "Your morning brief text when tension < 40...",
    "elevated":          "Brief when tension 40-70...",
    "crisis":            "Brief when tension > 70...",
    "low_approval":      "Brief when approval < 40...",
    "high_oil":          "Brief when oilPrice > 130...",
    "seizure":           "Brief after a recent seizure...",
    "budget_crisis":     "Brief when budget < 300...",
    "winning":           "Brief when victoryNarrative >= 2...",
    "war_path_high":     "Brief when warPath >= 3...",
    "diplomatic_progress": "Brief when diplomaticCapital > 50..."
  },

  "overnightScenes": {
    "confident":   "Full paragraph VN-style overnight scene...",
    "anxious":     "...",
    "angry":       "...",
    "desperate":   "...",
    "victorious":  "...",
    "grieving":    "...",
    "scheming":    "..."
  },

  "idleAsides": [
    "Did you see what CNN just said? They said 'crisis management' like it's a bad thing.",
    "Hannity texted. He wants an exclusive from the Situation Room.",
    "Oil at $115. Everyone with a truck in Texas is thinking about me right now."
  ],

  "cardReactions": {
    "military":     { "low": "...", "med": "...", "high": "..." },
    "diplomatic":   { "low": "...", "med": "...", "high": "..." },
    "economic":     { "low": "...", "med": "...", "high": "..." },
    "intelligence": { "low": "...", "med": "...", "high": "..." },
    "domestic":     { "low": "...", "med": "...", "high": "..." }
  },

  "advisorReactions": {
    "weekStart":            ["Variant 1", "Variant 2", "Variant 3"],
    "morningBrief":         ["...", "...", "..."],
    "highTension":          "Single string or array",
    "lowApproval":          "...",
    "seizure":              "...",
    "diplomatic":           "...",
    "victory":              "...",
    "lowBudget":            "...",
    "highProxy":            "...",
    "uniqueResourceLow":    "...",
    "uniqueResourceCritical": "..."
  },

  "restrictedCards": [],
  "restrictionRefusals": {
    "humanitarian_corridor": "We don't need to send aid to people who hate us..."
  },

  "epilogues": {
    "diplomatic": "Full epilogue text for diplomatic ending...",
    "military":   "Full epilogue text for military ending...",
    "decline":    "Full epilogue text for decline ending..."
  },

  "uniqueEvents": {
    "T01_fox_news_call": {
      "choices": [
        { "label": "Choice 1 label", "effects": {} },
        { "label": "Choice 2 label", "effects": {} },
        { "label": "Choice 3 label", "effects": {} }
      ]
    }
  }
}
```

**Key principle:** Everything about Trump lives in `trump.json`. You never have to look in 6 different files to understand or modify a character.

---

### Event File (`events/shared/crisis.json`)

```json
{
  "events": [
    {
      "id": "nuclear_threshold",
      "title": "Nuclear Threshold",
      "category": "crisis",
      "isCrisis": true,

      "conditions": {
        "dayRange": [25, 70],
        "minIranAggression": 60,
        "minTension": 55
      },

      "countdown": 20,

      "image": "assets/event-crisis-nuclear.png",
      "characterImageOverrides": {
        "trump":     "assets/event-crisis-nuclear.png",
        "hegseth":   "assets/event-crisis-nuclear.png",
        "kushner":   "assets/event-crisis-nuclear.png",
        "asmongold": "assets/event-crisis-nuclear.png",
        "fuentes":   "assets/event-crisis-nuclear.png"
      },

      "description": "Short description shown in event header...",

      "scene": "Long narrative scene text (from event-scenes.json)...",

      "characterFlavor": {
        "trump":     "Trump's reaction to this event...",
        "hegseth":   "Hegseth's reaction...",
        "kushner":   "Kushner's reaction...",
        "asmongold": "Asmongold's reaction...",
        "fuentes":   "Fuentes's reaction..."
      },

      "choices": [
        {
          "label": "Choice 1 label",
          "flavor": "What this choice means in context...",
          "effects": {
            "tension": -5,
            "iranAggression": -3,
            "diplomaticCapital": 10
          },
          "consequence": "Narrative text describing what happened after this choice...",
          "storyFlags": { "chose_diplomacy_nuclear": true },
          "chainEvent": null,
          "chainDelay": 0
        },
        {
          "label": "Choice 2 label",
          "flavor": "...",
          "effects": {},
          "consequence": "...",
          "chainEvent": "nuclear_ultimatum_response",
          "chainDelay": 5
        }
      ],

      "iranPortrait": "assets/iran-mojtaba.png"
    }
  ]
}
```

**Key principle:** Everything about an event is in one object — title, conditions, image (with character overrides), scene text, character flavor, choices with effects and consequences, chain links, and NPC portraits. No more cross-referencing 4 files.

---

### Headline File (`headlines/ambient.json`)

```json
{
  "ambient": {
    "low_tension": [
      "UKMTO reports routine maritime traffic through Strait of Hormuz. 14 vessels transited without incident.",
      "Lloyd's of London maintains Gulf war risk premium at 0.4% hull value.",
      "Brent crude trading at $98.40/barrel, down $3.20 from yesterday's close."
    ],
    "medium_tension": [
      "UKMTO Advisory: Vessels advised exercise caution in eastern approach. Increased IRGC activity.",
      "Oil futures spike $4.80 on reports of IRGC live-fire exercises. Brent at $112.30.",
      "GasBuddy national average: $4.23/gallon, up 8 cents from yesterday."
    ],
    "high_tension": [
      "PRIORITY — UKMTO reports suspected anti-ship missile launch from Iranian coastline.",
      "EMERGENCY — Oil futures halted limit-up at $147/barrel after mine detonation report.",
      "CRITIC — NSA reports massive spike in IRGC communications across all bands."
    ]
  }
}
```

---

### Image Manifest (`images/manifest.json`)

The single source of truth for which image goes where.

```json
{
  "events": {
    "impounded_tanker":           { "default": "assets/event-e01-tanker.png" },
    "predecessors_ghost":         { "default": "assets/event-e02-predecessor.png" },
    "admirals_warning":           { "default": "assets/event-e03-admiral.png" },
    "journalists_call":           { "default": "assets/event-e04-journalist.png" },
    "british_pm_call":            { "default": "assets/event-e05-british-pm.png" },
    "first_seizure_attempt":      { "default": "assets/event-e06-seizure.png" },
    "iran_ultimatum":             { "default": "assets/event-e07-iran-doubles.png" },
    "oil_markets_panic":          { "default": "assets/event-e08-oil-panic.png" },
    "carrier_incident":           { "default": "assets/event-e09-carrier-incident.png" },
    "secret_talks":               { "default": "assets/event-e10-shirazi.png" },
    "un_showdown":                { "default": "assets/event-e11-un-showdown.png" },
    "hostage":                    { "default": "assets/event-e12-hostage.png" },
    "china_mediation":            { "default": "assets/event-e13-china.png" },
    "proxy_ignition":             { "default": "assets/event-e14-houthi.png" },
    "the_leak":                   { "default": "assets/event-e17-leak.png" },
    "congressional_hearing_big":  { "default": "assets/event-e18-congress.png" },
    "oman_talks":                 { "default": "assets/event-e20-muscat.png" },
    "intel_breakthrough":         { "default": "assets/event-e21-intel-breakthrough.png" },
    "cyber_attack_decision":      { "default": "assets/event-e23-cyber.png" },

    "nuclear_threshold":  { "default": "assets/event-crisis-nuclear.png" },
    "three_seizures":     { "default": "assets/event-crisis-three-seizures.png" },
    "friendly_fire":      { "default": "assets/event-crisis-friendly-fire.png" },
    "cascade_crisis":     { "default": "assets/event-crisis-cascade.png" },
    "carrier_hit":        { "default": "assets/event-crisis-carrier-hit.png" },

    "aipac_delegation":   { "default": "assets/event-aipac-delegation.png" },
    "netanyahu_call":     { "default": "assets/event-netanyahu-call.png" },
    "aipac_attack_ad":    { "default": "assets/event-lobby-attack.png" },
    "donor_ultimatum":    { "default": "assets/event-donor-ultimatum.png" },

    "media_crisis":       { "default": "assets/event-e04-journalist.png" },
    "militia_attack":     { "default": "assets/event-proxy-attack.png" },
    "pipeline_sabotage":  { "default": "assets/event-oil-chaos.png" },
    "insurance_crisis":   { "default": "assets/event-e08-oil-panic.png" },
    "assassination_intel": { "default": "assets/event-assassination.png" },
    "russia_arms_deal":   { "default": "assets/event-e21-intel-breakthrough.png" },
    "russia_intel_leak":  { "default": "assets/event-e17-leak.png" },
    "tanker_war_echoes":  { "default": "assets/event-e01-tanker.png" },
    "mine_laying_detected": { "default": "assets/scene-mine.png" },
    "kc135_crash":        { "default": "assets/event-rescue-op.png" },
    "iran_moderate_coup": { "default": "assets/event-mojtaba.png" },
    "european_split":     { "default": "assets/event-e05-british-pm.png" },

    "T01_fox_news_call":           { "default": "assets/event-trump-fox.png" },
    "T02_deal_on_table":           { "default": "assets/event-trump-deal.png" },
    "T03_political_capital_crisis": { "default": "assets/event-trump-rally.png" },
    "T04_iran_backchannel":        { "default": "assets/event-trump-truth-social.png" },

    "H01_pentagon_power_play":  { "default": "assets/event-hegseth-pentagon.png" },
    "H03_shock_and_awe":        { "default": "assets/event-hegseth-shock-awe.png" },
    "H04_troop_morale":         { "default": "assets/event-hegseth-troops.png" },

    "K01_mbs_calls":        { "default": "assets/event-kushner-mbs.png" },
    "K02_exposure_spikes":  { "default": "assets/event-kushner-exposure.png" },
    "K03_riyadh_summit":    { "default": "assets/event-kushner-summit.png" },
    "K04_araghchi_gambit":  { "default": "assets/event-kushner-zarif.png" },

    "A01_osint_discovery":  { "default": "assets/event-asmongold-osint.png" },
    "A02_disinfo_attack":   { "default": "assets/event-asmongold-disinfo.png" },
    "A03_credibility_test": { "default": "assets/event-asmongold-stream.png" },
    "A04_chat_demands_action": { "default": "assets/event-asmongold-stream.png" },

    "F01_base_demands_blood":    { "default": "assets/event-fuentes-base.png" },
    "F02_international_pariah":  { "default": "assets/event-fuentes-isolation.png" },
    "F03_america_first_rally":   { "default": "assets/event-fuentes-congress.png" },
    "F04_assassination_whisper": { "default": "assets/event-fuentes-assassination.png" }
  },

  "characterOverrides": {
    "seizure_response": {
      "trump":     "assets/scene-seizure.png",
      "hegseth":   "assets/scene-intercept.png",
      "kushner":   "assets/scene-seizure.png",
      "asmongold": "assets/scene-seizure.png",
      "fuentes":   "assets/scene-seizure.png"
    },
    "congressional_hearing_big": {
      "trump":     "assets/event-trump-rally.png",
      "fuentes":   "assets/event-fuentes-congress.png"
    }
  },

  "ambientScenes": {
    "crisis_high":       "assets/situation-room-crisis.png",
    "total_war":         "assets/scene-total-war.png",
    "trump_victory":     "assets/scene-trump-victory.png",
    "kushner_exposed":   "assets/scene-kushner-exposure.png",
    "asmongold_viral":   "assets/scene-asmongold-viral.png",
    "fuentes_withdraw":  "assets/event-fuentes-withdraw.png",
    "hegseth_carrier":   "assets/scene-hegseth-carrier.png",
    "strait_open":       "assets/scene-strait-open.png",
    "budget_crisis":     "assets/scene-budget-crisis.png",
    "tension_high":      "assets/situation-room-crisis.png",
    "tension_medium":    "assets/situation-room-elevated.png",
    "tension_low":       "assets/situation-room-calm.png",
    "day_one":           "assets/situation-room.png"
  },

  "storyArcs": {
    "the_spark":         "assets/arc-escalation.png",
    "the_squeeze":       "assets/arc-escalation.png",
    "diplomatic_window": "assets/event-diplomatic-win.png",
    "false_dawn":        "assets/arc-fog-of-war.png",
    "proxy_season":      "assets/arc-proxy-front.png",
    "pressure_cooker":   "assets/arc-nuclear-shadow.png",
    "crossroads":        "assets/arc-tipping-point.png",
    "the_grind":         "assets/arc-long-game.png",
    "endgame_setup":     "assets/arc-endgame.png",
    "resolution":        "assets/arc-aftermath.png"
  },

  "iranPortraits": {
    "hardliner": "assets/iran-tangsiri.png",
    "moderate":  "assets/iran-araghchi.png",
    "successor": "assets/iran-mojtaba.png"
  },

  "categoryFallbacks": {
    "military":     "assets/event-military.png",
    "diplomatic":   "assets/event-diplomatic.png",
    "economic":     "assets/event-economic.png",
    "intelligence": "assets/event-intel.png"
  }
}
```

---

## Build Script

The build script reads all content files and compiles them into the 12 runtime JSON files that `loader.js` expects. The game code doesn't change at all — only the authoring workflow.

```
content/build.js → data/cards.json
                  → data/events.json
                  → data/interrupts.json
                  → data/intel.json
                  → data/characters.json
                  → data/dialogue.json
                  → data/reactions.json
                  → data/headlines.json
                  → data/action-scenes.json
                  → data/briefings.json
                  → data/event-scenes.json
                  → data/day-endings.json
```

### How it works:

```
node content/build.js
```

1. Reads all files in `content/` recursively
2. Validates every entry against its schema
3. Assembles the 12 runtime JSON files by collecting from the right sources:
   - `characters.json` ← pulls from `content/characters/*.json`
   - `events.json` ← pulls from `content/events/**/*.json`
   - `headlines.json` ← pulls from `content/headlines/*.json`
   - `dialogue.json` ← pulls from character files (advisorReactions) + `content/dialogue/*.json`
   - `briefings.json` ← pulls from `content/briefings/*.json` + character files (morningBriefings)
   - `event-scenes.json` ← pulls from `content/scenes/events/*.json`
   - `action-scenes.json` ← pulls from `content/scenes/actions/*.json`
   - `day-endings.json` ← pulls from character files (overnightScenes) + `content/scenes/day-endings/*.json`
   - etc.
4. Writes to `data/` directory
5. Prints a report: entry counts, warnings, errors

### Validation checks:

- Every event ID referenced in a chain exists
- Every image path in the manifest points to a file that exists
- Every character referenced in characterFlavor is a valid character ID
- No duplicate event IDs
- Every event has at least 2 choices
- Every choice has effects and a consequence
- Morning briefing conditions cover all states
- Card IDs in synergies match actual card IDs (catches the broken synergy bug)

---

## Workflow for Adding Content

### Adding a new morning briefing for Trump:

1. Open `content/characters/trump.json`
2. Find `morningBriefings`
3. Add or edit an entry:
```json
"high_polarization": "The country is tearing itself apart and both sides think you're the problem..."
```
4. Run `node content/build.js`
5. Briefing is now available in-game

### Adding a new decision event:

1. Open `content/events/shared/diplomatic.json` (or whatever category)
2. Add a new event object following the schema
3. Add the image mapping in `content/images/manifest.json`
4. Run `node content/build.js`
5. Event is now in the game

### Adding a new ambient headline:

1. Open `content/headlines/ambient.json`
2. Add a string to the appropriate tension array (`low_tension`, `medium_tension`, `high_tension`)
3. Run `node content/build.js`

### Adding a new character:

1. Copy `content/characters/_template.json` to `content/characters/newchar.json`
2. Fill in every field
3. Add character events in `content/events/character/newchar.json`
4. Add images to `content/images/manifest.json`
5. Run `node content/build.js`

---

## Migration from Current System

### Phase 1: Set up the content directory structure
Create all directories and template files. This is scaffolding only.

### Phase 2: Extract current content into the new structure
Write a one-time migration script that reads the existing 12 JSON files and splits their content into the new directory structure. This is the hardest step but only happens once.

### Phase 3: Add new content
All the content from the Game Copy Expansion doc (50 briefings, 100 cables, 75 card reactions, etc.) goes directly into the new structure.

### Phase 4: Build and verify
Run the build script, compare output against the original JSON files, verify the game works identically.

### Phase 5: Delete the old files
The `data/*.json` files are now generated artifacts. The `content/` directory is the source of truth.

---

## Template: Character File

```json
{
  "id": "",
  "name": "",
  "title": "",
  "portraitImage": "",
  "selectImage": "",
  "reactionImages": {},

  "ability": "",
  "abilityDesc": "",
  "lore": [""],

  "uniqueResource": {
    "name": "",
    "start": 0,
    "max": 100,
    "inverted": false
  },

  "aipacStart": 50,

  "morningBriefings": {
    "calm": "",
    "elevated": "",
    "crisis": "",
    "low_approval": "",
    "high_oil": "",
    "seizure": "",
    "budget_crisis": "",
    "winning": "",
    "war_path_high": "",
    "diplomatic_progress": ""
  },

  "overnightScenes": {
    "confident": "",
    "anxious": "",
    "angry": "",
    "desperate": "",
    "victorious": "",
    "grieving": "",
    "scheming": ""
  },

  "idleAsides": [],

  "cardReactions": {
    "military":     { "low": "", "med": "", "high": "" },
    "diplomatic":   { "low": "", "med": "", "high": "" },
    "economic":     { "low": "", "med": "", "high": "" },
    "intelligence": { "low": "", "med": "", "high": "" },
    "domestic":     { "low": "", "med": "", "high": "" }
  },

  "advisorReactions": {
    "weekStart": ["", "", ""],
    "morningBrief": ["", "", ""],
    "highTension": "",
    "lowApproval": "",
    "seizure": "",
    "diplomatic": "",
    "victory": "",
    "lowBudget": "",
    "highProxy": "",
    "uniqueResourceLow": "",
    "uniqueResourceCritical": ""
  },

  "restrictedCards": [],
  "restrictionRefusals": {},

  "epilogues": {
    "diplomatic": "",
    "military": "",
    "decline": ""
  },

  "uniqueEvents": {}
}
```

---

## Template: Event

```json
{
  "id": "",
  "title": "",
  "category": "",
  "isCrisis": false,

  "conditions": {
    "dayRange": [1, 91],
    "characterOnly": null,
    "minTension": 0,
    "maxTension": 100,
    "minIranAggression": 0,
    "minApproval": 0,
    "maxApproval": 100,
    "minWarPath": 0,
    "requiredFlags": [],
    "requiredCards": [],
    "custom": null
  },

  "countdown": 0,
  "exclusive": false,
  "replayable": false,
  "replayCooldown": 10,

  "image": "",
  "characterImageOverrides": {},
  "iranPortrait": null,

  "description": "",
  "scene": "",
  "characterFlavor": {},

  "choices": [
    {
      "label": "",
      "flavor": "",
      "effects": {},
      "consequence": "",
      "storyFlags": {},
      "chainEvent": null,
      "chainDelay": 0
    }
  ]
}
```
