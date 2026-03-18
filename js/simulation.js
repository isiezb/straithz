/**
 * Simulation Engine — weekly phase model with geopolitics
 * Entities still move/interact underneath; player sees 4 gauges and makes weekly card picks
 */

const SIM = {
    day: 1,
    hour: 0,
    week: 1,
    weekDay: 1,        // 1-7 within current week
    speed: 2,          // entity movement speed during dayplay
    phase: 'charselect', // charselect|lore|initial_pick|morning|dayplay|event|overnight|weekly_checkin|gameover

    // Action Points
    actionPoints: 3,
    roe: 'defensive',       // rules of engagement: defensive/moderate/aggressive

    // Daily desk tracking
    stanceActivationDay: {},  // {cardId: day} — when each stance was activated
    firedConsequences: [],    // consequence IDs already fired this game
    pendingNews: [],          // news items accumulated during a day
    prevGauges: null,         // gauge snapshot from start of day

    // Core metrics (underlying — player sees 4 gauges)
    oilFlow: 50,
    oilPrice: 95,
    tension: 55,
    domesticApproval: 60,
    internationalStanding: 50,
    conflictRisk: 35,
    budget: 900,

    // Iran state
    iranAggression: 45,
    iranEconomy: 35,
    iranStrategy: 'probing', // restrained/probing/escalatory/confrontational

    // Geopolitics
    fogOfWar: 70,
    diplomaticCapital: 35,
    proxyThreat: 25,
    chinaRelations: 50,
    polarization: 20,
    aipacPressure: 50,
    assassinationRisk: 0,
    warPath: 1,

    // Win/Lose tracking
    straitOpenDays: 0,
    lowApprovalDays: 0,
    lowStandingDays: 0,
    recentSeizureDays: [],

    // Entities
    tankers: [],
    navyShips: [],
    iranBoats: [],
    platforms: [],
    mines: [],
    drones: [],
    carrier: null,

    // Events & headlines
    eventLog: [],
    headlines: [],      // CNN-style ticker
    effects: [],

    // Game state
    gameOver: false,
    gameOverReason: '',
    gameWon: false,
    activeStances: [],  // [{cardId, funding}]
    playedExclusives: [],

    // Crisis
    crisisLevel: 0,
    crisisTimer: 0,
    interceptCount: 0,
    seizureCount: 0,

    // Tycoon layer
    decisionEventActive: false,
    decisionHistory: [],
    lastDecisionDay: 0,
    metricHistory: [],
    weeklyReportActive: false,
    character: null,
    selectedEntity: null,
    selectedType: null,

    // Map incident markers
    incidentMarkers: [],

    // Decision log for situation panel
    decisionLog: [],  // [{title, choice, effects, gaugesBefore, gaugesAfter, day, type:'decision'|'interrupt'}]

    // Player delta accumulators — direct effects from AP actions, decisions, interrupts
    // These persist across daily updates and decay slowly, so player actions feel impactful
    playerDeltas: {
        tension: 0,
        oilFlow: 0,
        domesticApproval: 0,
        internationalStanding: 0,
        iranAggression: 0,
        iranEconomy: 0,
        fogOfWar: 0,
        diplomaticCapital: 0,
        conflictRisk: 0,
    },

    // Implementation delay queue
    pendingEffects: [],  // [{cardId, cardName, category, funding, effects, activateOnDay}]

    // Intel confidence system
    intelBriefings: [],  // [{text, confidence, accurate, day}]

    // Character unique resource (copied from character on init)
    uniqueResource: 0,
    _leakCount: 0, // Kushner leak tracking

    // Story system
    storyFlags: {},           // narrative flags set by event choices, checked by follow-ups
    scheduledEvents: [],      // [{eventId, triggerDay, sourceEvent}] - chain follow-ups
    storyArc: 'the_spark',    // current narrative phase

    iranFactionBalance: 50,    // 0=hardliner(Tangsiri), 100=moderate(Araghchi)
    iranVisibleMoves: [],      // [{text, type:'hardliner'|'moderate'|'ambiguous', day}]

    // Reputation tracks
    reputation: { reliability: 50, proportionality: 50, creativity: 50 },
    memoryTags: [],  // decision memory tags for consequence system
    // Trump: Victory Narrative
    victoryNarrative: 0,
    lastPublicWinDay: -99,
    publicWinType: '',
    _prevInterceptCount: 0,
    _prevSeizureCount: 0,
    _prevIranAggression: 45,
    _prevOilPrice: 95,
    // Hegseth: Battle Reports
    _dayStartWarPath: 1,
    // Kushner: Deal Value
    dealValue: 0,
    // Fuentes: Withdrawal
    withdrawalProgress: 0,
    withdrawalLocked: false,
    // Asmongold: Predictions
    predictions: [],
    audience: 50,
};

/** Default values for SIM reset — used by restartGame() */
const SIM_DEFAULTS = {
    day: 1, hour: 0, week: 1, weekDay: 1, speed: 2,
    phase: 'morning', actionPoints: 3, swapsToday: 0,
    stanceActivationDay: {}, firedConsequences: [], pendingNews: [], prevGauges: null,
    oilFlow: 50, oilPrice: 95, tension: 55, domesticApproval: 60,
    internationalStanding: 50, conflictRisk: 35, budget: 900,
    iranAggression: 45, iranEconomy: 35, iranStrategy: 'probing',
    fogOfWar: 70, diplomaticCapital: 35, proxyThreat: 25,
    chinaRelations: 50, polarization: 20, aipacPressure: 50,
    assassinationRisk: 0, warPath: 1,
    straitOpenDays: 0, lowApprovalDays: 0, lowStandingDays: 0,
    recentSeizureDays: [],
    tankers: [], navyShips: [], iranBoats: [], platforms: [],
    mines: [], drones: [], carrier: null,
    eventLog: [], headlines: [], effects: [],
    gameOver: false, gameOverReason: '', gameWon: false,
    activeStances: [], playedExclusives: [],
    crisisLevel: 0, crisisTimer: 0,
    interceptCount: 0, seizureCount: 0,
    decisionEventActive: false, decisionHistory: [], lastDecisionDay: 0,
    metricHistory: [], incidentMarkers: [], pendingEffects: [],
    intelBriefings: [],
    uniqueResource: 0, _leakCount: 0,
    decisionLog: [], weeklyReportActive: false, selectedEntity: null, selectedType: null,
    playerDeltas: { tension: 0, oilFlow: 0, domesticApproval: 0, internationalStanding: 0, iranAggression: 0, iranEconomy: 0, fogOfWar: 0, diplomaticCapital: 0, conflictRisk: 0 },
    _assassinationEventFired: false,
    roe: 'defensive',
    _guideSeen: false,
    highPolarizationDays: 0,
    storyFlags: {}, scheduledEvents: [], storyArc: 'the_spark',
    iranFactionBalance: 50, iranVisibleMoves: [],
    reputation: { reliability: 50, proportionality: 50, creativity: 50 },
    memoryTags: [],
    // Trump: Victory Narrative
    victoryNarrative: 0,
    lastPublicWinDay: -99,
    publicWinType: '',
    _prevInterceptCount: 0,
    _prevSeizureCount: 0,
    _prevIranAggression: 45,
    _prevOilPrice: 95,
    // Hegseth: Battle Reports
    _dayStartWarPath: 1,
    // Kushner: Deal Value
    dealValue: 0,
    // Fuentes: Withdrawal
    withdrawalProgress: 0,
    withdrawalLocked: false,
    // Asmongold: Predictions
    predictions: [],
    audience: 50,
    // AIPAC tracking
    _aipacApprovalPenaltyDays: 0,
    _aipacDiplomaticRestrictionDays: 0,
    _proxyIgnoredDays: 0,
};

const ESCALATION_LADDER = [
    { level: 0, name: '', description: '', color: '#44dd88' },
    { level: 1, name: '', description: '', color: '#88aa44' },
    { level: 2, name: '', description: '', color: '#ddaa44' },
    { level: 3, name: '', description: '', color: '#dd6644' },
    { level: 4, name: '', description: '', color: '#dd4444' },
    { level: 5, name: '', description: '', color: '#ff0000' },
];

// Iran's escalation ladder (AI side)
const IRAN_ESCALATION = [
    { level: 0, name: '', triggers: '' },
    { level: 1, name: '', triggers: '' },
    { level: 2, name: '', triggers: '' },
    { level: 3, name: '', triggers: '' },
    { level: 4, name: '', triggers: '' },
    { level: 5, name: '', triggers: '' },
];

// Story Arc Phases — 13-week structure from content bible
const STORY_ARCS = [
    { id: 'the_spark',      name: '',          startDay: 1,  endDay: 7,
      brief: '',
      color: '#dd4444', image: 'assets/arc-escalation.png' },
    { id: 'the_squeeze',    name: '',        startDay: 8,  endDay: 14,
      brief: '',
      color: '#dd6644', image: 'assets/arc-escalation.png' },
    { id: 'diplomatic_window', name: '', startDay: 15, endDay: 21,
      brief: '',
      color: '#ddaa44', image: 'assets/event-diplomatic.png' },
    { id: 'false_dawn',     name: '',     startDay: 22, endDay: 28,
      brief: '',
      color: '#dd8844', image: 'assets/arc-fog-of-war.png' },
    { id: 'proxy_season',   name: '',       startDay: 29, endDay: 35,
      brief: '',
      color: '#aa44dd', image: 'assets/arc-proxy-front.png' },
    { id: 'pressure_cooker', name: '', startDay: 36, endDay: 42,
      brief: '',
      color: '#dd4488', image: 'assets/arc-nuclear-shadow.png' },
    { id: 'crossroads',     name: '',         startDay: 43, endDay: 49,
      brief: '',
      color: '#4488dd', image: 'assets/arc-tipping-point.png' },
    { id: 'the_grind',      name: '',          startDay: 50, endDay: 56,
      brief: '',
      color: '#888888', image: 'assets/arc-long-game.png' },
    { id: 'endgame_setup',  name: '',            startDay: 57, endDay: 70,
      brief: '',
      color: '#44dd88', image: 'assets/arc-endgame.png' },
    { id: 'resolution',     name: '',         startDay: 71, endDay: 999,
      brief: '',
      color: '#ffffff', image: 'assets/arc-aftermath.png' },
];

function getCurrentStoryArc() {
    return STORY_ARCS.find(a => SIM.day >= a.startDay && SIM.day <= a.endDay) || STORY_ARCS[0];
}

// 4 Composite Gauges (0-100)
function calculateGauges() {
    const stability = Math.max(0, Math.min(100, Math.round(
        100 - SIM.tension * 0.4 - SIM.conflictRisk * 0.3 - SIM.crisisLevel * 8 - SIM.warPath * 10
    )));
    const economy = Math.max(0, Math.min(100, Math.round(
        SIM.oilFlow * 0.4 + (150 - SIM.oilPrice) * 0.2 + Math.min(50, Math.max(0, SIM.budget / 20)) * 0.4
    )));
    const support = Math.max(0, Math.min(100, Math.round(
        SIM.domesticApproval * 0.5 + SIM.internationalStanding * 0.3 + (100 - SIM.polarization) * 0.2
    )));
    const intel = Math.max(0, Math.min(100, Math.round(100 - SIM.fogOfWar)));

    return { stability, economy, support, intel };
}

function calculateRating() {
    const g = calculateGauges();
    const score = Math.round(g.stability * 0.30 + g.economy * 0.25 + g.support * 0.30 + g.intel * 0.15);
    let grade, label;
    if (score >= 90) { grade = 'S'; label = 'Outstanding'; }
    else if (score >= 80) { grade = 'A'; label = 'Excellent'; }
    else if (score >= 65) { grade = 'B'; label = 'Good'; }
    else if (score >= 50) { grade = 'C'; label = 'Adequate'; }
    else if (score >= 35) { grade = 'D'; label = 'Poor'; }
    else { grade = 'F'; label = 'Failing'; }
    return { grade, label, score };
}

// Shipping lanes
const SHIPPING_LANES = [
    { points: [[0.95, 0.85], [0.75, 0.65], [0.58, 0.52], [0.48, 0.47], [0.35, 0.43], [0.15, 0.42], [0.0, 0.45]], dir: 'in' },
    { points: [[0.0, 0.50], [0.15, 0.48], [0.35, 0.48], [0.48, 0.52], [0.58, 0.57], [0.75, 0.70], [0.95, 0.90]], dir: 'out' },
];

function initSimulation() {
    // Crisis start: tankers in transit, no seizure on day 1
    for (let i = 0; i < 5; i++) spawnTanker();
    SIM.seizureCount = 0;

    // IRGC boats already deployed in the strait
    spawnIranBoat(0.52, 0.50);
    spawnIranBoat(0.48, 0.55);
    spawnIranBoat(0.55, 0.48);

    // Mines laid in shipping lanes
    SIM.mines.push({ x: 0.45, y: 0.49, active: true, id: 'MINE-001' });
    SIM.mines.push({ x: 0.50, y: 0.53, active: true, id: 'MINE-002' });

    // Navy ships responding to crisis (USS already present via game setup)
    spawnNavyShip(0.60, 0.58);
    spawnNavyShip(0.62, 0.62);
    spawnNavyShip(0.58, 0.55);

    const platformPositions = [[0.08, 0.38], [0.15, 0.45], [0.22, 0.42], [0.10, 0.50]];
    for (const [x, y] of platformPositions) {
        SIM.platforms.push({ x, y, active: true, health: 100 });
    }

    // Initial crisis headlines — loaded from DATA.headlines.initial
    // Suppress toasts during init (they clutter the opening)
    SIM._suppressToasts = true;
    const _initHL = (DATA.headlines && DATA.headlines.initial) || [];
    const _initLevels = ['critical','critical','warning','critical','warning','warning','critical','warning'];
    for (let i = 0; i < _initHL.length; i++) {
        addHeadline(_initHL[i], _initLevels[i] || 'warning');
    }
    SIM._suppressToasts = false;
}

function spawnTanker() {
    const lane = SHIPPING_LANES[Math.floor(Math.random() * SHIPPING_LANES.length)];
    SIM.tankers.push({
        lane, progress: Math.random(),
        speed: 0.0004 + Math.random() * 0.0002,
        seized: false, escorted: false, damaged: false,
        id: 'TKR-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        cargo: Math.floor(Math.random() * 2000000 + 500000),
        flag: ['LBR', 'PAN', 'MHL', 'GBR', 'NOR', 'GRC', 'JPN'][Math.floor(Math.random() * 7)],
    });
}

function spawnNavyShip(x, y) {
    const types = ['DDG', 'CG', 'FFG'];
    const type = types[Math.floor(Math.random() * types.length)];
    SIM.navyShips.push({
        x, y, targetX: x, targetY: y,
        patrolling: true, intercepting: null, speed: 0.001,
        id: 'USN-' + type + '-' + Math.random().toString(36).substr(2, 3).toUpperCase(),
        type, readiness: 100,
    });
}

function spawnIranBoat(x, y) {
    SIM.iranBoats.push({
        x, y, targetX: x, targetY: y,
        aggressive: SIM.iranAggression > 50,
        speed: 0.0015,
        id: 'IRGCN-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        targeting: null, fleeing: false,
    });
}

function tickSimulation() {
    // Entity movement runs during dayplay only (game.js drives day advancement)
    if (SIM.gameOver || SIM.phase !== 'dayplay') return;
    if (SIM.decisionEventActive) return;

    const spd = SIM.speed || 2;

    // Move tankers
    for (let i = SIM.tankers.length - 1; i >= 0; i--) {
        const t = SIM.tankers[i];
        if (t.seized) continue;
        t.progress += t.speed * spd;
        if (t.progress >= 1) {
            SIM.tankers.splice(i, 1);
            spawnTanker();
        }
    }

    updateIranBoatBehavior();
    updateNavyBehavior();

    // Move navy ships
    for (const ship of SIM.navyShips) {
        ship.x += (ship.targetX - ship.x) * 0.02 * spd;
        ship.y += (ship.targetY - ship.y) * 0.02 * spd;
    }

    // Move Iran boats
    for (const boat of SIM.iranBoats) {
        const moveSpeed = boat.fleeing ? 0.04 : 0.025;
        boat.x += (boat.targetX - boat.x) * moveSpeed * spd;
        boat.y += (boat.targetY - boat.y) * moveSpeed * spd;
    }

    // Move drones
    for (const drone of SIM.drones) {
        drone.angle += 0.002 * spd;
        drone.x = drone.cx + Math.cos(drone.angle) * drone.radius;
        drone.y = drone.cy + Math.sin(drone.angle) * drone.radius;
    }

    // Move carrier
    if (SIM.carrier) {
        SIM.carrier.x += (SIM.carrier.targetX - SIM.carrier.x) * 0.005 * spd;
        SIM.carrier.y += (SIM.carrier.targetY - SIM.carrier.y) * 0.005 * spd;
        if (Math.random() < 0.01) {
            SIM.carrier.targetX = 0.65 + Math.random() * 0.15;
            SIM.carrier.targetY = 0.60 + Math.random() * 0.10;
        }
    }

    updateMineHazards();
}

/**
 * Check for consequence events based on active stances and their duration.
 * Returns an event object or null. Called from game.js advanceDay().
 */
function checkConsequenceEvents() {
    // Check scheduled chain events first — these always fire on their day
    if (SIM.scheduledEvents && SIM.scheduledEvents.length > 0) {
        const dueIdx = SIM.scheduledEvents.findIndex(se => SIM.day >= se.triggerDay);
        if (dueIdx !== -1) {
            const scheduled = SIM.scheduledEvents.splice(dueIdx, 1)[0];
            // Look up event by ID from all event pools
            const allPools = [...DECISION_EVENTS, ...(typeof CRISIS_EVENTS !== 'undefined' ? CRISIS_EVENTS : [])];
            const chainEvent = allPools.find(e => e.id === scheduled.eventId);
            if (chainEvent) return chainEvent;
        }
    }

    if (!SIM.activeStances || SIM.activeStances.length === 0) return null;

    // Three-act pacing: event frequency varies by day (reduced for less chaos)
    let eventChance;
    if (SIM.day <= 10) eventChance = 0.30;        // Ease-in: let player learn
    else if (SIM.day <= 30) eventChance = 0.45;   // Rising action
    else if (SIM.day <= 55) eventChance = 0.35;   // Sustained: every 2-3 days
    else eventChance = 0.45;                       // Endgame

    if (Math.random() > eventChance) return null;

    // Fire card consequence inline (headline + effect), then check for decision events
    if (Math.random() < 0.6) {
        triggerCardConsequence();
    } else {
        triggerAmbientEvent();
    }

    // Iran provocations during day
    const provRate = SIM.iranStrategy === 'confrontational' ? 0.35 :
                     SIM.iranStrategy === 'escalatory' ? 0.20 :
                     SIM.iranStrategy === 'probing' ? 0.08 : 0.02;
    if (Math.random() < provRate) triggerIranProvocation();

    // Crisis escalation
    if (SIM.tension > 80 && Math.random() < 0.15) escalateCrisis();

    // Check for crisis telephone events first (override normal events)
    const crisisEvent = checkCrisisEvents();
    if (crisisEvent) return crisisEvent;

    // Check for structured decision events
    const usedIds = SIM.decisionHistory.map(d => d.id);
    let allEvents = [...DECISION_EVENTS];
    // Character unique events can replay (only 3-4 per character)
    const charEvents = (SIM.character && SIM.character.uniqueEvents) ? SIM.character.uniqueEvents : [];

    // Base events: no replay. Character events: allow replay after 10 days
    const eligible = allEvents.filter(e =>
        !usedIds.includes(e.id) &&
        SIM.day >= (e.minDay || 1) && SIM.day <= (e.maxDay || 999) &&
        (!e.condition || e.condition())
    );
    // Add character events — replay allowed if last use was 10+ days ago
    for (const ce of charEvents) {
        const lastUse = SIM.decisionHistory.filter(d => d.id === ce.id).pop();
        if ((!lastUse || SIM.day - lastUse.day >= 10) &&
            SIM.day >= (ce.minDay || 1) && SIM.day <= (ce.maxDay || 999) &&
            (!ce.condition || ce.condition())) {
            eligible.push(ce);
        }
    }

    if (eligible.length === 0) return null;
    return eligible[Math.floor(Math.random() * eligible.length)];
}

/**
 * Generate overnight news summary based on the day's events
 */
function generateOvernightNews() {
    const news = [];
    const g = calculateGauges();
    const prev = SIM.prevGauges || g;

    // Gauge changes
    const dStab = g.stability - prev.stability;
    const dEcon = g.economy - prev.economy;
    const dSupp = g.support - prev.support;
    const dIntel = g.intel - prev.intel;

    const _gc = (DATA.headlines && DATA.headlines.simulation && DATA.headlines.simulation.overnight_gauge_changes) || {};
    if (dStab < -8) news.push({ text: _gc.stability_drop || '', level: 'critical' });
    else if (dStab > 8) news.push({ text: _gc.stability_rise || '', level: 'good' });

    if (dEcon < -8) news.push({ text: _gc.economy_drop || '', level: 'warning' });
    else if (dEcon > 8) news.push({ text: _gc.economy_rise || '', level: 'good' });

    if (dSupp < -8) news.push({ text: _gc.support_drop || '', level: 'warning' });
    if (dIntel > 10) news.push({ text: _gc.intel_rise || '', level: 'good' });

    // Recent headlines from today
    const todayHeadlines = SIM.headlines.filter(h => h.day === SIM.day);
    const criticals = todayHeadlines.filter(h => h.level === 'critical');
    if (criticals.length > 0) {
        news.push({ text: criticals[criticals.length - 1].text, level: 'critical' });
    }
    const goods = todayHeadlines.filter(h => h.level === 'good');
    if (goods.length > 0) {
        news.push({ text: goods[goods.length - 1].text, level: 'good' });
    }

    // Ambient filler if nothing happened
    if (news.length === 0) {
        const fillers = DATA.events.overnightNewsFiller || [];
        if (fillers.length > 0) news.push({ text: fillers[Math.floor(Math.random() * fillers.length)], level: 'normal' });
    }

    return news;
}

function updateMineHazards() {
    for (const mine of SIM.mines) {
        if (mine.detonated) continue;
        for (const t of SIM.tankers) {
            if (t.seized || t.damaged) continue;
            const pos = getLanePosition(t.lane, t.progress);
            const dx = pos.x - mine.x, dy = pos.y - mine.y;
            if (Math.sqrt(dx * dx + dy * dy) < 0.025) {
                mine.detonated = true;
                t.damaged = true;
                t.speed *= 0.3;
                SIM.tension += 8;
                SIM.oilFlow = Math.max(10, SIM.oilFlow - 4);
                SIM.oilPrice += 5;
                addHeadline(`BREAKING: Tanker ${t.id} strikes mine near strait`, 'critical');
                spawnEffect(mine.x, mine.y, 'explosion');
                addIncidentMarker(mine.x, mine.y, 'mine', SIM.day);
            }
        }
    }
    SIM.mines = SIM.mines.filter(m => !m.detonated);
}

// Decorative entity movement — no complex targeting/seizure logic
// Seizures and intercepts are calculated statistically in dailyUpdate()
function updateIranBoatBehavior() {
    for (const boat of SIM.iranBoats) {
        boat.aggressive = SIM.iranAggression > 40;
        if (boat.fleeing) {
            boat.targetX = 0.4 + Math.random() * 0.2;
            boat.targetY = 0.25;
            if (boat.y < 0.30) boat.fleeing = false;
            continue;
        }
        // Decorative patrol
        if (Math.random() < 0.03) {
            boat.targetX = 0.35 + Math.random() * 0.3;
            boat.targetY = 0.3 + Math.random() * 0.2;
        }
    }
}

function updateNavyBehavior() {
    for (const ship of SIM.navyShips) {
        // Decorative patrol
        if (Math.random() < 0.02) {
            ship.targetX = 0.35 + Math.random() * 0.35;
            ship.targetY = 0.45 + Math.random() * 0.25;
        }
    }
}

function spawnEffect(x, y, type) {
    SIM.effects.push({ x, y, type, life: 60, maxLife: 60 });
}

function addHeadline(text, level) {
    SIM.headlines.push({ text, level, day: SIM.day, hour: SIM.hour, time: Date.now() });
    SIM.eventLog.push({ text, level, day: SIM.day, hour: SIM.hour });
    // Show toast for critical/good headlines (suppressed during init)
    if ((level === 'critical' || level === 'good') && !SIM._suppressToasts) {
        if (typeof showToast === 'function') showToast(text, level);
    }
    // Push to narrative feed
    if (typeof addNarrative === 'function') {
        const type = (level === 'critical' || level === 'good') ? 'alert' : 'headline';
        addNarrative(type, text, { level: level || 'normal' });
    }
}

function addIncidentMarker(x, y, type, day) {
    SIM.incidentMarkers.push({ x, y, type, day });
}

// ======================== DAILY UPDATE ========================

function dailyUpdate() {
    // --- Process pending delayed effects ---
    processPendingEffects();

    // --- Generate daily intel briefing ---
    if (Math.random() < 0.7) generateIntelItem();

    // --- Iran Strategy AI ---
    updateIranStrategy();

    // --- Proxy Threat ---
    updateProxyThreats();

    // --- Great Powers ---
    updateGreatPowers();

    // --- Domestic Politics ---
    updateDomesticPolitics();

    // --- AIPAC / Hill Support ---
    updateAIPAC();

    // --- Core Metrics (with playerDelta preservation) ---
    // playerDeltas accumulate from AP actions, decisions, and interrupts.
    // They decay 12% per day so effects last ~8 days at meaningful strength.
    const pd = SIM.playerDeltas;
    const DECAY = 0.88; // retain 88% per day

    const tensionDelta = getStanceEffect('tension');
    const protectionBonus = getStanceEffect('oilFlowProtection');
    const priceDelta = getStanceEffect('oilPrice');
    const costDelta = getStanceEffect('cost');

    // Apply character cost multiplier
    let adjustedCost = costDelta;
    if (SIM.character && SIM.character.costMult) {
        for (const stance of SIM.activeStances) {
            const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS)];
            const card = allCards.find(c => c.id === stance.cardId);
            if (card && card.category === 'economic' && card.effects[stance.funding]) {
                const cardCost = card.effects[stance.funding].cost || 0;
                if (cardCost > 0) adjustedCost -= cardCost * (1 - SIM.character.costMult);
            }
        }
    }

    // Weekly cost divided by 7 for daily
    SIM.budget -= adjustedCost / 7;

    // Budget income: coalition allies + oil revenue + base congressional funding
    const coalitionIncome = (SIM.internationalStanding / 100) * 5; // up to $5M/day from allies
    const oilRevenue = (SIM.oilFlow / 100) * 4; // up to $4M/day from flowing oil
    const baseFunding = 3; // $3M/day congressional baseline
    // AIPAC influence on congressional funding
    let congressFundingMult = 1.0;
    if (SIM.aipacPressure > 70) congressFundingMult = 1.2;
    else if (SIM.aipacPressure < 30) congressFundingMult = 0.8;
    SIM.budget += coalitionIncome + oilRevenue + baseFunding * congressFundingMult;

    // Tension — card stances set baseline drift, playerDeltas shift the target (0.3x like other metrics)
    const dipBonus = (SIM.diplomaticCapital - 50) * 0.08;
    const targetTension = Math.max(0, Math.min(100, 15 + tensionDelta - dipBonus + pd.tension * 0.3));
    SIM.tension += (targetTension - SIM.tension) * 0.10;
    SIM.tension += SIM.crisisLevel * 1.5;
    // Oil flow — derives from tension but playerDelta shifts it
    const baseFlow = 100 - (SIM.tension * 0.5);
    SIM.oilFlow = Math.max(10, Math.min(100, baseFlow + protectionBonus * 0.3 + pd.oilFlow));
    const seizedCount = SIM.tankers.filter(t => t.seized).length;
    SIM.oilFlow = Math.max(10, SIM.oilFlow - seizedCount * 3);
    SIM.oilFlow -= SIM.proxyThreat * 0.08;
    SIM.oilFlow = Math.max(10, SIM.oilFlow);

    // Oil price
    const targetPrice = 80 + (100 - SIM.oilFlow) * 1.5 + priceDelta;
    SIM.oilPrice += (targetPrice - SIM.oilPrice) * 0.12;

    // Domestic approval — playerDelta shifts target
    let approvalDelta = getStanceEffect('domesticApproval');
    if (SIM.character && SIM.character.approvalMult && approvalDelta < 0) {
        approvalDelta *= SIM.character.approvalMult;
    }
    const targetApproval = Math.max(0, Math.min(100, 65 + approvalDelta + pd.domesticApproval));
    SIM.domesticApproval += (targetApproval - SIM.domesticApproval) * 0.08;
    if (seizedCount > 0) SIM.domesticApproval -= seizedCount * 0.5;
    if (SIM.interceptCount > 0) SIM.domesticApproval += Math.min(SIM.interceptCount * 0.3, 2);
    if (SIM.oilFlow < 25) SIM.domesticApproval -= 1.5;
    if (SIM.oilFlow < 15) SIM.domesticApproval -= 2;
    if (SIM.budget < 0) SIM.domesticApproval -= 0.5;
    if (SIM.polarization > 50) SIM.domesticApproval -= (SIM.polarization - 50) * 0.04;
    SIM.domesticApproval = Math.max(0, Math.min(100, SIM.domesticApproval));

    // International standing — playerDelta shifts target
    let standingDelta = getStanceEffect('internationalStanding');
    const targetStanding = Math.max(0, Math.min(100, 70 + standingDelta + pd.internationalStanding));
    SIM.internationalStanding += (targetStanding - SIM.internationalStanding) * 0.08;
    SIM.internationalStanding = Math.max(0, Math.min(100, SIM.internationalStanding));

    // Iran aggression — card effects 0.6x, playerDelta 0.3x (boosted so cards matter)
    const aggrDelta = getStanceEffect('iranAggression');
    SIM.iranAggression = Math.max(0, Math.min(100, SIM.iranAggression + aggrDelta * 0.6 + pd.iranAggression * 0.3));
    if (SIM.iranEconomy < 30) SIM.iranAggression += 0.15;

    // Iran economy — card effects 0.4x, playerDelta 0.3x (boosted so sanctions bite)
    const econDelta = getStanceEffect('iranEconomy');
    SIM.iranEconomy = Math.max(0, Math.min(100, SIM.iranEconomy + econDelta * 0.4 + pd.iranEconomy * 0.3));
    if (SIM.chinaRelations < 30) SIM.iranEconomy += 0.3;

    // Fog of war — card effects 0.5x, playerDelta 0.3x, natural drift reduced
    let fogDelta = getStanceEffect('fogOfWar');
    SIM.fogOfWar = Math.max(0, Math.min(100, SIM.fogOfWar + 0.4 + fogDelta * 0.5 + pd.fogOfWar * 0.3));

    // Conflict risk — derived, playerDelta shifts it
    const crDelta = getStanceEffect('conflictRisk');
    SIM.conflictRisk = Math.max(0, Math.min(100,
        SIM.tension * 0.35 + SIM.iranAggression * 0.25 + crDelta + SIM.crisisLevel * 8 + SIM.warPath * 5 + pd.conflictRisk
    ));

    // Diplomatic capital — card effects 0.7x, playerDelta 0.3x (diplomacy matters)
    const dipDelta2 = getStanceEffect('diplomaticCapital');
    if (SIM.character && SIM.character.diplomacyMult && dipDelta2 > 0) {
        SIM.diplomaticCapital += dipDelta2 * SIM.character.diplomacyMult * 0.7;
    } else {
        SIM.diplomaticCapital += dipDelta2 * 0.7;
    }
    SIM.diplomaticCapital += pd.diplomaticCapital * 0.3;
    SIM.diplomaticCapital = Math.max(0, Math.min(100, SIM.diplomaticCapital));

    // --- Card Synergies daily effects ---
    if (typeof getActiveSynergies === 'function') {
        const synergies = getActiveSynergies();
        for (const syn of synergies) {
            if (syn.effects.dailyStanding) SIM.internationalStanding += syn.effects.dailyStanding;
            if (syn.effects.dailyApproval) SIM.domesticApproval += syn.effects.dailyApproval;
            if (syn.effects.dailyTension) SIM.tension += syn.effects.dailyTension;
            if (syn.effects.dailyDeterrence) SIM.iranAggression -= syn.effects.dailyDeterrence * 0.1;
            if (syn.effects.dailyIranEconomy) SIM.iranEconomy += syn.effects.dailyIranEconomy;
            if (syn.effects.dailyFactionShift) SIM.iranFactionBalance = Math.min(100, SIM.iranFactionBalance + syn.effects.dailyFactionShift);
        }
    }

    // --- Reputation update based on recent actions ---
    // Reliability: consistency between promises and actions
    // Proportionality: matching responses to provocations
    // Creativity: choosing unconventional options
    if (SIM.reputation) {
        // Reliability drifts toward 50 slowly; boosted by consistent stance maintenance
        const stanceCount = SIM.activeStances ? SIM.activeStances.length : 0;
        const longTermStances = SIM.activeStances ? SIM.activeStances.filter(s => {
            const level = (typeof getCardLevel === 'function') ? getCardLevel(s.cardId) : { level: 1 };
            return level.level >= 2;
        }).length : 0;
        SIM.reputation.reliability += (longTermStances * 0.3) - 0.1; // reward keeping stances active
        SIM.reputation.reliability = Math.max(0, Math.min(100, SIM.reputation.reliability));

        // Proportionality: rewarded when warPath matches threat level
        const threatLevel = SIM.iranAggression > 80 ? 4 : SIM.iranAggression > 60 ? 3 : SIM.iranAggression > 40 ? 2 : SIM.iranAggression > 20 ? 1 : 0;
        const mismatch = Math.abs(SIM.warPath - threatLevel);
        SIM.reputation.proportionality += (mismatch < 2 ? 0.2 : -0.3);
        SIM.reputation.proportionality = Math.max(0, Math.min(100, SIM.reputation.proportionality));

        // Creativity: boosted by active synergies (unconventional combinations)
        const synergyCount = (typeof getActiveSynergies === 'function') ? getActiveSynergies().length : 0;
        SIM.reputation.creativity += synergyCount * 0.2 - 0.05;
        SIM.reputation.creativity = Math.max(0, Math.min(100, SIM.reputation.creativity));
    }

    // Free weekly de-escalation: -1 warPath every 7 days if tension is below 60
    if (SIM.day > 1 && SIM.day % 7 === 0 && SIM.warPath > 0 && SIM.tension < 60) {
        SIM.warPath = Math.max(0, SIM.warPath - 1);
        addHeadline((DATA.headlines.simulation.weekly_cooldown || [])[0] || '', 'good');
    }

    // AIPAC reacts to warPath changes
    if (SIM.warPath > (SIM._dayStartWarPath || 0)) {
        SIM.aipacPressure = Math.min(100, SIM.aipacPressure + 3 * (SIM.warPath - (SIM._dayStartWarPath || 0)));
    }

    // Decay all player deltas (retain 85% per day)
    for (const key of Object.keys(pd)) {
        pd[key] *= DECAY;
        if (Math.abs(pd[key]) < 0.1) pd[key] = 0; // snap to zero when negligible
    }

    // --- Entity Management ---
    const navalPresence = getStanceMax('navalPresence');
    const targetShips = [0, 3, 7, 12][Math.min(navalPresence, 3)];
    let milMult = (SIM.character && SIM.character.militaryMult) ? SIM.character.militaryMult : 1;
    const actualTargetShips = Math.round(targetShips * (milMult > 1 ? 1.1 : 1));
    while (SIM.navyShips.length < actualTargetShips) spawnNavyShip(0.6 + Math.random() * 0.2, 0.6 + Math.random() * 0.15);
    while (SIM.navyShips.length > actualTargetShips) SIM.navyShips.pop();

    // Iran boats scale with strategy
    const boatMult = SIM.iranStrategy === 'confrontational' ? 1.5 : SIM.iranStrategy === 'escalatory' ? 1.2 : 1;
    const targetBoats = Math.floor(SIM.iranAggression / 12 * boatMult);
    while (SIM.iranBoats.length < targetBoats) spawnIranBoat(0.4 + Math.random() * 0.2, 0.30 + Math.random() * 0.15);
    while (SIM.iranBoats.length > targetBoats) SIM.iranBoats.pop();

    // Tankers — always maintain at least 3 (prevents dead-end spiral)
    const minTankers = Math.max(3, Math.floor(SIM.oilFlow / 8));
    while (SIM.tankers.length < minTankers) spawnTanker();
    while (SIM.tankers.length > Math.ceil(SIM.oilFlow / 6) + 2) SIM.tankers.shift();

    // Release seized tankers
    for (const t of SIM.tankers) {
        if (t.seized && Math.random() < 0.1) {
            t.seized = false;
            addHeadline(`Iran releases tanker ${t.id} after pressure`, 'good');
        }
    }

    // --- Statistical Seizure/Intercept Model (P2) ---
    // Seizure chance based on Iran aggression + strategy, reduced by naval presence
    const seizureBase = SIM.iranStrategy === 'confrontational' ? 0.12 :
                        SIM.iranStrategy === 'escalatory' ? 0.06 :
                        SIM.iranStrategy === 'probing' ? 0.02 : 0.005;
    const navalDeterrence = Math.min(0.10, navalPresence * 0.04);
    const seizureChance = Math.max(0, seizureBase - navalDeterrence);

    if (Math.random() < seizureChance && SIM.tankers.length > 0) {
        const blockadeLevel = getStanceMax('blockadeLevel');
        // Intercept chance based on naval presence + blockade level + ROE
        const roeBonus = SIM.roe === 'aggressive' ? 0.25 : SIM.roe === 'moderate' ? 0.10 : 0;
        const interceptChance = Math.min(0.85, navalPresence * 0.15 + blockadeLevel * 0.15 + roeBonus);

        if (Math.random() < interceptChance) {
            // Successful intercept
            SIM.interceptCount++;
            const boat = SIM.iranBoats[Math.floor(Math.random() * Math.max(1, SIM.iranBoats.length))];
            const bx = boat ? boat.x : 0.5, by = boat ? boat.y : 0.45;
            addHeadline((DATA.headlines.simulation.intercept || [])[0] || '', 'good');
            spawnEffect(bx, by, 'intercept');
            addIncidentMarker(bx, by, 'intercept', SIM.day);
            if (boat) boat.fleeing = true;
        } else {
            // Seizure happens
            const tanker = SIM.tankers.find(t => !t.seized);
            if (tanker) {
                tanker.seized = true;
                SIM.seizureCount++;
                SIM.recentSeizureDays.push(SIM.day);
                SIM.tension = Math.min(100, SIM.tension + 12);
                SIM.oilFlow = Math.max(10, SIM.oilFlow - 5);
                // warPath is incremented by the seizure decision event choice, not here
                const pos = getLanePosition(tanker.lane, tanker.progress);
                addHeadline(`BREAKING: IRGC seizes tanker ${tanker.id} (${tanker.flag}-flagged)`, 'critical');
                spawnEffect(pos.x, pos.y, 'seizure');
                addIncidentMarker(pos.x, pos.y, 'seizure', SIM.day);
                if (!SIM.decisionEventActive) triggerSeizureDecision(tanker);
            }
        }
    }

    // ROE effects
    if (SIM.roe === 'moderate') {
        SIM.tension = Math.min(100, SIM.tension + 1);
    }
    if (SIM.roe === 'aggressive') {
        SIM.tension = Math.min(100, SIM.tension + 3);
        if (Math.random() < 0.05) {
            SIM.warPath++;
            addHeadline((DATA.headlines.simulation.roe_aggressive || [])[0] || '', 'critical');
        }
    }

    // Carrier
    const hasCarrier = getStanceEffect('carrier') > 0;
    if (hasCarrier && !SIM.carrier) {
        SIM.carrier = { x: 0.85, y: 0.75, targetX: 0.70, targetY: 0.65, id: 'USS-EISENHOWER' };
        addHeadline((DATA.headlines.simulation.carrier_deploy || [])[0] || '', 'warning');
    } else if (!hasCarrier && SIM.carrier) {
        addHeadline((DATA.headlines.simulation.carrier_withdraw || [])[0] || '', 'normal');
        SIM.carrier = null;
    }

    // Mines during crisis
    if (SIM.crisisLevel >= 2 && SIM.mines.length < 5 && Math.random() < 0.3) {
        SIM.mines.push({ x: 0.38 + Math.random() * 0.22, y: 0.44 + Math.random() * 0.12, detonated: false });
        if (SIM.fogOfWar < 50) addHeadline((DATA.headlines.simulation.mine_detection || [])[0] || '', 'critical');
    }

    // Drones from intel
    const intelLevel = getStanceMax('intelLevel');
    const targetDrones = [0, 1, 3, 5][Math.min(intelLevel, 3)];
    while (SIM.drones.length < targetDrones) {
        const cx = 0.3 + Math.random() * 0.4, cy = 0.35 + Math.random() * 0.25;
        SIM.drones.push({ x: cx, y: cy, cx, cy, radius: 0.05 + Math.random() * 0.08, angle: Math.random() * Math.PI * 2, id: 'RQ-' + Math.random().toString(36).substr(2, 3).toUpperCase() });
    }
    while (SIM.drones.length > targetDrones) SIM.drones.pop();

    // Drones reveal mines
    if (SIM.drones.length > 0) {
        for (const mine of SIM.mines) {
            for (const drone of SIM.drones) {
                const dx = drone.x - mine.x, dy = drone.y - mine.y;
                if (Math.sqrt(dx * dx + dy * dy) < 0.1 && Math.random() < 0.2) {
                    mine.detonated = true;
                    addHeadline((DATA.headlines.simulation.drone_mine_neutralize || [])[0] || '', 'good');
                    spawnEffect(mine.x, mine.y, 'intercept');
                }
            }
        }
        SIM.mines = SIM.mines.filter(m => !m.detonated);
    }

    // Crisis decay
    if (SIM.crisisTimer > 0) SIM.crisisTimer--;
    else if (SIM.crisisLevel > 0 && SIM.tension < 40) {
        SIM.crisisLevel = Math.max(0, SIM.crisisLevel - 1);
        if (SIM.crisisLevel === 0) addHeadline((DATA.headlines.simulation.crisis_deescalate || [])[0] || '', 'good');
    }

    // Clean old seizure days
    SIM.recentSeizureDays = SIM.recentSeizureDays.filter(d => SIM.day - d <= 3);

    // ---- Iran Faction Balance ----
    // Player actions shift the balance between hardliners (Tangsiri) and moderates (Araghchi)
    // Lower = hardliners ascendant, Higher = moderates ascendant
    if (typeof SIM.iranFactionBalance !== 'undefined') {
        // Military strikes push toward hardliners
        if (SIM.warPath >= 3) SIM.iranFactionBalance = Math.max(0, SIM.iranFactionBalance - 2);
        else if (SIM.warPath >= 2) SIM.iranFactionBalance = Math.max(0, SIM.iranFactionBalance - 1);

        // Sanctions without diplomacy empower hardliners
        const hasSanctions = SIM.activeStances.some(s => s.cardId === 'targeted_sanctions' || s.cardId === 'maximum_pressure');
        const hasDiplomacy = SIM.activeStances.some(s => s.cardId === 'back_channel' || s.cardId === 'summit_proposal' || s.cardId === 'humanitarian_corridor');
        if (hasSanctions && !hasDiplomacy) SIM.iranFactionBalance = Math.max(0, SIM.iranFactionBalance - 0.5);

        // Diplomacy empowers moderates
        if (hasDiplomacy) SIM.iranFactionBalance = Math.min(100, SIM.iranFactionBalance + 1);
        if (SIM.diplomaticCapital > 50) SIM.iranFactionBalance = Math.min(100, SIM.iranFactionBalance + 0.3);

        // Humanitarian gestures help moderates
        if (SIM.storyFlags.humanitarian_rescue) SIM.iranFactionBalance = Math.min(100, SIM.iranFactionBalance + 0.5);

        // High tension helps hardliners
        if (SIM.tension > 70) SIM.iranFactionBalance = Math.max(0, SIM.iranFactionBalance - 0.5);

        // Iran aggression correlates — very aggressive Iran means hardliners winning
        if (SIM.iranAggression > 70) SIM.iranFactionBalance = Math.max(0, SIM.iranFactionBalance - 0.3);
        else if (SIM.iranAggression < 30) SIM.iranFactionBalance = Math.min(100, SIM.iranFactionBalance + 0.3);

        SIM.iranFactionBalance = Math.max(0, Math.min(100, SIM.iranFactionBalance));

        // Generate visible Iran moves for morning briefing (30% chance per day)
        if (Math.random() < 0.30) {
            const moves_hardliner = DATA.headlines.simulation.iran_faction_hardliner_moves || [];
            const moves_moderate = DATA.headlines.simulation.iran_faction_moderate_moves || [];
            const moves_ambiguous = DATA.headlines.simulation.iran_faction_ambiguous_moves || [];

            let movePool, moveType;
            if (SIM.iranFactionBalance < 35) {
                movePool = moves_hardliner;
                moveType = 'hardliner';
            } else if (SIM.iranFactionBalance > 65) {
                movePool = moves_moderate;
                moveType = 'moderate';
            } else {
                // Near balance — could go either way
                if (Math.random() < 0.4) { movePool = moves_ambiguous; moveType = 'ambiguous'; }
                else if (Math.random() < 0.5) { movePool = moves_hardliner; moveType = 'hardliner'; }
                else { movePool = moves_moderate; moveType = 'moderate'; }
            }

            const move = movePool[Math.floor(Math.random() * movePool.length)];
            SIM.iranVisibleMoves.push({ text: move, type: moveType, day: SIM.day });
            // Keep only last 5 moves
            if (SIM.iranVisibleMoves.length > 5) SIM.iranVisibleMoves.shift();

            // Add as headline with appropriate level
            const hlLevel = moveType === 'hardliner' ? 'warning' : moveType === 'moderate' ? 'good' : 'normal';
            addHeadline(`TEHRAN: ${move}`, hlLevel);

            // Also push to narrative feed as dialogue with Iran portrait
            if (typeof addNarrative === 'function') {
                const iranSpeaker = moveType === 'hardliner' ? 'Tangsiri' : moveType === 'moderate' ? 'Araghchi' : 'Tehran';
                addNarrative('dialogue', move, { speaker: iranSpeaker, portrait: iranSpeaker });
            }

            // Show Iran portrait in scene panel
            if (typeof showSceneImage === 'function') {
                const iranPortrait = moveType === 'hardliner' ? 'assets/iran-tangsiri.png'
                    : moveType === 'moderate' ? 'assets/iran-araghchi.png'
                    : 'assets/iran-tangsiri.png';
                showSceneImage(iranPortrait, { duration: 4000, caption: 'TEHRAN: ' + move.substring(0, 60) });
            }
        }
    }

    // Update story arc
    const arc = getCurrentStoryArc();
    if (arc && SIM.storyArc !== arc.id) {
        SIM.storyArc = arc.id;
        addHeadline(`\u2501\u2501\u2501 ${arc.name} \u2501\u2501\u2501`, 'critical');
        // Flash the arc image in the scene panel for 5 seconds
        if (typeof showSceneImage === 'function' && arc.image) {
            showSceneImage(arc.image, { duration: 5000, caption: arc.name });
        }
    }

    // Metric snapshot
    SIM.metricHistory.push({
        day: SIM.day, oilFlow: SIM.oilFlow, oilPrice: SIM.oilPrice,
        tension: SIM.tension, domesticApproval: SIM.domesticApproval,
        internationalStanding: SIM.internationalStanding,
        conflictRisk: SIM.conflictRisk, budget: SIM.budget,
        gauges: calculateGauges(), rating: calculateRating(),
    });

    // --- Special Action Cooldown Decrement ---
    if (SIM.character && SIM.character.specialAction && SIM.character.specialAction.cooldown > 0) {
        SIM.character.specialAction.cooldown--;
    }

    // --- Character Unique Resource ---
    if (SIM.character && SIM.character.updateResource) {
        SIM.character.updateResource(SIM);
    }

    // --- Character unique resource warnings ---
    if (SIM.character && SIM.character.uniqueResource) {
        const resVal = SIM.uniqueResource;
        const isInverted = SIM.character.uniqueResource.inverted;
        if (isInverted) {
            // For exposure: high is bad
            if (resVal > 60 && resVal <= 63) addHeadline(`${SIM.character.uniqueResource.name} rising — be careful`, 'warning');
            if (resVal > 75 && resVal <= 78) addHeadline(`${SIM.character.uniqueResource.name} critical — one more leak and it's over`, 'critical');
        } else {
            // For normal resources: low is bad
            if (resVal < 30 && resVal >= 27) addHeadline(`${SIM.character.uniqueResource.name} dropping — ${getAdvisorReaction('uniqueResourceLow')}`, 'warning');
            if (resVal < 15 && resVal >= 12) addHeadline(`${SIM.character.uniqueResource.name} critical — ${getAdvisorReaction('uniqueResourceCritical')}`, 'critical');
        }
    }

    // --- Hegseth: low authority delays orders (reduce naval effectiveness) ---
    if (SIM.character && SIM.character.id === 'hegseth' && SIM.uniqueResource < 25) {
        // Delayed orders: navy ships move slower, less effective
        for (const ship of SIM.navyShips) {
            ship.speed = 0.0005; // Half normal speed
        }
    }

    // --- Trump: apply effect multiplier to stance effects ---
    // (Handled in getStanceEffect via effectMultiplier)

    // --- Trump: Public Win Detection ---
    if (SIM.character && SIM.character.id === 'trump') {
        // Intercept increased
        if (SIM.interceptCount > SIM._prevInterceptCount) {
            SIM.lastPublicWinDay = SIM.day;
            SIM.publicWinType = 'intercept';
        }
        // Seized tankers decreased (reversed)
        const curSeized = SIM.tankers.filter(t => t.seized).length;
        if (SIM._prevSeizureCount > 0 && curSeized < SIM._prevSeizureCount) {
            SIM.lastPublicWinDay = SIM.day;
            SIM.publicWinType = 'seizure_reversed';
        }
        // Deal announced (storyFlags changed with deal-related flags)
        const dealFlags = ['grand_deal_proposed', 'abraham_accords_2', 'araghchi_meeting', 'summit_proposed'];
        for (const flag of dealFlags) {
            if (SIM.storyFlags[flag] && !SIM._prevStoryFlags?.[flag]) {
                SIM.lastPublicWinDay = SIM.day;
                SIM.publicWinType = 'deal_announced';
                break;
            }
        }
        // Military strike drops iranAggression by 10+ in one day
        if (SIM._prevIranAggression - SIM.iranAggression >= 10) {
            SIM.lastPublicWinDay = SIM.day;
            SIM.publicWinType = 'military_strike';
        }
        // Oil price drops 10+ in one day
        if (SIM._prevOilPrice - SIM.oilPrice >= 10) {
            SIM.lastPublicWinDay = SIM.day;
            SIM.publicWinType = 'oil_price_drop';
        }
        // Snapshot for next day
        SIM._prevInterceptCount = SIM.interceptCount;
        SIM._prevSeizureCount = SIM.tankers.filter(t => t.seized).length;
        SIM._prevIranAggression = SIM.iranAggression;
        SIM._prevOilPrice = SIM.oilPrice;
        SIM._prevStoryFlags = Object.assign({}, SIM.storyFlags);
    }

    // --- Fuentes: Withdrawal Lock Enforcement ---
    if (SIM.withdrawalLocked) {
        SIM.warPath = 0;
    }

    // --- Fuentes: Withdrawal Progress ---
    if (SIM.character && SIM.character.id === 'fuentes') {
        const hasMilitaryStance = SIM.activeStances.some(s => {
            const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS)];
            const card = allCards.find(c => c.id === s.cardId);
            return card && card.category === 'military';
        });
        if (SIM.warPath === 0 && !hasMilitaryStance) {
            SIM.withdrawalProgress = Math.min(5, SIM.withdrawalProgress + 1);
            if (SIM.withdrawalProgress === 3) {
                addHeadline('Partial troop withdrawal underway — America First policy taking shape', 'good');
                if (typeof addNarrative === 'function') {
                    addNarrative('alert', 'Military advisors confirm partial withdrawal from Persian Gulf region. The base is energized.', { level: 'good' });
                }
            }
        }
    }

    // --- Asmongold: Prediction Resolution ---
    if (SIM.predictions && SIM.predictions.length > 0) {
        for (const pred of SIM.predictions) {
            if (pred.resolved) continue;
            if (SIM.day >= pred.resolveDay) {
                pred.resolved = true;
                let correct = false;
                switch (pred.topic) {
                    case 'iran_escalate':
                        correct = SIM.warPath > pred._startWarPath;
                        break;
                    case 'oil_below_100':
                        correct = SIM.oilPrice < 100;
                        break;
                    case 'seizure_week':
                        correct = SIM.seizureCount > pred._startSeizureCount;
                        break;
                    case 'diplomatic_breakthrough':
                        correct = SIM.tension <= pred._startTension - 15;
                        break;
                    case 'iran_backs_down':
                        correct = SIM.iranAggression <= pred._startIranAggression - 20;
                        break;
                    case 'oil_crisis_worsens':
                        correct = SIM.oilFlow <= pred._startOilFlow - 10;
                        break;
                    case 'military_escalation':
                        correct = SIM.warPath > pred._startWarPath;
                        break;
                    case 'approval_surge':
                        correct = SIM.domesticApproval >= pred._startApproval + 10;
                        break;
                }
                pred.correct = correct;
                if (correct) {
                    SIM.audience = Math.min(100, SIM.audience + 15);
                    SIM.uniqueResource = Math.min(100, SIM.uniqueResource + 10);
                    SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 5);
                    addHeadline(`PREDICTION CORRECT: "${pred.label}" — audience surges!`, 'good');
                    if (typeof showToast === 'function') showToast('Prediction correct! Audience +15, Credibility +10', 'good');
                } else {
                    SIM.audience = Math.max(0, SIM.audience - 10);
                    SIM.uniqueResource = Math.max(0, SIM.uniqueResource - 8);
                    addHeadline(`PREDICTION WRONG: "${pred.label}" — credibility hit`, 'warning');
                    if (typeof showToast === 'function') showToast('Prediction wrong! Audience -10, Credibility -8', 'bad');
                }
            }
        }
    }

    // --- Hegseth: Track day start warPath ---
    SIM._dayStartWarPath = SIM.warPath;

    // --- Kushner: Abraham Accords II dealValue bonus ---
    if (SIM.character && SIM.character.id === 'kushner') {
        const hasAccords = SIM.activeStances.some(s => s.cardId === 'abraham_accords');
        if (hasAccords) {
            SIM.dealValue = (SIM.dealValue || 0) + 5;
        }
    }

}

// ======================== IRAN STRATEGY AI ========================

function updateIranStrategy() {
    // Determine strategy mode
    if (SIM.iranAggression < 25) SIM.iranStrategy = 'restrained';
    else if (SIM.iranAggression < 50) SIM.iranStrategy = 'probing';
    else if (SIM.iranAggression < 75) SIM.iranStrategy = 'escalatory';
    else SIM.iranStrategy = 'confrontational';

    // Iran responds to player's card combination
    const hasHeavySanctions = getStanceEffect('iranEconomy') < -15;
    const hasDiplomacy = getStanceEffect('diplomaticCapital') > 5;
    const hasHeavyNavy = getStanceMax('navalPresence') >= 3;
    const hasCoalition = getStanceEffect('internationalStanding') > 8;

    // Sanctions without diplomacy = escalatory (reduced from 1.5)
    if (hasHeavySanctions && !hasDiplomacy) SIM.iranAggression += 0.8;
    // Diplomacy while economy hurting = de-escalatory (boosted from -2)
    if (hasDiplomacy && SIM.iranEconomy < 40) SIM.iranAggression -= 2.5;
    // Unilateral navy without coalition = provocative (reduced from 1)
    if (hasHeavyNavy && !hasCoalition) SIM.iranAggression += 0.5;
    // Coalition + diplomacy = Iran pressured to negotiate (boosted from -1.5)
    if (hasCoalition && hasDiplomacy) SIM.iranAggression -= 2;

    // Low China relations = Iran gets alternative weapons supply
    if (SIM.chinaRelations < 25) SIM.iranAggression += 0.3;

    SIM.iranAggression = Math.max(0, Math.min(100, SIM.iranAggression));
}

// ======================== PROXY THREATS ========================

function updateProxyThreats() {
    const proxyDelta = getStanceEffect('proxyThreat') || 0;
    SIM.proxyThreat += (SIM.tension * 0.015) + (SIM.iranAggression * 0.01) - 0.3;
    SIM.proxyThreat += proxyDelta * 0.1;
    SIM.proxyThreat = Math.max(0, Math.min(100, SIM.proxyThreat));

    // Proxy events at thresholds
    if (SIM.proxyThreat > 30 && Math.random() < 0.08) {
        addHeadline((DATA.headlines.simulation.proxy_events || [])[0] || '', 'critical');
        SIM.oilFlow = Math.max(10, SIM.oilFlow - 3);
        SIM.oilPrice += 3;
    }
    if (SIM.proxyThreat > 50 && Math.random() < 0.05) {
        addHeadline((DATA.headlines.simulation.proxy_events || [])[1] || '', 'critical');
        SIM.budget -= 15;
        SIM.domesticApproval -= 2;
    }
    if (SIM.proxyThreat > 70 && Math.random() < 0.03) {
        addHeadline((DATA.headlines.simulation.proxy_events || [])[2] || '', 'critical');
        SIM.tension += 8;
        SIM.internationalStanding -= 3;
    }
}

// ======================== GREAT POWERS ========================

function updateGreatPowers() {
    // China relations affected by sanctions
    const sanctionsEcon = getStanceEffect('iranEconomy');
    if (sanctionsEcon < -10) SIM.chinaRelations -= 0.3;
    if (sanctionsEcon < -20) SIM.chinaRelations -= 0.5;

    // Diplomacy improves China relations
    const dipCap = getStanceEffect('diplomaticCapital');
    if (dipCap > 5) SIM.chinaRelations += 0.2;

    // Military escalation pushes China away too
    const navyPres = getStanceMax('navalPresence');
    if (navyPres >= 3) SIM.chinaRelations -= 0.15;
    if (getStanceEffect('warPath') > 0) SIM.chinaRelations -= 0.25;

    // Coalition reassures somewhat
    const standing = getStanceEffect('internationalStanding');
    if (standing > 5) SIM.chinaRelations += 0.1;

    // China relations from card effects
    SIM.chinaRelations += (getStanceEffect('chinaRelations') || 0) * 0.1;

    SIM.chinaRelations = Math.max(0, Math.min(100, SIM.chinaRelations));
}

// ======================== DOMESTIC POLITICS ========================

function updateDomesticPolitics() {
    const polDelta = getStanceEffect('polarization') || 0;

    // Polarization rises with divisive conditions
    const dailyCost = getStanceEffect('cost') / 7;
    if (dailyCost > 50 && SIM.domesticApproval < 60) SIM.polarization += 0.4;
    if (SIM.budget < 0) SIM.polarization += 0.8;
    if (SIM.day > 21 && SIM.tension > 40) SIM.polarization += 0.2;

    // Polarization decreases with unity
    if (SIM.domesticApproval > 70) SIM.polarization -= 0.4;
    SIM.polarization += polDelta * 0.1;
    SIM.polarization = Math.max(0, Math.min(100, SIM.polarization));

    // Assassination risk
    if (SIM.iranAggression > 80) SIM.assassinationRisk += 1.5;
    if (SIM.domesticApproval < 25 && SIM.tension > 70) SIM.assassinationRisk += 2;
    // Natural decay
    SIM.assassinationRisk = Math.max(0, SIM.assassinationRisk - 0.3);
    SIM.assassinationRisk = Math.min(100, SIM.assassinationRisk);

    // Warnings
    if (SIM.polarization > 55 && SIM.polarization <= 57) {
        addHeadline((DATA.headlines.simulation.polarization_warnings || [])[0] || '', 'warning');
    }
    if (SIM.polarization > 72 && SIM.polarization <= 74) {
        addHeadline((DATA.headlines.simulation.polarization_warnings || [])[1] || '', 'critical');
    }
    if (SIM.assassinationRisk > 55 && SIM.assassinationRisk <= 58) {
        addHeadline((DATA.headlines.simulation.assassination_warning || [])[0] || '', 'critical');
    }
    if (SIM.domesticApproval < 30 && SIM.domesticApproval > 28) {
        addHeadline((DATA.headlines.simulation.approval_warnings || [])[0] || '', 'warning');
    }
    if (SIM.domesticApproval < 20 && SIM.domesticApproval > 18) {
        addHeadline((DATA.headlines.simulation.approval_warnings || [])[1] || '', 'critical');
    }
    if (SIM.internationalStanding < 20 && SIM.internationalStanding > 18) {
        addHeadline((DATA.headlines.simulation.international_standing_warning || [])[0] || '', 'warning');
    }
}

// ======================== AIPAC / HILL SUPPORT ========================

function updateAIPAC() {
    if (typeof SIM.aipacPressure === 'undefined') return;

    // --- Natural drift: lobby always pushes toward hawkishness ---
    SIM.aipacPressure += 0.3;

    // --- Hawkish actions increase pressure ---
    // Active military cards with tension effects > 10
    const hasMilitaryTension = SIM.activeStances.some(s => {
        const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS)];
        const card = allCards.find(c => c.id === s.cardId);
        if (!card || card.category !== 'military') return false;
        const eff = card.effects[s.funding];
        return eff && (eff.tension || 0) > 10;
    });
    if (hasMilitaryTension) SIM.aipacPressure += 0.5;

    // Sanctions against Iran active
    const hasSanctions = SIM.activeStances.some(s => s.cardId === 'targeted_sanctions' || s.cardId === 'maximum_pressure');
    if (hasSanctions) SIM.aipacPressure += 0.3;

    // --- Dovish actions decrease pressure ---
    // Back-channel talks active
    const hasBackChannel = SIM.activeStances.some(s => s.cardId === 'back_channel');
    if (hasBackChannel) SIM.aipacPressure -= 0.5;

    // Humanitarian corridor active
    const hasHumanitarian = SIM.activeStances.some(s => s.cardId === 'humanitarian_corridor');
    if (hasHumanitarian) SIM.aipacPressure -= 0.3;

    // Trade incentives to Iran active
    const hasTradeIncentives = SIM.activeStances.some(s => s.cardId === 'trade_incentives');
    if (hasTradeIncentives) SIM.aipacPressure -= 0.3;

    // --- Contextual shifts ---
    // Ignoring proxy threats for 5+ days
    if (SIM.proxyThreat > 40 && !SIM.activeStances.some(s => {
        const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS)];
        const card = allCards.find(c => c.id === s.cardId);
        return card && card.category === 'military';
    })) {
        SIM._proxyIgnoredDays = (SIM._proxyIgnoredDays || 0) + 1;
    } else {
        SIM._proxyIgnoredDays = 0;
    }
    if (SIM._proxyIgnoredDays >= 5) SIM.aipacPressure -= 0.3;

    // China relations above 60 (seen as hedging)
    if (SIM.chinaRelations > 60) SIM.aipacPressure -= 0.2;

    // --- AIPAC effects on gameplay ---
    if (SIM.aipacPressure > 70) {
        // High pressure: boosting you in media
        SIM.domesticApproval += 0.3;
    } else if (SIM.aipacPressure < 30) {
        // Low pressure: running attack ads
        SIM.domesticApproval -= 0.5;
        SIM.polarization += 0.2;
    }

    // Process ongoing AIPAC attack ad effect (approval -8 over 3 days = -2.67/day)
    if (SIM._aipacApprovalPenaltyDays > 0) {
        SIM.domesticApproval -= 2.67;
        SIM._aipacApprovalPenaltyDays--;
    }

    // Process diplomatic restriction (track only, enforcement in UI)
    if (SIM._aipacDiplomaticRestrictionDays > 0) {
        SIM._aipacDiplomaticRestrictionDays--;
    }

    // Clamp
    SIM.aipacPressure = Math.max(0, Math.min(100, SIM.aipacPressure));

    // --- Headlines at extreme values ---
    if (SIM.aipacPressure > 85 && SIM.aipacPressure <= 87) {
        addHeadline('Congressional hawks rally behind administration — strong Hill support', 'good');
    }
    if (SIM.aipacPressure < 20 && SIM.aipacPressure >= 18) {
        addHeadline('Political headwinds on the Hill — donor class restless', 'warning');
    }
}

// ======================== WIN / LOSE ========================

function checkWinLose() {
    if (SIM.gameOver) return true;

    // --- Win 1: Character-specific win conditions ---
    if (SIM.character && SIM.character.scenario && SIM.character.scenario.winConditions) {
        for (const wc of SIM.character.scenario.winConditions) {
            if (wc.check(SIM)) {
                wc._days = (wc._days || 0) + 1;
                if (wc._days >= 3) { // Must sustain for 3 days
                    endGame(true, wc.message);
                    return true;
                }
            } else {
                wc._days = 0;
            }
        }
    }

    // --- Win 2: Strait open 10 consecutive days (generic fallback) ---
    const recentSeizures = SIM.recentSeizureDays.filter(d => SIM.day - d <= 3).length;
    const straitOpen = SIM.oilFlow > 55 && SIM.tension < 45 && recentSeizures === 0 && SIM.crisisLevel === 0;

    if (straitOpen) {
        SIM.straitOpenDays++;
        if (SIM.straitOpenDays >= 5) {
            addHeadline(`STRAIT STABLE ${SIM.straitOpenDays}/7 DAYS — maintain course!`, 'good');
        }
        if (SIM.straitOpenDays >= 7) {
            const _wlr = DATA.events.winLoseReasons || {};
            const _suffix = SIM.diplomaticCapital > 60 ? 'masterful diplomacy.' : SIM.domesticApproval > 70 ? 'strong leadership.' : 'persistent strategy.';
            endGame(true, (_wlr.win_strait_open || '').replace('[masterful diplomacy / strong leadership / persistent strategy].', _suffix));
            return true;
        }
    } else {
        // Grace: lose 2 days instead of full reset (less punishing)
        if (SIM.straitOpenDays > 0) {
            const lost = Math.min(2, SIM.straitOpenDays);
            SIM.straitOpenDays = Math.max(0, SIM.straitOpenDays - lost);
            addHeadline(`Strait stability disrupted — progress ${SIM.straitOpenDays > 0 ? 'reduced to ' + SIM.straitOpenDays + '/7' : 'lost'}`, 'warning');
        }
    }

    // --- Lose 1: Removed from office ---
    if (SIM.domesticApproval <= 15) {
        SIM.lowApprovalDays++;
        if (SIM.lowApprovalDays >= 5) {
            const _wlr = DATA.events.winLoseReasons || {};
            endGame(false, (_wlr.lose_approval || '').replace('[X]', Math.round(SIM.domesticApproval)));
            return true;
        }
    } else { SIM.lowApprovalDays = 0; }

    // --- Lose 2: Assassination (now fires as forced decision event at risk > 80) ---
    if (SIM.assassinationRisk > 80 && !SIM._assassinationEventFired) {
        SIM._assassinationEventFired = true;
        SIM.decisionEventActive = true;
        SIM.phase = 'event';
        showDecisionEvent({
            id: 'assassination_crisis', title: '[ IMMINENT THREAT ]',
            description: 'Multiple intelligence agencies confirm a credible, imminent assassination plot. ' +
                (SIM.iranAggression > 70 ? 'IRGC Quds Force fingerprints detected.' : 'Domestic extremist cell identified.') +
                ' You have minutes to decide.',
            countdown: 15, crisis: true,
            choices: [
                { text: 'Full lockdown — cancel all public appearances', effects: { assassinationRisk: -40, domesticApproval: -5, budget: -30 }, flavor: 'You go underground. The threat is neutralized but you look weak.' },
                { text: 'Counter-strike on the plotters', effects: { assassinationRisk: -30, tension: 10, warPath: 1, domesticApproval: 5 }, flavor: 'Special forces neutralize the cell. The message is clear.' },
                { text: 'Ignore it — show strength', effects: { assassinationRisk: 15, domesticApproval: 8 }, flavor: 'You appear in public defiantly. The risk remains.' },
            ],
        });
        return false; // Don't end game — let the event play out
    }
    // Only lose to assassination if risk stays extreme after the event
    if (SIM._assassinationEventFired && SIM.assassinationRisk > 95) {
        endGame(false, (DATA.events.winLoseReasons || {}).lose_assassination_extreme || '');
        return true;
    }

    // --- Lose 3: Global Pariah ---
    if (SIM.internationalStanding <= 10) {
        SIM.lowStandingDays++;
        if (SIM.lowStandingDays >= 3) {
            endGame(false, (DATA.events.winLoseReasons || {}).lose_international || '');
            return true;
        }
    } else { SIM.lowStandingDays = 0; }

    // --- Lose 4: Civil War / Domestic Crisis ---
    if (SIM.polarization >= 85) {
        SIM.highPolarizationDays = (SIM.highPolarizationDays || 0) + 1;
        if (SIM.highPolarizationDays >= 3) {
            endGame(false, (DATA.events.winLoseReasons || {}).lose_polarization || '');
            return true;
        }
    } else { SIM.highPolarizationDays = 0; }

    // --- Lose 5: War ---
    if (SIM.warPath >= 5) {
        endGame(false, (DATA.events.winLoseReasons || {}).lose_war || '');
        return true;
    }

    // --- Lose 6+: Character-specific lose conditions ---
    if (SIM.character && SIM.character.scenario && SIM.character.scenario.loseConditions) {
        for (const lc of SIM.character.scenario.loseConditions) {
            if (lc.check(SIM)) {
                if (lc.checkDays) {
                    lc._days = (lc._days || 0) + 1;
                    if (lc._days >= lc.checkDays) {
                        endGame(false, lc.message);
                        return true;
                    }
                } else {
                    endGame(false, lc.message);
                    return true;
                }
            } else if (lc.checkDays) {
                lc._days = 0;
            }
        }
    }

    // --- Failsafe: Day 91 without winning ---
    if (SIM.day > 91) {
        const g = calculateGauges();
        const _wlr = DATA.events.winLoseReasons || {};
        if (g.stability < 30) {
            endGame(false, _wlr.lose_day91_unstable || '');
        } else {
            endGame(true, _wlr.win_day91_stable || '');
        }
        return true;
    }

    return false;
}

function endGame(won, reason) {
    SIM.gameOver = true;
    SIM.gameWon = won;
    SIM.gameOverReason = reason;
    SIM.speed = 0;
    SIM.phase = 'gameover';
    SIM.decisionEventActive = false;

    addHeadline(reason, won ? 'good' : 'critical');
    showGameOverScreen();
}

// ======================== EVENTS ========================

function escalateCrisis() {
    if (SIM.crisisLevel >= 3) return;
    SIM.crisisLevel++;
    SIM.crisisTimer = 10;
    const _ce = DATA.headlines.simulation.crisis_escalation || [];
    const crisisEvents = [
        { level: 1, text: _ce[0] || '', tension: 10 },
        { level: 2, text: _ce[1] || '', tension: 20 },
        { level: 3, text: _ce[2] || '', tension: 30 },
    ];
    const crisis = crisisEvents.find(c => c.level === SIM.crisisLevel);
    if (crisis) {
        SIM.tension = Math.min(100, SIM.tension + crisis.tension);
        addHeadline(crisis.text, 'critical');
        spawnEffect(0.45, 0.40, 'crisis');
    }
}

// ======================== CARD CONSEQUENCES (P0) ========================
// Events triggered BY your card choices, not random rolls
const CARD_CONSEQUENCES = {
    // MILITARY
    carrier_strike: [
        { text: 'Iran test-fires anti-ship missiles in response to carrier deployment', effect: () => { SIM.tension += 8; SIM.iranAggression += 3; }, level: 'critical', funding: 'any' },
        { text: 'Carrier presence deters IRGC patrols — shipping confidence rises', effect: () => { SIM.oilFlow = Math.min(100, SIM.oilFlow + 3); }, level: 'good', funding: 'medium' },
        { text: 'Carrier deployment dominates the news cycle — public rallies behind the mission', effect: () => { SIM.domesticApproval += 3; }, level: 'good', funding: 'high' },
        { text: 'F-35 from carrier shoots down Iranian Shahed drone approaching task force', effect: () => { SIM.interceptCount++; SIM.iranAggression -= 5; SIM.domesticApproval += 5; }, level: 'good', funding: 'high' },
        { text: 'Iran deploys anti-ship ballistic missiles in response to carrier — "carrier killer" threat', effect: () => { SIM.tension += 12; SIM.conflictRisk += 8; }, level: 'critical', funding: 'any' },
    ],
    naval_patrol: [
        { text: 'USN patrol intercepts suspicious vessel — clear signal to Iran', effect: () => { SIM.iranAggression -= 2; SIM.interceptCount++; }, level: 'good', funding: 'medium' },
        { text: 'Patrol encounters IRGC fast boats — tense standoff', effect: () => { SIM.tension += 5; }, level: 'warning', funding: 'any' },
        { text: 'Patrol discovers Iranian explosive drone boats drifting in shipping lane', effect: () => { SIM.fogOfWar -= 8; SIM.tension += 3; }, level: 'warning', funding: 'any' },
        { text: 'USS destroyer escorts tanker through strait — insurance companies take notice', effect: () => { SIM.oilFlow = Math.min(100, SIM.oilFlow + 4); SIM.oilPrice -= 3; }, level: 'good', funding: 'high' },
    ],
    active_intercept: [
        { text: 'Aggressive ROE triggers near-miss with Iranian vessel', effect: () => { SIM.tension += 10; SIM.warPath++; }, level: 'critical', funding: 'high' },
        { text: 'Active intercept prevents tanker seizure', effect: () => { SIM.interceptCount++; SIM.domesticApproval += 2; }, level: 'good', funding: 'any' },
    ],
    missile_strike: [
        { text: 'Precision strike footage goes viral — world holds its breath', effect: () => { SIM.tension += 15; SIM.domesticApproval += 5; SIM.internationalStanding -= 8; }, level: 'critical', funding: 'any' },
        { text: 'Iran vows retaliation for strikes on sovereign territory', effect: () => { SIM.iranAggression += 10; SIM.warPath++; }, level: 'critical', funding: 'high' },
    ],
    regional_deterrence: [
        { text: 'Joint ops degrade Houthi launch capabilities', effect: () => { SIM.proxyThreat = Math.max(0, SIM.proxyThreat - 5); }, level: 'good', funding: 'medium' },
        { text: 'Regional deterrence operations strain alliances', effect: () => { SIM.internationalStanding -= 2; }, level: 'warning', funding: 'high' },
    ],
    // DIPLOMATIC
    back_channel: [
        { text: 'Back-channel produces a small breakthrough — Iran releases two detained sailors', effect: () => { SIM.tension -= 5; SIM.diplomaticCapital += 3; }, level: 'good', funding: 'medium' },
        { text: 'Back-channel talks leaked to press — hawks on both sides furious', effect: () => { SIM.domesticApproval -= 5; SIM.tension += 5; SIM.diplomaticCapital -= 5; }, level: 'critical', funding: 'high' },
    ],
    gulf_coalition: [
        { text: 'Allied naval forces conduct joint patrol — show of unity', effect: () => { SIM.internationalStanding += 3; SIM.iranAggression -= 2; }, level: 'good', funding: 'any' },
        { text: 'Coalition partner demands more say in rules of engagement', effect: () => { SIM.internationalStanding -= 2; }, level: 'warning', funding: 'high' },
        { text: 'Japan reluctantly sends two destroyers after arm-twisting — coalition grows', effect: () => { SIM.internationalStanding += 5; SIM.oilFlow = Math.min(100, SIM.oilFlow + 3); }, level: 'good', funding: 'medium' },
        { text: 'Coalition allies refuse burden-sharing — US carries 80% of costs', effect: () => { SIM.budget -= 20; SIM.internationalStanding -= 3; }, level: 'warning', funding: 'any' },
    ],
    un_resolution: [
        { text: 'UN debate isolates Iran diplomatically', effect: () => { SIM.internationalStanding += 3; }, level: 'good', funding: 'any' },
    ],
    summit_proposal: [
        { text: 'Iran considers summit proposal — hardliners debate internally', effect: () => { SIM.iranAggression -= 3; SIM.tension -= 3; }, level: 'good', funding: 'medium' },
        { text: 'Critics call summit proposal "appeasement"', effect: () => { SIM.domesticApproval -= 3; SIM.polarization += 2; }, level: 'warning', funding: 'any' },
    ],
    humanitarian_corridor: [
        { text: 'Humanitarian aid reaches affected populations — viral footage', effect: () => { SIM.internationalStanding += 4; SIM.domesticApproval += 2; }, level: 'good', funding: 'any' },
    ],
    // ECONOMIC
    targeted_sanctions: [
        { text: 'Sanctioned IRGC commander vows revenge — Iran seizes a tanker', effect: () => { SIM.tension += 10; SIM.seizureCount++; SIM.recentSeizureDays.push(SIM.day); SIM.warPath++; }, level: 'critical', funding: 'medium' },
        { text: 'Sanctions bite — Iranian economy contracts further', effect: () => { SIM.iranEconomy -= 3; }, level: 'good', funding: 'any' },
        { text: 'China quietly increases Iranian oil purchases to circumvent sanctions', effect: () => { SIM.chinaRelations -= 3; SIM.iranEconomy += 2; }, level: 'warning', funding: 'high' },
        { text: 'Dark fleet tanker caught doing ship-to-ship transfer of Iranian oil', effect: () => { SIM.iranEconomy -= 5; SIM.fogOfWar -= 3; }, level: 'good', funding: 'high' },
        { text: 'Secondary sanctions catch a Chinese bank — Beijing protests formally', effect: () => { SIM.chinaRelations -= 8; SIM.iranEconomy -= 5; SIM.internationalStanding -= 3; }, level: 'warning', funding: 'high' },
    ],
    maximum_pressure: [
        { text: 'Maximum pressure pushes Iran into a corner — provocations spike', effect: () => { SIM.iranAggression += 8; SIM.tension += 8; }, level: 'critical', funding: 'high' },
        { text: 'Secondary sanctions anger European allies', effect: () => { SIM.internationalStanding -= 5; }, level: 'warning', funding: 'medium' },
        { text: 'Oil prices surge on maximum pressure announcement', effect: () => { SIM.oilPrice += 8; SIM.domesticApproval -= 2; }, level: 'warning', funding: 'any' },
        { text: 'Iran\'s currency collapses 15% — street protests in Tehran and Isfahan', effect: () => { SIM.iranEconomy -= 8; SIM.iranAggression += 5; SIM.tension += 3; }, level: 'warning', funding: 'high' },
        { text: 'Iran accelerates uranium enrichment in response to pressure', effect: () => { SIM.tension += 8; SIM.conflictRisk += 5; SIM.internationalStanding -= 3; }, level: 'critical', funding: 'any' },
    ],
    reserve_release: [
        { text: 'Reserve release calms oil markets — gas prices drop', effect: () => { SIM.domesticApproval += 2; }, level: 'good', funding: 'any' },
    ],
    trade_incentives: [
        { text: 'Trade incentives spark debate — "rewarding bad behavior?"', effect: () => { SIM.polarization += 3; SIM.domesticApproval -= 2; }, level: 'warning', funding: 'any' },
        { text: 'Iran moderates gain leverage from trade talks', effect: () => { SIM.iranAggression -= 3; }, level: 'good', funding: 'medium' },
    ],
    // INTELLIGENCE
    sigint_sweep: [
        { text: 'SIGINT intercept reveals IRGC mine-laying plans', effect: () => { SIM.fogOfWar -= 5; }, level: 'good', funding: 'medium' },
    ],
    cyber_operation: [
        { text: 'Cyber op disrupts IRGC comms — boats go silent for hours', effect: () => { SIM.iranAggression -= 3; SIM.fogOfWar -= 5; }, level: 'good', funding: 'medium' },
        { text: 'Iran detects cyber intrusion — retaliates with own cyber attack', effect: () => { SIM.tension += 5; SIM.fogOfWar += 5; }, level: 'critical', funding: 'high' },
        { text: 'Cyber op disables IRGC naval command network for 48 hours — boats go dark', effect: () => { SIM.iranAggression -= 8; SIM.fogOfWar -= 12; SIM.tension += 5; }, level: 'good', funding: 'high' },
        { text: 'Iran\'s APT33 retaliates — hits US port systems with wiper malware', effect: () => { SIM.oilFlow -= 5; SIM.tension += 8; SIM.fogOfWar += 5; }, level: 'critical', funding: 'high' },
    ],
    drone_surveillance: [
        { text: 'Drone reveals Iranian military buildup at Bandar Abbas', effect: () => { SIM.fogOfWar -= 8; SIM.tension += 3; }, level: 'warning', funding: 'any' },
        { text: 'Iran shoots down a surveillance drone', effect: () => { SIM.tension += 8; SIM.warPath++; }, level: 'critical', funding: 'high' },
        { text: 'MQ-9 Reaper tracks Iranian minelayer — coordinates shared with minesweepers', effect: () => { SIM.fogOfWar -= 10; SIM.oilFlow = Math.min(100, SIM.oilFlow + 3); }, level: 'good', funding: 'medium' },
    ],
    // DOMESTIC
    media_blitz: [
        { text: 'Media campaign goes viral — public sentiment shifts', effect: () => { SIM.domesticApproval += 2; }, level: 'good', funding: 'any' },
    ],
    congressional_briefing: [
        { text: 'Bipartisan support emerges after classified briefing', effect: () => { SIM.polarization -= 3; SIM.domesticApproval += 2; }, level: 'good', funding: 'medium' },
    ],
    america_first: [
        { text: 'Iran sees withdrawal signals — aggression increases', effect: () => { SIM.iranAggression += 5; }, level: 'warning', funding: 'medium' },
        { text: 'Troops coming home makes front page — base energized', effect: () => { SIM.domesticApproval += 5; }, level: 'good', funding: 'high' },
        { text: 'Allies panic at withdrawal rhetoric — coalition fractures', effect: () => { SIM.internationalStanding -= 5; }, level: 'warning', funding: 'any' },
    ],
    // NEW CARD CONSEQUENCES
    mine_countermeasures: [
        { text: 'MCM vessel clears 3 mines from shipping lane — safe transit restored', effect: () => { SIM.oilFlow = Math.min(100, SIM.oilFlow + 5); SIM.oilPrice -= 3; }, level: 'good', funding: 'medium' },
        { text: 'Combat diver killed disarming Iranian mine — first MCM casualty', effect: () => { SIM.domesticApproval -= 3; SIM.tension += 5; }, level: 'critical', funding: 'high' },
        { text: 'Drone submarine maps entire Iranian minefield — invaluable data', effect: () => { SIM.fogOfWar -= 10; }, level: 'good', funding: 'any' },
    ],
    submarine_warfare: [
        { text: 'US submarine tracks Iranian Kilo-class sub for 72 hours — full pattern of life', effect: () => { SIM.fogOfWar -= 12; SIM.iranAggression -= 3; }, level: 'good', funding: 'medium' },
        { text: 'Near-collision between US and Iranian submarines in shallow waters', effect: () => { SIM.tension += 10; SIM.warPath++; }, level: 'critical', funding: 'high' },
        { text: 'Submarine intelligence reveals IRGC coastal battery locations', effect: () => { SIM.fogOfWar -= 8; SIM.conflictRisk -= 3; }, level: 'good', funding: 'any' },
    ],
    ballistic_missile_defense: [
        { text: 'Patriot battery intercepts Iranian ballistic missile targeting Al Udeid — system works', effect: () => { SIM.domesticApproval += 5; SIM.internationalStanding += 3; }, level: 'good', funding: 'medium' },
        { text: 'THAAD deployment reassures Gulf allies — Bahrain and UAE increase cooperation', effect: () => { SIM.internationalStanding += 4; SIM.oilFlow = Math.min(100, SIM.oilFlow + 2); }, level: 'good', funding: 'any' },
        { text: 'Interceptor miss — debris falls in populated area. 3 civilian casualties', effect: () => { SIM.internationalStanding -= 5; SIM.domesticApproval -= 3; }, level: 'critical', funding: 'high' },
    ],
    oil_diplomacy: [
        { text: 'Saudi Arabia announces 2M barrel/day production increase — markets rally', effect: () => { SIM.oilPrice -= 8; SIM.domesticApproval += 3; }, level: 'good', funding: 'high' },
        { text: 'OPEC+ deal falls apart — Russia blocks the increase', effect: () => { SIM.oilPrice += 5; SIM.chinaRelations -= 3; }, level: 'warning', funding: 'medium' },
        { text: 'IEA coordinated reserve release calms speculation', effect: () => { SIM.oilPrice -= 4; }, level: 'good', funding: 'any' },
    ],
    insurance_backstop: [
        { text: 'Government insurance restores tanker traffic — 12 ships transit in 24 hours', effect: () => { SIM.oilFlow = Math.min(100, SIM.oilFlow + 5); }, level: 'good', funding: 'medium' },
        { text: 'Insurance program cost overruns — $3B more than projected', effect: () => { SIM.budget -= 30; SIM.domesticApproval -= 2; }, level: 'warning', funding: 'high' },
    ],
    humint_iran: [
        { text: 'Asset inside IRGC reveals planned seizure operation — preempted', effect: () => { SIM.fogOfWar -= 10; SIM.interceptCount++; }, level: 'good', funding: 'medium' },
        { text: 'HUMINT asset compromised — Iran arrests double agent. Source network at risk', effect: () => { SIM.fogOfWar += 10; SIM.tension += 5; }, level: 'critical', funding: 'high' },
        { text: 'Iranian defector provides detailed order of battle for IRGC Navy', effect: () => { SIM.fogOfWar -= 15; SIM.iranAggression -= 3; }, level: 'good', funding: 'high' },
    ],
    electronic_warfare: [
        { text: 'EA-18G Growler jams IRGC command frequency — fast boats lose coordination', effect: () => { SIM.iranAggression -= 5; SIM.oilFlow = Math.min(100, SIM.oilFlow + 3); }, level: 'good', funding: 'medium' },
        { text: 'Iran adapts to jamming — switches to fiber optic landlines', effect: () => { SIM.fogOfWar += 5; }, level: 'warning', funding: 'any' },
        { text: 'Full spectrum EW blinds IRGC radar network for 6 hours — shipping transits freely', effect: () => { SIM.oilFlow = Math.min(100, SIM.oilFlow + 8); SIM.iranAggression -= 8; }, level: 'good', funding: 'high' },
    ],
    war_crimes_tribunal: [
        { text: 'ICC fact-finding team documents Iranian mine-laying — legal case builds', effect: () => { SIM.internationalStanding += 5; SIM.iranAggression -= 2; }, level: 'good', funding: 'any' },
        { text: 'Tribunal investigation also scrutinizes US civilian casualties — awkward', effect: () => { SIM.internationalStanding -= 3; SIM.domesticApproval -= 2; }, level: 'warning', funding: 'high' },
    ],
};

function triggerCardConsequence() {
    if (!SIM.activeStances || SIM.activeStances.length === 0) return;

    // Pick a random active stance
    const stance = SIM.activeStances[Math.floor(Math.random() * SIM.activeStances.length)];
    const consequences = CARD_CONSEQUENCES[stance.cardId];
    if (!consequences || consequences.length === 0) return;

    // Filter by funding level
    const eligible = consequences.filter(c =>
        c.funding === 'any' || c.funding === stance.funding
    );
    if (eligible.length === 0) return;

    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    pick.effect();
    // Attribute consequence to the card that caused it
    const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS), ...Object.values(CONTACT_CARDS)];
    const card = allCards.find(c => c.id === stance.cardId);
    const cardName = card ? card.name : stance.cardId;
    addHeadline(`[${cardName.toUpperCase()}] ${pick.text}`, pick.level);
}

// Fallback ambient events (fewer, for when no card consequences fire)
function triggerAmbientEvent() {
    const events = [
        { text: 'Oil markets react to regional instability', effect: () => { SIM.oilPrice += 3; }, level: 'warning' },
        { text: 'Gulf states increase oil production', effect: () => { SIM.oilPrice -= 4; }, level: 'good' },
        { text: 'Insurance premiums for strait transit increase', effect: () => { SIM.oilPrice += 2; }, level: 'warning' },
        { text: 'China urges restraint', effect: () => { SIM.tension -= 2; SIM.chinaRelations += 2; }, level: 'good' },
        { text: 'Gas prices at pump hit 5-year high in US', effect: () => { SIM.domesticApproval -= 3; }, level: 'warning' },
        { text: 'Iranian moderates push for diplomatic solution', effect: () => { SIM.iranAggression -= 3; }, level: 'good' },
        { text: 'India declares energy emergency — LPG diverted from industry to households', effect: () => { SIM.internationalStanding -= 2; SIM.oilPrice += 4; }, level: 'warning' },
        { text: 'Japan warns of rolling blackouts if strait remains closed', effect: () => { SIM.internationalStanding += 2; SIM.oilPrice += 3; }, level: 'warning' },
        { text: 'South Korea sends intelligence-sharing liaison to CENTCOM', effect: () => { SIM.fogOfWar -= 3; SIM.internationalStanding += 2; }, level: 'good' },
        { text: 'Lloyd\'s of London raises war risk premiums 300% for strait transit', effect: () => { SIM.oilFlow = Math.max(10, SIM.oilFlow - 3); SIM.oilPrice += 5; }, level: 'warning' },
        { text: 'Iranian rial crashes to historic low — street protests erupt', effect: () => { SIM.iranEconomy -= 5; SIM.iranAggression += 3; }, level: 'warning' },
        { text: 'Russia quietly ships advanced anti-ship missiles to Iran via Caspian route', effect: () => { SIM.iranAggression += 3; SIM.conflictRisk += 3; SIM.chinaRelations -= 3; }, level: 'critical' },
        { text: 'Global shipping companies announce permanent rerouting via Cape of Good Hope', effect: () => { SIM.oilPrice += 3; SIM.oilFlow = Math.max(10, SIM.oilFlow - 2); }, level: 'warning' },
        { text: 'OPEC+ emergency meeting called — Saudi Arabia offers to increase production', effect: () => { SIM.oilPrice -= 4; SIM.internationalStanding += 2; }, level: 'good' },
        { text: 'Iran offers to "down-blend" enriched uranium as diplomatic gesture', effect: () => { SIM.tension -= 3; SIM.diplomaticCapital += 3; }, level: 'good' },
        { text: 'Pentagon confirms Iran retains 80-90% of naval fast boat fleet despite strikes', effect: () => { SIM.iranAggression += 2; SIM.conflictRisk += 2; }, level: 'warning' },
        { text: 'US trucking industry warns of supply chain collapse if oil stays above $140', effect: () => { SIM.domesticApproval -= 3; SIM.polarization += 2; }, level: 'warning' },
        { text: 'Chinese spy ship detected in Gulf of Oman — sharing data with IRGC?', effect: () => { SIM.chinaRelations -= 3; SIM.fogOfWar += 3; }, level: 'warning' },
        { text: 'European Central Bank emergency meeting — strait crisis threatening EU economy', effect: () => { SIM.internationalStanding += 3; SIM.oilPrice += 2; }, level: 'warning' },
        { text: 'Iranian rial hits record low — 800,000 to the dollar', effect: () => { SIM.iranEconomy -= 5; SIM.iranAggression += 2; }, level: 'warning' },
        { text: 'Bahrain closes US Naval Forces Central Command to non-essential personnel', effect: () => { SIM.tension += 3; SIM.internationalStanding -= 2; }, level: 'warning' },
        { text: 'Norway sends frigate to join coalition — first Arctic nation contribution', effect: () => { SIM.internationalStanding += 3; SIM.oilFlow = Math.min(100, SIM.oilFlow + 1); }, level: 'good' },
        { text: 'Iranian diaspora protests in London, Berlin, and Toronto — "Regime must fall"', effect: () => { SIM.iranAggression += 2; SIM.internationalStanding += 2; }, level: 'normal' },
        { text: 'US trucking industry halts non-essential routes — diesel rationing begins', effect: () => { SIM.domesticApproval -= 4; SIM.polarization += 2; }, level: 'warning' },
        { text: 'Australian PM pledges naval support — HMAS Hobart en route', effect: () => { SIM.internationalStanding += 3; }, level: 'good' },
        { text: 'IRGC propaganda video shows missile strike simulation on US carrier', effect: () => { SIM.tension += 3; SIM.iranAggression += 2; }, level: 'warning' },
        { text: 'Gold hits $3,200/oz as investors flee to safe havens', effect: () => { SIM.oilPrice += 2; SIM.domesticApproval -= 1; }, level: 'warning' },
        { text: 'Iranian FM Araghchi offers "conditional ceasefire" through Swiss intermediary', effect: () => { SIM.tension -= 3; SIM.diplomaticCapital += 3; }, level: 'good' },
        { text: 'Pentagon confirms Iran using North Korean missile technology in latest launches', effect: () => { SIM.tension += 3; SIM.internationalStanding += 2; }, level: 'warning' },
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    addHeadline(event.text, event.level);
}

function triggerIranProvocation() {
    const provocations = [
        { text: 'IRGC Navy conducts aggressive maneuvers near shipping', tension: 5, level: 'critical' },
        { text: 'Iran test-fires anti-ship missiles in exercise', tension: 8, level: 'critical' },
        { text: 'Iranian patrol boats shadow US Navy vessel', tension: 3, level: 'warning' },
        { text: 'Iran threatens to close strait if sanctions continue', tension: 4, level: 'warning' },
        { text: 'Iranian drone flies close to US carrier group', tension: 6, level: 'critical' },
        { text: 'Iran announces new military exercises in Persian Gulf', tension: 4, level: 'warning' },
        { text: 'IRGC deploys fast attack boats in shipping lane', tension: 5, level: 'warning' },
        { text: 'IRGC commissions Heydar-class fast boats — "fastest combat boats on earth"', tension: 6, level: 'critical' },
        { text: 'Iranian drone carrier IRIS Shahid Bagheri detected deploying fast attack craft', tension: 8, level: 'critical' },
        { text: 'Iran transfers long-range ballistic missiles to Iraqi militias', tension: 7, level: 'critical' },
        { text: 'Iranian submarine detected leaving Bandar Abbas — heading toward strait', tension: 5, level: 'warning' },
        { text: 'IRGC seizes a second tanker in 24 hours — pattern of systematic seizures', tension: 10, level: 'critical' },
        { text: 'Iran announces live-fire naval exercise in strait shipping lanes', tension: 6, level: 'warning' },
        { text: 'Iranian state media broadcasts footage of anti-ship missile test', tension: 5, level: 'warning' },
        { text: 'IRGC deploys explosive-laden drone boats in shipping channel', tension: 7, level: 'critical' },
        { text: 'Iran launches anti-ship ballistic missile into Gulf — splashes 5nm from tanker convoy', tension: 10, level: 'critical' },
        { text: 'IRGC underwater divers detected attaching limpet mines to tanker hull', tension: 8, level: 'critical' },
        { text: 'Iranian Fateh-class submarine surfaces aggressively near US destroyer', tension: 6, level: 'critical' },
        { text: 'Mojtaba Khamenei orders IRGC to "prepare for the final battle"', tension: 5, level: 'warning' },
        { text: 'Iran blocks Omani diplomatic aircraft from landing — escalation of isolation', tension: 4, level: 'warning' },
        { text: 'IRGC fires warning shots at commercial helicopter servicing oil platforms', tension: 5, level: 'warning' },
    ];
    const prov = provocations[Math.floor(Math.random() * provocations.length)];
    SIM.tension = Math.min(100, SIM.tension + prov.tension);
    addHeadline(prov.text, prov.level);
}

function triggerSeizureDecision(tanker) {
    const event = {
        id: 'seizure_response_' + SIM.day,
        title: 'TANKER SEIZED',
        description: `IRGC Navy has seized the ${tanker.flag}-flagged tanker ${tanker.id}. ${tanker.flag === 'GBR' || tanker.flag === 'JPN' ? 'Allied nations demand a response.' : 'The world is watching.'} How do you respond?`,
        countdown: 10,
        choices: [
            { text: 'Demand immediate release', effects: { tension: 5, domesticApproval: 3, iranAggression: 2 }, flavor: 'A forceful statement is issued. Iran calls it "empty rhetoric."' },
            { text: 'Authorize naval intercept', effects: { tension: 12, oilFlowProtection: 5, conflictRisk: 8, domesticApproval: 5, warPath: 1 }, flavor: 'Navy moves to intercept. The confrontation escalates.' },
            { text: 'Open emergency back-channel', effects: { tension: -3, diplomaticCapital: -5, domesticApproval: -3, iranAggression: -3 }, flavor: 'Quiet negotiations begin. Critics call it weak.' },
        ],
    };
    SIM.phase = 'event';
    SIM.decisionEventActive = true;
    showDecisionEvent(event);
}

// ======================== DECISION EVENTS ========================

const DECISION_EVENTS = [
    // ======================== CONTENT BIBLE EVENTS (E01-E23) ========================
    {
        id: 'impounded_tanker', title: '',
        description: '',
        image: 'assets/event-e01-tanker.png',
        minDay: 1, maxDay: 3,
        choices: [
            { text: '', effects: { internationalStanding: 5, tension: -3, iranAggression: 5 },
              setFlags: { tanker_diplomatic: true },
              flavor: '' },
            { text: '', effects: { tension: 8, internationalStanding: -3 },
              setFlags: { tanker_military: true }, chainEvent: 'carrier_incident', chainDelay: 10,
              chainHint: 'Iran is watching your destroyer very carefully...',
              flavor: '' },
            { text: '', effects: { internationalStanding: 3, diplomaticCapital: 3 },
              setFlags: { tanker_coalition: true },
              flavor: '' },
        ],
    },
    {
        id: 'predecessors_ghost', title: '',
        description: '',
        image: 'assets/event-e02-predecessor.png',
        minDay: 2, maxDay: 4,
        choices: [
            { text: '', effects: { fogOfWar: -10 },
              setFlags: { predecessor_read: true },
              flavor: '' },
            { text: '', effects: { domesticApproval: 5 },
              setFlags: { predecessor_burned: true },
              flavor: '' },
        ],
    },
    {
        id: 'admirals_warning', title: '',
        description: '',
        image: 'assets/event-e03-admiral.png',
        minDay: 1, maxDay: 2,
        choices: [
            { text: '', effects: { budget: -20, tension: 3 },
              setFlags: { admiral_deferred: true },
              flavor: '' },
            { text: '', effects: { },
              setFlags: { admiral_waited: true },
              flavor: '' },
            { text: '', effects: { diplomaticCapital: 5 },
              setFlags: { admiral_overridden: true },
              flavor: '' },
        ],
    },
    {
        id: 'journalists_call', title: '',
        description: '',
        image: 'assets/event-e04-journalist.png',
        minDay: 3, maxDay: 5,
        condition: () => SIM.fogOfWar > 50,
        choices: [
            { text: '', effects: { fogOfWar: -10, domesticApproval: 3 },
              setFlags: { journalist_briefed: true }, chainEvent: 'journalist_returns', chainDelay: 20,
              chainHint: 'This journalist will remember how you treated her...',
              flavor: '' },
            { text: '', effects: { fogOfWar: -3, domesticApproval: -2 },
              setFlags: { journalist_stonewalled: true },
              flavor: '' },
            { text: '', effects: { },
              setFlags: { journalist_hostile: true },
              flavor: '' },
        ],
    },
    {
        id: 'british_pm_call', title: '',
        description: '',
        image: 'assets/event-e05-british-pm.png',
        minDay: 4, maxDay: 6,
        choices: [
            { text: '', effects: { internationalStanding: 10, tension: -3 },
              setFlags: { british_joint_force: true },
              flavor: '' },
            { text: '', effects: { internationalStanding: 5 },
              setFlags: { british_parallel: true },
              flavor: '' },
            { text: '', effects: { diplomaticCapital: 3 },
              setFlags: { british_negotiating: true },
              flavor: '' },
        ],
    },
    {
        id: 'first_seizure_attempt', title: '',
        description: '',
        image: 'assets/event-e06-seizure.png',
        minDay: 6, maxDay: 8,
        condition: () => SIM.warPath < 3,
        countdown: 12,
        choices: [
            { text: '', effects: { tension: 3 },
              setFlags: { seizure_warned: true },
              flavor: '' },
            { text: '', effects: { tension: 8, warPath: 1 },
              setFlags: { seizure_shots: true },
              flavor: '' },
            { text: '', effects: { oilFlow: -15, tension: 10, internationalStanding: 15, diplomaticCapital: 10 },
              setFlags: { seizure_allowed: true },
              flavor: '' },
        ],
    },
    {
        id: 'oil_markets_panic', title: '',
        description: '',
        image: 'assets/event-e08-oil-panic.png',
        minDay: 9, maxDay: 12,
        condition: () => SIM.oilFlow < 60,
        choices: [
            { text: '', effects: { oilFlow: 10, oilPrice: -8, domesticApproval: 5, budget: -50 },
              setFlags: { spr_released: true },
              flavor: '' },
            { text: '', effects: { oilFlow: 8, internationalStanding: -3 },
              setFlags: { saudi_called: true },
              flavor: '' },
            { text: '', effects: { domesticApproval: -8, oilPrice: 5 },
              setFlags: { markets_ignored: true },
              flavor: '' },
        ],
    },
    {
        id: 'un_showdown', title: '',
        description: '',
        image: 'assets/event-e11-un-showdown.png',
        minDay: 17, maxDay: 20,
        choices: [
            { text: '', effects: { diplomaticCapital: 20, internationalStanding: 8, tension: 3 },
              condition: () => SIM.internationalStanding > 50,
              setFlags: { un_binding: true },
              flavor: '' },
            { text: '', effects: { internationalStanding: 3 },
              flavor: '' },
            { text: '', effects: { fogOfWar: -20, internationalStanding: 10, tension: 8 },
              setFlags: { un_theater: true },
              flavor: '' },
        ],
    },
    {
        id: 'proxy_ignition', title: '',
        description: '',
        image: 'assets/event-e14-houthi.png',
        minDay: 29, maxDay: 32,
        choices: [
            { text: '', effects: { budget: -20, tension: 8, proxyThreat: -15, internationalStanding: -3 },
              setFlags: { houthi_struck: true },
              flavor: '' },
            { text: '', effects: { budget: -10, proxyThreat: -3 },
              setFlags: { houthi_contained: true },
              flavor: '' },
            { text: '', effects: { tension: 10, diplomaticCapital: 5 },
              setFlags: { proxy_redline: true },
              flavor: '' },
        ],
    },
    {
        id: 'the_leak', title: '',
        description: '',
        image: 'assets/event-e17-leak.png',
        minDay: 20, maxDay: 28,
        condition: () => Math.random() < 0.5 || SIM.domesticApproval < 30,
        choices: [
            { text: '', effects: { domesticApproval: 3, fogOfWar: -5 },
              setFlags: { leak_investigated: true },
              flavor: '' },
            { text: '', effects: { domesticApproval: 5, fogOfWar: 5 },
              setFlags: { leak_spun: true },
              flavor: '' },
            { text: '', effects: { domesticApproval: -5 },
              flavor: '' },
        ],
    },
    {
        id: 'congressional_hearing_big', title: '',
        description: '',
        image: 'assets/event-e18-congress.png',
        minDay: 36, maxDay: 40,
        choices: [
            { text: '', effects: { domesticApproval: 10, fogOfWar: -5 },
              setFlags: { testified_personally: true },
              flavor: '' },
            { text: '', effects: { domesticApproval: -5, internationalStanding: -3 },
              flavor: '' },
            { text: '', effects: { fogOfWar: -15, domesticApproval: 15, tension: 5, internationalStanding: 5 },
              setFlags: { declassified_live: true },
              flavor: '' },
        ],
    },
    {
        id: 'iran_ultimatum', title: '',
        description: '',
        image: 'assets/event-e07-iran-doubles.png',
        minDay: 38, maxDay: 42,
        countdown: 15,
        choices: [
            { text: '', effects: { domesticApproval: 8, tension: 10 },
              setFlags: { ultimatum_called: true },
              flavor: '' },
            { text: '', effects: { diplomaticCapital: 5, tension: -3 },
              condition: () => SIM.diplomaticCapital > 30,
              setFlags: { ultimatum_negotiated: true },
              flavor: '' },
            { text: '', effects: { budget: -15, tension: 3 },
              setFlags: { ultimatum_prepared: true },
              flavor: '' },
        ],
    },
    {
        id: 'intel_breakthrough', title: '',
        description: '',
        image: 'assets/event-e21-intel-breakthrough.png',
        minDay: 57, maxDay: 62,
        choices: [
            { text: '', effects: { internationalStanding: 15, diplomaticCapital: 10, fogOfWar: 10 },
              setFlags: { intel_shared: true },
              flavor: '' },
            { text: '', effects: { fogOfWar: -10 },
              setFlags: { intel_hoarded: true },
              flavor: '' },
            { text: '', effects: { fogOfWar: -20, domesticApproval: 8 },
              setFlags: { intel_leaked: true },
              flavor: '' },
        ],
    },
    // --- CONTENT BIBLE CHAIN EVENTS ---
    {
        id: 'journalist_returns', title: '',
        description: '',
        image: 'assets/event-e04-journalist.png',
        minDay: 20, maxDay: 999,
        condition: () => SIM.storyFlags.journalist_briefed,
        choices: [
            { text: '', effects: { domesticApproval: 10, fogOfWar: -5 },
              flavor: '' },
            { text: '', effects: { domesticApproval: 15, fogOfWar: -10 },
              flavor: '' },
            { text: '', effects: { domesticApproval: 8 },
              flavor: '' },
        ],
    },
    {
        id: 'carrier_incident', title: '',
        description: '',
        image: 'assets/event-hegseth-carrier.png',
        minDay: 10, maxDay: 999,
        condition: () => SIM.storyFlags.tanker_military || SIM.warPath >= 2,
        choices: [
            { text: '', effects: { internationalStanding: 3 },
              flavor: '' },
            { text: '', effects: { fogOfWar: -15, internationalStanding: 8, domesticApproval: 10, tension: 5, iranAggression: -5 },
              setFlags: { humiliated_iran: true },
              flavor: '' },
            { text: '', effects: { tension: 20, warPath: 1, domesticApproval: 5, budget: -25, iranAggression: 10 },
              setFlags: { drone_facility_struck: true },
              flavor: '' },
        ],
    },
    // ======================== ORIGINAL EVENTS ========================
    {
        id: 'secret_talks', title: '',
        description: '',
        image: 'assets/event-e10-shirazi.png',
        minDay: 5, maxDay: 40,
        condition: () => SIM.tension > 25 && SIM.diplomaticCapital > 20,
        choices: [
            { text: '', effects: { tension: -12, domesticApproval: -5, diplomaticCapital: 15, iranAggression: -8 },
              setFlags: { backchannel_accepted: true }, chainEvent: 'backchannel_progress', chainDelay: 4,
              chainHint: 'The Omani intermediary will report back in a few days...',
              flavor: '' },
            { text: '', effects: { tension: 3, iranAggression: 5 },
              setFlags: { backchannel_rejected: true },
              flavor: '' },
            { text: '', effects: { domesticApproval: 8, tension: 6, diplomaticCapital: -15 },
              setFlags: { backchannel_leaked: true },
              flavor: '' },
        ],
    },
    {
        id: 'congress_pressure', title: '',
        description: '',
        image: 'assets/event-e18-congress.png',
        minDay: 10, maxDay: 60,
        condition: () => getStanceEffect('cost') > 100,
        choices: [
            { text: '', effects: { domesticApproval: 5, fogOfWar: -10, polarization: -3 }, flavor: '' },
            { text: '', effects: { domesticApproval: 3, polarization: -2 }, flavor: '' },
            { text: '', effects: { domesticApproval: -10, polarization: 5 }, flavor: '' },
        ],
    },
    {
        id: 'allied_request', title: '',
        description: '',
        image: 'assets/event-envoy.png',
        minDay: 8, maxDay: 50,
        condition: () => SIM.navyShips.length > 0,
        choices: [
            { text: '', effects: { internationalStanding: 10, oilFlowProtection: 5, domesticApproval: -2, tension: 3 }, flavor: '' },
            { text: '', effects: { internationalStanding: -3 }, flavor: '' },
        ],
    },
    {
        id: 'humanitarian', title: '',
        description: '',
        image: 'assets/event-rescue-op.png',
        minDay: 6, maxDay: 70,
        condition: () => SIM.navyShips.length > 0,
        choices: [
            { text: '', effects: { internationalStanding: 12, tension: -8, iranAggression: -5, domesticApproval: 5, diplomaticCapital: 10 }, flavor: '' },
            { text: '', effects: { internationalStanding: 3, tension: -3, diplomaticCapital: 5 }, flavor: '' },
            { text: '', effects: { internationalStanding: -8, tension: 2, domesticApproval: -5 }, flavor: '' },
        ],
    },
    {
        id: 'media_crisis', title: '',
        description: '',
        image: 'assets/event-military.png',
        minDay: 12, maxDay: 80,
        condition: () => SIM.navyShips.length > 0 && SIM.iranBoats.length > 0,
        choices: [
            { text: '', effects: { domesticApproval: 5, tension: -2, internationalStanding: 3 }, flavor: '' },
            { text: '', effects: { domesticApproval: -3, tension: -5 }, flavor: '' },
            { text: '', effects: { domesticApproval: 3, tension: 8, iranAggression: 5, polarization: 3 }, flavor: '' },
        ],
    },
    {
        id: 'intel_reveal', title: '',
        description: '',
        image: 'assets/event-e21-intel-breakthrough.png',
        minDay: 15, maxDay: 75,
        condition: () => SIM.fogOfWar < 60 && SIM.crisisLevel >= 1,
        choices: [
            { text: '', effects: { tension: 15, iranAggression: 10, conflictRisk: 8, warPath: 1 }, flavor: '' },
            { text: '', effects: { internationalStanding: 5, fogOfWar: -15, diplomaticCapital: 8 }, flavor: '' },
            { text: '', effects: { fogOfWar: -8 }, flavor: '' },
        ],
    },
    {
        id: 'china_mediation', title: '',
        description: '',
        image: 'assets/event-e13-china.png',
        minDay: 14, maxDay: 65,
        condition: () => SIM.tension > 30 && SIM.chinaRelations > 25,
        choices: [
            { text: '', effects: { tension: -10, iranAggression: -10, domesticApproval: -8, chinaRelations: 15 }, flavor: '' },
            { text: '', effects: { tension: -4, diplomaticCapital: -5, chinaRelations: 5 }, flavor: '' },
            { text: '', effects: { domesticApproval: 5, tension: 3, chinaRelations: -10 }, flavor: '' },
        ],
    },
    {
        id: 'houthi_attack', title: '',
        description: '',
        image: 'assets/event-e14-houthi.png',
        minDay: 10, maxDay: 75,
        condition: () => SIM.proxyThreat > 25,
        choices: [
            { text: '', effects: { proxyThreat: -15, tension: 10, internationalStanding: -5, warPath: 1 }, flavor: '' },
            { text: '', effects: { proxyThreat: -8, internationalStanding: 3 }, flavor: '' },
            { text: '', effects: { proxyThreat: 5, domesticApproval: -3 }, flavor: '' },
        ],
    },
    {
        id: 'militia_attack', title: '',
        description: '',
        image: 'assets/event-military.png',
        minDay: 18, maxDay: 80,
        condition: () => SIM.proxyThreat > 35,
        choices: [
            { text: '', effects: { iranAggression: -10, proxyThreat: -10, tension: 12, warPath: 1, domesticApproval: 5 }, flavor: '' },
            { text: '', effects: { domesticApproval: -2, polarization: 2 }, flavor: '' },
            { text: '', effects: { domesticApproval: -8, tension: -5, proxyThreat: 3 }, flavor: '' },
        ],
    },
    {
        id: 'assassination_intel', title: '',
        description: '',
        image: 'assets/event-intel.png',
        minDay: 20, maxDay: 85,
        condition: () => SIM.assassinationRisk > 40,
        choices: [
            { text: '', effects: { assassinationRisk: -20 }, flavor: '' },
            { text: '', effects: { assassinationRisk: -10, tension: 5, domesticApproval: 3 }, flavor: '' },
            { text: '', effects: {}, flavor: '' },
        ],
    },
    {
        id: 'domestic_unrest', title: '',
        description: '',
        image: 'assets/event-e18-congress.png',
        minDay: 25, maxDay: 85,
        condition: () => SIM.polarization > 50,
        choices: [
            { text: '', effects: { domesticApproval: 5, polarization: -5 }, flavor: '' },
            { text: '', effects: { polarization: 10, domesticApproval: -5, internationalStanding: -5 }, flavor: '' },
            { text: '', effects: { tension: -5, domesticApproval: 3, iranAggression: 3, polarization: -3 }, flavor: '' },
        ],
    },
    {
        id: 'hostage', title: '',
        description: '',
        image: 'assets/event-e12-hostage.png',
        minDay: 10, maxDay: 75,
        condition: () => SIM.seizureCount > 0,
        choices: [
            { text: '', effects: { domesticApproval: 8, tension: -5, diplomaticCapital: -10 },
              setFlags: { hostage_negotiating: true }, chainEvent: 'hostage_situation_escalates', chainDelay: 3,
              chainHint: 'Negotiations are underway. This will take days...',
              flavor: '' },
            { text: '', effects: { tension: 8, domesticApproval: 3, iranAggression: 5, warPath: 1 },
              setFlags: { hostage_hardline: true },
              flavor: '' },
            { text: '', effects: { tension: -8, domesticApproval: -5, iranAggression: -3 },
              flavor: '' },
        ],
    },
    {
        id: 'oil_spike', title: '',
        description: '',
        image: 'assets/event-e08-oil-panic.png',
        minDay: 8, maxDay: 80,
        condition: () => SIM.oilPrice > 110,
        choices: [
            { text: '', effects: { oilPrice: -12, domesticApproval: 5 }, flavor: '' },
            { text: '', effects: { oilPrice: -4, domesticApproval: -2 }, flavor: '' },
            { text: '', effects: { domesticApproval: -5 }, flavor: '' },
        ],
    },
    {
        id: 'gulf_offer', title: '',
        description: '',
        image: 'assets/event-grand-bargain.png',
        minDay: 12, maxDay: 55,
        condition: () => getStanceEffect('cost') > 50,
        choices: [
            { text: '', effects: { domesticApproval: 5, tension: 3, internationalStanding: 3 }, flavor: '' },
            { text: '', effects: { domesticApproval: -3, tension: 5 }, flavor: '' },
            { text: '', effects: { domesticApproval: 3, diplomaticCapital: -5 }, flavor: '' },
        ],
    },
    {
        id: 'drone_shootdown', title: '',
        description: '',
        image: 'assets/event-military.png',
        minDay: 15, maxDay: 80,
        condition: () => SIM.drones.length > 0,
        choices: [
            { text: '', effects: { tension: 20, conflictRisk: 15, iranAggression: -10, domesticApproval: 5, warPath: 2 }, flavor: '' },
            { text: '', effects: { tension: 5, fogOfWar: -15, domesticApproval: 2 }, flavor: '' },
            { text: '', effects: { tension: -3, domesticApproval: -5, iranAggression: 5 }, flavor: '' },
        ],
    },
    {
        id: 'un_vote', title: '',
        description: '',
        image: 'assets/event-e11-un-showdown.png',
        minDay: 15, maxDay: 60,
        condition: () => SIM.tension > 20,
        choices: [
            { text: '', effects: { internationalStanding: 8, tension: 5, chinaRelations: -8, diplomaticCapital: -10 }, flavor: '' },
            { text: '', effects: { internationalStanding: 3, tension: -3, diplomaticCapital: 5, chinaRelations: 3 }, flavor: '' },
            { text: '', effects: { internationalStanding: -5, diplomaticCapital: -5 }, flavor: '' },
        ],
    },
    {
        id: 'cyber_attack_decision', title: '',
        description: '',
        image: 'assets/event-e23-cyber.png',
        minDay: 20, maxDay: 80,
        condition: () => SIM.iranAggression > 40,
        choices: [
            { text: '', effects: { iranAggression: -15, fogOfWar: -20, tension: 10, conflictRisk: 12, warPath: 1 }, flavor: '' },
            { text: '', effects: {}, flavor: '' },
        ],
    },
    {
        id: 'election_pressure', title: '',
        description: '',
        image: 'assets/event-diplomatic.png',
        minDay: 30, maxDay: 75,
        condition: () => true,
        choices: [
            { text: '', effects: { tension: 8, domesticApproval: 10, iranAggression: 5, polarization: 3 }, flavor: '' },
            { text: '', effects: { tension: -5, domesticApproval: -3, diplomaticCapital: 8, polarization: -2 }, flavor: '' },
            { text: '', effects: {}, flavor: '' },
        ],
    },
    {
        id: 'pipeline_sabotage', title: '',
        description: '',
        image: 'assets/event-economic.png',
        minDay: 20, maxDay: 70,
        condition: () => SIM.crisisLevel >= 1,
        choices: [
            { text: '', effects: { tension: 12, domesticApproval: 3, iranAggression: 5, warPath: 1 }, flavor: '' },
            { text: '', effects: { fogOfWar: -8 }, flavor: '' },
            { text: '', effects: { tension: -5, diplomaticCapital: 8, internationalStanding: 5 }, flavor: '' },
        ],
    },
    {
        id: 'russia_arms_deal', title: '',
        description: '',
        image: 'assets/event-intel.png',
        minDay: 18, maxDay: 70,
        condition: () => SIM.chinaRelations < 40,
        choices: [
            { text: '', effects: { chinaRelations: -15, tension: 12, iranAggression: -5, warPath: 1 }, flavor: '' },
            { text: '', effects: { chinaRelations: -5, internationalStanding: 3 }, flavor: '' },
            { text: '', effects: { iranAggression: 8, conflictRisk: 5 }, flavor: '' },
        ],
    },
    {
        id: 'iran_internal', title: '',
        description: '',
        image: 'assets/event-e07-iran-doubles.png',
        minDay: 25, maxDay: 80,
        condition: () => SIM.iranEconomy < 40 && SIM.fogOfWar < 50,
        choices: [
            { text: '', effects: { iranAggression: -12, tension: -5, diplomaticCapital: -8, fogOfWar: 5 }, flavor: '' },
            { text: '', effects: { iranAggression: 5, domesticApproval: 3, internationalStanding: -3 }, flavor: '' },
            { text: '', effects: {}, flavor: '' },
        ],
    },
    {
        id: 'tanker_escort', title: '',
        description: '',
        image: 'assets/event-envoy.png',
        minDay: 12, maxDay: 65,
        condition: () => SIM.oilFlow < 70 && SIM.navyShips.length >= 3,
        choices: [
            { text: '', effects: { oilFlowProtection: 15, tension: 5, domesticApproval: 5, internationalStanding: 8 }, flavor: '' },
            { text: '', effects: { oilFlowProtection: 8, internationalStanding: -3, domesticApproval: 2 }, flavor: '' },
            { text: '', effects: { oilFlowProtection: -5, domesticApproval: -3 }, flavor: '' },
        ],
    },
    {
        id: 'wargame_leak', title: '',
        description: '',
        image: 'assets/event-e17-leak.png',
        minDay: 20, maxDay: 75,
        condition: () => SIM.conflictRisk > 30,
        choices: [
            { text: '', effects: { domesticApproval: -5, polarization: 3 }, flavor: '' },
            { text: '', effects: { domesticApproval: 3, tension: -5, polarization: -2 }, flavor: '' },
            { text: '', effects: { domesticApproval: 5, tension: 5, conflictRisk: 5 }, flavor: '' },
        ],
    },
    {
        id: 'stena_imperative', title: '',
        description: '',
        image: 'assets/event-e06-seizure.png',
        minDay: 4, maxDay: 30,
        condition: () => SIM.navyShips.length > 0 && SIM.iranBoats.length > 1,
        countdown: 12,
        choices: [
            { text: '', effects: { tension: 15, iranAggression: -8, domesticApproval: 8, warPath: 1, internationalStanding: 3 }, flavor: '' },
            { text: '', effects: { tension: 8, iranAggression: -3, domesticApproval: 5 }, flavor: '' },
            { text: '', effects: { tension: 3, iranAggression: 5, domesticApproval: -5, oilFlow: -5 }, flavor: '' },
        ],
    },
    {
        id: 'insurance_crisis', title: '',
        description: '',
        image: 'assets/event-economic.png',
        minDay: 8, maxDay: 50,
        condition: () => SIM.tension > 40 && SIM.oilPrice > 100,
        choices: [
            { text: '', effects: { budget: -200, oilFlow: 15, domesticApproval: 5, internationalStanding: 5 }, flavor: '' },
            { text: '', effects: { oilFlow: 5, internationalStanding: -3 }, flavor: '' },
            { text: '', effects: { oilFlow: -10, oilPrice: 15, domesticApproval: -8 }, flavor: '' },
        ],
    },
    {
        id: 'nuclear_breakout', title: '',
        description: '',
        image: 'assets/event-crisis-nuclear.png',
        minDay: 20, maxDay: 70,
        condition: () => SIM.iranAggression > 50 && SIM.tension > 40,
        choices: [
            { text: '', effects: { tension: 30, warPath: 2, iranAggression: 15, internationalStanding: -15, domesticApproval: 10 },
              setFlags: { fordow_struck: true },
              flavor: '' },
            { text: '', effects: { tension: 5, internationalStanding: 10, diplomaticCapital: 15, iranAggression: 3 },
              setFlags: { nuclear_inspectors_sent: true }, chainEvent: 'nuclear_inspection_crisis', chainDelay: 4,
              chainHint: 'The IAEA team will arrive at Fordow in days...',
              flavor: '' },
            { text: '', effects: { tension: -10, iranAggression: -8, domesticApproval: -10, diplomaticCapital: 10 },
              setFlags: { nuclear_deal_proposed: true },
              flavor: '' },
        ],
    },
    {
        id: 'abqaiq_redux', title: '',
        description: '',
        image: 'assets/event-e07-iran-doubles.png',
        minDay: 12, maxDay: 65,
        condition: () => SIM.proxyThreat > 30 || SIM.iranAggression > 55,
        choices: [
            { text: '', effects: { tension: 20, warPath: 2, iranAggression: -10, proxyThreat: -15, domesticApproval: 8, oilPrice: 10 }, flavor: '' },
            { text: '', effects: { tension: 5, internationalStanding: 5, proxyThreat: -5, oilPrice: 8 }, flavor: '' },
            { text: '', effects: { oilPrice: 12, domesticApproval: -5, proxyThreat: 5 }, flavor: '' },
        ],
    },
    {
        id: 'houthi_restart', title: '',
        description: '',
        image: 'assets/event-e14-houthi.png',
        minDay: 10, maxDay: 60,
        condition: () => SIM.proxyThreat > 20,
        choices: [
            { text: '', effects: { tension: 8, proxyThreat: -12, oilFlow: 5, budget: -50, domesticApproval: 5 }, flavor: '' },
            { text: '', effects: { proxyThreat: -5, internationalStanding: 3, domesticApproval: 2 }, flavor: '' },
            { text: '', effects: { proxyThreat: 8, oilPrice: 10, internationalStanding: -5 }, flavor: '' },
        ],
    },
    {
        id: 'mine_laying_detected', title: '',
        description: '',
        image: 'assets/event-military.png',
        minDay: 15, maxDay: 60,
        condition: () => SIM.crisisLevel >= 1 && SIM.iranAggression > 50,
        choices: [
            { text: '', effects: { tension: 20, warPath: 1, iranAggression: -12, oilFlow: 5, domesticApproval: 8, internationalStanding: -5 }, flavor: '' },
            { text: '', effects: { tension: 5, oilFlow: 8, budget: -30, internationalStanding: 5 }, flavor: '' },
            { text: '', effects: { tension: 12, oilFlow: -5, warPath: 1, internationalStanding: 3 }, flavor: '' },
        ],
    },
    {
        id: 'drone_carrier', title: '',
        description: '',
        image: 'assets/event-intel.png',
        minDay: 12, maxDay: 55,
        condition: () => SIM.fogOfWar < 60,
        choices: [
            { text: '', effects: { tension: 18, iranAggression: -8, warPath: 1, domesticApproval: 5, internationalStanding: -8 }, flavor: '' },
            { text: '', effects: { fogOfWar: -10, tension: 5 }, flavor: '' },
            { text: '', effects: { internationalStanding: 8, tension: 8, iranAggression: -3, fogOfWar: 5 }, flavor: '' },
        ],
    },
    {
        id: 'china_oil_deal', title: '',
        description: '',
        image: 'assets/event-e13-china.png',
        minDay: 10, maxDay: 70,
        condition: () => SIM.chinaRelations > 20,
        choices: [
            { text: '', effects: { chinaRelations: -20, iranEconomy: -10, tension: 5, oilPrice: 8, internationalStanding: -5 }, flavor: '' },
            { text: '', effects: { chinaRelations: -5, iranEconomy: -3, diplomaticCapital: -5 }, flavor: '' },
            { text: '', effects: { iranEconomy: 5, chinaRelations: 5, domesticApproval: -5 }, flavor: '' },
        ],
    },
    {
        id: 'oman_talks', title: '', image: 'assets/iran-araghchi.png',
        description: '',
        image: 'assets/event-e20-muscat.png',
        minDay: 8, maxDay: 45,
        condition: () => SIM.diplomaticCapital > 15 && SIM.tension > 30,
        choices: [
            { text: '', effects: { tension: -10, iranAggression: -8, diplomaticCapital: 15, domesticApproval: -5, fogOfWar: 5 }, flavor: '' },
            { text: '', effects: { tension: 3, diplomaticCapital: -5, internationalStanding: 3 }, flavor: '' },
            { text: '', effects: { tension: 5, iranAggression: 5, domesticApproval: 5 }, flavor: '' },
        ],
    },
    {
        id: 'asian_energy_crisis', title: '',
        description: '',
        image: 'assets/event-crisis-cascade.png',
        minDay: 14, maxDay: 60,
        condition: () => SIM.oilFlow < 40,
        choices: [
            { text: '', effects: { oilPrice: -10, internationalStanding: 10, oilFlow: 5, budget: -40 }, flavor: '' },
            { text: '', effects: { oilFlow: 3, internationalStanding: -5, domesticApproval: 3 }, flavor: '' },
            { text: '', effects: { internationalStanding: 8, diplomaticCapital: 10 }, flavor: '' },
        ],
    },
    {
        id: 'gas_price_crisis', title: '',
        description: '',
        image: 'assets/event-crisis-cascade.png',
        minDay: 10, maxDay: 70,
        condition: () => SIM.oilPrice > 130,
        choices: [
            { text: '', effects: { oilPrice: -12, domesticApproval: 8, budget: -30 }, flavor: '' },
            { text: '', effects: { domesticApproval: 5, polarization: 5, tension: 3 }, flavor: '' },
            { text: '', effects: { domesticApproval: 3, oilPrice: -5, internationalStanding: -3, polarization: 3 }, flavor: '' },
        ],
    },
    {
        id: 'war_powers_vote', title: '',
        description: '',
        image: 'assets/event-e18-congress.png',
        minDay: 15, maxDay: 75,
        condition: () => SIM.warPath >= 2 || SIM.tension > 60,
        choices: [
            { text: '', effects: { domesticApproval: -3, polarization: 5, diplomaticCapital: -5 }, flavor: '' },
            { text: '', effects: { domesticApproval: 8, fogOfWar: 10, polarization: -3 }, flavor: '' },
            { text: '', effects: { domesticApproval: 5, internationalStanding: 5, tension: -5 }, flavor: '' },
        ],
    },
    {
        id: 'tanker_war_echoes', title: '',
        description: '',
        image: 'assets/event-military.png',
        minDay: 12, maxDay: 55,
        condition: () => SIM.oilFlow < 50 && SIM.navyShips.length >= 3,
        choices: [
            { text: '', effects: { oilFlow: 15, tension: 8, budget: -40, domesticApproval: 5, internationalStanding: 10, warPath: 1 }, flavor: '' },
            { text: '', effects: { oilFlow: 10, tension: 5, budget: -15, internationalStanding: 8 }, flavor: '' },
            { text: '', effects: { oilFlow: -5, domesticApproval: -5, internationalStanding: -3 }, flavor: '' },
        ],
    },
    {
        id: 'cyber_port_attack', title: '',
        description: '',
        image: 'assets/event-e23-cyber.png',
        minDay: 10, maxDay: 65,
        condition: () => SIM.iranAggression > 40,
        choices: [
            { text: '', effects: { tension: 10, iranAggression: -8, fogOfWar: -10, conflictRisk: 8 }, flavor: '' },
            { text: '', effects: { oilFlow: 5, budget: -20, internationalStanding: 3 }, flavor: '' },
            { text: '', effects: { iranAggression: 3, internationalStanding: 8, diplomaticCapital: 5 }, flavor: '' },
        ],
    },
    {
        id: 'second_carrier', title: '',
        description: '',
        image: 'assets/event-e09-carrier-incident.png',
        minDay: 15, maxDay: 55,
        condition: () => SIM.carrier !== null && SIM.tension > 50,
        choices: [
            { text: '', effects: { tension: 12, iranAggression: -15, oilFlow: 8, budget: -60, domesticApproval: 8, warPath: 1 }, flavor: '' },
            { text: '', effects: { tension: 5, iranAggression: -8, budget: -30 }, flavor: '' },
            { text: '', effects: { domesticApproval: -3, budget: 10 }, flavor: '' },
        ],
    },
    {
        id: 'truth_social_armada', title: '',
        description: '',
        image: 'assets/event-military.png',
        minDay: 5, maxDay: 40,
        condition: () => SIM.tension > 30,
        choices: [
            { text: '', effects: { tension: 15, iranAggression: -10, domesticApproval: 12, warPath: 1, internationalStanding: -8 }, flavor: '' },
            { text: '', effects: { tension: -3, domesticApproval: -5, iranAggression: 3 }, flavor: '' },
            { text: '', effects: { tension: 3, diplomaticCapital: 8, domesticApproval: 3 }, flavor: '' },
        ],
    },
    {
        id: 'iran_internal_struggle', title: '', image: 'assets/iran-tangsiri.png',
        description: '',
        image: 'assets/event-e07-iran-doubles.png',
        minDay: 18, maxDay: 70,
        condition: () => SIM.fogOfWar < 50 && SIM.iranEconomy < 45,
        choices: [
            { text: '', effects: { iranAggression: -15, tension: -8, diplomaticCapital: -10, fogOfWar: 8 }, flavor: '' },
            { text: '', effects: { iranEconomy: -8, iranAggression: 8, tension: 5, chinaRelations: -3 }, flavor: '' },
            { text: '', effects: { iranAggression: 5, internationalStanding: 5, domesticApproval: -3 }, flavor: '' },
        ],
    },
    {
        id: 'fast_boat_swarm', title: '',
        description: '',
        image: 'assets/event-crisis-three-seizures.png',
        minDay: 8, maxDay: 70,
        countdown: 8,
        condition: () => SIM.iranBoats.length > 2 && SIM.iranAggression > 45,
        choices: [
            { text: '', effects: { tension: 25, warPath: 2, iranAggression: -15, domesticApproval: 10, internationalStanding: -8 }, flavor: '' },
            { text: '', effects: { tension: 15, iranAggression: -5, domesticApproval: 5 }, flavor: '' },
            { text: '', effects: { tension: 8, oilFlow: -5, domesticApproval: -3 }, flavor: '' },
        ],
    },
    {
        id: 'hezbollah_front', title: '',
        description: '',
        image: 'assets/event-e14-houthi.png',
        minDay: 20, maxDay: 75,
        condition: () => SIM.proxyThreat > 35 && SIM.tension > 45,
        choices: [
            { text: '', effects: { tension: 10, proxyThreat: -10, internationalStanding: -8, domesticApproval: 5, budget: -30 }, flavor: '' },
            { text: '', effects: { tension: -5, internationalStanding: 10, diplomaticCapital: 8, proxyThreat: 3 }, flavor: '' },
            { text: '', effects: { internationalStanding: -5, domesticApproval: -3, proxyThreat: 5 }, flavor: '' },
        ],
    },
    {
        id: 'cape_route_crisis', title: '',
        description: '',
        image: 'assets/event-economic.png',
        minDay: 12, maxDay: 55,
        condition: () => SIM.oilFlow < 45,
        choices: [
            { text: '', effects: { budget: -50, oilFlow: 8, oilPrice: -5, domesticApproval: 3 }, flavor: '' },
            { text: '', effects: { tension: 10, iranAggression: -5, oilFlow: 3, warPath: 1 }, flavor: '' },
            { text: '', effects: { oilPrice: 8, domesticApproval: -5, internationalStanding: -3 }, flavor: '' },
        ],
    },
    // --- NEW EVENTS: Based on real March 2026 Iran war developments ---
    {
        id: 'minab_school_strike', title: '',
        description: '',
        image: 'assets/event-crisis-friendly-fire.png',
        minDay: 3, maxDay: 30,
        condition: () => SIM.warPath >= 2,
        choices: [
            { text: '', effects: { internationalStanding: 5, domesticApproval: -5, tension: -3, iranAggression: -3 }, flavor: '' },
            { text: '', effects: { internationalStanding: -10, domesticApproval: 3, tension: 5, iranAggression: 5 }, flavor: '' },
            { text: '', effects: { domesticApproval: -8, tension: -10, iranAggression: 8, internationalStanding: 8, warPath: -1 }, flavor: '' },
        ],
    },
    {
        id: 'mojtaba_succession', title: '', image: 'assets/iran-mojtaba.png',
        description: '',
        image: 'assets/event-mojtaba.png',
        minDay: 5, maxDay: 45,
        condition: () => SIM.iranAggression > 40,
        choices: [
            { text: '', effects: { iranAggression: -12, tension: -5, fogOfWar: 8, diplomaticCapital: -8 },
              setFlags: { mojtaba_watched: true }, chainEvent: 'mojtaba_power_play', chainDelay: 5,
              chainHint: 'Your intelligence assets in Tehran will report back...',
              flavor: '' },
            { text: '', effects: { internationalStanding: 8, domesticApproval: 5, iranAggression: 10, tension: 5 },
              flavor: '' },
            { text: '', effects: { tension: 15, warPath: 1, iranAggression: -10, domesticApproval: 3, internationalStanding: -10 },
              flavor: '' },
        ],
    },
    {
        id: 'joe_kent_resignation', title: '',
        description: '',
        image: 'assets/event-diplomatic.png',
        minDay: 10, maxDay: 50,
        condition: () => SIM.warPath >= 2 && SIM.domesticApproval < 65,
        choices: [
            { text: '', effects: { domesticApproval: -5, polarization: 8, tension: 3 }, flavor: '' },
            { text: '', effects: { domesticApproval: 3, polarization: -3 }, flavor: '' },
            { text: '', effects: { domesticApproval: 5, tension: -5, warPath: -1, polarization: -5 }, flavor: '' },
        ],
    },
    {
        id: 'gcc_attacks', title: '',
        description: '',
        image: 'assets/event-crisis-carrier-hit.png',
        minDay: 5, maxDay: 40,
        condition: () => SIM.tension > 60 && SIM.iranAggression > 55,
        choices: [
            { text: '', effects: { tension: 20, warPath: 2, iranAggression: -15, domesticApproval: 12, internationalStanding: -5, budget: -40 }, flavor: '' },
            { text: '', effects: { tension: 10, warPath: 1, iranAggression: -8, domesticApproval: 8, internationalStanding: 3 }, flavor: '' },
            { text: '', effects: { tension: -5, domesticApproval: -8, iranAggression: 5, internationalStanding: -5 }, flavor: '' },
        ],
    },
    {
        id: 'iris_dena_aftermath', title: '',
        description: '',
        image: 'assets/event-military.png',
        minDay: 4, maxDay: 25,
        condition: () => SIM.iranAggression > 50,
        choices: [
            { text: '', effects: { tension: 20, warPath: 1, iranAggression: -15, domesticApproval: 5, internationalStanding: -10 }, flavor: '' },
            { text: '', effects: { internationalStanding: 10, tension: -5, iranAggression: -5, domesticApproval: 3 }, flavor: '' },
            { text: '', effects: { tension: -3, diplomaticCapital: 10, iranAggression: -3, domesticApproval: 5 }, flavor: '' },
        ],
    },
    {
        id: 'three_carriers', title: '',
        description: '',
        image: 'assets/event-crisis-carrier-hit.png',
        minDay: 3, maxDay: 35,
        condition: () => SIM.carrier !== null && SIM.tension > 50,
        choices: [
            { text: '', effects: { tension: 25, warPath: 2, iranAggression: -20, domesticApproval: 8, internationalStanding: -12, budget: -80 }, flavor: '' },
            { text: '', effects: { tension: 5, iranAggression: -10, domesticApproval: 5, budget: -40 }, flavor: '' },
            { text: '', effects: { tension: -8, domesticApproval: -3, iranAggression: 3, internationalStanding: 5, budget: 20 }, flavor: '' },
        ],
    },
    {
        id: 'china_mediation_real', title: '',
        description: '',
        image: 'assets/event-e13-china.png',
        minDay: 10, maxDay: 55,
        condition: () => SIM.chinaRelations > 20 && SIM.tension > 40,
        choices: [
            { text: '', effects: { tension: -15, iranAggression: -10, chinaRelations: 15, domesticApproval: -8, internationalStanding: 10, diplomaticCapital: 15 }, flavor: '' },
            { text: '', effects: { tension: -5, chinaRelations: -5, diplomaticCapital: -8, internationalStanding: 5 }, flavor: '' },
            { text: '', effects: { chinaRelations: -15, domesticApproval: 8, tension: 5, iranAggression: 3 }, flavor: '' },
        ],
    },
    {
        id: 'russia_intel_leak', title: '',
        description: '',
        image: 'assets/event-intel.png',
        minDay: 12, maxDay: 60,
        condition: () => SIM.chinaRelations < 35,
        choices: [
            { text: '', effects: { chinaRelations: -20, fogOfWar: -10, tension: 5, internationalStanding: 5 }, flavor: '' },
            { text: '', effects: { fogOfWar: -20, iranAggression: -5, chinaRelations: -5 }, flavor: '' },
            { text: '', effects: { chinaRelations: -5, fogOfWar: -5 }, flavor: '' },
        ],
    },
    {
        id: 'nowruz_ceasefire', title: '',
        description: '',
        image: 'assets/event-ceasefire-test.png',
        minDay: 18, maxDay: 35,
        condition: () => SIM.tension > 30 && SIM.diplomaticCapital > 10,
        choices: [
            { text: '', effects: { tension: -20, iranAggression: -12, domesticApproval: -5, internationalStanding: 15, diplomaticCapital: 20 }, flavor: '' },
            { text: '', effects: { tension: -12, iranAggression: -5, internationalStanding: 8, diplomaticCapital: 10 }, flavor: '' },
            { text: '', effects: { tension: 5, domesticApproval: 5, iranAggression: 5, internationalStanding: -5 }, flavor: '' },
        ],
    },
    {
        id: 'hezbollah_ceasefire_break', title: '',
        image: 'assets/event-e14-houthi.png',
        description: '',
        minDay: 8, maxDay: 55,
        condition: () => SIM.proxyThreat > 30 && SIM.tension > 40,
        choices: [
            { text: '', effects: { proxyThreat: -15, tension: 12, warPath: 1, internationalStanding: -8, budget: -25 }, flavor: '' },
            { text: '', effects: { proxyThreat: -5, tension: -3, internationalStanding: 8, diplomaticCapital: 5 }, flavor: '' },
            { text: '', effects: { proxyThreat: 5, internationalStanding: -5, domesticApproval: -3 }, flavor: '' },
        ],
    },
    {
        id: 'houthi_escalation', title: '',
        description: '',
        image: 'assets/event-e14-houthi.png',
        minDay: 6, maxDay: 50,
        condition: () => SIM.proxyThreat > 25,
        choices: [
            { text: '', effects: { proxyThreat: -20, tension: 8, warPath: 1, budget: -30, domesticApproval: 8 }, flavor: '' },
            { text: '', effects: { proxyThreat: -8, budget: -15, domesticApproval: 3 }, flavor: '' },
            { text: '', effects: { proxyThreat: -5, tension: -3, internationalStanding: 5, diplomaticCapital: -5 }, flavor: '' },
        ],
    },
    {
        id: 'kc135_crash', title: '',
        description: '',
        image: 'assets/event-military.png',
        minDay: 4, maxDay: 35,
        condition: () => SIM.warPath >= 2,
        choices: [
            { text: '', effects: { domesticApproval: 5, tension: 3, polarization: -3 }, flavor: '' },
            { text: '', effects: { domesticApproval: -3, tension: -5, iranAggression: 3, warPath: -1 }, flavor: '' },
            { text: '', effects: { domesticApproval: 3, tension: 10, warPath: 1, internationalStanding: -5 }, flavor: '' },
        ],
    },
    {
        id: 'war_crimes_tribunal', title: '',
        description: '',
        image: 'assets/event-diplomatic.png',
        minDay: 15, maxDay: 65,
        condition: () => SIM.warPath >= 2 && SIM.internationalStanding < 50,
        choices: [
            { text: '', effects: { internationalStanding: -12, domesticApproval: 8, polarization: 5 }, flavor: '' },
            { text: '', effects: { internationalStanding: 8, domesticApproval: -5, tension: -3 }, flavor: '' },
            { text: '', effects: { internationalStanding: 5, iranAggression: -5, diplomaticCapital: 5 }, flavor: '' },
        ],
    },
    // === NEW EVENTS: Post-strikes escalation scenarios ===
    {
        id: 'mojtaba_consolidation', title: '', image: 'assets/iran-mojtaba.png',
        description: '',
        image: 'assets/event-mojtaba.png',
        minDay: 5, maxDay: 30,
        condition: () => SIM.iranAggression > 40,
        choices: [
            { text: '', effects: { tension: -10, iranAggression: -8, domesticApproval: -10, diplomaticCapital: 10 }, flavor: '' },
            { text: '', effects: { tension: 20, iranAggression: 15, warPath: 2, domesticApproval: 5 }, flavor: '' },
            { text: '', effects: { iranAggression: 5, fogOfWar: 5 }, flavor: '' },
        ],
    },
    {
        id: 'iris_dena_aftermath', title: '',
        description: '',
        image: 'assets/event-military.png',
        minDay: 3, maxDay: 15,
        condition: () => SIM.internationalStanding < 60,
        choices: [
            { text: '', effects: { internationalStanding: 10, domesticApproval: -5, iranAggression: -3 }, flavor: '' },
            { text: '', effects: { internationalStanding: -5, domesticApproval: 5, tension: 3 }, flavor: '' },
            { text: '', effects: { internationalStanding: -3 }, flavor: '' },
        ],
    },
    {
        id: 'al_udeid_attack', title: '',
        description: '',
        image: 'assets/event-crisis-carrier-hit.png',
        minDay: 4, maxDay: 25,
        condition: () => SIM.tension > 50,
        choices: [
            { text: '', effects: { tension: 15, iranAggression: -10, warPath: 1, domesticApproval: 8 }, flavor: '' },
            { text: '', effects: { budget: -50, tension: -3, internationalStanding: 3 }, flavor: '' },
            { text: '', effects: { budget: -30, domesticApproval: -3 }, flavor: '' },
        ],
    },
    {
        id: 'indian_energy_crisis', title: '',
        description: '',
        image: 'assets/event-crisis-cascade.png',
        minDay: 10, maxDay: 50,
        condition: () => SIM.oilFlow < 50,
        choices: [
            { text: '', effects: { oilFlow: 5, internationalStanding: 8, budget: -15 }, flavor: '' },
            { text: '', effects: { tension: -5, domesticApproval: -5, iranAggression: -3, internationalStanding: 5 }, flavor: '' },
            { text: '', effects: { internationalStanding: -8, oilFlow: -3 }, flavor: '' },
        ],
    },
    {
        id: 'carrier_near_miss', title: '',
        description: '',
        image: 'assets/event-e09-carrier-incident.png',
        minDay: 8, maxDay: 40,
        condition: () => SIM.tension > 55 && SIM.iranAggression > 45,
        choices: [
            { text: '', effects: { tension: 20, iranAggression: -15, warPath: 2, domesticApproval: 10, budget: -40 }, flavor: '' },
            { text: '', effects: { tension: -8, domesticApproval: -8, iranAggression: 8 }, flavor: '' },
            { text: '', effects: { budget: -20, tension: 5 }, flavor: '' },
        ],
    },
    {
        id: 'iran_moderate_coup', title: '',
        description: '',
        image: 'assets/event-diplomatic.png',
        minDay: 18, maxDay: 60,
        condition: () => SIM.diplomaticCapital > 30 && SIM.iranAggression > 35,
        choices: [
            { text: '', effects: { tension: -15, iranAggression: -12, domesticApproval: -8, diplomaticCapital: 10 }, flavor: '' },
            { text: '', effects: { tension: -8, iranAggression: -8, fogOfWar: -10, warPath: 1 }, flavor: '' },
            { text: '', effects: { tension: 10, iranAggression: 10, domesticApproval: 3 }, flavor: '' },
        ],
    },
    {
        id: 'kc135_crew_rescue', title: '',
        description: '',
        image: 'assets/event-rescue-op.png',
        minDay: 3, maxDay: 12,
        condition: () => true,
        choices: [
            { text: '', effects: { tension: 12, domesticApproval: 15, warPath: 1, budget: -20 }, flavor: '' },
            { text: '', effects: { tension: -3, domesticApproval: -5, diplomaticCapital: -5 }, flavor: '' },
            { text: '', effects: { domesticApproval: -10, fogOfWar: -5, polarization: 5 }, flavor: '' },
        ],
    },
    {
        id: 'european_split', title: '',
        description: '',
        image: 'assets/event-diplomatic.png',
        minDay: 7, maxDay: 35,
        condition: () => SIM.internationalStanding < 55,
        choices: [
            { text: '', effects: { internationalStanding: -8, domesticApproval: 5, diplomaticCapital: -5 }, flavor: '' },
            { text: '', effects: { internationalStanding: 10, tension: -5, domesticApproval: -3 }, flavor: '' },
            { text: '', effects: { domesticApproval: 8, internationalStanding: -12, polarization: 3 }, flavor: '' },
        ],
    },
    // ======================== CHAIN FOLLOW-UP EVENTS ========================
    // These events are scheduled by choices in parent events via chainEvent/chainDelay.
    // They have minDay/maxDay set wide — they only fire when explicitly scheduled.

    // --- BACK-CHANNEL CHAIN (follows secret_talks) ---
    {
        id: 'backchannel_progress', title: '',
        description: '',
        image: 'assets/event-e10-shirazi.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.backchannel_accepted,
        choices: [
            { text: '', effects: { tension: -15, iranAggression: -10, oilFlow: 8, domesticApproval: -5, diplomaticCapital: 10 },
              setFlags: { ceasefire_accepted: true }, chainEvent: 'backchannel_ceasefire_test', chainDelay: 3,
              chainHint: 'The ceasefire will be tested in the coming days...',
              flavor: '' },
            { text: '', effects: { tension: -5, diplomaticCapital: 5, iranAggression: 2 },
              setFlags: { backchannel_counteroffered: true }, chainEvent: 'backchannel_counteroffer_response', chainDelay: 4,
              chainHint: 'Iran is deliberating your counter-proposal...',
              flavor: '' },
            { text: '', effects: { tension: 5, domesticApproval: 5, iranAggression: 5, diplomaticCapital: -8 },
              setFlags: { backchannel_collapsed: true },
              flavor: '' },
        ],
    },
    {
        id: 'backchannel_ceasefire_test', title: '',
        description: '',
        image: 'assets/event-ceasefire-test.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.ceasefire_accepted,
        choices: [
            { text: '', effects: { tension: -8, domesticApproval: -8, internationalStanding: 5, iranAggression: -5, diplomaticCapital: 8 },
              setFlags: { ceasefire_held: true },
              flavor: '' },
            { text: '', effects: { tension: 5, diplomaticCapital: -5, iranAggression: 3 },
              setFlags: { ceasefire_strained: true },
              flavor: '' },
            { text: '', effects: { tension: 20, warPath: 1, domesticApproval: 5, iranAggression: 15, diplomaticCapital: -15 },
              setFlags: { ceasefire_broken: true },
              flavor: '' },
        ],
    },
    {
        id: 'backchannel_counteroffer_response', title: '',
        description: '',
        image: 'assets/event-e20-muscat.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.backchannel_counteroffered,
        choices: [
            { text: '', effects: { tension: -12, iranAggression: -8, internationalStanding: 3, domesticApproval: -6 },
              setFlags: { carrier_pullback: true },
              flavor: '' },
            { text: '', effects: { tension: -5, iranAggression: -3, diplomaticCapital: 3 },
              flavor: '' },
            { text: '', effects: { tension: 8, iranAggression: 8, diplomaticCapital: -10 },
              setFlags: { backchannel_dead: true },
              flavor: '' },
        ],
    },

    // --- HOSTAGE CHAIN (follows hostage event) ---
    {
        id: 'hostage_situation_escalates', title: '',
        description: '',
        image: 'assets/event-hostage-escalates.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.hostage_negotiating,
        choices: [
            { text: '', effects: { tension: -5, diplomaticCapital: -8, domesticApproval: -3, iranAggression: -3 },
              setFlags: { envoy_sent: true }, chainEvent: 'hostage_envoy_result', chainDelay: 5,
              chainHint: 'The envoy will reach Tehran in a few days...',
              flavor: '' },
            { text: '', effects: { tension: 15, warPath: 1, domesticApproval: 8, iranAggression: 10 },
              setFlags: { rescue_attempted: true }, chainEvent: 'hostage_rescue_result', chainDelay: 2,
              chainHint: 'SEAL Team 6 is spinning up...',
              flavor: '' },
            { text: '', effects: { tension: 3, domesticApproval: 3, iranAggression: 3, internationalStanding: 2 },
              flavor: '' },
        ],
    },
    {
        id: 'hostage_envoy_result', title: '',
        description: '',
        image: 'assets/event-envoy.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.envoy_sent,
        choices: [
            { text: '', effects: { tension: -10, budget: -40, domesticApproval: 5, diplomaticCapital: 8, internationalStanding: 5 },
              setFlags: { hostages_partially_freed: true },
              flavor: '' },
            { text: '', effects: { tension: 8, domesticApproval: 3, iranAggression: 5 },
              setFlags: { hostage_hardline: true },
              flavor: '' },
        ],
    },
    {
        id: 'hostage_rescue_result', title: '',
        description: '',
        image: 'assets/event-rescue-op.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.rescue_attempted,
        choices: [
            { text: '', effects: { tension: 20, warPath: 1, domesticApproval: -5, iranAggression: 15, internationalStanding: -10, budget: -30 },
              flavor: '' },
        ],
    },

    // --- MOJTABA SUCCESSION CHAIN (follows mojtaba_succession) ---
    {
        id: 'mojtaba_power_play', title: '',
        description: '',
        image: 'assets/iran-mojtaba.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.mojtaba_watched,
        choices: [
            { text: '', effects: { tension: -8, fogOfWar: -10, diplomaticCapital: 8, iranAggression: -5 },
              setFlags: { mojtaba_channel_open: true }, chainEvent: 'mojtaba_secret_deal', chainDelay: 5,
              chainHint: 'A dangerous game. If this becomes public...',
              flavor: '' },
            { text: '', effects: { tension: 10, iranAggression: -8, iranEconomy: -5, warPath: 1 },
              setFlags: { mojtaba_pressured: true },
              flavor: '' },
            { text: '', effects: { tension: 5, domesticApproval: -3, internationalStanding: 8, iranAggression: 8 },
              flavor: '' },
        ],
    },
    {
        id: 'mojtaba_secret_deal', title: '',
        description: '',
        image: 'assets/iran-mojtaba.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.mojtaba_channel_open,
        choices: [
            { text: '', effects: { tension: -25, iranAggression: -20, oilFlow: 15, budget: -80, domesticApproval: -10, diplomaticCapital: 15 },
              setFlags: { grand_bargain: true },
              flavor: '' },
            { text: '', effects: { tension: -15, iranAggression: -12, oilFlow: 8, internationalStanding: 5 },
              setFlags: { partial_deal: true },
              flavor: '' },
            { text: '', effects: { tension: 5, domesticApproval: 8, internationalStanding: 5, diplomaticCapital: -10, iranAggression: 10 },
              flavor: '' },
        ],
    },

    // --- NUCLEAR CHAIN (follows nuclear_breakout) ---
    {
        id: 'nuclear_inspection_crisis', title: '',
        description: '',
        image: 'assets/event-nuclear-inspection.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.nuclear_inspectors_sent,
        choices: [
            { text: '', effects: { tension: 30, warPath: 2, iranAggression: 15, domesticApproval: 3, internationalStanding: -15, budget: -50 },
              setFlags: { fordow_struck: true },
              flavor: '' },
            { text: '', effects: { tension: 15, iranAggression: -5, diplomaticCapital: -8, internationalStanding: 3 },
              chainEvent: 'nuclear_ultimatum_response', chainDelay: 3,
              chainHint: 'Iran has 72 hours to respond...',
              flavor: '' },
            { text: '', effects: { tension: -5, iranAggression: -3, domesticApproval: -8, internationalStanding: 8, diplomaticCapital: 10 },
              setFlags: { nuclear_deal_proposed: true },
              flavor: '' },
        ],
    },
    {
        id: 'nuclear_ultimatum_response', title: '',
        description: '',
        image: 'assets/event-fordow-strike.png',
        minDay: 1, maxDay: 999,
        choices: [
            { text: '', effects: { tension: 35, warPath: 2, budget: -60, domesticApproval: 5, internationalStanding: -20, iranAggression: 20 },
              flavor: '' },
            { text: '', effects: { tension: 5, domesticApproval: -10, internationalStanding: -5, diplomaticCapital: 5 },
              flavor: '' },
        ],
    },
    // ======================== AIPAC / HILL SUPPORT EVENTS ========================
    {
        id: 'aipac_delegation', title: 'AIPAC Delegation',
        description: 'A Congressional delegation allied with pro-Israel lobbying groups requests a meeting to discuss your Iran policy.',
        image: 'assets/event-e11-un-showdown.png',
        minDay: 5, maxDay: 15,
        condition: () => !SIM.firedConsequences.includes('aipac_delegation'),
        choices: [
            { text: 'Take the meeting — commit to no Iran talks', effects: { aipacPressure: 10, domesticApproval: 5, diplomaticCapital: -5 },
              flavor: 'The delegation leaves satisfied. Your diplomatic flexibility just narrowed.',
              setFlags: { aipac_meeting_committed: true } },
            { text: 'Take the meeting — make no promises', effects: { aipacPressure: 3 },
              flavor: 'Polite smiles. They\'ll be watching closely.' },
            { text: 'Decline the meeting', effects: { aipacPressure: -8, domesticApproval: -3, credibility: 3 },
              flavor: 'The snub makes the rounds on the Hill. You\'ve made a statement.' },
        ],
    },
    {
        id: 'netanyahu_call', title: 'The Netanyahu Call',
        description: 'Israel\'s Prime Minister is on the secure line. He wants intelligence sharing on Iran\'s nuclear program and a commitment to act.',
        image: 'assets/event-e05-british-pm.png',
        minDay: 15, maxDay: 30,
        condition: () => SIM.aipacPressure > 40,
        choices: [
            { text: 'Full intelligence sharing', effects: { aipacPressure: 12, fogOfWar: -10, tension: 5 },
              flavor: 'Mossad\'s intelligence fills critical gaps. The hawks are thrilled. Tehran notices.',
              setFlags: { netanyahu_full_sharing: true } },
            { text: 'Limited sharing — need-to-know basis', effects: { aipacPressure: 5, fogOfWar: -5 },
              flavor: 'Netanyahu is disappointed but understands. Professional cooperation continues.' },
            { text: 'Decline — maintain independence', effects: { aipacPressure: -10, internationalStanding: 3 },
              flavor: 'Netanyahu hangs up cold. The world notes your independence.' },
        ],
    },
    {
        id: 'aipac_attack_ad', title: 'AIPAC Attack Ad',
        description: 'A major pro-Israel PAC is running television ads criticizing your Iran policy as "weak" and "dangerous for American security."',
        image: 'assets/event-e04-journalist.png',
        minDay: 20, maxDay: 50,
        condition: () => SIM.aipacPressure < 35,
        choices: [
            { text: 'Counter with your own ads', effects: { budget: -15, domesticApproval: 5, aipacPressure: 5 },
              flavor: 'Your counter-narrative blunts the attack, but it cost you.' },
            { text: 'Ignore it', effects: { _aipacApprovalPenaltyDays: 3 },
              flavor: 'The ads run unanswered for days. Your numbers dip.' },
            { text: 'Publicly call out the lobby', effects: { credibility: 5, aipacPressure: -10, polarization: 5 },
              flavor: 'You go on the offensive. The base loves it. The donor class is furious.',
              characterEffect: { fuentes: { baseEnthusiasm: 10 } } },
        ],
    },
    {
        id: 'donor_ultimatum', title: 'The Donor Ultimatum',
        description: 'Major political donors, coordinated through pro-Israel networks, threaten to pull all campaign funding unless you harden your Iran stance.',
        image: 'assets/event-e08-oil-panic.png',
        minDay: 30, maxDay: 60,
        condition: () => SIM.aipacPressure < 25,
        choices: [
            { text: 'Capitulate — adjust Iran policy', effects: { aipacPressure: 15, credibility: -5 },
              flavor: 'You cave. Credibility takes a hit. But the money flows again.',
              setFlags: { aipac_capitulated: true },
              specialEffect: function() { SIM._aipacDiplomaticRestrictionDays = 5; } },
            { text: 'Hold firm', effects: { domesticApproval: -5, budget: -30, credibility: 5 },
              flavor: 'The donors pull out. $30M in promised funding evaporates. But you kept your word.' },
            { text: 'Negotiate a private arrangement',
              condition: () => SIM.character && SIM.character.id === 'kushner',
              effects: { aipacPressure: 10, exposure: 8 },
              flavor: 'A quiet dinner. A handshake. Everyone gets something. Nobody talks about it.',
              specialEffect: function() { SIM.dealValue = (SIM.dealValue || 0) + 50; } },
        ],
    },
];

// ======================== IMPLEMENTATION DELAY SYSTEM ========================

/** Delay in days by card category (Democracy-inspired) */
const CATEGORY_DELAY = {
    military: 1,
    intelligence: 2,
    domestic: 3,
    diplomatic: 5,
    economic: 10,
};

/** Queue a card's effects for delayed activation */
function queueCardEffects(card, funding) {
    const delay = card.delayDays || CATEGORY_DELAY[card.category] || 1;
    const effects = card.effects[funding];
    if (!effects) return;
    SIM.pendingEffects.push({
        cardId: card.id,
        cardName: card.name,
        category: card.category,
        funding,
        effects,
        activateOnDay: SIM.day + delay,
        queuedDay: SIM.day,
    });
    const delayLabel = delay === 1 ? 'tomorrow' : `in ${delay} days`;
    addHeadline(formatWire(`${card.name} (${funding.toUpperCase()}) ordered — takes effect ${delayLabel}`, card.category, 'normal'), 'normal');
}

/** Process pending effects in dailyUpdate */
function processPendingEffects() {
    const ready = SIM.pendingEffects.filter(p => SIM.day >= p.activateOnDay);
    const remaining = SIM.pendingEffects.filter(p => SIM.day < p.activateOnDay);
    SIM.pendingEffects = remaining;

    for (const p of ready) {
        // Apply effects through stance system (add to active stances)
        if (!SIM.activeStances.find(s => s.cardId === p.cardId)) {
            SIM.activeStances.push({ cardId: p.cardId, funding: p.funding });
            SIM.stanceActivationDay[p.cardId] = SIM.day;
        }
        const announcements = {
            military: `SITREP ${_formatDTG()}: ${p.cardName} operational — all units report ready`,
            diplomatic: `STATE CABLE // CONFIDENTIAL: ${p.cardName} initiative now active`,
            economic: `TREASURY NOTICE: ${p.cardName} sanctions package in effect`,
            intelligence: `CIA OPS NOTICE [TS//SI]: ${p.cardName} collection active`,
            domestic: `WHITE HOUSE: ${p.cardName} program launched`,
        };
        addHeadline(announcements[p.category] || `${p.cardName} now active`, 'good');
    }
}

// ======================== INTEL CONFIDENCE SYSTEM ========================

/** Generate an intel briefing item with confidence tag */
function generateIntelItem() {
    // Confidence depends on fog of war
    let confidence;
    const roll = Math.random() * 100;
    if (SIM.fogOfWar > 70) {
        confidence = roll < 50 ? 'LOW' : roll < 85 ? 'MEDIUM' : 'HIGH';
    } else if (SIM.fogOfWar > 40) {
        confidence = roll < 20 ? 'LOW' : roll < 65 ? 'MEDIUM' : 'HIGH';
    } else {
        confidence = roll < 5 ? 'LOW' : roll < 30 ? 'MEDIUM' : 'HIGH';
    }

    // LOW confidence has 40% chance of being wrong
    const accurate = confidence === 'LOW' ? Math.random() > 0.4 :
                     confidence === 'MEDIUM' ? Math.random() > 0.1 : true;

    let text;
    if (accurate) {
        text = _intelSnippets[Math.floor(Math.random() * _intelSnippets.length)];
    } else {
        text = _falseIntelSnippets[Math.floor(Math.random() * _falseIntelSnippets.length)];
    }

    const item = { text, confidence, accurate, day: SIM.day };
    SIM.intelBriefings.push(item);
    // Keep last 20
    if (SIM.intelBriefings.length > 20) SIM.intelBriefings.shift();
    return item;
}

/** False intel — plausible but wrong (information asymmetry) */
const _falseIntelSnippets = [
    'HUMINT: IRGC withdrawing fast boats from Larak Island — de-escalation signal.',
    'SIGINT intercept: Iranian submarine returning to port — standing down.',
    'Asset report: Mojtaba Khamenei seeking secret ceasefire through Turkey.',
    'Satellite: Iran dismantling coastal missile batteries near Qeshm.',
    'Intercepted comms: IRGC commanders expressing desire to negotiate.',
    'HUMINT: Iranian moderates have won internal debate — expect de-escalation.',
    'NSA intercept: China pressuring Iran to release all tankers immediately.',
    'Satellite: No new mine-laying activity detected — threat declining.',
    'Asset report: IRGC Quds Force recalling proxy advisors from Yemen.',
    'SIGINT: Iranian air defenses powered down in coastal areas — possible goodwill gesture.',
    'HUMINT: Russia cutting arms shipments to Iran — Moscow seeking distance.',
    'Intercepted call: IRGC Navy ordered to avoid all contact with US vessels.',
];

// ======================== WIRE SERVICE FORMATTING ========================

/** Format a headline in wire service / SITREP / cable style */
function formatWire(text, category, level) {
    // FLASH (critical) > URGENT (warning) > BULLETIN (normal/good)
    if (level === 'critical') {
        const services = ['AP FLASH', 'REUTERS FLASH', 'AP BREAKING'];
        return services[Math.floor(Math.random() * services.length)] + ': ' + text;
    }
    if (level === 'warning') {
        const services = ['AP URGENT', 'REUTERS URGENT', 'AP BULLETIN'];
        return services[Math.floor(Math.random() * services.length)] + ': ' + text;
    }
    if (category === 'military' || (category && category.includes('military'))) {
        return `SITREP ${_formatDTG()}: ` + text;
    }
    if (category === 'diplomatic') {
        const cables = ['STATE CABLE', 'DIPNOTE', 'EMBASSY CABLE'];
        return cables[Math.floor(Math.random() * cables.length)] + ': ' + text;
    }
    if (category === 'intelligence') {
        return `CIA ASSESSMENT: ` + text;
    }
    return text;
}

/** Military date-time group: DDHHMMZmonYY */
function _formatDTG() {
    const startDate = new Date(2026, 1, 28);
    const gameDate = new Date(startDate);
    gameDate.setDate(gameDate.getDate() + SIM.day - 1);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dd = String(gameDate.getDate()).padStart(2, '0');
    const hh = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const mm = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    return `${dd}${hh}${mm}Z${months[gameDate.getMonth()]}26`;
}

// ======================== CRISIS TELEPHONE EVENTS ========================

const CRISIS_EVENTS = [
    {
        id: 'nuclear_threshold', title: '',
        description: '',
        countdown: 20, crisis: true,
        minDay: 25, maxDay: 70,
        condition: () => SIM.iranAggression > 60 && SIM.tension > 55,
        choices: [
            { text: '', effects: { tension: 30, warPath: 2, iranAggression: 15, domesticApproval: -5, internationalStanding: -15, chinaRelations: -15 }, flavor: '' },
            { text: '', effects: { tension: 25, warPath: 2, iranAggression: -10, domesticApproval: 10, internationalStanding: -12, budget: -60 }, flavor: '' },
            { text: '', effects: { tension: 8, diplomaticCapital: 15, internationalStanding: 10, iranAggression: 5 }, flavor: '' },
            { text: '', effects: { tension: -5, domesticApproval: -15, iranAggression: -8, diplomaticCapital: -10 }, flavor: '' },
            { text: '', effects: { conflictRisk: 15, iranAggression: 8, domesticApproval: -8 }, flavor: '' },
        ],
    },
    {
        id: 'three_seizures', title: '',
        description: '',
        countdown: 15, crisis: true,
        minDay: 10, maxDay: 60,
        condition: () => SIM.iranAggression > 55 && SIM.iranBoats.length > 2,
        choices: [
            { text: '', effects: { tension: 25, warPath: 2, domesticApproval: 12, conflictRisk: 15, iranAggression: -10 }, flavor: '' },
            { text: '', effects: { tension: 20, warPath: 1, oilPrice: 15, iranEconomy: -15, internationalStanding: -8, iranAggression: -5 }, flavor: '' },
            { text: '', effects: { tension: 5, domesticApproval: -10, diplomaticCapital: -10, iranAggression: 3 }, flavor: '' },
            { text: '', effects: { tension: 30, warPath: 3, domesticApproval: 8, internationalStanding: -10, conflictRisk: 20 }, flavor: '' },
        ],
    },
    {
        id: 'friendly_fire', title: '',
        description: '',
        countdown: 15, crisis: true,
        minDay: 8, maxDay: 55,
        condition: () => SIM.navyShips.length > 3 && SIM.tension > 50,
        choices: [
            { text: '', effects: { domesticApproval: -8, internationalStanding: -5, tension: -3 }, flavor: '' },
            { text: '', effects: { domesticApproval: -3, internationalStanding: -10, diplomaticCapital: -8 }, flavor: '' },
            { text: '', effects: { internationalStanding: -15, domesticApproval: 3, polarization: 8, fogOfWar: 5 }, flavor: '' },
            { text: '', effects: { tension: -10, iranAggression: 8, oilFlow: -8, domesticApproval: -5 }, flavor: '' },
        ],
    },
    {
        id: 'cascade_crisis', title: '',
        description: '',
        countdown: 12, crisis: true,
        minDay: 15, maxDay: 65,
        condition: () => SIM.proxyThreat > 40 && SIM.tension > 50 && SIM.iranAggression > 50,
        choices: [
            { text: '', effects: { tension: 10, oilFlow: 5, proxyThreat: 8, domesticApproval: -3, budget: -20 }, flavor: '' },
            { text: '', effects: { tension: 25, warPath: 2, budget: -80, domesticApproval: 8, proxyThreat: -15, iranAggression: -10, internationalStanding: -10 }, flavor: '' },
            { text: '', effects: { tension: 5, internationalStanding: 12, diplomaticCapital: 15, proxyThreat: -5 }, flavor: '' },
            { text: '', effects: { tension: -8, domesticApproval: -12, iranAggression: -5, proxyThreat: 3, polarization: 8 }, flavor: '' },
        ],
    },
    {
        id: 'carrier_hit', title: '',
        description: '',
        countdown: 15, crisis: true,
        minDay: 12, maxDay: 70,
        condition: () => SIM.carrier !== null && SIM.iranAggression > 65 && SIM.tension > 60,
        choices: [
            { text: '', effects: { tension: 30, warPath: 3, iranAggression: -20, domesticApproval: 15, internationalStanding: -12, budget: -100 }, flavor: '' },
            { text: '', effects: { tension: 15, warPath: 1, iranAggression: -8, domesticApproval: 8, internationalStanding: 3 }, flavor: '' },
            { text: '', effects: { tension: -5, domesticApproval: -15, iranAggression: 12, internationalStanding: -8 }, flavor: '' },
            { text: '', effects: { tension: 10, domesticApproval: 10, polarization: -5, warPath: 1 }, flavor: '' },
        ],
    },
];

/** Check if a crisis event should fire */
function checkCrisisEvents() {
    const usedIds = SIM.decisionHistory.map(d => d.id);
    const eligible = CRISIS_EVENTS.filter(e =>
        !usedIds.includes(e.id) &&
        SIM.day >= (e.minDay || 1) && SIM.day <= (e.maxDay || 999) &&
        (!e.condition || e.condition())
    );
    if (eligible.length === 0) return null;
    // Crisis events — 20% chance per eligible day
    if (Math.random() > 0.20) return null;
    return eligible[Math.floor(Math.random() * eligible.length)];
}

// ======================== HELPERS ========================

// getLanePosition defined in map.js

function logEvent(text, level) {
    addHeadline(text, level || 'normal');
}

// ======================== HYDRATION ========================

function hydrateSimulation() {
    const ev = DATA.events;
    const hl = DATA.headlines;

    // Escalation ladder
    if (ev.escalationLadder) {
        ev.escalationLadder.forEach((t, i) => {
            if (ESCALATION_LADDER[i]) {
                ESCALATION_LADDER[i].name = t.name;
                ESCALATION_LADDER[i].description = t.description;
            }
        });
    }

    // Iran escalation
    if (ev.iranEscalation) {
        ev.iranEscalation.forEach((t, i) => {
            if (IRAN_ESCALATION[i]) {
                IRAN_ESCALATION[i].name = t.name;
                IRAN_ESCALATION[i].triggers = t.triggers;
            }
        });
    }

    // Story arcs
    if (ev.storyArcs) {
        for (const arc of STORY_ARCS) {
            const t = ev.storyArcs[arc.id];
            if (t) {
                arc.name = t.name;
                arc.brief = t.brief;
            }
        }
    }

    // Decision events + Crisis events
    if (ev.decisionEvents) {
        const allEvents = (typeof CRISIS_EVENTS !== 'undefined' ? DECISION_EVENTS.concat(CRISIS_EVENTS) : DECISION_EVENTS);
        allEvents.forEach(e => {
            const t = ev.decisionEvents[e.id];
            if (!t) return;
            e.title = t.title;
            e.description = t.description;
            if (t.choices) {
                e.choices.forEach((c, i) => {
                    if (t.choices[i]) {
                        c.text = t.choices[i].label;
                        if (t.choices[i].flavor !== undefined) c.flavor = t.choices[i].flavor;
                    }
                });
            }
        });
    }
}
