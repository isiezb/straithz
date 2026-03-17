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

    // Tycoon management layer
    decisionEventActive: false,
    decisionHistory: [],
    lastDecisionDay: 0,
    metricHistory: [],
    weeklyReportActive: false,

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
    const readinessBonus = getCharacterBonus('readinessBonus') || 0;
    SIM.navyShips.push({
        x, y,
        targetX: x, targetY: y,
        patrolling: true,
        intercepting: null, // target Iran boat
        speed: 0.001,
        id: 'USN-' + type + '-' + Math.random().toString(36).substr(2, 3).toUpperCase(),
        type,
        readiness: Math.min(100, 100 + readinessBonus),
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

    // Update policy cooldowns (Kushner bonus reduces diplomacy cooldowns faster)
    const diplomacyCooldownReduction = getCharacterBonus('diplomacyCooldownReduction') || 0;
    for (const p of POLICIES) {
        if (p.cooldown > 0 && SIM.hour === 0) {
            p.cooldown--;
            if (p.id === 'diplomacy' && diplomacyCooldownReduction > 0 && p.cooldown > 0) {
                p.cooldown = Math.max(0, p.cooldown - (diplomacyCooldownReduction / p.cooldownMax));
            }
        }
    }

    // Move tankers
    for (let i = SIM.tankers.length - 1; i >= 0; i--) {
        const t = SIM.tankers[i];
        if (t.seized) continue;
        t.progress += t.speed * SIM.speed;
        if (t.progress >= 1) {
            // Remove and respawn a fresh tanker
            SIM.tankers.splice(i, 1);
            spawnTanker();
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
                    const navyNearRange = 0.08 * (getCharacterBonus('interceptRange') || 1);
                    const navyNear = SIM.navyShips.some(s => {
                        const ndx = s.x - boat.x;
                        const ndy = s.y - boat.y;
                        return Math.sqrt(ndx * ndx + ndy * ndy) < navyNearRange;
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
            const interceptRange = 0.3 * (getCharacterBonus('interceptRange') || 1);
            if (closest && closeDist < interceptRange) {
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

function calculateRating() {
    const oilScore = Math.min(100, SIM.oilFlow);
    const approvalScore = Math.min(100, SIM.approval);
    const tensionScore = 100 - Math.min(100, SIM.tension);
    const riskScore = 100 - Math.min(100, SIM.conflictRisk);
    const budgetScore = Math.min(100, Math.max(0, SIM.budget / 10));

    const score = Math.round(
        oilScore * 0.25 + approvalScore * 0.20 + tensionScore * 0.25 + riskScore * 0.20 + budgetScore * 0.10
    );

    let grade, label;
    if (score >= 90) { grade = 'S'; label = 'Outstanding'; }
    else if (score >= 80) { grade = 'A'; label = 'Excellent'; }
    else if (score >= 65) { grade = 'B'; label = 'Good'; }
    else if (score >= 50) { grade = 'C'; label = 'Adequate'; }
    else if (score >= 35) { grade = 'D'; label = 'Poor'; }
    else { grade = 'F'; label = 'Failing'; }

    return { grade, label, score };
}

const DECISION_EVENTS = [
    {
        id: 'secret_talks', title: 'SECRET BACK-CHANNEL',
        description: 'Iranian moderates have reached out through Omani intermediaries. They propose secret talks in Muscat to de-escalate — but if leaked, hawks on both sides will be furious.',
        minDay: 5, maxDay: 40,
        condition: () => SIM.tension > 25 && SIM.diplomaticCapital > 20,
        choices: [
            { text: 'Accept the talks', effects: { tension: -12, approval: -5, diplomaticCapital: 15, iranAggression: -8 }, flavor: 'The back-channel opens quietly. Both sides agree to a cooling-off period.' },
            { text: 'Reject — too risky', effects: { tension: 3, iranAggression: 5 }, flavor: 'The opportunity passes. Iranian hardliners use the rejection as propaganda.' },
            { text: 'Leak it to the press', effects: { approval: 8, tension: 6, diplomaticCapital: -15 }, flavor: 'The story breaks worldwide. You gain public credit but burn the diplomatic bridge.' },
        ]
    },
    {
        id: 'congress_pressure', title: 'CONGRESSIONAL HEARING',
        description: 'The Senate Armed Services Committee demands testimony on spending in the strait. They threaten to cut your budget if you can\'t justify the costs.',
        minDay: 10, maxDay: 60,
        condition: () => getAggregateEffect('cost') > 100,
        choices: [
            { text: 'Justify with intelligence', effects: { approval: 5, budget: -20, fogOfWar: -10 }, flavor: 'You declassify key intel briefings. Congress is satisfied — for now.' },
            { text: 'Promise to cut spending', effects: { budget: 50, approval: 3 }, flavor: 'You pledge reductions. Congress relents, but expects follow-through.' },
            { text: 'Stonewall the committee', effects: { approval: -10, budget: 0 }, flavor: 'Refusing to cooperate backfires. Media coverage turns hostile.' },
        ]
    },
    {
        id: 'allied_request', title: 'ALLIED NAVAL REQUEST',
        description: 'Japan requests a dedicated US Navy escort for their tanker fleet through the strait. It would cost resources but strengthen the alliance.',
        minDay: 8, maxDay: 50,
        condition: () => SIM.navyShips.length > 0,
        choices: [
            { text: 'Assign escorts', effects: { approval: 10, oilFlow: 5, budget: -40, tension: 3 }, flavor: 'Japanese tankers now sail with USN escorts. Tokyo publicly thanks Washington.' },
            { text: 'Decline politely', effects: { approval: -3 }, flavor: 'Japan is disappointed but understanding. They increase their own naval presence.' },
        ]
    },
    {
        id: 'humanitarian', title: 'HUMANITARIAN CRISIS',
        description: 'An Iranian fishing vessel has capsized near the strait. 40 fishermen are in the water. Iranian rescue is 2 hours away; your destroyer is 15 minutes away.',
        minDay: 6, maxDay: 70,
        condition: () => SIM.navyShips.length > 0,
        choices: [
            { text: 'Rescue immediately', effects: { approval: 12, tension: -8, iranAggression: -5, diplomaticCapital: 10 }, flavor: 'Your sailors pull 38 survivors from the water. The footage goes viral worldwide.' },
            { text: 'Coordinate with Iran', effects: { approval: 3, tension: -3, diplomaticCapital: 5 }, flavor: 'You relay coordinates to Iranian coast guard. Joint effort saves most of the crew.' },
            { text: 'Stay on mission', effects: { approval: -8, tension: 2 }, flavor: 'Iranian state media reports US ships watched fishermen drown. International outrage follows.' },
        ]
    },
    {
        id: 'media_crisis', title: 'MEDIA FIRESTORM',
        description: 'Footage emerges of a US Navy vessel in a near-collision with an Iranian patrol boat. Cable news is running it 24/7. The Pentagon wants your response.',
        minDay: 12, maxDay: 80,
        condition: () => SIM.navyShips.length > 0 && SIM.iranBoats.length > 0,
        choices: [
            { text: 'Release full video', effects: { approval: 5, tension: -2 }, flavor: 'The unedited footage shows the Iranian boat\'s provocative approach. Narrative shifts in your favor.' },
            { text: 'Downplay the incident', effects: { approval: -3, tension: -5 }, flavor: 'The story fades from the news cycle. Both sides quietly move on.' },
            { text: 'Blame Iran publicly', effects: { approval: 3, tension: 8, iranAggression: 5 }, flavor: 'A forceful condemnation rallies domestic support but inflames Iran.' },
        ]
    },
    {
        id: 'intel_reveal', title: 'INTELLIGENCE BREAKTHROUGH',
        description: 'Your agents have identified the location of Iran\'s mine-laying operations. You can act on this intelligence — but doing so would burn the source.',
        minDay: 15, maxDay: 75,
        condition: () => SIM.fogOfWar < 60 && SIM.crisisLevel >= 1,
        choices: [
            { text: 'Strike the mine depot', effects: { tension: 15, iranAggression: 10, conflictRisk: 8 }, flavor: 'Cruise missiles destroy the depot. Iran is furious but mine threat is neutralized.' },
            { text: 'Share with allies quietly', effects: { approval: 5, fogOfWar: -15, diplomaticCapital: 8 }, flavor: 'Coalition partners quietly mine-sweep the identified areas. Source stays safe.' },
            { text: 'Hold the intelligence', effects: { fogOfWar: -8 }, flavor: 'You file it away for future use. The source continues to provide valuable intel.' },
        ]
    },
    {
        id: 'trade_deal', title: 'TRADE PROPOSAL',
        description: 'China proposes a backroom deal: they\'ll pressure Iran to stop provocations if you ease restrictions on Chinese tech firms. Commerce is interested.',
        minDay: 20, maxDay: 70,
        condition: () => SIM.tension > 30,
        choices: [
            { text: 'Accept the deal', effects: { tension: -10, iranAggression: -10, approval: -8 }, flavor: 'China delivers. Iran pulls back patrol boats. But the tech concessions draw domestic criticism.' },
            { text: 'Counter-propose', effects: { tension: -4, diplomaticCapital: -5 }, flavor: 'Negotiations drag on. Modest gains for both sides, nothing transformative.' },
            { text: 'Reject outright', effects: { approval: 5, tension: 3 }, flavor: 'Hawks applaud your firmness. China is annoyed but unsurprised.' },
        ]
    },
    {
        id: 'un_vote', title: 'UN RESOLUTION VOTE',
        description: 'A resolution condemning Iran\'s strait activities is up for vote. Russia will veto unless you water it down. The UK wants you to push the strong version.',
        minDay: 15, maxDay: 60,
        condition: () => SIM.tension > 20,
        choices: [
            { text: 'Push strong resolution', effects: { approval: 8, tension: 5, iranAggression: 3, diplomaticCapital: -10 }, flavor: 'Russia vetoes as expected. But the debate isolates Iran diplomatically.' },
            { text: 'Accept watered-down version', effects: { approval: 3, tension: -3, diplomaticCapital: 5 }, flavor: 'The resolution passes unanimously. Symbolic but it shows unity.' },
            { text: 'Withdraw the resolution', effects: { approval: -5, diplomaticCapital: -5 }, flavor: 'Allies are confused by the retreat. A missed opportunity.' },
        ]
    },
    {
        id: 'cyber_attack', title: 'CYBER OPERATION PROPOSAL',
        description: 'NSA presents a plan to disable Iran\'s naval command network for 48 hours. It would cripple their coordination — but if attributed, it\'s an act of war.',
        minDay: 25, maxDay: 80,
        condition: () => SIM.iranAggression > 40,
        choices: [
            { text: 'Approve the operation', effects: { iranAggression: -15, fogOfWar: -20, tension: 10, conflictRisk: 12 }, flavor: 'Iran\'s boats go silent for two days. They suspect sabotage but can\'t prove it.' },
            { text: 'Too dangerous — deny', effects: {}, flavor: 'You shelve the plan. Better to keep that card for a real emergency.' },
        ]
    },
    {
        id: 'hostage', title: 'HOSTAGE SITUATION',
        description: 'Iran is holding 12 crew members from a seized tanker. They want sanctions relief in exchange. The families are on every news channel.',
        minDay: 10, maxDay: 75,
        condition: () => SIM.seizureCount > 0,
        choices: [
            { text: 'Negotiate their release', effects: { approval: 8, tension: -5, diplomaticCapital: -10, budget: -30 }, flavor: 'After tense negotiations, the crew is released at Muscat airport. Emotional reunions follow.' },
            { text: 'Demand unconditional release', effects: { tension: 8, approval: 3, iranAggression: 5 }, flavor: 'You increase pressure. Iran doubles down but international opinion turns against them.' },
            { text: 'Offer quiet concession', effects: { tension: -8, approval: -5, iranAggression: -3 }, flavor: 'A minor sanctions waiver is quietly approved. The crew comes home. Nobody talks about the price.' },
        ]
    },
    {
        id: 'oil_spike', title: 'OIL MARKET PANIC',
        description: 'Oil futures just jumped $15/barrel on rumors of an imminent Iranian blockade. Energy Secretary is on the phone — should you release strategic reserves?',
        minDay: 8, maxDay: 80,
        condition: () => SIM.oilPrice > 100,
        choices: [
            { text: 'Release reserves', effects: { oilPrice: -12, budget: -50, approval: 5 }, flavor: 'The SPR release calms markets. Prices stabilize but your budget takes a hit.' },
            { text: 'Verbal intervention only', effects: { oilPrice: -4, approval: -2 }, flavor: 'Your press conference helps a little. Markets remain jittery.' },
            { text: 'Let markets correct', effects: { approval: -5 }, flavor: 'Critics call you out of touch as gas prices soar at home.' },
        ]
    },
    {
        id: 'gulf_coalition', title: 'GULF STATE OFFER',
        description: 'Saudi Arabia and UAE offer to fund 60% of your naval operations in the strait — but they want a say in targeting decisions and rules of engagement.',
        minDay: 12, maxDay: 55,
        condition: () => getAggregateEffect('cost') > 50,
        choices: [
            { text: 'Accept with conditions', effects: { budget: 80, approval: 5, tension: 3 }, flavor: 'The deal is struck. Gulf funding flows in. You retain operational control with a coordination cell.' },
            { text: 'Accept fully', effects: { budget: 120, approval: -3, tension: 5 }, flavor: 'The generous funding helps, but critics question who\'s really calling the shots.' },
            { text: 'Decline', effects: { approval: 3, diplomaticCapital: -5 }, flavor: 'You maintain independence but miss a chance to share the burden.' },
        ]
    },
    {
        id: 'drone_incident', title: 'DRONE SHOOT-DOWN',
        description: 'Iran just shot down one of your surveillance drones over international waters. Pentagon is furious. Joint Chiefs want a proportional response.',
        minDay: 15, maxDay: 80,
        condition: () => SIM.drones.length > 0,
        choices: [
            { text: 'Strike the missile battery', effects: { tension: 20, conflictRisk: 15, iranAggression: -10, approval: 5 }, flavor: 'Precision strike destroys the SAM site. Iran goes quiet. The world holds its breath.' },
            { text: 'Respond with more drones', effects: { tension: 5, fogOfWar: -15, approval: 2 }, flavor: 'You flood the area with drones, daring Iran to escalate further. They don\'t.' },
            { text: 'Stand down — it was unmanned', effects: { tension: -3, approval: -5, iranAggression: 5 }, flavor: 'You absorb the loss. Some call it wise restraint, others call it weakness.' },
        ]
    },
    {
        id: 'election_pressure', title: 'ELECTION YEAR PRESSURE',
        description: 'Your party is down in the polls. Campaign advisors want a dramatic move in the strait — something that looks strong on TV before midterms.',
        minDay: 30, maxDay: 75,
        condition: () => true,
        choices: [
            { text: 'Stage a naval exercise', effects: { tension: 8, approval: 10, iranAggression: 5, budget: -30 }, flavor: 'The carriers look great on camera. Polls bump 3 points. Iran calls it provocation.' },
            { text: 'Focus on diplomacy instead', effects: { tension: -5, approval: -3, diplomaticCapital: 8 }, flavor: 'Not flashy, but it\'s the right call. Pundits debate whether it\'s leadership or weakness.' },
            { text: 'Ignore the advisors', effects: {}, flavor: 'You stay the course. The polls are what they are.' },
        ]
    },
    {
        id: 'pipeline_sabotage', title: 'PIPELINE SABOTAGE',
        description: 'An underwater pipeline feeding a major export terminal has been damaged. Could be Iran, could be an accident. Repairs will take weeks.',
        minDay: 20, maxDay: 70,
        condition: () => SIM.crisisLevel >= 1,
        choices: [
            { text: 'Blame Iran, escalate', effects: { tension: 12, oilFlow: -8, approval: 3, iranAggression: 5 }, flavor: 'You attribute it to Iranian sabotage. The accusation rallies allies but stokes the fire.' },
            { text: 'Investigate first', effects: { oilFlow: -5, fogOfWar: -8 }, flavor: 'A measured response. The investigation will take time but you keep options open.' },
            { text: 'Offer joint investigation', effects: { tension: -5, oilFlow: -5, diplomaticCapital: 8 }, flavor: 'Surprisingly, Iran agrees. The process is slow but builds a thread of trust.' },
        ]
    },
];

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

    // Diplomatic capital moderates tension (high capital = better de-escalation)
    const dipBonus = (SIM.diplomaticCapital - 50) * 0.05; // -2.5 to +2.5
    const targetTension = Math.max(0, Math.min(100, 15 + tensionDelta - dipBonus));
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

    // Approval (Fuentes bonus reduces approval loss from military actions)
    const approvalLossMult = getCharacterBonus('approvalLossMult') || 1;
    const adjustedApprovalDelta = approvalDelta < 0 ? approvalDelta * approvalLossMult : approvalDelta;
    const targetApproval = Math.max(0, Math.min(100, 72 + adjustedApprovalDelta));
    SIM.approval += (targetApproval - SIM.approval) * 0.08;

    // Seizures hurt approval
    if (seizedCount > 0) SIM.approval -= seizedCount * 0.5 * approvalLossMult;

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

    // Update Iran economy from sanctions (Trump bonus amplifies)
    const econDelta = getAggregateEffect('iranEconomy');
    const econMult = getCharacterBonus('sanctionsEconMult') || 1;
    SIM.iranEconomy = Math.max(0, Math.min(100, SIM.iranEconomy + econDelta * 0.02 * econMult));

    // Conflict risk
    SIM.conflictRisk = Math.max(0, Math.min(100,
        SIM.tension * 0.4 + SIM.iranAggression * 0.3 + getAggregateEffect('conflictRisk') + SIM.crisisLevel * 10
    ));

    // Fog of war slowly increases without intel (Asmongold bonus reduces both passive growth and policy fog)
    const fogDelta = getAggregateEffect('fogOfWar');
    const fogMult = getCharacterBonus('fogReduction') || 1;
    const passiveFogGrowth = 1 / fogMult; // Asmongold: 1/1.25 = 0.8 instead of 1
    SIM.fogOfWar = Math.max(0, Math.min(100, SIM.fogOfWar + passiveFogGrowth + fogDelta * 0.05 * fogMult));

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

    // Push metric snapshot for weekly reports
    SIM.metricHistory.push({
        day: SIM.day,
        oilFlow: SIM.oilFlow,
        oilPrice: SIM.oilPrice,
        tension: SIM.tension,
        approval: SIM.approval,
        conflictRisk: SIM.conflictRisk,
        budget: SIM.budget,
        rating: calculateRating(),
    });

    // Decision events — probability-based, min 4-day spacing
    if (!SIM.decisionEventActive && !SIM.weeklyReportActive && SIM.day - SIM.lastDecisionDay >= 4 && Math.random() < 0.25) {
        const usedIds = SIM.decisionHistory.map(d => d.id);
        const eligible = DECISION_EVENTS.filter(e =>
            !usedIds.includes(e.id) &&
            SIM.day >= e.minDay && SIM.day <= e.maxDay &&
            e.condition()
        );
        if (eligible.length > 0) {
            const event = eligible[Math.floor(Math.random() * eligible.length)];
            SIM.decisionEventActive = true;
            SIM.lastDecisionDay = SIM.day;
            setSpeed(0);
            showDecisionEvent(event);
        }
    }

    // Weekly report — every 7 days
    if (SIM.day % 7 === 0 && SIM.day > 1 && !SIM.decisionEventActive && !SIM.weeklyReportActive) {
        SIM.weeklyReportActive = true;
        setSpeed(0);
        showWeeklyReport();
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
    // Dismiss any active popups
    SIM.decisionEventActive = false;
    SIM.weeklyReportActive = false;
    const decOverlay = document.getElementById('decision-overlay');
    if (decOverlay) decOverlay.remove();
    const weekOverlay = document.getElementById('weekly-report-overlay');
    if (weekOverlay) weekOverlay.remove();
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
    if (typeof showToast === 'function' && (level === 'critical' || level === 'warning' || level === 'good')) {
        showToast(text, level);
    }
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
