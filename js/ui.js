/**
 * UI Controller — Daily Desk terminal screens
 * All screens use the lore intro typewriter aesthetic
 * Phases: initial_pick → daily_report → dayplay → event → daily_report (loop)
 * Action Point system during dayplay (Game Dev Tycoon style)
 */

const TERMINAL = document.getElementById('terminal-overlay');

// ======================== ACTION POINT SYSTEM ========================

const INTERRUPTS = [
    { text: "IRGC Heydar-class fast boat closing on tanker at 110 knots — intercept?", choices: [
        { label: "INTERCEPT", effects: { tension: 4, interceptCount: 1, domesticApproval: 3 } },
        { label: "MONITOR", effects: { tension: -1, oilFlow: -2 } }
    ]},
    { text: "Reporter asks: 'Is the US at war with Iran?'", choices: [
        { label: "DENY FIRMLY", effects: { domesticApproval: 3, tension: -2 } },
        { label: "NO COMMENT", effects: { polarization: 1 } }
    ]},
    { text: "Japanese ambassador requests emergency meeting on oil supply", choices: [
        { label: "MEET NOW", effects: { internationalStanding: 4, diplomaticCapital: 3 } },
        { label: "SCHEDULE FOR TOMORROW", effects: { internationalStanding: -1 } }
    ]},
    { text: "NSA intercept: IRGC Quds Force planning proxy attack", choices: [
        { label: "ALERT ALL BASES ($10M)", effects: { budget: -10, proxyThreat: -5, fogOfWar: -3 } },
        { label: "CLASSIFIED BRIEF ONLY", effects: { fogOfWar: -2 } }
    ]},
    { text: "Congress member leaks classified satellite imagery to media", choices: [
        { label: "DAMAGE CONTROL", effects: { domesticApproval: -2, fogOfWar: 8 } },
        { label: "USE IT — SHOW THE WORLD", effects: { internationalStanding: 3, fogOfWar: 5, iranAggression: -2 } }
    ]},
    { text: "Navy rescue swimmers save Iranian fishermen from sinking vessel", choices: [
        { label: "PUBLICIZE WIDELY", effects: { internationalStanding: 4, domesticApproval: 3, tension: -2 } },
        { label: "KEEP QUIET", effects: {} }
    ]},
    { text: "Maersk announces permanent rerouting around Cape of Good Hope", choices: [
        { label: "PROMISE SAFE PASSAGE", effects: { oilFlow: 3, tension: 2, budget: -5 } },
        { label: "ACKNOWLEDGE REALITY", effects: { oilFlow: -3, oilPrice: 4 } }
    ]},
    { text: "SIGINT picks up Iranian submarine leaving Bandar Abbas", choices: [
        { label: "ALERT THE FLEET", effects: { tension: 3, fogOfWar: -5, internationalStanding: 2 } },
        { label: "TRACK SILENTLY", effects: { fogOfWar: -8 } }
    ]},
    { text: "Anti-war protest outside White House — 50,000 people", choices: [
        { label: "ACKNOWLEDGE THEIR RIGHT", effects: { domesticApproval: 3, polarization: -2 } },
        { label: "IGNORE", effects: { polarization: 3 } }
    ]},
    { text: "Iranian state TV airs footage of captured tanker crew", choices: [
        { label: "DEMAND RELEASE — FORMAL STATEMENT", effects: { domesticApproval: 5, tension: 5, iranAggression: 2 } },
        { label: "QUIET DIPLOMACY", effects: { tension: -2, diplomaticCapital: 3 } }
    ]},
    { text: "Saudi Crown Prince MBS offers $5B for strait operations", choices: [
        { label: "ACCEPT WITH CONDITIONS", effects: { budget: 50, internationalStanding: 3, domesticApproval: -2 } },
        { label: "DECLINE — STRINGS ATTACHED", effects: { domesticApproval: 3, internationalStanding: -2 } }
    ]},
    { text: "Chinese tanker ignoring sanctions — loading Iranian crude at Kharg Island", choices: [
        { label: "INTERDICT", effects: { chinaRelations: -8, iranEconomy: -3, tension: 5 } },
        { label: "PHOTOGRAPH AND FILE", effects: { chinaRelations: -2, fogOfWar: -2 } }
    ]},
    { text: "Pentagon requests $3B emergency supplemental for strait operations", choices: [
        { label: "APPROVE", effects: { budget: -30, domesticApproval: -2 } },
        { label: "CUT TO $1.5B", effects: { budget: -15 } }
    ]},
    { text: "Iranian deepfake video of US attack on civilians goes viral on Telegram", choices: [
        { label: "RAPID DEBUNK — RELEASE REAL FOOTAGE", effects: { domesticApproval: 3, internationalStanding: 3, fogOfWar: 3 } },
        { label: "IGNORE — DON'T AMPLIFY", effects: { internationalStanding: -3 } }
    ]},
    { text: "Oil futures traders driving speculative price spike", choices: [
        { label: "JAWBONE MARKETS — PUBLIC STATEMENT", effects: { oilPrice: -3, domesticApproval: 2 } },
        { label: "LET MARKETS WORK", effects: { oilPrice: 2 } }
    ]},
    { text: "IRGC-affiliated APT35 probing US military network perimeters", choices: [
        { label: "COUNTER-HACK ($15M)", effects: { budget: -15, fogOfWar: -5, iranAggression: -3 } },
        { label: "HARDEN DEFENSES", effects: { budget: -5 } }
    ]},
    { text: "Indian PM calls — demands guaranteed oil supply or 'will explore alternatives'", choices: [
        { label: "PROMISE PRIORITY ACCESS", effects: { internationalStanding: 3, oilFlow: 2 } },
        { label: "LEVERAGE FOR COALITION SUPPORT", effects: { internationalStanding: -2, diplomaticCapital: 5 } }
    ]},
    { text: "Houthi drone detected heading toward Red Sea shipping", choices: [
        { label: "SHOOT IT DOWN", effects: { proxyThreat: -2, tension: 2, budget: -2 } },
        { label: "TRACK TO SOURCE", effects: { fogOfWar: -3, proxyThreat: 1 } }
    ]},
    { text: "Wall Street banks warning of global recession if strait stays closed 60 days", choices: [
        { label: "REASSURE MARKETS — PRESS CONFERENCE", effects: { domesticApproval: 2, oilPrice: -2 } },
        { label: "USE URGENCY TO PRESSURE IRAN", effects: { tension: 3, diplomaticCapital: 3 } }
    ]},
    { text: "USS McFaul reports Iranian drone circling at 500 feet — requesting weapons free", choices: [
        { label: "WEAPONS FREE", effects: { tension: 5, iranAggression: -3, domesticApproval: 3, warPath: 1 } },
        { label: "ELECTRONIC WARFARE ONLY", effects: { tension: 2, fogOfWar: -2 } }
    ]},
    // NEW INTERRUPTS — based on real March 2026 events
    { text: "Mojtaba Khamenei broadcasts defiant speech — 'We will drown the enemy in the strait'", choices: [
        { label: "RESPOND WITH FORCE POSTURE", effects: { tension: 5, domesticApproval: 3, iranAggression: -2 } },
        { label: "IGNORE THE RHETORIC", effects: { tension: -1 } }
    ]},
    { text: "Three Iranian Heydar-class fast boats racing toward tanker at 110 knots", choices: [
        { label: "WEAPONS HOT — ENGAGE", effects: { tension: 8, iranAggression: -5, domesticApproval: 5, warPath: 1 } },
        { label: "WARNING SHOTS ONLY", effects: { tension: 3, iranAggression: -1, domesticApproval: 2 } }
    ]},
    { text: "CENTCOM reports Iranian drone swarm detected — 15+ UAVs heading toward carrier group", choices: [
        { label: "ACTIVATE AEGIS — FULL DEFENSE", effects: { tension: 8, budget: -5, domesticApproval: 5, iranAggression: -5 } },
        { label: "ELECTRONIC COUNTERMEASURES", effects: { tension: 3, fogOfWar: -3 } }
    ]},
    { text: "Turkish FM calls — Erdogan offers to mediate if you ease sanctions on Turkish banks", choices: [
        { label: "ACCEPT MEDIATION", effects: { tension: -3, diplomaticCapital: 5, domesticApproval: -2 } },
        { label: "DECLINE — TOO MANY CONDITIONS", effects: { diplomaticCapital: -2, tension: 1 } }
    ]},
    { text: "Israeli PM shares Mossad intercept: IRGC planning to sink a tanker with torpedo", choices: [
        { label: "PREEMPTIVE STRIKE ON SUB", effects: { tension: 10, warPath: 1, iranAggression: -8, domesticApproval: 5 } },
        { label: "REPOSITION FLEET — DEFENSIVE", effects: { tension: 3, fogOfWar: -5, oilFlowProtection: 5 } }
    ]},
    { text: "GCC states demand emergency meeting — threatening to seek Chinese security guarantee", choices: [
        { label: "REASSURE ALLIES — SEND ENVOY", effects: { internationalStanding: 5, diplomaticCapital: 3, budget: -5 } },
        { label: "LET THEM POSTURE", effects: { internationalStanding: -3, chinaRelations: -3 } }
    ]},
    { text: "Iranian civilian cargo ship requesting safe passage through strait — families aboard", choices: [
        { label: "GRANT PASSAGE — ESCORT THROUGH", effects: { internationalStanding: 5, tension: -2, domesticApproval: 3 } },
        { label: "INSPECT FIRST", effects: { tension: 3, fogOfWar: -2, internationalStanding: -1 } }
    ]},
    { text: "AP reporter captured by IRGC near Bandar Abbas — State Dept demanding action", choices: [
        { label: "PUBLIC DEMAND FOR RELEASE", effects: { domesticApproval: 5, tension: 5, internationalStanding: 3 } },
        { label: "QUIET BACK-CHANNEL", effects: { tension: -1, diplomaticCapital: -3 } }
    ]},
    { text: "Pentagon: Iranian ballistic missile launch detected from Shiraz — trajectory unclear", choices: [
        { label: "ACTIVATE MISSILE DEFENSE", effects: { tension: 8, budget: -5, domesticApproval: 5 } },
        { label: "WAIT — COULD BE A TEST", effects: { tension: 3, domesticApproval: -2 } }
    ]},
    { text: "Oil tanker crew mutiny — refuse to transit strait without military escort", choices: [
        { label: "PROVIDE ESCORT IMMEDIATELY", effects: { oilFlow: 3, budget: -5, tension: 2, domesticApproval: 2 } },
        { label: "NOT OUR PROBLEM", effects: { oilFlow: -3, oilPrice: 3, domesticApproval: -2 } }
    ]},
    { text: "Fox News anchor: 'Is the President losing control of the situation?'", choices: [
        { label: "SEND SPOKESPERSON — STRONG MESSAGE", effects: { domesticApproval: 3, polarization: -2 } },
        { label: "NO RESPONSE", effects: { domesticApproval: -2, polarization: 2 } }
    ]},
    { text: "Iran claims to have captured a US underwater drone near Qeshm Island", choices: [
        { label: "DEMAND RETURN", effects: { tension: 5, domesticApproval: 3, internationalStanding: 2 } },
        { label: "DENY IT'S OURS", effects: { tension: 2, fogOfWar: 3 } }
    ]},
];

const _intelSnippets = [
    'SIGINT intercept: IRGC naval base at Bandar Abbas showing surge activity.',
    'Satellite imagery: Heydar-110 fast boats deployed to forward position near Larak Island.',
    'HUMINT report: Iranian commander expressing doubts about escalation — moderates gaining.',
    'Intercepted comms: IRGC supply convoy scheduled for next 48 hours via Kish Island.',
    'MQ-9 Reaper footage: mine-laying vessel spotted in western shipping lane.',
    'Signal analysis: Iranian C2 network traffic spike — possible operation imminent.',
    'Asset report: IRGC and Foreign Ministry in open disagreement over strategy.',
    'NSA intercept: Chinese tankers negotiating alternate route via Pakistani port.',
    'Satellite: IRIS Shahid Bagheri drone carrier has left port — heading southeast.',
    'HUMINT: Iran stockpiling enriched uranium at underground Fordow facility.',
    'Intercepted call: Iraqi militia commander receiving targeting data from Tehran.',
    'Imagery: New anti-ship missile battery activated at Qeshm Island — 30km from shipping lane.',
    'SIGINT: Houthi leadership in contact with IRGC Quds Force — coordinating Red Sea ops.',
    'Asset report: Iranian regime concerned about public unrest over economic collapse.',
    'Satellite: Russia-flagged cargo vessel entered Bandar Abbas with military containers.',
    'NSA: APT33 staging infrastructure for cyberattack on Gulf state port systems.',
    'HUMINT: Mojtaba Khamenei consolidating IRGC loyalty — purging moderates from command.',
    'Satellite: Three carrier groups now visible in Arabian Sea — Lincoln, Truman, Carl Vinson.',
    'SIGINT: IRGC Navy switching to burst transmissions — harder to intercept.',
    'Asset report: Iranian civilian protests in Isfahan over economic collapse and war.',
    'Imagery: New IRGC fast boat base detected on Farur Island — 20+ Heydar-class vessels.',
    'NSA intercept: Russian military advisors detected at IRGC Aerospace Force HQ.',
    'HUMINT: Chinese ambassador in Tehran offering "comprehensive strategic package" to Iran.',
    'Satellite: Iranian mobile missile launchers dispersing from known bases — targeting unknown.',
    'SIGINT: Houthi commanders receiving encrypted satellite phones from IRGC Quds Force.',
    'Asset report: IRGC Quds Force activating sleeper cells in Bahrain and Kuwait.',
    'Imagery: IRIS Shahid Bagheri drone carrier detected deploying explosive drone boats.',
];

// Floating number stack counter for positioning
let _floatingNumberStack = 0;

// ======================== ACTION TOOLTIPS ========================

const ACTION_TIPS = {
    'gather-intel':     { desc: 'Deploy CIA assets to reduce fog of war. Better intel means better decisions.', effect: 'Fog -8' },
    'analyze-threats':  { desc: 'Review current intelligence for actionable patterns and forecasts.', effect: 'Fog -3 (if fog low)' },
    'phone-call':       { desc: 'Call a foreign leader. Builds diplomatic capital and can shift alliances.', effect: 'Diplomacy +4, Tension -2' },
    'draft-proposal':   { desc: 'Draft a formal diplomatic proposal. Slow but powerful for international standing.', effect: 'Standing +5' },
    'demand-un-session':{ desc: 'Demand emergency UN Security Council session on the strait crisis.', effect: 'Standing +3, Tension -3' },
    'reposition-fleet': { desc: 'Move naval assets to deter Iranian aggression or protect shipping lanes.', effect: 'Tension +3, Iran aggr. -2' },
    'change-roe':       { desc: 'Cycle rules of engagement: Defensive → Moderate → Aggressive. Affects all engagements.', effect: 'Changes ROE' },
    'escort-tankers':   { desc: 'Assign warships to escort oil tankers through the strait. Protects oil flow.', effect: 'Oil flow +3, Tension +2' },
    'precision-strike': { desc: 'Strike a specific military target. Effective but escalatory.', effect: 'Iran aggr. -5, Tension +8' },
    'spec-ops-raid':    { desc: 'Special forces raid on Iranian military assets. High risk, high reward.', effect: 'Iran aggr. -6, Fog -5' },
    'air-strikes':      { desc: 'Launch sustained air campaign against Iranian military infrastructure.', effect: 'Iran aggr. -10, WarPath +1' },
    'sead-mission':     { desc: 'Suppress enemy air defenses. Enables further air operations.', effect: 'Tension +5, Fog -5' },
    'ground-troops':    { desc: 'Deploy ground forces to Iranian-held territory. Major escalation.', effect: 'Iran aggr. -15, WarPath +1' },
    'seize-islands':    { desc: 'Seize strategic Iranian islands controlling the strait.', effect: 'Iran aggr. -12, WarPath +1' },
    'full-mobilization':{ desc: 'Full military mobilization. Total commitment to war footing.', effect: 'All military metrics shift' },
    'press-conference': { desc: 'Hold a press conference to shape the narrative and boost approval.', effect: 'Approval +3, Polarization -2' },
    'brief-congress':   { desc: 'Brief congressional leaders. Builds political support for your strategy.', effect: 'Approval +2' },
    'adjust-sanctions': { desc: 'Tighten or loosen sanctions on Iran. Affects their economy and aggression.', effect: 'Iran econ ±5' },
    'market-intervention':{ desc: 'Release strategic oil reserves or subsidize fuel to stabilize markets.', effect: 'Oil price -5' },
    'issue-ultimatum':  { desc: 'Deliver a public ultimatum to Iran. Dramatic but polarizing.', effect: 'Tension +8, Approval +5' },
    'emergency-coalition':{ desc: 'Form an emergency multinational coalition for strait operations.', effect: 'Standing +5, Budget +15' },
    'escalate':         { desc: 'Increase military escalation level. Unlocks more aggressive options.', effect: 'Escalation +1' },
    'deescalate':       { desc: 'Reduce military escalation. Locks out aggressive options but eases tension.', effect: 'Escalation -1, Tension -5' },
};

// ======================== COLLAPSIBLE SECTION STATE ========================

const _sitCollapsed = {
    force: false,
    wire: false,
    intel: true,     // collapsed by default
    strategy: true,  // collapsed by default
    pending: true,   // collapsed by default
    decisions: true, // collapsed by default
};

function initUI() {
    updateGauges();
    setupKeyboardShortcuts();
    _injectActionPanelStyles();
    initMusic();
    updateTickers();
    initSituationPanel();
}

// ======================== SITUATION PANEL (left sidebar) ========================

function initSituationPanel() {
    const panel = document.getElementById('situation-panel');
    if (!panel) return;
    panel.style.display = '';
    const canvas = document.getElementById('game-canvas');
    if (canvas) canvas.classList.add('with-sitpanel');
    updateSituationPanel();
}

function updateSituationPanel() {
    const panel = document.getElementById('situation-panel');
    if (!panel || panel.style.display === 'none') return;

    const g = calculateGauges();
    const r = calculateRating();
    const esc = ESCALATION_LADDER[Math.min(SIM.escalationLevel, 5)];

    function valClass(v) { return v >= 60 ? 'good' : v >= 35 ? 'warning' : 'danger'; }

    // Recent headlines (last 6)
    const recent = SIM.headlines.slice(-6);
    const headlinesHtml = recent.map(h => {
        const prefix = h.level === 'critical' ? '<span class="wire-prefix wire-flash">FLASH</span> '
                     : h.level === 'warning' ? '<span class="wire-prefix wire-urgent">URGENT</span> '
                     : '';
        return `<div class="sit-headline ${h.level}">${prefix}${h.text}</div>`;
    }).join('');

    // Intel (last 3)
    const intelHtml = SIM.intelBriefings.slice(-3).map(b => {
        const cls = b.confidence === 'HIGH' ? 'conf-high' : b.confidence === 'MEDIUM' ? 'conf-medium' : 'conf-low';
        return `<div class="sit-intel-item"><span class="${cls}">[${b.confidence}]</span> ${b.text}</div>`;
    }).join('') || '<div class="sit-intel-item" style="color:#2a6a4a">No current intel.</div>';

    // Pending orders
    const pendingHtml = SIM.pendingEffects.map(p => {
        const eta = p.activateOnDay - SIM.day;
        return `<div class="sit-pending">\u25B7 ${p.cardName} \u2014 ${eta === 1 ? 'TOMORROW' : eta + 'd'}</div>`;
    }).join('');

    // Active stances
    const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS), ...Object.values(CONTACT_CARDS)];
    const stancesHtml = SIM.activeStances.map(s => {
        const card = allCards.find(c => c.id === s.cardId);
        if (!card) return '';
        return `<div class="sit-row"><span>${card.name}</span><span class="sit-val" style="color:${s.funding === 'high' ? '#dd4444' : s.funding === 'medium' ? '#ddaa44' : '#2a6a4a'}">${s.funding.toUpperCase()}</span></div>`;
    }).join('') || '<div class="sit-row" style="color:#2a6a4a">No active strategies</div>';

    // Situation summary text
    const tankerCount = SIM.tankers.filter(t => !t.seized).length;
    const seizedCount = SIM.tankers.filter(t => t.seized).length;
    const navyCount = SIM.navyShips.length;
    const boatCount = SIM.iranBoats.length;
    const mineCount = SIM.mines.length;
    const roeLabel = SIM.roe === 'aggressive' ? 'AGGRESSIVE' : SIM.roe === 'moderate' ? 'MODERATE' : 'DEFENSIVE';
    const roeColor = SIM.roe === 'aggressive' ? '#dd4444' : SIM.roe === 'moderate' ? '#ddaa44' : '#44dd88';

    function collSec(key, label, bodyHtml, alwaysShow) {
        if (alwaysShow) {
            return `<div class="sit-section"><div class="sit-label">${label}</div>${bodyHtml}</div>`;
        }
        const isCollapsed = _sitCollapsed[key];
        return `<div class="sit-section">
            <div class="sit-label collapsible ${isCollapsed ? 'collapsed' : ''}" data-sit-key="${key}">
                <span class="sit-toggle">\u25BC</span> ${label}
            </div>
            <div class="sit-section-body ${isCollapsed ? 'collapsed' : ''}" data-sit-body="${key}">
                ${bodyHtml}
            </div>
        </div>`;
    }

    const forceHtml = `
        <div class="sit-row"><span>USN Ships</span><span class="sit-val ${navyCount > 0 ? 'good' : 'danger'}">${navyCount}${SIM.carrier ? ' +CSG' : ''}</span></div>
        <div class="sit-row"><span>Tankers in transit</span><span class="sit-val">${tankerCount}</span></div>
        ${seizedCount > 0 ? `<div class="sit-row"><span>Seized</span><span class="sit-val danger">${seizedCount}</span></div>` : ''}
        <div class="sit-row"><span>IRGC boats</span><span class="sit-val ${boatCount > 3 ? 'danger' : boatCount > 0 ? 'warning' : 'good'}">${boatCount}</span></div>
        ${mineCount > 0 ? `<div class="sit-row"><span>Sea mines</span><span class="sit-val danger">${mineCount}</span></div>` : ''}
        ${SIM.drones.length > 0 ? `<div class="sit-row"><span>Drones</span><span class="sit-val warning">${SIM.drones.length}</span></div>` : ''}
        <div class="sit-row"><span>Iran posture</span><span class="sit-val warning">${(SIM.iranStrategy || 'unknown').toUpperCase()}</span></div>
        <div class="sit-row"><span>Intercepts</span><span class="sit-val good">${SIM.interceptCount}</span></div>
    `;

    panel.innerHTML = `
        <div class="sit-section">
            <div class="sit-label">SITUATION REPORT \u2014 DAY ${SIM.day}</div>
            <div class="sit-row"><span style="color:${esc.color}">${esc.name}</span><span class="sit-val" style="color:${esc.color}">${SIM.warPath}/5</span></div>
            <div class="sit-row"><span>ROE</span><span class="sit-val" style="color:${roeColor}">${roeLabel}</span></div>
            <div class="sit-row"><span>Strait</span><span class="sit-val ${SIM.straitOpenDays > 0 ? 'good' : 'danger'}">${SIM.straitOpenDays > 0 ? SIM.straitOpenDays + '/14 OPEN' : 'CONTESTED'}</span></div>
            <div class="sit-row"><span>Budget</span><span class="sit-val ${SIM.budget > 500 ? 'good' : SIM.budget > 200 ? 'warning' : 'danger'}">$${Math.round(SIM.budget)}M</span></div>
            <div class="sit-row"><span>Rating</span><span class="sit-val ${r.score >= 60 ? 'good' : r.score >= 35 ? 'warning' : 'danger'}">${r.grade}</span></div>
            ${typeof _getWinProgress === 'function' ? _getWinProgress() : ''}
        </div>
        ${collSec('force', 'FORCE DISPOSITION', forceHtml)}
        ${collSec('wire', 'WIRE FEED', headlinesHtml || '<div class="sit-headline" style="color:#2a6a4a">No breaking news.</div>')}
        ${collSec('intel', '<span class="wire-classify">TS//SI</span> INTEL', intelHtml)}
        ${SIM.activeStances.length > 0 ? collSec('strategy', 'ACTIVE STRATEGY', stancesHtml) : ''}
        ${pendingHtml ? collSec('pending', 'PENDING ORDERS', pendingHtml) : ''}
        ${_buildDecisionLogHtml()}
    `;

    // Wire up collapsible toggles
    panel.querySelectorAll('.sit-label.collapsible').forEach(label => {
        label.addEventListener('click', () => {
            const key = label.dataset.sitKey;
            _sitCollapsed[key] = !_sitCollapsed[key];
            label.classList.toggle('collapsed');
            const body = panel.querySelector(`[data-sit-body="${key}"]`);
            if (body) body.classList.toggle('collapsed');
        });
    });
}

function hideSituationPanel() {
    const panel = document.getElementById('situation-panel');
    if (panel) panel.style.display = 'none';
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
        canvas.classList.remove('with-sitpanel');
        canvas.classList.remove('with-both');
    }
}

function showSituationPanel() {
    const panel = document.getElementById('situation-panel');
    if (panel) panel.style.display = '';
    const canvas = document.getElementById('game-canvas');
    if (canvas) canvas.classList.add('with-sitpanel');
    updateSituationPanel();
}

// ======================== TERMINAL HELPERS ========================

function openTerminal(html) {
    hideActionPanel();
    TERMINAL.innerHTML = `
        <div class="terminal-bg"></div>
        <div class="terminal-box">
            <div class="terminal-scanlines"></div>
            ${html}
        </div>
    `;
    TERMINAL.classList.add('active');
}

function closeTerminal() {
    TERMINAL.classList.remove('active');
    TERMINAL.innerHTML = '';
}

/** Typewriter effect — types text into element, returns promise when done */
function typewrite(el, text, speed) {
    speed = speed || 25;
    return new Promise(resolve => {
        let i = 0;
        el.classList.add('typewriter-cursor');
        function next() {
            if (i < text.length) {
                el.textContent += text[i];
                i++;
                setTimeout(next, speed);
            } else {
                el.classList.remove('typewriter-cursor');
                resolve();
            }
        }
        next();
    });
}

/** Fade in buttons after a delay */
function fadeInButtons(container, delay) {
    delay = delay || 300;
    const btns = container.querySelectorAll('.term-btn');
    btns.forEach((btn, i) => {
        setTimeout(() => btn.classList.add('visible'), delay + i * 150);
    });
}

// ======================== GAUGES ========================

let _prevGaugeSnapshot = null;

function updateGauges() {
    const g = calculateGauges();
    const prev = _prevGaugeSnapshot || g;

    setGauge('gauge-stability', g.stability, g.stability - prev.stability);
    setGauge('gauge-economy', g.economy, g.economy - prev.economy);
    setGauge('gauge-support', g.support, g.support - prev.support);
    setGauge('gauge-intel', g.intel, g.intel - prev.intel);

    _prevGaugeSnapshot = { ...g };

    // Day counter in HUD
    const dayEl = document.getElementById('hud-day');
    if (dayEl) dayEl.textContent = _getDateString();

    // Update tickers and situation panel periodically
    if (SIM.day && typeof updateTickers === 'function') updateTickers();
    if (typeof updateSituationPanel === 'function') updateSituationPanel();

    // Rating
    const ratingEl = document.getElementById('hud-rating');
    if (ratingEl) {
        const r = calculateRating();
        ratingEl.textContent = r.grade;
        ratingEl.className = 'hud-rating ' + (r.score >= 60 ? 'good' : r.score >= 35 ? 'warning' : 'danger');
    }

    // Strait counter
    const straitEl = document.getElementById('hud-strait');
    if (straitEl) {
        if (SIM.straitOpenDays > 0) {
            straitEl.textContent = `STRAIT: ${SIM.straitOpenDays}/14 OPEN`;
            straitEl.className = 'strait-counter active';
        } else {
            straitEl.textContent = 'STRAIT: CONTESTED';
            straitEl.className = 'strait-counter';
        }
    }

    // --- Secondary metrics bar ---
    const setMetric = (id, text, level) => {
        const el = document.getElementById(id);
        if (el) { el.textContent = text; el.className = 'hud-metric ' + level; }
    };
    const tLvl = SIM.tension > 70 ? 'danger' : SIM.tension > 45 ? 'warning' : 'good';
    setMetric('hud-tension', `TENSION: ${Math.round(SIM.tension)}`, tLvl);
    const oLvl = SIM.oilFlow < 30 ? 'danger' : SIM.oilFlow < 50 ? 'warning' : 'good';
    setMetric('hud-oilflow', `OIL: ${Math.round(SIM.oilFlow)}%`, oLvl);
    const wLvl = SIM.warPath >= 4 ? 'danger' : SIM.warPath >= 3 ? 'warning' : 'good';
    setMetric('hud-warpath', `WARPATH: ${SIM.warPath}/5`, wLvl);
    const aLvl = SIM.domesticApproval < 25 ? 'danger' : SIM.domesticApproval < 45 ? 'warning' : 'good';
    setMetric('hud-approval', `APPROVAL: ${Math.round(SIM.domesticApproval)}`, aLvl);
    const bLvl = SIM.budget < 200 ? 'danger' : SIM.budget < 500 ? 'warning' : 'good';
    setMetric('hud-budget', `BUDGET: $${Math.round(SIM.budget)}M`, bLvl);

    // --- Lose-condition warnings ---
    const warnEl = document.getElementById('hud-warning');
    if (warnEl) {
        let warn = '';
        if (SIM.warPath >= 4) warn = '\u26A0 WAR IMMINENT — ONE MORE INCIDENT';
        else if (SIM.domesticApproval <= 20) warn = '\u26A0 REMOVAL PROCEEDINGS LIKELY';
        else if (SIM.internationalStanding <= 15) warn = '\u26A0 GLOBAL ISOLATION';
        else if (SIM.polarization >= 75) warn = '\u26A0 CIVIL UNREST ESCALATING';
        else if (SIM.budget < 100) warn = '\u26A0 BUDGET CRISIS';
        warnEl.textContent = warn;
        warnEl.style.display = warn ? '' : 'none';
    }
}

function setGauge(id, value, delta) {
    const el = document.getElementById(id);
    if (!el) return;
    const fill = el.querySelector('.gauge-fill');
    const valEl = el.querySelector('.gauge-value');
    const trendEl = el.querySelector('.gauge-trend');
    if (fill) {
        fill.style.width = value + '%';
        fill.className = 'gauge-fill ' + (value >= 60 ? 'good' : value >= 35 ? 'warning' : 'danger');
    }
    if (valEl) {
        valEl.textContent = Math.round(value);
        valEl.className = 'gauge-value ' + (value >= 60 ? 'good' : value >= 35 ? 'warning' : 'danger');
    }
    // Trend arrow
    if (trendEl && delta !== undefined) {
        const d = Math.round(delta);
        if (d > 0) { trendEl.textContent = '\u25B2+' + d; trendEl.className = 'gauge-trend up'; }
        else if (d < 0) { trendEl.textContent = '\u25BC' + d; trendEl.className = 'gauge-trend down'; }
        else { trendEl.textContent = ''; trendEl.className = 'gauge-trend stable'; }
    }
    // Warning flash when gauge drops below 35
    if (value < 35 && delta < -2) {
        el.classList.remove('danger-flash');
        void el.offsetWidth; // reflow to restart animation
        el.classList.add('danger-flash');
    }
}

// ======================== ADVISOR RECOMMENDATION ========================

function getAdvisorRecommendation() {
    if (SIM.tension > 70 && SIM.iranAggression > 60) {
        return 'Diplomatic approach recommended \u2014 military escalation risks war.';
    }
    if (SIM.oilFlow < 30) {
        return 'Priority: restore oil flow. Naval patrol and coalition recommended.';
    }
    if (SIM.fogOfWar > 70) {
        return 'Intelligence is critical. Deploy surveillance assets.';
    }
    if (SIM.domesticApproval < 35) {
        return 'Domestic support collapsing. Consider media campaign.';
    }
    if (SIM.budget < 300) {
        return 'Budget critical. Cut costs or negotiate burden-sharing.';
    }
    return 'Stay the course. Monitor the situation.';
}

// ======================== KEY DRIVERS (why gauges changed) ========================

function _getKeyDrivers() {
    const drivers = [];
    // Tension drivers
    if (SIM.crisisLevel >= 1) drivers.push({ text: `Crisis Level ${SIM.crisisLevel} adding tension`, cls: 'down-bad' });
    if (SIM.consecutiveProvocations > 1) drivers.push({ text: `${Math.round(SIM.consecutiveProvocations)} provocations increasing tension`, cls: 'down-bad' });
    if (SIM.diplomaticCapital > 60) drivers.push({ text: 'Strong diplomacy reducing tension', cls: 'up-good' });
    // Oil
    if (SIM.oilFlow < 40) drivers.push({ text: `Oil flow low (${Math.round(SIM.oilFlow)}%) — prices rising`, cls: 'down-bad' });
    if (SIM.proxyThreat > 30) drivers.push({ text: `Proxy attacks disrupting shipping (threat: ${Math.round(SIM.proxyThreat)})`, cls: 'down-bad' });
    const seized = SIM.tankers.filter(t => t.seized).length;
    if (seized > 0) drivers.push({ text: `${seized} tanker${seized > 1 ? 's' : ''} seized — flow and approval hit`, cls: 'down-bad' });
    // Approval
    if (SIM.budget < 200) drivers.push({ text: 'Budget crisis hurting approval', cls: 'down-bad' });
    if (SIM.oilFlow < 30) drivers.push({ text: 'Gas prices crushing domestic support', cls: 'down-bad' });
    // Iran
    if (SIM.iranEconomy < 30) drivers.push({ text: 'Iran economy collapsed — aggression rising', cls: 'down-bad' });
    if (SIM.chinaRelations < 30) drivers.push({ text: 'China buying Iranian oil — sanctions less effective', cls: 'down-bad' });
    if (SIM.russiaRelations < 25) drivers.push({ text: 'Russia arming Iran — provocations more dangerous', cls: 'down-bad' });
    // Positive
    if (SIM.interceptCount > 0) drivers.push({ text: `${SIM.interceptCount} intercepts boosting approval`, cls: 'up-good' });
    if (SIM.straitOpenDays > 0) drivers.push({ text: `Strait open ${SIM.straitOpenDays}/14 days toward victory`, cls: 'up-good' });
    // Player deltas
    const pd = SIM.playerDeltas;
    if (pd.tension < -3) drivers.push({ text: 'Your actions are reducing tension', cls: 'up-good' });
    if (pd.tension > 3) drivers.push({ text: 'Your actions are increasing tension', cls: 'down-bad' });
    if (pd.oilFlow > 3) drivers.push({ text: 'Your actions are improving oil flow', cls: 'up-good' });
    if (pd.domesticApproval > 3) drivers.push({ text: 'Your actions are boosting approval', cls: 'up-good' });
    if (pd.domesticApproval < -3) drivers.push({ text: 'Your actions are hurting approval', cls: 'down-bad' });

    if (drivers.length === 0) drivers.push({ text: 'Situation holding steady', cls: 'stable' });

    return drivers.slice(0, 5).map(d =>
        `<div class="morning-news-item" style="font-size:11px"><span class="og-delta ${d.cls}">\u25CF</span> ${d.text}</div>`
    ).join('');
}

// ======================== FIRST MORNING (Immersive Day 1 Intro) ========================

function showFirstMorning() {
    const charName = SIM.character ? SIM.character.name : 'ADVISOR';
    const charTitle = SIM.character ? SIM.character.title : '';

    const advisorImg = SIM.character ? SIM.character.portraitImage : null;

    openTerminal(`
        <div class="fm-top-row">
            <img src="assets/us-flag.png" class="fm-flag" alt="US">
            <div class="fm-top-center">
                <div class="term-header" style="color:#dd4444">FEB 28, 2026 \u2014 0547 HOURS</div>
                <div class="term-title" style="color:#dd4444">SITUATION ROOM</div>
            </div>
            <img src="assets/iran-flag.png" class="fm-flag" alt="Iran">
        </div>
        ${advisorImg ? `<img src="${advisorImg}" class="fm-advisor-portrait" alt="${charName}">` : ''}
        <div class="term-line dim" style="margin-bottom:12px">EYES ONLY \u2014 ${charName.toUpperCase()}, ${charTitle.toUpperCase()}</div>

        <div class="term-section">
            <div class="term-section-label" style="color:#dd4444">AP FLASH \u2014 WIRE FEED</div>
            <div id="fm-wire" class="morning-news-item critical" style="min-height:120px"></div>
        </div>

        <div class="term-section" id="fm-sitrep-section" style="display:none">
            <div class="term-section-label"><span class="wire-prefix wire-sitrep">SITREP 280547ZFEB26</span></div>
            <div id="fm-sitrep" class="term-line" style="min-height:60px"></div>
        </div>

        <div class="term-section" id="fm-orders-section" style="display:none">
            <div class="term-section-label" style="color:#ddaa44">YOUR ORDERS</div>
            <div id="fm-orders" class="term-line" style="min-height:40px"></div>
        </div>

        <div class="term-btn-row" id="fm-buttons" style="display:none">
            <button class="term-btn danger-btn" id="fm-proceed">[ ENTER THE SITUATION ROOM ]</button>
        </div>
    `);

    const wireEl = document.getElementById('fm-wire');
    const sitrepSection = document.getElementById('fm-sitrep-section');
    const sitrepEl = document.getElementById('fm-sitrep');
    const ordersSection = document.getElementById('fm-orders-section');
    const ordersEl = document.getElementById('fm-orders');
    const buttonsRow = document.getElementById('fm-buttons');

    const wireText = 'US-Israel joint strikes hit 500 targets across Iran. Supreme Leader Khamenei confirmed killed. Iran retaliating with 500+ ballistic missiles and 2,000 drones — 60% targeting US forces in region. IRGC Navy deploying across Strait of Hormuz. Tanker MV Advantage Sweet seized. Oil surges past $110. Lloyd\'s suspends all war risk coverage. Three carrier strike groups en route.';

    const sitrepText = 'IRIS Dena frigate sunk — first major naval engagement since 1988. KC-135 tanker down, 3 KIA. Al Udeid and Al Dhafra bases under ballistic missile attack. Mojtaba Khamenei emerging as Supreme Leader successor with full IRGC backing. Houthis resuming Red Sea attacks. Hezbollah mobilizing on Lebanese border. China and Russia calling emergency UNSC session.';

    const ordersText = `You are ${charName}. The strait is closed. Oil is spiking. Three carrier groups are in theater. Iran\'s leadership is in chaos but its military is retaliating hard. The world is watching what you do in the next 24 hours. There are no good options — only less bad ones.`;

    let skipped = false;

    // Allow click to skip typewriter
    TERMINAL.addEventListener('click', function skipHandler(e) {
        if (e.target.id === 'fm-proceed') return;
        if (!skipped) {
            skipped = true;
            wireEl.textContent = wireText;
            sitrepSection.style.display = '';
            sitrepEl.textContent = sitrepText;
            ordersSection.style.display = '';
            ordersEl.textContent = ordersText;
            buttonsRow.style.display = '';
            fadeInButtons(TERMINAL, 100);
            TERMINAL.removeEventListener('click', skipHandler);
        }
    });

    // Typewriter sequence
    typewrite(wireEl, wireText, 18).then(() => {
        if (skipped) return;
        sitrepSection.style.display = '';
        return typewrite(sitrepEl, sitrepText, 15);
    }).then(() => {
        if (skipped) return;
        ordersSection.style.display = '';
        return typewrite(ordersEl, ordersText, 20);
    }).then(() => {
        if (skipped) return;
        buttonsRow.style.display = '';
        fadeInButtons(TERMINAL, 300);
    });

    // Wait for button
    const waitForButton = setInterval(() => {
        const btn = document.getElementById('fm-proceed');
        if (btn) {
            btn.addEventListener('click', () => {
                clearInterval(waitForButton);
                closeTerminal();
                // Day 1: go to initial card pick first, THEN dayplay
                SIM.phase = 'initial_pick';
                showInitialPick();
            });
            clearInterval(waitForButton);
        }
    }, 100);
}

// ======================== INITIAL PICK (Day 1) ========================

function showInitialPick() {
    const hand = dealHand(SIM.character, 1, SIM.playedExclusives);
    const maxPicks = (SIM.character.cardPool && SIM.character.cardPool.maxPicks) || 3;
    const selected = []; // [{card, funding}]

    function render() {
        const catColors = { military: '#dd4444', diplomatic: '#4488dd', economic: '#ddaa44', intelligence: '#44dd88', domestic: '#aa88dd' };
        const recommendation = getAdvisorRecommendation();

        openTerminal(`
            <div class="term-header">DAY 1 \u2014 INITIAL STRATEGY</div>
            <div class="term-title">SELECT ${maxPicks} CARDS</div>
            <div class="term-line dim">"${getAdvisorReaction('weekStart')}" \u2014 ${SIM.character.name}</div>
            <div class="term-line" style="color:#ddaa44;margin:4px 0 8px 0">\u25B6 ${recommendation}</div>
            <div class="initial-cards">
                ${hand.map((card, i) => {
                    const sel = selected.find(s => s.card === card);
                    const isSelected = !!sel;
                    const catColor = catColors[card.category] || '#44dd88';
                    const disabled = selected.length >= maxPicks && !isSelected;
                    return `
                        <div class="initial-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}" data-idx="${i}">
                            <div class="icard-cat" style="color:${catColor}">${card.category.toUpperCase()}</div>
                            <div class="icard-name">${card.name}</div>
                            <div class="icard-desc">${card.description}</div>
                            ${isSelected ? `
                                <div class="icard-funding">
                                    <button class="fund-btn ${sel.funding === 'low' ? 'active' : ''}" data-card="${i}" data-fund="low">LOW</button>
                                    <button class="fund-btn ${sel.funding === 'medium' ? 'active' : ''}" data-card="${i}" data-fund="medium">MED</button>
                                    <button class="fund-btn ${sel.funding === 'high' ? 'active' : ''}" data-card="${i}" data-fund="high">HIGH</button>
                                </div>
                                <div class="icard-hint">${card.hint[sel.funding]}</div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="term-line dim" style="text-align:center;margin-top:8px">${selected.length} selected (up to ${maxPicks})</div>
            <div class="term-btn-row">
                <button class="term-btn ${selected.length > 0 ? 'visible' : ''}" id="pick-confirm">
                    [ DEPLOY STRATEGY ]
                </button>
            </div>
        `);

        // Card click
        TERMINAL.querySelectorAll('.initial-card').forEach(cardEl => {
            cardEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('fund-btn')) return;
                const idx = parseInt(cardEl.dataset.idx);
                const card = hand[idx];
                const existingIdx = selected.findIndex(s => s.card === card);
                if (existingIdx >= 0) {
                    selected.splice(existingIdx, 1);
                } else if (selected.length < maxPicks) {
                    selected.push({ card, funding: 'medium' });
                }
                render();
            });
        });

        // Funding buttons
        TERMINAL.querySelectorAll('.fund-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.card);
                const card = hand[idx];
                const sel = selected.find(s => s.card === card);
                if (sel) { sel.funding = btn.dataset.fund; render(); }
            });
        });

        // Confirm
        const confirmBtn = document.getElementById('pick-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (selected.length === 0) return;
                applyStances(selected);
                closeTerminal();
                resetActionPoints();
                startDayPlay();
            });
        }
    }

    render();
}

/** Apply selected stances to SIM — military activates fast, diplomacy/economics delayed */
function applyStances(selected) {
    // Track exclusive cards
    for (const s of selected) {
        const isBonus = Object.values(CHARACTER_BONUS_CARDS).some(b => b.id === s.card.id);
        if (isBonus || s.card.exclusive) {
            if (!SIM.playedExclusives.includes(s.card.id)) SIM.playedExclusives.push(s.card.id);
        }
    }
    // Hegseth: military cards cost command authority
    if (SIM.character.cardPool && SIM.character.cardPool.militaryAuthorityCost) {
        for (const s of selected) {
            const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS)];
            const card = allCards.find(c => c.id === s.card.id);
            if (card && card.category === 'military') {
                const cost = s.funding === 'high' ? 15 : s.funding === 'medium' ? 8 : 3;
                SIM.uniqueResource -= cost;
            }
        }
    }
    // Track alignment shifts from card choices
    for (const s of selected) {
        if (s.card.effects && s.card.effects[s.funding] && typeof shiftAlignment === 'function') {
            shiftAlignment(s.card.effects[s.funding]);
        }
    }
    // Queue effects with implementation delay
    for (const s of selected) {
        const delay = s.card.delayDays || (typeof CATEGORY_DELAY !== 'undefined' ? CATEGORY_DELAY[s.card.category] : 1) || 1;
        if (delay <= 1) {
            // Military: instant activation
            if (!SIM.activeStances.find(st => st.cardId === s.card.id)) {
                SIM.activeStances.push({ cardId: s.card.id, funding: s.funding });
                SIM.stanceActivationDay[s.card.id] = SIM.day;
            }
            addHeadline(`SITREP: ${s.card.name} (${s.funding.toUpperCase()}) operational`, 'normal');
        } else {
            // Delayed activation
            if (typeof queueCardEffects === 'function') {
                queueCardEffects(s.card, s.funding);
            } else {
                SIM.activeStances.push({ cardId: s.card.id, funding: s.funding });
                SIM.stanceActivationDay[s.card.id] = SIM.day;
                addHeadline(`Strategy deployed: ${s.card.name} (${s.funding})`, 'normal');
            }
        }
    }
}

// ======================== DAILY REPORT (merged morning + overnight) ========================

function showDailyReport() {
    const g = calculateGauges();
    const prev = SIM.prevGauges || g;
    const advisorQuote = getAdvisorReaction('weekStart');
    const recommendation = getAdvisorRecommendation();

    // Delta helper
    function delta(curr, prevVal) {
        const d = Math.round(curr - prevVal);
        if (d === 0) return { text: '\u2014', cls: 'stable' };
        const arrow = d > 0 ? '+' + d : '' + d;
        return { text: arrow, cls: d > 0 ? 'up-good' : 'down-bad' };
    }

    const gauges = [
        { label: 'STABILITY', value: g.stability, delta: delta(g.stability, prev.stability) },
        { label: 'ECONOMY', value: g.economy, delta: delta(g.economy, prev.economy) },
        { label: 'SUPPORT', value: g.support, delta: delta(g.support, prev.support) },
        { label: 'INTEL', value: g.intel, delta: delta(g.intel, prev.intel) },
    ];

    // Day 1: show immersive first morning instead of generic report
    if (SIM.day === 1) {
        showFirstMorning();
        return;
    }

    // Headlines for current day — with wire service formatting
    const todayHeadlines = SIM.headlines.filter(h => h.day === SIM.day).slice(-5);
    let headlinesHtml;
    if (todayHeadlines.length > 0) {
        headlinesHtml = todayHeadlines.map(h => {
            const prefix = h.level === 'critical' ? '<span class="wire-prefix wire-flash">FLASH</span> '
                         : h.level === 'warning' ? '<span class="wire-prefix wire-urgent">URGENT</span> '
                         : h.level === 'good' ? '<span class="wire-prefix wire-bulletin">BULLETIN</span> '
                         : '';
            return `<div class="morning-news-item ${h.level}">${prefix}${h.text}</div>`;
        }).join('');
    } else {
        headlinesHtml = '<div class="term-line dim">Nothing notable happened today.</div>';
    }

    // Current active stances
    const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS), ...Object.values(CONTACT_CARDS)];
    const stanceHtml = SIM.activeStances.map(s => {
        const card = allCards.find(c => c.id === s.cardId);
        if (!card) return '';
        const daysActive = SIM.day - (SIM.stanceActivationDay[s.cardId] || SIM.day);
        return `<div class="morning-stance">
            <span class="stance-name">${card.name}</span>
            <span class="stance-funding ${s.funding}">${s.funding.toUpperCase()}${daysActive > 0 ? ' \u00B7 ' + daysActive + 'd' : ''}</span>
        </div>`;
    }).join('');

    // Special action button
    let specialActionHtml = '';
    if (SIM.character.specialAction && SIM.character.specialAction.cooldown === 0) {
        specialActionHtml = `<button class="term-btn" id="btn-special-action">[ ${SIM.character.specialAction.name.toUpperCase()} ]</button>`;
    }

    const advisorImg = SIM.character.portraitImage || null;

    openTerminal(`
        <div class="briefing-header-row">
            ${advisorImg ? `<img src="${advisorImg}" class="briefing-portrait" alt="${SIM.character.name}">` : ''}
            <div class="briefing-header-text">
                <div class="term-header">${_getDateString()} \u2014 DAY ${SIM.day}</div>
                <div class="term-title">${_getBriefingTitle()}</div>
                <div class="term-line dim">"${_getMorningBrief()}" \u2014 ${SIM.character.name}</div>
            </div>
        </div>
        <div class="term-line" style="color:#ddaa44;margin:4px 0 8px 0">\u25B6 ${recommendation}</div>

        <div class="term-section">
            <div class="term-section-label">WHAT HAPPENED</div>
            ${headlinesHtml}
        </div>

        <div class="term-section">
            <div class="term-section-label">GAUGES</div>
            ${gauges.map(gItem => `
                <div class="overnight-gauge">
                    <span class="og-label">${gItem.label}</span>
                    <span class="og-value">${gItem.value}</span>
                    <span class="og-delta ${gItem.delta.cls}">${gItem.delta.text}</span>
                </div>
            `).join('')}
        </div>

        <div class="term-section">
            <div class="term-section-label">KEY DRIVERS</div>
            ${_getKeyDrivers()}
        </div>

        <div class="term-section">
            <div class="term-section-label">ACTIVE STRATEGY</div>
            ${stanceHtml || '<div class="term-line dim">No active strategies.</div>'}
        </div>

        ${SIM.pendingEffects.length > 0 ? `
        <div class="term-section">
            <div class="term-section-label">PENDING ORDERS</div>
            ${SIM.pendingEffects.map(p => {
                const eta = p.activateOnDay - SIM.day;
                return `<div class="pending-order">
                    <span class="po-name">${p.cardName} (${p.funding.toUpperCase()})</span>
                    <span class="po-eta">ETA: ${eta === 1 ? 'TOMORROW' : eta + ' DAYS'}</span>
                </div>`;
            }).join('')}
        </div>` : ''}

        ${SIM.intelBriefings.length > 0 ? `
        <div class="term-section">
            <div class="term-section-label"><span class="wire-classify">TOP SECRET // SI // NOFORN</span> \u2014 INTEL SUMMARY</div>
            ${SIM.intelBriefings.slice(-3).map(b => {
                const confClass = b.confidence === 'HIGH' ? 'conf-high' : b.confidence === 'MEDIUM' ? 'conf-medium' : 'conf-low';
                return `<div class="morning-news-item" style="font-size:11px"><span class="${confClass}">[${b.confidence}]</span> ${b.text}</div>`;
            }).join('')}
        </div>` : ''}

        <div class="term-section">
            <div class="term-section-label">STATUS</div>
            <div class="stat-row"><span>Escalation</span><span style="color:${_getEscalationColor()}">${_getEscalationName()} (${SIM.warPath}/5)</span></div>
            <div class="stat-row"><span>Strait Open</span><span>${SIM.straitOpenDays}/14</span></div>
            <div class="stat-row"><span>Budget</span><span>$${Math.round(SIM.budget)}M</span></div>
            <div class="stat-row"><span>Iran</span><span>${SIM.iranStrategy.toUpperCase()}</span></div>
            ${SIM.character.uniqueResource ? `<div class="stat-row"><span>${SIM.character.uniqueResource.name}</span><span>${Math.round(SIM.uniqueResource)}</span></div>` : ''}
        </div>

        <div class="term-btn-row">
            <button class="term-btn" id="btn-maintain">[ MAINTAIN COURSE ]</button>
            <button class="term-btn warning-btn" id="btn-adjust">[ ADJUST STRATEGY ]</button>
            ${specialActionHtml}
        </div>
    `);

    fadeInButtons(TERMINAL, 400);

    document.getElementById('btn-maintain').addEventListener('click', () => {
        closeTerminal();
        resetActionPoints();
        startDayPlay();
    });

    document.getElementById('btn-adjust').addEventListener('click', () => {
        showAdjustStrategy();
    });

    // Special action handler
    const specialBtn = document.getElementById('btn-special-action');
    if (specialBtn) {
        specialBtn.addEventListener('click', () => {
            executeSpecialAction();
            showDailyReport(); // refresh
        });
    }
}

// ======================== CHARACTER SPECIAL ACTION ========================

function executeSpecialAction() {
    if (!SIM.character.specialAction || SIM.character.specialAction.cooldown > 0) return;

    const action = SIM.character.specialAction;

    // Execute the action's effect if it has one
    if (typeof action.execute === 'function') {
        action.execute(SIM);
    } else if (action.effects) {
        for (const [key, val] of Object.entries(action.effects)) {
            if (SIM[key] !== undefined) {
                SIM[key] = Math.max(0, Math.min(100, SIM[key] + val));
            }
        }
    }

    // Set cooldown
    action.cooldown = action.cooldownMax || action.cooldownDuration || 3;

    addHeadline(`Special action: ${action.name}`, 'good');
    showToast(`${action.name} activated!`, 'good');
}

// ======================== ADJUST STRATEGY ========================

function showAdjustStrategy() {
    const hand = dealHand(SIM.character, SIM.week, SIM.playedExclusives);
    const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS), ...Object.values(CONTACT_CARDS)];
    const catColors = { military: '#dd4444', diplomatic: '#4488dd', economic: '#ddaa44', intelligence: '#44dd88', domestic: '#aa88dd' };
    const maxPicks = (SIM.character.cardPool && SIM.character.cardPool.maxPicks) || 3;

    // Current stances
    const currentCards = SIM.activeStances.map(s => {
        return { card: allCards.find(c => c.id === s.cardId), funding: s.funding };
    }).filter(s => s.card);

    // If no active stances, show card selection instead of swap
    if (currentCards.length === 0) {
        showInitialPick();
        return;
    }

    let removingIdx = null;
    let replacement = null;

    // Available replacements: cards in hand that aren't currently active
    const activeIds = SIM.activeStances.map(s => s.cardId);
    const available = hand.filter(c => !activeIds.includes(c.id));

    function render() {
        openTerminal(`
            <div class="term-header">ADJUST STRATEGY \u2014 DAY ${SIM.day}</div>
            <div class="term-title">SWAP ONE CARD</div>
            <div class="term-line warning">Changing course costs credibility. Choose wisely.</div>

            <div class="term-section">
                <div class="term-section-label">CURRENT STRATEGY \u2014 click to remove</div>
                ${currentCards.map((s, i) => {
                    const catColor = catColors[s.card.category] || '#44dd88';
                    return `<div class="adjust-card ${removingIdx === i ? 'selected' : ''}" data-remove="${i}">
                        <div class="adjust-card-cat" style="color:${catColor}">${s.card.category.toUpperCase()}</div>
                        <div class="adjust-card-name">${s.card.name}</div>
                        <div class="adjust-card-desc">${s.card.description}</div>
                    </div>`;
                }).join('')}
            </div>

            ${removingIdx !== null ? `
                <div class="term-section">
                    <div class="term-section-label">AVAILABLE REPLACEMENTS</div>
                    ${available.length > 0 ? available.map((card, i) => {
                        const catColor = catColors[card.category] || '#44dd88';
                        const isSelected = replacement && replacement.card.id === card.id;
                        return `<div class="adjust-card ${isSelected ? 'selected' : ''}" data-replace="${i}">
                            <div class="adjust-card-cat" style="color:${catColor}">${card.category.toUpperCase()}</div>
                            <div class="adjust-card-name">${card.name}</div>
                            <div class="adjust-card-desc">${card.description}</div>
                            ${isSelected ? `
                                <div class="adjust-funding">
                                    <button class="fund-btn ${replacement.funding === 'low' ? 'active' : ''}" data-fund="low">LOW</button>
                                    <button class="fund-btn ${replacement.funding === 'medium' ? 'active' : ''}" data-fund="medium">MED</button>
                                    <button class="fund-btn ${replacement.funding === 'high' ? 'active' : ''}" data-fund="high">HIGH</button>
                                </div>
                            ` : ''}
                        </div>`;
                    }).join('') : '<div class="term-line dim">No replacements available.</div>'}
                </div>
            ` : ''}

            <div class="term-btn-row">
                <button class="term-btn" id="btn-cancel-adjust">[ CANCEL ]</button>
                ${replacement ? `<button class="term-btn visible" id="btn-confirm-swap">[ CONFIRM SWAP ]</button>` : ''}
            </div>
        `);

        fadeInButtons(TERMINAL, 200);

        // Remove card click
        TERMINAL.querySelectorAll('[data-remove]').forEach(el => {
            el.addEventListener('click', () => {
                removingIdx = parseInt(el.dataset.remove);
                replacement = null;
                render();
            });
        });

        // Replacement card click
        TERMINAL.querySelectorAll('[data-replace]').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('fund-btn')) return;
                const idx = parseInt(el.dataset.replace);
                replacement = { card: available[idx], funding: 'medium' };
                render();
            });
        });

        // Funding buttons
        TERMINAL.querySelectorAll('.fund-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (replacement) { replacement.funding = btn.dataset.fund; render(); }
            });
        });

        // Cancel
        const cancelBtn = document.getElementById('btn-cancel-adjust');
        if (cancelBtn) cancelBtn.addEventListener('click', () => showDailyReport());

        // Confirm swap
        const confirmBtn = document.getElementById('btn-confirm-swap');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const removed = currentCards[removingIdx];
                SIM.activeStances = SIM.activeStances.filter(s => s.cardId !== removed.card.id);
                delete SIM.stanceActivationDay[removed.card.id];

                SIM.activeStances.push({ cardId: replacement.card.id, funding: replacement.funding });
                SIM.stanceActivationDay[replacement.card.id] = SIM.day;

                const isBonus = Object.values(CHARACTER_BONUS_CARDS).some(b => b.id === replacement.card.id);
                if (isBonus || replacement.card.exclusive) {
                    if (!SIM.playedExclusives.includes(replacement.card.id)) SIM.playedExclusives.push(replacement.card.id);
                }

                addHeadline(`Strategy changed: ${removed.card.name} \u2192 ${replacement.card.name}`, 'warning');

                closeTerminal();
                resetActionPoints();
                startDayPlay();
            });
        }
    }

    render();
}

// ======================== ACTION PANEL (replaces Quick Actions) ========================

function resetActionPoints() {
    SIM.actionPoints = 3;
    if (SIM.roe === undefined) SIM.roe = 'defensive';
}

function _applyEffect(key, val) {
    // Apply the immediate effect
    if (key === 'oilFlow') SIM.oilFlow = Math.max(10, Math.min(100, SIM.oilFlow + val));
    else if (key === 'oilPrice') SIM.oilPrice = Math.max(40, SIM.oilPrice + val);
    else if (key === 'tension') SIM.tension = Math.max(0, Math.min(100, SIM.tension + val));
    else if (key === 'domesticApproval') SIM.domesticApproval = Math.max(0, Math.min(100, SIM.domesticApproval + val));
    else if (key === 'internationalStanding') SIM.internationalStanding = Math.max(0, Math.min(100, SIM.internationalStanding + val));
    else if (key === 'iranAggression') SIM.iranAggression = Math.max(0, Math.min(100, SIM.iranAggression + val));
    else if (key === 'budget') SIM.budget += val;
    else if (key === 'conflictRisk') SIM.conflictRisk = Math.max(0, Math.min(100, SIM.conflictRisk + val));
    else if (key === 'fogOfWar') SIM.fogOfWar = Math.max(0, Math.min(100, SIM.fogOfWar + val));
    else if (key === 'diplomaticCapital') SIM.diplomaticCapital = Math.max(0, Math.min(100, SIM.diplomaticCapital + val));
    else if (key === 'proxyThreat') SIM.proxyThreat = Math.max(0, Math.min(100, SIM.proxyThreat + val));
    else if (key === 'chinaRelations') SIM.chinaRelations = Math.max(0, Math.min(100, SIM.chinaRelations + val));
    else if (key === 'russiaRelations') SIM.russiaRelations = Math.max(0, Math.min(100, SIM.russiaRelations + val));
    else if (key === 'polarization') SIM.polarization = Math.max(0, Math.min(100, SIM.polarization + val));
    else if (key === 'assassinationRisk') SIM.assassinationRisk = Math.max(0, Math.min(100, SIM.assassinationRisk + val));
    else if (key === 'warPath') SIM.warPath = Math.max(0, SIM.warPath + val);
    else if (key === 'iranEconomy') SIM.iranEconomy = Math.max(0, Math.min(100, SIM.iranEconomy + val));
    else if (key === 'interceptCount') SIM.interceptCount = (SIM.interceptCount || 0) + val;
    else if (key === 'oilFlowProtection') SIM.oilFlow = Math.max(10, Math.min(100, SIM.oilFlow + val));
    // Character unique resource keys
    else if (key === 'politicalCapital' || key === 'commandAuthority' || key === 'credibility'
          || key === 'baseEnthusiasm' || key === 'exposure') {
        SIM.uniqueResource = Math.max(0, Math.min(100, SIM.uniqueResource + val));
    }

    // Also accumulate into playerDeltas so dailyUpdate() doesn't wipe the effect
    if (SIM.playerDeltas && key in SIM.playerDeltas) {
        SIM.playerDeltas[key] += val;
    }
}

function _applyEffects(effects) {
    for (const [key, val] of Object.entries(effects)) {
        _applyEffect(key, val);
        if (val !== 0) {
            showFloatingNumber(key, val);
        }
    }
    updateGauges();
}

function _getROELabel() {
    const roe = SIM.roe || 'defensive';
    if (roe === 'defensive') return 'DEFENSIVE';
    if (roe === 'moderate') return 'MODERATE';
    return 'AGGRESSIVE';
}

function _getROEColor() {
    const roe = SIM.roe || 'defensive';
    if (roe === 'defensive') return '#44dd88';
    if (roe === 'moderate') return '#ddaa44';
    return '#dd4444';
}

function showActionPanel() {
    hideActionPanel();

    // Shrink all layout elements to make room for action panel
    const canvas = document.getElementById('game-canvas');
    const gaugeBar = document.getElementById('gauge-bar');
    const tickers = document.getElementById('news-tickers');
    if (canvas) {
        canvas.classList.remove('with-sitpanel');
        canvas.classList.add('with-both');
        canvas.style.width = '';
    }
    if (gaugeBar) gaugeBar.style.right = '280px';
    if (tickers) tickers.style.right = '280px';

    const panel = document.createElement('div');
    panel.id = 'action-panel';

    function renderPanel() {
        const ap = SIM.actionPoints || 0;
        const apDots = Array.from({ length: 3 }, (_, i) => i < ap
            ? '<span class="ap-dot filled">\u25CF</span>'
            : '<span class="ap-dot empty">\u25CB</span>'
        ).join('');

        const budgetStr = '$' + Math.round(SIM.budget) + 'M';
        const roeLabel = _getROELabel();
        const roeColor = _getROEColor();

        // Determine if special action is available
        let specialHtml = '';
        if (SIM.character && SIM.character.specialAction && SIM.character.specialAction.cooldown === 0) {
            specialHtml = `
                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#ddaa44">SPECIAL</div>
                    <button class="ap-btn special" data-action="special">${SIM.character.specialAction.name.toUpperCase()}</button>
                </div>
            `;
        } else if (SIM.character && SIM.character.specialAction && SIM.character.specialAction.cooldown > 0) {
            specialHtml = `
                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#ddaa44">SPECIAL</div>
                    <button class="ap-btn disabled">${SIM.character.specialAction.name.toUpperCase()} (${SIM.character.specialAction.cooldown}d)</button>
                </div>
            `;
        }

        const esc = SIM.escalationLevel || 0;
        const escInfo = ESCALATION_LADDER[Math.min(esc, 5)];
        const escName = escInfo ? escInfo.name : 'UNKNOWN';
        const escColor = escInfo ? escInfo.color : '#888';

        // Tooltip helper
        function tip(action) {
            const t = ACTION_TIPS[action];
            if (!t) return '';
            return `<span class="ap-tooltip">${t.desc}<div class="tt-effect">${t.effect}</div></span>`;
        }

        // Helper: locked button if escalation too low
        function milBtn(label, action, reqLevel, cost) {
            const costStr = cost ? ` <span class="ap-cost">$${cost}M</span>` : '';
            if (esc < reqLevel) {
                const reqName = ESCALATION_LADDER[reqLevel].name;
                return `<button class="ap-btn locked" title="Requires ${reqName}"><span class="ap-lock">\u25A0 LVL${reqLevel}</span> ${label}${costStr}</button>`;
            }
            const budgetOk = !cost || SIM.budget >= cost;
            return `<button class="ap-btn ${ap <= 0 || !budgetOk ? 'disabled' : ''}" data-action="${action}">${label}${costStr}${tip(action)}</button>`;
        }

        // Can escalate if not already at max and AP available
        const canEscalate = esc < 5 && ap > 0;
        const nextEsc = ESCALATION_LADDER[Math.min(esc + 1, 5)];

        panel.innerHTML = `
            <div class="ap-header">
                <div class="ap-title">ACTIONS</div>
                <div class="ap-points">AP: ${apDots}</div>
                <div class="ap-budget">${budgetStr}</div>
            </div>

            <div class="ap-escalation-bar">
                <span class="ap-esc-label">ESCALATION:</span>
                <span class="ap-esc-level" style="color:${escColor}">${escName}</span>
                <span class="ap-esc-pips">${Array.from({length: 6}, (_, i) => `<span class="ap-esc-pip ${i <= esc ? 'active' : ''}" style="${i <= esc ? 'background:' + ESCALATION_LADDER[i].color : ''}">${i}</span>`).join('')}</span>
            </div>

            <div class="ap-scroll">
                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#44dd88">INTELLIGENCE</div>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 15 ? 'disabled' : ''}" data-action="gather-intel">GATHER INTEL <span class="ap-cost">$15M</span>${tip('gather-intel')}</button>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="analyze-threats">ANALYZE THREATS${tip('analyze-threats')}</button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#4488dd">DIPLOMACY</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="phone-call">MAKE PHONE CALL${tip('phone-call')}</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 10 ? 'disabled' : ''}" data-action="draft-proposal">DRAFT PROPOSAL <span class="ap-cost">$10M</span>${tip('draft-proposal')}</button>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="demand-un-session">DEMAND UN SESSION${tip('demand-un-session')}</button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#dd4444">MILITARY <span style="color:${escColor};font-size:8px">[${escName}]</span></div>
                    ${milBtn('REPOSITION FLEET', 'reposition-fleet', 1, 0)}
                    ${milBtn('CHANGE ROE <span class="ap-roe" style="color:' + roeColor + '">[' + roeLabel + ']</span>', 'change-roe', 1, 0)}
                    ${milBtn('ESCORT TANKERS', 'escort-tankers', 1, 10)}
                    ${milBtn('PRECISION STRIKE', 'precision-strike', 2, 30)}
                    ${milBtn('SPECIAL OPS RAID', 'spec-ops-raid', 2, 25)}
                    ${milBtn('LAUNCH AIR STRIKES', 'air-strikes', 3, 50)}
                    ${milBtn('SUPPRESS AIR DEFENSES', 'sead-mission', 3, 40)}
                    ${milBtn('DEPLOY GROUND FORCES', 'ground-troops', 4, 80)}
                    ${milBtn('SEIZE IRANIAN ISLANDS', 'seize-islands', 4, 60)}
                    ${milBtn('FULL MOBILIZATION', 'full-mobilization', 5, 100)}
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#aa88dd">DOMESTIC</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="press-conference">PRESS CONFERENCE${tip('press-conference')}</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 5 ? 'disabled' : ''}" data-action="brief-congress">BRIEF CONGRESS <span class="ap-cost">$5M</span>${tip('brief-congress')}</button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#ddaa44">ECONOMIC</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="adjust-sanctions">ADJUST SANCTIONS${tip('adjust-sanctions')}</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 25 ? 'disabled' : ''}" data-action="market-intervention">MARKET INTERVENTION <span class="ap-cost">$25M</span>${tip('market-intervention')}</button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#dd4444">ESCALATION</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="issue-ultimatum">ISSUE ULTIMATUM${tip('issue-ultimatum')}</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 20 ? 'disabled' : ''}" data-action="emergency-coalition">EMERGENCY COALITION <span class="ap-cost">$20M</span>${tip('emergency-coalition')}</button>
                    ${canEscalate ? `<button class="ap-btn escalate-btn" data-action="escalate" title="Move to: ${nextEsc.name}">ESCALATE \u25B2 <span style="color:${nextEsc.color}">${nextEsc.name}</span>${tip('escalate')}</button>` : ''}
                    ${esc > 0 ? `<button class="ap-btn deescalate-btn ${ap <= 0 ? 'disabled' : ''}" data-action="deescalate">DE-ESCALATE \u25BC${tip('deescalate')}</button>` : ''}
                </div>

                ${specialHtml}
            </div>

            <div class="ap-win-hint">
                ${typeof _getWinProgress === 'function' ? _getWinProgress() : ''}
            </div>

            <div class="ap-footer">
                <button class="ap-end-btn" data-action="end-day">[ END DAY ]</button>
            </div>
        `;

        // Wire up buttons
        panel.querySelectorAll('.ap-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (!action) return;
                _executeAction(action, renderPanel);
            });
        });

        panel.querySelector('.ap-end-btn').addEventListener('click', () => {
            _endDay();
        });
    }

    document.body.appendChild(panel);
    panel._renderFn = renderPanel;
    renderPanel();

    // Slide-in animation
    requestAnimationFrame(() => {
        panel.classList.add('visible');
    });

    // Day 1: show advisor guide walkthrough
    if (SIM.day === 1 && !SIM._guideSeen) {
        SIM._guideSeen = true;
        setTimeout(() => _showAdvisorGuide(), 800);
    }
}

// ======================== ADVISOR GUIDE (Day 1 tutorial) ========================

const _GUIDE_STEPS = [
    {
        anchor: 'gauge-bar',
        position: 'below',
        title: 'ADVISOR BRIEFING',
        text: 'These are your <em>4 key gauges</em>: Stability, Economy, Support, and Intel. Keep them balanced. If any drops critically low, you lose.',
    },
    {
        anchor: 'situation-panel',
        position: 'right',
        title: 'SITUATION PANEL',
        text: 'Your intelligence dashboard. The <em>Situation Report</em> at top shows the essentials. Click section headers to expand details like Force Disposition and Wire Feed.',
    },
    {
        anchor: 'action-panel',
        position: 'left',
        title: 'ACTIONS',
        text: 'You get <em>3 Action Points</em> per day. Each action costs 1 AP. Some also cost budget. Hover any action to see what it does. When done, hit END DAY.',
    },
    {
        anchor: 'action-panel',
        position: 'left',
        offsetY: 200,
        title: 'ESCALATION',
        text: 'The <em>Escalation Ladder</em> controls which military options are available. Higher escalation unlocks stronger actions but brings you closer to war.',
    },
];

function _showAdvisorGuide() {
    let step = 0;

    function showStep() {
        // Remove previous
        document.querySelectorAll('.advisor-guide').forEach(el => el.remove());

        if (step >= _GUIDE_STEPS.length) return;

        const s = _GUIDE_STEPS[step];
        const anchorEl = document.getElementById(s.anchor);
        if (!anchorEl) { step++; showStep(); return; }

        const rect = anchorEl.getBoundingClientRect();
        const guide = document.createElement('div');
        guide.className = 'advisor-guide';

        let arrowClass = '';
        let top, left;

        switch (s.position) {
            case 'below':
                top = rect.bottom + 12;
                left = rect.left + rect.width / 2 - 160;
                arrowClass = 'down';
                break;
            case 'right':
                top = rect.top + (s.offsetY || rect.height / 3);
                left = rect.right + 14;
                arrowClass = 'right';
                break;
            case 'left':
                top = rect.top + (s.offsetY || rect.height / 4);
                left = rect.left - 340;
                arrowClass = 'left';
                break;
        }

        // Clamp to viewport
        top = Math.max(10, Math.min(window.innerHeight - 200, top));
        left = Math.max(10, Math.min(window.innerWidth - 340, left));

        guide.style.top = top + 'px';
        guide.style.left = left + 'px';

        guide.innerHTML = `
            <div class="advisor-guide-arrow ${arrowClass}"></div>
            <div class="guide-title">${s.title}</div>
            <div class="guide-text">${s.text}</div>
            <button class="guide-dismiss">${step < _GUIDE_STEPS.length - 1 ? '[ NEXT ]' : '[ GOT IT ]'}</button>
            <div class="guide-step">STEP ${step + 1} / ${_GUIDE_STEPS.length}</div>
        `;

        document.body.appendChild(guide);

        guide.querySelector('.guide-dismiss').addEventListener('click', () => {
            guide.remove();
            step++;
            showStep();
        });
    }

    showStep();
}

function _executeAction(actionId, rerenderFn) {
    if (SIM.actionPoints <= 0) return;

    let toastMsg = '';
    let toastLevel = 'normal';

    switch (actionId) {
        case 'gather-intel':
            if (SIM.budget < 15) return;
            SIM.budget -= 15;
            SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 8);
            showFloatingNumber('fogOfWar', -8);
            showFloatingNumber('budget', -15);
            const intelItem = typeof generateIntelItem === 'function' ? generateIntelItem() : null;
            if (intelItem) {
                toastMsg = `[${intelItem.confidence}] ${intelItem.text}`;
            } else {
                toastMsg = _intelSnippets[Math.floor(Math.random() * _intelSnippets.length)];
            }
            toastLevel = 'good';
            addHeadline('CIA OPS NOTICE [TS//SI]: Intelligence collection operation conducted.', 'normal');
            break;

        case 'analyze-threats':
            if (SIM.fogOfWar < 50) {
                // Useful info
                const analyses = [
                    'Analysis: Iran unlikely to escalate further this week.',
                    'Analysis: IRGC supply lines vulnerable to interdiction.',
                    'Analysis: Chinese mediation window closing.',
                    'Analysis: Iran internal faction split detected — moderates gaining.',
                    'Analysis: Proxy forces in Iraq repositioning.',
                ];
                toastMsg = analyses[Math.floor(Math.random() * analyses.length)];
                toastLevel = 'good';
                SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 3);
                showFloatingNumber('fogOfWar', -3);
            } else {
                toastMsg = 'Too much fog \u2014 intel unclear';
                toastLevel = 'warning';
            }
            addHeadline('Threat analysis conducted.', 'normal');
            break;

        case 'phone-call':
            if (SIM.tension > 60) {
                SIM.tension = Math.max(0, SIM.tension - 5);
                SIM.iranAggression = Math.min(100, SIM.iranAggression + 2);
                showFloatingNumber('tension', -5);
                showFloatingNumber('iranAggression', 2);
                toastMsg = 'De-escalation call placed';
                toastLevel = 'good';
            } else if (SIM.chinaRelations < 40) {
                SIM.chinaRelations = Math.min(100, SIM.chinaRelations + 5);
                showFloatingNumber('chinaRelations', 5);
                toastMsg = 'Called Beijing';
                toastLevel = 'good';
            } else if (SIM.internationalStanding < 40) {
                SIM.internationalStanding = Math.min(100, SIM.internationalStanding + 5);
                showFloatingNumber('internationalStanding', 5);
                toastMsg = 'Allied outreach';
                toastLevel = 'good';
            } else {
                SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 3);
                showFloatingNumber('diplomaticCapital', 3);
                toastMsg = 'Routine diplomatic call';
                toastLevel = 'normal';
            }
            addHeadline('Diplomatic phone call made.', 'normal');
            break;

        case 'draft-proposal':
            if (SIM.budget < 10) return;
            SIM.budget -= 10;
            SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 5);
            showFloatingNumber('diplomaticCapital', 5);
            showFloatingNumber('budget', -10);
            toastMsg = 'Diplomatic proposal drafted';
            toastLevel = 'good';
            addHeadline('Diplomatic proposal circulated to allies.', 'normal');
            break;

        case 'reposition-fleet':
            SIM.tension = Math.min(100, SIM.tension + 2);
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 3);
            showFloatingNumber('tension', 2);
            showFloatingNumber('oilFlow', 3);
            toastMsg = 'Fleet repositioned — show of strength';
            toastLevel = 'normal';
            addHeadline('Naval fleet repositioned in the strait.', 'normal');
            break;

        case 'change-roe': {
            const roeOrder = ['defensive', 'moderate', 'aggressive'];
            const currentIdx = roeOrder.indexOf(SIM.roe || 'defensive');
            const nextIdx = (currentIdx + 1) % roeOrder.length;
            SIM.roe = roeOrder[nextIdx];

            if (SIM.roe === 'moderate') {
                SIM.tension = Math.min(100, SIM.tension + 3);
                SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 1);
                showFloatingNumber('tension', 3);
                showFloatingNumber('domesticApproval', 1);
                toastMsg = 'ROE set to MODERATE \u2014 balanced posture';
            } else if (SIM.roe === 'aggressive') {
                SIM.tension = Math.min(100, SIM.tension + 5);
                SIM.iranAggression = Math.max(0, SIM.iranAggression - 3);
                SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 2);
                showFloatingNumber('tension', 5);
                showFloatingNumber('iranAggression', -3);
                showFloatingNumber('internationalStanding', -2);
                toastMsg = 'ROE set to AGGRESSIVE \u2014 Iran deterred, allies uneasy';
            } else {
                SIM.tension = Math.max(0, SIM.tension - 3);
                SIM.internationalStanding = Math.min(100, SIM.internationalStanding + 2);
                showFloatingNumber('tension', -3);
                showFloatingNumber('internationalStanding', 2);
                toastMsg = 'ROE set to DEFENSIVE \u2014 de-escalation';
            }
            toastLevel = 'normal';
            addHeadline(`Rules of engagement changed to ${SIM.roe.toUpperCase()}.`, 'normal');
            break;
        }

        case 'press-conference':
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 4);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 1);
            SIM.polarization = Math.min(100, SIM.polarization + 1);
            showFloatingNumber('domesticApproval', 4);
            showFloatingNumber('internationalStanding', -1);
            showFloatingNumber('polarization', 1);
            toastMsg = 'Press conference held';
            toastLevel = 'normal';
            addHeadline('White House holds press conference on strait crisis.', 'normal');
            break;

        case 'brief-congress':
            if (SIM.budget < 5) return;
            SIM.budget -= 5;
            SIM.polarization = Math.max(0, SIM.polarization - 3);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 2);
            showFloatingNumber('polarization', -3);
            showFloatingNumber('domesticApproval', 2);
            showFloatingNumber('budget', -5);
            toastMsg = 'Congressional briefing completed';
            toastLevel = 'good';
            addHeadline('Classified briefing delivered to Congress.', 'normal');
            break;

        case 'adjust-sanctions':
            SIM.iranEconomy = Math.max(0, SIM.iranEconomy - 3);
            SIM.chinaRelations = Math.max(0, SIM.chinaRelations - 2);
            SIM.iranAggression = Math.min(100, SIM.iranAggression + 2);
            showFloatingNumber('iranEconomy', -3);
            showFloatingNumber('chinaRelations', -2);
            showFloatingNumber('iranAggression', 2);
            toastMsg = 'Sanctions tightened';
            toastLevel = 'warning';
            addHeadline('New sanctions imposed on Iranian entities.', 'normal');
            break;

        case 'market-intervention':
            if (SIM.budget < 25) return;
            SIM.budget -= 25;
            SIM.oilPrice = Math.max(40, SIM.oilPrice - 5);
            showFloatingNumber('oilPrice', -5);
            showFloatingNumber('budget', -25);
            toastMsg = 'Strategic reserve released \u2014 oil prices down';
            toastLevel = 'good';
            addHeadline('Strategic petroleum reserve release authorized.', 'normal');
            break;

        case 'escort-tankers':
            if (SIM.budget < 10 || SIM.escalationLevel < 1) return;
            SIM.budget -= 10;
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 5);
            SIM.tension = Math.min(100, SIM.tension + 2);
            showFloatingNumber('oilFlow', 5);
            showFloatingNumber('tension', 2);
            showFloatingNumber('budget', -10);
            SIM.tankers.filter(t => !t.seized && !t.escorted).slice(0, 2).forEach(t => t.escorted = true);
            toastMsg = 'Navy escorts assigned to tanker convoy';
            toastLevel = 'good';
            addHeadline('USN begins tanker escort operations through Strait of Hormuz.', 'normal');
            break;

        case 'precision-strike':
            if (SIM.budget < 30 || SIM.escalationLevel < 2) return;
            SIM.budget -= 30;
            SIM.tension = Math.min(100, SIM.tension + 12);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 8);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 5);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 3);
            SIM.warPath = Math.min(5, SIM.warPath + 1);
            showFloatingNumber('tension', 12);
            showFloatingNumber('iranAggression', -8);
            showFloatingNumber('internationalStanding', -5);
            showFloatingNumber('domesticApproval', 3);
            showFloatingNumber('warPath', 1);
            showFloatingNumber('budget', -30);
            if (SIM.iranBoats.length > 1) SIM.iranBoats.splice(0, Math.min(2, SIM.iranBoats.length - 1));
            spawnEffect(0.45, 0.42, 'explosion');
            toastMsg = 'Tomahawk strike on IRGC naval base';
            toastLevel = 'warning';
            addHeadline('BREAKING: US precision strike destroys IRGC fast boat pens at Bandar Abbas', 'critical');
            break;

        case 'spec-ops-raid':
            if (SIM.budget < 25 || SIM.escalationLevel < 2) return;
            SIM.budget -= 25;
            SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 12);
            SIM.tension = Math.min(100, SIM.tension + 6);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 4);
            showFloatingNumber('fogOfWar', -12);
            showFloatingNumber('tension', 6);
            showFloatingNumber('iranAggression', -4);
            showFloatingNumber('budget', -25);
            if (SIM.mines.length > 0) SIM.mines.splice(0, Math.min(3, SIM.mines.length));
            toastMsg = 'SEAL team neutralizes mine-laying operation';
            toastLevel = 'good';
            addHeadline('SOCOM: Special operations forces conduct raid on Iranian mining assets', 'normal');
            break;

        case 'air-strikes':
            if (SIM.budget < 50 || SIM.escalationLevel < 3) return;
            SIM.budget -= 50;
            SIM.tension = Math.min(100, SIM.tension + 18);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 15);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 8);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 5);
            SIM.conflictRisk = Math.min(100, SIM.conflictRisk + 10);
            SIM.warPath = Math.min(5, SIM.warPath + 1);
            showFloatingNumber('tension', 18);
            showFloatingNumber('iranAggression', -15);
            showFloatingNumber('internationalStanding', -8);
            showFloatingNumber('domesticApproval', 5);
            showFloatingNumber('conflictRisk', 10);
            showFloatingNumber('warPath', 1);
            showFloatingNumber('budget', -50);
            SIM.iranBoats.splice(0, Math.floor(SIM.iranBoats.length * 0.6));
            SIM.drones.splice(0, Math.floor(SIM.drones.length * 0.5));
            spawnEffect(0.40, 0.35, 'explosion');
            spawnEffect(0.50, 0.30, 'explosion');
            toastMsg = 'Air campaign targets IRGC coastal installations';
            toastLevel = 'critical';
            addHeadline('FLASH: US launches sustained air strikes against Iranian military targets', 'critical');
            break;

        case 'sead-mission':
            if (SIM.budget < 40 || SIM.escalationLevel < 3) return;
            SIM.budget -= 40;
            SIM.tension = Math.min(100, SIM.tension + 10);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 6);
            SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 8);
            showFloatingNumber('tension', 10);
            showFloatingNumber('iranAggression', -6);
            showFloatingNumber('fogOfWar', -8);
            showFloatingNumber('budget', -40);
            spawnEffect(0.48, 0.28, 'explosion');
            toastMsg = 'SEAD mission suppresses Iranian radar and SAM sites';
            toastLevel = 'warning';
            addHeadline('US Wild Weasel missions knock out Iranian air defense network along coast', 'critical');
            break;

        case 'ground-troops':
            if (SIM.budget < 80 || SIM.escalationLevel < 4) return;
            SIM.budget -= 80;
            SIM.tension = Math.min(100, SIM.tension + 25);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 20);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 15);
            SIM.domesticApproval = Math.max(0, SIM.domesticApproval - 5);
            SIM.polarization = Math.min(100, SIM.polarization + 10);
            SIM.conflictRisk = Math.min(100, SIM.conflictRisk + 20);
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 10);
            showFloatingNumber('tension', 25);
            showFloatingNumber('iranAggression', -20);
            showFloatingNumber('internationalStanding', -15);
            showFloatingNumber('domesticApproval', -5);
            showFloatingNumber('polarization', 10);
            showFloatingNumber('conflictRisk', 20);
            showFloatingNumber('oilFlow', 10);
            showFloatingNumber('budget', -80);
            toastMsg = 'USMC and Army deploy to secure strait coastline';
            toastLevel = 'critical';
            addHeadline('FLASH: US ground forces land on Iranian coast — Bandar Abbas secured', 'critical');
            break;

        case 'seize-islands':
            if (SIM.budget < 60 || SIM.escalationLevel < 4) return;
            SIM.budget -= 60;
            SIM.tension = Math.min(100, SIM.tension + 15);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 12);
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 8);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 10);
            showFloatingNumber('tension', 15);
            showFloatingNumber('iranAggression', -12);
            showFloatingNumber('oilFlow', 8);
            showFloatingNumber('internationalStanding', -10);
            showFloatingNumber('budget', -60);
            SIM.mines = [];
            spawnEffect(0.48, 0.36, 'explosion');
            toastMsg = 'Marines seize Abu Musa and Tunb islands — mines cleared';
            toastLevel = 'critical';
            addHeadline('FLASH: USMC amphibious assault seizes Iranian-held islands in Strait of Hormuz', 'critical');
            break;

        case 'full-mobilization':
            if (SIM.budget < 100 || SIM.escalationLevel < 5) return;
            SIM.budget -= 100;
            SIM.tension = 100;
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 30);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 20);
            SIM.domesticApproval = Math.max(0, SIM.domesticApproval - 10);
            SIM.polarization = Math.min(100, SIM.polarization + 20);
            SIM.conflictRisk = 100;
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 15);
            showFloatingNumber('tension', 100);
            showFloatingNumber('iranAggression', -30);
            showFloatingNumber('internationalStanding', -20);
            showFloatingNumber('domesticApproval', -10);
            showFloatingNumber('polarization', 20);
            showFloatingNumber('oilFlow', 15);
            showFloatingNumber('budget', -100);
            SIM.iranBoats = [];
            SIM.mines = [];
            SIM.drones = [];
            toastMsg = 'Total war footing — all reserves activated';
            toastLevel = 'critical';
            addHeadline('FLASH: President orders full military mobilization. Draft authorization sent to Congress.', 'critical');
            break;

        case 'demand-un-session':
            SIM.internationalStanding = Math.min(100, SIM.internationalStanding + 3);
            SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 4);
            SIM.tension = Math.max(0, SIM.tension - 2);
            showFloatingNumber('internationalStanding', 3);
            showFloatingNumber('diplomaticCapital', 4);
            showFloatingNumber('tension', -2);
            toastMsg = 'Emergency UNSC session requested';
            toastLevel = 'normal';
            addHeadline('US demands emergency UN Security Council session on Strait of Hormuz.', 'normal');
            break;

        case 'escalate': {
            if (SIM.escalationLevel >= 5) return;
            SIM.warPath = Math.min(5, SIM.warPath + 1);
            if (SIM.warPath <= 0) SIM.escalationLevel = 0;
            else if (SIM.warPath === 1) SIM.escalationLevel = 1;
            else if (SIM.warPath === 2) SIM.escalationLevel = 2;
            else if (SIM.warPath === 3) SIM.escalationLevel = 3;
            else if (SIM.warPath === 4) SIM.escalationLevel = 4;
            else SIM.escalationLevel = 5;
            const newEsc = ESCALATION_LADDER[SIM.escalationLevel];
            SIM.tension = Math.min(100, SIM.tension + 8);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 3);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 4);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 3);
            showFloatingNumber('warPath', 1);
            showFloatingNumber('tension', 8);
            showFloatingNumber('domesticApproval', 3);
            showFloatingNumber('internationalStanding', -4);
            showFloatingNumber('iranAggression', -3);
            toastMsg = `Escalated to ${newEsc.name}`;
            toastLevel = 'warning';
            addHeadline(`ESCALATION: US military posture elevated to ${newEsc.name}`, 'critical');
            break;
        }

        case 'deescalate': {
            if (SIM.warPath <= 0) return;
            SIM.warPath = Math.max(0, SIM.warPath - 1);
            if (SIM.warPath <= 0) SIM.escalationLevel = 0;
            else if (SIM.warPath === 1) SIM.escalationLevel = 1;
            else if (SIM.warPath === 2) SIM.escalationLevel = 2;
            else if (SIM.warPath === 3) SIM.escalationLevel = 3;
            else if (SIM.warPath === 4) SIM.escalationLevel = 4;
            else SIM.escalationLevel = 5;
            const deEsc = ESCALATION_LADDER[SIM.escalationLevel];
            SIM.tension = Math.max(0, SIM.tension - 5);
            SIM.internationalStanding = Math.min(100, SIM.internationalStanding + 5);
            SIM.domesticApproval = Math.max(0, SIM.domesticApproval - 3);
            SIM.iranAggression = Math.min(100, SIM.iranAggression + 4);
            showFloatingNumber('warPath', -1);
            showFloatingNumber('tension', -5);
            showFloatingNumber('internationalStanding', 5);
            showFloatingNumber('domesticApproval', -3);
            showFloatingNumber('iranAggression', 4);
            toastMsg = `De-escalated to ${deEsc.name}`;
            toastLevel = 'good';
            addHeadline(`DE-ESCALATION: US military posture lowered to ${deEsc.name}`, 'normal');
            break;
        }

        case 'issue-ultimatum':
            SIM.tension = Math.min(100, SIM.tension + 8);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 5);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 5);
            SIM.warPath = Math.min(5, SIM.warPath + 1);
            showFloatingNumber('tension', 8);
            showFloatingNumber('iranAggression', -5);
            showFloatingNumber('domesticApproval', 5);
            showFloatingNumber('warPath', 1);
            toastMsg = 'Ultimatum issued: "Cease all hostile actions within 72 hours"';
            toastLevel = 'warning';
            addHeadline('US issues formal ultimatum to Iran on strait freedom of navigation.', 'critical');
            break;

        case 'emergency-coalition':
            if (SIM.budget < 20) return;
            SIM.budget -= 20;
            SIM.internationalStanding = Math.min(100, SIM.internationalStanding + 5);
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 3);
            SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 5);
            showFloatingNumber('internationalStanding', 5);
            showFloatingNumber('oilFlow', 3);
            showFloatingNumber('diplomaticCapital', 5);
            showFloatingNumber('budget', -20);
            toastMsg = 'Emergency coalition call — allies responding';
            toastLevel = 'good';
            addHeadline('Emergency coalition meeting convened on strait crisis.', 'normal');
            break;

        case 'special':
            executeSpecialAction();
            break;

        default:
            return;
    }

    // Spend AP
    SIM.actionPoints = Math.max(0, SIM.actionPoints - 1);

    if (toastMsg) showToast(toastMsg, toastLevel);
    updateGauges();

    // If AP exhausted, re-render panel (all buttons disabled, END DAY remains)
    if (SIM.actionPoints <= 0) {
        rerenderFn();
        showToast('Action points spent — END DAY when ready', 'warning');
        return;
    }

    // Random interrupt check (40% chance)
    if (Math.random() < 0.4) {
        setTimeout(() => {
            showInterrupt(rerenderFn);
        }, 400);
    } else {
        rerenderFn();
    }
}

function _endDay() {
    hideActionPanel();

    // Capture state for end-of-day summary
    const gaugesAfter = calculateGauges();
    const gaugesBefore = SIM.prevGauges || gaugesAfter;
    const todayHeadlines = SIM.headlines.filter(h => h.day === SIM.day).slice(-4);
    const todayDecisions = (SIM.decisionLog || []).filter(d => d.day === SIM.day);
    const actionsUsed = 3 - (SIM.actionPoints || 0);

    _showEndOfDaySummary(gaugesBefore, gaugesAfter, todayHeadlines, todayDecisions, actionsUsed, () => {
        advanceDay();
    });
}

function _showEndOfDaySummary(gaugesBefore, gaugesAfter, headlines, decisions, actionsUsed, onContinue) {
    const overlay = document.createElement('div');
    overlay.className = 'ap-interrupt'; // reuse interrupt overlay styling for positioning
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:100;display:flex;align-items:center;justify-content:center;';

    const gaugeNames = [
        { key: 'stability', label: 'STABILITY', color: '#44dd88' },
        { key: 'economy', label: 'ECONOMY', color: '#ddaa44' },
        { key: 'support', label: 'SUPPORT', color: '#4488dd' },
        { key: 'intel', label: 'INTEL', color: '#aa88dd' },
    ];

    const gaugeRows = gaugeNames.map(g => {
        const val = Math.round(gaugesAfter[g.key]);
        const d = Math.round(gaugesAfter[g.key] - gaugesBefore[g.key]);
        const deltaStr = d > 0 ? `+${d}` : d < 0 ? `${d}` : '--';
        const deltaCls = d > 0 ? 'up' : d < 0 ? 'down' : 'stable';
        const fillColor = val >= 60 ? '#44dd88' : val >= 35 ? '#ddaa44' : '#dd4444';
        return `<div class="eod-gauge-row">
            <span class="eod-gauge-name">${g.label}</span>
            <div class="eod-gauge-bar"><div class="eod-gauge-fill" style="width:${val}%;background:${fillColor}"></div></div>
            <span class="eod-gauge-val" style="color:${fillColor}">${val}</span>
            <span class="eod-gauge-delta ${deltaCls}">${deltaStr}</span>
        </div>`;
    }).join('');

    const headlineHtml = headlines.length > 0
        ? headlines.map(h => `<div class="eod-headline ${h.level}">${h.text}</div>`).join('')
        : '<div class="eod-headline" style="color:#2a6a4a">A quiet day.</div>';

    const decisionHtml = decisions.length > 0
        ? `<div class="eod-actions-taken">DECISIONS: ${decisions.map(d => d.choice).join(' / ')}</div>`
        : '';

    // Win progress
    const winProg = _getWinProgress();

    overlay.innerHTML = `
        <div class="eod-summary" style="max-width:420px;background:#0a0a0a;border:2px solid #1a3a2a;border-radius:0;">
            <div class="eod-title">END OF DAY ${SIM.day}</div>
            ${gaugeRows}
            ${winProg}
            <div style="margin-top:10px;padding-top:8px;border-top:1px solid #1a3a2a">
                <div style="font-size:8px;letter-spacing:2px;color:#2a6a4a;margin-bottom:4px">TODAY'S EVENTS</div>
                ${headlineHtml}
            </div>
            ${decisionHtml}
            <div style="font-size:9px;color:#5a6e80;margin-top:8px">${actionsUsed}/3 actions used | Budget: $${Math.round(SIM.budget)}M</div>
            <button class="eod-continue-btn" id="eod-continue">[ NEXT DAY ]</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    overlay.style.opacity = '0';
    requestAnimationFrame(() => {
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '1';
    });

    document.getElementById('eod-continue').addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            onContinue();
        }, 300);
    });
}

function _getWinProgress() {
    if (!SIM.character || !SIM.character.scenario || !SIM.character.scenario.winConditions) {
        // Generic win: strait open days
        const pct = Math.min(100, Math.round((SIM.straitOpenDays / 14) * 100));
        return `<div class="win-progress">
            <div class="win-progress-label">OBJECTIVE: KEEP STRAIT OPEN 14 DAYS</div>
            <div class="win-progress-bar"><div class="win-progress-fill" style="width:${pct}%"></div></div>
            <div class="win-progress-text">${SIM.straitOpenDays}/14 days</div>
        </div>`;
    }

    const wc = SIM.character.scenario.winConditions[0];
    const met = wc.check(SIM);
    const sustained = wc._days || 0;
    const pct = met ? Math.min(100, Math.round((sustained / 3) * 100)) : 0;

    // Build a readable condition summary
    const charId = SIM.character.id;
    const labels = {
        trump: 'WIN BIG: High approval + oil flowing + low tension',
        hegseth: 'TOTAL VICTORY: Escalation 4+ + approval 55+ + Iran crushed',
        kushner: 'THE DEAL: Exposure 55+ + diplomacy 50+ + budget 400+',
        asmongold: 'CALLED IT: Credibility 70+ + approval 60+ + fog low',
        fuentes: 'AMERICA FIRST: Escalation 1- + standing 40+ + base 60+',
    };
    const label = labels[charId] || 'Complete your objective';

    return `<div class="win-progress">
        <div class="win-progress-label">${label}</div>
        <div class="win-progress-bar"><div class="win-progress-fill" style="width:${pct}%;${met ? '' : 'background:#ddaa44;box-shadow:0 0 4px rgba(221,170,68,0.3)'}"></div></div>
        <div class="win-progress-text">${met ? sustained + '/3 days sustained' : 'Conditions not yet met'}</div>
    </div>`;
}

function showInterrupt(afterCallback) {
    const panel = document.getElementById('action-panel');
    if (!panel) { if (afterCallback) afterCallback(); return; }

    const interrupt = INTERRUPTS[Math.floor(Math.random() * INTERRUPTS.length)];

    // Create interrupt overlay inside the action panel
    const overlay = document.createElement('div');
    overlay.className = 'ap-interrupt';
    overlay.innerHTML = `
        <div class="ap-interrupt-flash">INCOMING</div>
        <div class="ap-interrupt-text">${interrupt.text}</div>
        <div class="ap-interrupt-choices">
            ${interrupt.choices.map((c, i) => `
                <button class="ap-interrupt-btn" data-choice="${i}">${c.label}</button>
            `).join('')}
        </div>
    `;

    panel.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });

    overlay.querySelectorAll('.ap-interrupt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const choiceIdx = parseInt(btn.dataset.choice);
            const choice = interrupt.choices[choiceIdx];
            const gaugesBefore = calculateGauges();

            // Apply effects
            _applyEffects(choice.effects);

            const gaugesAfter = calculateGauges();

            // Log to decision log for situation panel
            SIM.decisionLog.push({
                title: interrupt.text.length > 50 ? interrupt.text.substring(0, 47) + '...' : interrupt.text,
                choice: choice.label,
                effects: { ...choice.effects },
                gaugesBefore,
                gaugesAfter,
                day: SIM.day,
                type: 'interrupt',
            });

            // Toast the result
            const effectStrs = Object.entries(choice.effects)
                .filter(([k, v]) => v !== 0)
                .map(([k, v]) => `${formatEffectName(k)} ${v > 0 ? '+' : ''}${v}`)
                .join(', ');
            if (effectStrs) {
                showToast(`${choice.label}: ${effectStrs}`, 'normal');
            }

            addHeadline(`Interrupt: ${interrupt.text.substring(0, 40)}... \u2014 ${choice.label}`, 'normal');

            // Remove overlay
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                if (afterCallback) afterCallback();
            }, 300);
        });
    });
}

function hideActionPanel() {
    const existing = document.getElementById('action-panel');
    if (existing) existing.remove();

    // Restore layout widths
    const canvas = document.getElementById('game-canvas');
    const gaugeBar = document.getElementById('gauge-bar');
    const tickers = document.getElementById('news-tickers');
    if (canvas) {
        canvas.classList.remove('with-both');
        // Restore situation panel sizing if it's visible
        const sitPanel = document.getElementById('situation-panel');
        if (sitPanel && sitPanel.style.display !== 'none') {
            canvas.classList.add('with-sitpanel');
        }
        canvas.style.width = '';
    }
    if (gaugeBar) gaugeBar.style.right = '';
    if (tickers) tickers.style.right = '';
}


// ======================== FLOATING NUMBERS ========================

function showFloatingNumber(metricKey, value) {
    if (value === 0) return;

    const name = formatEffectName(metricKey);
    const isPositive = value > 0;

    // Determine if this metric going up is "good" or "bad"
    const badIfUp = ['tension', 'iranAggression', 'conflictRisk', 'fogOfWar', 'polarization',
                     'assassinationRisk', 'warPath', 'proxyThreat', 'exposure', 'oilPrice'];
    const isGood = badIfUp.includes(metricKey) ? !isPositive : isPositive;

    const text = `${isPositive ? '+' : ''}${value} ${name.toUpperCase()}`;
    const color = isGood ? '#44dd88' : '#dd4444';

    const el = document.createElement('div');
    el.className = 'floating-number';
    el.textContent = text;
    el.style.color = color;
    el.style.textShadow = `0 0 8px ${color}`;

    // Stack offset
    const stackOffset = _floatingNumberStack * 24;
    _floatingNumberStack++;
    setTimeout(() => { _floatingNumberStack = Math.max(0, _floatingNumberStack - 1); }, 600);

    // Position near the action panel
    el.style.right = '292px';
    el.style.top = (120 + stackOffset) + 'px';

    document.body.appendChild(el);

    // Trigger animation
    requestAnimationFrame(() => {
        el.classList.add('animate');
    });

    // Remove after animation
    setTimeout(() => {
        el.remove();
    }, 1500);
}

// ======================== DECISION EVENTS ========================

function showDecisionEvent(event) {
    hideActionPanel();
    let countdown = event.countdown || 0;
    let countdownInterval = null;
    const isCrisis = event.crisis === true;

    function renderEvent() {
        const btnClass = isCrisis ? 'crisis-choice' : 'decision-choice';

        const choicesHtml = event.choices.map((choice, i) => {
            const hints = Object.entries(choice.effects).map(([key, val]) => {
                if (val === 0) return '';
                const isNeg = ['tension', 'iranAggression', 'conflictRisk', 'fogOfWar', 'polarization', 'assassinationRisk', 'warPath', 'proxyThreat', 'exposure'].includes(key)
                    ? val > 0 : val < 0;
                const arrow = Math.abs(val) > 10 ? (val > 0 ? '\u25B2\u25B2' : '\u25BC\u25BC') : (val > 0 ? '\u25B2' : '\u25BC');
                return `<span class="${isNeg ? 'negative' : 'positive'}">${formatEffectName(key)} ${arrow}</span>`;
            }).filter(Boolean).join(' ');

            return `
                <button class="${btnClass}" data-idx="${i}">
                    <span class="choice-text">${choice.text}</span>
                    <span class="choice-effects">${hints || 'No immediate effects'}</span>
                </button>
            `;
        }).join('');

        const crisisHeader = isCrisis ? '<div class="crisis-header">\u2588 CRISIS TELEPHONE \u2588</div>' : '';
        const headerStyle = isCrisis ? 'color:#dd4444' : '';
        const titleStyle = isCrisis ? 'color:#dd4444;text-shadow:0 0 10px rgba(221,68,68,0.4)' : '';
        const eventImg = _getEventCategoryImage(event);

        openTerminal(`
            ${crisisHeader}
            ${eventImg ? `<img src="${eventImg}" class="event-category-art" alt="Event">` : ''}
            ${countdown > 0 ? `<div class="decision-timer">${countdown}s</div>` : ''}
            <div class="term-header" style="${headerStyle}">DAY ${SIM.day} \u2014 ${isCrisis ? 'CRISIS' : 'DECISION REQUIRED'}</div>
            <div class="term-title" style="${titleStyle}">${event.title}</div>
            <div class="term-line" style="margin-bottom:16px${isCrisis ? ';color:#dd8888' : ''}">${event.description}</div>
            <div class="term-section">
                <div class="term-section-label" ${isCrisis ? 'style="color:#dd4444"' : ''}>${isCrisis ? 'NO SAFE OPTIONS' : 'OPTIONS'}</div>
                ${choicesHtml}
            </div>
        `);

        // Add crisis styling to terminal
        if (isCrisis) TERMINAL.classList.add('crisis-terminal');
        else TERMINAL.classList.remove('crisis-terminal');

        TERMINAL.querySelectorAll('.' + btnClass).forEach(btn => {
            btn.addEventListener('click', () => {
                if (countdownInterval) clearInterval(countdownInterval);
                TERMINAL.classList.remove('crisis-terminal');
                resolveDecision(event, parseInt(btn.dataset.idx));
            });
        });
    }

    renderEvent();

    if (countdown > 0) {
        countdownInterval = setInterval(() => {
            countdown--;
            const timerEl = TERMINAL.querySelector('.decision-timer');
            if (timerEl) timerEl.textContent = countdown > 0 ? `${countdown}s` : 'TIME UP';
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                TERMINAL.classList.remove('crisis-terminal');
                resolveDecision(event, 0);
            }
        }, 1000);
    }
}

function _buildImpactSummary(effects, gaugesBefore, gaugesAfter) {
    // Raw effect lines
    const effectLines = Object.entries(effects)
        .filter(([k, v]) => v !== 0)
        .map(([k, v]) => {
            const name = formatEffectName(k);
            const badIfUp = ['tension', 'iranAggression', 'conflictRisk', 'fogOfWar', 'polarization',
                             'assassinationRisk', 'warPath', 'proxyThreat', 'exposure', 'oilPrice'];
            const isGood = badIfUp.includes(k) ? v < 0 : v > 0;
            const color = isGood ? '#44dd88' : '#dd4444';
            const sign = v > 0 ? '+' : '';
            return `<span style="color:${color}">${name} ${sign}${v}</span>`;
        });

    // Gauge deltas
    const gaugeNames = { stability: 'STABILITY', economy: 'ECONOMY', support: 'SUPPORT', intel: 'INTEL' };
    const gaugeDeltaLines = [];
    for (const [key, label] of Object.entries(gaugeNames)) {
        const delta = gaugesAfter[key] - gaugesBefore[key];
        if (delta !== 0) {
            const color = delta > 0 ? '#44dd88' : '#dd4444';
            const sign = delta > 0 ? '+' : '';
            gaugeDeltaLines.push(`<span style="color:${color}">${label} ${sign}${delta}</span>`);
        }
    }

    if (effectLines.length === 0 && gaugeDeltaLines.length === 0) return '';

    let html = '<div class="impact-summary">';
    html += '<div class="impact-label">IMMEDIATE IMPACT</div>';
    if (effectLines.length > 0) {
        html += '<div class="impact-effects">' + effectLines.join(' &middot; ') + '</div>';
    }
    if (gaugeDeltaLines.length > 0) {
        html += '<div class="impact-gauges">' + gaugeDeltaLines.join(' &middot; ') + '</div>';
    }
    html += '</div>';
    return html;
}

function _buildDecisionLogHtml() {
    if (!SIM.decisionLog || SIM.decisionLog.length === 0) return '';
    // Show last 5 decisions, newest first
    const recent = SIM.decisionLog.slice(-5).reverse();
    const entries = recent.map(entry => {
        const typeIcon = entry.type === 'crisis' ? '<span style="color:#dd4444">\u26A0</span>'
                       : entry.type === 'interrupt' ? '<span style="color:#ddaa44">\u26A1</span>'
                       : '<span style="color:#44dd88">\u25B6</span>';

        // Gauge deltas
        const gaugeNames = { stability: 'STB', economy: 'ECO', support: 'SUP', intel: 'INT' };
        const deltas = [];
        for (const [key, label] of Object.entries(gaugeNames)) {
            const delta = entry.gaugesAfter[key] - entry.gaugesBefore[key];
            if (delta !== 0) {
                const color = delta > 0 ? '#44dd88' : '#dd4444';
                const sign = delta > 0 ? '+' : '';
                deltas.push(`<span style="color:${color}">${label}${sign}${delta}</span>`);
            }
        }
        const deltaStr = deltas.length > 0 ? deltas.join(' ') : '<span style="color:#2a6a4a">no gauge change</span>';

        const title = entry.title.length > 35 ? entry.title.substring(0, 32) + '...' : entry.title;

        return `<div class="sit-decision-entry">
            <div class="sit-decision-header">${typeIcon} <span class="sit-decision-day">D${entry.day}</span> ${title}</div>
            <div class="sit-decision-choice">\u2192 ${entry.choice}</div>
            <div class="sit-decision-impact">${deltaStr}</div>
        </div>`;
    }).join('');

    const isCollapsed = _sitCollapsed.decisions;
    return `<div class="sit-section">
        <div class="sit-label collapsible ${isCollapsed ? 'collapsed' : ''}" data-sit-key="decisions">
            <span class="sit-toggle">\u25BC</span> DECISION LOG
        </div>
        <div class="sit-section-body ${isCollapsed ? 'collapsed' : ''}" data-sit-body="decisions">
            ${entries}
        </div>
    </div>`;
}

function resolveDecision(event, choiceIdx) {
    const choice = event.choices[choiceIdx];
    const gaugesBefore = calculateGauges();

    // Track hidden alignment
    if (typeof shiftAlignment === 'function') shiftAlignment(choice.effects);

    // Apply effects
    for (const [key, val] of Object.entries(choice.effects)) {
        _applyEffect(key, val);
        if (val !== 0) showFloatingNumber(key, val);
    }

    // Contact trust effects (Kushner)
    if (choice.contactEffect && SIM.character.contacts) {
        const contact = SIM.character.contacts.find(c => c.id === choice.contactEffect.id);
        if (contact) {
            contact.trust = Math.max(0, Math.min(100, contact.trust + choice.contactEffect.trust));
            if (choice.contactEffect.trust > 0) addHeadline(`${contact.name}: trust increased to ${contact.trust}`, 'good');
        }
    }

    const gaugesAfter = calculateGauges();

    // Log to decision log for situation panel
    SIM.decisionLog.push({
        title: event.title,
        choice: choice.text,
        effects: { ...choice.effects },
        gaugesBefore,
        gaugesAfter,
        day: SIM.day,
        type: event.crisis ? 'crisis' : 'decision',
    });

    addHeadline(`Decision: ${event.title} \u2014 ${choice.text}`, 'normal');
    if (choice.flavor) addHeadline(choice.flavor, 'good');

    SIM.decisionHistory.push({
        id: event.id, title: event.title,
        choiceText: choice.text, day: SIM.day,
    });

    // Build impact summary for result screen
    const impactHtml = _buildImpactSummary(choice.effects, gaugesBefore, gaugesAfter);

    // Show result
    openTerminal(`
        <div class="term-header">DECISION MADE</div>
        <div class="term-title">${choice.text.toUpperCase()}</div>
        <div class="term-line" style="margin-top:12px">${choice.flavor || ''}</div>
        ${impactHtml}
        <div class="term-btn-row">
            <button class="term-btn" id="btn-decision-continue">[ CONTINUE ]</button>
        </div>
    `);

    fadeInButtons(TERMINAL, 300);

    document.getElementById('btn-decision-continue').addEventListener('click', () => {
        closeTerminal();
        SIM.decisionEventActive = false;

        // After event resolves, go to daily report (overnight)
        SIM.phase = 'overnight';
        showDailyReport();
    });
}

// ======================== TOAST NOTIFICATIONS ========================

function showToast(text, level) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    while (container.children.length >= 4) container.removeChild(container.firstChild);

    const toast = document.createElement('div');
    toast.className = `toast toast-${level}`;
    toast.textContent = text;
    toast.addEventListener('animationend', (e) => {
        if (e.animationName === 'toastFadeOut') toast.remove();
    });
    container.appendChild(toast);

    // Also flash on canvas
    if (typeof triggerEventFlash === 'function') {
        triggerEventFlash(text, level);
    }
}

// ======================== POST-MORTEM ========================

function generatePostMortem() {
    const g = calculateGauges();

    function metricGrade(val) {
        if (val >= 80) return { grade: 'S', cls: 'good' };
        if (val >= 65) return { grade: 'A', cls: 'good' };
        if (val >= 50) return { grade: 'B', cls: 'good' };
        if (val >= 35) return { grade: 'C', cls: 'warning' };
        if (val >= 20) return { grade: 'D', cls: 'danger' };
        return { grade: 'F', cls: 'danger' };
    }

    const grades = {
        stability: metricGrade(g.stability),
        economy: metricGrade(g.economy),
        support: metricGrade(g.support),
        intel: metricGrade(g.intel),
    };

    const gradeLabels = { stability: 'Stability', economy: 'Economy', support: 'Support', intel: 'Intel' };

    let breakdownHtml = '<div class="pm-breakdown">';
    for (const [key, gr] of Object.entries(grades)) {
        breakdownHtml += `<div class="pm-metric"><span class="pm-metric-name">${gradeLabels[key]}</span><span class="pm-metric-grade ${gr.cls}">${gr.grade}</span></div>`;
    }
    breakdownHtml += '</div>';

    // Decision recap
    let decisionHtml = '';
    if (SIM.decisionHistory.length > 0) {
        const recent = SIM.decisionHistory.slice(-5);
        decisionHtml = '<div class="term-section"><div class="term-section-label">KEY DECISIONS</div>';
        for (const d of recent) {
            decisionHtml += `<div class="term-line dim">Day ${d.day}: ${d.title} \u2014 ${d.choiceText}</div>`;
        }
        decisionHtml += '</div>';
    }

    return breakdownHtml + decisionHtml;
}

// ======================== GAME OVER ========================

function showGameOverScreen() {
    hideActionPanel();
    const rating = calculateRating();
    const postMortem = generatePostMortem();
    const gradeClass = rating.score >= 60 ? 'good' : rating.score >= 35 ? 'warning' : 'danger';
    const g = calculateGauges();

    const gaugeBreakdown = [
        { label: 'STABILITY', val: Math.round(g.stability) },
        { label: 'ECONOMY', val: Math.round(g.economy) },
        { label: 'SUPPORT', val: Math.round(g.support) },
        { label: 'INTEL', val: Math.round(g.intel) },
    ].map(item => {
        const cls = item.val >= 60 ? 'good' : item.val >= 35 ? 'warning' : 'danger';
        const color = item.val >= 60 ? '#44dd88' : item.val >= 35 ? '#ddaa44' : '#dd4444';
        return `<div class="gameover-gauge-col">
            <div class="go-gauge-label">${item.label}</div>
            <div class="go-gauge-val" style="color:${color}">${item.val}</div>
        </div>`;
    }).join('');

    const outcomeImg = SIM.gameWon ? 'assets/victory.png' : 'assets/defeat.png';
    const reactionImg = SIM.gameWon
        ? _getReactionImage('victory')
        : _getReactionImage('defeat');

    openTerminal(`
        <img src="${outcomeImg}" class="gameover-art" alt="${SIM.gameWon ? 'Victory' : 'Defeat'}">

        <div class="gameover-title ${SIM.gameWon ? 'victory' : 'defeat'}">
            ${SIM.gameWon ? 'MISSION COMPLETE' : 'MISSION FAILED'}
        </div>

        ${reactionImg ? `<img src="${reactionImg}" class="gameover-reaction" alt="Advisor reaction">` : ''}

        <div class="gameover-grade ${gradeClass}">${rating.grade}</div>
        <div class="gameover-sublabel">${rating.label.toUpperCase()} \u2014 SCORE ${rating.score}/100</div>

        <div class="gameover-gauge-breakdown">${gaugeBreakdown}</div>

        <div class="gameover-reason">${SIM.gameOverReason}</div>

        <div class="term-section">
            <div class="term-section-label">FINAL STATS</div>
            <div class="stat-row"><span>Character</span><span>${SIM.character ? SIM.character.name : 'None'}</span></div>
            <div class="stat-row"><span>Days Survived</span><span>${SIM.day}</span></div>
            <div class="stat-row"><span>Escalation</span><span style="color:${_getEscalationColor()}">${_getEscalationName()} (${SIM.warPath}/5)</span></div>
            <div class="stat-row"><span>Strait Open</span><span>${SIM.straitOpenDays}/14 days</span></div>
            <div class="stat-row"><span>Tankers Seized</span><span>${SIM.seizureCount}</span></div>
            <div class="stat-row"><span>Intercepts</span><span>${SIM.interceptCount}</span></div>
            <div class="stat-row"><span>Budget Remaining</span><span>$${Math.round(SIM.budget)}M / $900M</span></div>
            <div class="stat-row"><span>Decisions Made</span><span>${(SIM.decisionLog || []).length}</span></div>
            ${SIM.character && SIM.character.uniqueResource ? `<div class="stat-row"><span>${SIM.character.uniqueResource.name}</span><span>${Math.round(SIM.uniqueResource)}/100</span></div>` : ''}
        </div>

        <div class="term-section">
            <div class="term-section-label">PERFORMANCE</div>
            ${postMortem}
        </div>

        <div class="term-btn-row">
            <button class="term-btn" id="btn-restart">[ PLAY AGAIN ]</button>
        </div>
    `);

    fadeInButtons(TERMINAL, 1200);

    document.getElementById('btn-restart').addEventListener('click', restartGame);
}

// ======================== RESTART ========================

function restartGame() {
    closeTerminal();
    hideActionPanel();

    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) toastContainer.innerHTML = '';

    // Reset SIM to defaults
    for (const [key, val] of Object.entries(SIM_DEFAULTS)) {
        SIM[key] = Array.isArray(val) ? [] : (typeof val === 'object' && val !== null) ? {} : val;
    }

    // Reset character-specific state
    if (SIM.character) {
        if (SIM.character._addressNationUses !== undefined) SIM.character._addressNationUses = 0;
        if (SIM.character._withdrawalStreak !== undefined) SIM.character._withdrawalStreak = 0;
        if (SIM.character.specialAction) SIM.character.specialAction.cooldown = 0;
        if (SIM.character.contacts) {
            const defaults = CHARACTERS.find(c => c.id === SIM.character.id);
            if (defaults && defaults.contacts) {
                for (let i = 0; i < SIM.character.contacts.length; i++) {
                    SIM.character.contacts[i].trust = defaults.contacts[i].trust;
                }
            }
        }
        if (SIM.character.scenario?.loseConditions) {
            for (const lc of SIM.character.scenario.loseConditions) {
                lc._days = 0;
            }
        }
    }

    // Reset action points and ROE
    resetActionPoints();
    SIM.roe = 'defensive';

    initSimulation();
    updateGauges();
    showDailyReport();
}

// ======================== KEYBOARD SHORTCUTS ========================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (SIM.gameOver && e.key === 'r') {
            restartGame();
            return;
        }
    });
}

// ======================== MUSIC ========================

function initMusic() {
    const audio = document.getElementById('bg-music');
    const muteBtn = document.getElementById('mute-btn');
    if (!audio || !muteBtn) return;

    // Try to play (will fail without user interaction)
    audio.volume = 0.3;

    muteBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().catch(() => {});
            muteBtn.textContent = '\u266B';
            muteBtn.classList.remove('muted');
        } else {
            audio.pause();
            muteBtn.textContent = '\u266B';
            muteBtn.classList.add('muted');
        }
    });

    // Auto-play on first user click anywhere
    document.addEventListener('click', function startMusic() {
        audio.play().catch(() => {});
        document.removeEventListener('click', startMusic);
    }, { once: true });
}

// ======================== NEWS TICKERS ========================

function updateTickers() {
    const publicEl = document.getElementById('public-ticker-content');
    const intelEl = document.getElementById('intel-ticker-content');
    if (!publicEl || !intelEl) return;

    // Public ticker: wire service format (last 8 non-normal)
    const publicNews = SIM.headlines
        .filter(h => h.level !== 'normal')
        .slice(-8)
        .map(h => {
            // Apply wire service prefix based on level
            if (h.text.match(/^(AP |REUTERS |SITREP |STATE |CIA |EMBASSY |DIPNOTE|TREASURY|WHITE HOUSE)/)) return h.text;
            if (h.level === 'critical') return 'AP FLASH: ' + h.text;
            if (h.level === 'warning') return 'REUTERS URGENT: ' + h.text;
            return 'AP BULLETIN: ' + h.text;
        })
        .join('  \u2502  ');

    // Intel ticker: confidence-tagged briefings
    let intelNews;
    if (SIM.fogOfWar > 70) {
        intelNews = 'TOP SECRET // SI // NOFORN \u2014 INTEL DEGRADED  \u2502  Signal clarity: LOW  \u2502  Multiple unverified contacts  \u2502  Assessment confidence: MINIMAL  \u2502  INCREASE SURVEILLANCE ASSETS';
    } else {
        const recentIntel = SIM.intelBriefings.slice(-5);
        const statusItems = [
            `Iran: ${(SIM.iranStrategy || 'unknown').toUpperCase()}`,
            `IRGC assets: ${SIM.iranBoats.length}`,
            `Mines: ${SIM.mines.length}`,
            `Proxy: ${SIM.proxyThreat > 50 ? 'HIGH' : SIM.proxyThreat > 25 ? 'MOD' : 'LOW'}`,
        ];
        if (SIM.fogOfWar <= 40) {
            statusItems.push(`Aggr: ${Math.round(SIM.iranAggression)}`);
            statusItems.push(`Nuke: ${SIM.iranAggression > 70 ? 'ELEVATED' : 'BASELINE'}`);
        }
        const intelItems = recentIntel.map(b => `[${b.confidence}] ${b.text}`);
        intelNews = [...statusItems, ...intelItems].join('  \u2502  ');
    }

    // Duplicate for seamless scroll
    publicEl.innerHTML = publicNews ? `<span>${publicNews}  \u2502  ${publicNews}</span>` : '<span>No breaking news.</span>';
    intelEl.innerHTML = `<span>${intelNews}  \u2502  ${intelNews}</span>`;
}

// ======================== HELPERS ========================

function _getDateString() {
    // Game starts Feb 28, 2026
    const startDate = new Date(2026, 1, 28); // Feb 28
    const gameDate = new Date(startDate);
    gameDate.setDate(gameDate.getDate() + SIM.day - 1);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[gameDate.getMonth()]} ${gameDate.getDate()}, 2026`;
}

function _getBriefingTitle() {
    if (!SIM.character) return 'DAILY BRIEFING';
    switch (SIM.character.id) {
        case 'trump': return 'PRESIDENTIAL DAILY BRIEF';
        case 'hegseth': return 'SECDEF MORNING SITREP';
        case 'kushner': return 'DIPLOMATIC TRAFFIC SUMMARY';
        case 'asmongold': return 'MOD-CURATED INTEL FEED';
        case 'fuentes': return 'AMERICA FIRST DAILY BRIEF';
        default: return 'DAILY BRIEFING';
    }
}

function _getMorningBrief() {
    return getAdvisorReaction('morningBrief') || getAdvisorReaction('weekStart');
}

function _getEscalationColor() {
    const level = SIM.escalationLevel || 0;
    const colors = ['#44dd88', '#88aa44', '#ddaa44', '#dd6644', '#dd4444', '#ff0000'];
    return colors[Math.min(level, 5)];
}

function _getEscalationName() {
    const level = SIM.escalationLevel || 0;
    const names = ['DIPLOMATIC', 'NAVAL STANDOFF', 'LIMITED STRIKES', 'AIR CAMPAIGN', 'GROUND WAR', 'TOTAL WAR'];
    return names[Math.min(level, 5)];
}

function formatEffectName(key) {
    const names = {
        tension: 'Tension', oilFlowProtection: 'Oil Protection', oilPrice: 'Oil Price',
        domesticApproval: 'Approval', internationalStanding: 'Standing',
        iranAggression: 'Iran Aggression', iranEconomy: 'Iran Economy',
        cost: 'Cost', conflictRisk: 'Conflict Risk', fogOfWar: 'Fog of War',
        diplomaticCapital: 'Diplomacy', proxyThreat: 'Proxy Threat',
        chinaRelations: 'China', russiaRelations: 'Russia',
        polarization: 'Polarization', assassinationRisk: 'Assassination Risk',
        warPath: 'Escalation', navalPresence: 'Naval Presence',
        blockadeLevel: 'Blockade', intelLevel: 'Intel Level', carrier: 'Carrier',
        politicalCapital: 'Political Capital', commandAuthority: 'Command Auth',
        credibility: 'Credibility', baseEnthusiasm: 'Base', exposure: 'Exposure',
        oilFlow: 'Oil Flow', budget: 'Budget', interceptCount: 'Intercepts',
    };
    return names[key] || key;
}

// ======================== REACTION PORTRAITS ========================

const REACTION_IMAGES = {
    trump:     { angry: 'assets/trump-angry.png',    positive: 'assets/trump-smug.png' },
    hegseth:   { angry: 'assets/pete-angry.png',     positive: 'assets/pete.png' },
    kushner:   { angry: 'assets/kushner.png',         positive: 'assets/kushner-scheming.png' },
    asmongold: { angry: 'assets/asmongold.png',       positive: 'assets/asmongold-hype.png' },
    fuentes:   { angry: 'assets/nick.png',            positive: 'assets/nick.png' },
};

function _getReactionImage(context) {
    if (!SIM.character) return null;
    const reactions = REACTION_IMAGES[SIM.character.id];
    if (!reactions) return null;

    if (context === 'victory') return reactions.positive;
    if (context === 'defeat') return reactions.angry;
    if (context === 'crisis') return reactions.angry;
    if (context === 'good') return reactions.positive;
    return null;
}

function _getEventCategoryImage(event) {
    if (!event) return '';
    // Determine category from event content
    const title = (event.title || '').toLowerCase();
    const desc = (event.description || '').toLowerCase();
    const text = title + ' ' + desc;

    if (event.crisis) return 'assets/event-military.png';
    if (text.match(/strike|carrier|navy|military|missile|bomb|war|attack|drone|mine|boat|ship|escort|convoy|swarm|submarine/))
        return 'assets/event-military.png';
    if (text.match(/diplomat|talk|negotiate|un |resolution|mediati|ceasefire|summit|back.?channel|treaty|muscat/))
        return 'assets/event-diplomatic.png';
    if (text.match(/oil|sanction|econom|price|gas|trade|insur|budget|barrel|reserve|bank|fund/))
        return 'assets/event-economic.png';
    if (text.match(/intel|spy|cyber|drone|surveil|sigint|humint|leak|defect|source|classified/))
        return 'assets/event-intel.png';
    return 'assets/event-military.png'; // default
}

// ======================== ACTION PANEL CSS ========================
// All action panel, interrupt, and floating number styles are in css/style.css

function _injectActionPanelStyles() {
    // Styles moved to css/style.css
}
