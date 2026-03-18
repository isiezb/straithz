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
    actionPoints: 5,
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
};

/** Default values for SIM reset — used by restartGame() */
const SIM_DEFAULTS = {
    day: 1, hour: 0, week: 1, weekDay: 1, speed: 2,
    phase: 'morning', actionPoints: 5, swapsToday: 0,
    stanceActivationDay: {}, firedConsequences: [], pendingNews: [], prevGauges: null,
    oilFlow: 50, oilPrice: 95, tension: 55, domesticApproval: 60,
    internationalStanding: 50, conflictRisk: 35, budget: 900,
    iranAggression: 45, iranEconomy: 35, iranStrategy: 'probing',
    fogOfWar: 70, diplomaticCapital: 35, proxyThreat: 25,
    chinaRelations: 50, polarization: 20,
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
};

const ESCALATION_LADDER = [
    { level: 0, name: 'DIPLOMATIC TENSIONS', description: 'Sanctions and rhetoric. No military engagement.', color: '#44dd88' },
    { level: 1, name: 'NAVAL STANDOFF', description: 'Warships deployed. Seizures and standoffs. Limited skirmishes.', color: '#88aa44' },
    { level: 2, name: 'LIMITED STRIKES', description: 'Precision strikes on military targets. Tit-for-tat.', color: '#ddaa44' },
    { level: 3, name: 'AIR CAMPAIGN', description: 'Sustained air operations. Infrastructure targeted. Civilian risk.', color: '#dd6644' },
    { level: 4, name: 'GROUND INVASION', description: 'Ground forces deployed. Draft considered. Regional war.', color: '#dd4444' },
    { level: 5, name: 'TOTAL WAR', description: 'Nuclear threshold. Chemical weapons. Civilization at stake.', color: '#ff0000' },
];

// Iran's escalation ladder (AI side)
const IRAN_ESCALATION = [
    { level: 0, name: 'RESTRAINED', triggers: 'aggression < 25' },
    { level: 1, name: 'PROBING', triggers: 'aggression 25-50, fast boats and seizures' },
    { level: 2, name: 'PROXY WAR', triggers: 'aggression 50-65, Houthis + Iraqi militias activated' },
    { level: 3, name: 'DIRECT ENGAGEMENT', triggers: 'aggression 65-80, missile strikes, mine-laying' },
    { level: 4, name: 'NUCLEAR LEVERAGE', triggers: 'aggression 80-90, breakout threats, enrichment acceleration' },
    { level: 5, name: 'ALL-OUT', triggers: 'aggression > 90, mass missile/drone swarm, suicide boats' },
];

// Story Arc Phases — 13-week structure from content bible
const STORY_ARCS = [
    { id: 'the_spark',      name: 'THE SPARK',          startDay: 1,  endDay: 7,
      brief: 'You inherit a crisis in motion. Nobody expects you to last.',
      color: '#dd4444', image: 'assets/arc-escalation.png' },
    { id: 'the_squeeze',    name: 'THE SQUEEZE',        startDay: 8,  endDay: 14,
      brief: 'Iran tightens. A second vessel seized. Your opposition smells blood.',
      color: '#dd6644', image: 'assets/arc-escalation.png' },
    { id: 'diplomatic_window', name: 'THE DIPLOMATIC WINDOW', startDay: 15, endDay: 21,
      brief: 'A brief thaw. Iran releases crew. The UN convenes. Choose wisely.',
      color: '#ddaa44', image: 'assets/event-diplomatic.png' },
    { id: 'false_dawn',     name: 'THE FALSE DAWN',     startDay: 22, endDay: 28,
      brief: 'Whatever progress you made gets complicated. Every path leads to a setback.',
      color: '#dd8844', image: 'assets/arc-fog-of-war.png' },
    { id: 'proxy_season',   name: 'PROXY SEASON',       startDay: 29, endDay: 35,
      brief: 'Houthis. Hezbollah. Iraqi militias. The crisis is metastasizing.',
      color: '#aa44dd', image: 'assets/arc-proxy-front.png' },
    { id: 'pressure_cooker', name: 'THE PRESSURE COOKER', startDay: 36, endDay: 42,
      brief: 'Congressional hearings. Leaked documents. Iran issues an ultimatum.',
      color: '#dd4488', image: 'assets/arc-nuclear-shadow.png' },
    { id: 'crossroads',     name: 'CROSSROADS',         startDay: 43, endDay: 49,
      brief: 'The ultimatum expires. What happens depends on what you\'ve built.',
      color: '#4488dd', image: 'assets/arc-tipping-point.png' },
    { id: 'the_grind',      name: 'THE GRIND',          startDay: 50, endDay: 56,
      brief: 'The world adjusts. The crisis becomes chronic. Fatigue sets in.',
      color: '#888888', image: 'assets/arc-long-game.png' },
    { id: 'endgame_setup',  name: 'ENDGAME',            startDay: 57, endDay: 70,
      brief: 'A breakthrough reveals Iran\'s true objective. The board reshapes.',
      color: '#44dd88', image: 'assets/arc-endgame.png' },
    { id: 'resolution',     name: 'RESOLUTION',         startDay: 71, endDay: 999,
      brief: 'Diplomatic resolution, military victory, or managed decline. History is watching.',
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

    // Initial crisis headlines — based on real March 2026 events
    addHeadline('FEB 28: US-Israel joint strikes hit 500 targets across Iran — Khamenei killed', 'critical');
    addHeadline('Iran retaliates with 500+ ballistic missiles and 2,000 drones — 60% targeting US forces', 'critical');
    addHeadline('IRGC Navy deploys across strait — tanker MV Advantage Sweet seized with $50M cargo', 'warning');
    addHeadline('IRIS Dena frigate sunk by US Navy in first major naval engagement since 1988', 'critical');
    addHeadline('Oil surges past $110/barrel — Lloyd\'s suspends war risk coverage for Gulf transit', 'warning');
    addHeadline('Three US carrier strike groups deployed: Lincoln, Truman, Carl Vinson', 'warning');
    addHeadline('Mojtaba Khamenei emerges as likely Supreme Leader successor — IRGC backs him', 'critical');
    addHeadline('KC-135 tanker crashes during combat ops — 3 airmen killed', 'warning');
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

    if (dStab < -8) news.push({ text: 'Stability deteriorated sharply today.', level: 'critical' });
    else if (dStab > 8) news.push({ text: 'Significant stability improvements.', level: 'good' });

    if (dEcon < -8) news.push({ text: 'Economic indicators fell today.', level: 'warning' });
    else if (dEcon > 8) news.push({ text: 'Markets rallied on improved conditions.', level: 'good' });

    if (dSupp < -8) news.push({ text: 'Public support dropped significantly.', level: 'warning' });
    if (dIntel > 10) news.push({ text: 'Intelligence picture improved.', level: 'good' });

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
        const fillers = [
            'A quiet day in the strait. Tankers transit normally.',
            'Diplomatic channels remain open. No major incidents.',
            'Markets hold steady. The situation is unchanged.',
            'Intelligence gathering continues. No surprises.',
        ];
        news.push({ text: fillers[Math.floor(Math.random() * fillers.length)], level: 'normal' });
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
    // Show toast for critical/good headlines
    if (level === 'critical' || level === 'good') {
        if (typeof showToast === 'function') showToast(text, level);
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

    // --- Core Metrics (with playerDelta preservation) ---
    // playerDeltas accumulate from AP actions, decisions, and interrupts.
    // They decay 15% per day so effects last ~6 days at meaningful strength.
    const pd = SIM.playerDeltas;
    const DECAY = 0.85; // retain 85% per day

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
    SIM.budget += coalitionIncome + oilRevenue + baseFunding;

    // Tension — card stances set baseline drift, playerDeltas shift the target (0.3x like other metrics)
    const dipBonus = (SIM.diplomaticCapital - 50) * 0.08;
    const targetTension = Math.max(0, Math.min(100, 15 + tensionDelta - dipBonus + pd.tension * 0.3));
    SIM.tension += (targetTension - SIM.tension) * 0.12;
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
    SIM.oilPrice += (targetPrice - SIM.oilPrice) * 0.15;

    // Domestic approval — playerDelta shifts target
    let approvalDelta = getStanceEffect('domesticApproval');
    if (SIM.character && SIM.character.approvalMult && approvalDelta < 0) {
        approvalDelta *= SIM.character.approvalMult;
    }
    const targetApproval = Math.max(0, Math.min(100, 65 + approvalDelta + pd.domesticApproval));
    SIM.domesticApproval += (targetApproval - SIM.domesticApproval) * 0.10;
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
    SIM.internationalStanding += (targetStanding - SIM.internationalStanding) * 0.10;
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
        addHeadline('Weekly diplomatic cool-down reduces escalation level', 'good');
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
            addHeadline('USN intercepts IRGC attempt on tanker — seizure prevented', 'good');
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
            addHeadline('Aggressive ROE leads to dangerous confrontation', 'critical');
        }
    }

    // Carrier
    const hasCarrier = getStanceEffect('carrier') > 0;
    if (hasCarrier && !SIM.carrier) {
        SIM.carrier = { x: 0.85, y: 0.75, targetX: 0.70, targetY: 0.65, id: 'USS-EISENHOWER' };
        addHeadline('USS Eisenhower carrier strike group enters Gulf of Oman', 'warning');
    } else if (!hasCarrier && SIM.carrier) {
        addHeadline('Carrier strike group withdraws from region', 'normal');
        SIM.carrier = null;
    }

    // Mines during crisis
    if (SIM.crisisLevel >= 2 && SIM.mines.length < 5 && Math.random() < 0.3) {
        SIM.mines.push({ x: 0.38 + Math.random() * 0.22, y: 0.44 + Math.random() * 0.12, detonated: false });
        if (SIM.fogOfWar < 50) addHeadline('Intel detects Iranian mine-laying in strait', 'critical');
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
                    addHeadline('Drone surveillance neutralizes naval mine', 'good');
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
        if (SIM.crisisLevel === 0) addHeadline('Crisis de-escalated. Tensions returning to baseline.', 'good');
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
            const moves_hardliner = [
                'IRGC fast-boats conducted exercises 12nm from USS Eisenhower. They practiced formation attacks.',
                'Iranian state media aired a documentary glorifying the IRGC Navy. Tangsiri appeared in uniform.',
                'New anti-ship missile batteries moved to coastal positions. Satellite shows launch-ready config.',
                'IRGC social media posted training videos of boarding operations. Caption: "The strait is ours."',
                'Tangsiri gave a speech: "Every American vessel in our waters is a legitimate target."',
                'Iranian naval exercises announced near the strait. Largest since 2019.',
                'IRGC proxy channels activated. Houthi rhetoric matches Tehran talking points word-for-word.',
                'Mojtaba Khamenei visited IRGC Navy HQ. Photos show him inspecting fast-attack craft.',
            ];
            const moves_moderate = [
                'Iran\'s foreign ministry called for "dialogue without preconditions." Analysts note the phrase echoes 2015.',
                'Araghchi gave an interview to Al Jazeera emphasizing "mutual respect and diplomatic solutions."',
                'Iran released two detained foreign nationals from Evin prison. No demands were made.',
                'Iranian state media ran an editorial criticizing unnamed military officials for "unnecessary provocations."',
                'Araghchi was seen meeting the Omani ambassador. Back-channel activity suspected.',
                'Iranian moderate newspapers published op-eds calling for economic normalization with the West.',
                'Mojtaba Khamenei praised "the wisdom of patience" in a Friday sermon. Analysts are divided.',
                'Iran offered to allow IAEA access to a previously restricted site. Conditions unclear.',
            ];
            const moves_ambiguous = [
                'The Supreme Leader gave a sermon praising both military strength and patience. Analysts divided.',
                'Iran announced a new oil barter deal with China, bypassing US sanctions entirely.',
                'IRGC and Foreign Ministry issued contradictory statements within hours. Power struggle visible.',
                'Iranian parliament debated the crisis openly for the first time. Both factions claimed support.',
            ];

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
        }
    }

    // Update story arc
    const arc = getCurrentStoryArc();
    if (arc && SIM.storyArc !== arc.id) {
        SIM.storyArc = arc.id;
        addHeadline(`\u2501\u2501\u2501 ${arc.name} \u2501\u2501\u2501`, 'critical');
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
        addHeadline('Houthi forces attack commercial vessel in Red Sea', 'critical');
        SIM.oilFlow = Math.max(10, SIM.oilFlow - 3);
        SIM.oilPrice += 3;
    }
    if (SIM.proxyThreat > 50 && Math.random() < 0.05) {
        addHeadline('Iraqi militia rockets hit US base in region', 'critical');
        SIM.budget -= 15;
        SIM.domesticApproval -= 2;
    }
    if (SIM.proxyThreat > 70 && Math.random() < 0.03) {
        addHeadline('Hezbollah threatens Israel border — regional escalation', 'critical');
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
        addHeadline('Protests erupt in major cities over war policy', 'warning');
    }
    if (SIM.polarization > 72 && SIM.polarization <= 74) {
        addHeadline('Armed militias mobilize — domestic tensions critical', 'critical');
    }
    if (SIM.assassinationRisk > 55 && SIM.assassinationRisk <= 58) {
        addHeadline('Intel: credible threat against senior officials detected', 'critical');
    }
    if (SIM.domesticApproval < 30 && SIM.domesticApproval > 28) {
        addHeadline('Congressional allies distancing — approval dangerously low', 'warning');
    }
    if (SIM.domesticApproval < 20 && SIM.domesticApproval > 18) {
        addHeadline('Impeachment proceedings discussed behind closed doors', 'critical');
    }
    if (SIM.internationalStanding < 20 && SIM.internationalStanding > 18) {
        addHeadline('Major allies publicly criticize US actions', 'warning');
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
            endGame(true, 'The Strait of Hormuz has been open and stable for 7 consecutive days. Crisis resolved through ' +
                (SIM.diplomaticCapital > 60 ? 'masterful diplomacy.' : SIM.domesticApproval > 70 ? 'strong leadership.' : 'persistent strategy.'));
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
            endGame(false, 'Congress has initiated removal proceedings. Your approval collapsed to ' +
                Math.round(SIM.domesticApproval) + '% and stayed there. Your time in the Situation Room is over.');
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
        endGame(false, 'Despite warnings, the threat was not contained. A sophisticated attack succeeds. ' +
            'The crisis claims its highest-profile casualty.');
        return true;
    }

    // --- Lose 3: Global Pariah ---
    if (SIM.internationalStanding <= 10) {
        SIM.lowStandingDays++;
        if (SIM.lowStandingDays >= 3) {
            endGame(false, 'The international community has turned against you. Allies recall ambassadors. ' +
                'Sanctions against the United States are being discussed. You are a global pariah.');
            return true;
        }
    } else { SIM.lowStandingDays = 0; }

    // --- Lose 4: Civil War / Domestic Crisis ---
    if (SIM.polarization >= 85) {
        SIM.highPolarizationDays = (SIM.highPolarizationDays || 0) + 1;
        if (SIM.highPolarizationDays >= 3) {
            endGame(false, 'Domestic unrest has reached a breaking point. The military is split. ' +
                'The crisis abroad has ignited a crisis at home. Civil order collapses.');
            return true;
        }
    } else { SIM.highPolarizationDays = 0; }

    // --- Lose 5: War ---
    if (SIM.warPath >= 5) {
        endGame(false, 'Too many unresolved military incidents. The escalation spiral is irreversible. ' +
            'Armed conflict erupts in the Strait of Hormuz. A regional war has begun.');
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
        if (g.stability < 30) {
            endGame(false, 'After 13 weeks, the situation remains unstable. You failed to open the strait.');
        } else {
            endGame(true, 'After 13 weeks of crisis management, the situation has stabilized enough for a diplomatic resolution.');
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
    const crisisEvents = [
        { level: 1, text: 'CRISIS: Iran deploys additional naval assets to strait', tension: 10 },
        { level: 2, text: 'MAJOR CRISIS: Iran announces mining of shipping channels', tension: 20 },
        { level: 3, text: 'WAR FOOTING: Iran mobilizes ground forces along coast', tension: 30 },
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
        id: 'impounded_tanker', title: 'THE IMPOUNDED TANKER',
        description: 'An Iranian Revolutionary Guard fast-boat swarm harassed a commercial tanker three days ago. The crew is safe but the ship is impounded in Bandar Abbas. Your predecessor resigned in disgrace. You are the replacement. Nobody expects you to last.',
        image: 'assets/event-e01-tanker.png',
        minDay: 1, maxDay: 3,
        choices: [
            { text: 'Demand release through official channels', effects: { internationalStanding: 5, tension: -3, iranAggression: 5 },
              setFlags: { tanker_diplomatic: true },
              flavor: 'You follow process. The world sees restraint. Iran sees an opening.' },
            { text: 'Send a destroyer to loiter outside Bandar Abbas', effects: { tension: 8, internationalStanding: -3 },
              setFlags: { tanker_military: true }, chainEvent: 'carrier_incident', chainDelay: 10,
              chainHint: 'Iran is watching your destroyer very carefully...',
              flavor: 'You say nothing. The image speaks. IRGC commanders take note.' },
            { text: 'Call the flag-state directly — propose a joint response', effects: { internationalStanding: 3, diplomaticCapital: 3 },
              setFlags: { tanker_coalition: true },
              flavor: 'Shared burden, shared credit. The coalition option opens.' },
        ],
    },
    {
        id: 'predecessors_ghost', title: 'THE PREDECESSOR\'S GHOST',
        description: 'A classified folder sits on your desk — your predecessor\'s secret negotiations with Tehran. Reading it is knowledge. Burning it is a clean start. The contents are radioactive either way.',
        image: 'assets/event-e02-predecessor.png',
        minDay: 2, maxDay: 4,
        choices: [
            { text: 'Read the classified file', effects: { fogOfWar: -10 },
              setFlags: { predecessor_read: true },
              flavor: 'You now know Iran\'s real red line. This knowledge will matter — if it doesn\'t destroy you first.' },
            { text: 'Burn the file — start clean', effects: { domesticApproval: 5 },
              setFlags: { predecessor_burned: true },
              flavor: 'The public trusts a clean break. But you\'ll discover Iran\'s red line the hard way — through a crisis.' },
        ],
    },
    {
        id: 'admirals_warning', title: 'THE ADMIRAL\'S WARNING',
        description: 'Your first real briefing. Admiral Chen stands at the podium with satellite imagery of Iranian naval movements. "We need to increase patrol tempo immediately," he says. Your civilian advisors shift uncomfortably.',
        image: 'assets/event-e03-admiral.png',
        minDay: 1, maxDay: 2,
        choices: [
            { text: 'Defer to the Admiral — increase patrols', effects: { budget: -20, tension: 3 },
              setFlags: { admiral_deferred: true },
              flavor: 'The Admiral nods. Your civilian advisors resent being sidelined. The Pentagon respects the energy.' },
            { text: 'Convene your full team before deciding', effects: { },
              setFlags: { admiral_waited: true },
              flavor: 'The Admiral respects the process. Barely. Your team appreciates being heard.' },
            { text: 'Override — propose a diplomatic signal instead', effects: { diplomaticCapital: 5 },
              setFlags: { admiral_overridden: true },
              flavor: 'The Admiral begins quietly briefing Congress about your "lack of seriousness." But Araghchi notices.' },
        ],
    },
    {
        id: 'journalists_call', title: 'THE JOURNALIST\'S CALL',
        description: 'A New York Times reporter is on the line. She\'s working on a piece about your first 72 hours. Off-the-record, she says. But you know how that goes.',
        image: 'assets/event-e04-journalist.png',
        minDay: 3, maxDay: 5,
        condition: () => SIM.fogOfWar > 50,
        choices: [
            { text: 'Give an off-the-record briefing', effects: { fogOfWar: -10, domesticApproval: 3 },
              setFlags: { journalist_briefed: true }, chainEvent: 'journalist_returns', chainDelay: 20,
              chainHint: 'This journalist will remember how you treated her...',
              flavor: 'You shape the narrative. But there\'s a 20% chance she burns you.' },
            { text: 'Written statement through press office', effects: { fogOfWar: -3, domesticApproval: -2 },
              setFlags: { journalist_stonewalled: true },
              flavor: '"Administration stonewalling" runs above the fold. Safe but unhelpful.' },
            { text: '"No comment" — hang up', effects: { },
              setFlags: { journalist_hostile: true },
              flavor: 'She becomes hostile. Future media events will be harder.' },
        ],
    },
    {
        id: 'british_pm_call', title: 'ALLY ON THE LINE: THE BRITISH PM',
        description: 'The British Prime Minister is offering a joint naval task force. Shared command, shared rules of engagement. It\'s generous — suspiciously so. Nothing is free in the special relationship.',
        image: 'assets/event-e05-british-pm.png',
        minDay: 4, maxDay: 6,
        choices: [
            { text: 'Accept — joint task force', effects: { internationalStanding: 10, tension: -3 },
              setFlags: { british_joint_force: true },
              flavor: 'Shared command means shared veto. You lose unilateral strike capability. But the coalition is real.' },
            { text: 'Counter with parallel operations — same area, separate commands', effects: { internationalStanding: 5 },
              setFlags: { british_parallel: true },
              flavor: 'You keep your freedom. The UK is mildly insulted but professional.' },
            { text: 'Ask what they want in return', effects: { diplomaticCapital: 3 },
              setFlags: { british_negotiating: true },
              flavor: 'The PM wants your vote on a UN trade resolution. Opens a side-negotiation.' },
        ],
    },
    {
        id: 'first_seizure_attempt', title: 'THE FIRST SEIZURE ATTEMPT',
        description: 'FLASH traffic from CENTCOM: IRGC fast-boats converging on the MV Pacific Meridian, a Liberian-flagged tanker carrying Japanese electronics. This is the game\'s first real test.',
        image: 'assets/event-e06-seizure.png',
        minDay: 6, maxDay: 8,
        condition: () => SIM.warPath < 3,
        countdown: 12,
        choices: [
            { text: 'Scramble jets — verbal warning over radio', effects: { tension: 3 },
              setFlags: { seizure_warned: true },
              flavor: '70% chance the seizure is deterred. Standard procedure. If it fails, you own the failure.' },
            { text: 'Authorize warning shots across the bow', effects: { tension: 8, warPath: 1 },
              setFlags: { seizure_shots: true },
              flavor: 'The world watches nervously. 90% chance Iran backs down. But escalation is real.' },
            { text: 'Let it happen — document everything for the UN', effects: { oilFlow: -15, tension: 10, internationalStanding: 15, diplomaticCapital: 10 },
              setFlags: { seizure_allowed: true },
              flavor: 'The tanker is seized. It\'s painful. But the footage at the UN will be devastating for Iran.' },
        ],
    },
    {
        id: 'oil_markets_panic', title: 'OIL MARKETS PANIC',
        description: 'Oil futures jumped $15/barrel overnight. The Energy Secretary is on the phone. Gas prices are on every cable news chyron. The Saudi Energy Minister might increase production — if you ask nicely.',
        image: 'assets/event-e08-oil-panic.png',
        minDay: 9, maxDay: 12,
        condition: () => SIM.oilFlow < 60,
        choices: [
            { text: 'Release strategic petroleum reserves', effects: { oilFlow: 10, oilPrice: -8, domesticApproval: 5, budget: -50 },
              setFlags: { spr_released: true },
              flavor: 'Markets calm immediately. But reserves are finite — you\'ve bought 10 days, not a solution.' },
            { text: 'Call Saudi — beg for increased production', effects: { oilFlow: 8, internationalStanding: -3 },
              setFlags: { saudi_called: true },
              flavor: 'MBS agrees — for a price you\'ll pay later. The humiliating leak comes on Day 20.' },
            { text: 'Let markets find their own level', effects: { domesticApproval: -8, oilPrice: 5 },
              setFlags: { markets_ignored: true },
              flavor: 'Pain now, stability later. The opposition runs "gas prices" attack ads within hours.' },
        ],
    },
    {
        id: 'un_showdown', title: 'UN SECURITY COUNCIL SHOWDOWN',
        description: 'The Security Council is in emergency session. You have one shot to get a binding resolution. Russia is leaning veto. China is undecided. Your ambassador is waiting for instructions.',
        image: 'assets/event-e11-un-showdown.png',
        minDay: 17, maxDay: 20,
        choices: [
            { text: 'Push for binding resolution with sanctions', effects: { diplomaticCapital: 20, internationalStanding: 8, tension: 3 },
              condition: () => SIM.internationalStanding > 50,
              setFlags: { un_binding: true },
              flavor: 'Russia abstains. China follows. The resolution passes. Iran is formally isolated.' },
            { text: 'Non-binding statement of concern — play it safe', effects: { internationalStanding: 3 },
              flavor: 'Safe, symbolic, useless. Your team is demoralized.' },
            { text: 'Dramatic intelligence presentation — name IRGC commanders', effects: { fogOfWar: -20, internationalStanding: 10, tension: 8 },
              setFlags: { un_theater: true },
              flavor: 'The room is shocked. Iran scrambles. But you just burned intelligence sources.' },
        ],
    },
    {
        id: 'proxy_ignition', title: 'PROXY IGNITION: HOUTHI STRIKE',
        description: 'Houthis launched anti-ship missiles at a commercial vessel in the Red Sea. The crisis is no longer contained to the strait — it\'s metastasizing. Your budget is burning and allies are nervous.',
        image: 'assets/event-e14-houthi.png',
        minDay: 29, maxDay: 32,
        choices: [
            { text: 'Strike the Houthi launch site', effects: { budget: -20, tension: 8, proxyThreat: -15, internationalStanding: -3 },
              setFlags: { houthi_struck: true },
              flavor: 'Proportional. Professional. Saudi Arabia is grateful. But you just opened a second front.' },
            { text: 'Intercept missiles — let proxies tire themselves out', effects: { budget: -10, proxyThreat: -3 },
              setFlags: { houthi_contained: true },
              flavor: 'Defense only. The Houthis try again in 3 days.' },
            { text: 'Tell Iran through channels: proxy attacks = Tehran\'s responsibility', effects: { tension: 10, diplomaticCapital: 5 },
              setFlags: { proxy_redline: true },
              flavor: 'A red line. If Iran believes you, this changes everything. If they don\'t, it changes nothing.' },
        ],
    },
    {
        id: 'the_leak', title: 'THE LEAK',
        description: 'The Washington Post has your classified strategy memo. Every detail of your Iran approach is now public. Someone in your inner circle betrayed you. The press is circling.',
        image: 'assets/event-e17-leak.png',
        minDay: 20, maxDay: 28,
        condition: () => Math.random() < 0.5 || SIM.domesticApproval < 30,
        choices: [
            { text: 'Launch an aggressive investigation — find the leaker', effects: { domesticApproval: 3, fogOfWar: -5 },
              setFlags: { leak_investigated: true },
              flavor: 'You burn political capital hunting the mole. If you find them, credibility skyrockets.' },
            { text: 'Spin it — frame the leak as showing your brilliant strategy', effects: { domesticApproval: 5, fogOfWar: 5 },
              setFlags: { leak_spun: true },
              flavor: 'Bold. Iran now knows your playbook. But your base thinks you\'re playing 4D chess.' },
            { text: 'Ignore it — refuse to dignify leaks', effects: { domesticApproval: -5 },
              flavor: 'The news cycle moves on. But your staff knows there are no consequences for betrayal.' },
        ],
    },
    {
        id: 'congressional_hearing_big', title: 'THE CONGRESSIONAL HEARING',
        description: 'Senate Armed Services Committee. Live on C-SPAN. The chairman opens with: "The American people deserve to know why we\'re spending $50 million a day on a crisis that\'s getting worse." The cameras are rolling.',
        image: 'assets/event-e18-congress.png',
        minDay: 36, maxDay: 40,
        choices: [
            { text: 'Testify personally — face the music', effects: { domesticApproval: 10, fogOfWar: -5 },
              setFlags: { testified_personally: true },
              flavor: 'You came prepared. The viral clip is you calmly dismantling the chairman\'s argument with classified data.' },
            { text: 'Send your deputy — you\'re managing a crisis', effects: { domesticApproval: -5, internationalStanding: -3 },
              flavor: 'Congress is insulted. Future funding requests just got harder.' },
            { text: 'Testify AND declassify satellite imagery live on camera', effects: { fogOfWar: -15, domesticApproval: 15, tension: 5, internationalStanding: 5 },
              setFlags: { declassified_live: true },
              flavor: 'The room gasps. Iran scrambles. The Pentagon is furious about the declassification. But the public is with you.' },
        ],
    },
    {
        id: 'iran_ultimatum', title: 'IRAN\'S ULTIMATUM',
        description: 'Mojtaba Khamenei appears on state television: "Lift sanctions on our central bank within 72 hours, or the next vessel we seize will fly the American flag." Tangsiri stands behind him, arms crossed. The clock is ticking.',
        image: 'assets/event-e19-ultimatum.png',
        minDay: 38, maxDay: 42,
        countdown: 15,
        choices: [
            { text: 'Call the bluff publicly — "America does not respond to threats"', effects: { domesticApproval: 8, tension: 10 },
              setFlags: { ultimatum_called: true },
              flavor: 'If Iran follows through, this gets catastrophic. If they back down, you win the crisis.' },
            { text: 'Counter-propose through channels — mutual step-down', effects: { diplomaticCapital: 5, tension: -3 },
              condition: () => SIM.diplomaticCapital > 30,
              setFlags: { ultimatum_negotiated: true },
              flavor: '50% Iran accepts. Araghchi is pushing for it internally. Tangsiri wants blood.' },
            { text: 'Prepare quietly — move assets, brief allies, say nothing', effects: { budget: -15, tension: 3 },
              setFlags: { ultimatum_prepared: true },
              flavor: 'Iran is uncertain. Their own internal debate intensifies. Sometimes silence is the loudest response.' },
        ],
    },
    {
        id: 'intel_breakthrough', title: 'THE INTELLIGENCE BREAKTHROUGH',
        description: 'A SIGINT intercept combined with a HUMINT source has revealed Iran\'s true strategic objective. This isn\'t about the strait — it\'s about forcing recognition of Iran\'s regional hegemony. Every move they\'ve made was building toward this moment. The question is what you do with the knowledge.',
        image: 'assets/event-e21-intel-breakthrough.png',
        minDay: 57, maxDay: 62,
        choices: [
            { text: 'Share with allies — build a coalition response', effects: { internationalStanding: 15, diplomaticCapital: 10, fogOfWar: 10 },
              setFlags: { intel_shared: true },
              flavor: 'Allies are galvanized. But your intelligence methods are exposed. Future intel quality degrades.' },
            { text: 'Keep it classified — act unilaterally', effects: { fogOfWar: -10 },
              setFlags: { intel_hoarded: true },
              flavor: 'You know something nobody else does. That\'s power. But allies will feel blindsided later.' },
            { text: 'Leak to a trusted journalist — shape the narrative', effects: { fogOfWar: -20, domesticApproval: 8 },
              setFlags: { intel_leaked: true },
              flavor: 'The public needs to know. Iran changes plans. The intelligence becomes partly obsolete. But public pressure on Iran surges.' },
        ],
    },
    // --- CONTENT BIBLE CHAIN EVENTS ---
    {
        id: 'journalist_returns', title: 'THE JOURNALIST RETURNS',
        description: 'Remember the Times reporter? She\'s back. This time she wants to be embedded with your team for 48 hours. Radical transparency — or radical exposure. Your relationship with her determines how this plays out.',
        image: 'assets/event-e04-journalist.png',
        minDay: 20, maxDay: 999,
        condition: () => SIM.storyFlags.journalist_briefed,
        choices: [
            { text: 'Full on-the-record interview — you\'ve earned it', effects: { domesticApproval: 10, fogOfWar: -5 },
              flavor: 'Your narrative is coherent. The piece is fair. For once, the press is on your side.' },
            { text: 'Embed her with your team for 48 hours', effects: { domesticApproval: 15, fogOfWar: -10 },
              flavor: 'She sees everything — including your mistakes. But the transparency is powerful. 70% chance of a glowing profile.' },
            { text: 'Feed her a specific story you want published', effects: { domesticApproval: 8 },
              flavor: 'It works — this time. But journalists have long memories about being used.' },
        ],
    },
    {
        id: 'carrier_incident', title: 'THE CARRIER INCIDENT',
        description: 'An Iranian drone buzzed the USS Eisenhower\'s flight deck at 50 feet. Sailors hit the deck. Gun cameras captured everything. CENTCOM wants to release the footage. Iran claims it was "routine surveillance."',
        image: 'assets/event-e09-carrier-incident.png',
        minDay: 10, maxDay: 999,
        condition: () => SIM.storyFlags.tanker_military || SIM.warPath >= 2,
        choices: [
            { text: 'Issue formal protest through military channels', effects: { internationalStanding: 3 },
              flavor: 'Professionals talk to professionals. Iran absorbs the protest. IRGC internally: "They flinched."' },
            { text: 'Declassify footage — release to CNN', effects: { fogOfWar: -15, internationalStanding: 8, domesticApproval: 10, tension: 5, iranAggression: -5 },
              setFlags: { humiliated_iran: true },
              flavor: 'The footage goes viral. Iran is embarrassed globally. But Tangsiri remembers the humiliation.' },
            { text: 'Retaliate — disable the drone command facility', effects: { tension: 20, warPath: 1, domesticApproval: 5, budget: -25, iranAggression: 10 },
              setFlags: { drone_facility_struck: true },
              flavor: 'Precision strike. Clean hit. The world holds its breath. Iran goes silent for 48 hours.' },
        ],
    },
    // ======================== ORIGINAL EVENTS ========================
    {
        id: 'secret_talks', title: 'SECRET BACK-CHANNEL',
        description: 'Iranian moderates have reached out through Omani intermediaries. They propose secret talks — but if leaked, hawks on both sides will be furious.',
        image: 'assets/event-e10-shirazi.png',
        minDay: 5, maxDay: 40,
        condition: () => SIM.tension > 25 && SIM.diplomaticCapital > 20,
        choices: [
            { text: 'Accept the talks', effects: { tension: -12, domesticApproval: -5, diplomaticCapital: 15, iranAggression: -8 },
              setFlags: { backchannel_accepted: true }, chainEvent: 'backchannel_progress', chainDelay: 4,
              chainHint: 'The Omani intermediary will report back in a few days...',
              flavor: 'The back-channel opens. Both sides agree to a cooling-off period.' },
            { text: 'Reject — too risky', effects: { tension: 3, iranAggression: 5 },
              setFlags: { backchannel_rejected: true },
              flavor: 'The opportunity passes. Iranian hardliners use the rejection as propaganda.' },
            { text: 'Leak it to the press', effects: { domesticApproval: 8, tension: 6, diplomaticCapital: -15 },
              setFlags: { backchannel_leaked: true },
              flavor: 'You gain public credit but burn the diplomatic bridge.' },
        ],
    },
    {
        id: 'congress_pressure', title: 'CONGRESSIONAL HEARING',
        description: 'Senate Armed Services Committee demands testimony. They threaten to cut your budget.',
        image: 'assets/event-e18-congress.png',
        minDay: 10, maxDay: 60,
        condition: () => getStanceEffect('cost') > 100,
        choices: [
            { text: 'Justify with intelligence', effects: { domesticApproval: 5, fogOfWar: -10, polarization: -3 }, flavor: 'You declassify key intel. Congress is satisfied — for now.' },
            { text: 'Promise to cut spending', effects: { domesticApproval: 3, polarization: -2 }, flavor: 'Congress relents but expects follow-through.' },
            { text: 'Stonewall the committee', effects: { domesticApproval: -10, polarization: 5 }, flavor: 'Refusing backfires. Media coverage turns hostile.' },
        ],
    },
    {
        id: 'allied_request', title: 'ALLIED NAVAL REQUEST',
        description: 'Japan requests dedicated US Navy escort for their tanker fleet. It strengthens the alliance but costs resources.',
        image: 'assets/event-envoy.png',
        minDay: 8, maxDay: 50,
        condition: () => SIM.navyShips.length > 0,
        choices: [
            { text: 'Assign escorts', effects: { internationalStanding: 10, oilFlowProtection: 5, domesticApproval: -2, tension: 3 }, flavor: 'Japanese tankers sail with USN escorts. Tokyo publicly thanks Washington.' },
            { text: 'Decline politely', effects: { internationalStanding: -3 }, flavor: 'Japan is disappointed but understanding.' },
        ],
    },
    {
        id: 'humanitarian', title: 'HUMANITARIAN CRISIS',
        description: 'An Iranian fishing vessel capsized near the strait. 40 fishermen in the water. Your destroyer is 15 minutes away.',
        image: 'assets/event-rescue-op.png',
        minDay: 6, maxDay: 70,
        condition: () => SIM.navyShips.length > 0,
        choices: [
            { text: 'Rescue immediately', effects: { internationalStanding: 12, tension: -8, iranAggression: -5, domesticApproval: 5, diplomaticCapital: 10 }, flavor: 'Your sailors pull 38 survivors from the water. The footage goes viral.' },
            { text: 'Coordinate with Iran', effects: { internationalStanding: 3, tension: -3, diplomaticCapital: 5 }, flavor: 'Joint effort saves most of the crew.' },
            { text: 'Stay on mission', effects: { internationalStanding: -8, tension: 2, domesticApproval: -5 }, flavor: 'Iranian state media reports US ships watched fishermen drown.' },
        ],
    },
    {
        id: 'media_crisis', title: 'MEDIA FIRESTORM',
        description: 'Footage of a near-collision between US and Iranian vessels. Cable news running it 24/7.',
        image: 'assets/event-military.png',
        minDay: 12, maxDay: 80,
        condition: () => SIM.navyShips.length > 0 && SIM.iranBoats.length > 0,
        choices: [
            { text: 'Release full video', effects: { domesticApproval: 5, tension: -2, internationalStanding: 3 }, flavor: 'Unedited footage shows Iranian provocation. Narrative shifts in your favor.' },
            { text: 'Downplay the incident', effects: { domesticApproval: -3, tension: -5 }, flavor: 'The story fades. Both sides quietly move on.' },
            { text: 'Blame Iran publicly', effects: { domesticApproval: 3, tension: 8, iranAggression: 5, polarization: 3 }, flavor: 'Forceful condemnation rallies base but inflames Iran.' },
        ],
    },
    {
        id: 'intel_reveal', title: 'INTELLIGENCE BREAKTHROUGH',
        description: 'Your agents located Iran\'s mine-laying operations. Acting on it would burn the source.',
        image: 'assets/event-e21-intel-breakthrough.png',
        minDay: 15, maxDay: 75,
        condition: () => SIM.fogOfWar < 60 && SIM.crisisLevel >= 1,
        choices: [
            { text: 'Strike the mine depot', effects: { tension: 15, iranAggression: 10, conflictRisk: 8, warPath: 1 }, flavor: 'Cruise missiles destroy the depot. Mine threat neutralized.' },
            { text: 'Share with allies quietly', effects: { internationalStanding: 5, fogOfWar: -15, diplomaticCapital: 8 }, flavor: 'Coalition partners mine-sweep the areas. Source stays safe.' },
            { text: 'Hold the intelligence', effects: { fogOfWar: -8 }, flavor: 'You file it for future use.' },
        ],
    },
    {
        id: 'china_mediation', title: 'CHINESE MEDIATION OFFER',
        description: 'Beijing proposes brokering a deal: they\'ll pressure Iran if you ease tech restrictions on Chinese firms.',
        image: 'assets/event-e13-china.png',
        minDay: 14, maxDay: 65,
        condition: () => SIM.tension > 30 && SIM.chinaRelations > 25,
        choices: [
            { text: 'Accept the deal', effects: { tension: -10, iranAggression: -10, domesticApproval: -8, chinaRelations: 15 }, flavor: 'China delivers. Iran pulls back. But tech concessions draw criticism.' },
            { text: 'Counter-propose', effects: { tension: -4, diplomaticCapital: -5, chinaRelations: 5 }, flavor: 'Negotiations drag on. Modest gains.' },
            { text: 'Reject outright', effects: { domesticApproval: 5, tension: 3, chinaRelations: -10 }, flavor: 'Hawks applaud. China is annoyed.' },
        ],
    },
    {
        id: 'houthi_attack', title: 'HOUTHI RED SEA ATTACK',
        description: 'Houthi forces have struck a commercial vessel in the Red Sea with an anti-ship missile. Iran\'s proxy war is expanding.',
        image: 'assets/event-e14-houthi.png',
        minDay: 10, maxDay: 75,
        condition: () => SIM.proxyThreat > 25,
        choices: [
            { text: 'Strike Houthi launch sites', effects: { proxyThreat: -15, tension: 10, internationalStanding: -5, warPath: 1 }, flavor: 'Precision strikes destroy launch infrastructure. Houthis go quiet briefly.' },
            { text: 'Ask Saudi Arabia to handle it', effects: { proxyThreat: -8, internationalStanding: 3 }, flavor: 'Riyadh engages. Results are mixed but it shares the burden.' },
            { text: 'Condemn and do nothing', effects: { proxyThreat: 5, domesticApproval: -3 }, flavor: 'Critics ask why you\'re not responding to attacks on global shipping.' },
        ],
    },
    {
        id: 'militia_attack', title: 'MILITIA BASE ATTACK',
        description: 'Iraqi militia rockets hit a US base in the region. Two soldiers wounded. CENTCOM wants authorization to retaliate.',
        image: 'assets/event-military.png',
        minDay: 18, maxDay: 80,
        condition: () => SIM.proxyThreat > 35,
        choices: [
            { text: 'Retaliatory strike', effects: { iranAggression: -10, proxyThreat: -10, tension: 12, warPath: 1, domesticApproval: 5 }, flavor: 'Precision strikes hit militia warehouses. A clear message sent.' },
            { text: 'Increase base security', effects: { domesticApproval: -2, polarization: 2 }, flavor: 'You absorb the attack. Some call it restraint, others weakness.' },
            { text: 'Withdraw from the base', effects: { domesticApproval: -8, tension: -5, proxyThreat: 3 }, flavor: 'The withdrawal is spun as a retreat. Iran claims victory.' },
        ],
    },
    {
        id: 'assassination_intel', title: 'CREDIBLE THREAT DETECTED',
        description: 'Intelligence agencies detect a credible assassination threat against senior officials. The source is unclear — could be Iranian or domestic.',
        image: 'assets/event-intel.png',
        minDay: 20, maxDay: 85,
        condition: () => SIM.assassinationRisk > 40,
        choices: [
            { text: 'Increase security protocols', effects: { assassinationRisk: -20 }, flavor: 'Security is tightened. Operations slow but the threat is contained.' },
            { text: 'Public announcement', effects: { assassinationRisk: -10, tension: 5, domesticApproval: 3 }, flavor: 'Going public rallies support but raises tensions.' },
            { text: 'Ignore — focus on the mission', effects: {}, flavor: 'You choose to focus on the strait. The risk remains.' },
        ],
    },
    {
        id: 'domestic_unrest', title: 'DOMESTIC UNREST',
        description: 'Protests erupt in major cities over war spending and the strait crisis. The National Guard is requesting authorization.',
        image: 'assets/event-e18-congress.png',
        minDay: 25, maxDay: 85,
        condition: () => SIM.polarization > 50,
        choices: [
            { text: 'Address the nation', effects: { domesticApproval: 5, polarization: -5 }, flavor: 'Your speech calls for unity. Polls stabilize temporarily.' },
            { text: 'Deploy National Guard', effects: { polarization: 10, domesticApproval: -5, internationalStanding: -5 }, flavor: 'The crackdown makes headlines worldwide. Things get worse.' },
            { text: 'Announce peace initiative', effects: { tension: -5, domesticApproval: 3, iranAggression: 3, polarization: -3 }, flavor: 'A bold move. Moderates applaud, hawks protest.' },
        ],
    },
    {
        id: 'hostage', title: 'HOSTAGE SITUATION',
        description: 'Iran is holding 12 crew members from a seized tanker. Families are on every news channel.',
        image: 'assets/event-e12-hostage.png',
        minDay: 10, maxDay: 75,
        condition: () => SIM.seizureCount > 0,
        choices: [
            { text: 'Negotiate release', effects: { domesticApproval: 8, tension: -5, diplomaticCapital: -10 },
              setFlags: { hostage_negotiating: true }, chainEvent: 'hostage_situation_escalates', chainDelay: 3,
              chainHint: 'Negotiations are underway. This will take days...',
              flavor: 'You open a channel through Swiss intermediaries. The crew is alive but scared.' },
            { text: 'Demand unconditional release', effects: { tension: 8, domesticApproval: 3, iranAggression: 5, warPath: 1 },
              setFlags: { hostage_hardline: true },
              flavor: 'You increase pressure. International opinion turns against Iran.' },
            { text: 'Offer quiet concession', effects: { tension: -8, domesticApproval: -5, iranAggression: -3 },
              flavor: 'A minor sanctions waiver. The crew comes home. Nobody talks about the price.' },
        ],
    },
    {
        id: 'oil_spike', title: 'OIL MARKET PANIC',
        description: 'Oil futures jumped $15/barrel. Energy Secretary is on the phone — should you release reserves?',
        image: 'assets/event-e08-oil-panic.png',
        minDay: 8, maxDay: 80,
        condition: () => SIM.oilPrice > 110,
        choices: [
            { text: 'Release reserves', effects: { oilPrice: -12, domesticApproval: 5 }, flavor: 'SPR release calms markets. Prices stabilize.' },
            { text: 'Verbal intervention only', effects: { oilPrice: -4, domesticApproval: -2 }, flavor: 'Your press conference helps a little. Markets remain jittery.' },
            { text: 'Let markets correct', effects: { domesticApproval: -5 }, flavor: 'Gas prices soar. Critics call you out of touch.' },
        ],
    },
    {
        id: 'gulf_offer', title: 'GULF STATE OFFER',
        description: 'Saudi Arabia and UAE offer to fund 60% of your operations — but they want a say in rules of engagement.',
        image: 'assets/event-grand-bargain.png',
        minDay: 12, maxDay: 55,
        condition: () => getStanceEffect('cost') > 50,
        choices: [
            { text: 'Accept with conditions', effects: { domesticApproval: 5, tension: 3, internationalStanding: 3 }, flavor: 'Gulf funding flows in. You retain operational control.' },
            { text: 'Accept fully', effects: { domesticApproval: -3, tension: 5 }, flavor: 'Generous funding helps but critics question who\'s calling the shots.' },
            { text: 'Decline', effects: { domesticApproval: 3, diplomaticCapital: -5 }, flavor: 'You maintain independence but miss burden-sharing.' },
        ],
    },
    {
        id: 'drone_shootdown', title: 'DRONE SHOOT-DOWN',
        description: 'Iran shot down your surveillance drone over international waters. Joint Chiefs want a proportional response.',
        image: 'assets/event-military.png',
        minDay: 15, maxDay: 80,
        condition: () => SIM.drones.length > 0,
        choices: [
            { text: 'Strike the missile battery', effects: { tension: 20, conflictRisk: 15, iranAggression: -10, domesticApproval: 5, warPath: 2 }, flavor: 'Precision strike destroys the SAM site. The world holds its breath.' },
            { text: 'Respond with more drones', effects: { tension: 5, fogOfWar: -15, domesticApproval: 2 }, flavor: 'You flood the area with drones. Iran doesn\'t dare shoot again.' },
            { text: 'Stand down — it was unmanned', effects: { tension: -3, domesticApproval: -5, iranAggression: 5 }, flavor: 'You absorb the loss. Some call it wise, others call it weak.' },
        ],
    },
    {
        id: 'un_vote', title: 'UN RESOLUTION VOTE',
        description: 'A resolution condemning Iran is up for vote. Russia will veto unless you water it down.',
        image: 'assets/event-e11-un-showdown.png',
        minDay: 15, maxDay: 60,
        condition: () => SIM.tension > 20,
        choices: [
            { text: 'Push strong resolution', effects: { internationalStanding: 8, tension: 5, chinaRelations: -8, diplomaticCapital: -10 }, flavor: 'Russia vetoes. But the debate isolates Iran diplomatically.' },
            { text: 'Accept watered-down version', effects: { internationalStanding: 3, tension: -3, diplomaticCapital: 5, chinaRelations: 3 }, flavor: 'Passes unanimously. Symbolic but shows unity.' },
            { text: 'Withdraw the resolution', effects: { internationalStanding: -5, diplomaticCapital: -5 }, flavor: 'Allies are confused by the retreat.' },
        ],
    },
    {
        id: 'cyber_attack_decision', title: 'CYBER OPERATION PROPOSAL',
        description: 'NSA can disable Iran\'s naval command network for 48 hours. If attributed, it\'s an act of war.',
        image: 'assets/event-e23-cyber.png',
        minDay: 20, maxDay: 80,
        condition: () => SIM.iranAggression > 40,
        choices: [
            { text: 'Approve the operation', effects: { iranAggression: -15, fogOfWar: -20, tension: 10, conflictRisk: 12, warPath: 1 }, flavor: 'Iran\'s boats go silent for two days. They suspect sabotage.' },
            { text: 'Too dangerous — deny', effects: {}, flavor: 'You shelve the plan. Better to save that card.' },
        ],
    },
    {
        id: 'election_pressure', title: 'ELECTION YEAR PRESSURE',
        description: 'Your party is down in polls. Advisors want a dramatic move before midterms.',
        image: 'assets/event-diplomatic.png',
        minDay: 30, maxDay: 75,
        condition: () => true,
        choices: [
            { text: 'Stage a naval exercise', effects: { tension: 8, domesticApproval: 10, iranAggression: 5, polarization: 3 }, flavor: 'Carriers look great on camera. Polls bump. Iran calls it provocation.' },
            { text: 'Focus on diplomacy', effects: { tension: -5, domesticApproval: -3, diplomaticCapital: 8, polarization: -2 }, flavor: 'Not flashy. Pundits debate whether it\'s leadership or weakness.' },
            { text: 'Ignore the advisors', effects: {}, flavor: 'You stay the course. The polls are what they are.' },
        ],
    },
    {
        id: 'pipeline_sabotage', title: 'PIPELINE SABOTAGE',
        description: 'An underwater pipeline feeding a major terminal has been damaged. Could be Iran, could be an accident.',
        image: 'assets/event-economic.png',
        minDay: 20, maxDay: 70,
        condition: () => SIM.crisisLevel >= 1,
        choices: [
            { text: 'Blame Iran, escalate', effects: { tension: 12, domesticApproval: 3, iranAggression: 5, warPath: 1 }, flavor: 'The accusation rallies allies but stokes the fire.' },
            { text: 'Investigate first', effects: { fogOfWar: -8 }, flavor: 'Measured response. The investigation takes time.' },
            { text: 'Offer joint investigation', effects: { tension: -5, diplomaticCapital: 8, internationalStanding: 5 }, flavor: 'Surprisingly, Iran agrees. A thread of trust forms.' },
        ],
    },
    {
        id: 'russia_arms_deal', title: 'RUSSIAN ARMS SHIPMENT',
        description: 'Intel shows Russia is shipping advanced anti-ship missiles to Iran. If they\'re deployed, the strait becomes deadlier.',
        image: 'assets/event-intel.png',
        minDay: 18, maxDay: 70,
        condition: () => SIM.chinaRelations < 40,
        choices: [
            { text: 'Intercept the shipment', effects: { chinaRelations: -15, tension: 12, iranAggression: -5, warPath: 1 }, flavor: 'The ship is turned back. Russia is furious. Iran doesn\'t get the weapons.' },
            { text: 'Diplomatic protest', effects: { chinaRelations: -5, internationalStanding: 3 }, flavor: 'A formal protest. The shipment arrives but world opinion shifts.' },
            { text: 'Ignore it', effects: { iranAggression: 8, conflictRisk: 5 }, flavor: 'The missiles are deployed. Iranian capabilities increase.' },
        ],
    },
    {
        id: 'iran_internal', title: 'IRANIAN POWER STRUGGLE',
        description: 'Intel suggests moderates within Iran\'s government are challenging IRGC hardliners. You could tip the balance.',
        image: 'assets/event-e07-iran-doubles.png',
        minDay: 25, maxDay: 80,
        condition: () => SIM.iranEconomy < 40 && SIM.fogOfWar < 50,
        choices: [
            { text: 'Covert support for moderates', effects: { iranAggression: -12, tension: -5, diplomaticCapital: -8, fogOfWar: 5 }, flavor: 'Quiet support shifts the internal debate. IRGC loses influence.' },
            { text: 'Public endorsement', effects: { iranAggression: 5, domesticApproval: 3, internationalStanding: -3 }, flavor: 'Your endorsement backfires — moderates are tainted by US association.' },
            { text: 'Stay out of it', effects: {}, flavor: 'You let Iranian politics play out on their own.' },
        ],
    },
    {
        id: 'tanker_escort', title: 'ESCORT CONVOY REQUEST',
        description: 'Multiple shipping companies request military escort through the strait. It would restore confidence but stretch your forces.',
        image: 'assets/event-envoy.png',
        minDay: 12, maxDay: 65,
        condition: () => SIM.oilFlow < 70 && SIM.navyShips.length >= 3,
        choices: [
            { text: 'Full escort operations', effects: { oilFlowProtection: 15, tension: 5, domesticApproval: 5, internationalStanding: 8 }, flavor: 'Convoys resume under military escort. Oil markets stabilize.' },
            { text: 'Limited escort for allies only', effects: { oilFlowProtection: 8, internationalStanding: -3, domesticApproval: 2 }, flavor: 'Allied flagged ships get protection. Others are on their own.' },
            { text: 'Decline — too risky', effects: { oilFlowProtection: -5, domesticApproval: -3 }, flavor: 'Shipping companies reroute. Costs skyrocket.' },
        ],
    },
    {
        id: 'wargame_leak', title: 'WARGAME SIMULATION LEAKED',
        description: 'A Pentagon wargame simulation showing US casualties in a strait conflict was leaked to the press. Public is alarmed.',
        image: 'assets/event-e17-leak.png',
        minDay: 20, maxDay: 75,
        condition: () => SIM.conflictRisk > 30,
        choices: [
            { text: 'Downplay and investigate leak', effects: { domesticApproval: -5, polarization: 3 }, flavor: 'The story dominates the news cycle. The leak investigation goes nowhere.' },
            { text: 'Use it as a warning', effects: { domesticApproval: 3, tension: -5, polarization: -2 }, flavor: 'You frame it as evidence for de-escalation. Public opinion shifts toward diplomacy.' },
            { text: 'Double down on readiness', effects: { domesticApproval: 5, tension: 5, conflictRisk: 5 }, flavor: '"We train for worst cases so they never happen." Hawks love it.' },
        ],
    },
    {
        id: 'stena_imperative', title: 'TANKER ESCAPE — USS MCFAUL',
        description: 'Six IRGC gunboats are converging on the tanker Stena Imperative. USS McFaul (DDG-74) is 12 minutes away. The tanker captain is requesting emergency escort.',
        image: 'assets/event-e06-seizure.png',
        minDay: 4, maxDay: 30,
        condition: () => SIM.navyShips.length > 0 && SIM.iranBoats.length > 1,
        countdown: 12,
        choices: [
            { text: 'Full speed intercept — weapons hot', effects: { tension: 15, iranAggression: -8, domesticApproval: 8, warPath: 1, internationalStanding: 3 }, flavor: 'McFaul arrives at flank speed. F-35 overhead shoots down an Iranian Shahed drone. IRGC boats scatter. The tanker escapes.' },
            { text: 'Intercept but weapons tight', effects: { tension: 8, iranAggression: -3, domesticApproval: 5 }, flavor: 'McFaul positions between the tanker and gunboats. Tense standoff. IRGC withdraws after 40 minutes.' },
            { text: 'Monitor only — avoid provocation', effects: { tension: 3, iranAggression: 5, domesticApproval: -5, oilFlow: -5 }, flavor: 'IRGC boards and seizes the Stena Imperative. Video goes viral. "Where was the Navy?"' },
        ],
    },
    {
        id: 'insurance_crisis', title: 'MARITIME INSURANCE COLLAPSE',
        description: 'Lloyd\'s of London and major maritime insurers have cancelled all war risk coverage in the Persian Gulf. No insurance = no tankers transit. Oil markets are panicking.',
        image: 'assets/event-economic.png',
        minDay: 8, maxDay: 50,
        condition: () => SIM.tension > 40 && SIM.oilPrice > 100,
        choices: [
            { text: 'Government-backed insurance program ($20B)', effects: { budget: -200, oilFlow: 15, domesticApproval: 5, internationalStanding: 5 }, flavor: 'A $20B government guarantee backstops the market. Tankers resume transit. Chubb signs as lead underwriter.' },
            { text: 'Pressure insurers to resume coverage', effects: { oilFlow: 5, internationalStanding: -3 }, flavor: 'Arm-twisting produces limited coverage at 300% premiums. Some tankers resume.' },
            { text: 'Let the market sort itself out', effects: { oilFlow: -10, oilPrice: 15, domesticApproval: -8 }, flavor: 'Transit drops 70%. 150+ ships anchored outside the strait. Gas hits $6/gallon.' },
        ],
    },
    {
        id: 'nuclear_breakout', title: 'NUCLEAR BREAKOUT WARNING',
        description: 'IAEA reports Iran has moved enriched uranium to the underground Fordow facility. At 60% enrichment with 440kg stockpile, weapons-grade material is 72 hours away.',
        image: 'assets/event-fordow-strike.png',
        minDay: 20, maxDay: 70,
        condition: () => SIM.iranAggression > 50 && SIM.tension > 40,
        choices: [
            { text: 'Strike Fordow — bunker busters', effects: { tension: 30, warPath: 2, iranAggression: 15, internationalStanding: -15, domesticApproval: 10 },
              setFlags: { fordow_struck: true },
              flavor: 'B-2 bombers drop GBU-57 MOPs on the mountain facility. Iran vows "devastating retaliation." The nuclear clock resets.' },
            { text: 'Emergency UN session — demand inspections', effects: { tension: 5, internationalStanding: 10, diplomaticCapital: 15, iranAggression: 3 },
              setFlags: { nuclear_inspectors_sent: true }, chainEvent: 'nuclear_inspection_crisis', chainDelay: 4,
              chainHint: 'The IAEA team will arrive at Fordow in days...',
              flavor: 'The Security Council convenes. Russia and China abstain rather than veto. New inspections demanded.' },
            { text: 'Offer down-blend deal', effects: { tension: -10, iranAggression: -8, domesticApproval: -10, diplomaticCapital: 10 },
              setFlags: { nuclear_deal_proposed: true },
              flavor: 'You offer sanctions relief in exchange for down-blending to 3.67%. Hawks call it appeasement. Iran considers it.' },
        ],
    },
    {
        id: 'abqaiq_redux', title: 'SAUDI ARAMCO ATTACK',
        description: 'Drone swarm strikes Abqaiq-Khurais oil processing facility. 5.7 million barrels/day knocked offline — half of Saudi production. Oil futures spike 15% overnight.',
        image: 'assets/event-e07-iran-doubles.png',
        minDay: 12, maxDay: 65,
        condition: () => SIM.proxyThreat > 30 || SIM.iranAggression > 55,
        choices: [
            { text: 'Retaliatory strikes on Iranian launch sites', effects: { tension: 20, warPath: 2, iranAggression: -10, proxyThreat: -15, domesticApproval: 8, oilPrice: 10 }, flavor: 'Cruise missiles hit IRGC drone bases. Iran denies involvement. The region braces for war.' },
            { text: 'Coordinate with Saudi air defense', effects: { tension: 5, internationalStanding: 5, proxyThreat: -5, oilPrice: 8 }, flavor: 'You deploy Patriot batteries and THAAD. Future attacks are intercepted. Production resumes in 10 days.' },
            { text: 'Condemn and investigate', effects: { oilPrice: 12, domesticApproval: -5, proxyThreat: 5 }, flavor: 'The investigation drags on. Oil prices stay elevated. Critics ask "What are you waiting for?"' },
        ],
    },
    {
        id: 'houthi_restart', title: 'HOUTHI RED SEA CAMPAIGN RESUMES',
        description: 'After months of quiet, Houthi forces launch anti-ship missiles at three commercial vessels in the Red Sea. Container shipping drops 90% through Bab el-Mandeb.',
        image: 'assets/event-e14-houthi.png',
        minDay: 10, maxDay: 60,
        condition: () => SIM.proxyThreat > 20,
        choices: [
            { text: 'Deploy carrier group to Red Sea', effects: { tension: 8, proxyThreat: -12, oilFlow: 5, budget: -50, domesticApproval: 5 }, flavor: 'Air strikes degrade Houthi launch sites. But now your forces are split between two theaters.' },
            { text: 'Ask Saudi Arabia to handle it', effects: { proxyThreat: -5, internationalStanding: 3, domesticApproval: 2 }, flavor: 'Riyadh engages but results are mixed. The Houthis are experienced guerrilla fighters.' },
            { text: 'Focus on the strait — ignore Red Sea', effects: { proxyThreat: 8, oilPrice: 10, internationalStanding: -5 }, flavor: 'Shipping reroutes via Cape of Good Hope. 10 extra days, $1M fuel per voyage. Global supply chains buckle.' },
        ],
    },
    {
        id: 'mine_laying_detected', title: 'IRAN BEGINS MINING THE STRAIT',
        description: 'CNN confirms: Iranian vessels are actively laying mines in the Strait of Hormuz shipping channels. CENTCOM identifies 12+ minelayers operating under cover of darkness.',
        image: 'assets/event-military.png',
        minDay: 15, maxDay: 60,
        condition: () => SIM.crisisLevel >= 1 && SIM.iranAggression > 50,
        choices: [
            { text: 'Sink the minelayers', effects: { tension: 20, warPath: 1, iranAggression: -12, oilFlow: 5, domesticApproval: 8, internationalStanding: -5 }, flavor: 'US forces sink 16 Iranian minelayers in a single night. Iran retains 80% of its small boat fleet.' },
            { text: 'Deploy minesweepers — clear lanes', effects: { tension: 5, oilFlow: 8, budget: -30, internationalStanding: 5 }, flavor: 'Allied minesweepers begin clearing operations. Transit resumes under escort within 72 hours.' },
            { text: 'Establish exclusion zone', effects: { tension: 12, oilFlow: -5, warPath: 1, internationalStanding: 3 }, flavor: 'Any vessel in the exclusion zone will be engaged. Iran calls it an act of war.' },
        ],
    },
    {
        id: 'drone_carrier', title: 'IRIS SHAHID BAGHERI DETECTED',
        description: 'Intelligence identifies the IRIS Shahid Bagheri — a converted container ship functioning as Iran\'s first drone carrier. It can deploy 30+ fast attack craft and explosive drone boats from inside the hull.',
        image: 'assets/event-intel.png',
        minDay: 12, maxDay: 55,
        condition: () => SIM.fogOfWar < 60,
        choices: [
            { text: 'Strike it before it deploys', effects: { tension: 18, iranAggression: -8, warPath: 1, domesticApproval: 5, internationalStanding: -8 }, flavor: 'Harpoon missiles destroy the vessel. Iran calls it an attack on a "civilian cargo ship." Satellite photos prove otherwise.' },
            { text: 'Track and monitor', effects: { fogOfWar: -10, tension: 5 }, flavor: 'You let it sail, gaining valuable intel on Iran\'s doctrine. But those drone boats could strike at any time.' },
            { text: 'Leak intel to media', effects: { internationalStanding: 8, tension: 8, iranAggression: -3, fogOfWar: 5 }, flavor: 'World media covers the "ghost carrier." Iran forced to dock it. But they know you\'re watching.' },
        ],
    },
    {
        id: 'china_oil_deal', title: 'CHINA\'S SHADOW FLEET',
        description: 'Satellite imagery shows 15 Chinese-flagged tankers loading Iranian oil at Kharg Island. 11.7 million barrels shipped to China since the crisis began. Your sanctions are being openly defied.',
        image: 'assets/event-e13-china.png',
        minDay: 10, maxDay: 70,
        condition: () => SIM.chinaRelations > 20,
        choices: [
            { text: 'Secondary sanctions on Chinese banks', effects: { chinaRelations: -20, iranEconomy: -10, tension: 5, oilPrice: 8, internationalStanding: -5 }, flavor: 'SWIFT cuts off three Chinese banks. Beijing is furious. Iran\'s revenue collapses. Trade war escalates.' },
            { text: 'Quiet diplomatic pressure', effects: { chinaRelations: -5, iranEconomy: -3, diplomaticCapital: -5 }, flavor: 'Beijing makes promises. The shadow fleet shrinks slightly. It\'s not enough.' },
            { text: 'Look the other way', effects: { iranEconomy: 5, chinaRelations: 5, domesticApproval: -5 }, flavor: 'Pragmatism over principle. Iran keeps selling. Hawks in Congress are furious.' },
        ],
    },
    {
        id: 'oman_talks', title: 'MUSCAT BACK-CHANNEL', image: 'assets/iran-araghchi.png',
        description: 'Omani intermediaries report Iran\'s Foreign Minister Araghchi says a nuclear deal is "within reach." He proposes secret talks in Muscat. Three days later, your intelligence says IRGC is planning a major provocation.',
        image: 'assets/event-e20-muscat.png',
        minDay: 8, maxDay: 45,
        condition: () => SIM.diplomaticCapital > 15 && SIM.tension > 30,
        choices: [
            { text: 'Send negotiators to Muscat', effects: { tension: -10, iranAggression: -8, diplomaticCapital: 15, domesticApproval: -5, fogOfWar: 5 }, flavor: 'Three hours of talks produce a framework. But is the IRGC on the same page as the Foreign Ministry?' },
            { text: 'Demand preconditions first', effects: { tension: 3, diplomaticCapital: -5, internationalStanding: 3 }, flavor: 'You insist on a tanker release before talks. Iran walks away. The window narrows.' },
            { text: 'It\'s a distraction — reject', effects: { tension: 5, iranAggression: 5, domesticApproval: 5 }, flavor: 'Hawks applaud. Doves despair. The IRGC provocation happens anyway.' },
        ],
    },
    {
        id: 'asian_energy_crisis', title: 'ASIAN ENERGY EMERGENCY',
        description: 'India, Japan, and South Korea declare energy emergencies. 89% of strait oil goes to Asia. India invokes emergency powers to redirect LPG from industry to households. Tokyo warns of rolling blackouts.',
        image: 'assets/event-crisis-cascade.png',
        minDay: 14, maxDay: 60,
        condition: () => SIM.oilFlow < 40,
        choices: [
            { text: 'Coordinate allied reserve release', effects: { oilPrice: -10, internationalStanding: 10, oilFlow: 5, budget: -40 }, flavor: 'IEA coordinates the largest coordinated reserve release in history. Markets stabilize briefly.' },
            { text: 'Prioritize US allies', effects: { oilFlow: 3, internationalStanding: -5, domesticApproval: 3 }, flavor: 'Allied tankers get priority escort. India and others are left scrambling.' },
            { text: 'Use as leverage for coalition', effects: { internationalStanding: 8, diplomaticCapital: 10 }, flavor: '"You want oil? Send warships." Japan and South Korea reluctantly agree to contribute naval assets.' },
        ],
    },
    {
        id: 'gas_price_crisis', title: 'GAS HITS $6 PER GALLON',
        description: 'Average US gas price breaks $6/gallon. Trucking companies halt routes. Airlines cancel flights. The economic pain is no longer abstract — it\'s at every pump in America.',
        image: 'assets/event-crisis-cascade.png',
        minDay: 10, maxDay: 70,
        condition: () => SIM.oilPrice > 130,
        choices: [
            { text: 'Emergency SPR release + price cap', effects: { oilPrice: -12, domesticApproval: 8, budget: -30 }, flavor: 'Gas drops to $5.20. Temporary relief. But the reserve is running low.' },
            { text: 'Blame Iran — rally patriotism', effects: { domesticApproval: 5, polarization: 5, tension: 3 }, flavor: '"Iran is attacking YOUR wallet." The message resonates but doesn\'t lower prices.' },
            { text: 'Fast-track domestic drilling', effects: { domesticApproval: 3, oilPrice: -5, internationalStanding: -3, polarization: 3 }, flavor: 'Environmental groups protest. Production won\'t increase for months. But it\'s a signal.' },
        ],
    },
    {
        id: 'war_powers_vote', title: 'WAR POWERS RESOLUTION',
        description: 'Both chambers of Congress have drafted War Powers Resolutions. If passed, your military options are severely constrained. The vote is in 48 hours.',
        image: 'assets/event-e18-congress.png',
        minDay: 15, maxDay: 75,
        condition: () => SIM.warPath >= 2 || SIM.tension > 60,
        choices: [
            { text: 'Lobby to defeat it', effects: { domesticApproval: -3, polarization: 5, diplomaticCapital: -5 }, flavor: 'Republicans rally. The resolution fails narrowly in the Senate. Democrats vow to try again.' },
            { text: 'Declassify intel to justify actions', effects: { domesticApproval: 8, fogOfWar: 10, polarization: -3 }, flavor: 'Senators see the classified briefing. The resolution is tabled. But Iran now knows what you know.' },
            { text: 'Accept constraints — show respect for process', effects: { domesticApproval: 5, internationalStanding: 5, tension: -5 }, flavor: 'Critics call it weakness. Allies call it maturity. Your military options narrow but legitimacy grows.' },
        ],
    },
    {
        id: 'tanker_war_echoes', title: 'OPERATION EARNEST WILL 2.0',
        description: 'Pentagon proposes a formal convoy escort operation through the strait — echoing the 1987-88 Tanker War. Reflagging allied tankers under US flag for legal protection.',
        image: 'assets/event-military.png',
        minDay: 12, maxDay: 55,
        condition: () => SIM.oilFlow < 50 && SIM.navyShips.length >= 3,
        choices: [
            { text: 'Launch Earnest Will 2.0', effects: { oilFlow: 15, tension: 8, budget: -40, domesticApproval: 5, internationalStanding: 10, warPath: 1 }, flavor: 'Reflagged tankers sail under the Stars and Stripes. Any attack is now an attack on America. Oil markets respond.' },
            { text: 'Coalition-led escort (share the burden)', effects: { oilFlow: 10, tension: 5, budget: -15, internationalStanding: 8 }, flavor: 'UK, France, and Australia contribute escorts. Slower to organize but spreads the risk.' },
            { text: 'Too provocative — decline', effects: { oilFlow: -5, domesticApproval: -5, internationalStanding: -3 }, flavor: 'Shipping companies continue rerouting via Cape of Good Hope. Transit times and costs skyrocket.' },
        ],
    },
    {
        id: 'cyber_port_attack', title: 'IRANIAN CYBER ATTACK — FUJAIRAH PORT',
        description: 'APT33 (IRGC-affiliated) has hit Fujairah port systems with wiper malware. Terminal operating systems are down. 40+ tankers can\'t load or unload. It\'s the digital equivalent of mining the strait.',
        image: 'assets/event-e23-cyber.png',
        minDay: 10, maxDay: 65,
        condition: () => SIM.iranAggression > 40,
        choices: [
            { text: 'Counter-cyber operation — hit Iranian ports', effects: { tension: 10, iranAggression: -8, fogOfWar: -10, conflictRisk: 8 }, flavor: 'NSA retaliates. Bandar Abbas port goes dark for 72 hours. Cyber escalation spiral begins.' },
            { text: 'Restore systems — defensive posture', effects: { oilFlow: 5, budget: -20, internationalStanding: 3 }, flavor: 'US Cyber Command deploys incident response teams. Systems back online in 5 days. Vulnerability patched.' },
            { text: 'Public attribution and sanctions', effects: { iranAggression: 3, internationalStanding: 8, diplomaticCapital: 5 }, flavor: 'You name and shame APT33 operators. Sanctions on IRGC Cyber Command. Allies express solidarity.' },
        ],
    },
    {
        id: 'second_carrier', title: 'SECOND CARRIER DEPLOYMENT',
        description: 'CENTCOM requests deployment of a second carrier strike group — USS Gerald R. Ford. It would be the largest naval buildup since 2003. The signal is unmistakable.',
        image: 'assets/event-e09-carrier-incident.png',
        minDay: 15, maxDay: 55,
        condition: () => SIM.carrier !== null && SIM.tension > 50,
        choices: [
            { text: 'Deploy the Ford — show maximum force', effects: { tension: 12, iranAggression: -15, oilFlow: 8, budget: -60, domesticApproval: 8, warPath: 1 }, flavor: 'Two carrier strike groups in the Gulf. Iran\'s navy stays in port. The world hasn\'t seen this since Iraq.' },
            { text: 'Position Ford in Arabian Sea (standoff)', effects: { tension: 5, iranAggression: -8, budget: -30 }, flavor: 'Close enough to matter, far enough to avoid provocation. A balanced signal.' },
            { text: 'Deny the request — one carrier is enough', effects: { domesticApproval: -3, budget: 10 }, flavor: 'CENTCOM is unhappy but complies. The Ford stays in the Mediterranean.' },
        ],
    },
    {
        id: 'truth_social_armada', title: '"MASSIVE ARMADA HEADING TO IRAN"',
        description: 'The President posts on Truth Social: "A massive Armada is heading to Iran. They will learn!" The post has 50 million views. Iran\'s Supreme Leader responds within the hour.',
        image: 'assets/event-military.png',
        minDay: 5, maxDay: 40,
        condition: () => SIM.tension > 30,
        choices: [
            { text: 'Double down — back it with action', effects: { tension: 15, iranAggression: -10, domesticApproval: 12, warPath: 1, internationalStanding: -8 }, flavor: 'You mobilize visibly. Iran calls it bluffing until the first carrier arrives. Then they go quiet.' },
            { text: 'Walk it back through spokespersons', effects: { tension: -3, domesticApproval: -5, iranAggression: 3 }, flavor: '"The President was speaking metaphorically." Nobody buys it. Iran smells weakness.' },
            { text: 'Use the chaos as cover for diplomacy', effects: { tension: 3, diplomaticCapital: 8, domesticApproval: 3 }, flavor: 'While the world watches the tweet storm, back-channel talks advance quietly.' },
        ],
    },
    {
        id: 'iran_internal_struggle', title: 'IRANIAN MODERATES VS IRGC', image: 'assets/iran-tangsiri.png',
        description: 'Iran\'s civilian government and IRGC are openly clashing. The Foreign Ministry wants negotiations. The IRGC is planning more seizures. Your intel shows the split is real.',
        image: 'assets/event-e07-iran-doubles.png',
        minDay: 18, maxDay: 70,
        condition: () => SIM.fogOfWar < 50 && SIM.iranEconomy < 45,
        choices: [
            { text: 'Covert support for moderates', effects: { iranAggression: -15, tension: -8, diplomaticCapital: -10, fogOfWar: 8 }, flavor: 'Quiet channels funnel support. The moderates gain ground in internal debates. IRGC funding gets questioned.' },
            { text: 'Tighten sanctions — squeeze both sides', effects: { iranEconomy: -8, iranAggression: 8, tension: 5, chinaRelations: -3 }, flavor: 'Maximum pressure doesn\'t discriminate. The moderates are weakened along with the IRGC.' },
            { text: 'Public overture to moderates', effects: { iranAggression: 5, internationalStanding: 5, domesticApproval: -3 }, flavor: 'Your public endorsement backfires. Moderates are labeled American puppets. IRGC hardens.' },
        ],
    },
    {
        id: 'fast_boat_swarm', title: 'IRGC FAST BOAT SWARM',
        description: 'TWENTY-FIVE Heydar-class fast boats — the fastest combat boats on earth at 110 knots — are converging on a tanker convoy. This is Iran\'s signature tactic: overwhelm with speed and numbers.',
        image: 'assets/event-crisis-three-seizures.png',
        minDay: 8, maxDay: 70,
        countdown: 8,
        condition: () => SIM.iranBoats.length > 2 && SIM.iranAggression > 45,
        choices: [
            { text: 'Weapons free — engage the swarm', effects: { tension: 25, warPath: 2, iranAggression: -15, domesticApproval: 10, internationalStanding: -8 }, flavor: 'Phalanx CIWS and .50 cal fire. Eight boats destroyed. The rest scatter. First naval combat since 1988.' },
            { text: 'Warning shots and countermeasures', effects: { tension: 15, iranAggression: -5, domesticApproval: 5 }, flavor: 'Flares, warning shots, and acoustic devices. The swarm breaks off. For now.' },
            { text: 'Evasive maneuvers — protect the convoy', effects: { tension: 8, oilFlow: -5, domesticApproval: -3 }, flavor: 'The convoy scatters. One tanker is boarded. "Why didn\'t we shoot?" headlines dominate.' },
        ],
    },
    {
        id: 'hezbollah_front', title: 'HEZBOLLAH OPENS SECOND FRONT',
        description: 'Hezbollah launches missiles and drones into northern Israel from Lebanon. Iran\'s proxy war is expanding beyond the Gulf. Israel demands US support.',
        image: 'assets/event-e14-houthi.png',
        minDay: 20, maxDay: 75,
        condition: () => SIM.proxyThreat > 35 && SIM.tension > 45,
        choices: [
            { text: 'Support Israel — provide intel and munitions', effects: { tension: 10, proxyThreat: -10, internationalStanding: -8, domesticApproval: 5, budget: -30 }, flavor: 'US munitions flow to Israel. Hezbollah positions are degraded. But the US is now fighting on two fronts.' },
            { text: 'Call for ceasefire through UN', effects: { tension: -5, internationalStanding: 10, diplomaticCapital: 8, proxyThreat: 3 }, flavor: 'The UN resolution passes. Hezbollah pauses. But everyone knows it\'s temporary.' },
            { text: 'Stay out — this is Israel\'s fight', effects: { internationalStanding: -5, domesticApproval: -3, proxyThreat: 5 }, flavor: 'Israel is disappointed but capable. The conflict expands without direct US involvement.' },
        ],
    },
    {
        id: 'cape_route_crisis', title: 'CAPE OF GOOD HOPE BOTTLENECK',
        description: 'With the strait effectively closed, 150+ tankers are rerouting via the Cape of Good Hope — adding 11,000 nautical miles, 10 days, and $1M fuel per voyage. Ports in South Africa are overwhelmed.',
        image: 'assets/event-economic.png',
        minDay: 12, maxDay: 55,
        condition: () => SIM.oilFlow < 45,
        choices: [
            { text: 'Subsidize rerouting costs', effects: { budget: -50, oilFlow: 8, oilPrice: -5, domesticApproval: 3 }, flavor: 'Government subsidies keep tankers moving. It\'s expensive but it works.' },
            { text: 'Demand strait reopening as red line', effects: { tension: 10, iranAggression: -5, oilFlow: 3, warPath: 1 }, flavor: 'A formal ultimatum. Iran has 72 hours to guarantee safe passage. The clock ticks.' },
            { text: 'Accept the new normal', effects: { oilPrice: 8, domesticApproval: -5, internationalStanding: -3 }, flavor: 'Markets price in the permanent disruption. The "new Suez" route becomes standard. Costs cascade through the global economy.' },
        ],
    },
    // --- NEW EVENTS: Based on real March 2026 Iran war developments ---
    {
        id: 'minab_school_strike', title: 'MINAB SCHOOL STRIKE',
        description: 'Reports emerge of a US airstrike hitting a school in Minab, southern Iran. 47 civilians reported killed including children. Iran broadcasting footage globally. UN demands investigation.',
        image: 'assets/event-crisis-friendly-fire.png',
        minDay: 3, maxDay: 30,
        condition: () => SIM.warPath >= 2,
        choices: [
            { text: 'Express regret — open investigation', effects: { internationalStanding: 5, domesticApproval: -5, tension: -3, iranAggression: -3 }, flavor: 'You acknowledge the tragedy. The investigation finds mixed-use targeting. International pressure eases slightly.' },
            { text: 'Deny — claim it was a military site', effects: { internationalStanding: -10, domesticApproval: 3, tension: 5, iranAggression: 5 }, flavor: 'Pentagon releases grainy satellite photos. Nobody is convinced. Global protests erupt.' },
            { text: 'Pause air operations for review', effects: { domesticApproval: -8, tension: -10, iranAggression: 8, internationalStanding: 8, warPath: -1 }, flavor: 'A 72-hour pause. Hawks scream. Allies exhale. Iran uses the time to reposition forces.' },
        ],
    },
    {
        id: 'mojtaba_succession', title: 'SUPREME LEADER SUCCESSION CRISIS', image: 'assets/iran-mojtaba.png',
        description: 'With Khamenei dead, his son Mojtaba is consolidating power with IRGC backing. But the Assembly of Experts is divided. Iran\'s internal chaos creates both danger and opportunity.',
        image: 'assets/event-mojtaba.png',
        minDay: 5, maxDay: 45,
        condition: () => SIM.iranAggression > 40,
        choices: [
            { text: 'Covert ops to empower moderates', effects: { iranAggression: -12, tension: -5, fogOfWar: 8, diplomaticCapital: -8 },
              setFlags: { mojtaba_watched: true }, chainEvent: 'mojtaba_power_play', chainDelay: 5,
              chainHint: 'Your intelligence assets in Tehran will report back...',
              flavor: 'CIA channels support Raisi-faction moderates. The succession battle intensifies. IRGC is distracted.' },
            { text: 'Publicly demand democratic transition', effects: { internationalStanding: 8, domesticApproval: 5, iranAggression: 10, tension: 5 },
              flavor: 'Your call for democracy rallies Western opinion but unites Iranian factions against external meddling.' },
            { text: 'Exploit the chaos — escalate strikes', effects: { tension: 15, warPath: 1, iranAggression: -10, domesticApproval: 3, internationalStanding: -10 },
              flavor: 'You hit command centers while leadership is in disarray. Effective but brutal. The world recoils.' },
        ],
    },
    {
        id: 'joe_kent_resignation', title: 'NSA KENT RESIGNS',
        description: 'National Security Advisor Joe Kent has resigned, citing disagreements over escalation. He goes on Fox News within the hour. "The President is being misled by hawks who\'ve never seen combat."',
        image: 'assets/event-diplomatic.png',
        minDay: 10, maxDay: 50,
        condition: () => SIM.warPath >= 2 && SIM.domesticApproval < 65,
        choices: [
            { text: 'Attack Kent publicly', effects: { domesticApproval: -5, polarization: 8, tension: 3 }, flavor: 'A public feud dominates the news cycle. Your war cabinet looks fractured.' },
            { text: 'Replace quietly — project unity', effects: { domesticApproval: 3, polarization: -3 }, flavor: 'The new NSA takes over smoothly. But Kent\'s book deal is already signed.' },
            { text: 'Reach out — bring him back with concessions', effects: { domesticApproval: 5, tension: -5, warPath: -1, polarization: -5 }, flavor: 'Kent returns with a mandate for restraint. Hawks are furious but the team is reunited.' },
        ],
    },
    {
        id: 'gcc_attacks', title: 'GCC BASES UNDER FIRE',
        description: 'Iran launches ballistic missiles at Al Udeid (Qatar) and Al Dhafra (UAE). Both house US forces. Patriot batteries intercept most but three impact inside Al Udeid. 8 US casualties.',
        image: 'assets/event-crisis-carrier-hit.png',
        minDay: 5, maxDay: 40,
        condition: () => SIM.tension > 60 && SIM.iranAggression > 55,
        choices: [
            { text: 'Massive retaliation — hit IRGC bases', effects: { tension: 20, warPath: 2, iranAggression: -15, domesticApproval: 12, internationalStanding: -5, budget: -40 }, flavor: 'B-2s and Tomahawks devastate IRGC coastal bases. Iran\'s ability to project force is degraded. But the war deepens.' },
            { text: 'Proportional response — missile batteries only', effects: { tension: 10, warPath: 1, iranAggression: -8, domesticApproval: 8, internationalStanding: 3 }, flavor: 'Precision strikes eliminate the launch sites. Measured but firm. Allies approve.' },
            { text: 'Evacuate non-essential personnel', effects: { tension: -5, domesticApproval: -8, iranAggression: 5, internationalStanding: -5 }, flavor: 'You pull back from exposed positions. Critics call it retreat. Families of the fallen demand action.' },
        ],
    },
    {
        id: 'iris_dena_aftermath', title: 'IRIS DENA SINKING — AFTERMATH',
        description: 'The sinking of the IRIS Dena — Iran\'s largest warship — has become a rallying cry in Tehran. Massive funeral processions. IRGC vows "rivers of fire." But their navy just lost its flagship.',
        image: 'assets/event-military.png',
        minDay: 4, maxDay: 25,
        condition: () => SIM.iranAggression > 50,
        choices: [
            { text: 'Press the advantage — hit more ships', effects: { tension: 20, warPath: 1, iranAggression: -15, domesticApproval: 5, internationalStanding: -10 }, flavor: 'Three more Iranian vessels sunk. Their navy is broken. But the world sees a superpower bullying a regional power.' },
            { text: 'Offer humanitarian aid to survivors', effects: { internationalStanding: 10, tension: -5, iranAggression: -5, domesticApproval: 3 }, flavor: 'US Navy rescues 47 Iranian sailors. The footage is powerful. A rare moment of humanity in the crisis.' },
            { text: 'Use as leverage — demand negotiations', effects: { tension: -3, diplomaticCapital: 10, iranAggression: -3, domesticApproval: 5 }, flavor: '"We don\'t want to destroy your navy. We want to open the strait." The message resonates with Iranian moderates.' },
        ],
    },
    {
        id: 'three_carriers', title: 'THREE CARRIER GROUPS IN THEATER',
        description: 'Lincoln, Truman, and Carl Vinson are all in the Arabian Sea. 200+ aircraft, 30 warships, 25,000 sailors. The largest US naval deployment since Iraq 2003. The world is watching.',
        image: 'assets/event-crisis-carrier-hit.png',
        minDay: 3, maxDay: 35,
        condition: () => SIM.carrier !== null && SIM.tension > 50,
        choices: [
            { text: 'Launch sustained air campaign', effects: { tension: 25, warPath: 2, iranAggression: -20, domesticApproval: 8, internationalStanding: -12, budget: -80 }, flavor: 'Operation Southern Watch II begins. 200 sorties per day. Iran\'s military infrastructure is systematically degraded.' },
            { text: 'Maintain pressure — deterrence posture', effects: { tension: 5, iranAggression: -10, domesticApproval: 5, budget: -40 }, flavor: 'The carriers patrol. Iran\'s navy stays in port. The mere presence changes the calculus.' },
            { text: 'Withdraw one carrier — signal restraint', effects: { tension: -8, domesticApproval: -3, iranAggression: 3, internationalStanding: 5, budget: 20 }, flavor: 'Vinson returns to the Pacific. A signal that you\'re not seeking war. Allies approve. Iran is uncertain.' },
        ],
    },
    {
        id: 'china_mediation_real', title: 'BEIJING CEASEFIRE PROPOSAL',
        description: 'Chinese FM Wang Yi proposes a 5-point ceasefire framework: mutual de-escalation, UN peacekeepers in strait, sanctions relief timeline, nuclear talks restart, regional security forum. Beijing is serious.',
        image: 'assets/event-e13-china.png',
        minDay: 10, maxDay: 55,
        condition: () => SIM.chinaRelations > 20 && SIM.tension > 40,
        choices: [
            { text: 'Accept the framework as starting point', effects: { tension: -15, iranAggression: -10, chinaRelations: 15, domesticApproval: -8, internationalStanding: 10, diplomaticCapital: 15 }, flavor: 'Talks begin in Beijing. Hawks rage about "selling out to China." But the guns go quiet for the first time in weeks.' },
            { text: 'Counter-propose (US-led framework)', effects: { tension: -5, chinaRelations: -5, diplomaticCapital: -8, internationalStanding: 5 }, flavor: 'You reject Chinese mediation but propose your own plan. Beijing is annoyed but the diplomatic track opens.' },
            { text: 'Reject — China is not a neutral broker', effects: { chinaRelations: -15, domesticApproval: 8, tension: 5, iranAggression: 3 }, flavor: 'Hawks applaud. China retaliates with arms sales to Iran. The diplomatic window narrows.' },
        ],
    },
    {
        id: 'russia_intel_leak', title: 'RUSSIAN INTELLIGENCE LEAK',
        description: 'An FSB defector reveals Russia has been sharing US military intelligence with Iran — satellite passes, carrier positions, submarine locations. Your operational security is compromised.',
        image: 'assets/event-intel.png',
        minDay: 12, maxDay: 60,
        condition: () => SIM.chinaRelations < 35,
        choices: [
            { text: 'Expel Russian diplomats', effects: { chinaRelations: -20, fogOfWar: -10, tension: 5, internationalStanding: 5 }, flavor: '15 diplomats expelled. NATO allies follow suit. Russia retaliates but the leak is plugged.' },
            { text: 'Exploit the defector — feed disinformation', effects: { fogOfWar: -20, iranAggression: -5, chinaRelations: -5 }, flavor: 'You turn the leak into an advantage. False intelligence flows to Tehran through Moscow. Iran chases ghosts.' },
            { text: 'Quiet protest — preserve the channel', effects: { chinaRelations: -5, fogOfWar: -5 }, flavor: 'A stern demarche. Russia denies everything. But the intelligence sharing slows.' },
        ],
    },
    {
        id: 'nowruz_ceasefire', title: 'NOWRUZ CEASEFIRE WINDOW',
        description: 'Iranian New Year (Nowruz) is in 3 days. Iranian moderates propose a 5-day ceasefire for the holiday. IRGC hasn\'t objected. This could be the off-ramp.',
        image: 'assets/event-ceasefire-test.png',
        minDay: 18, maxDay: 35,
        condition: () => SIM.tension > 30 && SIM.diplomaticCapital > 10,
        choices: [
            { text: 'Accept — extend to 10 days', effects: { tension: -20, iranAggression: -12, domesticApproval: -5, internationalStanding: 15, diplomaticCapital: 20 }, flavor: 'Both sides stand down. Tankers transit. The ceasefire holds. Diplomats work feverishly to make it permanent.' },
            { text: 'Accept 5 days only', effects: { tension: -12, iranAggression: -5, internationalStanding: 8, diplomaticCapital: 10 }, flavor: 'A brief respite. Oil flows. Markets rally. But everyone knows the clock is ticking.' },
            { text: 'Reject — no pause while tankers are held', effects: { tension: 5, domesticApproval: 5, iranAggression: 5, internationalStanding: -5 }, flavor: 'You demand tanker release as precondition. Iran calls you unreasonable. The fighting continues through Nowruz.' },
        ],
    },
    {
        id: 'hezbollah_ceasefire_break', title: 'HEZBOLLAH BREAKS CEASEFIRE',
        image: 'assets/event-e14-houthi.png',
        description: 'Hezbollah launches 150 rockets into northern Israel, breaking the Lebanon ceasefire. Israel retaliates immediately. Iran\'s proxy network is activating across the region.',
        minDay: 8, maxDay: 55,
        condition: () => SIM.proxyThreat > 30 && SIM.tension > 40,
        choices: [
            { text: 'Support Israel — joint strikes on Hezbollah', effects: { proxyThreat: -15, tension: 12, warPath: 1, internationalStanding: -8, budget: -25 }, flavor: 'US and Israeli jets hit Hezbollah positions. The proxy front collapses. But you\'re now fighting a multi-front war.' },
            { text: 'Demand ceasefire restoration through UN', effects: { proxyThreat: -5, tension: -3, internationalStanding: 8, diplomaticCapital: 5 }, flavor: 'French-led mediation produces a fragile truce. Hezbollah pulls back. For now.' },
            { text: 'Focus on strait — Israel can handle it', effects: { proxyThreat: 5, internationalStanding: -5, domesticApproval: -3 }, flavor: 'You keep your eyes on the prize. Israel is capable. But the multi-front pressure on Iran lessens.' },
        ],
    },
    {
        id: 'houthi_escalation', title: 'HOUTHIS TARGET US WARSHIP',
        description: 'Houthi anti-ship ballistic missile targets USS Gravely (DDG-107) in the Red Sea. SM-2 intercept at 8nm. The closest a Houthi missile has come to hitting a US warship.',
        image: 'assets/event-e14-houthi.png',
        minDay: 6, maxDay: 50,
        condition: () => SIM.proxyThreat > 25,
        choices: [
            { text: 'Massive strike on Houthi infrastructure', effects: { proxyThreat: -20, tension: 8, warPath: 1, budget: -30, domesticApproval: 8 }, flavor: 'B-2s flatten Houthi missile storage. The Red Sea calms. Yemen civilians pay the price.' },
            { text: 'Tighten the naval screen', effects: { proxyThreat: -8, budget: -15, domesticApproval: 3 }, flavor: 'More AEGIS destroyers deployed. An expensive but defensive solution.' },
            { text: 'Pressure Saudi to negotiate with Houthis', effects: { proxyThreat: -5, tension: -3, internationalStanding: 5, diplomaticCapital: -5 }, flavor: 'Riyadh reopens the Yemen peace track. Slow but addresses root causes.' },
        ],
    },
    {
        id: 'kc135_crash', title: 'KC-135 CRASH — COMBAT LOSSES MOUNT',
        description: 'A KC-135 aerial refueling tanker crashes during combat operations, killing all 3 crew. It\'s the first US aircraft loss. Cable news shows the wreckage on loop.',
        image: 'assets/event-military.png',
        minDay: 4, maxDay: 35,
        condition: () => SIM.warPath >= 2,
        choices: [
            { text: 'Honor the fallen — steel resolve', effects: { domesticApproval: 5, tension: 3, polarization: -3 }, flavor: 'A solemn ceremony at Dover. The nation mourns but rallies. "Their sacrifice will not be in vain."' },
            { text: 'Review operations — reduce tempo', effects: { domesticApproval: -3, tension: -5, iranAggression: 3, warPath: -1 }, flavor: 'Sortie rates drop 40%. Safety improves. Hawks worry about losing momentum.' },
            { text: 'Escalate — make their sacrifice count', effects: { domesticApproval: 3, tension: 10, warPath: 1, internationalStanding: -5 }, flavor: 'The loss fuels a surge. More targets struck. The cycle accelerates.' },
        ],
    },
    {
        id: 'war_crimes_tribunal', title: 'ICC WAR CRIMES INVESTIGATION',
        description: 'The International Criminal Court announces an investigation into both US and Iranian conduct. Warrants could be issued for senior officials. European allies are divided.',
        image: 'assets/event-diplomatic.png',
        minDay: 15, maxDay: 65,
        condition: () => SIM.warPath >= 2 && SIM.internationalStanding < 50,
        choices: [
            { text: 'Reject ICC jurisdiction — sanction the court', effects: { internationalStanding: -12, domesticApproval: 8, polarization: 5 }, flavor: 'America First crowd loves it. Europeans are horrified. The legal threat remains for allied officials.' },
            { text: 'Cooperate partially — show good faith', effects: { internationalStanding: 8, domesticApproval: -5, tension: -3 }, flavor: 'You provide limited documentation. It buys goodwill. The investigation slows.' },
            { text: 'Use it as leverage against Iran', effects: { internationalStanding: 5, iranAggression: -5, diplomaticCapital: 5 }, flavor: 'You frame it as mutual accountability. Iran\'s crimes are documented alongside yours. A diplomatic tool emerges.' },
        ],
    },
    // === NEW EVENTS: Post-strikes escalation scenarios ===
    {
        id: 'mojtaba_consolidation', title: 'MOJTABA KHAMENEI POWER GRAB', image: 'assets/iran-mojtaba.png',
        description: 'Intelligence confirms Mojtaba Khamenei — the dead Supreme Leader\'s son — has consolidated IRGC support. He\'s demanding revenge strikes and threatening to close the strait permanently.',
        image: 'assets/event-mojtaba.png',
        minDay: 5, maxDay: 30,
        condition: () => SIM.iranAggression > 40,
        choices: [
            { text: 'Offer to recognize new leadership in exchange for de-escalation', effects: { tension: -10, iranAggression: -8, domesticApproval: -10, diplomaticCapital: 10 }, flavor: 'A bitter pill. Recognizing Khamenei\'s son feels like losing. But the back-channel opens.' },
            { text: 'Target Mojtaba with a kill order', effects: { tension: 20, iranAggression: 15, warPath: 2, domesticApproval: 5 }, flavor: 'Decapitation strike 2.0. If you miss, it\'s war. If you hit, there\'s nobody left to negotiate with.' },
            { text: 'Ignore him — focus on the military threat', effects: { iranAggression: 5, fogOfWar: 5 }, flavor: 'You treat the political question as irrelevant. The IRGC reads this as weakness.' },
        ],
    },
    {
        id: 'iris_dena_aftermath', title: 'IRIS DENA WRECKAGE',
        description: 'The Iranian frigate IRIS Dena was sunk on Day 1. Now bodies and wreckage are washing up on Omani beaches. Al Jazeera is broadcasting it live. International pressure mounts.',
        image: 'assets/event-military.png',
        minDay: 3, maxDay: 15,
        condition: () => SIM.internationalStanding < 60,
        choices: [
            { text: 'Express regret — offer humanitarian assistance', effects: { internationalStanding: 10, domesticApproval: -5, iranAggression: -3 }, flavor: 'A rare gesture of humanity in wartime. Some call it weakness. Others call it leadership.' },
            { text: 'Blame Iran for putting sailors in harm\'s way', effects: { internationalStanding: -5, domesticApproval: 5, tension: 3 }, flavor: 'The messaging works at home. Internationally, it falls flat.' },
            { text: 'No comment — focus on operations', effects: { internationalStanding: -3 }, flavor: 'The silence speaks volumes. The story dominates for 48 hours.' },
        ],
    },
    {
        id: 'al_udeid_attack', title: 'AL UDEID BASE UNDER FIRE',
        description: 'Iranian ballistic missiles hit Al Udeid Air Base in Qatar — the forward HQ of CENTCOM. 3 US personnel killed, 22 wounded. Qatar is demanding you relocate operations.',
        image: 'assets/event-crisis-carrier-hit.png',
        minDay: 4, maxDay: 25,
        condition: () => SIM.tension > 50,
        choices: [
            { text: 'Retaliatory strike on launch site', effects: { tension: 15, iranAggression: -10, warPath: 1, domesticApproval: 8 }, flavor: 'Tomahawks fly within 20 minutes. The base is avenged. But the escalation ladder climbs.' },
            { text: 'Relocate to Al Dhafra (UAE)', effects: { budget: -50, tension: -3, internationalStanding: 3 }, flavor: 'Expensive but pragmatic. UAE welcomes the business. Qatar is relieved.' },
            { text: 'Harden defenses and stay', effects: { budget: -30, domesticApproval: -3 }, flavor: 'THAAD batteries deployed. The troops feel exposed. Morale drops.' },
        ],
    },
    {
        id: 'indian_energy_crisis', title: 'INDIA ENERGY EMERGENCY',
        description: 'India declares a national energy emergency. They import 80% of their oil through the Strait. PM Modi is calling — demanding action or they will negotiate directly with Iran.',
        image: 'assets/event-crisis-cascade.png',
        minDay: 10, maxDay: 50,
        condition: () => SIM.oilFlow < 50,
        choices: [
            { text: 'Promise priority escort for Indian tankers', effects: { oilFlow: 5, internationalStanding: 8, budget: -15 }, flavor: 'Indian-flagged tankers get USN escorts. Modi is grateful. Other nations want the same deal.' },
            { text: 'Support India-Iran bilateral talks', effects: { tension: -5, domesticApproval: -5, iranAggression: -3, internationalStanding: 5 }, flavor: 'India opens a line to Tehran. Hawks accuse you of outsourcing diplomacy.' },
            { text: 'Tell India to wait', effects: { internationalStanding: -8, oilFlow: -3 }, flavor: 'Modi goes public with his frustration. India begins rationing. Blame falls on you.' },
        ],
    },
    {
        id: 'carrier_near_miss', title: 'USS EISENHOWER NEAR MISS',
        description: 'An Iranian anti-ship ballistic missile splashes 200 meters from the USS Eisenhower. The closest a hostile weapon has come to a US carrier since WWII. The crew is shaken.',
        image: 'assets/event-e09-carrier-incident.png',
        minDay: 8, maxDay: 40,
        condition: () => SIM.tension > 55 && SIM.iranAggression > 45,
        choices: [
            { text: 'Destroy Iran\'s coastal missile batteries', effects: { tension: 20, iranAggression: -15, warPath: 2, domesticApproval: 10, budget: -40 }, flavor: 'Operation Burning Light. 48 cruise missiles eliminate Iran\'s anti-ship capability. The carrier group is safe. For now.' },
            { text: 'Pull the carrier back to the Gulf of Oman', effects: { tension: -8, domesticApproval: -8, iranAggression: 8 }, flavor: 'Retreat. The IRGC celebrates. Your Navy commanders are furious.' },
            { text: 'Stay on station — increase air defense posture', effects: { budget: -20, tension: 5 }, flavor: 'Aegis systems go to maximum alert. The next shot might not miss.' },
        ],
    },
    {
        id: 'iran_moderate_coup', title: 'MODERATE FACTION REACHES OUT',
        description: 'An encrypted message through Swiss channels: Iran\'s moderate faction is planning to sideline the IRGC hardliners. They need 72 hours — and a gesture of good faith.',
        image: 'assets/event-diplomatic.png',
        minDay: 18, maxDay: 60,
        condition: () => SIM.diplomaticCapital > 30 && SIM.iranAggression > 35,
        choices: [
            { text: 'Pause operations for 72 hours', effects: { tension: -15, iranAggression: -12, domesticApproval: -8, diplomaticCapital: 10 }, flavor: 'Radio silence. The moderate faction moves. Three IRGC commanders are placed under house arrest. A breakthrough.' },
            { text: 'Give them intel on hardliner positions', effects: { tension: -8, iranAggression: -8, fogOfWar: -10, warPath: 1 }, flavor: 'Sharing intelligence with a foreign faction. If this leaks, it\'s an international scandal. But it works.' },
            { text: 'This is a trap — intensify operations', effects: { tension: 10, iranAggression: 10, domesticApproval: 3 }, flavor: 'You don\'t trust it. Operations continue. The moderate window closes.' },
        ],
    },
    {
        id: 'kc135_crew_rescue', title: 'DOWNED KC-135 CREW',
        description: 'The KC-135 tanker shot down on Day 1 — search teams have located 2 surviving crew members on an Iranian island. IRGC is closing in.',
        image: 'assets/event-rescue-op.png',
        minDay: 3, maxDay: 12,
        condition: () => true,
        choices: [
            { text: 'SEAL team rescue — extract at all costs', effects: { tension: 12, domesticApproval: 15, warPath: 1, budget: -20 }, flavor: 'Spec ops infiltrate under cover of darkness. Both Americans rescued alive. The nation rallies.' },
            { text: 'Negotiate through Oman', effects: { tension: -3, domesticApproval: -5, diplomaticCapital: -5 }, flavor: 'Slow, agonizing negotiations. The crew becomes a bargaining chip. Families go on CNN.' },
            { text: 'Deny the crew exists — classify everything', effects: { domesticApproval: -10, fogOfWar: -5, polarization: 5 }, flavor: 'The cover-up doesn\'t hold. When the truth emerges, the fallout is devastating.' },
        ],
    },
    {
        id: 'european_split', title: 'NATO FRACTURES',
        description: 'France breaks with the US — Macron calls the Iran strikes "disproportionate" and blocks NATO solidarity statement. Germany is wavering. The UK stands with you — for now.',
        image: 'assets/event-diplomatic.png',
        minDay: 7, maxDay: 35,
        condition: () => SIM.internationalStanding < 55,
        choices: [
            { text: 'Bilateral with the UK — bypass NATO', effects: { internationalStanding: -8, domesticApproval: 5, diplomaticCapital: -5 }, flavor: 'The "special relationship" holds. But NATO is weaker than it\'s been since Suez.' },
            { text: 'Offer Europe a seat at the negotiating table', effects: { internationalStanding: 10, tension: -5, domesticApproval: -3 }, flavor: 'Macron gets his summit. NATO cohesion is preserved. The diplomatic path opens wider.' },
            { text: 'Publicly shame France', effects: { domesticApproval: 8, internationalStanding: -12, polarization: 3 }, flavor: '"Freedom fries" is trending. The base loves it. Diplomats are horrified.' },
        ],
    },
    // ======================== CHAIN FOLLOW-UP EVENTS ========================
    // These events are scheduled by choices in parent events via chainEvent/chainDelay.
    // They have minDay/maxDay set wide — they only fire when explicitly scheduled.

    // --- BACK-CHANNEL CHAIN (follows secret_talks) ---
    {
        id: 'backchannel_progress', title: 'BACK-CHANNEL UPDATE',
        description: 'Your Omani intermediary reports back. The Iranian delegation showed up — a significant signal. They presented a list of demands: sanctions relief on medical supplies, return of frozen assets, and a public statement acknowledging Iranian sovereignty. In exchange, they offer a 48-hour shipping ceasefire and the release of 4 detained crew members.',
        image: 'assets/event-placeholder.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.backchannel_accepted,
        choices: [
            { text: 'Accept the ceasefire deal', effects: { tension: -15, iranAggression: -10, oilFlow: 8, domesticApproval: -5, diplomaticCapital: 10 },
              setFlags: { ceasefire_accepted: true }, chainEvent: 'backchannel_ceasefire_test', chainDelay: 3,
              chainHint: 'The ceasefire will be tested in the coming days...',
              flavor: 'Both sides stand down. For the first time in weeks, the strait is quiet. But hawks on both sides are furious.' },
            { text: 'Counter-offer: ceasefire first, then talks', effects: { tension: -5, diplomaticCapital: 5, iranAggression: 2 },
              setFlags: { backchannel_counteroffered: true }, chainEvent: 'backchannel_counteroffer_response', chainDelay: 4,
              chainHint: 'Iran is deliberating your counter-proposal...',
              flavor: 'A reasonable position. The Omanis carry it back. Now you wait.' },
            { text: 'Reject — these terms are weakness', effects: { tension: 5, domesticApproval: 5, iranAggression: 5, diplomaticCapital: -8 },
              setFlags: { backchannel_collapsed: true },
              flavor: 'The channel goes dark. Iran\'s moderates lose face. The hardliners say "we told you so."' },
        ],
    },
    {
        id: 'backchannel_ceasefire_test', title: 'CEASEFIRE UNDER PRESSURE',
        description: 'Day two of the ceasefire. IRGC fast boats are still patrolling — technically not a violation, but provocative. Then: an IRGC commander\'s nephew is caught planting a limpet mine on a Kuwaiti-flagged tanker. Iran claims he acted alone. Your military advisors want to respond. The Omani mediator begs you not to.',
        image: 'assets/event-placeholder.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.ceasefire_accepted,
        choices: [
            { text: 'Hold the ceasefire — accept Iran\'s explanation', effects: { tension: -8, domesticApproval: -8, internationalStanding: 5, iranAggression: -5, diplomaticCapital: 8 },
              setFlags: { ceasefire_held: true },
              flavor: 'You absorb the political cost. But the ceasefire holds. Oil begins to flow. The Omanis call it "a brave choice."' },
            { text: 'Demand Iran arrest the commander publicly', effects: { tension: 5, diplomaticCapital: -5, iranAggression: 3 },
              setFlags: { ceasefire_strained: true },
              flavor: 'Iran refuses. The ceasefire technically holds but trust is damaged. Both sides are watching for the next provocation.' },
            { text: 'Strike the IRGC base — ceasefire is over', effects: { tension: 20, warPath: 1, domesticApproval: 5, iranAggression: 15, diplomaticCapital: -15 },
              setFlags: { ceasefire_broken: true },
              flavor: 'Tomahawks hit Bandar Abbas. The ceasefire is dead. Iran\'s moderates are silenced for a generation.' },
        ],
    },
    {
        id: 'backchannel_counteroffer_response', title: 'IRAN\'S RESPONSE',
        description: 'The Omani intermediary returns. Iran\'s counter-counter-proposal: they\'ll reduce IRGC patrols by 50% for 72 hours as a "gesture of goodwill," but no formal ceasefire. They want reciprocity — pull one carrier group back to show good faith. The moderates are sticking their necks out. This is their last offer.',
        image: 'assets/event-placeholder.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.backchannel_counteroffered,
        choices: [
            { text: 'Accept — pull a carrier back', effects: { tension: -12, iranAggression: -8, internationalStanding: 3, domesticApproval: -6 },
              setFlags: { carrier_pullback: true },
              flavor: 'USS Truman moves to the Arabian Sea. IRGC boats thin out. A fragile de-escalation begins.' },
            { text: 'Agree to patrol reduction but keep carriers', effects: { tension: -5, iranAggression: -3, diplomaticCapital: 3 },
              flavor: 'A half-measure that satisfies neither side fully. But the shooting stops, for now.' },
            { text: 'Reject — Iran must concede first', effects: { tension: 8, iranAggression: 8, diplomaticCapital: -10 },
              setFlags: { backchannel_dead: true },
              flavor: 'The channel collapses. The Omani ambassador says "we tried." Iran\'s moderates won\'t recover from this.' },
        ],
    },

    // --- HOSTAGE CHAIN (follows hostage event) ---
    {
        id: 'hostage_situation_escalates', title: 'HOSTAGE CRISIS DEEPENS',
        description: 'Three of the 12 detained crew members appear on Iranian state TV, reading prepared statements calling for America to "stop its aggression." Intelligence suggests they\'re being held at Evin Prison, not a military facility — a signal Iran wants to negotiate. The families are on CNN demanding action. A retired admiral is calling for a rescue operation on Fox News.',
        image: 'assets/event-placeholder.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.hostage_negotiating,
        choices: [
            { text: 'Send a private envoy to Tehran', effects: { tension: -5, diplomaticCapital: -8, domesticApproval: -3, iranAggression: -3 },
              setFlags: { envoy_sent: true }, chainEvent: 'hostage_envoy_result', chainDelay: 5,
              chainHint: 'The envoy will reach Tehran in a few days...',
              flavor: 'A former diplomat boards a flight to Muscat, then Tehran. Total media blackout. If this leaks, it\'s a political disaster.' },
            { text: 'Authorize a rescue operation', effects: { tension: 15, warPath: 1, domesticApproval: 8, iranAggression: 10 },
              setFlags: { rescue_attempted: true }, chainEvent: 'hostage_rescue_result', chainDelay: 2,
              chainHint: 'SEAL Team 6 is spinning up...',
              flavor: 'Delta Force operators begin mission planning. The risk is enormous. If it fails, you own it.' },
            { text: 'Impose personal sanctions on IRGC commanders', effects: { tension: 3, domesticApproval: 3, iranAggression: 3, internationalStanding: 2 },
              flavor: 'A measured response that satisfies nobody fully. The families are disappointed. Iran is unmoved.' },
        ],
    },
    {
        id: 'hostage_envoy_result', title: 'THE ENVOY REPORTS',
        description: 'Your envoy spent 72 hours in Tehran. The news is mixed. Iran will release 8 of the 12 crew — but they\'re keeping 4 "for investigation into espionage." The price: unfreeze $2 billion in Iranian assets and issue a joint statement about "mutual respect for maritime sovereignty." The envoy says the moderates were sincere but scared. The IRGC was listening to every word.',
        image: 'assets/event-placeholder.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.envoy_sent,
        choices: [
            { text: 'Accept the partial release', effects: { tension: -10, budget: -40, domesticApproval: 5, diplomaticCapital: 8, internationalStanding: 5 },
              setFlags: { hostages_partially_freed: true },
              flavor: '8 crew members land at Ramstein. The families cry on camera. But 4 remain. The opposition calls it "paying ransom."' },
            { text: 'All 12 or no deal', effects: { tension: 8, domesticApproval: 3, iranAggression: 5 },
              setFlags: { hostage_hardline: true },
              flavor: 'You draw the line. Iran goes silent. The 4 are moved to an unknown location.' },
        ],
    },
    {
        id: 'hostage_rescue_result', title: 'OPERATION EAGLE CLAW II',
        description: 'The rescue force launched at 0200 local time. Two MH-60 Black Hawks, 24 operators, supported by AC-130 gunships. They reached Evin Prison and breached the facility. But Iranian intelligence was waiting.',
        image: 'assets/event-placeholder.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.rescue_attempted,
        choices: [
            { text: 'Read the after-action report', effects: { tension: 20, warPath: 1, domesticApproval: -5, iranAggression: 15, internationalStanding: -10, budget: -30 },
              flavor: '3 operators KIA. 2 hostages killed in crossfire. 6 rescued. Iran parades the wreckage on TV. The world recoils. This is your Desert One.' },
        ],
    },

    // --- MOJTABA SUCCESSION CHAIN (follows mojtaba_succession) ---
    {
        id: 'mojtaba_power_play', title: 'MOJTABA CONSOLIDATES',
        description: 'Mojtaba Khamenei has purged three senior IRGC commanders who opposed his succession. Satellite imagery shows Republican Guard units redeploying to Tehran — not to the Gulf. Intelligence suggests he\'s more afraid of internal rivals than of you. A CIA source inside the Guardian Council reports he might be open to a deal if it helps him consolidate power.',
        image: 'assets/iran-mojtaba.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.mojtaba_watched,
        choices: [
            { text: 'Reach out through CIA channels', effects: { tension: -8, fogOfWar: -10, diplomaticCapital: 8, iranAggression: -5 },
              setFlags: { mojtaba_channel_open: true }, chainEvent: 'mojtaba_secret_deal', chainDelay: 5,
              chainHint: 'A dangerous game. If this becomes public...',
              flavor: 'Your message reaches Mojtaba through three cutouts. He doesn\'t respond — but he doesn\'t shut it down either.' },
            { text: 'Exploit the chaos — increase pressure', effects: { tension: 10, iranAggression: -8, iranEconomy: -5, warPath: 1 },
              setFlags: { mojtaba_pressured: true },
              flavor: 'While Iran fights itself, you tighten the noose. Sanctions hit harder when the government is distracted.' },
            { text: 'Publicly support Iranian moderates', effects: { tension: 5, domesticApproval: -3, internationalStanding: 8, iranAggression: 8 },
              flavor: 'Your speech is played on BBC Persian. Iranian moderates are now accused of being American agents. You meant well.' },
        ],
    },
    {
        id: 'mojtaba_secret_deal', title: 'THE SUPREME LEADER\'S OFFER',
        description: 'Mojtaba\'s people made contact. The proposal is extraordinary: Iran will reopen the strait and halt enrichment above 20% — permanently. In exchange, they want recognition of the new Supreme Leader, removal of all personal sanctions on Mojtaba, and a secret $5 billion reconstruction fund. The CIA says he\'s genuine. The risk: if Congress finds out, it\'s Iran-Contra 2.0.',
        image: 'assets/iran-mojtaba.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.mojtaba_channel_open,
        choices: [
            { text: 'Accept the grand bargain', effects: { tension: -25, iranAggression: -20, oilFlow: 15, budget: -80, domesticApproval: -10, diplomaticCapital: 15 },
              setFlags: { grand_bargain: true },
              flavor: 'You make a deal with the devil you don\'t know. The strait opens. Oil flows. But the secret eats at you. One leak and it\'s over.' },
            { text: 'Accept partially — strait for sanctions relief only', effects: { tension: -15, iranAggression: -12, oilFlow: 8, internationalStanding: 5 },
              setFlags: { partial_deal: true },
              flavor: 'Mojtaba gets less than he wanted but more than he had. The strait reopens gradually. Both sides claim victory.' },
            { text: 'Report to Congress and decline', effects: { tension: 5, domesticApproval: 8, internationalStanding: 5, diplomaticCapital: -10, iranAggression: 10 },
              flavor: 'You do the right thing. Congress applauds your transparency. Iran\'s moderates collapse. Mojtaba becomes a hardliner overnight.' },
        ],
    },

    // --- NUCLEAR CHAIN (follows nuclear_breakout) ---
    {
        id: 'nuclear_inspection_crisis', title: 'IAEA DEMANDS ACCESS',
        description: 'Following your push for international inspection, the IAEA team arrived at Fordow — and was turned away. Iran claims "construction" prevents access. Satellite imagery shows new tunneling activity. The IAEA chief calls you directly: "They\'re 2-3 weeks from enough material for a device. Maybe less." Israel is moving Jericho missiles to launch positions.',
        image: 'assets/event-placeholder.png',
        minDay: 1, maxDay: 999,
        condition: () => SIM.storyFlags.nuclear_inspectors_sent,
        choices: [
            { text: 'Coordinate strikes with Israel on Fordow', effects: { tension: 30, warPath: 2, iranAggression: 15, domesticApproval: 3, internationalStanding: -15, budget: -50 },
              setFlags: { fordow_struck: true },
              flavor: 'Bunker busters penetrate 80 meters of rock. Fordow is destroyed. Iran vows revenge "for a thousand years." The nuclear program is set back 5 years — or 5 months.' },
            { text: 'Threaten strikes unless Iran admits inspectors', effects: { tension: 15, iranAggression: -5, diplomaticCapital: -8, internationalStanding: 3 },
              chainEvent: 'nuclear_ultimatum_response', chainDelay: 3,
              chainHint: 'Iran has 72 hours to respond...',
              flavor: 'An ultimatum with teeth. The world watches.' },
            { text: 'Propose a new deal — enrichment caps for sanctions relief', effects: { tension: -5, iranAggression: -3, domesticApproval: -8, internationalStanding: 8, diplomaticCapital: 10 },
              setFlags: { nuclear_deal_proposed: true },
              flavor: 'Critics call it "JCPOA 2.0." Supporters call it "the only path that doesn\'t end in mushroom clouds."' },
        ],
    },
    {
        id: 'nuclear_ultimatum_response', title: 'IRAN\'S 72-HOUR RESPONSE',
        description: 'The deadline passes. Iran\'s response comes not through diplomats but through actions: they move centrifuge cascades to a new, unknown facility. Meanwhile, Mojtaba appears on television and says, "Iran will never bow to nuclear blackmail — we seek peaceful energy, and we will defend our rights." The IAEA says they\'ve lost track of 8kg of enriched uranium.',
        image: 'assets/event-placeholder.png',
        minDay: 1, maxDay: 999,
        choices: [
            { text: 'Launch strikes on all known nuclear sites', effects: { tension: 35, warPath: 2, budget: -60, domesticApproval: 5, internationalStanding: -20, iranAggression: 20 },
              flavor: 'Operation Olympic Games. B-2s from Whiteman, Tomahawks from the Gulf. 47 targets in one night. The region will never be the same.' },
            { text: 'Accept the new reality — contain and deter', effects: { tension: 5, domesticApproval: -10, internationalStanding: -5, diplomaticCapital: 5 },
              flavor: 'You choose containment over war. History will judge whether this was wisdom or cowardice.' },
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
        id: 'nuclear_threshold', title: '[ NUCLEAR THRESHOLD ]',
        description: 'IAEA reports Iran at 90% enrichment with 440kg stockpile. Israel is on the phone. "We strike in 12 hours unless you act." Russia warns any strike will be treated as aggression against their ally.',
        countdown: 20, crisis: true,
        minDay: 25, maxDay: 70,
        condition: () => SIM.iranAggression > 60 && SIM.tension > 55,
        choices: [
            { text: 'Green-light Israeli strike', effects: { tension: 30, warPath: 2, iranAggression: 15, domesticApproval: -5, internationalStanding: -15, chinaRelations: -15 }, flavor: 'Israeli F-35s hit Fordow and Natanz. Iran vows "devastating retaliation." Russia recalls ambassador. The nuclear clock resets but the war clock accelerates.' },
            { text: 'US strike — bunker busters on Fordow', effects: { tension: 25, warPath: 2, iranAggression: -10, domesticApproval: 10, internationalStanding: -12, budget: -60 }, flavor: 'B-2 bombers drop GBU-57 MOPs. The mountain facility is destroyed. You own this escalation now.' },
            { text: 'Emergency UN session — buy time', effects: { tension: 8, diplomaticCapital: 15, internationalStanding: 10, iranAggression: 5 }, flavor: 'The Security Council convenes. Israel fumes. Iran enriches. You bought 72 hours — at most.' },
            { text: 'Call Tehran directly', effects: { tension: -5, domesticApproval: -15, iranAggression: -8, diplomaticCapital: -10 }, flavor: 'A stunning phone call. Iran agrees to freeze enrichment for 30 days. Hawks call it "the worst deal since Munich." But the bombs stay in their bays.' },
            { text: 'Do nothing — call the bluff', effects: { conflictRisk: 15, iranAggression: 8, domesticApproval: -8 }, flavor: 'Israel strikes alone 11 hours later. The fallout — literal and political — is now your problem without the credit.' },
        ],
    },
    {
        id: 'three_seizures', title: '[ MASS SEIZURE EVENT ]',
        description: 'IRGC Navy seizes THREE tankers simultaneously — Norwegian, Japanese, and Greek-flagged. 67 hostages. This is not a provocation. This is a coordinated operation. The world is watching your response in real time.',
        countdown: 15, crisis: true,
        minDay: 10, maxDay: 60,
        condition: () => SIM.iranAggression > 55 && SIM.iranBoats.length > 2,
        choices: [
            { text: 'Immediate military rescue operation', effects: { tension: 25, warPath: 2, domesticApproval: 12, conflictRisk: 15, iranAggression: -10 }, flavor: 'SEALs board two tankers. The third is too far. 4 hostages wounded, 1 killed. Iran calls it piracy. Fox News calls you a hero.' },
            { text: 'Naval blockade of Iranian ports', effects: { tension: 20, warPath: 1, oilPrice: 15, iranEconomy: -15, internationalStanding: -8, iranAggression: -5 }, flavor: '"Nothing enters or leaves Iranian waters until our people are free." A classic escalation. Effective but the world economy shudders.' },
            { text: 'Hostage negotiation through Oman', effects: { tension: 5, domesticApproval: -10, diplomaticCapital: -10, iranAggression: 3 }, flavor: 'Negotiations begin. Iran demands sanctions relief. Day 1 passes. Day 2. The families are on every channel. "WHERE ARE YOU?"' },
            { text: 'Authorize "all necessary force"', effects: { tension: 30, warPath: 3, domesticApproval: 8, internationalStanding: -10, conflictRisk: 20 }, flavor: 'Congress grants authorization. The US is now legally at war with Iran in all but name.' },
        ],
    },
    {
        id: 'friendly_fire', title: '[ FRIENDLY FIRE INCIDENT ]',
        description: 'USS Vella Gulf (CG-72) has engaged and destroyed a vessel in the strait. It was an Emirati coast guard cutter. 11 UAE personnel killed. The UAE ambassador is on the phone. Al Jazeera has the footage.',
        countdown: 15, crisis: true,
        minDay: 8, maxDay: 55,
        condition: () => SIM.navyShips.length > 3 && SIM.tension > 50,
        choices: [
            { text: 'Immediate public apology + compensation', effects: { domesticApproval: -8, internationalStanding: -5, tension: -3 }, flavor: 'You own it immediately. $500M compensation. The UAE accepts but Al Udeid base access is "under review." Trust is damaged.' },
            { text: 'Blame fog of war — express regret', effects: { domesticApproval: -3, internationalStanding: -10, diplomaticCapital: -8 }, flavor: '"In the fog of war, terrible mistakes happen." The UAE pulls their ambassador. Gulf coalition fractures.' },
            { text: 'Classify the incident — suppress footage', effects: { internationalStanding: -15, domesticApproval: 3, polarization: 8, fogOfWar: 5 }, flavor: 'The cover-up lasts 36 hours before a sailor leaks the bridge recording. Now it\'s a scandal AND a tragedy.' },
            { text: 'Stand down all operations for 48 hours', effects: { tension: -10, iranAggression: 8, oilFlow: -8, domesticApproval: -5 }, flavor: 'A full operational pause. Iran exploits the gap. But no more mistakes. The Navy resets its ROE.' },
        ],
    },
    {
        id: 'cascade_crisis', title: '[ CASCADE FAILURE ]',
        description: 'Houthi anti-ship missile hits LNG tanker in Bab el-Mandeb. Tanker is on fire, crew abandoning ship. Simultaneously, IRGC mines detonate under a VLCC in Hormuz. AND Iraqi militias are rocketing Al Asad. Three theaters. One response.',
        countdown: 12, crisis: true,
        minDay: 15, maxDay: 65,
        condition: () => SIM.proxyThreat > 40 && SIM.tension > 50 && SIM.iranAggression > 50,
        choices: [
            { text: 'Prioritize Hormuz — it\'s the jugular', effects: { tension: 10, oilFlow: 5, proxyThreat: 8, domesticApproval: -3, budget: -20 }, flavor: 'You save the VLCC crew and clear the mines. The LNG tanker burns. Al Asad takes hits. You can\'t be everywhere.' },
            { text: 'Retaliate everywhere — show no weakness', effects: { tension: 25, warPath: 2, budget: -80, domesticApproval: 8, proxyThreat: -15, iranAggression: -10, internationalStanding: -10 }, flavor: 'Tomahawks hit all three fronts simultaneously. Iran\'s proxy network is degraded. Your budget is cratered. The region is on fire.' },
            { text: 'Call emergency NATO Article 5', effects: { tension: 5, internationalStanding: 12, diplomaticCapital: 15, proxyThreat: -5 }, flavor: 'First Article 5 invocation since 9/11. NATO responds — eventually. The bureaucracy buys Iran 72 hours to dig in.' },
            { text: 'Emergency ceasefire offer to Iran', effects: { tension: -8, domesticApproval: -12, iranAggression: -5, proxyThreat: 3, polarization: 8 }, flavor: 'You offer to stop all strikes if Iran reins in proxies. Iran says yes. Then the Houthis fire again the next day. "They don\'t control their own proxies."' },
        ],
    },
    {
        id: 'carrier_hit', title: '[ CARRIER UNDER ATTACK ]',
        description: 'FLASH: USS Abraham Lincoln reports missile impact. Iranian anti-ship ballistic missile. Flight deck damaged. 23 casualties. The carrier is NOT sinking but air operations are suspended. This is the first hit on a US carrier since WWII.',
        countdown: 15, crisis: true,
        minDay: 12, maxDay: 70,
        condition: () => SIM.carrier !== null && SIM.iranAggression > 65 && SIM.tension > 60,
        choices: [
            { text: 'Massive retaliation — destroy Iran\'s missile capability', effects: { tension: 30, warPath: 3, iranAggression: -20, domesticApproval: 15, internationalStanding: -12, budget: -100 }, flavor: '200 Tomahawks in a single salvo. Every known missile site hit. Iran\'s offensive capability is shattered. The war is now total.' },
            { text: 'Proportional response — hit the launch site', effects: { tension: 15, warPath: 1, iranAggression: -8, domesticApproval: 8, internationalStanding: 3 }, flavor: 'Cruise missiles destroy the specific battery that fired. Measured. Professional. But 23 families want more.' },
            { text: 'Withdraw the Lincoln — save the crew', effects: { tension: -5, domesticApproval: -15, iranAggression: 12, internationalStanding: -8 }, flavor: 'The Lincoln limps to Fujairah. Iran celebrates. "We drove the Americans from our waters." Your deterrence is in ruins.' },
            { text: 'Invoke Article II — address the nation', effects: { tension: 10, domesticApproval: 10, polarization: -5, warPath: 1 }, flavor: '"23 Americans were attacked today. We will respond at a time and manner of our choosing." The nation rallies. Iran waits.' },
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
