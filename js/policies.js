/**
 * Strategy Cards — replaces continuous policy sliders
 * Player picks 3 cards per week from a hand of 5-6
 * Each card has Low/Medium/High funding levels
 */

const STRATEGY_CARDS = [
    // --- MILITARY ---
    {
        id: 'carrier_strike', name: 'Carrier Strike Group', category: 'military',
        description: 'Deploy carrier strike group to the Gulf of Oman.',
        hint: { low: 'Show the flag — moderate deterrence', medium: 'Full battle group — strong deterrence', high: 'Maximum projection — high cost, high risk' },
        effects: {
            low:    { navalPresence: 1, tension: 5, cost: 50, iranAggression: -3, domesticApproval: 2, internationalStanding: -1 },
            medium: { navalPresence: 2, tension: 12, cost: 200, iranAggression: -8, domesticApproval: 5, internationalStanding: -4, carrier: 1 },
            high:   { navalPresence: 3, tension: 25, cost: 500, iranAggression: 5, domesticApproval: 8, internationalStanding: -8, carrier: 1, warPath: 1 },
        },
    },
    {
        id: 'naval_patrol', name: 'Naval Patrol', category: 'military',
        description: 'Routine destroyer patrols through strait shipping lanes.',
        hint: { low: 'Light patrol presence', medium: 'Regular patrols with escort authority', high: 'Aggressive patrol with intercept orders' },
        effects: {
            low:    { navalPresence: 1, blockadeLevel: 1, tension: 2, cost: 30, oilFlowProtection: 5 },
            medium: { navalPresence: 2, blockadeLevel: 2, tension: 6, cost: 80, oilFlowProtection: 15, domesticApproval: 3 },
            high:   { navalPresence: 2, blockadeLevel: 3, tension: 12, cost: 150, oilFlowProtection: 25, iranAggression: 5 },
        },
    },
    {
        id: 'active_intercept', name: 'Active Intercept', category: 'military',
        description: 'Authorize aggressive rules of engagement against hostile vessels.',
        hint: { low: 'Warning shots only', medium: 'Disable hostile craft near tankers', high: 'Full combat authorization — one step from war' },
        effects: {
            low:    { blockadeLevel: 2, tension: 8, cost: 20, oilFlowProtection: 10, conflictRisk: 3 },
            medium: { blockadeLevel: 3, tension: 18, cost: 40, oilFlowProtection: 25, conflictRisk: 8, iranAggression: -5, warPath: 1 },
            high:   { blockadeLevel: 3, tension: 30, cost: 80, oilFlowProtection: 35, conflictRisk: 20, iranAggression: 8, warPath: 2, internationalStanding: -10 },
        },
    },
    {
        id: 'missile_strike', name: 'Precision Strike', category: 'military',
        description: 'Cruise missile strikes on Iranian military targets.',
        hint: { low: 'Strike radar sites', medium: 'Hit missile batteries and bases', high: 'Full degradation of coastal defenses' },
        effects: {
            low:    { tension: 20, cost: 60, iranAggression: -10, conflictRisk: 12, warPath: 1, domesticApproval: 3, internationalStanding: -8 },
            medium: { tension: 35, cost: 120, iranAggression: -20, conflictRisk: 20, warPath: 2, domesticApproval: 5, internationalStanding: -15 },
            high:   { tension: 50, cost: 200, iranAggression: -25, conflictRisk: 30, warPath: 3, domesticApproval: -3, internationalStanding: -25 },
        },
        exclusive: true,
    },
    {
        id: 'regional_deterrence', name: 'Regional Deterrence', category: 'military',
        description: 'Counter Iranian proxy forces — Houthis, militias, Hezbollah.',
        hint: { low: 'Intel sharing with allies', medium: 'Joint ops against proxies', high: 'Full suppression campaign' },
        effects: {
            low:    { proxyThreat: -8, cost: 25, tension: 2 },
            medium: { proxyThreat: -18, cost: 70, tension: 6, internationalStanding: -2 },
            high:   { proxyThreat: -30, cost: 140, tension: 12, internationalStanding: -6, warPath: 1 },
        },
    },

    // --- DIPLOMATIC ---
    {
        id: 'back_channel', name: 'Back-Channel Talks', category: 'diplomatic',
        description: 'Secret negotiations with Iranian moderates through Oman.',
        hint: { low: 'Exploratory contacts', medium: 'Structured talks with agenda', high: 'Full engagement — risk of leak' },
        effects: {
            low:    { tension: -3, diplomaticCapital: 5, iranAggression: -2, internationalStanding: 2 },
            medium: { tension: -8, diplomaticCapital: 12, iranAggression: -6, domesticApproval: -3, internationalStanding: 5 },
            high:   { tension: -15, diplomaticCapital: 20, iranAggression: -12, domesticApproval: -6, internationalStanding: 10 },
        },
    },
    {
        id: 'gulf_coalition', name: 'Gulf Coalition', category: 'diplomatic',
        description: 'Build international maritime coalition with allied navies.',
        hint: { low: 'Outreach to key allies', medium: 'Joint patrols with UK, France, Japan', high: 'Full multinational coalition' },
        effects: {
            low:    { oilFlowProtection: 5, domesticApproval: 3, internationalStanding: 5, cost: 20, iranAggression: -2 },
            medium: { oilFlowProtection: 15, domesticApproval: 6, internationalStanding: 12, cost: 80, iranAggression: -6, navalPresence: 1 },
            high:   { oilFlowProtection: 25, domesticApproval: 8, internationalStanding: 18, cost: 150, iranAggression: -10, navalPresence: 2 },
        },
    },
    {
        id: 'un_resolution', name: 'UN Resolution', category: 'diplomatic',
        description: 'Push for Security Council resolution condemning Iran.',
        hint: { low: 'Statement of concern', medium: 'Binding resolution — Russia may veto', high: 'Chapter VII enforcement' },
        effects: {
            low:    { internationalStanding: 5, diplomaticCapital: -3, tension: 1 },
            medium: { internationalStanding: 10, diplomaticCapital: -10, tension: 3, domesticApproval: 3 },
            high:   { internationalStanding: 15, diplomaticCapital: -20, tension: 5, domesticApproval: 5, russiaRelations: -5 },
        },
    },
    {
        id: 'summit_proposal', name: 'Summit Proposal', category: 'diplomatic',
        description: 'Propose direct leader-to-leader talks to resolve the crisis.',
        hint: { low: 'Float the idea publicly', medium: 'Formal invitation', high: 'Public commitment to peace summit' },
        effects: {
            low:    { tension: -5, domesticApproval: -2, internationalStanding: 5, iranAggression: -3 },
            medium: { tension: -12, domesticApproval: -5, internationalStanding: 12, iranAggression: -8, diplomaticCapital: -8 },
            high:   { tension: -20, domesticApproval: -8, internationalStanding: 18, iranAggression: -15, diplomaticCapital: -15 },
        },
    },
    {
        id: 'humanitarian_corridor', name: 'Humanitarian Corridor', category: 'diplomatic',
        description: 'Establish protected aid passage for affected civilian populations.',
        hint: { low: 'Medical supplies only', medium: 'Full relief corridor', high: 'Major humanitarian operation' },
        effects: {
            low:    { domesticApproval: 3, internationalStanding: 5, iranAggression: -2, cost: 15 },
            medium: { domesticApproval: 6, internationalStanding: 12, iranAggression: -5, cost: 50, tension: -3 },
            high:   { domesticApproval: 10, internationalStanding: 20, iranAggression: -10, cost: 100, tension: -6 },
        },
    },

    // --- ECONOMIC ---
    {
        id: 'targeted_sanctions', name: 'Targeted Sanctions', category: 'economic',
        description: 'Freeze assets and ban travel for IRGC leadership.',
        hint: { low: 'Sanction a few commanders', medium: 'Hit the IRGC financial network', high: 'Maximum pressure — pushes China away' },
        effects: {
            low:    { iranEconomy: -5, tension: 3, iranAggression: 3, domesticApproval: 3, chinaRelations: -2 },
            medium: { iranEconomy: -15, tension: 8, iranAggression: 8, domesticApproval: 5, chinaRelations: -5 },
            high:   { iranEconomy: -30, tension: 15, iranAggression: 15, domesticApproval: 3, chinaRelations: -12, internationalStanding: -3 },
        },
    },
    {
        id: 'maximum_pressure', name: 'Maximum Pressure', category: 'economic',
        description: 'Full economic blockade with secondary sanctions.',
        hint: { low: 'Tighten existing sanctions', medium: 'Secondary sanctions on partners', high: 'Total isolation — allies furious' },
        effects: {
            low:    { iranEconomy: -10, tension: 8, iranAggression: 8, oilPrice: 3, chinaRelations: -5 },
            medium: { iranEconomy: -25, tension: 15, iranAggression: 15, oilPrice: 8, chinaRelations: -10, internationalStanding: -5 },
            high:   { iranEconomy: -40, tension: 25, iranAggression: 25, oilPrice: 15, chinaRelations: -18, internationalStanding: -12 },
        },
    },
    {
        id: 'reserve_release', name: 'Strategic Reserve Release', category: 'economic',
        description: 'Release oil from Strategic Petroleum Reserve to stabilize markets.',
        hint: { low: 'Partial release', medium: 'Major release to cap prices', high: 'Emergency dump — reserves drain fast' },
        effects: {
            low:    { oilPrice: -5, domesticApproval: 3, cost: 30 },
            medium: { oilPrice: -12, domesticApproval: 5, cost: 80, oilFlowProtection: 5 },
            high:   { oilPrice: -20, domesticApproval: 8, cost: 150, oilFlowProtection: 10 },
        },
    },
    {
        id: 'trade_incentives', name: 'Trade Incentives', category: 'economic',
        description: 'Offer sanctions relief in exchange for de-escalation.',
        hint: { low: 'Minor sanctions waiver', medium: 'Structured trade deal', high: 'Major economic package' },
        effects: {
            low:    { iranAggression: -3, tension: -2, domesticApproval: -2, iranEconomy: 3 },
            medium: { iranAggression: -8, tension: -6, domesticApproval: -5, iranEconomy: 8, internationalStanding: 3 },
            high:   { iranAggression: -15, tension: -12, domesticApproval: -10, iranEconomy: 15, chinaRelations: 5 },
        },
    },

    // --- INTELLIGENCE ---
    {
        id: 'sigint_sweep', name: 'SIGINT Sweep', category: 'intelligence',
        description: 'Signals intelligence collection across Iranian military comms.',
        hint: { low: 'Passive monitoring', medium: 'Active intercept of networks', high: 'Full spectrum dominance' },
        effects: {
            low:    { fogOfWar: -10, cost: 10, intelLevel: 1 },
            medium: { fogOfWar: -25, cost: 35, intelLevel: 2, iranAggression: -2 },
            high:   { fogOfWar: -40, cost: 80, intelLevel: 3, iranAggression: -5 },
        },
    },
    {
        id: 'cyber_operation', name: 'Cyber Operation', category: 'intelligence',
        description: 'Offensive and defensive cyber ops against Iranian networks.',
        hint: { low: 'Defensive cyber shield', medium: 'Disrupt IRGC command & control', high: 'Full offensive — near act of war' },
        effects: {
            low:    { fogOfWar: -8, cost: 15, tension: 2 },
            medium: { fogOfWar: -18, iranAggression: -8, cost: 40, tension: 6, conflictRisk: 3 },
            high:   { fogOfWar: -30, iranAggression: -15, cost: 90, tension: 12, conflictRisk: 10, warPath: 1 },
        },
    },
    {
        id: 'drone_surveillance', name: 'Drone Surveillance', category: 'intelligence',
        description: 'Deploy MQ-9 and RQ-4 UAVs over the strait.',
        hint: { low: 'Limited recon', medium: 'Persistent surveillance', high: 'Saturated coverage — may get shot down' },
        effects: {
            low:    { fogOfWar: -12, intelLevel: 1, cost: 10 },
            medium: { fogOfWar: -22, intelLevel: 2, cost: 30, oilFlowProtection: 3 },
            high:   { fogOfWar: -35, intelLevel: 3, cost: 60, oilFlowProtection: 8, tension: 5 },
        },
    },

    // --- DOMESTIC ---
    {
        id: 'media_blitz', name: 'Media Campaign', category: 'domestic',
        description: 'Coordinate messaging to control the narrative at home and abroad.',
        hint: { low: 'Press briefings', medium: 'Full media strategy', high: 'Information dominance' },
        effects: {
            low:    { domesticApproval: 5, cost: 5 },
            medium: { domesticApproval: 10, internationalStanding: 3, cost: 20, polarization: -2 },
            high:   { domesticApproval: 15, internationalStanding: 5, cost: 50, polarization: -5 },
        },
    },
    {
        id: 'congressional_briefing', name: 'Congressional Briefing', category: 'domestic',
        description: 'Brief congressional leadership to maintain political support.',
        hint: { low: 'Informal update', medium: 'Formal classified briefing', high: 'Full congressional address' },
        effects: {
            low:    { domesticApproval: 3, polarization: -2 },
            medium: { domesticApproval: 6, polarization: -5 },
            high:   { domesticApproval: 10, polarization: -8, cost: 10 },
        },
    },
    {
        id: 'america_first', name: 'America First', category: 'domestic',
        description: 'Reduce overseas commitments. Focus on domestic energy.',
        hint: { low: 'Rhetoric shift toward restraint', medium: 'Begin drawdown', high: 'Full withdrawal — popular but risky' },
        effects: {
            low:    { domesticApproval: 5, internationalStanding: -3, cost: -20, tension: -2, oilFlowProtection: -3 },
            medium: { domesticApproval: 10, internationalStanding: -8, cost: -60, tension: -5, oilFlowProtection: -10, iranAggression: 5 },
            high:   { domesticApproval: 15, internationalStanding: -15, cost: -100, oilFlowProtection: -20, iranAggression: 12 },
        },
    },
];

// Character-exclusive bonus cards
const CHARACTER_BONUS_CARDS = {
    trump: {
        id: 'art_of_deal', name: 'Art of the Deal', category: 'economic',
        description: 'Demand Gulf states pay for protection or lose it.',
        hint: { low: 'Casual ask', medium: 'Firm demand', high: 'Ultimatum — pay or we leave' },
        effects: {
            low:    { cost: -30, domesticApproval: 3, internationalStanding: -2 },
            medium: { cost: -80, domesticApproval: 8, internationalStanding: -5, tension: 3 },
            high:   { cost: -150, domesticApproval: 12, internationalStanding: -10, tension: 8 },
        },
    },
    kushner: {
        id: 'abraham_accords', name: 'Abraham Accords II', category: 'diplomatic',
        description: 'Leverage Gulf relationships for regional peace framework.',
        hint: { low: 'Quiet conversations', medium: 'Formal framework', high: 'Historic agreement' },
        effects: {
            low:    { diplomaticCapital: 8, internationalStanding: 5, tension: -3 },
            medium: { diplomaticCapital: 15, internationalStanding: 12, tension: -8, iranAggression: -5, cost: 20 },
            high:   { diplomaticCapital: 25, internationalStanding: 20, tension: -15, iranAggression: -10, cost: 50 },
        },
    },
    hegseth: {
        id: 'shock_awe', name: 'Shock & Awe', category: 'military',
        description: 'Overwhelming military demonstration. Every asset, visible and loud.',
        hint: { low: 'Large-scale exercise', medium: 'Full fleet formation', high: 'Combat-ready posture with live fire' },
        effects: {
            low:    { navalPresence: 2, tension: 10, cost: 80, iranAggression: -8, domesticApproval: 5 },
            medium: { navalPresence: 3, carrier: 1, tension: 20, cost: 200, iranAggression: -15, domesticApproval: 8, internationalStanding: -5 },
            high:   { navalPresence: 3, carrier: 1, tension: 35, cost: 350, iranAggression: -20, domesticApproval: 10, internationalStanding: -12, warPath: 1 },
        },
    },
    asmongold: {
        id: 'osint_flood', name: 'OSINT Flood', category: 'intelligence',
        description: 'Crowdsource intelligence using open-source analysis. Chat does the work.',
        hint: { low: 'Monitor feeds', medium: 'Coordinate OSINT community', high: 'Full crowd-intel platform' },
        effects: {
            low:    { fogOfWar: -15, cost: 5 },
            medium: { fogOfWar: -30, cost: 10, domesticApproval: 3, intelLevel: 2 },
            high:   { fogOfWar: -45, cost: 20, domesticApproval: 8, intelLevel: 3 },
        },
    },
    fuentes: {
        id: 'populist_rally', name: 'America First Rally', category: 'domestic',
        description: 'Massive domestic rally. Frame crisis as us vs. the establishment.',
        hint: { low: 'Social media campaign', medium: 'Rally series in key states', high: 'National movement' },
        effects: {
            low:    { domesticApproval: 5, polarization: 3, internationalStanding: -2 },
            medium: { domesticApproval: 12, polarization: 8, internationalStanding: -5 },
            high:   { domesticApproval: 18, polarization: 15, internationalStanding: -10, cost: 20 },
        },
    },
};

/**
 * Deal a hand of cards for the weekly briefing
 * Respects character card pool rules (allCards, restricted, maxPicks)
 */
function dealHand(character, week, playedExclusives) {
    const cp = character.cardPool || {};
    const restricted = cp.restricted || [];

    let pool = STRATEGY_CARDS.filter(c => {
        if (c.exclusive && playedExclusives.includes(c.id)) return false;
        if (restricted.includes(c.id)) return false;
        return true;
    });

    const bonusCard = CHARACTER_BONUS_CARDS[character.id];
    const hand = [];
    const used = new Set();

    if (cp.allCards) {
        // Trump: gets ALL non-restricted cards, shuffled, pick up to 8
        const shuffled = pool.sort(() => Math.random() - 0.5);
        for (const card of shuffled) {
            if (hand.length >= 8) break;
            hand.push(card);
            used.add(card.id);
        }
    } else {
        // Normal: 1 card from each available category
        const categories = ['military', 'diplomatic', 'economic', 'intelligence', 'domestic'];
        for (const cat of categories) {
            const catCards = pool.filter(c => c.category === cat && !used.has(c.id));
            if (catCards.length > 0) {
                const pick = catCards[Math.floor(Math.random() * catCards.length)];
                hand.push(pick);
                used.add(pick.id);
            }
        }
    }

    // Add character bonus card
    if (bonusCard && !playedExclusives.includes(bonusCard.id)) {
        hand.push(bonusCard);
    }

    // Add contact-unlocked cards for Kushner
    if (character.contacts) {
        for (const contact of character.contacts) {
            if (contact.trust >= 60 && contact.unlockCard && !used.has(contact.unlockCard)) {
                const unlocked = CONTACT_CARDS[contact.unlockCard];
                if (unlocked && !playedExclusives.includes(unlocked.id)) {
                    hand.push(unlocked);
                    used.add(unlocked.id);
                }
            }
        }
    }

    return hand;
}

/**
 * Cards unlocked by Kushner's contacts at trust >= 60
 */
const CONTACT_CARDS = {
    saudi_deal: {
        id: 'saudi_deal', name: 'Saudi Grand Bargain', category: 'diplomatic',
        description: 'MBS commits Saudi resources and influence to resolve the crisis.',
        hint: { low: 'Quiet Saudi support', medium: 'Public Saudi partnership', high: 'Full Saudi commitment' },
        effects: {
            low:    { cost: -40, internationalStanding: 5, tension: -3, diplomaticCapital: 5 },
            medium: { cost: -100, internationalStanding: 10, tension: -8, diplomaticCapital: 12, iranAggression: -5 },
            high:   { cost: -200, internationalStanding: 15, tension: -12, diplomaticCapital: 20, iranAggression: -10 },
        },
    },
    uae_port_access: {
        id: 'uae_port_access', name: 'UAE Port Access', category: 'military',
        description: 'MBZ grants full access to Fujairah port for US operations.',
        hint: { low: 'Resupply rights', medium: 'Forward operating base', high: 'Full military partnership' },
        effects: {
            low:    { navalPresence: 1, oilFlowProtection: 8, cost: -20 },
            medium: { navalPresence: 2, oilFlowProtection: 15, cost: -50, tension: 3 },
            high:   { navalPresence: 2, oilFlowProtection: 25, cost: -80, tension: 8 },
        },
    },
    bosphorus_leverage: {
        id: 'bosphorus_leverage', name: 'Turkish Leverage', category: 'diplomatic',
        description: 'Erdogan applies pressure on Iran through economic and military channels.',
        hint: { low: 'Diplomatic signals', medium: 'Economic pressure', high: 'Military posturing on border' },
        effects: {
            low:    { iranAggression: -3, tension: -2, diplomaticCapital: 5 },
            medium: { iranAggression: -8, tension: -5, diplomaticCapital: 10, cost: 30 },
            high:   { iranAggression: -15, tension: 5, diplomaticCapital: 15, cost: 60 },
        },
    },
    secret_channel: {
        id: 'secret_channel', name: 'Zarif Direct Line', category: 'diplomatic',
        description: 'Direct communication with Iranian moderates through Zarif.',
        hint: { low: 'Message exchange', medium: 'Active negotiation', high: 'Framework agreement' },
        effects: {
            low:    { tension: -5, iranAggression: -5, diplomaticCapital: 8 },
            medium: { tension: -12, iranAggression: -12, diplomaticCapital: 15, domesticApproval: -5 },
            high:   { tension: -20, iranAggression: -20, diplomaticCapital: 25, domesticApproval: -10 },
        },
    },
    mossad_intel: {
        id: 'mossad_intel', name: 'Mossad Intelligence', category: 'intelligence',
        description: 'Netanyahu shares Mossad intelligence on Iranian operations.',
        hint: { low: 'Satellite imagery', medium: 'HUMINT assets', high: 'Full intelligence sharing' },
        effects: {
            low:    { fogOfWar: -15, intelLevel: 1 },
            medium: { fogOfWar: -30, intelLevel: 2, iranAggression: -5 },
            high:   { fogOfWar: -45, intelLevel: 3, iranAggression: -10, tension: 5 },
        },
    },
};

/**
 * Get aggregate effect from active stances (replaces getAggregateEffect)
 */
function getStanceEffect(effectName) {
    let total = 0;
    if (!SIM.activeStances) return 0;
    const mult = (SIM.character && SIM.character.cardPool && SIM.character.cardPool.effectMultiplier) || 1;
    for (const stance of SIM.activeStances) {
        const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS), ...Object.values(CONTACT_CARDS)];
        const card = allCards.find(c => c.id === stance.cardId);
        if (card && card.effects[stance.funding]) {
            total += (card.effects[stance.funding][effectName] || 0) * mult;
        }
    }
    return total;
}

function getStanceMax(effectName) {
    let max = 0;
    if (!SIM.activeStances) return 0;
    for (const stance of SIM.activeStances) {
        const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS), ...Object.values(CONTACT_CARDS)];
        const card = allCards.find(c => c.id === stance.cardId);
        if (card && card.effects[stance.funding]) {
            const val = card.effects[stance.funding][effectName] || 0;
            if (val > max) max = val;
        }
    }
    return max;
}
