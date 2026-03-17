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
];

/**
 * Get aggregate effect value across all active policies
 */
function getAggregateEffect(effectName) {
    let total = 0;
    for (const policy of POLICIES) {
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
