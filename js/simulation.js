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
    oilFlow: 25,
    oilPrice: 110,
    tension: 85,
    domesticApproval: 60,
    internationalStanding: 45,
    conflictRisk: 45,
    budget: 900,

    // Iran state
    iranAggression: 70,
    iranEconomy: 30,
    iranStrategy: 'escalatory', // restrained/probing/escalatory/confrontational

    // Geopolitics
    fogOfWar: 82,
    diplomaticCapital: 25,
    proxyThreat: 40,
    chinaRelations: 50,
    russiaRelations: 40,
    polarization: 25,
    assassinationRisk: 0,
    warPath: 3,
    escalationLevel: 3,    // 0=diplomatic, 1=naval standoff, 2=limited strikes, 3=air campaign, 4=ground invasion, 5=total war

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
    crisisLevel: 1,
    crisisTimer: 5,
    consecutiveProvocations: 3,
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

    // Implementation delay queue
    pendingEffects: [],  // [{cardId, cardName, category, funding, effects, activateOnDay}]

    // Intel confidence system
    intelBriefings: [],  // [{text, confidence, accurate, day}]

    // Hidden alignment (Suzerain-style — player never sees these)
    hawkDove: 50,           // 0=dove, 100=hawk
    unilateralMultilateral: 50,  // 0=multilateral, 100=unilateral
    escalationRestraint: 50,     // 0=restraint, 100=escalation

    // Character unique resource (copied from character on init)
    uniqueResource: 0,
    _leakCount: 0, // Kushner leak tracking
};

/** Default values for SIM reset — used by restartGame() */
const SIM_DEFAULTS = {
    day: 1, hour: 0, week: 1, weekDay: 1, speed: 2,
    phase: 'morning', actionPoints: 3,
    stanceActivationDay: {}, firedConsequences: [], pendingNews: [], prevGauges: null,
    oilFlow: 25, oilPrice: 110, tension: 85, domesticApproval: 60,
    internationalStanding: 45, conflictRisk: 45, budget: 900,
    iranAggression: 70, iranEconomy: 30, iranStrategy: 'escalatory',
    fogOfWar: 82, diplomaticCapital: 25, proxyThreat: 40,
    chinaRelations: 50, russiaRelations: 40, polarization: 25,
    assassinationRisk: 0, warPath: 3, escalationLevel: 3,
    straitOpenDays: 0, lowApprovalDays: 0, lowStandingDays: 0,
    recentSeizureDays: [],
    tankers: [], navyShips: [], iranBoats: [], platforms: [],
    mines: [], drones: [], carrier: null,
    eventLog: [], headlines: [], effects: [],
    gameOver: false, gameOverReason: '', gameWon: false,
    activeStances: [], playedExclusives: [],
    crisisLevel: 1, crisisTimer: 5, consecutiveProvocations: 3,
    interceptCount: 0, seizureCount: 0,
    decisionEventActive: false, decisionHistory: [], lastDecisionDay: 0,
    metricHistory: [], incidentMarkers: [], pendingEffects: [],
    intelBriefings: [], hawkDove: 50, unilateralMultilateral: 50, escalationRestraint: 50,
    uniqueResource: 0, _leakCount: 0,
    decisionLog: [], weeklyReportActive: false, selectedEntity: null, selectedType: null,
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
    // Crisis start: fewer tankers, one already seized
    for (let i = 0; i < 5; i++) spawnTanker();
    SIM.tankers[0].seized = true;
    SIM.tankers[0].id = 'TKR-SEIZED';
    SIM.seizureCount = 1;

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
    if (!SIM.activeStances || SIM.activeStances.length === 0) return null;

    // Three-act pacing: event frequency varies by day
    let eventChance;
    if (SIM.day <= 20) eventChance = 0.65;       // Crisis: events most days
    else if (SIM.day <= 55) eventChance = 0.40;   // Grind: every 2-3 days
    else eventChance = 0.60;                       // Endgame: ramp back up

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
    if (SIM.character && SIM.character.uniqueEvents) {
        allEvents = allEvents.concat(SIM.character.uniqueEvents);
    }

    // Stance-duration bonus: cards active longer are more likely to trigger related events
    const eligible = allEvents.filter(e =>
        !usedIds.includes(e.id) &&
        SIM.day >= (e.minDay || 1) && SIM.day <= (e.maxDay || 999) &&
        (!e.condition || e.condition())
    );

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

    // --- Core Metrics ---
    const tensionDelta = getStanceEffect('tension');
    const protectionBonus = getStanceEffect('oilFlowProtection');
    const priceDelta = getStanceEffect('oilPrice');
    const costDelta = getStanceEffect('cost');

    // Apply character cost multiplier
    let adjustedCost = costDelta;
    if (SIM.character && SIM.character.costMult) {
        // Only reduce cost for economic cards
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

    // Tension
    const dipBonus = (SIM.diplomaticCapital - 50) * 0.05;
    const targetTension = Math.max(0, Math.min(100, 15 + tensionDelta - dipBonus));
    SIM.tension += (targetTension - SIM.tension) * 0.08;
    SIM.tension += SIM.crisisLevel * 2;
    if (SIM.consecutiveProvocations > 0) {
        SIM.tension += SIM.consecutiveProvocations * 1.5;
        SIM.consecutiveProvocations = Math.max(0, SIM.consecutiveProvocations - 0.5);
    }

    // Oil flow
    const baseFlow = 100 - (SIM.tension * 0.5);
    SIM.oilFlow = Math.max(10, Math.min(100, baseFlow + protectionBonus * 0.3));
    const seizedCount = SIM.tankers.filter(t => t.seized).length;
    SIM.oilFlow = Math.max(10, SIM.oilFlow - seizedCount * 3);
    SIM.oilFlow -= SIM.proxyThreat * 0.08; // Proxy attacks reduce flow
    SIM.oilFlow = Math.max(10, SIM.oilFlow);

    // Oil price
    const targetPrice = 80 + (100 - SIM.oilFlow) * 1.5 + priceDelta;
    SIM.oilPrice += (targetPrice - SIM.oilPrice) * 0.15;

    // Domestic approval
    let approvalDelta = getStanceEffect('domesticApproval');
    if (SIM.character && SIM.character.approvalMult && approvalDelta < 0) {
        approvalDelta *= SIM.character.approvalMult;
    }
    const targetApproval = Math.max(0, Math.min(100, 65 + approvalDelta));
    SIM.domesticApproval += (targetApproval - SIM.domesticApproval) * 0.06;
    if (seizedCount > 0) SIM.domesticApproval -= seizedCount * 0.5;
    if (SIM.interceptCount > 0) SIM.domesticApproval += Math.min(SIM.interceptCount * 0.3, 2);
    if (SIM.oilFlow < 30) SIM.domesticApproval -= 3;
    if (SIM.oilFlow < 15) SIM.domesticApproval -= 5;
    if (SIM.budget < 0) SIM.domesticApproval -= 1;
    SIM.domesticApproval = Math.max(0, Math.min(100, SIM.domesticApproval));

    // International standing
    let standingDelta = getStanceEffect('internationalStanding');
    const targetStanding = Math.max(0, Math.min(100, 70 + standingDelta));
    SIM.internationalStanding += (targetStanding - SIM.internationalStanding) * 0.06;
    SIM.internationalStanding = Math.max(0, Math.min(100, SIM.internationalStanding));

    // Iran aggression
    const aggrDelta = getStanceEffect('iranAggression');
    SIM.iranAggression = Math.max(0, Math.min(100, SIM.iranAggression + aggrDelta * 0.05));
    if (SIM.iranEconomy < 30) SIM.iranAggression += 0.5;

    // Iran economy
    const econDelta = getStanceEffect('iranEconomy');
    SIM.iranEconomy = Math.max(0, Math.min(100, SIM.iranEconomy + econDelta * 0.02));
    if (SIM.chinaRelations < 30) SIM.iranEconomy += 0.5; // China buys oil anyway

    // Fog of war
    let fogDelta = getStanceEffect('fogOfWar');
    SIM.fogOfWar = Math.max(0, Math.min(100, SIM.fogOfWar + 0.8 + fogDelta * 0.05));

    // Conflict risk
    const crDelta = getStanceEffect('conflictRisk');
    SIM.conflictRisk = Math.max(0, Math.min(100,
        SIM.tension * 0.4 + SIM.iranAggression * 0.3 + crDelta + SIM.crisisLevel * 10 + SIM.warPath * 8
    ));

    // Diplomatic capital
    const dipDelta = getStanceEffect('diplomaticCapital');
    if (SIM.character && SIM.character.diplomacyMult && dipDelta > 0) {
        SIM.diplomaticCapital += dipDelta * SIM.character.diplomacyMult * 0.1;
    } else {
        SIM.diplomaticCapital += dipDelta * 0.1;
    }
    SIM.diplomaticCapital = Math.max(0, Math.min(100, SIM.diplomaticCapital));

    // --- Escalation Ladder ---
    // Player escalation based on warPath
    if (SIM.warPath <= 0) SIM.escalationLevel = 0;
    else if (SIM.warPath === 1) SIM.escalationLevel = 1;
    else if (SIM.warPath === 2) SIM.escalationLevel = 2;
    else if (SIM.warPath === 3) SIM.escalationLevel = 3;
    else if (SIM.warPath === 4) SIM.escalationLevel = 4;
    else SIM.escalationLevel = 5;

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

    // Tankers
    while (SIM.tankers.length < Math.floor(SIM.oilFlow / 8)) spawnTanker();
    while (SIM.tankers.length > Math.ceil(SIM.oilFlow / 6)) SIM.tankers.shift();

    // Release seized tankers
    for (const t of SIM.tankers) {
        if (t.seized && Math.random() < 0.1) {
            t.seized = false;
            addHeadline(`Iran releases tanker ${t.id} after pressure`, 'good');
        }
    }

    // --- Statistical Seizure/Intercept Model (P2) ---
    // Seizure chance based on Iran aggression + strategy, reduced by naval presence
    const seizureBase = SIM.iranStrategy === 'confrontational' ? 0.20 :
                        SIM.iranStrategy === 'escalatory' ? 0.12 :
                        SIM.iranStrategy === 'probing' ? 0.05 : 0.01;
    const navalDeterrence = Math.min(0.15, navalPresence * 0.05);
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
                SIM.consecutiveProvocations++;
                SIM.warPath++;
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
    SIM.recentSeizureDays = SIM.recentSeizureDays.filter(d => SIM.day - d <= 7);

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

    // Sanctions without diplomacy = escalatory
    if (hasHeavySanctions && !hasDiplomacy) SIM.iranAggression += 1.5;
    // Diplomacy while economy hurting = de-escalatory
    if (hasDiplomacy && SIM.iranEconomy < 40) SIM.iranAggression -= 2;
    // Unilateral navy without coalition = provocative
    if (hasHeavyNavy && !hasCoalition) SIM.iranAggression += 1;
    // Coalition + diplomacy = Iran pressured to negotiate
    if (hasCoalition && hasDiplomacy) SIM.iranAggression -= 1.5;

    // Low Russia relations = Iran gets weapons
    if (SIM.russiaRelations < 25) SIM.iranAggression += 0.3;

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

    // Military escalation pushes Russia away
    const navyPres = getStanceMax('navalPresence');
    if (navyPres >= 3) SIM.russiaRelations -= 0.3;
    if (getStanceEffect('warPath') > 0) SIM.russiaRelations -= 0.5;

    // Coalition reassures somewhat
    const standing = getStanceEffect('internationalStanding');
    if (standing > 5) SIM.russiaRelations += 0.1;

    // China/Russia relations from card effects
    SIM.chinaRelations += (getStanceEffect('chinaRelations') || 0) * 0.1;
    SIM.russiaRelations += (getStanceEffect('russiaRelations') || 0) * 0.1;

    SIM.chinaRelations = Math.max(0, Math.min(100, SIM.chinaRelations));
    SIM.russiaRelations = Math.max(0, Math.min(100, SIM.russiaRelations));
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

    // --- Win 2: Strait open 14 consecutive days (generic fallback) ---
    const recentSeizures = SIM.recentSeizureDays.filter(d => SIM.day - d <= 7).length;
    const straitOpen = SIM.oilFlow > 65 && SIM.tension < 45 && recentSeizures === 0 && SIM.crisisLevel === 0;

    if (straitOpen) {
        SIM.straitOpenDays++;
        if (SIM.straitOpenDays >= 14) {
            endGame(true, 'The Strait of Hormuz has been open and stable for 14 consecutive days. Crisis resolved through ' +
                (SIM.diplomaticCapital > 60 ? 'masterful diplomacy.' : SIM.domesticApproval > 70 ? 'strong leadership.' : 'persistent strategy.'));
            return true;
        }
    } else {
        if (SIM.straitOpenDays > 3) {
            addHeadline(`Strait stability disrupted — open day counter resets (was ${SIM.straitOpenDays}/14)`, 'warning');
        }
        SIM.straitOpenDays = 0;
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

    // --- Lose 2: Assassination ---
    if (SIM.assassinationRisk > 85 && Math.random() < (SIM.assassinationRisk - 80) / 400) {
        endGame(false, 'A sophisticated attack targets your motorcade. The crisis claims its highest-profile casualty. ' +
            (SIM.iranAggression > 80 ? 'Iranian intelligence is suspected.' : 'Domestic extremists are suspected.'));
        return true;
    }

    // --- Lose 3: Civil War ---
    if (SIM.polarization >= 90) {
        endGame(false, 'Domestic unrest has reached a breaking point. The military is split. ' +
            'The crisis abroad has ignited a crisis at home. America is tearing itself apart.');
        return true;
    }

    // --- Lose 4: Global Pariah ---
    if (SIM.internationalStanding <= 10) {
        SIM.lowStandingDays++;
        if (SIM.lowStandingDays >= 3) {
            endGame(false, 'The international community has turned against you. Allies recall ambassadors. ' +
                'Sanctions against the United States are being discussed. You are a global pariah.');
            return true;
        }
    } else { SIM.lowStandingDays = 0; }

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
        { text: 'Patrol encounters IRGC fast boats — tense standoff', effect: () => { SIM.tension += 5; SIM.consecutiveProvocations++; }, level: 'warning', funding: 'any' },
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
        { text: 'Maximum pressure pushes Iran into a corner — provocations spike', effect: () => { SIM.iranAggression += 8; SIM.consecutiveProvocations += 2; }, level: 'critical', funding: 'high' },
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
        { text: 'OPEC+ deal falls apart — Russia blocks the increase', effect: () => { SIM.oilPrice += 5; SIM.russiaRelations -= 3; }, level: 'warning', funding: 'medium' },
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
    addHeadline(pick.text, pick.level);
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
        { text: 'Russia quietly ships advanced anti-ship missiles to Iran via Caspian route', effect: () => { SIM.iranAggression += 3; SIM.conflictRisk += 3; SIM.russiaRelations -= 3; }, level: 'critical' },
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
    SIM.consecutiveProvocations++;
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
    {
        id: 'secret_talks', title: 'SECRET BACK-CHANNEL',
        description: 'Iranian moderates have reached out through Omani intermediaries. They propose secret talks — but if leaked, hawks on both sides will be furious.',
        minDay: 5, maxDay: 40,
        condition: () => SIM.tension > 25 && SIM.diplomaticCapital > 20,
        choices: [
            { text: 'Accept the talks', effects: { tension: -12, domesticApproval: -5, diplomaticCapital: 15, iranAggression: -8 }, flavor: 'The back-channel opens. Both sides agree to a cooling-off period.' },
            { text: 'Reject — too risky', effects: { tension: 3, iranAggression: 5 }, flavor: 'The opportunity passes. Iranian hardliners use the rejection as propaganda.' },
            { text: 'Leak it to the press', effects: { domesticApproval: 8, tension: 6, diplomaticCapital: -15 }, flavor: 'You gain public credit but burn the diplomatic bridge.' },
        ],
    },
    {
        id: 'congress_pressure', title: 'CONGRESSIONAL HEARING',
        description: 'Senate Armed Services Committee demands testimony. They threaten to cut your budget.',
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
        minDay: 10, maxDay: 75,
        condition: () => SIM.seizureCount > 0,
        choices: [
            { text: 'Negotiate release', effects: { domesticApproval: 8, tension: -5, diplomaticCapital: -10 }, flavor: 'After tense negotiations, the crew is released at Muscat airport.' },
            { text: 'Demand unconditional release', effects: { tension: 8, domesticApproval: 3, iranAggression: 5, warPath: 1 }, flavor: 'You increase pressure. International opinion turns against Iran.' },
            { text: 'Offer quiet concession', effects: { tension: -8, domesticApproval: -5, iranAggression: -3 }, flavor: 'A minor sanctions waiver. The crew comes home. Nobody talks about the price.' },
        ],
    },
    {
        id: 'oil_spike', title: 'OIL MARKET PANIC',
        description: 'Oil futures jumped $15/barrel. Energy Secretary is on the phone — should you release reserves?',
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
        minDay: 15, maxDay: 60,
        condition: () => SIM.tension > 20,
        choices: [
            { text: 'Push strong resolution', effects: { internationalStanding: 8, tension: 5, russiaRelations: -8, diplomaticCapital: -10 }, flavor: 'Russia vetoes. But the debate isolates Iran diplomatically.' },
            { text: 'Accept watered-down version', effects: { internationalStanding: 3, tension: -3, diplomaticCapital: 5, russiaRelations: 3 }, flavor: 'Passes unanimously. Symbolic but shows unity.' },
            { text: 'Withdraw the resolution', effects: { internationalStanding: -5, diplomaticCapital: -5 }, flavor: 'Allies are confused by the retreat.' },
        ],
    },
    {
        id: 'cyber_attack_decision', title: 'CYBER OPERATION PROPOSAL',
        description: 'NSA can disable Iran\'s naval command network for 48 hours. If attributed, it\'s an act of war.',
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
        minDay: 18, maxDay: 70,
        condition: () => SIM.russiaRelations < 40,
        choices: [
            { text: 'Intercept the shipment', effects: { russiaRelations: -15, tension: 12, iranAggression: -5, warPath: 1 }, flavor: 'The ship is turned back. Russia is furious. Iran doesn\'t get the weapons.' },
            { text: 'Diplomatic protest', effects: { russiaRelations: -5, internationalStanding: 3 }, flavor: 'A formal protest. The shipment arrives but world opinion shifts.' },
            { text: 'Ignore it', effects: { iranAggression: 8, conflictRisk: 5 }, flavor: 'The missiles are deployed. Iranian capabilities increase.' },
        ],
    },
    {
        id: 'iran_internal', title: 'IRANIAN POWER STRUGGLE',
        description: 'Intel suggests moderates within Iran\'s government are challenging IRGC hardliners. You could tip the balance.',
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
        minDay: 20, maxDay: 70,
        condition: () => SIM.iranAggression > 50 && SIM.tension > 40,
        choices: [
            { text: 'Strike Fordow — bunker busters', effects: { tension: 30, warPath: 2, iranAggression: 15, internationalStanding: -15, domesticApproval: 10 }, flavor: 'B-2 bombers drop GBU-57 MOPs on the mountain facility. Iran vows "devastating retaliation." The nuclear clock resets.' },
            { text: 'Emergency UN session', effects: { tension: 5, internationalStanding: 10, diplomaticCapital: 15, iranAggression: 3 }, flavor: 'The Security Council convenes. Russia and China abstain rather than veto. New inspections demanded.' },
            { text: 'Offer down-blend deal', effects: { tension: -10, iranAggression: -8, domesticApproval: -10, diplomaticCapital: 10 }, flavor: 'You offer sanctions relief in exchange for down-blending to 3.67%. Hawks call it appeasement. Iran considers it.' },
        ],
    },
    {
        id: 'abqaiq_redux', title: 'SAUDI ARAMCO ATTACK',
        description: 'Drone swarm strikes Abqaiq-Khurais oil processing facility. 5.7 million barrels/day knocked offline — half of Saudi production. Oil futures spike 15% overnight.',
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
        minDay: 10, maxDay: 70,
        condition: () => SIM.chinaRelations > 20,
        choices: [
            { text: 'Secondary sanctions on Chinese banks', effects: { chinaRelations: -20, iranEconomy: -10, tension: 5, oilPrice: 8, internationalStanding: -5 }, flavor: 'SWIFT cuts off three Chinese banks. Beijing is furious. Iran\'s revenue collapses. Trade war escalates.' },
            { text: 'Quiet diplomatic pressure', effects: { chinaRelations: -5, iranEconomy: -3, diplomaticCapital: -5 }, flavor: 'Beijing makes promises. The shadow fleet shrinks slightly. It\'s not enough.' },
            { text: 'Look the other way', effects: { iranEconomy: 5, chinaRelations: 5, domesticApproval: -5 }, flavor: 'Pragmatism over principle. Iran keeps selling. Hawks in Congress are furious.' },
        ],
    },
    {
        id: 'oman_talks', title: 'MUSCAT BACK-CHANNEL',
        description: 'Omani intermediaries report Iran\'s Foreign Minister Araghchi says a nuclear deal is "within reach." He proposes secret talks in Muscat. Three days later, your intelligence says IRGC is planning a major provocation.',
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
        minDay: 5, maxDay: 40,
        condition: () => SIM.tension > 30,
        choices: [
            { text: 'Double down — back it with action', effects: { tension: 15, iranAggression: -10, domesticApproval: 12, warPath: 1, internationalStanding: -8 }, flavor: 'You mobilize visibly. Iran calls it bluffing until the first carrier arrives. Then they go quiet.' },
            { text: 'Walk it back through spokespersons', effects: { tension: -3, domesticApproval: -5, iranAggression: 3 }, flavor: '"The President was speaking metaphorically." Nobody buys it. Iran smells weakness.' },
            { text: 'Use the chaos as cover for diplomacy', effects: { tension: 3, diplomaticCapital: 8, domesticApproval: 3 }, flavor: 'While the world watches the tweet storm, back-channel talks advance quietly.' },
        ],
    },
    {
        id: 'iran_internal_struggle', title: 'IRANIAN MODERATES VS IRGC',
        description: 'Iran\'s civilian government and IRGC are openly clashing. The Foreign Ministry wants negotiations. The IRGC is planning more seizures. Your intel shows the split is real.',
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
        minDay: 3, maxDay: 30,
        condition: () => SIM.warPath >= 2,
        choices: [
            { text: 'Express regret — open investigation', effects: { internationalStanding: 5, domesticApproval: -5, tension: -3, iranAggression: -3 }, flavor: 'You acknowledge the tragedy. The investigation finds mixed-use targeting. International pressure eases slightly.' },
            { text: 'Deny — claim it was a military site', effects: { internationalStanding: -10, domesticApproval: 3, tension: 5, iranAggression: 5 }, flavor: 'Pentagon releases grainy satellite photos. Nobody is convinced. Global protests erupt.' },
            { text: 'Pause air operations for review', effects: { domesticApproval: -8, tension: -10, iranAggression: 8, internationalStanding: 8, warPath: -1 }, flavor: 'A 72-hour pause. Hawks scream. Allies exhale. Iran uses the time to reposition forces.' },
        ],
    },
    {
        id: 'mojtaba_succession', title: 'SUPREME LEADER SUCCESSION CRISIS',
        description: 'With Khamenei dead, his son Mojtaba is consolidating power with IRGC backing. But the Assembly of Experts is divided. Iran\'s internal chaos creates both danger and opportunity.',
        minDay: 5, maxDay: 45,
        condition: () => SIM.iranAggression > 40,
        choices: [
            { text: 'Covert ops to empower moderates', effects: { iranAggression: -12, tension: -5, fogOfWar: 8, diplomaticCapital: -8 }, flavor: 'CIA channels support Raisi-faction moderates. The succession battle intensifies. IRGC is distracted.' },
            { text: 'Publicly demand democratic transition', effects: { internationalStanding: 8, domesticApproval: 5, iranAggression: 10, tension: 5 }, flavor: 'Your call for democracy rallies Western opinion but unites Iranian factions against external meddling.' },
            { text: 'Exploit the chaos — escalate strikes', effects: { tension: 15, warPath: 1, iranAggression: -10, domesticApproval: 3, internationalStanding: -10 }, flavor: 'You hit command centers while leadership is in disarray. Effective but brutal. The world recoils.' },
        ],
    },
    {
        id: 'joe_kent_resignation', title: 'NSA KENT RESIGNS',
        description: 'National Security Advisor Joe Kent has resigned, citing disagreements over escalation. He goes on Fox News within the hour. "The President is being misled by hawks who\'ve never seen combat."',
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
        minDay: 12, maxDay: 60,
        condition: () => SIM.russiaRelations < 35,
        choices: [
            { text: 'Expel Russian diplomats', effects: { russiaRelations: -20, fogOfWar: -10, tension: 5, internationalStanding: 5 }, flavor: '15 diplomats expelled. NATO allies follow suit. Russia retaliates but the leak is plugged.' },
            { text: 'Exploit the defector — feed disinformation', effects: { fogOfWar: -20, iranAggression: -5, russiaRelations: -5 }, flavor: 'You turn the leak into an advantage. False intelligence flows to Tehran through Moscow. Iran chases ghosts.' },
            { text: 'Quiet protest — preserve the channel', effects: { russiaRelations: -5, fogOfWar: -5 }, flavor: 'A stern demarche. Russia denies everything. But the intelligence sharing slows.' },
        ],
    },
    {
        id: 'nowruz_ceasefire', title: 'NOWRUZ CEASEFIRE WINDOW',
        description: 'Iranian New Year (Nowruz) is in 3 days. Iranian moderates propose a 5-day ceasefire for the holiday. IRGC hasn\'t objected. This could be the off-ramp.',
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
        minDay: 15, maxDay: 65,
        condition: () => SIM.warPath >= 2 && SIM.internationalStanding < 50,
        choices: [
            { text: 'Reject ICC jurisdiction — sanction the court', effects: { internationalStanding: -12, domesticApproval: 8, polarization: 5 }, flavor: 'America First crowd loves it. Europeans are horrified. The legal threat remains for allied officials.' },
            { text: 'Cooperate partially — show good faith', effects: { internationalStanding: 8, domesticApproval: -5, tension: -3 }, flavor: 'You provide limited documentation. It buys goodwill. The investigation slows.' },
            { text: 'Use it as leverage against Iran', effects: { internationalStanding: 5, iranAggression: -5, diplomaticCapital: 5 }, flavor: 'You frame it as mutual accountability. Iran\'s crimes are documented alongside yours. A diplomatic tool emerges.' },
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

// ======================== HIDDEN ALIGNMENT TRACKING ========================

/** Shift alignment axes based on a decision choice's nature */
function shiftAlignment(effects) {
    if (!effects) return;
    // Military actions push hawk + escalation
    if (effects.warPath > 0) { SIM.hawkDove = Math.min(100, SIM.hawkDove + effects.warPath * 5); SIM.escalationRestraint = Math.min(100, SIM.escalationRestraint + effects.warPath * 5); }
    if (effects.tension > 10) { SIM.hawkDove = Math.min(100, SIM.hawkDove + 3); SIM.escalationRestraint = Math.min(100, SIM.escalationRestraint + 3); }
    // Diplomatic actions push dove + multilateral
    if (effects.diplomaticCapital > 5) { SIM.hawkDove = Math.max(0, SIM.hawkDove - 4); SIM.unilateralMultilateral = Math.max(0, SIM.unilateralMultilateral - 4); }
    if (effects.internationalStanding > 5) { SIM.unilateralMultilateral = Math.max(0, SIM.unilateralMultilateral - 3); }
    // De-escalation pushes restraint
    if (effects.tension < -5) { SIM.escalationRestraint = Math.max(0, SIM.escalationRestraint - 4); SIM.hawkDove = Math.max(0, SIM.hawkDove - 2); }
    // Iran aggression reduction via military = hawk, via diplomacy = dove (handled by warPath/diplomaticCapital above)
    // Unilateral indicators
    if (effects.internationalStanding < -5) SIM.unilateralMultilateral = Math.min(100, SIM.unilateralMultilateral + 3);
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
            { text: 'Green-light Israeli strike', effects: { tension: 30, warPath: 2, iranAggression: 15, domesticApproval: -5, internationalStanding: -15, russiaRelations: -15 }, flavor: 'Israeli F-35s hit Fordow and Natanz. Iran vows "devastating retaliation." Russia recalls ambassador. The nuclear clock resets but the war clock accelerates.' },
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
    // Crisis events are rarer — 8% chance per eligible day
    if (Math.random() > 0.08) return null;
    return eligible[Math.floor(Math.random() * eligible.length)];
}

// ======================== HELPERS ========================

// getLanePosition defined in map.js

function logEvent(text, level) {
    addHeadline(text, level || 'normal');
}
