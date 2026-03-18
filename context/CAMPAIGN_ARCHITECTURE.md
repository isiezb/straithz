# Strait of Hormuz — Campaign Architecture
## Five Characters, Five Journeys, Every Image Earns Its Place

**Status: Largely implemented.** This document was originally a design proposal. The majority of systems described here are now live in the codebase. Sections below indicate what is implemented, what was adjusted during implementation, and what remains to be done.

---

## The Original Problem (Now Resolved)

Previously every character played the same game with the same generic images. Events fell back to 4 category icons (`event-military.png`, `event-diplomatic.png`, `event-economic.png`, `event-intel.png`) when specific images existed on disk.

**Current state:** Two systems now solve this:
1. `getEventImage()` in `js/ui.js` resolves event images through a character-override → event-specific → keyword-category fallback chain. Zero generic fallback images remain in `DECISION_EVENTS`.
2. `CHARACTER_EVENT_IMAGES` in `js/ui.js` maps ~40 per-character image overrides for shared events, making the same event show different visuals per character.

---

## PART ONE: IMAGE MAP — CURRENT STATE

### Fix #1 — Previously Orphaned Images: IMPLEMENTED

Most previously orphaned images are now wired into `CHARACTER_EVENT_IMAGES`, `getEventImage()` keyword fallback, or character-specific overrides. The following were connected:

- `event-aipac-delegation.png` — now used for `aipac_delegation`
- `event-netanyahu-call.png` — now used for `netanyahu_call`
- `event-donor-ultimatum.png` — now used for `donor_ultimatum`
- `event-lobby-attack.png` — now used for `aipac_attack_ad`
- `event-proxy-attack.png` — now used for proxy events
- `event-diplomatic-win.png` — now used for diplomatic success events
- `event-cyber-war.png` — now used for cyber events
- `event-oil-chaos.png` — now used for oil disruption events

**Still orphaned:**

| Image File | Status |
|-----------|--------|
| `event-e19-ultimatum.png` | Not referenced in any JS file. Could be used for `iran_ultimatum` or any ultimatum-framed event. |

### Fix #2 — Generic Fallback Elimination: IMPLEMENTED

The `getEventImage()` function in `js/ui.js` (line ~4728) implements a 3-tier resolution:
1. Character-specific override via `CHARACTER_EVENT_IMAGES[characterId][eventId]`
2. Event-specific image from the event's own `image` property
3. Keyword-category fallback (matches event ID keywords to appropriate images)

Events that previously used generic category icons now resolve to specific images through this system.

### Fix #3 — Scene Images for Gameplay Phases: IMPLEMENTED

Scene images are served by `getAmbientSceneImage()` in `js/narrative.js` (line ~397). This is a state-driven resolver that checks:
- `warPath >= 4` → `scene-total-war.png`
- `crisisLevel >= 2` → `situation-room-crisis.png`
- Character-specific conditions (Trump victory narrative, Kushner exposure, Asmongold audience, Fuentes withdrawal, Hegseth carrier)
- `straitOpenDays >= 3` → `scene-strait-open.png`
- Budget < 200 → `scene-budget-crisis.png`
- Tension-based situation room tiers
- Story arc image fallback
- Default: `situation-room-calm.png`

### Fix #4 — Situation Room Images for Morning Briefings: IMPLEMENTED

Morning briefing image selection in `showDailyReport()` (`js/ui.js`, line ~1260):
- `tension > 65` → `situation-room-crisis.png`
- `tension > 40` → `situation-room-elevated.png`
- `tension < 25` → `situation-room-calm.png`
- Day 1 uses `situation-room.png` (via lore screen flow)

### Fix #5 — Briefing Images: IMPLEMENTED

In `showDailyReport()` (`js/ui.js`, lines ~1266-1267):
- Days 1-7 → `briefing-early.png`
- Days 50+ → `briefing-late.png`

Character-specific overrides also apply:
- Hegseth + warPath >= 2 → `map-tactical.png`
- Kushner + exposure > 60 → `scene-kushner-exposure.png`
- Asmongold + audience > 70 → `scene-asmongold-viral.png`
- Fuentes + standing < 25 → `event-fuentes-isolation.png`
- Trump + approval < 35 → `event-trump-rally.png`

### Fix #6 — Story Arc Transition Splashes: IMPLEMENTED

`showArcTransition()` in `js/narrative.js` (line ~467) shows full-screen chapter title overlays when the story arc changes. `ARC_TITLES` maps all 10 arcs to display names. The overlay includes the arc image and title text, fades in, holds, and fades out.

Arc image mapping:
| Arc | Image | Days |
|-----|-------|------|
| `the_spark` | `arc-escalation.png` | 1-7 |
| `the_squeeze` | `arc-escalation.png` (reused) | 8-14 |
| `diplomatic_window` | `event-diplomatic-win.png` | 15-21 |
| `false_dawn` | `arc-fog-of-war.png` | 22-28 |
| `proxy_season` | `arc-proxy-front.png` | 29-35 |
| `pressure_cooker` | `arc-nuclear-shadow.png` | 36-42 |
| `crossroads` | `arc-tipping-point.png` | 43-49 |
| `the_grind` | `arc-long-game.png` | 50-56 |
| `endgame_setup` | `arc-endgame.png` | 57-70 |
| `resolution` | `arc-aftermath.png` | 71+ |

### Fix #7 — Iranian Faction Portraits in Events: IMPLEMENTED

3 Iranian NPC portraits appear during Iran-focused events:
- `iran-tangsiri.png` (IRGC hardliner) — seizures, fast boat swarm, mine laying, military provocations
- `iran-araghchi.png` (moderate) — secret talks, backchannel events, ceasefire, Araghchi gambit
- `iran-mojtaba.png` (successor) — Mojtaba succession/consolidation, nuclear threshold events

---

## PART TWO: FIVE CAMPAIGNS

### Design Principle

Each character's playthrough feels like a 3-act story with a distinct genre:

| Character | Genre | Emotional Arc |
|-----------|-------|---------------|
| Trump | Political thriller | Hubris → crisis → legacy defining moment |
| Hegseth | Military drama | Confidence → chain of command fracture → last stand |
| Kushner | Spy/deal thriller | Quiet competence → exposure → all-in gamble |
| Asmongold | Social media satire | Outsider energy → credibility test → reckoning with influence |
| Fuentes | Political horror | Isolation → siege mentality → escape or self-destruction |

---

### TRUMP CAMPAIGN: "The Art of the Crisis"

**Act 1 — The Ratings War (Days 1-25)**

Trump enters the crisis treating it as content. His Political Capital is high (80). Morning briefings read like someone preparing for a TV appearance. Every event is filtered through "how does this play on the news?"

Key events and image flow:
```
Day 1-3:   situation-room.png → First morning. "Beautiful room.
           They built this for Kennedy, you know."

Day 5-10:  event-trump-fox.png → T01_fox_news_call
           Fox wants an exclusive. This is Trump's comfort zone.

Day 5-15:  event-aipac-delegation.png → aipac_delegation
           AIPAC comes calling. Trump starts at 70 pressure.

Day 8-14:  arc-escalation.png → Arc transition splash.
           The crisis is real. First seizure attempt likely.
           event-e06-seizure.png → first_seizure_attempt
           scene-seizure.png → ambient during seizure response

Day 10-15: event-e01-tanker.png → impounded_tanker
           "My tanker. They took MY tanker."
```

**The Trump-specific texture:** Every shared event that fires during Trump's campaign is visually flavored through his obsession with narrative control via `CHARACTER_EVENT_IMAGES`. The scene panel alternates between situation room imagery and Trump-specific overrides.

**Act 2 — The Deal (Days 25-55)**

Political Capital starts draining. The fun part is over.

```
Day 25-45: event-trump-deal.png → T02_deal_on_table
           THE peak event. A grand bargain opportunity.

Day 30-50: event-e08-oil-panic.png → oil_markets_panic
           Gas prices killing his numbers.
           scene-budget-crisis.png → ambient if budget drops

Day 40-65: event-trump-rally.png → T03_political_capital_crisis
           THE CONFESSION SCENE. Political Capital bleeding.
           The rally crowd is thinner. Fox is running counter-programming.
```

**Act 3 — The Legacy (Days 55-91)**

```
Winning path:
  scene-trump-victory.png → When CLAIM VICTORY succeeds
  Epilogue image based on warPath level at victory

Losing path (Political Capital → 0):
  scene-removal.png → The removal scene
  Character-specific defeat epilogue via CRT variants

Losing path (war):
  scene-total-war.png → warPath hits 5
  epilogue-war.png
```

---

### HEGSETH CAMPAIGN: "Chain of Command"

**Act 1 — The Warrior (Days 1-25)**

Hegseth starts strong. Command Authority at 60, military cards are his bread and butter. Scene panel dominated by carrier imagery (`scene-hegseth-carrier.png` is his default ambient).

```
Day 1-3:   situation-room.png → Military sitrep morning briefing.
           When warPath >= 2, switches to map-tactical.png.

Day 5-15:  event-hegseth-pentagon.png → H01_pentagon_power_play
           First challenge to authority.

Day 8-14:  event-e06-seizure.png → first_seizure_attempt
           Hegseth's version: tactical problem, not political.
           scene-intercept.png → if intercept succeeds
           scene-seizure.png → if seizure happens

Day 12-20: event-hegseth-carrier.png → carrier deployment events
           scene-hegseth-carrier.png → ambient scene panel
```

**Act 2 — The Fracture (Days 25-55)**

Command Authority starts bleeding. The Pentagon is going around him.

```
Day 20-40: event-e17-leak.png → H02_leak_from_within
           Pentagon leaking to the press.

Day 30-50: event-hegseth-shock-awe.png → H03_shock_and_awe
           THE PEAK EVENT. Hegseth wants to go all-in.

Day 25-55: event-crisis-friendly-fire.png → friendly_fire
           The worst thing for a military commander.
```

**Act 3 — The Last Stand (Days 55-91)**

```
Day 40-60: event-hegseth-troops.png → H04_troop_morale

Winning path (warPath≥3 + iranAggression≤25 + approval≥55):
  iran-tangsiri.png → IRGC stands down
  epilogue-military.png → epilogue-military-crt.png

Losing path (Authority → 0):
  event-hegseth-pentagon.png → The brass takes over
  scene-removal.png → Relieved of command
```

---

### KUSHNER CAMPAIGN: "The Shadow Diplomat"

**Act 1 — The Network (Days 1-25)**

Kushner starts with low exposure (10), operating in shadows. Visual palette leans on diplomatic settings.

```
Day 1-3:   situation-room.png → Different tone — checking phone.

Day 5-15:  event-kushner-mbs.png → K01_mbs_calls
           First contact event.

Day 8-15:  event-aipac-delegation.png → aipac_delegation
           Kushner plays both sides.

Day 10-20: Contact action images via CHARACTER_ACTION_IMAGES
           scene-muscat-meeting.png for Oman contacts
```

**Act 2 — The Exposure (Days 25-55)**

Exposure climbing. The ambient scene switches to `scene-kushner-exposure.png` when exposure > 60 (both in `getAmbientSceneImage()` and morning briefings).

```
Day 20-40: event-kushner-exposure.png → K02_exposure_spikes

Day 25-50: event-kushner-summit.png → K03_riyadh_summit
           THE PEAK EVENT. $100M+ on the table.

Day 30-55: event-kushner-zarif.png → K04_araghchi_gambit
           iran-araghchi.png → Iranian moderate portrait.

KUSHNER CONSPIRACY ARC (IMPLEMENTED):
Day 35-60: K05_senate_subpoena → Senate investigation triggered by exposure
Day 40-65: K06_pif_renegotiation → PIF deal renegotiation under pressure
Day 45-70: K07_the_recording → The recording surfaces — 3-event chain climax
```

**Act 3 — The Reckoning (Days 55-91)**

```
Winning path (dealValue≥300 + iranAggression≤25 + exposure<50):
  event-grand-bargain.png → The deal holds
  epilogue-peace.png → epilogue-peace-crt.png

Losing path (exposure≥90 for 3 days):
  event-e17-leak.png → Everything leaks
  scene-removal.png → Public disgrace
```

---

### ASMONGOLD CAMPAIGN: "The Stream"

**Act 1 — The Outsider (Days 1-25)**

Scene panel imagery is screens-within-screens. When audience > 80, ambient switches to `scene-asmongold-viral.png`. When audience > 70, morning briefing also uses the viral image.

```
Day 1-3:   situation-room.png → "Chat, we're live from the
           Situation Room."

Day 5-15:  event-asmongold-osint.png → A01_osint_discovery
           Credibility boost.

Day 10-20: event-asmongold-reddit.png → Reddit subreddit event
           scene-asmongold-viral.png → ambient when audience surging
```

**Act 2 — The Test (Days 25-55)**

```
Day 20-40: event-asmongold-disinfo.png → A02_disinfo_attack

Day 25-45: event-asmongold-stream.png → A03_credibility_test
           THE PEAK EVENT.

Day 25-55: event-asmongold-stream.png → A04_chat_demands_action
```

**Act 3 — The Influence (Days 55-91)**

```
Winning path (audience≥90 + credibility≥65 + 3 correct predictions):
  scene-asmongold-viral.png → Peak virality

Losing path (credibility≤10 for 3 days):
  event-asmongold-disinfo.png → Nobody believes you

Losing path (audience≤20 for 5 days):
  event-asmongold-stream.png → Empty stream
```

---

### FUENTES CAMPAIGN: "America First, America Alone"

**Act 1 — The Firebrand (Days 1-25)**

Fuentes starts with Base Enthusiasm at 85, AIPAC pressure at 15 (lowest). Locked out of 4 diplomatic cards. When international standing < 25, morning briefing shows `event-fuentes-isolation.png`.

```
Day 1-3:   situation-room.png → Briefing reads like a manifesto.

Day 5-15:  event-fuentes-base.png → F01_base_demands_blood
           Base wants escalation, but win condition is warPath=0.

Day 5-15:  event-aipac-delegation.png → aipac_delegation
           AIPAC at 15. Hostile territory.
           event-lobby-attack.png → for AIPAC confrontation scenes
```

**Act 2 — The Siege (Days 25-55)**

```
Day 15-35: event-fuentes-isolation.png → F02_international_pariah

Day 25-45: event-fuentes-congress.png → F03_america_first_rally
           THE PEAK EVENT.

Day 30-60: event-donor-ultimatum.png → donor_ultimatum

Day 20-50: event-lobby-attack.png → aipac_attack_ad
```

**Act 3 — The Exit (Days 55-91)**

```
Day 40-65: event-fuentes-assassination.png → F04_assassination_whisper

Withdrawal path:
  event-fuentes-withdraw.png → Fuentes's defining visual.
  getAmbientSceneImage() shows this when withdrawalProgress > 0.

Winning path (warPath=0 + navy≤1 + budget≥600 + standing≥35):
  epilogue-peace.png → epilogue-peace-crt.png

Losing path (enthusiasm≤15 for 3 days):
  event-fuentes-base.png → The base abandons him

Losing path (warPath≥3 for 3 days):
  scene-total-war.png → Dragged into war
```

---

## PART THREE: SHARED EVENTS WITH CHARACTER-SPECIFIC IMAGES — IMPLEMENTED

`CHARACTER_EVENT_IMAGES` in `js/ui.js` (line ~4678) maps ~40 per-character image overrides. When a shared event fires, `getEventImage()` checks this map first, so the same event shows different visuals per character.

### Seizure Events

| Character | Scene Panel Image | Why |
|-----------|------------------|-----|
| Trump | `scene-seizure.png` + trump portrait | "They seized OUR ship" — personal |
| Hegseth | `scene-intercept.png` or `scene-seizure.png` | Military response framing |
| Kushner | `scene-seizure.png` + kushner portrait | Calculating diplomatic cost |
| Asmongold | `scene-seizure.png` + asmongold portrait | "Chat, we're seeing this live" |
| Fuentes | `scene-seizure.png` | "This is why we leave" |

### Oil Crisis Events

| Character | Scene Panel Image | Why |
|-----------|------------------|-----|
| Trump | `event-e08-oil-panic.png` | Gas prices = approval |
| Hegseth | `event-e08-oil-panic.png` | Budget implications |
| Kushner | `event-oil-chaos.png` | Deal pipeline threatened |
| Asmongold | `event-oil-chaos.png` | Content framing |
| Fuentes | `event-oil-chaos.png` | Global entanglement argument |

### Nuclear Threshold

| Character | Scene Panel Image |
|-----------|------------------|
| All | `event-crisis-nuclear.png` |
| Then | `iran-mojtaba.png` portrait inset |
| Then | `arc-nuclear-shadow.png` |

### Congressional / Political Events

| Character | Scene Panel Image |
|-----------|------------------|
| Trump | `event-trump-rally.png` |
| Hegseth | `event-e18-congress.png` |
| Kushner | `event-e18-congress.png` |
| Asmongold | `event-asmongold-stream.png` |
| Fuentes | `event-fuentes-congress.png` |

---

## PART FOUR: THE CAMPAIGN FLOW SYSTEM — IMPLEMENTED

### Image Selection Function: IMPLEMENTED

`getEventImage()` in `js/ui.js` (line ~4728):

```js
function getEventImage(eventId, characterId) {
    // 1. Character-specific override
    if (characterId && CHARACTER_EVENT_IMAGES[characterId]) {
        const charImg = CHARACTER_EVENT_IMAGES[characterId][eventId];
        if (charImg) return charImg;
    }
    // 2. Event-specific image from event data
    // 3. Keyword-category fallback (matches event ID keywords to images)
    // No generic fallback — all events resolve to specific images
}
```

### Scene Panel State Machine: IMPLEMENTED

`getAmbientSceneImage()` in `js/narrative.js` (line ~397). Full state-driven resolver:

```js
function getAmbientSceneImage() {
    // Crisis overrides everything
    if (SIM.warPath >= 4) return 'assets/scene-total-war.png';
    if (SIM.crisisLevel >= 2) return 'assets/situation-room-crisis.png';

    // Character-specific ambient states
    // trump + victoryNarrative >= 2 → scene-trump-victory.png
    // kushner + exposure > 60 → scene-kushner-exposure.png
    // asmongold + audience > 80 → scene-asmongold-viral.png
    // fuentes + withdrawalProgress > 0 → event-fuentes-withdraw.png
    // hegseth (default) → scene-hegseth-carrier.png

    // Strait progressing → scene-strait-open.png
    // Budget crisis → scene-budget-crisis.png
    // Tension-based situation room tiers
    // Story arc image fallback
    // Default: situation-room-calm.png
}
```

Called at the start of each day and after events resolve via `showSceneAmbient()`.

### Arc Transition Splashes: IMPLEMENTED

`showArcTransition()` in `js/narrative.js` (line ~467). Shows full-bleed overlay with arc image and title for ~3 seconds when `SIM.storyArc` changes. `ARC_TITLES` maps all 10 arcs.

### Overnight Scenes: IMPLEMENTED

`CHAR_OVERNIGHT` in `js/ui.js` (line ~3485) provides mood-specific images for all 5 characters. Moods: `desperate`, `tense`, `neutral`, `confident`. Falls back to generic `OVERNIGHT_IMAGES` per mood.

### Character Action Images: IMPLEMENTED

`CHARACTER_ACTION_IMAGES` in `js/ui.js` (line ~2494) provides per-character images for actions (e.g., different visuals when Trump vs Hegseth performs the same action).

### Morning Briefing Images: IMPLEMENTED

Character-specific overrides in `showDailyReport()`:
- Hegseth + warPath >= 2 → `map-tactical.png`
- Kushner + exposure > 60 → `scene-kushner-exposure.png`
- Asmongold + audience > 70 → `scene-asmongold-viral.png`
- Fuentes + standing < 25 → `event-fuentes-isolation.png`
- Trump + approval < 35 → `event-trump-rally.png`

### Character-Voiced Morning Briefings: IMPLEMENTED

`generateMorningBriefing()` in `js/narrative.js` (line ~642) checks `briefings.json > characterOpenings` for character-specific opening lines. Tries character-voiced match for the current condition first, then character default, then falls back to neutral openings.

### Game Over Images: IMPLEMENTED

`showGameOverScreen()` in `js/ui.js` (line ~4414) selects character-specific defeat images and CRT epilogue variants:
- `epilogue-peace-crt.png` for diplomatic victories
- `epilogue-military-crt.png` for military victories
- `epilogue-decline-crt.png` for managed decline endings
- Character-specific defeat images based on how the game was lost

### Idle Asides: IMPLEMENTED

`_pushAmbientContent()` in `js/ui.js` (line ~4242) pulls from `DATA.dialogue.idleAsides[characterId]` — 50 character-specific flavor lines across all 5 characters (stored in `data/dialogue.json`). Fires at ~20% probability during quiet moments.

### Tension-Graded Ambient Cables: IMPLEMENTED

`_pushAmbientContent()` also serves tension-graded ambient headlines:
- `ambient_low_tension` pool when tension < 40
- `ambient_medium_tension` pool when tension 40-70
- `ambient_high_tension` pool when tension > 70
- Polymarket headlines at 30% probability (meta-satirical layer)

Data lives in `data/headlines.json` under `simulation.*`.

---

## PART FIVE: IMAGE USAGE AUDIT — CURRENT COUNT

| Category | Images | Status |
|----------|--------|--------|
| Character portraits | 5 | Used |
| Character select | 5 | Used |
| Character reactions | 5 | Used |
| Iranian portraits | 3 | Used in Iran-focused events |
| Flags | 2 | Used as overlays |
| Story arc images | 8 | Used in arc transitions |
| Epilogue images | 9 | Used (filenames corrected) |
| Event category icons | 4 | Demoted to last-resort fallback only |
| Numbered event images | 20 | All mapped to specific events |
| Crisis event images | 5 | Used |
| Character event images | 24 | Used in character campaigns |
| Chain/story event images | 14 | Used (previously 6 were orphaned) |
| Scene images | 14 | Used as ambient scene panel states |
| Backgrounds/maps | 3 | `map-tactical.png` used for Hegseth briefings, `strait-map.png` loaded by map.js |
| Situation room | 4 | Used in tension-based morning briefings |
| Briefing images | 2 | Used for early/late game briefings |
| Title/UI | 3 | `title-screen.png` used, `victory.png`/`defeat.png` for end states |
| Audio | 1 | Used |

### Filename Fixes: COMPLETED

- `epilogue-peace-crt.png` — filename corrected (previously had extra space: `epilogue-peace-crt.png .png`)
- `title-screen-2.png` — filename corrected (previously had space: `title-screen 2.png`)

### Remaining Orphaned Images

| Image | Status |
|-------|--------|
| `event-e19-ultimatum.png` | Not referenced in any JS file. Could be assigned to `iran_ultimatum` or any ultimatum-framed event. |

### Kushner Conspiracy Arc: IMPLEMENTED

Three-event chain in `js/characters.js`:
- `K05_senate_subpoena` — Senate investigation triggered by exposure
- `K06_pif_renegotiation` — PIF deal renegotiation under pressure
- `K07_the_recording` — The recording surfaces (chain climax)
