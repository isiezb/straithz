#!/usr/bin/env node
/**
 * STRAIT OF HORMUZ — Content Build Script
 * 
 * Reads organized content files from content/ directory
 * and compiles them into the 12 runtime JSON files in data/
 * 
 * Usage: node content/build.js [--out data/] [--validate] [--dry-run] [--watch]
 */

const fs = require('fs');
const path = require('path');

// --- CONFIG ---
const CONTENT_DIR = path.resolve(__dirname);
const DEFAULT_OUT = path.resolve(__dirname, '..', 'data');
const CHARACTERS = ['trump', 'hegseth', 'kushner', 'asmongold', 'fuentes'];

// Parse args
const args = process.argv.slice(2);
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : DEFAULT_OUT;
const validateOnly = args.includes('--validate');
const dryRun = args.includes('--dry-run');
const watchMode = args.includes('--watch');

// --- HELPERS ---
const warnings = [];
const errors = [];

function warn(msg) { warnings.push(msg); }
function error(msg) { errors.push(msg); }

function readJSON(filePath) {
  try {
    const abs = path.resolve(CONTENT_DIR, filePath);
    if (!fs.existsSync(abs)) { warn(`File not found: ${filePath}`); return null; }
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    error(`Failed to parse ${filePath}: ${e.message}`);
    return null;
  }
}

function readDir(dirPath) {
  const abs = path.resolve(CONTENT_DIR, dirPath);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => path.join(dirPath, f));
}

function writeJSON(filename, data) {
  if (dryRun) {
    console.log(`  [DRY RUN] Would write ${filename} (${JSON.stringify(data).length} bytes)`);
    return;
  }
  const outPath = path.join(outDir, filename);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  const size = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`  ✓ ${filename} (${size} KB)`);
}

function countDeep(obj) {
  if (Array.isArray(obj)) return obj.length;
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).reduce((sum, v) => sum + countDeep(v), 0);
  }
  return 1;
}

// --- LOADERS ---

function loadCharacters() {
  const chars = {};
  for (const file of readDir('characters')) {
    const data = readJSON(file);
    if (data && data.id) chars[data.id] = data;
  }
  return chars;
}

function loadEvents() {
  const events = [];
  // Shared events
  for (const file of readDir('events/shared')) {
    const data = readJSON(file);
    if (data && data.events) events.push(...data.events);
  }
  // Character events
  for (const file of readDir('events/character')) {
    const data = readJSON(file);
    if (data && data.events) events.push(...data.events);
  }
  return events;
}

function loadHeadlines() {
  const result = { initial: [], simulation: {}, actions: {}, bible_actions: {}, characters: {} };

  const initial = readJSON('headlines/initial.json');
  if (initial) result.initial = initial.headlines || [];

  const actions = readJSON('headlines/actions.json');
  if (actions) result.actions = actions.actions || {};

  const bibleActions = readJSON('headlines/bible-actions.json');
  if (bibleActions) result.bible_actions = bibleActions.actions || {};

  const charHeadlines = readJSON('headlines/characters.json');
  if (charHeadlines) result.characters = charHeadlines;

  const ambient = readJSON('headlines/ambient.json');
  if (ambient && ambient.ambient) {
    // Merge all simulation categories from ambient
    Object.assign(result.simulation, ambient.ambient);
  }

  const polymarket = readJSON('headlines/polymarket.json');
  if (polymarket && polymarket.headlines) {
    result.simulation.polymarket = polymarket.headlines;
  }

  const iranProv = readJSON('headlines/iran-provocations.json');
  if (iranProv && iranProv.headlines) {
    result.simulation.iran_provocations = iranProv.headlines;
  }

  const overnight = readJSON('headlines/overnight.json');
  if (overnight && overnight.headlines) {
    result.simulation.overnight_news_filler = overnight.headlines;
  }

  return result;
}

function loadImageManifest() {
  return readJSON('images/manifest.json') || {};
}

// --- BUILDERS ---
// Each builder assembles one runtime JSON file from the organized content

function buildCharactersJSON(chars) {
  // Runtime format: { characters: { charId: { name, title, ability, ... } } }
  const characters = {};
  for (const id of CHARACTERS) {
    const c = chars[id];
    if (!c) { error(`Missing character file for: ${id}`); continue; }
    characters[id] = {
      name: c.name,
      title: c.title,
      ability: c.ability,
      abilityDesc: c.abilityDesc,
      portraitImage: c.portraitImage,
      selectImage: c.selectImage,
      lore: c.lore || [],
      morningBrief: c.advisorReactions?.morningBrief || [],
      uniqueEvents: c.uniqueEvents || {},
      epilogues: c.epilogues || {}
    };
  }

  return { characters };
}

function buildDialogueJSON(chars) {
  // Runtime format: { advisorReactions: { charId: { weekStart, highTension, ... } } }
  const advisorReactions = {};
  for (const id of CHARACTERS) {
    const c = chars[id];
    if (c && c.advisorReactions) {
      advisorReactions[id] = c.advisorReactions;
    }
  }
  
  // Also load idle asides from dialogue directory
  const idleData = readJSON('dialogue/idle-asides.json');
  const cardReactionsData = readJSON('dialogue/card-reactions.json');
  
  // Merge character idle asides
  const idleAsides = {};
  for (const id of CHARACTERS) {
    const c = chars[id];
    idleAsides[id] = c?.idleAsides || [];
  }
  // Overlay from dialogue file if it exists
  if (idleData) {
    for (const [charId, asides] of Object.entries(idleData)) {
      if (idleAsides[charId]) {
        idleAsides[charId] = [...idleAsides[charId], ...asides];
      }
    }
  }
  
  // Card reactions
  const cardReactions = {};
  for (const id of CHARACTERS) {
    const c = chars[id];
    cardReactions[id] = c?.cardReactions || {};
  }
  if (cardReactionsData) {
    for (const [charId, reactions] of Object.entries(cardReactionsData)) {
      if (cardReactions[charId]) {
        Object.assign(cardReactions[charId], reactions);
      }
    }
  }
  
  // Load UI text fields (titleScreen, characterSelect, loreScreen, resourceTiers, cardRestrictions)
  const uiText = readJSON('dialogue/ui-text.json') || {};

  // Build per-card restriction refusals from character files, with ui-text fallbacks
  const cardRestrictions = {};
  for (const [id, c] of Object.entries(chars)) {
    if (c.restrictionRefusals && Object.keys(c.restrictionRefusals).length > 0) {
      cardRestrictions[id] = c.restrictionRefusals;
    } else if (uiText.cardRestrictions && uiText.cardRestrictions[id]) {
      // Fallback: wrap generic string as _default
      cardRestrictions[id] = { _default: uiText.cardRestrictions[id] };
    }
  }

  return {
    advisorReactions,
    ...(uiText.resourceTiers && { resourceTiers: uiText.resourceTiers }),
    ...(uiText.titleScreen && { titleScreen: uiText.titleScreen }),
    ...(uiText.characterSelect && { characterSelect: uiText.characterSelect }),
    ...(uiText.loreScreen && { loreScreen: uiText.loreScreen }),
    idleAsides,
    cardReactions,
    cardRestrictions
  };
}

function buildBriefingsJSON(chars) {
  const openings = readJSON('briefings/openings.json');
  const closers = readJSON('briefings/closers.json');
  const iranIntel = readJSON('briefings/iran-intel.json');
  const advisorNames = readJSON('briefings/advisor-names.json');
  
  // Character-voiced briefings from character files
  const characterBriefing = {};
  for (const id of CHARACTERS) {
    const c = chars[id];
    if (c && c.morningBriefings) {
      characterBriefing[id] = c.morningBriefings;
    }
  }
  
  // Character openings (tension-tiered per character)
  const charOpenings = readJSON('briefings/character-openings.json');

  return {
    openings: openings?.openings || {},
    iranIntel: iranIntel?.iranIntel || {},
    closers: closers?.closers || {},
    advisorNames: advisorNames?.advisorNames || {},
    characterBriefing,
    characterOpenings: charOpenings?.characterOpenings || {}
  };
}

function buildEventsJSON(events, manifest) {
  // Runtime format: { decisionEvents: {id: {...}, ...}, escalationLadder, storyArcs, etc. }
  const decisionEvents = {};
  const crisisEvents = {};

  for (const evt of events) {
    // Attach image from manifest if not set directly
    if (!evt.image && manifest.events && manifest.events[evt.id]) {
      evt.image = manifest.events[evt.id].default;
    }

    const id = evt.id;
    if (evt.isCrisis) {
      crisisEvents[id] = evt;
    } else {
      decisionEvents[id] = evt;
    }
  }
  
  return {
    decisionEvents,
    crisisEvents,
    // These are static config that rarely changes — load from a separate file or keep inline
    escalationLadder: readJSON('events/shared/escalation-ladder.json')?.levels || [],
    iranEscalation: readJSON('events/shared/iran-escalation.json')?.levels || [],
    storyArcs: readJSON('events/shared/story-arcs.json')?.arcs || [],
    winLoseReasons: readJSON('events/shared/win-lose.json')?.reasons || []
  };
}

function buildEventScenesJSON(events) {
  // Runtime format: { scenes: { eventId: { scene, consequences, characterFlavor } } }
  const scenes = {};
  for (const evt of events) {
    if (evt.scene || evt.characterFlavor || evt.choices?.some(c => c.consequence)) {
      scenes[evt.id] = {
        scene: evt.scene || '',
        consequences: (evt.choices || []).map(c => c.consequence || ''),
        ...(evt.characterFlavor && { characterFlavor: evt.characterFlavor })
      };
    }
  }
  return { scenes };
}

function buildActionScenesJSON() {
  const core = readJSON('scenes/actions/core.json');
  const bible = readJSON('scenes/actions/bible.json');
  const contacts = readJSON('scenes/actions/contacts.json');
  const overrides = readJSON('scenes/actions/character-overrides.json');
  
  return {
    actions: core?.actions || {},
    bible: bible?.actions || {},
    contacts: contacts?.actions || {},
    characterVariants: overrides?.characterVariants || {}
  };
}

function buildHeadlinesJSON(headlines) {
  return headlines;
}

function buildDayEndingsJSON(chars) {
  // Reflections from character overnight scenes
  const reflections = {};
  for (const id of CHARACTERS) {
    const c = chars[id];
    if (c && c.overnightScenes) {
      reflections[id] = c.overnightScenes;
    }
  }
  
  const cliffhangers = readJSON('scenes/day-endings/cliffhangers.json');
  
  return {
    reflections,
    cliffhangers: cliffhangers?.cliffhangers || {}
  };
}

function buildCardsJSON() {
  const strategy = readJSON('cards/strategy.json');
  const bonus = readJSON('cards/bonus.json');
  const contacts = readJSON('cards/contacts.json');
  const synergies = readJSON('cards/synergies.json');
  
  return {
    strategyCards: strategy?.cards || {},
    characterBonusCards: bonus?.cards || {},
    contactCards: contacts?.cards || {},
    synergies: synergies?.synergies || [],
    cardLevels: strategy?.cardLevels || {}
  };
}

function buildIntelJSON() {
  const snippets = readJSON('intel/snippets.json');
  const falseIntel = readJSON('intel/false-intel.json');
  const keyDrivers = readJSON('intel/key-drivers.json');
  
  return {
    intelSnippets: snippets?.snippets || [],
    falseIntelSnippets: falseIntel?.snippets || [],
    keyDrivers: keyDrivers?.drivers || [],
    effectNames: snippets?.effectNames || {},
    briefingTitles: snippets?.briefingTitles || []
  };
}

function buildReactionsJSON() {
  const data = readJSON('dialogue/reactions.json');
  return data || {};
}

function buildInterruptsJSON() {
  const data = readJSON('interrupts/all.json');
  return data || { interrupts: [] };
}

// --- VALIDATION ---

function validate(chars, events, manifest) {
  console.log('\n🔍 Validating...\n');
  
  // Check all characters have required fields
  for (const id of CHARACTERS) {
    const c = chars[id];
    if (!c) { error(`Character '${id}' has no content file`); continue; }
    if (!c.name) error(`${id}: missing 'name'`);
    if (!c.portraitImage) warn(`${id}: missing 'portraitImage' (OK if using procedural sprites)`);
    if (!c.morningBriefings || Object.keys(c.morningBriefings).length === 0)
      warn(`${id}: no morning briefings defined`);
    if (!c.idleAsides || c.idleAsides.length === 0)
      warn(`${id}: no idle asides defined`);
    if (!c.overnightScenes || Object.keys(c.overnightScenes).length === 0)
      warn(`${id}: no overnight scenes defined`);
    if (!c.cardReactions || Object.keys(c.cardReactions).length === 0)
      warn(`${id}: no card reactions defined`);
    if (!c.epilogues) warn(`${id}: no epilogues defined`);
  }
  
  // Check event integrity
  const eventIds = new Set();
  const chainTargets = new Set();
  
  for (const evt of events) {
    if (!evt.id) { error(`Event missing 'id'`); continue; }
    if (eventIds.has(evt.id)) error(`Duplicate event ID: '${evt.id}'`);
    eventIds.add(evt.id);
    
    if (!evt.title) warn(`${evt.id}: missing 'title'`);
    if (!evt.choices || evt.choices.length < 2) warn(`${evt.id}: fewer than 2 choices`);
    if (!evt.scene && !evt.description) warn(`${evt.id}: no scene text or description`);
    
    for (const choice of (evt.choices || [])) {
      if (!choice.label) warn(`${evt.id}: choice missing 'label'`);
      if (choice.chainEvent) chainTargets.add(choice.chainEvent);
    }
  }
  
  // Check chain targets exist
  for (const target of chainTargets) {
    if (!eventIds.has(target)) error(`Chain event '${target}' referenced but not defined`);
  }
  
  // Check image manifest
  if (manifest && manifest.events) {
    for (const [evtId, imgData] of Object.entries(manifest.events)) {
      if (!eventIds.has(evtId)) warn(`Image manifest references unknown event: '${evtId}'`);
    }
  }
  
  // Validate choice effects reference known SIM properties
  const KNOWN_METRICS = new Set([
    'tension', 'oilFlow', 'oilPrice', 'domesticApproval', 'internationalStanding',
    'budget', 'fogOfWar', 'warPath', 'conflictRisk', 'iranAggression',
    'diplomaticCapital', 'seizureCount', 'interceptCount', 'aipacPressure',
    'uniqueResource', 'dealValue'
  ]);
  for (const evt of events) {
    if (!evt.choices) continue;
    for (let i = 0; i < evt.choices.length; i++) {
      const choice = evt.choices[i];
      if (!choice.effects || Object.keys(choice.effects).length === 0) {
        warn(`${evt.id}: choice ${i} has no effects`);
      }
      for (const key of Object.keys(choice.effects || {})) {
        if (!KNOWN_METRICS.has(key)) warn(`${evt.id}: choice ${i} references unknown metric '${key}'`);
      }
    }
  }

  // Validate advisor reactions cover all characters for key event types
  for (const id of CHARACTERS) {
    const c = chars[id];
    if (!c) continue;
    if (!c.advisorReactions) { warn(`${id}: missing advisorReactions entirely`); continue; }
    const required = ['uniqueResourceLow', 'uniqueResourceCritical'];
    for (const r of required) {
      if (!c.advisorReactions[r]) warn(`${id}: missing advisorReaction '${r}'`);
    }
  }

  // Check event images exist on disk
  if (manifest && manifest.events) {
    for (const [evtId, imgData] of Object.entries(manifest.events)) {
      const imgPath = typeof imgData === 'string' ? imgData : imgData.default;
      if (imgPath) {
        const fullPath = path.resolve(__dirname, '..', imgPath);
        if (!fs.existsSync(fullPath)) warn(`Image '${imgPath}' for event '${evtId}' not found on disk`);
      }
    }
  }

  // Check synergies reference valid card IDs
  const synergies = readJSON('cards/synergies.json');
  const strategy = readJSON('cards/strategy.json');
  if (synergies && strategy) {
    const cardIds = new Set(Object.keys(strategy.cards || {}));
    const synList = Array.isArray(synergies.synergies)
      ? synergies.synergies
      : Object.entries(synergies.synergies || {}).map(([id, s]) => ({ id, ...s }));
    for (const syn of synList) {
      for (const req of (syn.requiredCards || [])) {
        if (!cardIds.has(req)) error(`Synergy '${syn.id}' requires card '${req}' which doesn't exist`);
      }
    }
  }
  
  // Report
  console.log(`  Events:     ${eventIds.size}`);
  console.log(`  Characters: ${Object.keys(chars).length}`);
  console.log(`  Chain refs:  ${chainTargets.size}`);
  console.log(`  Warnings:   ${warnings.length}`);
  console.log(`  Errors:     ${errors.length}`);
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(w => console.log(`  - ${w}`));
  }
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }
  
  return errors.length === 0;
}

// --- MAIN ---

function main() {
  console.log('═══════════════════════════════════════');
  console.log('  STRAIT OF HORMUZ — Content Build');
  console.log('═══════════════════════════════════════\n');
  console.log(`  Content dir: ${CONTENT_DIR}`);
  console.log(`  Output dir:  ${outDir}`);
  console.log(`  Mode:        ${dryRun ? 'DRY RUN' : validateOnly ? 'VALIDATE ONLY' : watchMode ? 'BUILD + WATCH' : 'BUILD'}\n`);
  
  // Load source content
  console.log('📂 Loading content...');
  const chars = loadCharacters();
  const events = loadEvents();
  const headlines = loadHeadlines();
  const manifest = loadImageManifest();
  
  console.log(`  Characters: ${Object.keys(chars).length}`);
  console.log(`  Events:     ${events.length}`);
  console.log(`  Headlines:  ${countDeep(headlines)}`);
  
  // Validate
  const valid = validate(chars, events, manifest);
  
  if (validateOnly) {
    process.exit(valid ? 0 : 1);
  }
  
  if (!valid) {
    console.log('\n❌ Build aborted due to errors. Fix errors and retry.');
    console.log('   Use --validate to check without building.\n');
    process.exit(1);
  }
  
  // Build runtime files
  console.log('\n📦 Building runtime JSON files...\n');
  
  writeJSON('characters.json', buildCharactersJSON(chars));
  writeJSON('events.json', buildEventsJSON(events, manifest));
  writeJSON('event-scenes.json', buildEventScenesJSON(events));
  writeJSON('cards.json', buildCardsJSON());
  writeJSON('headlines.json', buildHeadlinesJSON(headlines));
  writeJSON('dialogue.json', buildDialogueJSON(chars));
  writeJSON('reactions.json', buildReactionsJSON());
  writeJSON('briefings.json', buildBriefingsJSON(chars));
  writeJSON('action-scenes.json', buildActionScenesJSON());
  writeJSON('day-endings.json', buildDayEndingsJSON(chars));
  writeJSON('intel.json', buildIntelJSON());
  writeJSON('interrupts.json', buildInterruptsJSON());
  
  console.log('\n✅ Build complete.\n');
  
  if (warnings.length > 0) {
    console.log(`   ${warnings.length} warning(s) — review above.\n`);
  }
}

main();

// --- WATCH MODE ---
if (watchMode && !validateOnly && !dryRun) {
  console.log('👁  Watch mode — rebuilding on content changes...\n');
  const debounceMs = 300;
  let timer = null;
  const rebuild = (filename) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`\n♻  Change detected: ${filename}`);
      warnings.length = 0;
      errors.length = 0;
      try { main(); } catch (e) { console.error('Build error:', e.message); }
    }, debounceMs);
  };
  // Watch content directory recursively for .json files
  fs.watch(CONTENT_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.json')) rebuild(filename);
  });
  // Watch content subdirectories
  for (const sub of ['characters', 'events', 'headlines', 'images']) {
    const dir = path.join(CONTENT_DIR, sub);
    if (fs.existsSync(dir)) {
      fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (filename) rebuild(path.join(sub, filename));
      });
    }
  }
}
