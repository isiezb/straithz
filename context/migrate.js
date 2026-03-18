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
    for (const char of characters.characters) {
      // Try to match by known IDs
      const id = guessCharId(char.name);
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

    for (const evt of (events.decisionEvents || [])) {
      // Attach scene data if available
      if (eventScenes?.scenes?.[evt.id]) {
        const scene = eventScenes.scenes[evt.id];
        evt.scene = scene.scene || '';
        evt.characterFlavor = scene.characterFlavor || {};
        // Map consequences back to choices
        if (scene.consequences && evt.choices) {
          evt.choices.forEach((c, i) => {
            c.consequence = scene.consequences[i] || '';
          });
        }
      }

      // Sort into buckets
      const charId = getEventCharacter(evt.id);
      if (charId) {
        if (!charEvents[charId]) charEvents[charId] = [];
        charEvents[charId].push(evt);
      } else if (isAipacEvent(evt.id)) {
        aipacEvts.push(evt);
      } else {
        const cat = evt.category || guessEventCategory(evt);
        (shared[cat] || shared.other).push(evt);
      }
    }

    // Crisis events
    for (const evt of (events.crisisEvents || [])) {
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
    
    // Split simulation headlines by type
    const sim = headlines.simulation || {};
    const ambient = { ambient: { low_tension: [], medium_tension: [], high_tension: [] } };
    const iranProv = { headlines: [] };
    const overnight = { headlines: [] };
    
    for (const [key, val] of Object.entries(sim)) {
      if (key.includes('iran') || key.includes('provocation')) {
        iranProv.headlines = Array.isArray(val) ? val : [val];
      } else if (key.includes('overnight') || key.includes('filler')) {
        overnight.headlines = Array.isArray(val) ? val : [val];
      } else {
        // Try to classify into tension buckets or keep as-is
        ambient.ambient[key] = val;
      }
    }
    
    writeTarget('headlines/ambient.json', ambient);
    writeTarget('headlines/iran-provocations.json', iranProv);
    writeTarget('headlines/overnight.json', overnight);
    writeTarget('headlines/polymarket.json', { headlines: [] }); // New — empty, to be filled
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
  writeTarget('images/manifest.json', createImageManifestStub());

  // --- Migrate Dialogue extras ---
  console.log('\n📂 Migrating dialogue extras...');
  writeTarget('dialogue/idle-asides.json', {});
  writeTarget('dialogue/card-reactions.json', {});
  writeTarget('dialogue/reactions.json', {});
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

function createImageManifestStub() {
  return {
    _comment: 'Fill this in from the Campaign Architecture doc image map',
    events: {},
    characterOverrides: {},
    ambientScenes: {},
    storyArcs: {},
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
