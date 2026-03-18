/**
 * Strategy Cards — replaces continuous policy sliders
 * Player picks 3 cards per week from a hand of 5-6
 * Each card has Low/Medium/High funding levels
 */

const STRATEGY_CARDS = [
    // --- MILITARY ---
    {
        id: 'carrier_strike', name: '', category: 'military',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { navalPresence: 1, tension: 5, cost: 50, iranAggression: -3, domesticApproval: 2, internationalStanding: -1 },
            medium: { navalPresence: 2, tension: 12, cost: 200, iranAggression: -8, domesticApproval: 5, internationalStanding: -4, carrier: 1 },
            high:   { navalPresence: 3, tension: 25, cost: 500, iranAggression: 5, domesticApproval: 8, internationalStanding: -8, carrier: 1, warPath: 1 },
        },
    },
    {
        id: 'naval_patrol', name: '', category: 'military',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { navalPresence: 1, blockadeLevel: 1, tension: 2, cost: 30, oilFlowProtection: 5 },
            medium: { navalPresence: 2, blockadeLevel: 2, tension: 6, cost: 80, oilFlowProtection: 15, domesticApproval: 3 },
            high:   { navalPresence: 2, blockadeLevel: 3, tension: 12, cost: 150, oilFlowProtection: 25, iranAggression: 5 },
        },
    },
    {
        id: 'active_intercept', name: '', category: 'military',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { blockadeLevel: 2, tension: 8, cost: 20, oilFlowProtection: 10, conflictRisk: 3 },
            medium: { blockadeLevel: 3, tension: 18, cost: 40, oilFlowProtection: 25, conflictRisk: 8, iranAggression: -5, warPath: 1 },
            high:   { blockadeLevel: 3, tension: 30, cost: 80, oilFlowProtection: 35, conflictRisk: 20, iranAggression: 8, warPath: 2, internationalStanding: -10 },
        },
    },
    {
        id: 'missile_strike', name: '', category: 'military',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { tension: 20, cost: 60, iranAggression: -10, conflictRisk: 12, warPath: 1, domesticApproval: 3, internationalStanding: -8 },
            medium: { tension: 35, cost: 120, iranAggression: -20, conflictRisk: 20, warPath: 2, domesticApproval: 5, internationalStanding: -15 },
            high:   { tension: 50, cost: 200, iranAggression: -25, conflictRisk: 30, warPath: 3, domesticApproval: -3, internationalStanding: -25 },
        },
        exclusive: true,
    },
    {
        id: 'regional_deterrence', name: '', category: 'military',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { proxyThreat: -8, cost: 25, tension: 2 },
            medium: { proxyThreat: -18, cost: 70, tension: 6, internationalStanding: -2 },
            high:   { proxyThreat: -30, cost: 140, tension: 12, internationalStanding: -6, warPath: 1 },
        },
    },

    // --- DIPLOMATIC ---
    {
        id: 'back_channel', name: '', category: 'diplomatic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { tension: -3, diplomaticCapital: 5, iranAggression: -2, internationalStanding: 2 },
            medium: { tension: -8, diplomaticCapital: 12, iranAggression: -6, domesticApproval: -3, internationalStanding: 5 },
            high:   { tension: -15, diplomaticCapital: 20, iranAggression: -12, domesticApproval: -6, internationalStanding: 10 },
        },
    },
    {
        id: 'gulf_coalition', name: '', category: 'diplomatic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { oilFlowProtection: 5, domesticApproval: 3, internationalStanding: 5, cost: 20, iranAggression: -2 },
            medium: { oilFlowProtection: 15, domesticApproval: 6, internationalStanding: 12, cost: 80, iranAggression: -6, navalPresence: 1 },
            high:   { oilFlowProtection: 25, domesticApproval: 8, internationalStanding: 18, cost: 150, iranAggression: -10, navalPresence: 2 },
        },
    },
    {
        id: 'un_resolution', name: '', category: 'diplomatic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { internationalStanding: 1, diplomaticCapital: -3, tension: 1 },
            medium: { internationalStanding: 2, diplomaticCapital: -10, tension: 2 },
            high:   { internationalStanding: 3, diplomaticCapital: -20, tension: 3, chinaRelations: -3 },
        },
    },
    {
        id: 'summit_proposal', name: '', category: 'diplomatic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { tension: -5, domesticApproval: -2, internationalStanding: 5, iranAggression: -3 },
            medium: { tension: -12, domesticApproval: -5, internationalStanding: 12, iranAggression: -8, diplomaticCapital: -8 },
            high:   { tension: -20, domesticApproval: -8, internationalStanding: 18, iranAggression: -15, diplomaticCapital: -15 },
        },
    },
    {
        id: 'humanitarian_corridor', name: '', category: 'diplomatic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { domesticApproval: 3, internationalStanding: 5, iranAggression: -2, cost: 15 },
            medium: { domesticApproval: 6, internationalStanding: 12, iranAggression: -5, cost: 50, tension: -3 },
            high:   { domesticApproval: 10, internationalStanding: 20, iranAggression: -10, cost: 100, tension: -6 },
        },
    },

    // --- ECONOMIC ---
    {
        id: 'targeted_sanctions', name: '', category: 'economic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { iranEconomy: -5, tension: 3, iranAggression: 3, domesticApproval: 3, chinaRelations: -2 },
            medium: { iranEconomy: -15, tension: 8, iranAggression: 8, domesticApproval: 5, chinaRelations: -5 },
            high:   { iranEconomy: -30, tension: 15, iranAggression: 15, domesticApproval: 3, chinaRelations: -12, internationalStanding: -3 },
        },
    },
    {
        id: 'maximum_pressure', name: '', category: 'economic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { iranEconomy: -10, tension: 8, iranAggression: 8, oilPrice: 3, chinaRelations: -5 },
            medium: { iranEconomy: -25, tension: 15, iranAggression: 15, oilPrice: 8, chinaRelations: -10, internationalStanding: -5 },
            high:   { iranEconomy: -40, tension: 25, iranAggression: 25, oilPrice: 15, chinaRelations: -18, internationalStanding: -12 },
        },
    },
    {
        id: 'reserve_release', name: '', category: 'economic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { oilPrice: -5, domesticApproval: 3, cost: 30 },
            medium: { oilPrice: -12, domesticApproval: 5, cost: 80, oilFlowProtection: 5 },
            high:   { oilPrice: -20, domesticApproval: 8, cost: 150, oilFlowProtection: 10 },
        },
    },
    {
        id: 'trade_incentives', name: '', category: 'economic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { iranAggression: -3, tension: -2, domesticApproval: -2, iranEconomy: 3 },
            medium: { iranAggression: -8, tension: -6, domesticApproval: -5, iranEconomy: 8, internationalStanding: 3 },
            high:   { iranAggression: -15, tension: -12, domesticApproval: -10, iranEconomy: 15, chinaRelations: 5 },
        },
    },

    // --- INTELLIGENCE ---
    {
        id: 'sigint_sweep', name: '', category: 'intelligence',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { fogOfWar: -10, cost: 10, intelLevel: 1 },
            medium: { fogOfWar: -25, cost: 35, intelLevel: 2, iranAggression: -2 },
            high:   { fogOfWar: -40, cost: 80, intelLevel: 3, iranAggression: -5 },
        },
    },
    {
        id: 'cyber_operation', name: '', category: 'intelligence',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { fogOfWar: -8, cost: 15, tension: 2 },
            medium: { fogOfWar: -18, iranAggression: -8, cost: 40, tension: 6, conflictRisk: 3 },
            high:   { fogOfWar: -30, iranAggression: -15, cost: 90, tension: 12, conflictRisk: 10, warPath: 1 },
        },
    },
    {
        id: 'drone_surveillance', name: '', category: 'intelligence',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { fogOfWar: -12, intelLevel: 1, cost: 10 },
            medium: { fogOfWar: -22, intelLevel: 2, cost: 30, oilFlowProtection: 3 },
            high:   { fogOfWar: -35, intelLevel: 3, cost: 60, oilFlowProtection: 8, tension: 5 },
        },
    },

    // --- MILITARY (NEW) ---
    {
        id: 'mine_countermeasures', name: '', category: 'military',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { oilFlowProtection: 5, fogOfWar: -5, cost: 15 },
            medium: { oilFlowProtection: 12, fogOfWar: -10, cost: 40, tension: 2 },
            high:   { oilFlowProtection: 20, fogOfWar: -15, cost: 80, tension: 5, iranAggression: -3 },
        },
    },
    {
        id: 'submarine_warfare', name: '', category: 'military',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { fogOfWar: -8, tension: 2, cost: 20, iranAggression: -2 },
            medium: { fogOfWar: -15, tension: 5, cost: 50, iranAggression: -5, oilFlowProtection: 8 },
            high:   { fogOfWar: -20, tension: 12, cost: 80, iranAggression: -10, oilFlowProtection: 15, warPath: 1 },
        },
    },
    {
        id: 'ballistic_missile_defense', name: '', category: 'military',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { cost: 30, domesticApproval: 2, tension: 2, conflictRisk: -3 },
            medium: { cost: 80, domesticApproval: 5, tension: 3, conflictRisk: -8, internationalStanding: 3 },
            high:   { cost: 150, domesticApproval: 8, tension: 5, conflictRisk: -15, internationalStanding: 5, iranAggression: -5 },
        },
    },

    // --- DIPLOMATIC (NEW) ---
    {
        id: 'war_crimes_tribunal', name: '', category: 'diplomatic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { internationalStanding: 3, diplomaticCapital: 3, tension: 1 },
            medium: { internationalStanding: 8, diplomaticCapital: 8, tension: 2, iranAggression: -3 },
            high:   { internationalStanding: 12, diplomaticCapital: 12, tension: 3, iranAggression: -5, domesticApproval: 3 },
        },
    },

    // --- ECONOMIC (NEW) ---
    {
        id: 'oil_diplomacy', name: '', category: 'economic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { oilPrice: -3, internationalStanding: 3, cost: 10 },
            medium: { oilPrice: -8, internationalStanding: 5, oilFlow: 3, cost: 30 },
            high:   { oilPrice: -15, internationalStanding: 8, oilFlow: 5, cost: 60, diplomaticCapital: 5 },
        },
    },
    {
        id: 'insurance_backstop', name: '', category: 'economic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { oilFlow: 5, cost: 20, domesticApproval: 2 },
            medium: { oilFlow: 12, cost: 60, domesticApproval: 3, oilPrice: -5 },
            high:   { oilFlow: 20, cost: 120, domesticApproval: 5, oilPrice: -10, internationalStanding: 3 },
        },
    },

    // --- INTELLIGENCE (NEW) ---
    {
        id: 'humint_iran', name: '', category: 'intelligence',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { fogOfWar: -8, cost: 15, iranAggression: -2 },
            medium: { fogOfWar: -18, cost: 40, iranAggression: -5, intelLevel: 1 },
            high:   { fogOfWar: -30, cost: 80, iranAggression: -8, intelLevel: 2, tension: 3 },
        },
    },
    {
        id: 'electronic_warfare', name: '', category: 'intelligence',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { fogOfWar: -10, cost: 10 },
            medium: { fogOfWar: -20, iranAggression: -5, cost: 30, tension: 3 },
            high:   { fogOfWar: -35, iranAggression: -10, cost: 60, tension: 8, conflictRisk: -5 },
        },
    },

    // --- DOMESTIC ---
    {
        id: 'media_blitz', name: '', category: 'domestic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { domesticApproval: 5, cost: 5 },
            medium: { domesticApproval: 10, internationalStanding: 3, cost: 20, polarization: -2 },
            high:   { domesticApproval: 15, internationalStanding: 5, cost: 50, polarization: -5 },
        },
    },
    {
        id: 'congressional_briefing', name: '', category: 'domestic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { domesticApproval: 3, polarization: -2 },
            medium: { domesticApproval: 6, polarization: -5 },
            high:   { domesticApproval: 10, polarization: -8, cost: 10 },
        },
    },
    {
        id: 'america_first', name: '', category: 'domestic',
        description: '',
        hint: { low: '', med: '', high: '' },
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
        id: 'art_of_deal', name: '', category: 'economic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { cost: -30, domesticApproval: 3, internationalStanding: -2 },
            medium: { cost: -80, domesticApproval: 8, internationalStanding: -5, tension: 3 },
            high:   { cost: -150, domesticApproval: 12, internationalStanding: -10, tension: 8 },
        },
    },
    kushner: {
        id: 'abraham_accords', name: '', category: 'diplomatic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { diplomaticCapital: 8, internationalStanding: 5, tension: -3 },
            medium: { diplomaticCapital: 15, internationalStanding: 12, tension: -8, iranAggression: -5, cost: 20 },
            high:   { diplomaticCapital: 25, internationalStanding: 20, tension: -15, iranAggression: -10, cost: 50 },
        },
    },
    hegseth: {
        id: 'shock_awe', name: '', category: 'military',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { navalPresence: 2, tension: 10, cost: 80, iranAggression: -8, domesticApproval: 5 },
            medium: { navalPresence: 3, carrier: 1, tension: 20, cost: 200, iranAggression: -15, domesticApproval: 8, internationalStanding: -5 },
            high:   { navalPresence: 3, carrier: 1, tension: 35, cost: 350, iranAggression: -20, domesticApproval: 10, internationalStanding: -12, warPath: 1 },
        },
    },
    asmongold: {
        id: 'osint_flood', name: '', category: 'intelligence',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { fogOfWar: -15, cost: 5 },
            medium: { fogOfWar: -30, cost: 10, domesticApproval: 3, intelLevel: 2 },
            high:   { fogOfWar: -45, cost: 20, domesticApproval: 8, intelLevel: 3 },
        },
    },
    fuentes: {
        id: 'populist_rally', name: '', category: 'domestic',
        description: '',
        hint: { low: '', med: '', high: '' },
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
        id: 'saudi_deal', name: '', category: 'diplomatic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { cost: -40, internationalStanding: 5, tension: -3, diplomaticCapital: 5 },
            medium: { cost: -100, internationalStanding: 10, tension: -8, diplomaticCapital: 12, iranAggression: -5 },
            high:   { cost: -200, internationalStanding: 15, tension: -12, diplomaticCapital: 20, iranAggression: -10 },
        },
    },
    uae_port_access: {
        id: 'uae_port_access', name: '', category: 'military',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { navalPresence: 1, oilFlowProtection: 8, cost: -20 },
            medium: { navalPresence: 2, oilFlowProtection: 15, cost: -50, tension: 3 },
            high:   { navalPresence: 2, oilFlowProtection: 25, cost: -80, tension: 8 },
        },
    },
    bosphorus_leverage: {
        id: 'bosphorus_leverage', name: '', category: 'diplomatic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { iranAggression: -3, tension: -2, diplomaticCapital: 5 },
            medium: { iranAggression: -8, tension: -5, diplomaticCapital: 10, cost: 30 },
            high:   { iranAggression: -15, tension: 5, diplomaticCapital: 15, cost: 60 },
        },
    },
    secret_channel: {
        id: 'secret_channel', name: '', category: 'diplomatic',
        description: '',
        hint: { low: '', med: '', high: '' },
        effects: {
            low:    { tension: -5, iranAggression: -5, diplomaticCapital: 8 },
            medium: { tension: -12, iranAggression: -12, diplomaticCapital: 15, domesticApproval: -5 },
            high:   { tension: -20, iranAggression: -20, diplomaticCapital: 25, domesticApproval: -10 },
        },
    },
    mossad_intel: {
        id: 'mossad_intel', name: '', category: 'intelligence',
        description: '',
        hint: { low: '', med: '', high: '' },
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
let _allCardsCache = null;
function _getAllCards() {
    if (!_allCardsCache) {
        _allCardsCache = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS), ...Object.values(CONTACT_CARDS)];
    }
    return _allCardsCache;
}

function getStanceEffect(effectName) {
    let total = 0;
    if (!SIM.activeStances) return 0;
    const mult = (SIM.character && SIM.character.cardPool && SIM.character.cardPool.effectMultiplier) || 1;
    const allCards = _getAllCards();
    for (const stance of SIM.activeStances) {
        const card = allCards.find(c => c.id === stance.cardId);
        if (card && card.effects[stance.funding]) {
            const baseEffect = (card.effects[stance.funding][effectName] || 0) * mult;
            // Apply card level bonus from progression system
            const levelBonus = (typeof getCardLevel === 'function') ? getCardLevel(stance.cardId).bonus : 0;
            total += baseEffect * (1 + levelBonus);
        }
    }
    return total;
}

function getStanceMax(effectName) {
    let max = 0;
    if (!SIM.activeStances) return 0;
    const allCards = _getAllCards();
    for (const stance of SIM.activeStances) {
        const card = allCards.find(c => c.id === stance.cardId);
        if (card && card.effects[stance.funding]) {
            const val = card.effects[stance.funding][effectName] || 0;
            if (val > max) max = val;
        }
    }
    return max;
}

// ======================== CARD SYNERGIES ========================
// Active when specific card combinations are deployed simultaneously

const CARD_SYNERGIES = [
    {
        id: 'smart_pressure',
        name: '',
        description: '',
        requiredCards: ['sanctions', 'diplomacy'], // Will match any cards with these categories
        requiredCategories: ['economic', 'diplomatic'], // Alternative: match by category
        effects: { sanctionsBoost: 0.25, diplomaticBoost: 0.25 },
        flavor: '',
    },
    {
        id: 'iron_curtain',
        name: '',
        description: '',
        requiredCards: ['naval_patrol', 'carrier_strike'],
        effects: { interceptBoost: 0.15 },
        flavor: '',
    },
    {
        id: 'hearts_and_minds',
        name: '',
        description: '',
        requiredCards: ['humanitarian_corridor', 'media_campaign'],
        effects: { dailyStanding: 3, dailyApproval: 2 },
        flavor: '',
    },
    {
        id: 'shadow_war',
        name: '',
        description: '',
        requiredCards: ['cyber_ops', 'intel_surge'],
        effects: { intelMultiplier: 2.0, fogReductionMultiplier: 2.0 },
        flavor: '',
    },
    {
        id: 'fortress_america',
        name: '',
        description: '',
        requiredCards: ['missile_defense', 'troop_surge'],
        effects: { dailyDeterrence: 10, dailyTension: -5 },
        flavor: '',
    },
    {
        id: 'diplomatic_blitz',
        name: '',
        description: '',
        requiredCards: ['un_resolution', 'gulf_coalition'],
        effects: { dipCapitalMultiplier: 1.5 },
        flavor: '',
    },
    {
        id: 'maximum_pressure',
        name: '',
        description: '',
        requiredCards: ['sanctions', 'carrier_strike', 'cyber_ops'],
        effects: { dailyIranEconomy: -1, dailyFactionShift: 3, dailyTension: 2 },
        flavor: '',
    },
];

/**
 * Check which card synergies are currently active based on deployed stances
 * Returns array of active synergy objects
 */
function getActiveSynergies() {
    if (!SIM.activeStances || SIM.activeStances.length === 0) return [];

    const activeCardIds = SIM.activeStances.map(s => s.cardId);
    const activeSynergies = [];

    for (const synergy of CARD_SYNERGIES) {
        // Check if all required cards are active
        const allPresent = synergy.requiredCards.every(reqId => {
            // Direct ID match
            if (activeCardIds.includes(reqId)) return true;
            // Partial match (card ID contains the required string)
            return activeCardIds.some(id => id.includes(reqId) || reqId.includes(id));
        });

        if (allPresent) {
            activeSynergies.push(synergy);
        }
    }

    return activeSynergies;
}

// ======================== CARD PROGRESSION SYSTEM ========================
// Cards level up with sustained use: 7d->Level 2 (+20%), 14d->Level 3 (+40%), 21d->Mastery (+60%)
// Deactivating a card resets its progress.

const CARD_LEVEL_THRESHOLDS = [
    { level: 1, days: 0, bonus: 0, name: '' },
    { level: 2, days: 7, bonus: 0.20, name: '' },
    { level: 3, days: 14, bonus: 0.40, name: '' },
    { level: 4, days: 21, bonus: 0.60, name: '' },
];

/**
 * Get the current level and bonus multiplier for an active stance
 * @param {string} cardId - The card ID to check
 * @returns {{ level: number, bonus: number, name: string, daysActive: number }}
 */
function getCardLevel(cardId) {
    const activationDay = SIM.stanceActivationDay?.[cardId];
    if (activationDay === undefined) return { level: 1, bonus: 0, name: 'INACTIVE', daysActive: 0 };

    const daysActive = SIM.day - activationDay;
    let result = CARD_LEVEL_THRESHOLDS[0];

    for (const threshold of CARD_LEVEL_THRESHOLDS) {
        if (daysActive >= threshold.days) {
            result = threshold;
        }
    }

    return { ...result, daysActive };
}

/**
 * Apply card level bonus to a set of effects
 * @param {object} effects - The base effects object
 * @param {string} cardId - The card ID to check level for
 * @returns {object} - Effects with level bonus applied
 */
function applyCardLevelBonus(effects, cardId) {
    const { bonus } = getCardLevel(cardId);
    if (bonus === 0) return effects;

    const boosted = {};
    for (const [key, value] of Object.entries(effects)) {
        if (typeof value === 'number') {
            // Boost numeric effects by the level bonus
            boosted[key] = Math.round(value * (1 + bonus) * 10) / 10;
        } else {
            boosted[key] = value;
        }
    }
    return boosted;
}

function hydrateCards() {
    const d = DATA.cards;
    // Strategy cards
    STRATEGY_CARDS.forEach(c => {
        const t = d.strategyCards[c.id];
        if (t) { c.name = t.name; c.description = t.description; c.hint = t.hint; }
    });
    // Character bonus cards
    CHARACTER_BONUS_CARDS.forEach(c => {
        const t = d.characterBonusCards[c.id];
        if (t) { c.name = t.name; c.description = t.description; c.hint = t.hint; }
    });
    // Contact cards
    CONTACT_CARDS.forEach(c => {
        const t = d.contactCards[c.id];
        if (t) { c.name = t.name; c.description = t.description; c.hint = t.hint; }
    });
    // Synergies
    CARD_SYNERGIES.forEach(s => {
        const t = d.synergies[s.id];
        if (t) { s.name = t.name; s.description = t.description; s.flavor = t.flavor; }
    });
    // Card levels
    Object.keys(CARD_LEVEL_THRESHOLDS).forEach(k => {
        const t = d.cardLevels[k];
        if (t) { CARD_LEVEL_THRESHOLDS[k].name = t.name; }
    });
}
