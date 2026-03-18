#!/usr/bin/env node
/**
 * STRAIT OF HORMUZ — Content Migration Script
 * 
 * Reads the existing 12 data/*.json files and restructures them
 * into the new content/ directory format.
 * 
 * Run ONCE, then verify and discard.
 * 
 * Usage: node content/migrate.js --source data/ --target content/
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const sourceDir = args.includes('--source') ? args[args.indexOf('--source') + 1] : 'data';
const targetDir = args.includes('--target') ? args[args.indexOf('--target') + 1] : 'content';

const CHARACTERS = ['trump', 'hegseth', 'kushner', 'asmongold', 'fuentes'];

function readSource(filename) {
  const p = path.resolve(sourceDir, filename);
  if (!fs.existsSync(p)) { console.log(`  ⚠ Not found: ${filename}`); return null; }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeTarget(relPath, data) {
  const p = path.resolve(targetDir, relPath);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  console.log(`  ✓ ${relPath}`);
}

function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Content Migration');
  console.log('═══════════════════════════════════════\n');
  console.log(`  Source: ${path.resolve(sourceDir)}`);
  console.log(`  Target: ${path.resolve(targetDir)}\n`);

  // --- Load existing files ---
  const cards = readSource('cards.json');
  const events = readSource('events.json');
  const interrupts = readSource('interrupts.json');
  const intel = readSource('intel.json');
  const characters = readSource('characters.json');
  const dialogue = readSource('dialogue.json');
  const headlines = readSource('headlines.json');
  const actionScenes = readSource('action-scenes.json');
  const briefings = readSource('briefings.json');
  const eventScenes = readSource('event-scenes.json');
  const dayEndings = readSource('day-endings.json');

  // --- Migrate Characters ---
  console.log('\n📂 Migrating characters...');
  
  if (characters && characters.characters) {
    // characters.characters can be an object keyed by ID or an array
    const charEntries = Array.isArray(characters.characters)
      ? characters.characters.map(c => [guessCharId(c.name), c])
      : Object.entries(characters.characters);

    for (const [rawId, char] of charEntries) {
      const id = rawId || guessCharId(char.name);
      if (!id) { console.log(`  ⚠ Can't identify character: ${char.name}`); continue; }

      const charData = {
        id,
        name: char.name || '',
        title: char.title || '',
        portraitImage: char.portraitImage || '',
        selectImage: char.selectImage || '',
        reactionImages: {},
        ability: char.ability || '',
        abilityDesc: char.abilityDesc || '',
        lore: char.lore || [],
        uniqueResource: { name: '', start: 0, max: 100, inverted: false },
        aipacStart: 50,

        morningBriefings: extractCharBriefings(id, briefings),
        overnightScenes: extractOvernightScenes(id, dayEndings),
        idleAsides: extractIdleAsides(id, dialogue),
        cardReactions: extractCardReactions(id, dialogue),

        advisorReactions: extractAdvisorReactions(id, dialogue),
        restrictedCards: [],
        restrictionRefusals: {},
        epilogues: char.epilogues || {},
        uniqueEvents: char.uniqueEvents || {}
      };

      writeTarget(`characters/${id}.json`, charData);
    }
  }

  // Write character template
  writeTarget('characters/_template.json', createCharTemplate());

  // --- Migrate Events ---
  console.log('\n📂 Migrating events...');

  if (events) {
    const shared = { diplomatic: [], military: [], economic: [], intelligence: [], domestic: [], other: [] };
    const charEvents = {};
    const crisisEvts = [];
    const aipacEvts = [];

    // decisionEvents can be an array or object keyed by ID
    const decisionEntries = Array.isArray(events.decisionEvents)
      ? events.decisionEvents.map(e => [e.id, e])
      : Object.entries(events.decisionEvents || {});

    for (const [evtId, evtData] of decisionEntries) {
      const evt = { id: evtId, ...evtData };

      // Attach scene data if available
      if (eventScenes?.scenes?.[evtId]) {
        const scene = eventScenes.scenes[evtId];
        evt.scene = scene.scene || '';
        if (scene.characterFlavor) evt.characterFlavor = { ...(evt.characterFlavor || {}), ...scene.characterFlavor };
        // Map consequences back to choices
        if (scene.consequences && evt.choices) {
          evt.choices.forEach((c, i) => {
            c.consequence = scene.consequences[i] || '';
          });
        }
      }

      // Sort into buckets
      const charId = getEventCharacter(evtId);
      if (charId) {
        if (!charEvents[charId]) charEvents[charId] = [];
        charEvents[charId].push(evt);
      } else if (isAipacEvent(evtId)) {
        aipacEvts.push(evt);
      } else {
        const cat = evt.category || guessEventCategory(evt);
        (shared[cat] || shared.other).push(evt);
      }
    }

    // Crisis events (may also be object or missing)
    const crisisEntries = Array.isArray(events.crisisEvents)
      ? events.crisisEvents
      : events.crisisEvents ? Object.entries(events.crisisEvents).map(([id, d]) => ({ id, ...d })) : [];

    for (const evt of crisisEntries) {
      evt.isCrisis = true;
      if (eventScenes?.scenes?.[evt.id]) {
        const scene = eventScenes.scenes[evt.id];
        evt.scene = scene.scene || '';
        evt.characterFlavor = scene.characterFlavor || {};
      }
      crisisEvts.push(evt);
    }

    writeTarget('events/shared/crisis.json', { events: crisisEvts });
    writeTarget('events/shared/aipac.json', { events: aipacEvts });
    for (const [cat, evts] of Object.entries(shared)) {
      if (evts.length > 0) writeTarget(`events/shared/${cat}.json`, { events: evts });
    }
    for (const [charId, evts] of Object.entries(charEvents)) {
      writeTarget(`events/character/${charId}.json`, { events: evts });
    }
    writeTarget('events/_template.json', createEventTemplate());

    // Static event data
    if (events.escalationLadder) writeTarget('events/shared/escalation-ladder.json', { levels: events.escalationLadder });
    if (events.iranEscalation) writeTarget('events/shared/iran-escalation.json', { levels: events.iranEscalation });
    if (events.storyArcs) writeTarget('events/shared/story-arcs.json', { arcs: events.storyArcs });
    if (events.winLoseReasons) writeTarget('events/shared/win-lose.json', { reasons: events.winLoseReasons });
  }

  // --- Migrate Headlines ---
  console.log('\n📂 Migrating headlines...');

  if (headlines) {
    writeTarget('headlines/initial.json', { headlines: headlines.initial || [] });
    writeTarget('headlines/actions.json', { actions: headlines.actions || {} });
    if (headlines.bible_actions) writeTarget('headlines/bible-actions.json', { actions: headlines.bible_actions });
    if (headlines.characters) writeTarget('headlines/characters.json', headlines.characters);

    // Split simulation headlines by type
    const sim = headlines.simulation || {};
    const ambient = { ambient: {} };
    const iranProv = { headlines: [] };
    const overnight = { headlines: [] };
    const polymarket = { headlines: sim.polymarket || [] };

    for (const [key, val] of Object.entries(sim)) {
      if (key === 'polymarket') continue; // handled separately
      if (key.includes('iran_provocation')) {
        iranProv.headlines = Array.isArray(val) ? val : [val];
      } else if (key.includes('overnight') || key.includes('filler')) {
        if (Array.isArray(val)) overnight.headlines.push(...val);
        else overnight.headlines.push(val);
      } else {
        // Keep all simulation categories as-is
        ambient.ambient[key] = val;
      }
    }

    writeTarget('headlines/ambient.json', ambient);
    writeTarget('headlines/iran-provocations.json', iranProv);
    writeTarget('headlines/overnight.json', overnight);
    writeTarget('headlines/polymarket.json', polymarket);
  }

  // --- Migrate Cards ---
  console.log('\n📂 Migrating cards...');

  if (cards) {
    writeTarget('cards/strategy.json', {
      cards: cards.strategyCards || {},
      cardLevels: cards.cardLevels || {}
    });
    writeTarget('cards/bonus.json', { cards: cards.characterBonusCards || {} });
    writeTarget('cards/contacts.json', { cards: cards.contactCards || {} });
    writeTarget('cards/synergies.json', { synergies: cards.synergies || [] });
  }

  // --- Migrate Scenes ---
  console.log('\n📂 Migrating scenes...');

  if (actionScenes) {
    writeTarget('scenes/actions/core.json', { actions: actionScenes.actions || {} });
    writeTarget('scenes/actions/bible.json', { actions: actionScenes.bible || {} });
    writeTarget('scenes/actions/contacts.json', { actions: actionScenes.contacts || {} });
    writeTarget('scenes/actions/character-overrides.json', {
      characterVariants: actionScenes.characterVariants || {}
    });
  }

  if (dayEndings) {
    writeTarget('scenes/day-endings/cliffhangers.json', {
      cliffhangers: dayEndings.cliffhangers || {}
    });
  }
  writeTarget('scenes/_template.json', createEventTemplate());

  // --- Migrate Briefings ---
  console.log('\n📂 Migrating briefings...');

  if (briefings) {
    writeTarget('briefings/openings.json', { openings: briefings.openings || {} });
    writeTarget('briefings/closers.json', { closers: briefings.closers || {} });
    writeTarget('briefings/iran-intel.json', { iranIntel: briefings.iranIntel || {} });
    writeTarget('briefings/advisor-names.json', { advisorNames: briefings.advisorNames || {} });
    if (briefings.characterOpenings) {
      writeTarget('briefings/character-openings.json', { characterOpenings: briefings.characterOpenings });
    }
  }

  // --- Migrate Intel ---
  console.log('\n📂 Migrating intel...');

  if (intel) {
    writeTarget('intel/snippets.json', {
      snippets: intel.intelSnippets || [],
      effectNames: intel.effectNames || {},
      briefingTitles: intel.briefingTitles || []
    });
    writeTarget('intel/false-intel.json', { snippets: intel.falseIntelSnippets || [] });
    writeTarget('intel/key-drivers.json', { drivers: intel.keyDrivers || [] });
  }

  // --- Migrate Interrupts ---
  console.log('\n📂 Migrating interrupts...');
  if (interrupts) {
    writeTarget('interrupts/all.json', interrupts);
  }

  // --- Create Image Manifest ---
  console.log('\n📂 Creating image manifest...');
  writeTarget('images/manifest.json', createImageManifest());

  // --- Migrate Dialogue extras ---
  console.log('\n📂 Migrating dialogue extras...');
  // Preserve UI text and non-character dialogue data
  if (dialogue) {
    writeTarget('dialogue/ui-text.json', {
      titleScreen: dialogue.titleScreen || {},
      characterSelect: dialogue.characterSelect || {},
      loreScreen: dialogue.loreScreen || {},
      resourceTiers: dialogue.resourceTiers || {},
      cardRestrictions: dialogue.cardRestrictions || {}
    });
  }
  writeTarget('dialogue/idle-asides.json', {});
  writeTarget('dialogue/card-reactions.json', {});
  // Reactions is a separate data file with contextual news headlines
  const reactions = readSource('reactions.json');
  writeTarget('dialogue/reactions.json', reactions || {});
  writeTarget('dialogue/restriction-refusals.json', {});
  writeTarget('dialogue/_template.json', {});

  console.log('\n✅ Migration complete.\n');
  console.log('Next steps:');
  console.log('  1. Review the generated files in content/');
  console.log('  2. Fill in empty fields (morningBriefings, overnightScenes, etc.)');
  console.log('  3. Run: node content/build.js --validate');
  console.log('  4. Run: node content/build.js');
  console.log('  5. Test the game with the new data/ files\n');
}

// --- HELPERS ---

function guessCharId(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('trump')) return 'trump';
  if (n.includes('hegseth') || n.includes('pete')) return 'hegseth';
  if (n.includes('kushner')) return 'kushner';
  if (n.includes('asmongold')) return 'asmongold';
  if (n.includes('fuentes') || n.includes('nick')) return 'fuentes';
  return null;
}

function getEventCharacter(eventId) {
  if (!eventId) return null;
  const id = eventId.toUpperCase();
  if (id.startsWith('T0') || id.includes('TRUMP')) return 'trump';
  if (id.startsWith('H0') || id.includes('HEGSETH')) return 'hegseth';
  if (id.startsWith('K0') || id.includes('KUSHNER')) return 'kushner';
  if (id.startsWith('A0') || id.includes('ASMONGOLD')) return 'asmongold';
  if (id.startsWith('F0') || id.includes('FUENTES')) return 'fuentes';
  return null;
}

function isAipacEvent(id) {
  return id && (id.includes('aipac') || id.includes('netanyahu') || id.includes('donor_ultimatum'));
}

function guessEventCategory(evt) {
  const id = (evt.id || '').toLowerCase();
  const desc = (evt.description || '').toLowerCase();
  if (id.includes('carrier') || id.includes('seizure') || id.includes('strike') || id.includes('military')) return 'military';
  if (id.includes('summit') || id.includes('talks') || id.includes('diplomatic') || id.includes('channel')) return 'diplomatic';
  if (id.includes('oil') || id.includes('sanctions') || id.includes('economic') || id.includes('price')) return 'economic';
  if (id.includes('intel') || id.includes('cyber') || id.includes('leak')) return 'intelligence';
  return 'other';
}

function extractCharBriefings(charId, briefings) {
  if (!briefings?.characterBriefing?.[charId]) return {};
  return briefings.characterBriefing[charId];
}

function extractOvernightScenes(charId, dayEndings) {
  if (!dayEndings?.reflections?.[charId]) return {};
  return dayEndings.reflections[charId];
}

function extractIdleAsides(charId, dialogue) {
  if (!dialogue?.idleAsides?.[charId]) return [];
  return dialogue.idleAsides[charId];
}

function extractCardReactions(charId, dialogue) {
  if (!dialogue?.cardReactions?.[charId]) return {};
  return dialogue.cardReactions[charId];
}

function extractAdvisorReactions(charId, dialogue) {
  if (!dialogue?.advisorReactions?.[charId]) return {};
  return dialogue.advisorReactions[charId];
}

function createCharTemplate() {
  return {
    id: '',
    name: '',
    title: '',
    portraitImage: '',
    selectImage: '',
    reactionImages: {},
    ability: '',
    abilityDesc: '',
    lore: [''],
    uniqueResource: { name: '', start: 0, max: 100, inverted: false },
    aipacStart: 50,
    morningBriefings: {
      calm: '', elevated: '', crisis: '', low_approval: '', high_oil: '',
      seizure: '', budget_crisis: '', winning: '', war_path_high: '', diplomatic_progress: ''
    },
    overnightScenes: {
      confident: '', anxious: '', angry: '', desperate: '', victorious: '', grieving: '', scheming: ''
    },
    idleAsides: [],
    cardReactions: {
      military: { low: '', med: '', high: '' },
      diplomatic: { low: '', med: '', high: '' },
      economic: { low: '', med: '', high: '' },
      intelligence: { low: '', med: '', high: '' },
      domestic: { low: '', med: '', high: '' }
    },
    advisorReactions: {
      weekStart: ['', '', ''], morningBrief: ['', '', ''],
      highTension: '', lowApproval: '', seizure: '', diplomatic: '',
      victory: '', lowBudget: '', highProxy: '',
      uniqueResourceLow: '', uniqueResourceCritical: ''
    },
    restrictedCards: [],
    restrictionRefusals: {},
    epilogues: { diplomatic: '', military: '', decline: '' },
    uniqueEvents: {}
  };
}

function createEventTemplate() {
  return {
    id: '', title: '', category: '', isCrisis: false,
    conditions: { dayRange: [1, 91], characterOnly: null, minTension: 0, requiredFlags: [] },
    countdown: 0, image: '', description: '', scene: '',
    characterFlavor: {},
    choices: [
      { label: '', flavor: '', effects: {}, consequence: '', storyFlags: {}, chainEvent: null, chainDelay: 0 },
      { label: '', flavor: '', effects: {}, consequence: '', storyFlags: {}, chainEvent: null, chainDelay: 0 }
    ]
  };
}

function createImageManifest() {
  return {
    events: {
      impounded_tanker: { default: 'assets/event-e01-tanker.png' },
      predecessors_ghost: { default: 'assets/event-e02-predecessor.png' },
      admirals_warning: { default: 'assets/event-e03-admiral.png' },
      journalists_call: { default: 'assets/event-e04-journalist.png' },
      british_pm_call: { default: 'assets/event-e05-british-pm.png' },
      first_seizure_attempt: { default: 'assets/event-e06-seizure.png' },
      iran_ultimatum: { default: 'assets/event-e07-iran-doubles.png' },
      oil_markets_panic: { default: 'assets/event-e08-oil-panic.png' },
      carrier_incident: { default: 'assets/event-e09-carrier-incident.png' },
      secret_talks: { default: 'assets/event-e10-shirazi.png' },
      un_showdown: { default: 'assets/event-e11-un-showdown.png' },
      hostage: { default: 'assets/event-e12-hostage.png' },
      china_mediation: { default: 'assets/event-e13-china.png' },
      proxy_ignition: { default: 'assets/event-e14-houthi.png' },
      the_leak: { default: 'assets/event-e17-leak.png' },
      congressional_hearing_big: { default: 'assets/event-e18-congress.png' },
      oman_talks: { default: 'assets/event-e20-muscat.png' },
      intel_breakthrough: { default: 'assets/event-e21-intel-breakthrough.png' },
      cyber_attack_decision: { default: 'assets/event-e23-cyber.png' },
      nuclear_threshold: { default: 'assets/event-crisis-nuclear.png' },
      three_seizures: { default: 'assets/event-crisis-three-seizures.png' },
      friendly_fire: { default: 'assets/event-crisis-friendly-fire.png' },
      cascade_crisis: { default: 'assets/event-crisis-cascade.png' },
      carrier_hit: { default: 'assets/event-crisis-carrier-hit.png' },
      aipac_delegation: { default: 'assets/event-aipac-delegation.png' },
      netanyahu_call: { default: 'assets/event-netanyahu-call.png' },
      aipac_attack_ad: { default: 'assets/event-lobby-attack.png' },
      donor_ultimatum: { default: 'assets/event-donor-ultimatum.png' },
      media_crisis: { default: 'assets/event-e04-journalist.png' },
      militia_attack: { default: 'assets/event-proxy-attack.png' },
      pipeline_sabotage: { default: 'assets/event-oil-chaos.png' },
      assassination_intel: { default: 'assets/event-assassination.png' },
      T01_fox_news_call: { default: 'assets/event-trump-fox.png' },
      T02_deal_on_table: { default: 'assets/event-trump-deal.png' },
      T03_political_capital_crisis: { default: 'assets/event-trump-rally.png' },
      T04_iran_backchannel: { default: 'assets/event-trump-truth-social.png' },
      H01_pentagon_power_play: { default: 'assets/event-hegseth-pentagon.png' },
      H03_shock_and_awe: { default: 'assets/event-hegseth-shock-awe.png' },
      H04_troop_morale: { default: 'assets/event-hegseth-troops.png' },
      K01_mbs_calls: { default: 'assets/event-kushner-mbs.png' },
      K02_exposure_spikes: { default: 'assets/event-kushner-exposure.png' },
      K03_riyadh_summit: { default: 'assets/event-kushner-summit.png' },
      K04_araghchi_gambit: { default: 'assets/event-kushner-zarif.png' },
      A01_osint_discovery: { default: 'assets/event-asmongold-osint.png' },
      A02_disinfo_attack: { default: 'assets/event-asmongold-disinfo.png' },
      A03_credibility_test: { default: 'assets/event-asmongold-stream.png' },
      F01_base_demands_blood: { default: 'assets/event-fuentes-base.png' },
      F02_international_pariah: { default: 'assets/event-fuentes-isolation.png' },
      F03_america_first_rally: { default: 'assets/event-fuentes-congress.png' },
      F04_assassination_whisper: { default: 'assets/event-fuentes-assassination.png' }
    },
    ambientScenes: {
      crisis_high: 'assets/situation-room-crisis.png',
      total_war: 'assets/scene-total-war.png',
      trump_victory: 'assets/scene-trump-victory.png',
      kushner_exposed: 'assets/scene-kushner-exposure.png',
      asmongold_viral: 'assets/scene-asmongold-viral.png',
      fuentes_withdraw: 'assets/event-fuentes-withdraw.png',
      hegseth_carrier: 'assets/scene-hegseth-carrier.png',
      strait_open: 'assets/scene-strait-open.png',
      budget_crisis: 'assets/scene-budget-crisis.png',
      tension_high: 'assets/situation-room-crisis.png',
      tension_medium: 'assets/situation-room-elevated.png',
      tension_low: 'assets/situation-room-calm.png',
      day_one: 'assets/situation-room.png'
    },
    storyArcs: {
      the_spark: 'assets/arc-escalation.png',
      the_squeeze: 'assets/arc-escalation.png',
      diplomatic_window: 'assets/event-diplomatic-win.png',
      false_dawn: 'assets/arc-fog-of-war.png',
      proxy_season: 'assets/arc-proxy-front.png',
      pressure_cooker: 'assets/arc-nuclear-shadow.png',
      crossroads: 'assets/arc-tipping-point.png',
      the_grind: 'assets/arc-long-game.png',
      endgame_setup: 'assets/arc-endgame.png',
      resolution: 'assets/arc-aftermath.png'
    },
    iranPortraits: {
      hardliner: 'assets/iran-tangsiri.png',
      moderate: 'assets/iran-araghchi.png',
      successor: 'assets/iran-mojtaba.png'
    },
    categoryFallbacks: {
      military: 'assets/event-military.png',
      diplomatic: 'assets/event-diplomatic.png',
      economic: 'assets/event-economic.png',
      intelligence: 'assets/event-intel.png'
    }
  };
}

main();
