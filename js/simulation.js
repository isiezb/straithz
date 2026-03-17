/**
 * Simulation Engine — real-time world state
 * Handles oil flow, tension, events, AI behavior
 */

const SIM = {
    day: 1,
    hour: 0,
    speed: 0,           // 0=paused, 1/2/4
    tickRate: 1000,      // ms per hour at 1x

    // Core metrics
    oilFlow: 100,        // % of normal (21M barrels/day)
    oilPrice: 80,        // $/barrel
    tension: 15,         // 0-100
    approval: 72,        // % US global approval
    conflictRisk: 0,     // 0-100

    // Iran state
    iranAggression: 20,  // 0-100 — how provocative Iran is being
    iranEconomy: 60,     // 0-100 — economic health

    // Hidden/advanced
    fogOfWar: 80,        // 0-100 — how much is unknown
    diplomaticCapital: 50,

    // Entities
    tankers: [],
    navyShips: [],
    iranBoats: [],
    platforms: [],

    // Events
    eventQueue: [],
    eventLog: [],

    // Strait geometry (relative to canvas)
    straitBounds: {
        x: 0.35, y: 0.35, w: 0.3, h: 0.3
    },
};

// Shipping lanes — matched to the map image
// Persian Gulf (left) → through the strait (center) → Gulf of Oman (right/bottom-right)
const SHIPPING_LANES = [
    // Inbound (Gulf of Oman → Persian Gulf): enters bottom-right, through strait, exits upper-left
    { points: [[0.95, 0.85], [0.75, 0.65], [0.58, 0.52], [0.48, 0.47], [0.35, 0.43], [0.15, 0.42], [0.0, 0.45]], dir: 'in' },
    // Outbound (Persian Gulf → Gulf of Oman): enters upper-left, through strait, exits bottom-right
    { points: [[0.0, 0.50], [0.15, 0.48], [0.35, 0.48], [0.48, 0.52], [0.58, 0.57], [0.75, 0.70], [0.95, 0.90]], dir: 'out' },
];

function initSimulation() {
    // Spawn initial tankers
    for (let i = 0; i < 12; i++) {
        spawnTanker();
    }

    // Spawn oil platforms — in the Persian Gulf (left side of map)
    const platformPositions = [
        [0.08, 0.38], [0.15, 0.45], [0.22, 0.42], [0.10, 0.50],
    ];
    for (const [x, y] of platformPositions) {
        SIM.platforms.push({ x, y, active: true });
    }
}

function spawnTanker() {
    const lane = SHIPPING_LANES[Math.floor(Math.random() * SHIPPING_LANES.length)];
    const progress = Math.random();
    SIM.tankers.push({
        lane,
        progress,
        speed: 0.0004 + Math.random() * 0.0002,
        seized: false,
        escorted: false,
        id: Math.random().toString(36).substr(2, 6),
    });
}

function spawnNavyShip(x, y) {
    SIM.navyShips.push({
        x, y,
        targetX: x, targetY: y,
        patrolling: true,
        speed: 0.001,
        id: 'USN-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
    });
}

function spawnIranBoat(x, y) {
    SIM.iranBoats.push({
        x, y,
        targetX: x, targetY: y,
        aggressive: false,
        speed: 0.0015,
        id: 'IRGCN-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
    });
}

function tickSimulation() {
    if (SIM.speed === 0) return;

    SIM.hour++;
    if (SIM.hour >= 24) {
        SIM.hour = 0;
        SIM.day++;
        dailyUpdate();
    }

    // Update policy cooldowns
    for (const p of POLICIES) {
        if (p.cooldown > 0 && SIM.hour === 0) p.cooldown--;
    }

    // Move tankers
    for (const t of SIM.tankers) {
        if (t.seized) continue;
        t.progress += t.speed * SIM.speed;
        if (t.progress >= 1) {
            t.progress = 0; // loop
        }
    }

    // Move navy ships (patrol pattern)
    for (const ship of SIM.navyShips) {
        if (ship.patrolling) {
            // Simple patrol — wander near the strait
            if (Math.random() < 0.02) {
                ship.targetX = 0.35 + Math.random() * 0.35;
                ship.targetY = 0.45 + Math.random() * 0.25;
            }
        }
        ship.x += (ship.targetX - ship.x) * 0.02 * SIM.speed;
        ship.y += (ship.targetY - ship.y) * 0.02 * SIM.speed;
    }

    // Move Iran boats
    for (const boat of SIM.iranBoats) {
        if (Math.random() < 0.03) {
            boat.targetX = 0.35 + Math.random() * 0.3;
            boat.targetY = 0.3 + Math.random() * 0.2;
        }
        boat.x += (boat.targetX - boat.x) * 0.025 * SIM.speed;
        boat.y += (boat.targetY - boat.y) * 0.025 * SIM.speed;
    }

    // Random events
    if (Math.random() < 0.003 * SIM.speed) {
        triggerRandomEvent();
    }

    // Iran provocations based on aggression level
    if (Math.random() < (SIM.iranAggression / 5000) * SIM.speed) {
        triggerIranProvocation();
    }
}

function dailyUpdate() {
    // Recalculate metrics from policies
    const tensionDelta = getAggregateEffect('tension');
    const protectionBonus = getAggregateEffect('oilFlowProtection');
    const priceDelta = getAggregateEffect('oilPrice');
    const approvalDelta = getAggregateEffect('approval');
    const aggressionDelta = getAggregateEffect('iranAggression');

    // Tension drifts toward policy-driven level
    const targetTension = Math.max(0, Math.min(100, 15 + tensionDelta));
    SIM.tension += (targetTension - SIM.tension) * 0.1;

    // Oil flow affected by tension, protected by policies
    const baseFlow = 100 - (SIM.tension * 0.5);
    SIM.oilFlow = Math.max(10, Math.min(100, baseFlow + protectionBonus * 0.3));

    // Oil price reacts to flow disruption
    const targetPrice = 80 + (100 - SIM.oilFlow) * 1.5 + priceDelta;
    SIM.oilPrice += (targetPrice - SIM.oilPrice) * 0.15;

    // Approval
    const targetApproval = Math.max(0, Math.min(100, 72 + approvalDelta));
    SIM.approval += (targetApproval - SIM.approval) * 0.08;

    // Iran aggression
    SIM.iranAggression = Math.max(0, Math.min(100, SIM.iranAggression + aggressionDelta * 0.05));

    // Conflict risk
    SIM.conflictRisk = Math.max(0, Math.min(100,
        SIM.tension * 0.4 + SIM.iranAggression * 0.3 + getAggregateEffect('conflictRisk')
    ));

    // Manage navy ships based on deployment policy
    const navyPolicy = POLICIES.find(p => p.id === 'naval_deployment');
    const targetShips = navyPolicy ? [0, 2, 5, 10][navyPolicy.level] : 0;
    while (SIM.navyShips.length < targetShips) {
        spawnNavyShip(0.6 + Math.random() * 0.2, 0.6 + Math.random() * 0.15);
    }
    while (SIM.navyShips.length > targetShips) {
        SIM.navyShips.pop();
    }

    // Iran boats scale with aggression
    const targetBoats = Math.floor(SIM.iranAggression / 15);
    while (SIM.iranBoats.length < targetBoats) {
        spawnIranBoat(0.4 + Math.random() * 0.2, 0.30 + Math.random() * 0.15);
    }
    while (SIM.iranBoats.length > targetBoats) {
        SIM.iranBoats.pop();
    }

    // Maintain tanker count
    while (SIM.tankers.length < Math.floor(SIM.oilFlow / 8)) {
        spawnTanker();
    }
    while (SIM.tankers.length > Math.ceil(SIM.oilFlow / 6)) {
        SIM.tankers.shift();
    }
}

function triggerRandomEvent() {
    const events = [
        { text: 'Oil markets react to regional instability.', effect: () => { SIM.oilPrice += 3; }, level: 'warning' },
        { text: 'Allied nations express concern over strait security.', effect: () => { SIM.approval -= 2; }, level: 'warning' },
        { text: 'Diplomatic back-channel shows promise.', effect: () => { SIM.tension -= 3; }, level: 'good' },
        { text: 'Commercial shipping companies reroute around Cape of Good Hope.', effect: () => { SIM.oilFlow -= 5; SIM.oilPrice += 5; }, level: 'critical' },
        { text: 'Gulf states increase oil production to stabilize markets.', effect: () => { SIM.oilPrice -= 4; }, level: 'good' },
        { text: 'UN Security Council calls emergency session on strait tensions.', effect: () => { SIM.approval += 3; }, level: 'warning' },
        { text: 'Insurance premiums for strait transit increase sharply.', effect: () => { SIM.oilPrice += 2; }, level: 'warning' },
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    logEvent(event.text, event.level);
}

function triggerIranProvocation() {
    const provocations = [
        { text: 'IRGC Navy conducts aggressive maneuvers near commercial shipping.', tension: 5, level: 'critical' },
        { text: 'Iran test-fires anti-ship missiles in strait exercise.', tension: 8, level: 'critical' },
        { text: 'Iranian patrol boats shadow US Navy vessel.', tension: 3, level: 'warning' },
        { text: 'Iran threatens to close the strait if sanctions continue.', tension: 4, level: 'warning' },
        { text: 'IRGC seizes foreign-flagged tanker for "violations".', tension: 10, oilFlow: -8, level: 'critical' },
    ];

    const prov = provocations[Math.floor(Math.random() * provocations.length)];
    SIM.tension = Math.min(100, SIM.tension + prov.tension);
    if (prov.oilFlow) SIM.oilFlow = Math.max(10, SIM.oilFlow + prov.oilFlow);
    logEvent(prov.text, prov.level);
}

function logEvent(text, level = 'normal') {
    const entry = { day: SIM.day, hour: SIM.hour, text, level };
    SIM.eventLog.push(entry);
    if (SIM.eventLog.length > 100) SIM.eventLog.shift();
    return entry;
}
