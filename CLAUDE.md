# Strait of Hormuz — Policy Simulator

Browser-based geopolitical strategy game. Vanilla JS, no build tools, no frameworks.
Deployed on Render.com as a static site from GitHub.

## Architecture Overview

```
index.html          — DOM structure, script loading order
css/style.css       — All styles (CRT green phosphor theme)
js/policies.js      — Strategy cards, card dealing, stance effects
js/simulation.js    — SIM state object, entities, daily update, AI, win/lose
js/sprites.js       — Procedural pixel art sprite generation
js/map.js           — Canvas rendering (map, overlays, effects, HUD)
js/characters.js    — 5 playable characters with abilities/lore
js/ui.js            — Terminal UI screens, action panel, events, music, tickers
js/game.js          — Entry point, game loop, phase transitions
```

Script load order matters: `policies → simulation → sprites → map → characters → ui → game`

## Game Flow

```
Character Select → Lore Screen → Morning Briefing → Dayplay (Action Panel) → End Day
                                       ↑                    ↓
                                       ← ← ← Daily Update + Events ← ← ←
```

Phases: `charselect → lore → morning → dayplay → event → overnight → morning (loop)`

## Where To Find Things

### Game State (js/simulation.js)
- `SIM` object: All game state (~99 properties) — metrics, entities, flags
- `SIM_DEFAULTS`: Factory defaults for restart
- `ESCALATION_LADDER` / `IRAN_ESCALATION`: Escalation level definitions
- `SHIPPING_LANES`: Waypoint arrays for tanker routes
- `initSimulation()`: Entity spawning, initial headlines
- `dailyUpdate()`: THE big daily tick — applies stances, Iran AI, proxies, great powers, domestic politics
- `tickSimulation()`: Per-frame entity movement (called 2x/frame during dayplay)
- `checkWinLose()`: 6 lose conditions + 1 win condition (14 consecutive open strait days)
- `checkConsequenceEvents()`: Checks if a DECISION_EVENT should fire
- `calculateGauges()`: Derives 4 composite gauges from raw metrics
- `calculateRating()`: Letter grade S-F from gauges

### Strategy Cards (js/policies.js)
- `STRATEGY_CARDS`: 19 cards across 5 categories (military/diplomatic/economic/intelligence/domestic)
- `CHARACTER_BONUS_CARDS`: 5 exclusive cards (one per character)
- `CONTACT_CARDS`: 5 cards unlocked by Kushner's contact system
- `dealHand()`: Deals cards respecting character pool rules
- `getStanceEffect()` / `getStanceMax()`: Aggregate effects from active stances

### UI Screens (js/ui.js)
- `showDailyReport()`: Morning briefing with gauges, headlines, strategy status
- `showActionPanel()`: Right-side panel during dayplay (3 AP system)
- `showAdjustStrategy()`: Swap one card screen
- `showDecisionEvent()`: Timed decision popup with countdown
- `showInterrupt()`: Random 2-choice interrupts between actions
- `showGameOverScreen()`: Final stats + post-mortem
- `showInitialPick()`: Card selection (currently bypassed — game starts at morning)
- `showCharacterSelect()` / `showLoreScreen()`: Pre-game screens

### UI Utilities (js/ui.js)
- `openTerminal()` / `closeTerminal()`: Show/hide the terminal overlay
- `typewrite()`: Typewriter text effect
- `showToast()`: Toast notifications
- `showFloatingNumber()`: Animated +/- numbers near action panel
- `updateGauges()`: Updates HUD gauge bar
- `updateTickers()`: News + intel scrolling tickers
- `initMusic()`: Background music with mute toggle
- `_applyEffect()` / `_applyEffects()`: Apply metric changes to SIM
- `formatEffectName()`: Human-readable metric names
- `restartGame()`: Full state reset

### Canvas Rendering (js/map.js)
- `renderMap()`: Main render loop — background, lanes, entities, overlays, effects
- `drawProceduralMap()`: Coastlines, labels, grid (when no map-bg.png)
- `drawShippingLaneFlow()`: Animated shipping lane visualization
- `drawStatusPanel()`: Bottom-left stats overlay
- `drawDayCounter()`: Top-left day + AP dots
- `drawEventFlash()`: Event notification card animation
- `triggerEventFlash()`: Trigger flash from outside

### Characters (js/characters.js)
- `CHARACTERS` array: 5 characters (trump, hegseth, kushner, asmongold, fuentes)
- Each has: multipliers (costMult, militaryMult, etc.), cardPool rules, specialAction, lore, morningBrief
- Kushner has unique `contacts` system with trust levels
- `getAdvisorReaction()`: Character-specific quotes

### Sprites (js/sprites.js)
- `SPRITES` object: All generated sprite canvases
- `initSprites()`: Generates all sprites on startup
- Sprite types: tanker, navy, carrier, iranBoat, mine, drone, platform, icons, portraits
- All procedural pixel art at 2x scale

## Key Constants & Config

| Metric | Start Value | Range |
|--------|-------------|-------|
| oilFlow | 25 | 10-100 |
| oilPrice | 145 | 40+ |
| tension | 72 | 0-100 |
| domesticApproval | 55 | 0-100 |
| budget | $900M | 0+ |
| fogOfWar | 82 | 0-100 (lower = better) |
| warPath | 1 | 0-5 |

Game starts: Feb 28, 2026. Date calculated from `SIM.day` offset.

## Escalation Levels
0. DIPLOMATIC TENSIONS (green)
1. NAVAL STANDOFF (yellow-green)
2. LIMITED STRIKES (yellow)
3. AIR CAMPAIGN (orange)
4. GROUND WAR (red)
5. TOTAL WAR (bright red)

## Win Condition
- Strait open 14 consecutive days with oilFlow > 60

## Lose Conditions
- Budget below 0
- Domestic approval < 15 for 5 days
- International standing < 10 for 7 days
- Conflict risk > 95
- 3+ seizures in 5 days
- warPath >= 5 (total war)

## CSS Theme
- Green phosphor CRT aesthetic: `#44dd88` on `#000000`
- CSS variables in `:root` (--green, --yellow, --red, --bg, --border, etc.)
- Action panel, floating numbers, interrupts all in style.css
- Z-index hierarchy: gauge-bar(10), action-panel(50), interrupt(60), terminal(100), lore(150), char-select(200), scanlines(999)

## Common Changes

**Add a new action to the action panel**: Edit `showActionPanel()` and `_executeAction()` in ui.js
**Add a new decision event**: Add to `DECISION_EVENTS` array in simulation.js
**Add a new strategy card**: Add to `STRATEGY_CARDS` in policies.js
**Change starting conditions**: Edit `SIM_DEFAULTS` in simulation.js
**Add a new character**: Add to `CHARACTERS` array in characters.js
**Change daily update logic**: Edit `dailyUpdate()` in simulation.js
**Modify the map**: Edit drawing functions in map.js
**Change UI layout**: Edit css/style.css
