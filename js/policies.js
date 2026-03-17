/**
 * Policy System — extensible registry of US policies
 * Each policy has effects on simulation variables.
 * To add a new policy, just push to POLICIES array.
 */

const POLICIES = [
    {
        id: 'naval_deployment',
        name: 'Naval Deployment',
        icon: 'assets/icon-naval.png',
        description: 'Deploy US Navy carrier strike group to the strait.',
        active: false,
        level: 0,       // 0-3 intensity
        maxLevel: 3,
        levelLabels: ['None', 'Patrol', 'Show of Force', 'Full Deployment'],
        effects: {
            tension: [0, 10, 25, 45],
            oilFlowProtection: [0, 5, 15, 25],
            approval: [0, -2, -8, -15],
            iranAggression: [0, -5, -15, 10],  // full deployment provokes
            cost: [0, 50, 200, 500],            // $M/day
        },
        cooldown: 0,
        cooldownMax: 5,  // days before can change
    },
    {
        id: 'sanctions',
        name: 'Economic Sanctions',
        icon: 'assets/icon-sanctions.png',
        description: 'Impose or tighten economic sanctions on Iran.',
        active: false,
        level: 0,
        maxLevel: 3,
        levelLabels: ['None', 'Targeted', 'Broad', 'Maximum Pressure'],
        effects: {
            tension: [0, 8, 20, 40],
            oilPrice: [0, 5, 15, 30],           // $/barrel increase
            approval: [0, 5, 0, -10],
            iranAggression: [0, 5, 15, 30],
            iranEconomy: [0, -10, -25, -50],
            cost: [0, 10, 30, 60],
        },
        cooldown: 0,
        cooldownMax: 10,
    },
    {
        id: 'diplomacy',
        name: 'Diplomatic Engagement',
        icon: 'assets/icon-diplomacy.png',
        description: 'Open diplomatic channels and negotiations with Iran.',
        active: false,
        level: 0,
        maxLevel: 3,
        levelLabels: ['None', 'Back-channel', 'Direct Talks', 'Summit'],
        effects: {
            tension: [0, -5, -15, -30],
            approval: [0, 5, 10, 15],
            iranAggression: [0, -3, -10, -20],
            oilFlowProtection: [0, 2, 5, 8],
            diplomaticCapital: [0, -5, -15, -30],
        },
        cooldown: 0,
        cooldownMax: 7,
    },
    {
        id: 'blockade_response',
        name: 'Blockade Response',
        icon: 'assets/icon-blockade.png',
        description: 'Rules of engagement for responding to shipping interference.',
        active: false,
        level: 0,
        maxLevel: 3,
        levelLabels: ['Passive', 'Defensive', 'Escort Ops', 'Active Intercept'],
        effects: {
            tension: [0, 5, 15, 35],
            oilFlowProtection: [0, 10, 20, 35],
            approval: [0, 3, -3, -12],
            iranAggression: [0, -2, -8, 15],     // active intercept escalates
            conflictRisk: [0, 2, 8, 25],
        },
        cooldown: 0,
        cooldownMax: 3,
    },
    {
        id: 'coalition_building',
        name: 'Coalition Building',
        icon: 'assets/icon-naval.png',
        description: 'Build international maritime coalition for strait security.',
        active: false,
        level: 0,
        maxLevel: 3,
        levelLabels: ['None', 'Outreach', 'Joint Patrols', 'Full Coalition'],
        effects: {
            tension: [0, 2, 5, 8],
            oilFlowProtection: [0, 8, 18, 30],
            approval: [0, 8, 15, 20],
            iranAggression: [0, -2, -8, -15],
            cost: [0, 20, 80, 150],
        },
        cooldown: 0,
        cooldownMax: 14,
    },
    {
        id: 'intel_ops',
        name: 'Intelligence Operations',
        icon: 'assets/icon-sanctions.png',
        description: 'Covert surveillance and intelligence gathering in the region.',
        active: false,
        level: 0,
        maxLevel: 3,
        levelLabels: ['None', 'SIGINT', 'HUMINT', 'Full Spectrum'],
        effects: {
            tension: [0, 0, 3, 8],
            fogOfWar: [0, -15, -30, -50],
            iranAggression: [0, -2, -5, -8],
            approval: [0, 0, -3, -8],
            cost: [0, 10, 40, 100],
        },
        cooldown: 0,
        cooldownMax: 5,
    },
    // -- Unlockable Policies --
    {
        id: 'cyber_warfare',
        name: 'Cyber Warfare',
        icon: 'assets/icon-sanctions.png',
        description: 'Offensive and defensive cyber operations against Iranian networks.',
        active: false,
        level: 0,
        maxLevel: 3,
        levelLabels: ['None', 'Defensive', 'Offensive', 'Full Spectrum'],
        effects: {
            iranAggression: [0, -5, -12, -20],
            fogOfWar: [0, -10, -20, -35],
            tension: [0, 3, 10, 20],
            conflictRisk: [0, 2, 8, 18],
            cost: [0, 15, 50, 120],
        },
        cooldown: 0,
        cooldownMax: 7,
        locked: true,
        unlockHint: 'Unlocks at Day 15 or when Iran aggression exceeds 50',
        unlockCondition() { return SIM.day >= 15 || SIM.iranAggression > 50; },
    },
    {
        id: 'media_campaign',
        name: 'Media Campaign',
        icon: 'assets/icon-diplomacy.png',
        description: 'Coordinate domestic and international messaging strategy.',
        active: false,
        level: 0,
        maxLevel: 3,
        levelLabels: ['None', 'Domestic PR', 'International', 'Full Blitz'],
        effects: {
            approval: [0, 8, 15, 25],
            tension: [0, 1, 3, 5],
            cost: [0, 10, 30, 60],
            diplomaticCapital: [0, 3, 8, 15],
        },
        cooldown: 0,
        cooldownMax: 5,
        locked: true,
        unlockHint: 'Unlocks at Day 10 or when approval drops below 60',
        unlockCondition() { return SIM.day >= 10 || SIM.approval < 60; },
    },
    {
        id: 'humanitarian_aid',
        name: 'Humanitarian Aid',
        icon: 'assets/icon-diplomacy.png',
        description: 'Provide humanitarian assistance to affected civilian populations.',
        active: false,
        level: 0,
        maxLevel: 3,
        levelLabels: ['None', 'Medical Aid', 'Full Relief', 'Reconstruction'],
        effects: {
            approval: [0, 10, 18, 28],
            iranAggression: [0, -3, -8, -15],
            tension: [0, -3, -8, -12],
            cost: [0, 20, 60, 120],
            diplomaticCapital: [0, 5, 12, 20],
        },
        cooldown: 0,
        cooldownMax: 10,
        locked: true,
        unlockHint: 'Unlocks at Day 20 or after choosing a humanitarian decision',
        unlockCondition() { return SIM.day >= 20 || (SIM.decisionHistory && SIM.decisionHistory.some(d => d.id === 'humanitarian')); },
    },
    {
        id: 'strategic_reserves',
        name: 'Strategic Reserves',
        icon: 'assets/icon-blockade.png',
        description: 'Release oil from the Strategic Petroleum Reserve to stabilize markets.',
        active: false,
        level: 0,
        maxLevel: 3,
        levelLabels: ['None', 'Partial Release', 'Major Release', 'Emergency Dump'],
        effects: {
            oilPrice: [0, -8, -18, -30],
            oilFlowProtection: [0, 5, 12, 20],
            cost: [0, 40, 100, 200],
            approval: [0, 5, 8, 12],
        },
        cooldown: 0,
        cooldownMax: 14,
        locked: true,
        unlockHint: 'Unlocks at Day 8 or when oil price exceeds $110',
        unlockCondition() { return SIM.day >= 8 || SIM.oilPrice > 110; },
    },
];

/**
 * Get aggregate effect value across all active policies
 */
function getAggregateEffect(effectName) {
    let total = 0;
    for (const policy of POLICIES) {
        if (policy.locked) continue;
        if (policy.effects[effectName]) {
            total += policy.effects[effectName][policy.level] || 0;
        }
    }
    return total;
}

/**
 * Register a new policy at runtime
 */
function registerPolicy(policyDef) {
    POLICIES.push(policyDef);
}
