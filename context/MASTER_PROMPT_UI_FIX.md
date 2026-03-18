# UI Overhaul — Status Reference

Post-implementation reference for the 5-part UI overhaul applied to the Strait of Hormuz policy simulator. All problems from the original prompt have been addressed.

---

## Applied Changes

### 1. Map Removed from Dayplay Layout (COMPLETE)

**What was done:**
- `#map-sidebar` set to `display: none` in CSS
- `renderMap()` in `js/map.js` has an early return for `dayplay`, `morning`, `event`, and `overnight` phases
- `js/game.js` wraps the `renderMap()` call with the same phase check to avoid burning CPU on a hidden canvas
- Right column reduced from 35% to 320px fixed width (`#strategy-col` with `flex: 0 0 320px`)
- Character panel made compact: 48x48 portrait, `max-height: 120px`

**Current state:** The map canvas element still exists in the DOM (not deleted) but is hidden and its render loop is short-circuited during all gameplay phases. It could be re-enabled for charselect/lore if needed.

---

### 2. Viewport Overflow Fixed (COMPLETE — required multiple iterations)

**What was done:** Full flex column chain from root to feed, each level with `min-height: 0` to allow shrinking.

**Current CSS layout chain:**
```
#game-container        → 100dvh, flex column, overflow hidden
  #gauge-bar           → 36px max-height, flex-shrink: 0
  #main-layout         → flex: 1, min-height: 0, flex row
    #narrative-col     → flex: 1, flex column, min-height: 0
      #scene-panel     → 200px max-height, min-height: 100px, flex-shrink: 2
      #narrative-feed  → flex: 1, min-height: 0
        .nf-feed       → flex: 1, min-height: 0, overflow-y: auto
      #action-bar      → flex: 0 0 auto, max-height: 35%, overflow-y: auto
    #strategy-col      → flex: 0 0 320px, overflow-y: auto, min-height: 0
```

**Key fixes applied during iteration:**
- `scene-panel` had conflicting `flex-shrink` values (10 then 0 in different rules) — resolved to 10 so it shrinks first on small viewports
- `action-panel` had `overflow: hidden` which was blocking scroll — changed to `overflow-y: auto`
- Used `100dvh` instead of `100vh` for better mobile viewport handling

---

### 3. Feed Visual Hierarchy (COMPLETE)

**What was done:** 10 distinct entry types with unique CSS treatments.

| Entry Type | Left Border | Font | Background Tint |
|------------|-------------|------|-----------------|
| `scene` | green | 14px, 1.7 line-height | green tint |
| `dialogue` | teal | italic, indented | — |
| `alert-critical` | red | bold | red tint |
| `alert-warning` | amber | normal | amber tint |
| `alert-good` | green | normal | — |
| `alert-normal` | muted green | normal | — |
| `stat` | — | 11px monospace | — |
| `headline` | dark green | 12px monospace uppercase | — |
| `command` | — | styled | — |
| `consequence` | — | styled | — |
| `cable` | blue | 12px monospace | blue tint |
| `advisor` | — | styled | — |
| `ambient` | — | styled | — |

Additional features:
- Fade-in animation on all entries (`@keyframes fadeIn`)
- Portrait support (32px) for `dialogue`, `cable`, and `advisor` entries
- Day breaks rendered as centered separators

---

### 4. Actions Produce Narrative Text (COMPLETE)

**What was done:** `_narrateAction()` function in `js/ui.js` pipes action execution into the narrative feed.

**Pipeline per action click:**
1. `command` entry — echoes what the player did
2. `scene` entry — flavor text from `DATA['action-scenes']` with character variant support
3. `stat` entries — delta values for changed metrics
4. `advisor` entry — 35% chance via `_maybeAdvisorReaction()`
5. `headline` entry — from `DATA.headlines.actions`, delayed 600ms

**Supporting functions:**
- `_getActionDisplayName()` — maps 40+ action IDs to human-readable names
- Action toasts are suppressed to avoid redundancy with feed entries

---

### 5. Events Echo to Narrative Feed (COMPLETE)

**What was done:**
- `resolveDecision()` echoes character flavor text to the narrative feed after a decision event closes
- Event scenes from `DATA['event-scenes']` are displayed in the terminal overlay
- Duplicate scene/consequence writes were identified and fixed (was writing the same content twice)

---

## Current Architecture

### File Responsibilities (post-overhaul)

```
index.html          — DOM structure, script loading order
css/style.css       — All styles (CRT green phosphor theme + narrative feed entry styles)
js/policies.js      — Strategy cards, card dealing, stance effects (UNTOUCHED)
js/simulation.js    — SIM state object, entities, daily update, AI, win/lose
js/sprites.js       — Procedural pixel art sprite generation (UNTOUCHED)
js/map.js           — Canvas rendering (disabled during gameplay phases)
js/characters.js    — 5 playable characters with abilities/lore (~1175 lines, Kushner K05-K07 events added)
js/ui.js            — Terminal UI, action panel, events, narrative pipeline (~4848 lines, tutorial skip added)
js/narrative.js     — Narrative data, ambient content, dialogue tables (~838 lines)
js/game.js          — Entry point, game loop, phase transitions (~151 lines, renderMap guard added)
js/sound.js         — Audio management, mute toggle (206 lines)
```

### Narrative Feed Pipeline

```
Player clicks action
  → _executeAction()
    → apply effects to SIM
    → _narrateAction(actionId)
      → command entry (immediate)
      → scene entry from DATA['action-scenes'] (immediate)
      → stat delta entries (immediate)
      → advisor reaction at 35% chance (immediate)
      → headline from DATA.headlines.actions (600ms delay)
    → updateGauges()

Decision event resolves
  → resolveDecision()
    → apply choice effects to SIM
    → echo character flavor text to feed
    → consequence text to feed

During dayplay (every ~15s idle, max 4/day)
  → _pushAmbientContent()
    → picks ONE category: tension-graded cables OR idle asides OR advisor reactions
    → Polymarket headlines (15% chance)
    → Set-based dedup prevents repeats within same day
```

### Layout Hierarchy

```
#game-container (100dvh viewport lock)
  ├── #gauge-bar (48px fixed top bar)
  └── #main-layout (fills remaining height)
       ├── #narrative-col (flex: 1)
       │    ├── #scene-panel (200px max, min 100px, shrinkable, hosts state-driven ambient images)
       │    ├── #narrative-feed > .nf-feed (scrollable feed)
       │    └── #action-bar (auto height, max 35%, scrollable)
       └── #strategy-col (320px fixed)
            ├── character panel (compact, 120px max)
            ├── strategy card pills
            └── intel brief
  #mute-btn (position: fixed, z-index: 9999, visible on all screens, outside normal layout flow)
```

---

## Remaining Issues

### Known Bugs
- **Empty BIBLE_ACTIONS headlines:** Hydrated `DATA` object is not reaching the closure scope inside `_executeAction` for certain bible-category action IDs. Headlines for those actions silently fail. Likely a scoping or timing issue in how closures capture `DATA.headlines.actions`.

### Edge Cases
- **Extreme viewport sizes:** The flex layout handles standard laptop/desktop resolutions well but may still overflow or leave dead space at very small (<900px height) or very large (4K+) viewports. The `flex-shrink: 10` on `#scene-panel` helps but is not a complete solution.
- **Right sidebar text legibility:** On some displays the 320px column results in text that feels cramped at smaller responsive breakpoints (220px at ≤1100px, 200px at ≤900px).

### Fixed Issues
- **Mute button visibility:** Now `position: fixed` with `z-index: 9999`, visible on all screens including character select and lore. No longer lost behind overlays.
- **Restart flow:** `restartGame()` is now async and follows the correct sequence: title → character select → lore. Previously could leave stale state.
- **Ambient spam:** Rewrote `_pushAmbientContent()` — 15s interval (was 4s), 4/day cap, Set-based dedup, single-category pick per tick. No more flooding.
- **Scene panel too small:** Increased from 80px to 200px max-height, min-height 100px, flex-shrink 2. Responsive: 140px at ≤800px height, 100px at ≤600px.
- **Tutorial skip:** Added `[ SKIP TUTORIAL ]` button alongside `[ NEXT ]` in advisor guide system. CSS: `.guide-buttons { display:flex; gap:8px }`, `.guide-skip { border: 1px solid #5a6e80; color: #5a6e80 }`.

### Future Considerations
- The tactical map canvas is hidden but still in the DOM. It could be repurposed as a mini-map toggle, a full-screen strategic view, or removed entirely to simplify the codebase.
- The narrative feed entry type system (10 types) is extensible. New entry types can be added by defining a CSS class and calling the feed-add function with the new type string.
- Advisor reactions are currently at a flat 35% chance. This could be made contextual (higher chance during crises, lower during routine actions).
- The 600ms headline delay is hardcoded. Could be made variable based on action severity.
