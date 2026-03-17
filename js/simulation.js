/**
 * Simulation Engine — real-time world state
 * Handles oil flow, tension, events, AI behavior, win/lose, entity interactions
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
    budget: 1000,        // $M remaining budget

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
    mines: [],       // Iranian mines in shipping lanes
    drones: [],      // Surveillance drones (from intel ops)
    carrier: null,   // Aircraft carrier (full naval deployment)

    // Events
    eventQueue: [],
    eventLog: [],

    // Visual effects
    effects: [],         // Explosions, flashes, etc.

    // Game state
    gameOver: false,
    gameOverReason: '',
    gameWon: false,
    victoryDay: 90,      // Survive this many days to win

    // Crisis escalation
    crisisLevel: 0,      // 0-3 (none, minor, major, war)
    crisisTimer: 0,      // Days since last crisis escalation
    consecutiveProvocations: 0,

    // Entity interaction tracking
    interceptCount: 0,
    seizureCount: 0,

    // Selected entity (for click interaction)
    selectedEntity: null,
    selectedType: null,

    // Strait geometry (relative to canvas)
    straitBounds: {
        x: 0.35, y: 0.35, w: 0.3, h: 0.3
    },
};

// Shipping lanes — matched to the map image
const SHIPPING_LANES = [
    // Inbound (Gulf of Oman → Persian Gulf)
    { points: [[0.95, 0.85], [0.75, 0.65], [0.58, 0.52], [0.48, 0.47], [0.35, 0.43], [0.15, 0.42], [0.0, 0.45]], dir: 'in' },
    // Outbound (Persian Gulf → Gulf of Oman)
    { points: [[0.0, 0.50], [0.15, 0.48], [0.35, 0.48], [0.48, 0.52], [0.58, 0.57], [0.75, 0.70], [0.95, 0.90]], dir: 'out' },
];

function initSimulation() {
    for (let i = 0; i < 12; i++) {
        spawnTanker();
    }

    const platformPositions = [
        [0.08, 0.38], [0.15, 0.45], [0.22, 0.42], [0.10, 0.50],
    ];
    for (const [x, y] of platformPositions) {
        SIM.platforms.push({ x, y, active: true, health: 100 });
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
        damaged: false,
        id: 'TKR-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        cargo: Math.floor(Math.random() * 2000000 + 500000), // barrels
        flag: ['LBR', 'PAN', 'MHL', 'GBR', 'NOR', 'GRC', 'JPN'][Math.floor(Math.random() * 7)],
    });
}

function spawnNavyShip(x, y) {
    const types = ['DDG', 'CG', 'FFG'];
    const type = types[Math.floor(Math.random() * types.length)];
    SIM.navyShips.push({
        x, y,
        targetX: x, targetY: y,
        patrolling: true,
        intercepting: null, // target Iran boat
        speed: 0.001,
        id: 'USN-' + type + '-' + Math.random().toString(36).substr(2, 3).toUpperCase(),
        type,
        readiness: 100,
    });
}

function spawnIranBoat(x, y) {
    SIM.iranBoats.push({
        x, y,
        targetX: x, targetY: y,
        aggressive: SIM.iranAggression > 50,
        speed: 0.0015,
        id: 'IRGCN-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        targeting: null, // tanker being targeted
        fleeing: false,
    });
}

function tickSimulation() {
    if (SIM.speed === 0 || SIM.gameOver) return;

    SIM.hour++;
    if (SIM.hour >= 24) {
        SIM.hour = 0;
        SIM.day++;
        dailyUpdate();
        checkWinLose();
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
            t.progress = 0;
        }
    }

    // Entity interactions — Iran boats target tankers
    updateIranBoatBehavior();

    // Entity interactions — Navy intercepts Iran boats
    updateNavyBehavior();

    // Move navy ships
    for (const ship of SIM.navyShips) {
        ship.x += (ship.targetX - ship.x) * 0.02 * SIM.speed;
        ship.y += (ship.targetY - ship.y) * 0.02 * SIM.speed;
    }

    // Move Iran boats
    for (const boat of SIM.iranBoats) {
        const moveSpeed = boat.fleeing ? 0.04 : 0.025;
        boat.x += (boat.targetX - boat.x) * moveSpeed * SIM.speed;
        boat.y += (boat.targetY - boat.y) * moveSpeed * SIM.speed;
    }

    // Update visual effects
    SIM.effects = SIM.effects.filter(e => {
        e.life -= SIM.speed;
        return e.life > 0;
    });

    // Random events
    if (Math.random() < 0.003 * SIM.speed) {
        triggerRandomEvent();
    }

    // Iran provocations based on aggression level
    if (Math.random() < (SIM.iranAggression / 5000) * SIM.speed) {
        triggerIranProvocation();
    }

    // Crisis escalation
    if (SIM.tension > 80 && Math.random() < 0.001 * SIM.speed) {
        escalateCrisis();
    }

    // Mine hazards — tankers hitting mines
    updateMineHazards();

    // Move drones
    for (const drone of SIM.drones) {
        drone.angle += 0.002 * SIM.speed;
        drone.x = drone.cx + Math.cos(drone.angle) * drone.radius;
        drone.y = drone.cy + Math.sin(drone.angle) * drone.radius;
    }

    // Move carrier
    if (SIM.carrier) {
        SIM.carrier.x += (SIM.carrier.targetX - SIM.carrier.x) * 0.005 * SIM.speed;
        SIM.carrier.y += (SIM.carrier.targetY - SIM.carrier.y) * 0.005 * SIM.speed;
        if (Math.random() < 0.01) {
            SIM.carrier.targetX = 0.65 + Math.random() * 0.15;
            SIM.carrier.targetY = 0.60 + Math.random() * 0.10;
        }
    }
}

function updateMineHazards() {
    for (const mine of SIM.mines) {
        if (mine.detonated) continue;
        for (const t of SIM.tankers) {
            if (t.seized || t.damaged) continue;
            const pos = getLanePosition(t.lane, t.progress);
            const dx = pos.x - mine.x;
            const dy = pos.y - mine.y;
            if (Math.sqrt(dx * dx + dy * dy) < 0.025) {
                // Mine hit!
                mine.detonated = true;
                t.damaged = true;
                t.speed *= 0.3;
                SIM.tension += 8;
                SIM.oilFlow = Math.max(10, SIM.oilFlow - 4);
                SIM.oilPrice += 5;
                logEvent(`Tanker ${t.id} strikes a mine near the strait! Vessel damaged.`, 'critical');
                spawnEffect(mine.x, mine.y, 'explosion');
            }
        }
    }
    // Remove detonated mines
    SIM.mines = SIM.mines.filter(m => !m.detonated);
}

function updateIranBoatBehavior() {
    const blockadePolicy = POLICIES.find(p => p.id === 'blockade_response');
    const blockadeLevel = blockadePolicy ? blockadePolicy.level : 0;

    for (const boat of SIM.iranBoats) {
        boat.aggressive = SIM.iranAggression > 40;

        if (boat.fleeing) {
            // Flee toward Iran coast
            boat.targetX = 0.4 + Math.random() * 0.2;
            boat.targetY = 0.25;
            if (boat.y < 0.30) boat.fleeing = false;
            continue;
        }

        if (boat.aggressive && !boat.targeting && Math.random() < 0.005 * SIM.speed) {
            // Find nearest tanker in the strait area
            let nearest = null;
            let nearDist = Infinity;
            for (const t of SIM.tankers) {
                if (t.seized) continue;
                const pos = getLanePosition(t.lane, t.progress);
                // Only target tankers near the strait
                if (pos.x < 0.3 || pos.x > 0.75) continue;
                const dx = pos.x - boat.x;
                const dy = pos.y - boat.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearDist) {
                    nearDist = dist;
                    nearest = t;
                }
            }
            if (nearest && nearDist < 0.2) {
                boat.targeting = nearest.id;
            }
        }

        if (boat.targeting) {
            const tanker = SIM.tankers.find(t => t.id === boat.targeting);
            if (!tanker || tanker.seized) {
                boat.targeting = null;
            } else {
                const pos = getLanePosition(tanker.lane, tanker.progress);
                boat.targetX = pos.x;
                boat.targetY = pos.y;

                // Check if close enough to seize
                const dx = pos.x - boat.x;
                const dy = pos.y - boat.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 0.03) {
                    // Check if navy is nearby to prevent
                    const navyNear = SIM.navyShips.some(s => {
                        const ndx = s.x - boat.x;
                        const ndy = s.y - boat.y;
                        return Math.sqrt(ndx * ndx + ndy * ndy) < 0.08;
                    });

                    if (navyNear && blockadeLevel >= 2) {
                        // Navy prevents seizure
                        boat.fleeing = true;
                        boat.targeting = null;
                        SIM.interceptCount++;
                        logEvent(`USN forces intercept ${boat.id} before it could seize ${tanker.id}.`, 'good');
                        spawnEffect(boat.x, boat.y, 'intercept');
                    } else {
                        // Seize tanker
                        tanker.seized = true;
                        boat.targeting = null;
                        SIM.seizureCount++;
                        SIM.tension = Math.min(100, SIM.tension + 12);
                        SIM.oilFlow = Math.max(10, SIM.oilFlow - 5);
                        SIM.consecutiveProvocations++;
                        logEvent(`IRGC Navy seizes tanker ${tanker.id} (${tanker.flag}-flagged)! Oil markets react.`, 'critical');
                        spawnEffect(boat.x, boat.y, 'seizure');
                    }
                }
            }
        } else {
            // Random patrol near strait
            if (Math.random() < 0.03) {
                boat.targetX = 0.35 + Math.random() * 0.3;
                boat.targetY = 0.3 + Math.random() * 0.2;
            }
        }
    }
}

function updateNavyBehavior() {
    const blockadePolicy = POLICIES.find(p => p.id === 'blockade_response');
    const blockadeLevel = blockadePolicy ? blockadePolicy.level : 0;

    for (const ship of SIM.navyShips) {
        // Look for aggressive Iran boats to intercept
        if (blockadeLevel >= 1 && !ship.intercepting) {
            let closest = null;
            let closeDist = Infinity;
            for (const boat of SIM.iranBoats) {
                if (boat.fleeing) continue;
                if (boat.targeting || boat.aggressive) {
                    const dx = ship.x - boat.x;
                    const dy = ship.y - boat.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < closeDist) {
                        closeDist = dist;
                        closest = boat;
                    }
                }
            }
            if (closest && closeDist < 0.3) {
                ship.intercepting = closest.id;
                ship.patrolling = false;
            }
        }

        if (ship.intercepting) {
            const target = SIM.iranBoats.find(b => b.id === ship.intercepting);
            if (!target || target.fleeing) {
                ship.intercepting = null;
                ship.patrolling = true;
            } else {
                ship.targetX = target.x;
                ship.targetY = target.y;

                // If close enough and high blockade level, force them to flee
                const dx = ship.x - target.x;
                const dy = ship.y - target.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 0.05 && blockadeLevel >= 3) {
                    target.fleeing = true;
                    target.targeting = null;
                    ship.intercepting = null;
                    ship.patrolling = true;
                    SIM.interceptCount++;
                    logEvent(`${ship.id} forces ${target.id} to withdraw from shipping lanes.`, 'good');
                    spawnEffect(ship.x, ship.y, 'intercept');
                }
            }
        }

        if (ship.patrolling) {
            if (Math.random() < 0.02) {
                ship.targetX = 0.35 + Math.random() * 0.35;
                ship.targetY = 0.45 + Math.random() * 0.25;
            }
        }
    }
}

function spawnEffect(x, y, type) {
    SIM.effects.push({
        x, y, type,
        life: 60,     // frames
        maxLife: 60,
    });
}

function dailyUpdate() {
    const tensionDelta = getAggregateEffect('tension');
    const protectionBonus = getAggregateEffect('oilFlowProtection');
    const priceDelta = getAggregateEffect('oilPrice');
    const approvalDelta = getAggregateEffect('approval');
    const aggressionDelta = getAggregateEffect('iranAggression');
    const costDelta = getAggregateEffect('cost');

    // Character bonus: Trump reduces sanctions cost
    let adjustedCost = costDelta;
    const sanctionsPolicy = POLICIES.find(p => p.id === 'sanctions');
    if (sanctionsPolicy && sanctionsPolicy.level > 0 && typeof getCharacterBonus === 'function') {
        const costMult = getCharacterBonus('sanctionsCostMult');
        if (costMult > 0) {
            const sanctionsCost = sanctionsPolicy.effects.cost ? sanctionsPolicy.effects.cost[sanctionsPolicy.level] : 0;
            adjustedCost -= sanctionsCost * (1 - costMult);
        }
    }

    // Deduct daily budget
    SIM.budget -= adjustedCost;

    // Tension drifts toward policy-driven level
    const targetTension = Math.max(0, Math.min(100, 15 + tensionDelta));
    SIM.tension += (targetTension - SIM.tension) * 0.1;

    // Crisis amplifies tension
    SIM.tension += SIM.crisisLevel * 2;

    // Consecutive provocations compound tension
    if (SIM.consecutiveProvocations > 0) {
        SIM.tension += SIM.consecutiveProvocations * 1.5;
        SIM.consecutiveProvocations = Math.max(0, SIM.consecutiveProvocations - 0.5);
    }

    // Oil flow affected by tension, protected by policies
    const baseFlow = 100 - (SIM.tension * 0.5);
    SIM.oilFlow = Math.max(10, Math.min(100, baseFlow + protectionBonus * 0.3));

    // Seized tankers reduce flow
    const seizedCount = SIM.tankers.filter(t => t.seized).length;
    SIM.oilFlow = Math.max(10, SIM.oilFlow - seizedCount * 3);

    // Oil price reacts to flow disruption
    const targetPrice = 80 + (100 - SIM.oilFlow) * 1.5 + priceDelta;
    SIM.oilPrice += (targetPrice - SIM.oilPrice) * 0.15;

    // Approval
    const targetApproval = Math.max(0, Math.min(100, 72 + approvalDelta));
    SIM.approval += (targetApproval - SIM.approval) * 0.08;

    // Seizures hurt approval
    if (seizedCount > 0) SIM.approval -= seizedCount * 0.5;

    // Successful intercepts boost approval slightly
    if (SIM.interceptCount > 0) {
        SIM.approval += Math.min(SIM.interceptCount * 0.3, 2);
    }

    // Iran aggression
    SIM.iranAggression = Math.max(0, Math.min(100, SIM.iranAggression + aggressionDelta * 0.05));

    // Low economy makes Iran more desperate/aggressive
    if (SIM.iranEconomy < 30) {
        SIM.iranAggression += 0.5;
    }

    // Update Iran economy from sanctions
    const econDelta = getAggregateEffect('iranEconomy');
    SIM.iranEconomy = Math.max(0, Math.min(100, SIM.iranEconomy + econDelta * 0.02));

    // Conflict risk
    SIM.conflictRisk = Math.max(0, Math.min(100,
        SIM.tension * 0.4 + SIM.iranAggression * 0.3 + getAggregateEffect('conflictRisk') + SIM.crisisLevel * 10
    ));

    // Fog of war slowly increases without intel
    const fogDelta = getAggregateEffect('fogOfWar');
    const fogMult = typeof getCharacterBonus === 'function' ? (getCharacterBonus('fogReduction') || 1) : 1;
    SIM.fogOfWar = Math.max(0, Math.min(100, SIM.fogOfWar + 1 + fogDelta * 0.05 * fogMult));

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
    const targetBoats = Math.floor(SIM.iranAggression / 12);
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

    // Release seized tankers after a while (Iran releases them for PR)
    for (const t of SIM.tankers) {
        if (t.seized && Math.random() < 0.1) {
            t.seized = false;
            logEvent(`Iran releases tanker ${t.id} after international pressure.`, 'good');
        }
    }

    // Aircraft carrier — appears at full naval deployment
    const navyLevel = navyPolicy ? navyPolicy.level : 0;
    if (navyLevel >= 3 && !SIM.carrier) {
        SIM.carrier = {
            x: 0.85, y: 0.75,
            targetX: 0.70, targetY: 0.65,
            id: 'USS-EISENHOWER',
        };
        logEvent('USS Eisenhower carrier strike group enters the Gulf of Oman.', 'warning');
    } else if (navyLevel < 3 && SIM.carrier) {
        logEvent('Carrier strike group withdraws from the region.', 'normal');
        SIM.carrier = null;
    }

    // Iran mines — deployed during crisis
    if (SIM.crisisLevel >= 2 && SIM.mines.length < 5 && Math.random() < 0.3) {
        const mx = 0.38 + Math.random() * 0.22;
        const my = 0.44 + Math.random() * 0.12;
        SIM.mines.push({ x: mx, y: my, detonated: false });
        if (SIM.fogOfWar < 50) {
            logEvent('Intelligence detects Iranian mine-laying activity in the strait.', 'critical');
        }
    }

    // Drones — from intel ops
    const intelPolicy = POLICIES.find(p => p.id === 'intel_ops');
    const intelLevel = intelPolicy ? intelPolicy.level : 0;
    const targetDrones = [0, 1, 2, 4][intelLevel];
    while (SIM.drones.length < targetDrones) {
        const cx = 0.3 + Math.random() * 0.4;
        const cy = 0.35 + Math.random() * 0.25;
        SIM.drones.push({
            x: cx, y: cy, cx, cy,
            radius: 0.05 + Math.random() * 0.08,
            angle: Math.random() * Math.PI * 2,
            id: 'RQ-' + Math.random().toString(36).substr(2, 3).toUpperCase(),
        });
    }
    while (SIM.drones.length > targetDrones) {
        SIM.drones.pop();
    }

    // Drones reveal mines
    if (SIM.drones.length > 0) {
        for (const mine of SIM.mines) {
            for (const drone of SIM.drones) {
                const dx = drone.x - mine.x;
                const dy = drone.y - mine.y;
                if (Math.sqrt(dx * dx + dy * dy) < 0.1 && Math.random() < 0.2) {
                    mine.detonated = true; // swept
                    logEvent('Drone surveillance locates and neutralizes a naval mine.', 'good');
                    spawnEffect(mine.x, mine.y, 'intercept');
                }
            }
        }
        SIM.mines = SIM.mines.filter(m => !m.detonated);
    }

    // Crisis decay
    if (SIM.crisisTimer > 0) {
        SIM.crisisTimer--;
    } else if (SIM.crisisLevel > 0 && SIM.tension < 40) {
        SIM.crisisLevel = Math.max(0, SIM.crisisLevel - 1);
        if (SIM.crisisLevel === 0) {
            logEvent('Crisis de-escalated. Tensions returning to baseline.', 'good');
        }
    }

    // Day milestones
    if (SIM.day === 30) {
        logEvent('One month into the crisis. International media focus intensifies.', 'warning');
    } else if (SIM.day === 60) {
        logEvent('Two months. Congress demands a status briefing.', 'warning');
    } else if (SIM.day === 80) {
        logEvent('Day 80. Just 10 more days to stabilize the situation.', 'warning');
    }
}

function checkWinLose() {
    if (SIM.gameOver) return;

    // Lose: War breaks out
    if (SIM.conflictRisk >= 95) {
        endGame(false, 'Armed conflict erupted in the Strait of Hormuz. A regional war has begun.');
        return;
    }

    // Lose: Oil crisis
    if (SIM.oilFlow <= 15 && SIM.day > 5) {
        endGame(false, 'Oil flow through the strait has collapsed. Global economic crisis declared.');
        return;
    }

    // Lose: Political collapse
    if (SIM.approval <= 10 && SIM.day > 10) {
        endGame(false, 'US global approval has collapsed. Administration forced to withdraw from the region.');
        return;
    }

    // Lose: Budget depleted
    if (SIM.budget <= -500) {
        endGame(false, 'Military budget overrun. Congress forces a withdrawal of all forces.');
        return;
    }

    // Win: Survived long enough with situation stable
    if (SIM.day >= SIM.victoryDay) {
        if (SIM.tension < 50 && SIM.oilFlow > 60 && SIM.approval > 40) {
            endGame(true, 'You successfully navigated the crisis for 90 days. The strait remains open.');
        } else if (SIM.day >= SIM.victoryDay + 15) {
            // Extended deadline if metrics are borderline
            endGame(true, 'After 105 days, the situation has stabilized enough for a diplomatic resolution.');
        }
    }
}

function endGame(won, reason) {
    SIM.gameOver = true;
    SIM.gameWon = won;
    SIM.gameOverReason = reason;
    SIM.speed = 0;
    logEvent(reason, won ? 'good' : 'critical');
    showGameOverScreen();
}

function escalateCrisis() {
    if (SIM.crisisLevel >= 3) return;

    SIM.crisisLevel++;
    SIM.crisisTimer = 10; // 10 days before it can de-escalate

    const crisisEvents = [
        { level: 1, text: 'CRISIS: Iran deploys additional naval assets to the strait.', tension: 10 },
        { level: 2, text: 'MAJOR CRISIS: Iran announces mining of shipping channels.', tension: 20 },
        { level: 3, text: 'WAR FOOTING: Iran mobilizes ground forces along the coast. Conflict imminent.', tension: 30 },
    ];

    const crisis = crisisEvents.find(c => c.level === SIM.crisisLevel);
    if (crisis) {
        SIM.tension = Math.min(100, SIM.tension + crisis.tension);
        logEvent(crisis.text, 'critical');
        spawnEffect(0.45, 0.40, 'crisis');
    }
}

function triggerRandomEvent() {
    const events = [
        { text: 'Oil markets react to regional instability.', effect: () => { SIM.oilPrice += 3; }, level: 'warning' },
        { text: 'Allied nations express concern over strait security.', effect: () => { SIM.approval -= 2; }, level: 'warning' },
        { text: 'Diplomatic back-channel shows promise.', effect: () => { SIM.tension -= 3; SIM.diplomaticCapital += 2; }, level: 'good' },
        { text: 'Commercial shipping companies reroute around Cape of Good Hope.', effect: () => { SIM.oilFlow -= 5; SIM.oilPrice += 5; }, level: 'critical' },
        { text: 'Gulf states increase oil production to stabilize markets.', effect: () => { SIM.oilPrice -= 4; }, level: 'good' },
        { text: 'UN Security Council calls emergency session on strait tensions.', effect: () => { SIM.approval += 3; }, level: 'warning' },
        { text: 'Insurance premiums for strait transit increase sharply.', effect: () => { SIM.oilPrice += 2; }, level: 'warning' },
        { text: 'China urges restraint from all parties. Offers mediation.', effect: () => { SIM.tension -= 2; SIM.approval += 1; }, level: 'good' },
        { text: 'Oil tanker reports suspicious drone activity near the strait.', effect: () => { SIM.tension += 3; }, level: 'warning' },
        { text: 'US allies pledge additional naval support.', effect: () => { SIM.approval += 4; SIM.oilFlow += 2; }, level: 'good' },
        { text: 'Iranian hardliners call for retaliation against sanctions.', effect: () => { SIM.iranAggression += 5; }, level: 'warning' },
        { text: 'Global oil reserves report shows healthy stockpiles.', effect: () => { SIM.oilPrice -= 3; }, level: 'good' },
        { text: 'Cyber attack detected targeting regional infrastructure.', effect: () => { SIM.tension += 4; SIM.fogOfWar += 5; }, level: 'critical' },
        { text: 'Iranian moderates push for diplomatic solution internally.', effect: () => { SIM.iranAggression -= 3; }, level: 'good' },
        { text: 'Saudi Arabia increases security around oil facilities.', effect: () => { SIM.oilFlow += 1; }, level: 'normal' },
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
        { text: 'Iranian drone flies close to US carrier group.', tension: 6, level: 'critical' },
        { text: 'Iran announces new military exercises in the Persian Gulf.', tension: 4, level: 'warning' },
        { text: 'IRGC deploys fast attack boats in shipping lane.', tension: 5, level: 'warning' },
    ];

    const prov = provocations[Math.floor(Math.random() * provocations.length)];
    SIM.tension = Math.min(100, SIM.tension + prov.tension);
    if (prov.oilFlow) SIM.oilFlow = Math.max(10, SIM.oilFlow + prov.oilFlow);
    SIM.consecutiveProvocations++;
    logEvent(prov.text, prov.level);
}

function logEvent(text, level = 'normal') {
    const entry = { day: SIM.day, hour: SIM.hour, text, level };
    SIM.eventLog.push(entry);
    if (SIM.eventLog.length > 100) SIM.eventLog.shift();
    return entry;
}

// Entity selection via click
function handleMapClick(canvasX, canvasY, w, h) {
    const mx = canvasX / w;
    const my = canvasY / h;
    const clickRadius = 0.03;

    SIM.selectedEntity = null;
    SIM.selectedType = null;

    // Check navy ships
    for (const ship of SIM.navyShips) {
        const dx = ship.x - mx;
        const dy = ship.y - my;
        if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
            SIM.selectedEntity = ship;
            SIM.selectedType = 'navy';
            return;
        }
    }

    // Check Iran boats
    for (const boat of SIM.iranBoats) {
        const dx = boat.x - mx;
        const dy = boat.y - my;
        if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
            SIM.selectedEntity = boat;
            SIM.selectedType = 'iran';
            return;
        }
    }

    // Check tankers
    for (const t of SIM.tankers) {
        const pos = getLanePosition(t.lane, t.progress);
        const dx = pos.x - mx;
        const dy = pos.y - my;
        if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
            SIM.selectedEntity = t;
            SIM.selectedType = 'tanker';
            return;
        }
    }

    // Check platforms
    for (const p of SIM.platforms) {
        const dx = p.x - mx;
        const dy = p.y - my;
        if (Math.sqrt(dx * dx + dy * dy) < 0.04) {
            SIM.selectedEntity = p;
            SIM.selectedType = 'platform';
            return;
        }
    }
}
