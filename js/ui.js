/**
 * UI Controller — policy panel, HUD updates, event log, game over screen
 */

function initUI() {
    renderPolicyCards();
    setupSpeedControls();
    setupKeyboardShortcuts();
}

// Map policy IDs to sprite keys
const POLICY_ICON_MAP = {
    naval_deployment: 'iconNaval',
    sanctions: 'iconSanctions',
    diplomacy: 'iconDiplomacy',
    blockade_response: 'iconBlockade',
    coalition_building: 'iconCoalition',
    intel_ops: 'iconIntel',
};

let _policyDirty = true;
let _policyLastState = '';

function markPolicyDirty() { _policyDirty = true; }

function renderPolicyCards() {
    // Build a state fingerprint to avoid unnecessary DOM rebuilds
    const state = POLICIES.map(p => `${p.id}:${p.level}:${p.cooldown}`).join('|');
    if (state === _policyLastState && !_policyDirty) return;
    _policyLastState = state;
    _policyDirty = false;

    const list = document.getElementById('policy-list');
    list.innerHTML = '';

    for (const policy of POLICIES) {
        const card = document.createElement('div');
        card.className = `policy-card ${policy.level > 0 ? 'active' : ''}`;
        card.id = `policy-${policy.id}`;

        const effectsHtml = Object.entries(policy.effects).map(([key, vals]) => {
            const val = vals[policy.level];
            if (val === 0) return '';
            const displayCls = ['tension', 'iranAggression', 'cost', 'conflictRisk', 'fogOfWar'].includes(key)
                ? (val > 0 ? 'negative' : 'positive')
                : (val > 0 ? 'positive' : 'negative');
            return `<span class="${displayCls}">${formatEffectName(key)}: ${val > 0 ? '+' : ''}${val}</span>`;
        }).filter(Boolean).join(' · ');

        const spriteKey = POLICY_ICON_MAP[policy.id] || 'iconNaval';
        const iconSrc = SPRITES[spriteKey] ? SPRITES[spriteKey].toDataURL() : '';

        card.innerHTML = `
            <div class="policy-name">
                <img class="policy-icon" src="${iconSrc}" alt="">
                ${policy.name}
            </div>
            <div class="policy-desc">${policy.description}</div>
            <div class="policy-slider-row">
                <label>${policy.levelLabels[policy.level]}</label>
                <input type="range" min="0" max="${policy.maxLevel}" value="${policy.level}"
                    ${policy.cooldown > 0 ? 'disabled' : ''}>
                <span class="slider-val">${policy.level}/${policy.maxLevel}</span>
            </div>
            <div class="policy-effects">${effectsHtml || '<span style="opacity:0.4">No active effects</span>'}</div>
            <div class="policy-status">${policy.cooldown > 0 ? `Cooldown: ${policy.cooldown}d` : (policy.level > 0 ? 'ACTIVE' : 'INACTIVE')}</div>
        `;

        const slider = card.querySelector('input[type="range"]');
        slider.addEventListener('input', (e) => {
            const newLevel = parseInt(e.target.value);
            if (policy.cooldown > 0) return;
            if (newLevel === policy.level) return;

            policy.level = newLevel;
            policy.active = newLevel > 0;
            policy.cooldown = policy.cooldownMax;

            logEvent('Policy changed: ' + policy.name + ' -> ' + policy.levelLabels[newLevel], 'normal');
            markPolicyDirty();
            renderPolicyCards();
        });

        list.appendChild(card);
    }
}

function updateHUD() {
    document.getElementById('hud-day').textContent = `${SIM.day}/${SIM.victoryDay}`;

    const flowEl = document.getElementById('hud-oil-flow');
    flowEl.textContent = `${Math.round(SIM.oilFlow)}%`;
    flowEl.className = `hud-value ${SIM.oilFlow < 50 ? 'danger' : SIM.oilFlow < 75 ? 'warning' : 'good'}`;

    const priceEl = document.getElementById('hud-oil-price');
    priceEl.textContent = `$${Math.round(SIM.oilPrice)}`;
    priceEl.className = `hud-value ${SIM.oilPrice > 120 ? 'danger' : SIM.oilPrice > 95 ? 'warning' : ''}`;

    const tensionEl = document.getElementById('hud-tension');
    const tensionLabel = SIM.tension < 25 ? 'Low' : SIM.tension < 50 ? 'Moderate' : SIM.tension < 75 ? 'High' : 'Critical';
    tensionEl.textContent = tensionLabel;
    tensionEl.className = `hud-value ${SIM.tension > 75 ? 'danger' : SIM.tension > 50 ? 'warning' : SIM.tension < 25 ? 'good' : ''}`;

    const approvalEl = document.getElementById('hud-approval');
    approvalEl.textContent = `${Math.round(SIM.approval)}%`;
    approvalEl.className = `hud-value ${SIM.approval < 40 ? 'danger' : SIM.approval < 55 ? 'warning' : 'good'}`;

    // Conflict Risk
    const riskEl = document.getElementById('hud-conflict-risk');
    riskEl.textContent = `${Math.round(SIM.conflictRisk)}%`;
    riskEl.className = `hud-value ${SIM.conflictRisk > 70 ? 'danger' : SIM.conflictRisk > 40 ? 'warning' : 'good'}`;

    // Budget
    const budgetEl = document.getElementById('hud-budget');
    budgetEl.textContent = `$${Math.round(SIM.budget)}M`;
    budgetEl.className = `hud-value ${SIM.budget < 100 ? 'danger' : SIM.budget < 300 ? 'warning' : 'good'}`;

    // Crisis indicator
    const crisisEl = document.getElementById('hud-crisis');
    if (crisisEl) {
        const crisisLabels = ['None', 'Elevated', 'Major', 'War Footing'];
        crisisEl.textContent = crisisLabels[SIM.crisisLevel];
        crisisEl.className = `hud-value ${SIM.crisisLevel >= 3 ? 'danger' : SIM.crisisLevel >= 2 ? 'warning' : SIM.crisisLevel >= 1 ? 'warning' : 'good'}`;
    }
}

function updateEventLog() {
    const inner = document.getElementById('event-log-inner');
    // Only rebuild if events changed
    if (inner._lastLen === SIM.eventLog.length) return;
    inner._lastLen = SIM.eventLog.length;

    const recent = SIM.eventLog.slice(-20);

    inner.innerHTML = recent.map(e => `
        <div class="event-entry event-${e.level}">
            <span class="event-day">Day ${e.day}:${String(e.hour).padStart(2, '0')}</span>
            ${e.text}
        </div>
    `).join('');

    // Auto-scroll to newest event
    const log = inner.parentElement;
    log.scrollTop = log.scrollHeight;
}

function setupSpeedControls() {
    const speeds = { 'btn-pause': 0, 'btn-1x': 1, 'btn-2x': 2, 'btn-4x': 4 };

    for (const [id, speed] of Object.entries(speeds)) {
        document.getElementById(id).addEventListener('click', () => {
            if (SIM.gameOver) return;
            setSpeed(speed);
        });
    }
}

function setSpeed(speed) {
    SIM.speed = speed;
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    const btnMap = { 0: 'btn-pause', 1: 'btn-1x', 2: 'btn-2x', 4: 'btn-4x' };
    const btn = document.getElementById(btnMap[speed]);
    if (btn) btn.classList.add('active');
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (SIM.gameOver && e.key !== 'r') return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                setSpeed(SIM.speed === 0 ? 1 : 0);
                break;
            case '1': setSpeed(1); break;
            case '2': setSpeed(2); break;
            case '3': setSpeed(4); break;
            case '0': setSpeed(0); break;
            case 'Escape':
                SIM.selectedEntity = null;
                SIM.selectedType = null;
                break;
            case 'r':
                if (SIM.gameOver) restartGame();
                break;
        }
    });
}

function showGameOverScreen() {
    // Remove existing overlay
    const existing = document.getElementById('game-over-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    overlay.innerHTML = `
        <div class="game-over-box ${SIM.gameWon ? 'victory' : 'defeat'}">
            <h1>${SIM.gameWon ? 'MISSION COMPLETE' : 'MISSION FAILED'}</h1>
            <p class="game-over-reason">${SIM.gameOverReason}</p>
            <div class="game-over-stats">
                <div class="stat-row"><span>Days Survived</span><span>${SIM.day}</span></div>
                <div class="stat-row"><span>Final Oil Flow</span><span>${Math.round(SIM.oilFlow)}%</span></div>
                <div class="stat-row"><span>Final Oil Price</span><span>$${Math.round(SIM.oilPrice)}/bbl</span></div>
                <div class="stat-row"><span>Tension Level</span><span>${Math.round(SIM.tension)}</span></div>
                <div class="stat-row"><span>Global Approval</span><span>${Math.round(SIM.approval)}%</span></div>
                <div class="stat-row"><span>Tankers Seized</span><span>${SIM.seizureCount}</span></div>
                <div class="stat-row"><span>Intercepts</span><span>${SIM.interceptCount}</span></div>
                <div class="stat-row"><span>Budget Remaining</span><span>$${Math.round(SIM.budget)}M</span></div>
            </div>
            <button id="btn-restart" class="restart-btn">RESTART [R]</button>
        </div>
    `;

    document.getElementById('game-container').appendChild(overlay);
    document.getElementById('btn-restart').addEventListener('click', restartGame);
}

function restartGame() {
    // Remove overlay
    const overlay = document.getElementById('game-over-overlay');
    if (overlay) overlay.remove();

    // Reset SIM state
    SIM.day = 1;
    SIM.hour = 0;
    SIM.speed = 0;
    SIM.oilFlow = 100;
    SIM.oilPrice = 80;
    SIM.tension = 15;
    SIM.approval = 72;
    SIM.conflictRisk = 0;
    SIM.budget = 1000;
    SIM.iranAggression = 20;
    SIM.iranEconomy = 60;
    SIM.fogOfWar = 80;
    SIM.diplomaticCapital = 50;
    SIM.tankers = [];
    SIM.navyShips = [];
    SIM.iranBoats = [];
    SIM.platforms = [];
    SIM.eventQueue = [];
    SIM.eventLog = [];
    SIM.effects = [];
    SIM.gameOver = false;
    SIM.gameOverReason = '';
    SIM.gameWon = false;
    SIM.crisisLevel = 0;
    SIM.crisisTimer = 0;
    SIM.consecutiveProvocations = 0;
    SIM.interceptCount = 0;
    SIM.seizureCount = 0;
    SIM.selectedEntity = null;
    SIM.selectedType = null;
    SIM.mines = [];
    SIM.drones = [];
    SIM.carrier = null;

    // Reset policies
    for (const p of POLICIES) {
        p.level = 0;
        p.active = false;
        p.cooldown = 0;
    }

    // Re-init
    initSimulation();
    if (SIM.character && SIM.character.applyBonus) SIM.character.applyBonus(SIM);
    renderPolicyCards();

    logEvent('Simulation restarted. Set policies and press Play to begin.', 'good');

    // Update speed buttons
    setSpeed(0);
}

function formatEffectName(key) {
    const names = {
        tension: 'Tension',
        oilFlowProtection: 'Oil Protection',
        oilPrice: 'Oil Price',
        approval: 'Approval',
        iranAggression: 'Iran Aggression',
        iranEconomy: 'Iran Economy',
        cost: 'Cost ($M/day)',
        conflictRisk: 'Conflict Risk',
        fogOfWar: 'Fog of War',
        diplomaticCapital: 'Diplomatic Capital',
    };
    return names[key] || key;
}
