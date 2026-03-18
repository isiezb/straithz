/**
 * UI Controller — Daily Desk terminal screens
 * All screens use the lore intro typewriter aesthetic
 * Phases: initial_pick → daily_report → dayplay → event → daily_report (loop)
 * Action Point system during dayplay (Game Dev Tycoon style)
 */

const TERMINAL = document.getElementById('terminal-overlay');

// ======================== ACTION POINT SYSTEM ========================

const INTERRUPTS = [
    // ===== INTELLIGENCE (INT-01 to INT-05) =====
    { text: '', choices: [
        { label: '', effects: { fogOfWar: -5, budget: -5 } },
        { label: '', effects: {} }
    ]},
    { text: '', choices: [
        { label: '', effects: { budget: -5, fogOfWar: -3 } },
        { label: '', effects: {} }
    ]},
    { text: '', choices: [
        { label: '', effects: { fogOfWar: -8, tension: 3 } },
        { label: '', effects: { fogOfWar: -3 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { fogOfWar: -5 } },
        { label: '', effects: { fogOfWar: -3 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { fogOfWar: -3 } },
        { label: '', effects: {} }
    ]},

    // ===== DIPLOMATIC (INT-06 to INT-10) =====
    { text: '', choices: [
        { label: '', effects: { internationalStanding: 3 } },
        { label: '', effects: { internationalStanding: -2 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { diplomaticCapital: 3, tension: -2 } },
        { label: '', effects: { diplomaticCapital: 1 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { diplomaticCapital: 3, internationalStanding: 2 } },
        { label: '', effects: { internationalStanding: -2 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { internationalStanding: 2 } },
        { label: '', effects: { budget: -5, tension: 2 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { internationalStanding: 3, oilFlow: 2 } },
        { label: '', effects: {} }
    ]},

    // ===== MILITARY (INT-11 to INT-15) =====
    { text: '', choices: [
        { label: '', effects: { conflictRisk: 3 } },
        { label: '', effects: { budget: -10, conflictRisk: -2 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { tension: 3, conflictRisk: 2 } },
        { label: '', effects: {} }
    ]},
    { text: '', choices: [
        { label: '', effects: { internationalStanding: 3 } },
        { label: '', effects: { internationalStanding: -5 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { budget: -15, fogOfWar: -8, tension: 5 } },
        { label: '', effects: {} }
    ]},
    { text: '', choices: [
        { label: '', effects: { budget: -10, oilFlow: -3 } },
        { label: '', effects: { budget: -5, oilFlow: -5 } }
    ]},

    // ===== DOMESTIC (INT-16 to INT-20) =====
    { text: '', choices: [
        { label: '', effects: { domesticApproval: 3, fogOfWar: 2 } },
        { label: '', effects: {} }
    ]},
    { text: '', choices: [
        { label: '', effects: { domesticApproval: 3, budget: -10 } },
        { label: '', effects: { domesticApproval: -3 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { polarization: -3 } },
        { label: '', effects: { polarization: 2 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { domesticApproval: 2 } },
        { label: '', effects: {} }
    ]},
    { text: '', choices: [
        { label: '', effects: { domesticApproval: 3 } },
        { label: '', effects: {} }
    ]},

    // ===== CRISIS (INT-21 to INT-25) =====
    { text: '', choices: [
        { label: '', effects: { budget: -15, internationalStanding: 5 } },
        { label: '', effects: { internationalStanding: -5, oilFlow: -3 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { diplomaticCapital: 5, tension: -5 } },
        { label: '', effects: { tension: 3 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { internationalStanding: 10, tension: -8, budget: -10 }, setFlags: { humanitarian_rescue: true } },
        { label: '', effects: { internationalStanding: -3 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { fogOfWar: -3, oilPrice: -5 } },
        { label: '', effects: { oilPrice: 3 } }
    ]},
    { text: '', choices: [
        { label: '', effects: { budget: -5 } },
        { label: '', effects: { budget: -10, domesticApproval: -3 } }
    ]},

    // ===== CHARACTER-SPECIFIC (INT-26 to INT-35) =====
    { text: '', choices: [
        { label: '', effects: { domesticApproval: 3, fogOfWar: 5 } },
        { label: '', effects: { domesticApproval: -3 } }
    ], condition: () => SIM.character?.id === 'trump' },

    { text: '', choices: [
        { label: '', effects: { domesticApproval: 2 } },
        { label: '', effects: { domesticApproval: -2 } }
    ], condition: () => SIM.character?.id === 'trump' },

    { text: '', choices: [
        { label: '', effects: { domesticApproval: 5, internationalStanding: 3 } },
        { label: '', effects: { domesticApproval: -2 } }
    ], condition: () => SIM.character?.id === 'hegseth' },

    { text: '', choices: [
        { label: '', effects: { tension: 3 } },
        { label: '', effects: { diplomaticCapital: 2 } }
    ], condition: () => SIM.character?.id === 'hegseth' },

    { text: '', choices: [
        { label: '', effects: { fogOfWar: -10, diplomaticCapital: 5 } },
        { label: '', effects: { fogOfWar: -3 } }
    ], condition: () => SIM.character?.id === 'kushner' },

    { text: '', choices: [
        { label: '', effects: { domesticApproval: 3 } },
        { label: '', effects: {} }
    ], condition: () => SIM.character?.id === 'kushner' },

    { text: '', choices: [
        { label: '', effects: { fogOfWar: -5 } },
        { label: '', effects: { fogOfWar: -3 } }
    ], condition: () => SIM.character?.id === 'asmongold' },

    { text: '', choices: [
        { label: '', effects: { domesticApproval: 5, fogOfWar: -3 } },
        { label: '', effects: { fogOfWar: -3, domesticApproval: -5 } }
    ], condition: () => SIM.character?.id === 'asmongold' },

    { text: '', choices: [
        { label: '', effects: { domesticApproval: -5, polarization: 5 } },
        { label: '', effects: { domesticApproval: 5 } }
    ], condition: () => SIM.character?.id === 'fuentes' },

    { text: '', choices: [
        { label: '', effects: { domesticApproval: 5, polarization: 3 } },
        { label: '', effects: { domesticApproval: -3, internationalStanding: 3 } }
    ], condition: () => SIM.character?.id === 'fuentes' },
];

const _intelSnippets = [
    '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '',
];

// Floating number stack counter for positioning

// ======================== ACTION TOOLTIPS ========================

const ACTION_TIPS = {
    'gather-intel':     { desc: '', effect: '' },
    'analyze-threats':  { desc: '', effect: '' },
    'phone-call':       { desc: '', effect: '' },
    'draft-proposal':   { desc: '', effect: '' },
    'demand-un-session':{ desc: '', effect: '' },
    'reposition-fleet': { desc: '', effect: '' },
    'change-roe':       { desc: '', effect: '' },
    'escort-tankers':   { desc: '', effect: '' },
    'precision-strike': { desc: '', effect: '' },
    'spec-ops-raid':    { desc: '', effect: '' },
    'air-strikes':      { desc: '', effect: '' },
    'sead-mission':     { desc: '', effect: '' },
    'ground-troops':    { desc: '', effect: '' },
    'seize-islands':    { desc: '', effect: '' },
    'full-mobilization':{ desc: '', effect: '' },
    'press-conference': { desc: '', effect: '' },
    'brief-congress':   { desc: '', effect: '' },
    'adjust-sanctions': { desc: '', effect: '' },
    'market-intervention':{ desc: '', effect: '' },
    'issue-ultimatum':  { desc: '', effect: '' },
    'emergency-coalition':{ desc: '', effect: '' },
    'escalate':         { desc: '', effect: '' },
    'deescalate':       { desc: '', effect: '' },
    // Bible actions
    'prisoner_exchange':   { desc: '', effect: '' },
    'covert_operation':    { desc: '', effect: '' },
    'emergency_budget':    { desc: '', effect: '' },
    'media_offensive':     { desc: '', effect: '' },
    'backchannel_message': { desc: '', effect: '' },
    'allied_consultation': { desc: '', effect: '' },
    'sanctions_adjustment':{ desc: '', effect: '' },
    'intel_sharing':       { desc: '', effect: '' },
    'humanitarian_corridor':{ desc: '', effect: '' },
    'economic_stimulus':   { desc: '', effect: '' },
    'cyber_recon':         { desc: '', effect: '' },
    'war_powers_consult':  { desc: '', effect: '' },
    'regional_flyover':    { desc: '', effect: '' },
    'summit_proposal':     { desc: '', effect: '' },
    'press_embargo':       { desc: '', effect: '' },
};

// ======================== BIBLE ACTIONS (Content Bible expansion) ========================

const BIBLE_ACTIONS = [
    {
        id: 'prisoner_exchange',
        name: '',
        category: 'diplomacy',
        ap: 2, cost: 20,
        condition: () => SIM.seizureCount > 0,
        execute: function() {
            const success = SIM.diplomaticCapital > 30 && SIM.iranFactionBalance > 40;
            if (success) {
                _applyEffects({ tension: -8, domesticApproval: 10, diplomaticCapital: -8, iranAggression: -5 });
                addHeadline('', 'good');
                showToast('', 'good');
            } else {
                _applyEffects({ tension: 3, diplomaticCapital: -5 });
                addHeadline('Prisoner exchange talks collapse — Iran demands more concessions', 'bad');
                showToast('Exchange negotiations failed', 'bad');
            }
        },
    },
    {
        id: 'covert_operation',
        name: '',
        category: 'intelligence',
        ap: 3, cost: 25,
        condition: () => SIM.fogOfWar < 50,
        execute: function() {
            const success = Math.random() < 0.7;
            if (success) {
                _applyEffects({ iranAggression: -10, fogOfWar: -15, tension: 5, conflictRisk: 3 });
                addHeadline('', 'neutral');
                showToast('', 'good');
            } else {
                _applyEffects({ tension: 15, internationalStanding: -10, iranAggression: 10, fogOfWar: 5 });
                addHeadline('Iran claims to have captured US special operations personnel', 'critical');
                showToast('Covert operation: COMPROMISED', 'bad');
            }
        },
    },
    {
        id: 'emergency_budget',
        name: '',
        category: 'domestic',
        ap: 1, cost: 0,
        condition: () => SIM.budget < 100,
        execute: function() {
            const success = SIM.domesticApproval > 40;
            if (success) {
                _applyEffects({ budget: 200, domesticApproval: -3, polarization: 3 });
                addHeadline('', 'good');
                showToast('', 'good');
            } else {
                _applyEffects({ budget: 50, domesticApproval: -5, polarization: 5 });
                addHeadline('Congress slashes emergency budget request — only $50M approved', 'bad');
                showToast('Budget request partially denied', 'bad');
            }
        },
    },
    {
        id: 'media_offensive',
        name: '',
        category: 'domestic',
        ap: 2, cost: 10,
        condition: () => SIM.fogOfWar > 60,
        execute: function() {
            _applyEffects({ fogOfWar: -8, domesticApproval: 5, internationalStanding: 3, polarization: -2 });
            addHeadline('', 'neutral');
            showToast('', 'good');
        },
    },
    {
        id: 'backchannel_message',
        name: '',
        category: 'diplomacy',
        ap: 1, cost: 0,
        condition: () => SIM.storyFlags?.backchannel_accepted || SIM.diplomaticCapital > 20,
        execute: function() {
            _applyEffects({ tension: -3, diplomaticCapital: -2, iranAggression: -2 });
            addHeadline('', 'neutral');
            showToast('', 'good');
        },
    },
    {
        id: 'allied_consultation',
        name: '',
        category: 'diplomacy',
        ap: 1, cost: 0,
        condition: () => SIM.internationalStanding > 30,
        execute: function() {
            _applyEffects({ internationalStanding: 3, diplomaticCapital: 3 });
            addHeadline('', 'good');
            showToast('', 'good');
        },
    },
    {
        id: 'sanctions_adjustment',
        name: '',
        category: 'economic',
        ap: 1, cost: 0,
        condition: () => true,
        execute: function() {
            _applyEffects({ iranEconomy: -3, tension: 2, iranAggression: 2, internationalStanding: -2 });
            SIM.pendingEffects.push({
                cardId: 'sanctions_adj', cardName: 'Sanctions Adjustment', category: 'economic',
                effects: { iranEconomy: -5, iranAggression: -3 },
                activateOnDay: SIM.day + 3,
            });
            addHeadline('', 'neutral');
            showToast('', 'good');
        },
    },
    {
        id: 'intel_sharing',
        name: '',
        category: 'intelligence',
        ap: 1, cost: 0,
        condition: () => SIM.fogOfWar < 40 && SIM.internationalStanding > 30,
        execute: function() {
            _applyEffects({ internationalStanding: 5, diplomaticCapital: 3, fogOfWar: 3 });
            addHeadline('', 'good');
            showToast('', 'good');
        },
    },
    {
        id: 'humanitarian_corridor',
        name: '',
        category: 'diplomacy',
        ap: 2, cost: 15,
        condition: () => SIM.warPath >= 2,
        execute: function() {
            _applyEffects({ internationalStanding: 10, tension: -3, domesticApproval: 3, oilFlow: 5 });
            addHeadline('', 'good');
            showToast('', 'good');
        },
    },
    {
        id: 'economic_stimulus',
        name: '',
        category: 'economic',
        ap: 1, cost: 30,
        condition: () => SIM.oilPrice > 120,
        execute: function() {
            _applyEffects({ domesticApproval: 8, oilPrice: -5, budget: -30 });
            addHeadline('', 'good');
            showToast('', 'good');
        },
    },
    {
        id: 'cyber_recon',
        name: '',
        category: 'intelligence',
        ap: 1, cost: 10,
        condition: () => SIM.fogOfWar > 30,
        execute: function() {
            _applyEffects({ fogOfWar: -10 });
            const discovery = Math.random() < 0.3;
            if (discovery) {
                _applyEffects({ fogOfWar: -10 });
                addHeadline('NSA cyber reconnaissance reveals Iranian naval operation plans', 'good');
                showToast('Major intelligence breakthrough!', 'good');
            } else {
                addHeadline('', 'neutral');
                showToast('', 'good');
            }
        },
    },
    {
        id: 'war_powers_consult',
        name: '',
        category: 'domestic',
        ap: 1, cost: 0,
        condition: () => SIM.warPath >= 3,
        execute: function() {
            _applyEffects({ domesticApproval: 3, polarization: -3, internationalStanding: 3 });
            SIM.storyFlags.war_powers_briefed = true;
            addHeadline('', 'neutral');
            showToast('', 'good');
        },
    },
    {
        id: 'regional_flyover',
        name: '',
        category: 'military',
        ap: 1, cost: 15,
        condition: () => true,
        execute: function() {
            _applyEffects({ tension: 5, iranAggression: -5, domesticApproval: 3, internationalStanding: -2 });
            addHeadline('', 'neutral');
            showToast('', 'good');
        },
    },
    {
        id: 'summit_proposal',
        name: '',
        category: 'diplomacy',
        ap: 2, cost: 20,
        condition: () => SIM.diplomaticCapital > 40,
        execute: function() {
            _applyEffects({ diplomaticCapital: -10, internationalStanding: 8, tension: -5, domesticApproval: 3 });
            SIM.storyFlags.summit_proposed = true;
            addHeadline('', 'good');
            showToast('', 'good');
        },
    },
    {
        id: 'press_embargo',
        name: '',
        category: 'domestic',
        ap: 1, cost: 0,
        condition: () => SIM.fogOfWar > 50,
        execute: function() {
            _applyEffects({ fogOfWar: -5, domesticApproval: -2, polarization: 2 });
            addHeadline('', 'neutral');
            showToast('', 'good');
        },
    },
];

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
    initSituationPanel();
    updateCenterPanel();
}

// ======================== SITUATION PANEL (left sidebar) ========================

function initSituationPanel() {
    // Situation panel is deprecated — info now shown in center panel and map sidebar
    const panel = document.getElementById('situation-panel');
    if (panel) panel.style.display = 'none';
}

function updateSituationPanel() {
    const panel = document.getElementById('situation-panel');
    if (!panel || panel.style.display === 'none') return;

    const g = calculateGauges();
    const r = calculateRating();
    const esc = ESCALATION_LADDER[Math.min(SIM.warPath, 5)];

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
            <div class="sit-row"><span>Strait</span><span class="sit-val ${SIM.straitOpenDays > 0 ? 'good' : 'danger'}">${SIM.straitOpenDays > 0 ? SIM.straitOpenDays + '/7 OPEN' : 'CONTESTED'}</span></div>
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
    const centerPanel = document.getElementById('center-panel');
    if (centerPanel) centerPanel.classList.add('no-sitpanel');
}

function showSituationPanel() {
    const panel = document.getElementById('situation-panel');
    if (panel) panel.style.display = '';
    updateSituationPanel();
}

// ======================== CENTER PANEL (Situation Room) ========================

function updateCenterPanel() {
    // Tactical overview is now rendered on the map canvas sidebar.
    // Center panel contains scene panel + narrative feed — do not overwrite.
}

function showCenterPanel() {
    const panel = document.getElementById('center-panel');
    if (panel) panel.style.display = '';
}

function hideCenterPanel() {
    const panel = document.getElementById('center-panel');
    if (panel) panel.style.display = 'none';
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

    if (typeof updateSituationPanel === 'function') {
        const now = performance.now();
        if (!updateGauges._lastSitUpdate || now - updateGauges._lastSitUpdate > 1000) {
            updateGauges._lastSitUpdate = now;
            updateSituationPanel();
        }
    }

    // Rating
    const ratingEl = document.getElementById('hud-rating');
    if (ratingEl) {
        const r = calculateRating();
        ratingEl.textContent = r.grade;
        ratingEl.className = 'hud-rating ' + (r.score >= 60 ? 'good' : r.score >= 35 ? 'warning' : 'danger');
    }

    // Strait counter moved to situation panel win progress

    // --- Warpath gauge ---
    const wpEl = document.getElementById('gauge-warpath');
    if (wpEl) {
        const wpVal = wpEl.querySelector('.gauge-value');
        if (wpVal) {
            wpVal.textContent = SIM.warPath + '/5';
            wpVal.className = 'gauge-value ' + (SIM.warPath >= 4 ? 'danger' : SIM.warPath >= 3 ? 'warning' : 'good');
        }
    }

    // --- Budget gauge ---
    const bgEl = document.getElementById('gauge-budget');
    if (bgEl) {
        const bgVal = bgEl.querySelector('.gauge-value');
        if (bgVal) {
            bgVal.textContent = '$' + Math.round(SIM.budget) + 'M';
            bgVal.className = 'gauge-value ' + (SIM.budget < 200 ? 'danger' : SIM.budget < 500 ? 'warning' : 'good');
        }
    }

    // --- Hill Support (AIPAC) indicator ---
    const hsEl = document.getElementById('gauge-hill');
    if (hsEl) {
        const hsVal = hsEl.querySelector('.gauge-value');
        if (hsVal) {
            const ap = Math.round(SIM.aipacPressure || 50);
            hsVal.textContent = ap;
            hsVal.className = 'gauge-value ' + (ap >= 60 ? 'good' : ap >= 30 ? 'warning' : 'danger');
        }
    }

    // --- Lose-condition warnings ---
    const warnEl = document.getElementById('hud-warning');
    if (warnEl) {
        let warn = '';
        if (SIM.warPath >= 4) warn = '\u26A0 WAR IMMINENT';
        else if (SIM.domesticApproval <= 20) warn = '\u26A0 REMOVAL LIKELY';
        else if (SIM.internationalStanding <= 15) warn = '\u26A0 ISOLATION';
        else if (SIM.polarization >= 75) warn = '\u26A0 UNREST';
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
        // Asmongold: fuzzy numbers at low credibility
        let displayVal = Math.round(value);
        if (SIM.character?.id === 'asmongold' && SIM.uniqueResource < 30) {
            const fuzz = Math.round((30 - SIM.uniqueResource) * 0.5);
            displayVal = Math.round(value / (fuzz + 1)) * (fuzz + 1);
            displayVal = '~' + displayVal;
        }
        valEl.textContent = displayVal;
        valEl.className = 'gauge-value ' + (value >= 60 ? 'good' : value >= 35 ? 'warning' : 'danger');
    }
    // Trend arrow
    if (trendEl && delta !== undefined) {
        const d = Math.round(delta);
        if (d > 0) { trendEl.textContent = '\u25B2+' + d; trendEl.className = 'gauge-trend up'; }
        else if (d < 0) { trendEl.textContent = '\u25BC' + d; trendEl.className = 'gauge-trend down'; }
        else { trendEl.textContent = ''; trendEl.className = 'gauge-trend stable'; }
    }
    // Flash when gauge changes significantly
    if (delta < -2) {
        el.classList.remove('danger-flash', 'good-flash');
        void el.offsetWidth;
        el.classList.add('danger-flash');
    } else if (delta > 2) {
        el.classList.remove('danger-flash', 'good-flash');
        void el.offsetWidth;
        el.classList.add('good-flash');
    }
}

// ======================== ADVISOR RECOMMENDATION ========================

function getAdvisorRecommendation() {
    const rec = DATA.intel.advisorRecommendations;
    if (SIM.tension > 70 && SIM.iranAggression > 60) {
        return rec.highTensionHighAggression;
    }
    if (SIM.oilFlow < 30) {
        return rec.lowOilFlow;
    }
    if (SIM.fogOfWar > 70) {
        return rec.highFogOfWar;
    }
    if (SIM.domesticApproval < 35) {
        return rec.lowApproval;
    }
    if (SIM.budget < 300) {
        return rec.lowBudget;
    }
    return rec.default;
}

// ======================== KEY DRIVERS (why gauges changed) ========================

function _getKeyDrivers() {
    const drivers = [];
    // Tension drivers
    const kd = DATA.intel.keyDrivers;
    if (SIM.crisisLevel >= 1) drivers.push({ text: kd.crisisLevel.replace('{value}', SIM.crisisLevel), cls: 'down-bad' });
    if (SIM.diplomaticCapital > 60) drivers.push({ text: kd.strongDiplomacy, cls: 'up-good' });
    // Oil
    if (SIM.oilFlow < 40) drivers.push({ text: kd.oilFlowLow.replace('{value}', Math.round(SIM.oilFlow)), cls: 'down-bad' });
    if (SIM.proxyThreat > 30) drivers.push({ text: kd.proxyThreat.replace('{value}', Math.round(SIM.proxyThreat)), cls: 'down-bad' });
    const seized = SIM.tankers.filter(t => t.seized).length;
    if (seized > 0) drivers.push({ text: kd.tankersSeized.replace('{count}', seized), cls: 'down-bad' });
    // Approval
    if (SIM.budget < 200) drivers.push({ text: kd.budgetCrisis, cls: 'down-bad' });
    if (SIM.oilFlow < 30) drivers.push({ text: kd.gasPrices, cls: 'down-bad' });
    // Iran
    if (SIM.iranEconomy < 30) drivers.push({ text: kd.iranEconomyCollapsed, cls: 'down-bad' });
    if (SIM.chinaRelations < 30) drivers.push({ text: kd.chinaBuyingOil, cls: 'down-bad' });
    // Positive
    if (SIM.interceptCount > 0) drivers.push({ text: kd.interceptsBoosting.replace('{count}', SIM.interceptCount), cls: 'up-good' });
    if (SIM.straitOpenDays > 0) drivers.push({ text: kd.straitOpen.replace('{days}', SIM.straitOpenDays), cls: 'up-good' });
    // Player deltas
    const pd = SIM.playerDeltas;
    if (pd.tension < -3) drivers.push({ text: kd.playerReducingTension, cls: 'up-good' });
    if (pd.tension > 3) drivers.push({ text: kd.playerIncreasingTension, cls: 'down-bad' });
    if (pd.oilFlow > 3) drivers.push({ text: kd.playerImprovingOilFlow, cls: 'up-good' });
    if (pd.domesticApproval > 3) drivers.push({ text: kd.playerBoostingApproval, cls: 'up-good' });
    if (pd.domesticApproval < -3) drivers.push({ text: kd.playerHurtingApproval, cls: 'down-bad' });

    if (drivers.length === 0) drivers.push({ text: kd.holdingSteady, cls: 'stable' });

    return drivers.slice(0, 5).map(d =>
        `<div class="morning-news-item" style="font-size:11px"><span class="og-delta ${d.cls}">\u25CF</span> ${d.text}</div>`
    ).join('');
}

// ======================== FIRST MORNING (Immersive Day 1 Intro) ========================

function showFirstMorning() {
    const charName = SIM.character ? SIM.character.name : 'ADVISOR';
    const charTitle = SIM.character ? SIM.character.title : '';

    const advisorImg = SIM.character ? SIM.character.portraitImage : null;

    // Show situation room in scene panel for first morning
    if (typeof showSceneImage === 'function') {
        showSceneImage('assets/situation-room.png', { caption: 'THE WHITE HOUSE SITUATION ROOM \u2014 DAY 1' });
    }

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

    const wireText = DATA.intel.firstMorning.wireText;

    const sitrepText = DATA.intel.firstMorning.sitrepText;

    const ordersText = DATA.intel.firstMorning.ordersText.replace('{charName}', charName);

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
    // Day 1: show immersive first morning instead of generic report
    if (SIM.day === 1) {
        showFirstMorning();
        return;
    }

    // Show situation room in scene panel for morning briefing
    if (typeof showSceneImage === 'function') {
        showSceneImage('assets/situation-room.png', { caption: 'MORNING BRIEFING \u2014 DAY ' + SIM.day });
    }

    // Generate narrative briefing
    const briefing = typeof generateMorningBriefing === 'function' ? generateMorningBriefing() : null;

    // Gauge display helper
    function gaugeBar(label, val, max) {
        max = max || 100;
        const pct = Math.round((val / max) * 100);
        const cls = pct >= 60 ? 'good' : pct >= 35 ? 'warning' : 'danger';
        return `<div class="mb-gauge">
            <span class="mb-gauge-label">${label}</span>
            <div class="mb-gauge-track"><div class="mb-gauge-fill gauge-fill ${cls}" style="width:${pct}%"></div></div>
            <span class="mb-gauge-val ${cls}">${Math.round(val)}</span>
        </div>`;
    }

    const g = briefing ? briefing.gauges : (typeof calculateGauges === 'function' ? calculateGauges() : { stability: 50, economy: 50, support: 50, intel: 50 });
    const r = briefing ? briefing.rating : (typeof calculateRating === 'function' ? calculateRating() : { grade: 'C', score: 50 });

    // Story arc header
    const arc = typeof getCurrentStoryArc === 'function' ? getCurrentStoryArc() : null;
    const arcHtml = arc ? `<div class="story-arc-header" style="color:${arc.color}; font-size:9px; letter-spacing:3px; margin-bottom:2px">\u2501 ${arc.name} \u2501</div>` : '';

    // Special action button
    let specialActionHtml = '';
    if (SIM.character.specialAction && SIM.character.specialAction.cooldown === 0) {
        specialActionHtml = `<button class="term-btn" id="btn-special-action">[ ${SIM.character.specialAction.name.toUpperCase()} ]</button>`;
    }

    // Synergies (compact)
    let synergyHtml = '';
    if (typeof getActiveSynergies === 'function') {
        const synergies = getActiveSynergies();
        if (synergies.length > 0) {
            synergyHtml = `<div class="mb-synergies">
                ${synergies.map(s => `<span class="mb-synergy">\u2605 ${s.name}</span>`).join('')}
            </div>`;
        }
    }

    // Build the narrative briefing terminal
    const advisorName = briefing ? briefing.advisor : 'Your advisor';
    const openingText = briefing ? briefing.opening : 'Situation unchanged from yesterday.';
    const iranIntel = briefing ? briefing.iranIntel : '';
    const closerText = briefing ? briefing.closer : '';

    // Character-specific briefing line
    let charBriefHtml = '';
    if (briefing && briefing.characterNote) {
        const cn = briefing.characterNote;
        charBriefHtml = `<div class="mb-iran-intel"><span class="mb-intel-prefix" style="color:#88aa66">\u25B6 ${cn.advisor.toUpperCase()}</span> ${cn.text}</div>`;
    }

    // AIPAC / Hill Support status at extremes
    let aipacHtml = '';
    if (SIM.aipacPressure < 25) {
        const charNote = SIM.character.id === 'trump' ? 'Donors are calling. They\'re not happy.' :
                         SIM.character.id === 'kushner' ? 'Your AIPAC contacts are going cold. The normalization angle needs attention.' :
                         SIM.character.id === 'fuentes' ? 'The establishment is mobilizing against you. Your base sees it as validation.' :
                         SIM.character.id === 'hegseth' ? 'Pentagon advisors note Congressional hawks are no longer aligned with your strategy.' :
                         SIM.character.id === 'asmongold' ? 'Chat is split on the lobby dynamics — risky content either way.' :
                         'Political headwinds on the Hill are intensifying.';
        aipacHtml = `<div class="mb-iran-intel"><span class="mb-intel-prefix" style="color:#dd4444">\u26A0 HILL</span> ${charNote}</div>`;
    } else if (SIM.aipacPressure > 80) {
        const charNote = SIM.character.id === 'trump' ? 'The donors love what you\'re doing. Tremendous support.' :
                         SIM.character.id === 'kushner' ? 'AIPAC connections are strong. MBS trust-building aligns with Israel-Saudi normalization.' :
                         SIM.character.id === 'fuentes' ? 'Congressional backing is strong, but your base is suspicious of the establishment embrace.' :
                         SIM.character.id === 'hegseth' ? 'Congressional hawks are fully aligned. Military budgets will sail through.' :
                         SIM.character.id === 'asmongold' ? 'Chat is calling you a shill. High Hill support comes with credibility risk.' :
                         'Strong Congressional backing on your Iran strategy.';
        aipacHtml = `<div class="mb-iran-intel"><span class="mb-intel-prefix" style="color:#44dd88">\u25B2 HILL</span> ${charNote}</div>`;
    }

    openTerminal(`
        ${arcHtml}
        <div class="term-header">${_getDateString()} \u2014 DAY ${SIM.day}</div>

        <div class="mb-briefing">
            <div class="mb-advisor-line"><span class="mb-advisor-name">${advisorName}</span> steps to the podium:</div>
            <div class="mb-prose">${openingText}</div>
            ${iranIntel ? `<div class="mb-iran-intel"><span class="mb-intel-prefix">\u26A0 IRAN</span> ${iranIntel}</div>` : ''}
            ${charBriefHtml}
        </div>

        <div class="mb-gauges-row">
            ${gaugeBar('STABILITY', g.stability)}
            ${gaugeBar('ECONOMY', g.economy)}
            ${gaugeBar('SUPPORT', g.support)}
            ${gaugeBar('INTEL', g.intel)}
            <div class="mb-rating"><span class="mb-rating-label">RATING</span><span class="mb-rating-grade ${r.score >= 60 ? 'good' : r.score >= 35 ? 'warning' : 'danger'}">${r.grade}</span></div>
        </div>

        ${synergyHtml}

        ${aipacHtml}

        <div class="mb-closer">\u25B6 ${closerText}</div>

        <div class="term-btn-row">
            <button class="term-btn" id="btn-maintain">[ BEGIN DAY ]</button>
            <button class="term-btn warning-btn" id="btn-adjust">[ ADJUST STRATEGY ]</button>
            ${specialActionHtml}
        </div>
    `);

    fadeInButtons(TERMINAL, 400);

    // Also push the briefing to the narrative feed
    if (typeof addNarrative === 'function' && briefing) {
        addNarrative('scene', openingText, { portrait: advisorName });
        if (iranIntel) addNarrative('dialogue', iranIntel, { speaker: advisorName, portrait: advisorName });
        if (closerText) addNarrative('scene', closerText, { portrait: advisorName });
    }

    document.getElementById('btn-maintain').addEventListener('click', () => {
        closeTerminal();
        resetActionPoints();
        startDayPlay();
    });

    document.getElementById('btn-adjust').addEventListener('click', () => {
        showAdjustStrategy();
    });

    const specialBtn = document.getElementById('btn-special-action');
    if (specialBtn) {
        specialBtn.addEventListener('click', () => {
            executeSpecialAction();
            showDailyReport();
        });
    }
}

// ======================== CHARACTER SPECIAL ACTION ========================

function executeSpecialAction() {
    if (!SIM.character.specialAction || SIM.character.specialAction.cooldown > 0) return false;

    const action = SIM.character.specialAction;

    // Trump: CLAIM VICTORY — check conditions before executing
    if (SIM.character.id === 'trump') {
        if (SIM.day - SIM.lastPublicWinDay > 1) {
            showToast('No recent public win to claim! Need a win within 1 day.', 'warning');
            return false;
        }
        if (SIM.uniqueResource < 15) {
            showToast('Not enough Political Capital! Need 15.', 'warning');
            return false;
        }
    }

    // Asmongold: MAKE PREDICTION — opens picker UI, don't set cooldown here
    if (SIM.character.id === 'asmongold') {
        if (typeof showPredictionPicker === 'function') {
            showPredictionPicker();
        }
        return false; // AP not spent here — handled by prediction picker
    }

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
    return true;
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

    // Limit 2 swaps per day
    if ((SIM.swapsToday || 0) >= 2) {
        showToast('No swaps remaining today', 'warning');
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
            <div class="term-title">SWAP CARD (${2 - (SIM.swapsToday || 0)} swaps left today)</div>
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
        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            if (SIM.phase === 'dayplay') {
                closeTerminal();
                if (typeof showActionPanel === 'function') showActionPanel();
            } else {
                showDailyReport();
            }
        });

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

                SIM.swapsToday = (SIM.swapsToday || 0) + 1;
                addHeadline(`Strategy changed: ${removed.card.name} \u2192 ${replacement.card.name}`, 'warning');

                closeTerminal();
                if (SIM.phase === 'dayplay') {
                    if (typeof showActionPanel === 'function') showActionPanel();
                } else {
                    resetActionPoints();
                    startDayPlay();
                }
            });
        }
    }

    render();
}

// ======================== ACTION PANEL (replaces Quick Actions) ========================

function resetActionPoints() {
    SIM.actionPoints = 3;
    SIM.swapsToday = 0;
    if (SIM.roe === undefined) SIM.roe = 'defensive';
}

function _applyEffect(key, val, multiplier) {
    if (multiplier) val = Math.round(val * multiplier * 10) / 10;
    if (key === '_aipacApprovalPenaltyDays') { SIM._aipacApprovalPenaltyDays = val; return; }
    if (key === '_aipacDiplomaticRestrictionDays') { SIM._aipacDiplomaticRestrictionDays = val; return; }
    if (key === 'aipacPressure') { SIM.aipacPressure = Math.max(0, Math.min(100, (SIM.aipacPressure || 50) + val)); return; }
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

function _applyEffects(effects, multiplier) {
    for (const [key, val] of Object.entries(effects)) {
        _applyEffect(key, val, multiplier);
    }
    showEffectSummary(effects);
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

        const esc = SIM.warPath || 0;
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

        // Generate bible actions grouped by category
        function _getBibleActionsHtml() {
            const catColors = { intelligence: '#44dd88', diplomacy: '#4488dd', military: '#dd4444', domestic: '#aa88dd', economic: '#ddaa44' };
            const catLabels = { intelligence: 'INTELLIGENCE+', diplomacy: 'DIPLOMACY+', military: 'MILITARY+', domestic: 'DOMESTIC+', economic: 'ECONOMIC+' };
            const available = BIBLE_ACTIONS.filter(a => {
                try { return a.condition(); } catch(e) { return false; }
            });
            if (available.length === 0) return '';
            const grouped = {};
            available.forEach(a => {
                if (!grouped[a.category]) grouped[a.category] = [];
                grouped[a.category].push(a);
            });
            let html = '<div class="ap-category"><div class="ap-cat-header" style="color:#88ddaa;cursor:pointer" id="bible-actions-toggle">\u25B6 MORE ACTIONS</div><div id="bible-actions-list" style="display:none">';
            for (const cat of Object.keys(grouped)) {
                html += `<div class="ap-cat-header" style="color:${catColors[cat] || '#888'};font-size:9px;margin-top:6px">${catLabels[cat] || cat.toUpperCase()}</div>`;
                grouped[cat].forEach(a => {
                    const costStr = a.cost ? ` <span class="ap-cost">$${a.cost}M</span>` : '';
                    const apStr = a.ap > 1 ? ` <span class="ap-cost">${a.ap}AP</span>` : '';
                    const budgetOk = !a.cost || SIM.budget >= a.cost;
                    const apOk = ap >= a.ap;
                    html += `<button class="ap-btn ${!apOk || !budgetOk ? 'disabled' : ''}" data-action="bible_${a.id}">${a.name}${costStr}${apStr}${tip(a.id)}</button>`;
                });
            }
            html += '</div></div>';
            return html;
        }

        // Can escalate if not already at max and AP available
        const canEscalate = esc < 5 && ap > 0;
        const nextEsc = ESCALATION_LADDER[Math.min(esc + 1, 5)];

        panel.innerHTML = `
            <div class="ap-header">
                <div class="ap-title">ACTIONS</div>
                <div class="ap-points">AP: ${apDots}</div>
                <div class="ap-budget">${budgetStr}</div>
                ${SIM.character?.id === 'trump' ? `<div class="ap-budget" style="color:#ddaa44">PC: ${Math.round(SIM.uniqueResource)} | Wins: ${SIM.victoryNarrative}/3</div>` : ''}
                ${SIM.character?.id === 'kushner' ? `<div class="ap-budget" style="color:#aa44dd">Deal: $${Math.round(SIM.dealValue || 0)}M</div>` : ''}
                ${SIM.character?.id === 'asmongold' ? `<div class="ap-budget" style="color:#4488dd">Audience: ${Math.round(SIM.audience || 50)}</div>` : ''}
                ${SIM.character?.id === 'fuentes' && SIM.withdrawalLocked ? `<div class="ap-budget" style="color:#44dd88">WITHDRAWAL ACTIVE</div>` : ''}
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
                ${_getCharacterActions(ap)}
                ${_getBibleActionsHtml()}
            </div>

            <div class="ap-win-hint">
                ${typeof _getWinProgress === 'function' ? _getWinProgress() : ''}
            </div>

            <div class="ap-footer">
                ${(SIM.swapsToday || 0) < 2 ? `<button class="ap-swap-btn" id="btn-swap-card">[ SWAP CARD \u2022 ${2 - (SIM.swapsToday || 0)} left ]</button>` : ''}
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

        const swapBtn = panel.querySelector('#btn-swap-card');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => {
                hideActionPanel();
                showAdjustStrategy();
            });
        }

        // Wire up MORE ACTIONS toggle
        const bibleToggle = panel.querySelector('#bible-actions-toggle');
        if (bibleToggle) {
            bibleToggle.addEventListener('click', () => {
                const list = panel.querySelector('#bible-actions-list');
                if (list) {
                    const hidden = list.style.display === 'none';
                    list.style.display = hidden ? '' : 'none';
                    bibleToggle.textContent = (hidden ? '\u25BC' : '\u25B6') + ' MORE ACTIONS';
                }
            });
        }
    }

    // Append to narrative-area (bottom of narrative column) instead of body
    const narrativeArea = document.getElementById('narrative-area');
    if (narrativeArea) {
        narrativeArea.appendChild(panel);
    } else {
        document.body.appendChild(panel);
    }
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
        title: '',
        text: '',
    },
    {
        anchor: 'situation-panel',
        position: 'right',
        title: '',
        text: '',
    },
    {
        anchor: 'action-panel',
        position: 'left',
        title: '',
        text: '',
    },
    {
        anchor: 'action-panel',
        position: 'left',
        offsetY: 200,
        title: '',
        text: '',
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

function _getCharacterActions(ap) {
    const charId = SIM.character?.id;
    if (!charId) return '';

    if (charId === 'hegseth') {
        return `<div class="ap-category">
            <div class="ap-cat-header" style="color:#dd4444">SECDEF EXCLUSIVE</div>
            <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="deploy-marines">DEPLOY MARINES</button>
            <button class="ap-btn ${ap <= 0 || SIM.budget < 20 ? 'disabled' : ''}" data-action="combat-air-patrol">COMBAT AIR PATROL <span class="ap-cost">$20M</span></button>
        </div>`;
    }
    if (charId === 'fuentes') {
        let withdrawalBtn = '';
        if (SIM.withdrawalProgress >= 5 && !SIM.withdrawalLocked) {
            withdrawalBtn = `<button class="ap-btn special ${ap < 2 ? 'disabled' : ''}" data-action="announce-withdrawal">ANNOUNCE WITHDRAWAL <span class="ap-cost">2AP</span></button>`;
        }
        const wpBar = SIM.withdrawalProgress > 0 ? `<div style="font-size:9px;color:#ff6644;margin-top:2px">Withdrawal: ${SIM.withdrawalProgress}/5</div>` : '';
        return `<div class="ap-category">
            <div class="ap-cat-header" style="color:#ff6644">AMERICA FIRST</div>
            <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="rally-base">RALLY THE BASE</button>
            <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="media-blitz">MEDIA BLITZ</button>
            ${withdrawalBtn}
            ${wpBar}
        </div>`;
    }
    if (charId === 'kushner' && SIM.character.contacts) {
        const contactBtns = SIM.character.contacts
            .filter(c => c.trust >= 10)
            .map(c => `<button class="ap-btn ${ap <= 0 || SIM.budget < 10 ? 'disabled' : ''}" data-action="call-contact-${c.id}">CALL ${c.name.split('(')[0].trim()} <span class="ap-cost">$10M</span></button>`)
            .join('');
        const dealInfo = `<div style="font-size:9px;color:#aa44dd;margin-top:2px">Deal Value: $${Math.round(SIM.dealValue || 0)}M</div>`;
        if (contactBtns) {
            return `<div class="ap-category">
                <div class="ap-cat-header" style="color:#aa44dd">CONTACTS</div>
                ${contactBtns}
                ${dealInfo}
            </div>`;
        }
    }
    if (charId === 'trump') {
        const canClaim = SIM.day - SIM.lastPublicWinDay <= 1;
        return `<div class="ap-category">
            <div class="ap-cat-header" style="color:#ddaa44">VICTORY NARRATIVE</div>
            <div style="font-size:9px;color:#ddaa44;margin-bottom:4px">Victories claimed: ${SIM.victoryNarrative || 0}/3 ${canClaim ? '| <span style="color:#44dd88">WIN AVAILABLE!</span>' : ''}</div>
        </div>`;
    }
    if (charId === 'asmongold') {
        const correctPreds = (SIM.predictions || []).filter(p => p.resolved && p.correct).length;
        const totalPreds = (SIM.predictions || []).filter(p => p.resolved).length;
        const pendingPreds = (SIM.predictions || []).filter(p => !p.resolved).length;
        return `<div class="ap-category">
            <div class="ap-cat-header" style="color:#4488dd">STREAM STATS</div>
            <div style="font-size:9px;color:#4488dd;margin-bottom:2px">Audience: ${Math.round(SIM.audience || 50)} | Correct: ${correctPreds}/${totalPreds} | Pending: ${pendingPreds}</div>
        </div>`;
    }
    return '';
}

// Track recently used scene indices per action to reduce repetition
const _sceneHistory = {};
const _reactionHistory = {};

function _maybeReactiveNews() {
    if (Math.random() >= 0.4) return;
    const reactions = DATA.reactions;
    if (!reactions) return;

    // Build candidate pool based on current game state
    const pool = [];
    const s = SIM;

    if (s.tension > 60 && reactions.highTension) pool.push(...reactions.highTension);
    if (s.tension < 40 && reactions.lowTension) pool.push(...reactions.lowTension);
    if (s.diplomaticCapital > 50 && s.tension < 50 && reactions.diplomaticProgress) pool.push(...reactions.diplomaticProgress);
    if (s.warPath >= 3 && reactions.militaryEscalation) pool.push(...reactions.militaryEscalation);
    if (s.proxyThreat > 50 && reactions.proxyThreats) pool.push(...reactions.proxyThreats);
    if (s.oilFlow < 30 && reactions.oilCrisis) pool.push(...reactions.oilCrisis);
    if (s.budget < 200 && reactions.budgetPressure) pool.push(...reactions.budgetPressure);
    if (s.domesticApproval < 35 && reactions.domesticUnrest) pool.push(...reactions.domesticUnrest);
    if (s.iranFactionBalance < 35 && reactions.iranHardliner) pool.push(...reactions.iranHardliner);
    if (s.iranFactionBalance > 65 && reactions.iranModerate) pool.push(...reactions.iranModerate);
    if (s.internationalStanding < 25 && reactions.internationalIsolation) pool.push(...reactions.internationalIsolation);
    if (s.internationalStanding > 70 && reactions.strongCoalition) pool.push(...reactions.strongCoalition);
    if (s.fogOfWar > 65 && reactions.fogHigh) pool.push(...reactions.fogHigh);
    if (s.day < 5 && reactions.earlyGame) pool.push(...reactions.earlyGame);
    if (s.day > 25 && reactions.lateGame) pool.push(...reactions.lateGame);

    // Fallback to general pool
    if (pool.length === 0 && reactions.general) pool.push(...reactions.general);
    if (pool.length === 0) return;

    // Pick one, avoiding last used
    let idx;
    const poolKey = pool.length;
    if (pool.length === 1) {
        idx = 0;
    } else {
        const last = _reactionHistory[poolKey];
        do { idx = Math.floor(Math.random() * pool.length); } while (idx === last && pool.length > 1);
    }
    _reactionHistory[poolKey] = idx;

    addNarrative('headline', pool[idx], { level: 'normal' });
}

function _narrateAction(actionId, snap, scaledKeys) {
    const scenes = DATA['action-scenes'];
    if (!scenes) return;

    // Resolve the scene key
    let sceneKey = actionId;
    let pool = null;

    if (actionId.startsWith('bible_')) {
        const bibleId = actionId.replace('bible_', '');
        pool = scenes.bible && scenes.bible[bibleId];
        sceneKey = 'bible_' + bibleId;
    } else if (actionId.startsWith('call-contact-')) {
        pool = scenes.contacts && scenes.contacts.generic;
        sceneKey = 'call-contact';
    } else if (actionId === 'change-roe') {
        // Pick sub-variant based on current ROE
        const roeKey = 'change-roe-' + (SIM.roe || 'defensive');
        pool = scenes.actions && (scenes.actions[roeKey] || scenes.actions['change-roe']);
        sceneKey = roeKey;
    } else {
        pool = scenes.actions && scenes.actions[actionId];
    }

    if (!pool || pool.length === 0) return;

    // Check for character-specific variant
    let charVariantText = null;
    if (SIM.character && scenes.characterVariants) {
        const cv = scenes.characterVariants[SIM.character.id];
        if (cv && cv[actionId]) {
            charVariantText = cv[actionId];
        }
    }

    // Pick a variant, avoiding the last-used index
    let idx;
    if (pool.length === 1) {
        idx = 0;
    } else {
        const last = _sceneHistory[sceneKey];
        do { idx = Math.floor(Math.random() * pool.length); } while (idx === last && pool.length > 1);
    }
    _sceneHistory[sceneKey] = idx;

    // Write the scene with player character portrait — use character variant 50% of the time if available
    const _actPortrait = SIM.character ? SIM.character.id : null;
    const sceneText = (charVariantText && Math.random() < 0.5) ? charVariantText : pool[idx];
    addNarrative('scene', sceneText, { portrait: _actPortrait });

    // Write stat changes beneath the scene
    for (const k of scaledKeys) {
        const delta = Math.round((SIM[k] - snap[k]) * 10) / 10;
        if (delta !== 0) {
            addNarrative('stat', '', { metric: k, delta: delta });
        }
    }
    // Budget and warPath (not in scaledKeys, not scaled by 1.5x)
    if (snap._budget !== undefined) {
        const bDelta = Math.round(SIM.budget - snap._budget);
        if (bDelta !== 0) addNarrative('stat', '', { metric: 'budget', delta: bDelta });
    }
    if (snap._warPath !== undefined) {
        const wDelta = SIM.warPath - snap._warPath;
        if (wDelta !== 0) addNarrative('stat', '', { metric: 'warPath', delta: wDelta });
    }
}

function _executeAction(actionId, rerenderFn) {
    if (SIM.actionPoints <= 0) return;

    // Trump: AP actions cost Political Capital (3 per action × 3 AP ≈ 9/day)
    if (SIM.character?.id === 'trump' && actionId !== 'special') {
        SIM.uniqueResource = Math.max(0, SIM.uniqueResource - 3);
    }

    let toastMsg = '';
    let toastLevel = 'normal';

    // Snapshot stats before action — deltas will be scaled by 1.5x after
    const _scaledKeys = ['tension', 'oilFlow', 'oilPrice', 'domesticApproval', 'internationalStanding',
        'iranAggression', 'iranEconomy', 'fogOfWar', 'diplomaticCapital', 'conflictRisk',
        'proxyThreat', 'chinaRelations', 'polarization', 'assassinationRisk'];
    const _snap = {};
    _scaledKeys.forEach(k => _snap[k] = SIM[k]);
    _snap._budget = SIM.budget;
    _snap._warPath = SIM.warPath;

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
            if (SIM.budget < 10 || SIM.warPath < 1) return;
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
            if (SIM.budget < 30 || SIM.warPath < 2) return;
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
            if (SIM.character?.id === 'hegseth') _checkBattleReport();
            break;

        case 'spec-ops-raid':
            if (SIM.budget < 25 || SIM.warPath < 2) return;
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
            if (SIM.character?.id === 'hegseth') _checkBattleReport();
            break;

        case 'air-strikes':
            if (SIM.budget < 50 || SIM.warPath < 3) return;
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
            if (SIM.character?.id === 'hegseth') _checkBattleReport();
            break;

        case 'sead-mission':
            if (SIM.budget < 40 || SIM.warPath < 3) return;
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
            if (SIM.budget < 80 || SIM.warPath < 4) return;
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
            if (SIM.budget < 60 || SIM.warPath < 4) return;
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
            if (SIM.budget < 100 || SIM.warPath < 5) return;
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
            if (SIM.warPath >= 5) return;
            SIM.warPath = Math.min(5, SIM.warPath + 1);
            const newEsc = ESCALATION_LADDER[SIM.warPath];
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
            const deEsc = ESCALATION_LADDER[SIM.warPath];
            SIM.tension = Math.max(0, SIM.tension - 5);
            SIM.internationalStanding = Math.min(100, SIM.internationalStanding + 5);
            SIM.domesticApproval = Math.max(0, SIM.domesticApproval - 3);
            SIM.iranAggression = Math.min(100, SIM.iranAggression + 4);
            showFloatingNumber('warPath', -1);
            showFloatingNumber('tension', -5);
            showFloatingNumber('internationalStanding', 5);
            showFloatingNumber('domesticApproval', -3);
            showFloatingNumber('iranAggression', 4);
            // AIPAC penalty for dovish action
            if (SIM.aipacPressure > 70) {
                SIM.domesticApproval = Math.max(0, SIM.domesticApproval - 3);
                showFloatingNumber('domesticApproval', -3);
                if (typeof addNarrative === 'function') addNarrative('scene', 'Pro-Israel groups blast the de-escalation as "emboldening Iran."', { level: 'warning' });
            }
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

        case 'special': {
            const specialSuccess = executeSpecialAction();
            if (!specialSuccess) return; // Don't spend AP if special action failed/cancelled
            break;
        }

        // === Hegseth exclusive actions ===
        case 'deploy-marines':
            SIM.tension = Math.min(100, SIM.tension + 8);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 6);
            SIM.oilFlow = Math.min(100, SIM.oilFlow + 4);
            SIM.uniqueResource = Math.max(0, SIM.uniqueResource - 8);
            // Hegseth: deploy marines also escalates if warPath < 3
            if (SIM.character?.id === 'hegseth' && SIM.warPath < 3) {
                SIM.warPath = Math.min(5, SIM.warPath + 1);
                showFloatingNumber('warPath', 1);
            }
            toastMsg = 'Marines deployed — securing key chokepoints';
            toastLevel = 'normal';
            addHeadline('US Marines deployed to secure strait positions.', 'warning');
            // Hegseth: check for battle report
            if (SIM.character?.id === 'hegseth') _checkBattleReport();
            break;

        case 'combat-air-patrol':
            if (SIM.budget < 20) return;
            SIM.budget -= 20;
            SIM.tension = Math.min(100, SIM.tension + 5);
            SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 10);
            SIM.iranAggression = Math.max(0, SIM.iranAggression - 4);
            toastMsg = 'F/A-18s on station — full air dominance';
            toastLevel = 'good';
            addHeadline('Combat air patrols established over the strait.', 'normal');
            // Hegseth: check for battle report
            if (SIM.character?.id === 'hegseth') _checkBattleReport();
            break;

        // === Fuentes exclusive actions ===
        case 'rally-base':
            SIM.uniqueResource = Math.min(100, SIM.uniqueResource + 8);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 3);
            SIM.polarization = Math.min(100, SIM.polarization + 4);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 2);
            // Fuentes: rally removes a navy ship if warPath is 0
            if (SIM.warPath === 0 && SIM.navyShips.length > 0) {
                SIM.navyShips.pop();
                showFloatingNumber('navyShips', -1);
                toastMsg = '"America First! Bring them home!" — one ship withdrawn';
            } else {
                toastMsg = '"America First!" — base enthusiasm surges';
            }
            toastLevel = 'good';
            addHeadline('Populist rally energizes the base.', 'normal');
            break;

        case 'announce-withdrawal':
            if (SIM.actionPoints < 2) return;
            SIM.actionPoints = Math.max(0, SIM.actionPoints - 1); // extra AP cost (1 more subtracted below)
            SIM.withdrawalLocked = true;
            SIM.warPath = 0;
            SIM.uniqueResource = Math.min(100, SIM.uniqueResource + 15);
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 10);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 10);
            showFloatingNumber('uniqueResource', 15);
            showFloatingNumber('domesticApproval', 10);
            showFloatingNumber('internationalStanding', -10);
            toastMsg = 'FULL WITHDRAWAL ANNOUNCED — warPath locked at 0';
            toastLevel = 'good';
            addHeadline('BREAKING: Full military withdrawal from Persian Gulf announced. "America First — America Always."', 'good');
            if (typeof addNarrative === 'function') {
                addNarrative('alert', 'The withdrawal is official. Military escalation is now impossible. The base is ecstatic.', { level: 'good' });
            }
            break;

        case 'media-blitz':
            SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 5);
            SIM.uniqueResource = Math.min(100, SIM.uniqueResource + 3);
            SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 3);
            toastMsg = 'Media blitz — controlling the narrative';
            toastLevel = 'normal';
            addHeadline('Media blitz pushes America First messaging.', 'normal');
            break;

        default:
            // Bible actions (content bible expansion)
            if (actionId.startsWith('bible_')) {
                const bibleId = actionId.replace('bible_', '');
                const bibleAction = BIBLE_ACTIONS.find(a => a.id === bibleId);
                if (!bibleAction) return;
                if (SIM.actionPoints < bibleAction.ap) return;
                if (bibleAction.cost && SIM.budget < bibleAction.cost) return;
                try { if (!bibleAction.condition()) return; } catch(e) { return; }
                if (bibleAction.cost) {
                    SIM.budget -= bibleAction.cost;
                    showFloatingNumber('budget', -bibleAction.cost);
                }
                // Bible actions spend their own AP amount (may be >1)
                // We subtract (ap - 1) here because the common code below subtracts 1
                if (bibleAction.ap > 1) {
                    SIM.actionPoints = Math.max(0, SIM.actionPoints - (bibleAction.ap - 1));
                }
                bibleAction.execute();
                toastMsg = ''; // execute() handles its own toasts
                break;
            }
            // Kushner contact calls
            if (actionId.startsWith('call-contact-')) {
                const contactId = actionId.replace('call-contact-', '');
                const contact = SIM.character?.contacts?.find(c => c.id === contactId);
                if (!contact || SIM.budget < 10) return;
                SIM.budget -= 10;
                contact.trust = Math.min(100, contact.trust + 8);
                SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 4);
                SIM.uniqueResource = Math.min(100, SIM.uniqueResource + 5);
                // 30% chance of deal opportunity
                if (Math.random() < 0.3) {
                    const dealGain = Math.floor(Math.random() * 41) + 10; // 10-50
                    SIM.dealValue = (SIM.dealValue || 0) + dealGain;
                    toastMsg = `Called ${contact.name} — trust +8, deal opportunity +$${dealGain}M!`;
                } else {
                    toastMsg = `Called ${contact.name} — trust +8, now ${contact.trust}`;
                }
                toastLevel = 'good';
                addHeadline(`Back-channel call to ${contact.name.split('(')[0].trim()}.`, 'normal');
                // Add mini-choice buttons in narrative feed
                if (typeof addNarrative === 'function') {
                    addNarrative('scene', `Call with ${contact.name.split('(')[0].trim()} connected. What do you focus on?`, { portrait: 'kushner' });
                    _showContactMiniChoice(contact);
                }
                break;
            }
            return;
    }

    // Scale direct action stat deltas by 1.5x (compensates for 3 AP instead of 5)
    const ACTION_MULT = 1.5;
    _scaledKeys.forEach(k => {
        const delta = SIM[k] - _snap[k];
        if (delta !== 0) {
            SIM[k] = _snap[k] + delta * ACTION_MULT;
            if (k === 'oilPrice') SIM[k] = Math.max(40, SIM[k]);
            else SIM[k] = Math.max(0, Math.min(100, SIM[k]));
        }
    });

    // --- Narrative scene for this action ---
    if (typeof addNarrative === 'function') {
        _narrateAction(actionId, _snap, _scaledKeys);
        _maybeReactiveNews();
    }

    // Spend AP
    SIM.actionPoints = Math.max(0, SIM.actionPoints - 1);

    // Sound feedback
    if (typeof SFX !== 'undefined') {
        if (toastLevel === 'good') SFX.chime();
        else SFX.click();
    }

    if (toastMsg) showToast(toastMsg, toastLevel);
    _flushFloatingNumbers();
    updateGauges();

    // If AP exhausted, re-render panel (all buttons disabled, END DAY remains)
    if (SIM.actionPoints <= 0) {
        rerenderFn();
        showToast('Action points spent — END DAY when ready', 'warning');
        return;
    }

    // Random interrupt check (50% chance — compensates for fewer AP per day)
    if (Math.random() < 0.5) {
        setTimeout(() => {
            showInterrupt(rerenderFn);
        }, 400);
    } else {
        rerenderFn();
    }
}

// ======================== HEGSETH: BATTLE REPORT ========================

function _checkBattleReport() {
    if (Math.random() >= 0.4) return; // 40% chance
    const iranAggrDropped = SIM.iranAggression < (SIM._prevIranAggression || SIM.iranAggression);
    const warPathSurge = SIM.warPath - (SIM._dayStartWarPath || 0) >= 2;
    const highTension = SIM.tension > 80;

    if (iranAggrDropped && !highTension) {
        // Positive battle report
        SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 5);
        SIM.uniqueResource = Math.min(100, SIM.uniqueResource + 5);
        showFloatingNumber('domesticApproval', 5);
        showFloatingNumber('uniqueResource', 5);
        addHeadline('BATTLE REPORT: Operation successful — enemy capabilities degraded', 'good');
        showToast('Positive battle report! Approval +5, Authority +5', 'good');
    } else if (highTension || warPathSurge) {
        // Negative battle report
        SIM.domesticApproval = Math.max(0, SIM.domesticApproval - 5);
        SIM.uniqueResource = Math.max(0, SIM.uniqueResource - 3);
        showFloatingNumber('domesticApproval', -5);
        showFloatingNumber('uniqueResource', -3);
        addHeadline('BATTLE REPORT: Civilian casualties reported — international backlash', 'warning');
        showToast('Negative battle report! Approval -5, Authority -3', 'bad');
    }
}

// ======================== KUSHNER: CONTACT MINI-CHOICE ========================

function _showContactMiniChoice(contact) {
    if (typeof addNarrative !== 'function') return;

    // Create inline choice buttons in the narrative feed
    const choiceDiv = document.createElement('div');
    choiceDiv.className = 'narrative-mini-choice';
    choiceDiv.style.cssText = 'display:flex;gap:8px;padding:6px 12px;';

    const btnSecurity = document.createElement('button');
    btnSecurity.textContent = 'Discuss security';
    btnSecurity.className = 'ap-btn';
    btnSecurity.style.cssText = 'font-size:10px;padding:4px 8px;flex:1;';

    const btnBusiness = document.createElement('button');
    btnBusiness.textContent = 'Discuss business';
    btnBusiness.className = 'ap-btn';
    btnBusiness.style.cssText = 'font-size:10px;padding:4px 8px;flex:1;';

    btnSecurity.addEventListener('click', () => {
        SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 4);
        showFloatingNumber('diplomaticCapital', 4);
        showToast('Security discussion: diplomaticCapital +4', 'good');
        addNarrative('scene', `"Let us coordinate on maritime security..." — productive security dialogue with ${contact.name.split('(')[0].trim()}.`, { portrait: 'kushner' });
        choiceDiv.remove();
    });

    btnBusiness.addEventListener('click', () => {
        SIM.diplomaticCapital = Math.min(100, SIM.diplomaticCapital + 2);
        const dealGain = Math.floor(Math.random() * 11) + 15; // 15-25
        SIM.dealValue = (SIM.dealValue || 0) + dealGain;
        SIM.uniqueResource = Math.min(100, SIM.uniqueResource + 3); // exposure +3
        showFloatingNumber('diplomaticCapital', 2);
        showFloatingNumber('dealValue', dealGain);
        showToast(`Business deal: dealValue +$${dealGain}M, exposure +3`, 'good');
        addNarrative('scene', `"There are investment opportunities here..." — business ties deepened. Deal value +$${dealGain}M.`, { portrait: 'kushner' });
        choiceDiv.remove();
    });

    choiceDiv.appendChild(btnSecurity);
    choiceDiv.appendChild(btnBusiness);

    // Append to the narrative feed
    const feed = document.getElementById('narrative-feed');
    if (feed) feed.appendChild(choiceDiv);
}

// ======================== ASMONGOLD: PREDICTION PICKER ========================

function showPredictionPicker() {
    // Build prediction options based on current game state
    const allOptions = [
        {
            topic: 'iran_escalate',
            label: 'Iran will escalate within 3 days',
            condition: () => SIM.iranAggression > 50,
            resolveDays: 3,
        },
        {
            topic: 'oil_below_100',
            label: 'Oil drops below $100',
            condition: () => SIM.oilFlow > (SIM._prevOilFlow || SIM.oilFlow),
            resolveDays: 5,
        },
        {
            topic: 'seizure_week',
            label: 'Seizure this week',
            condition: () => SIM.iranStrategy === 'probing' || SIM.iranStrategy === 'escalatory' || SIM.iranStrategy === 'confrontational',
            resolveDays: 5,
        },
        {
            topic: 'diplomatic_breakthrough',
            label: 'Diplomatic breakthrough',
            condition: () => SIM.diplomaticCapital > 40 && SIM.tension < (SIM._prevTensionBracket || SIM.tension),
            resolveDays: 5,
        },
        {
            topic: 'iran_backs_down',
            label: 'Iran backs down',
            condition: () => SIM.iranAggression > 40,
            resolveDays: 5,
        },
        {
            topic: 'oil_crisis_worsens',
            label: 'Oil crisis worsens',
            condition: () => SIM.oilFlow < 50,
            resolveDays: 5,
        },
        {
            topic: 'military_escalation',
            label: 'Military escalation incoming',
            condition: () => SIM.tension > 60,
            resolveDays: 3,
        },
        {
            topic: 'approval_surge',
            label: 'Approval rating surge',
            condition: () => SIM.domesticApproval < 50,
            resolveDays: 5,
        },
    ];

    // Filter to applicable options and pick 3-4
    const applicable = allOptions.filter(o => {
        try { return o.condition(); } catch(e) { return false; }
    });
    // Also filter out topics with pending predictions
    const pendingTopics = (SIM.predictions || []).filter(p => !p.resolved).map(p => p.topic);
    const available = applicable.filter(o => !pendingTopics.includes(o.topic));

    if (available.length === 0) {
        showToast('No predictions available right now', 'warning');
        return;
    }

    // Shuffle and pick 3-4
    const shuffled = available.sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, Math.min(4, shuffled.length));

    openTerminal(`
        <div class="term-header">MAKE PREDICTION</div>
        <div class="term-title">What do you think happens next, chat?</div>
        <div class="term-line">Pick a prediction. If correct: Audience +15, Credibility +10. If wrong: Audience -10, Credibility -8.</div>
        <div class="term-line dim">Pending predictions: ${(SIM.predictions || []).filter(p => !p.resolved).length}</div>

        <div class="term-section">
            ${options.map((opt, i) => `
                <div class="adjust-card" data-pred="${i}" style="cursor:pointer;margin:6px 0;padding:8px 12px;">
                    <div class="adjust-card-name" style="color:#4488dd">${opt.label}</div>
                    <div class="adjust-card-desc" style="font-size:9px;color:#888">Resolves in ${opt.resolveDays} days</div>
                </div>
            `).join('')}
        </div>

        <div class="term-btn-row">
            <button class="term-btn" id="btn-cancel-pred">[ CANCEL ]</button>
        </div>
    `);

    fadeInButtons(TERMINAL, 200);

    // Wire up prediction choices
    TERMINAL.querySelectorAll('[data-pred]').forEach(el => {
        el.addEventListener('click', () => {
            const idx = parseInt(el.dataset.pred);
            const opt = options[idx];

            // Create prediction
            if (!SIM.predictions) SIM.predictions = [];
            SIM.predictions.push({
                topic: opt.topic,
                label: opt.label,
                predictedDay: SIM.day,
                resolveDay: SIM.day + opt.resolveDays,
                resolved: false,
                correct: false,
                _startWarPath: SIM.warPath,
                _startSeizureCount: SIM.seizureCount,
                _startTension: SIM.tension,
                _startIranAggression: SIM.iranAggression,
                _startOilFlow: SIM.oilFlow,
                _startApproval: SIM.domesticApproval,
            });

            // Set cooldown on special action and spend AP
            if (SIM.character && SIM.character.specialAction) {
                SIM.character.specialAction.cooldown = SIM.character.specialAction.cooldownMax || 5;
            }
            SIM.actionPoints = Math.max(0, SIM.actionPoints - 1);

            addHeadline(`PREDICTION: "${opt.label}" — resolves in ${opt.resolveDays} days`, 'normal');
            showToast(`Prediction made: "${opt.label}"`, 'good');

            if (typeof addNarrative === 'function') {
                addNarrative('dialogue', `"Chat, I'm calling it now: ${opt.label}. Mark it. Clip it. We'll see in ${opt.resolveDays} days."`, { speaker: 'Asmongold', portrait: 'asmongold' });
            }

            closeTerminal();
            if (typeof showActionPanel === 'function') showActionPanel();
        });
    });

    // Cancel
    const cancelBtn = document.getElementById('btn-cancel-pred');
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
        closeTerminal();
        if (typeof showActionPanel === 'function') showActionPanel();
    });
}

function _endDay() {
    hideActionPanel();
    if (typeof SFX !== 'undefined') SFX.transition();
    _writeDayEndScene();
    advanceDay();
}

const _dayEndHistory = {};

function _writeDayEndScene() {
    if (typeof addNarrative !== 'function') return;
    const endings = DATA['day-endings'];
    if (!endings) return;

    const charId = SIM.character ? SIM.character.id : null;
    const reflections = endings.reflections && charId ? endings.reflections[charId] : null;
    const cliffhangers = endings.cliffhangers;
    if (!reflections && !cliffhangers) return;

    // --- Pick reflection based on game state ---
    let reflectionKey = 'default';
    if (SIM.tension > 65) reflectionKey = 'highTension';
    else if (SIM.tension < 35) reflectionKey = 'lowTension';
    else if (SIM.warPath >= 3 || SIM.warPath > (SIM._prevWarPath || 0)) reflectionKey = 'militaryAction';
    else if (SIM.diplomaticCapital > 50 && SIM.tension < 50) reflectionKey = 'diplomaticDay';
    else if (SIM.budget < 200) reflectionKey = 'budgetTight';
    else if (SIM.domesticApproval < 35) reflectionKey = 'approvalDrop';

    let reflectionText = '';
    if (reflections) {
        const pool = reflections[reflectionKey] || reflections['default'] || [];
        if (pool.length > 0) {
            reflectionText = _pickFromPool(pool, 'refl_' + charId + '_' + reflectionKey);
        }
    }

    // --- Pick cliffhanger based on actual simulation state ---
    let cliffKey = 'default';
    if (SIM.scheduledEvents && SIM.scheduledEvents.length > 0) {
        const upcoming = SIM.scheduledEvents.find(se => se.triggerDay <= SIM.day + 2);
        if (upcoming) cliffKey = 'scheduledEvent';
    }
    if (cliffKey === 'default') {
        // Check what changed today or what's brewing
        if (SIM._prevIranFaction !== undefined && SIM.iranFactionBalance < SIM._prevIranFaction - 3) {
            cliffKey = 'iranHardlinerShift';
        } else if (SIM._prevIranFaction !== undefined && SIM.iranFactionBalance > SIM._prevIranFaction + 3) {
            cliffKey = 'iranModerateShift';
        } else if (SIM.tension > 75 && (!SIM._prevTensionBracket || SIM._prevTensionBracket <= 75)) {
            cliffKey = 'tensionCrossedHigh';
        } else if (SIM.tension < 40 && (!SIM._prevTensionBracket || SIM._prevTensionBracket >= 40)) {
            cliffKey = 'tensionCrossedLow';
        } else if (SIM.oilFlow < 30) {
            cliffKey = 'oilCrisis';
        } else if (SIM.warPath >= 3) {
            cliffKey = 'warPathRising';
        } else if (SIM.domesticApproval < 30) {
            cliffKey = 'approvalCrisis';
        } else if (SIM.proxyThreat > 50) {
            cliffKey = 'proxyActivity';
        } else if (SIM.fogOfWar > 70) {
            cliffKey = 'fogHigh';
        } else if (SIM.straitOpenDays > 3 && SIM.oilFlow > 55) {
            cliffKey = 'straitProgress';
        }
    }

    let cliffText = '';
    if (cliffhangers) {
        const pool = cliffhangers[cliffKey] || cliffhangers['default'] || [];
        if (pool.length > 0) {
            cliffText = _pickFromPool(pool, 'cliff_' + cliffKey);
        }
    }

    // Determine character portrait mood variant for day-end
    let _dayEndPortrait = charId || null;
    if (charId && typeof PORTRAIT_REGISTRY !== 'undefined') {
        if (reflectionKey === 'highTension' || reflectionKey === 'approvalDrop' || reflectionKey === 'militaryAction') {
            _dayEndPortrait = charId + '-angry';
        } else if (reflectionKey === 'lowTension' || reflectionKey === 'diplomaticDay') {
            _dayEndPortrait = charId + '-positive';
        }
    }

    // Write to narrative feed
    if (reflectionText) {
        addNarrative('scene', reflectionText, { portrait: _dayEndPortrait });
    }
    if (cliffText) {
        addNarrative('alert', cliffText, { level: 'warning' });
    }

    // Snapshot for tomorrow's cliffhanger comparisons
    SIM._prevIranFaction = SIM.iranFactionBalance;
    SIM._prevTensionBracket = SIM.tension;
}

function _pickFromPool(pool, historyKey) {
    if (pool.length === 1) return pool[0];
    const last = _dayEndHistory[historyKey];
    let idx;
    do { idx = Math.floor(Math.random() * pool.length); } while (idx === last && pool.length > 1);
    _dayEndHistory[historyKey] = idx;
    return pool[idx];
}

function _getWinProgress() {
    if (!SIM.character || !SIM.character.scenario || !SIM.character.scenario.winConditions) {
        // Generic win: strait open days
        const pct = Math.min(100, Math.round((SIM.straitOpenDays / 7) * 100));
        // Daily checklist
        const recentSeizures = SIM.recentSeizureDays ? SIM.recentSeizureDays.filter(d => SIM.day - d <= 3).length : 0;
        const wpl = DATA.intel.winProgressLabels.generic;
        const checks = [
            { label: wpl.checks.oilFlow, ok: SIM.oilFlow > 55 },
            { label: wpl.checks.tension, ok: SIM.tension < 45 },
            { label: wpl.checks.noSeizures, ok: recentSeizures === 0 },
            { label: wpl.checks.noCrisis, ok: SIM.crisisLevel === 0 },
        ];
        const checkHtml = checks.map(c => `<span style="color:${c.ok ? '#44dd88' : '#dd4444'}">${c.ok ? '\u2713' : '\u2717'} ${c.label}</span>`).join(' ');
        return `<div class="win-progress">
            <div class="win-progress-label">${wpl.objective}</div>
            <div class="win-progress-bar"><div class="win-progress-fill" style="width:${pct}%"></div></div>
            <div class="win-progress-text">${SIM.straitOpenDays}/7 days</div>
            <div style="font-size:9px;margin-top:4px;line-height:1.6">${checkHtml}</div>
        </div>`;
    }

    const wc = SIM.character.scenario.winConditions[0];
    const met = wc.check(SIM);
    const sustained = wc._days || 0;
    const pct = met ? Math.min(100, Math.round((sustained / 3) * 100)) : 0;

    // Build a readable condition summary
    const charId = SIM.character.id;
    const wplChar = DATA.intel.winProgressLabels;
    const label = wplChar[charId] || 'Complete your objective';

    // Character-specific checklist
    let checksHtml = '';
    if (charId === 'trump') {
        const canClaim = SIM.day - SIM.lastPublicWinDay <= 1;
        const checks = [
            { label: `Victories: ${SIM.victoryNarrative}/3`, ok: SIM.victoryNarrative >= 3 },
            { label: `Approval: ${Math.round(SIM.domesticApproval)} >= 60`, ok: SIM.domesticApproval >= 60 },
            { label: `Oil flow: ${Math.round(SIM.oilFlow)} >= 55`, ok: SIM.oilFlow >= 55 },
        ];
        checksHtml = `<div style="font-size:9px;margin-top:4px;line-height:1.6">${checks.map(c => `<span style="color:${c.ok ? '#44dd88' : '#dd4444'}">${c.ok ? '\u2713' : '\u2717'} ${c.label}</span>`).join(' ')}</div>`;
    } else if (charId === 'hegseth') {
        const checks = [
            { label: `WarPath: ${SIM.warPath} >= 3`, ok: SIM.warPath >= 3 },
            { label: `Iran aggr: ${Math.round(SIM.iranAggression)} <= 25`, ok: SIM.iranAggression <= 25 },
            { label: `Approval: ${Math.round(SIM.domesticApproval)} >= 55`, ok: SIM.domesticApproval >= 55 },
        ];
        checksHtml = `<div style="font-size:9px;margin-top:4px;line-height:1.6">${checks.map(c => `<span style="color:${c.ok ? '#44dd88' : '#dd4444'}">${c.ok ? '\u2713' : '\u2717'} ${c.label}</span>`).join(' ')}</div>`;
    } else if (charId === 'kushner') {
        const checks = [
            { label: `Deal: $${Math.round(SIM.dealValue || 0)}M >= 300`, ok: (SIM.dealValue || 0) >= 300 },
            { label: `Iran aggr: ${Math.round(SIM.iranAggression)} <= 25`, ok: SIM.iranAggression <= 25 },
            { label: `Exposure: ${Math.round(SIM.uniqueResource)} < 50`, ok: SIM.uniqueResource < 50 },
        ];
        checksHtml = `<div style="font-size:9px;margin-top:4px;line-height:1.6">${checks.map(c => `<span style="color:${c.ok ? '#44dd88' : '#dd4444'}">${c.ok ? '\u2713' : '\u2717'} ${c.label}</span>`).join(' ')}</div>`;
    } else if (charId === 'fuentes') {
        const checks = [
            { label: `WarPath: ${SIM.warPath} = 0`, ok: SIM.warPath === 0 },
            { label: `Ships: ${SIM.navyShips.length} <= 1`, ok: SIM.navyShips.length <= 1 },
            { label: `Budget: $${Math.round(SIM.budget)}M >= 600`, ok: SIM.budget >= 600 },
            { label: `Standing: ${Math.round(SIM.internationalStanding)} >= 35`, ok: SIM.internationalStanding >= 35 },
        ];
        checksHtml = `<div style="font-size:9px;margin-top:4px;line-height:1.6">${checks.map(c => `<span style="color:${c.ok ? '#44dd88' : '#dd4444'}">${c.ok ? '\u2713' : '\u2717'} ${c.label}</span>`).join(' ')}</div>`;
    } else if (charId === 'asmongold') {
        const correctPreds = (SIM.predictions || []).filter(p => p.resolved && p.correct).length;
        const checks = [
            { label: `Audience: ${Math.round(SIM.audience)} >= 90`, ok: SIM.audience >= 90 },
            { label: `Credibility: ${Math.round(SIM.uniqueResource)} >= 65`, ok: SIM.uniqueResource >= 65 },
            { label: `Correct predictions: ${correctPreds} >= 3`, ok: correctPreds >= 3 },
        ];
        checksHtml = `<div style="font-size:9px;margin-top:4px;line-height:1.6">${checks.map(c => `<span style="color:${c.ok ? '#44dd88' : '#dd4444'}">${c.ok ? '\u2713' : '\u2717'} ${c.label}</span>`).join(' ')}</div>`;
    }

    return `<div class="win-progress">
        <div class="win-progress-label">${label}</div>
        <div class="win-progress-bar"><div class="win-progress-fill" style="width:${pct}%;${met ? '' : 'background:#ddaa44;box-shadow:0 0 4px rgba(221,170,68,0.3)'}"></div></div>
        <div class="win-progress-text">${met ? sustained + '/3 days sustained' : 'Conditions not yet met'}</div>
        ${checksHtml}
    </div>`;
}

function showInterrupt(afterCallback) {
    const panel = document.getElementById('action-panel');
    if (!panel) { if (afterCallback) afterCallback(); return; }

    const eligible = INTERRUPTS.filter(i => !i.condition || i.condition());
    if (eligible.length === 0) { if (afterCallback) afterCallback(); return; }
    const interrupt = eligible[Math.floor(Math.random() * eligible.length)];
    if (typeof SFX !== 'undefined') SFX.klaxon();

    // Determine portrait for this interrupt
    const iCharId = interrupt.charId || null;
    let iPortrait = null;
    if (iCharId) {
        iPortrait = iCharId;
    } else {
        const iText = interrupt.text.toLowerCase();
        if (iText.indexOf('iran') !== -1 || iText.indexOf('tehran') !== -1 || iText.indexOf('irgc') !== -1 || iText.indexOf('araghchi') !== -1) {
            iPortrait = 'iran';
        } else {
            iPortrait = 'us';
        }
    }

    // Flash scene panel border red for 500ms
    const _sp = typeof getScenePanel === 'function' ? getScenePanel() : null;
    if (_sp) {
        _sp.classList.add('sp-flash-red');
        setTimeout(function () { _sp.classList.remove('sp-flash-red'); }, 500);
    }

    // Write scene_intro to narrative feed as alert
    if (typeof addNarrative === 'function' && interrupt.scene_intro) {
        addNarrative('alert', interrupt.scene_intro, { level: 'warning', portrait: iPortrait });
    }

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

            // Apply story flags if present
            if (choice.setFlags && SIM.storyFlags) {
                for (const [flag, val] of Object.entries(choice.setFlags)) {
                    SIM.storyFlags[flag] = val;
                }
            }

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

            // Write scene_resolution to narrative feed, then stat changes
            if (typeof addNarrative === 'function') {
                const resolution = choice.scene_resolution || (interrupt.text + ' \u2014 ' + choice.label);
                addNarrative('scene', resolution, { portrait: iPortrait });
                // Stat changes as subtle indicators
                for (const [key, val] of Object.entries(choice.effects)) {
                    if (val !== 0) {
                        addNarrative('stat', '', { metric: key, delta: val });
                    }
                }
            }

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
}


// ======================== FLOATING NUMBERS ========================

let _pendingFloats = {};
function showFloatingNumber(metricKey, value) {
    _pendingFloats[metricKey] = (_pendingFloats[metricKey] || 0) + value;
}
function _flushFloatingNumbers() {
    if (Object.keys(_pendingFloats).length > 0) {
        showEffectSummary(_pendingFloats);
        _pendingFloats = {};
    }
}

function showEffectSummary(effects, targetEl) {
    if (!effects || Object.keys(effects).length === 0) return;

    const badIfUp = ['tension', 'iranAggression', 'conflictRisk', 'fogOfWar', 'polarization',
                     'assassinationRisk', 'warPath', 'proxyThreat', 'exposure', 'oilPrice'];

    const parts = [];
    for (const [key, val] of Object.entries(effects)) {
        if (val === 0) continue;
        const name = formatEffectName(key);
        const isPositive = val > 0;
        const isGood = badIfUp.includes(key) ? !isPositive : isPositive;
        const cls = isGood ? 'eff-good' : 'eff-bad';
        parts.push(`<span class="${cls}">${isPositive ? '+' : ''}${val} ${name}</span>`);
    }
    if (parts.length === 0) return;

    const el = document.createElement('div');
    el.className = 'effect-summary';
    el.innerHTML = parts.join(' &middot; ');

    // If a target container is given, append there; otherwise show as toast
    if (targetEl) {
        targetEl.appendChild(el);
    } else {
        showToast(parts.map(p => p.replace(/<[^>]+>/g, '')).join(' · '), 'info');
    }
}

// ======================== DECISION EVENTS ========================

function showDecisionEvent(event) {
    hideActionPanel();
    if (typeof SFX !== 'undefined') {
        if (event.crisis) SFX.klaxon();
        else SFX.phone();
    }
    let countdown = event.countdown || 0;
    let countdownInterval = null;
    const isCrisis = event.crisis === true;

    // --- Build narrative scene for the feed ---
    const eventScenes = DATA['event-scenes'] || {};
    const customScene = eventScenes.scenes && eventScenes.scenes[event.id];
    const sceneText = _buildEventScene(event, customScene, eventScenes);

    // Determine portrait for the event narrative entry
    const _evtPortrait = _getEventPortrait(event);

    // Write scene to narrative feed
    if (typeof addNarrative === 'function') {
        addNarrative('scene', sceneText, { portrait: _evtPortrait });
    }

    // Show event image in scene panel
    const eventImg = _getEventCategoryImage(event);
    if (typeof showSceneImage === 'function' && eventImg) {
        showSceneImage(eventImg, { caption: event.title });
    }

    // --- Build choice panel (overlays the feed) ---
    function renderEvent() {
        const btnClass = isCrisis ? 'crisis-choice' : 'decision-choice';

        const choicesHtml = event.choices.map((choice, i) => {
            return `
                <button class="${btnClass}" data-idx="${i}">
                    <span class="choice-text">${choice.text}</span>
                </button>
            `;
        }).join('');

        const crisisHeader = isCrisis ? '<div class="crisis-header">\u2588 CRISIS TELEPHONE \u2588</div>' : '';
        const headerStyle = isCrisis ? 'color:#dd4444' : '';
        const titleStyle = isCrisis ? 'color:#dd4444;text-shadow:0 0 10px rgba(221,68,68,0.4)' : '';
        const eventImg = _getEventCategoryImage(event);

        // Urgency line for timed events
        let urgencyHtml = '';
        if (countdown > 0) {
            const urgencyText = (customScene && customScene.urgency)
                ? customScene.urgency
                : (eventScenes.timedUrgency
                    ? eventScenes.timedUrgency[Math.floor(Math.random() * eventScenes.timedUrgency.length)]
                    : 'They need your answer now.');
            urgencyHtml = `<div class="de-urgency">\u23F1 ${urgencyText}</div>`;
        }

        openTerminal(`
            ${crisisHeader}
            ${eventImg ? `<img src="${eventImg}" class="event-category-art" alt="Event" onerror="if(typeof SPRITES!=='undefined'&&SPRITES.eventPlaceholder)this.src=SPRITES.eventPlaceholder;else this.style.display='none'">` : ''}
            ${countdown > 0 ? `<div class="decision-timer">${countdown}s</div>` : ''}
            <div class="term-header" style="${headerStyle}">DAY ${SIM.day} \u2014 ${isCrisis ? 'CRISIS' : 'DECISION REQUIRED'}</div>
            <div class="term-title" style="${titleStyle}">${event.title}</div>
            <div class="de-scene-prose">${sceneText}</div>
            ${_getCharacterFlavorHtml(event, customScene)}
            ${urgencyHtml}
            <div class="term-section">
                <div class="term-section-label" ${isCrisis ? 'style="color:#dd4444"' : ''}>${isCrisis ? 'NO SAFE OPTIONS' : 'WHAT DO YOU DO?'}</div>
                ${choicesHtml}
            </div>
        `);

        if (isCrisis) TERMINAL.classList.add('crisis-terminal');
        else TERMINAL.classList.remove('crisis-terminal');

        TERMINAL.querySelectorAll('.' + btnClass).forEach(btn => {
            btn.addEventListener('click', () => {
                if (countdownInterval) clearInterval(countdownInterval);
                TERMINAL.classList.remove('crisis-terminal');
                resolveDecision(event, parseInt(btn.dataset.idx), customScene);
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
                resolveDecision(event, 0, customScene);
            }
        }, 1000);
    }
}

function _buildEventScene(event, customScene, eventScenes) {
    // Use custom expanded scene if available
    if (customScene && customScene.scene) {
        return customScene.scene;
    }

    // Fallback: prefix the existing description with atmospheric context
    const prefixes = eventScenes.atmospherePrefix || {};
    let pool;
    if (event.crisis) pool = prefixes.crisis;
    else {
        // Detect category from event content
        const text = ((event.title || '') + ' ' + (event.description || '')).toLowerCase();
        if (text.match(/strike|navy|military|missile|bomb|attack|drone|mine|carrier|fleet/)) pool = prefixes.military;
        else if (text.match(/diplomat|talk|negotiate|un |ceasefire|summit|channel|treaty/)) pool = prefixes.diplomatic;
        else if (text.match(/oil|sanction|econom|price|trade|budget|barrel|market/)) pool = prefixes.economic;
        else if (text.match(/intel|spy|cyber|surveil|sigint|humint|leak|source|classified/)) pool = prefixes.intel;
    }
    if (!pool || pool.length === 0) pool = prefixes['default'] || [];

    const prefix = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] + ' ' : '';
    return prefix + (event.description || '');
}

function _getCharacterFlavorHtml(event, customScene) {
    if (!SIM.character || !SIM.character.id) return '';
    const charId = SIM.character.id;
    // Check event-scenes data first, then events data
    let flavor = '';
    if (customScene && customScene.characterFlavor && customScene.characterFlavor[charId]) {
        flavor = customScene.characterFlavor[charId];
    } else {
        const eventsData = DATA.events || {};
        const evtData = eventsData.decisionEvents && eventsData.decisionEvents[event.id];
        if (evtData && evtData.characterFlavor && evtData.characterFlavor[charId]) {
            flavor = evtData.characterFlavor[charId];
        }
    }
    if (!flavor) return '';
    return `<div class="de-character-flavor" style="color:#88aa66;font-style:italic;margin:6px 0;font-size:11px;border-left:2px solid #2a4a3a;padding-left:8px">${flavor}</div>`;
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

function resolveDecision(event, choiceIdx, customScene) {
    const choice = event.choices[choiceIdx];
    const gaugesBefore = calculateGauges();

    // Track hidden alignment
    if (typeof shiftAlignment === 'function') shiftAlignment(choice.effects);

    // Apply effects
    for (const [key, val] of Object.entries(choice.effects)) {
        _applyEffect(key, val);
    }
    showEffectSummary(choice.effects);

    // Execute specialEffect callback if present
    if (choice.specialEffect && typeof choice.specialEffect === 'function') {
        choice.specialEffect();
    }
    // Character-specific effects
    if (choice.characterEffect && SIM.character) {
        const charFx = choice.characterEffect[SIM.character.id];
        if (charFx) {
            for (const [key, val] of Object.entries(charFx)) {
                if (key === 'baseEnthusiasm') SIM.uniqueResource = Math.min(100, SIM.uniqueResource + val);
                else if (SIM[key] !== undefined) SIM[key] += val;
            }
        }
    }

    // Set story flags from choice
    if (choice.setFlags) {
        for (const [flag, val] of Object.entries(choice.setFlags)) {
            SIM.storyFlags[flag] = val;
        }
    }

    // Schedule chain follow-up event
    if (choice.chainEvent && choice.chainDelay) {
        SIM.scheduledEvents.push({
            eventId: choice.chainEvent,
            triggerDay: SIM.day + choice.chainDelay,
            sourceEvent: event.id,
        });
    }

    // Contact trust effects (Kushner)
    if (choice.contactEffect && SIM.character.contacts) {
        const contact = SIM.character.contacts.find(c => c.id === choice.contactEffect.id);
        if (contact) {
            contact.trust = Math.max(0, Math.min(100, contact.trust + choice.contactEffect.trust));
            if (choice.contactEffect.trust > 0) addHeadline(`${contact.name}: trust increased to ${contact.trust}`, 'good');
        }
    }

    // Kushner: K03_riyadh_summit deal value bonus
    if (event.id === 'K03_riyadh_summit' && SIM.character?.id === 'kushner') {
        SIM.dealValue = (SIM.dealValue || 0) + 100;
        addHeadline('Riyadh Summit: Major deal value secured — $100M in agreements', 'good');
        if (typeof showToast === 'function') showToast('Summit bonus: Deal Value +$100M!', 'good');
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

    SIM.decisionHistory.push({
        id: event.id, title: event.title,
        choiceText: choice.text, day: SIM.day,
    });

    // --- Build consequence narrative ---
    let consequenceText = '';
    if (customScene && customScene.consequences && customScene.consequences[choiceIdx]) {
        consequenceText = customScene.consequences[choiceIdx];
    } else if (choice.flavor) {
        consequenceText = choice.flavor;
    } else {
        consequenceText = 'The decision is made. Your staff moves to implement it immediately.';
    }

    // Write consequence to narrative feed
    if (typeof addNarrative === 'function') {
        addNarrative('scene', consequenceText, { portrait: _getEventPortrait(event) });
        // Stat changes as subtle indicators
        for (const [key, val] of Object.entries(choice.effects)) {
            if (val !== 0) {
                addNarrative('stat', '', { metric: key, delta: val });
            }
        }
    }

    // Chain event hint
    const chainHint = choice.chainEvent
        ? `<div class="de-chain-hint">${choice.chainHint || 'This decision will have consequences...'}</div>`
        : '';

    // Show consequence result screen
    openTerminal(`
        <div class="term-header">DECISION MADE</div>
        <div class="de-consequence-prose">${consequenceText}</div>
        ${chainHint}
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
    // Show epilogue image in scene panel (computed below, called after epilogueImg is set)
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

    // Determine epilogue from character
    let epilogueText = '';
    let epilogueImg = '';
    if (SIM.character?.epilogues) {
        const ep = SIM.character.epilogues;
        if (SIM.gameWon && SIM.warPath <= 1 && ep.diplomatic) {
            epilogueText = ep.diplomatic;
            epilogueImg = 'assets/epilogue-peace.png';
        } else if (SIM.gameWon && SIM.warPath >= 4 && ep.military) {
            epilogueText = ep.military;
            epilogueImg = 'assets/epilogue-war.png';
        } else if (SIM.gameWon && SIM.warPath >= 2 && ep.military) {
            epilogueText = ep.military;
            epilogueImg = 'assets/epilogue-military.png';
        } else if (!SIM.gameWon && ep.decline) {
            epilogueText = ep.decline;
            epilogueImg = 'assets/epilogue-managed-decline.png';
        } else if (SIM.gameWon && ep.diplomatic) {
            epilogueText = ep.diplomatic;
            epilogueImg = 'assets/epilogue-diplomatic.png';
        }
    }
    if (!SIM.gameWon && !epilogueText) {
        epilogueImg = 'assets/epilogue-defeat.png';
    }

    // Show epilogue/outcome image in scene panel
    if (typeof showSceneImage === 'function') {
        const sceneArt = epilogueImg || outcomeImg;
        showSceneImage(sceneArt, { caption: SIM.gameWon ? 'MISSION COMPLETE' : 'MISSION FAILED' });
    }

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

        ${epilogueText ? `<div class="term-section">
            <div class="term-section-label">EPILOGUE</div>
            ${epilogueImg ? `<img src="${epilogueImg}" class="gameover-epilogue-art" alt="Epilogue" style="width:100%; max-width:480px; image-rendering:pixelated; margin:8px auto; display:block">` : ''}
            <div class="gameover-epilogue" style="color:#44dd88; font-style:italic; line-height:1.6; padding:8px 0">${epilogueText}</div>
        </div>` : ''}

        <div class="term-section">
            <div class="term-section-label">FINAL STATS</div>
            <div class="stat-row"><span>Character</span><span>${SIM.character ? SIM.character.name : 'None'}</span></div>
            <div class="stat-row"><span>Days Survived</span><span>${SIM.day}</span></div>
            <div class="stat-row"><span>Escalation</span><span style="color:${_getEscalationColor()}">${_getEscalationName()} (${SIM.warPath}/5)</span></div>
            <div class="stat-row"><span>Strait Open</span><span>${SIM.straitOpenDays}/7 days</span></div>
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

    // Reset new character mechanic properties
    SIM.victoryNarrative = 0;
    SIM.lastPublicWinDay = -99;
    SIM.publicWinType = '';
    SIM._prevInterceptCount = 0;
    SIM._prevSeizureCount = 0;
    SIM._prevIranAggression = 45;
    SIM._prevOilPrice = 95;
    SIM._dayStartWarPath = 1;
    SIM.dealValue = 0;
    SIM.withdrawalProgress = 0;
    SIM.withdrawalLocked = false;
    SIM.predictions = [];
    SIM.audience = 50;

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

    if (typeof clearNarrative === 'function') clearNarrative();

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
        if (typeof SFX !== 'undefined') { SFX.init(); SFX.crtBuzz(); }
        document.removeEventListener('click', startMusic);
    }, { once: true });

    // Sync SFX mute with music mute
    muteBtn.addEventListener('click', () => {
        if (typeof SFX !== 'undefined') SFX.mute(audio.paused);
    });
}

// ======================== NEWS TICKERS ========================


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
    if (!SIM.character) return DATA.intel.briefingTitles['default'];
    return DATA.intel.briefingTitles[SIM.character.id] || DATA.intel.briefingTitles['default'];
}

function _getMorningBrief() {
    return getAdvisorReaction('morningBrief') || getAdvisorReaction('weekStart');
}

function _getEscalationColor() {
    const level = SIM.warPath || 0;
    const colors = ['#44dd88', '#88aa44', '#ddaa44', '#dd6644', '#dd4444', '#ff0000'];
    return colors[Math.min(level, 5)];
}

function _getEscalationName() {
    const level = SIM.warPath || 0;
    const names = ['DIPLOMATIC', 'NAVAL STANDOFF', 'LIMITED STRIKES', 'AIR CAMPAIGN', 'GROUND WAR', 'TOTAL WAR'];
    return names[Math.min(level, 5)];
}

function formatEffectName(key) {
    return DATA.intel.effectNames[key] || key.replace(/([A-Z])/g,' $1').trim();
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

function _getEventPortrait(event) {
    if (!event) return null;
    const id = (event.id || '').toLowerCase();
    // Character-specific events — show that character's portrait
    if (id.startsWith('t0') || id.startsWith('trump')) return SIM.character ? SIM.character.portraitImage : 'assets/trump.png';
    if (id.startsWith('h0') || id.startsWith('hegseth')) return 'assets/pete.png';
    if (id.startsWith('k0') || id.startsWith('kushner')) return 'assets/kushner.png';
    if (id.startsWith('a0') || id.startsWith('asmongold')) return 'assets/asmongold.png';
    if (id.startsWith('f0') || id.startsWith('fuentes')) return 'assets/nick.png';
    // Iranian NPC events
    if (id.indexOf('mojtaba') !== -1) return 'assets/iran-mojtaba.png';
    if (id.indexOf('araghchi') !== -1 || id.indexOf('zarif') !== -1) return 'assets/iran-araghchi.png';
    if (id.indexOf('tangsiri') !== -1) return 'assets/iran-tangsiri.png';
    if (id.indexOf('iran') !== -1 || id.indexOf('tehran') !== -1) return 'assets/iran-flag.png';
    // Domestic / US government events
    if (id.indexOf('congress') !== -1 || id.indexOf('domestic') !== -1 || id.indexOf('hostage') !== -1) return 'assets/us-flag.png';
    return null;
}

function _getEventCategoryImage(event) {
    if (!event) return '';
    // Per-event image override (for story events with unique art)
    if (event.image) return event.image;
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

// ======================== HYDRATE UI FROM DATA ========================

function hydrateUI() {
    const int = DATA.interrupts;
    const intel = DATA.intel;

    // Interrupts
    int.interrupts.forEach((t, i) => {
        if (!INTERRUPTS[i]) return;
        INTERRUPTS[i].text = t.text;
        if (t.scene_intro) INTERRUPTS[i].scene_intro = t.scene_intro;
        if (t.charId) INTERRUPTS[i].charId = t.charId;
        if (t.choices) {
            INTERRUPTS[i].choices.forEach((c, j) => {
                if (t.choices[j]) {
                    c.label = t.choices[j].label;
                    if (t.choices[j].scene_resolution) c.scene_resolution = t.choices[j].scene_resolution;
                }
            });
        }
    });

    // Intel snippets
    intel.intelSnippets.forEach((t, i) => {
        if (i < _intelSnippets.length) _intelSnippets[i] = t;
    });

    // Action tips
    Object.keys(int.actionTips).forEach(k => {
        if (ACTION_TIPS[k]) {
            ACTION_TIPS[k].desc = int.actionTips[k].desc;
            ACTION_TIPS[k].effect = int.actionTips[k].effect;
        }
    });

    // Bible actions
    int.bibleActions.forEach((t, i) => {
        if (!BIBLE_ACTIONS[i]) return;
        BIBLE_ACTIONS[i].name = t.name;
        BIBLE_ACTIONS[i].headline = t.headline;
        BIBLE_ACTIONS[i].toast = t.toast;
    });

    // Guide steps
    int.guideSteps.forEach((t, i) => {
        if (!_GUIDE_STEPS[i]) return;
        _GUIDE_STEPS[i].title = t.title;
        _GUIDE_STEPS[i].text = t.text;
    });
}
