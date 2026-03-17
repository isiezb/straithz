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
    oilPrice: 145,
    tension: 72,
    domesticApproval: 55,
    internationalStanding: 50,
    conflictRisk: 35,
    budget: 900,

    // Iran state
    iranAggression: 65,
    iranEconomy: 40,
    iranStrategy: 'escalatory', // restrained/probing/escalatory/confrontational

    // Geopolitics
    fogOfWar: 82,
    diplomaticCapital: 25,
    proxyThreat: 40,
    chinaRelations: 50,
    russiaRelations: 40,
    polarization: 25,
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

    // Character unique resource (copied from character on init)
    uniqueResource: 0,
    _leakCount: 0, // Kushner leak tracking
};

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

    // Initial crisis headlines
    addHeadline('BREAKING: Iran seizes oil tanker in Strait of Hormuz — crisis escalates', 'critical');
    addHeadline('IRGC naval forces deployed across strait — shipping lanes under threat', 'warning');
    addHeadline('Pentagon confirms mines detected in shipping corridor', 'warning');
    addHeadline('Oil prices surge past $140 as strait transit grinds to a halt', 'warning');
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
    if (SIM.character && SIM.character.intelMult) fogDelta *= SIM.character.intelMult;
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

    // --- Win: Strait open 14 consecutive days ---
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
    ],
    naval_patrol: [
        { text: 'USN patrol intercepts suspicious vessel — clear signal to Iran', effect: () => { SIM.iranAggression -= 2; SIM.interceptCount++; }, level: 'good', funding: 'medium' },
        { text: 'Patrol encounters IRGC fast boats — tense standoff', effect: () => { SIM.tension += 5; SIM.consecutiveProvocations++; }, level: 'warning', funding: 'any' },
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
    ],
    maximum_pressure: [
        { text: 'Maximum pressure pushes Iran into a corner — provocations spike', effect: () => { SIM.iranAggression += 8; SIM.consecutiveProvocations += 2; }, level: 'critical', funding: 'high' },
        { text: 'Secondary sanctions anger European allies', effect: () => { SIM.internationalStanding -= 5; }, level: 'warning', funding: 'medium' },
        { text: 'Oil prices surge on maximum pressure announcement', effect: () => { SIM.oilPrice += 8; SIM.domesticApproval -= 2; }, level: 'warning', funding: 'any' },
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
    ],
    drone_surveillance: [
        { text: 'Drone reveals Iranian military buildup at Bandar Abbas', effect: () => { SIM.fogOfWar -= 8; SIM.tension += 3; }, level: 'warning', funding: 'any' },
        { text: 'Iran shoots down a surveillance drone', effect: () => { SIM.tension += 8; SIM.warPath++; }, level: 'critical', funding: 'high' },
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
];

// ======================== HELPERS ========================

// getLanePosition defined in map.js

function logEvent(text, level) {
    addHeadline(text, level || 'normal');
}
