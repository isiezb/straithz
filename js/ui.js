/**
 * UI Controller — policy panel, HUD updates, event log, game over screen,
 * toast notifications, decision events, weekly reports
 */

function initUI() {
    renderPolicyCards();
    setupSpeedControls();
    setupKeyboardShortcuts();
    updateDailyCost();
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
            updateDailyCost();
        });

        list.appendChild(card);
    }

    updateDailyCost();
}

function updateDailyCost() {
    const costEl = document.getElementById('daily-cost');
    if (!costEl) return;
    const cost = getAggregateEffect('cost');
    if (cost > 0) {
        costEl.textContent = `$${cost}M/day`;
        costEl.className = 'daily-cost-display ' + (cost > 300 ? 'danger' : cost > 100 ? 'warning' : 'good');
    } else {
        costEl.textContent = '';
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

    // Rating
    const ratingEl = document.getElementById('hud-rating');
    if (ratingEl) {
        const rating = calculateRating();
        ratingEl.textContent = rating.grade;
        const ratingCls = rating.score >= 80 ? 'good' : rating.score >= 50 ? 'warning' : 'danger';
        ratingEl.className = `hud-value rating-badge ${ratingCls}`;
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
            if (SIM.gameOver || SIM.decisionEventActive || SIM.weeklyReportActive) return;
            setSpeed(speed);
        });
    }
}

function setSpeed(speed) {
    if (SIM.decisionEventActive || SIM.weeklyReportActive) {
        speed = 0;
    }
    SIM.speed = speed;
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    const btnMap = { 0: 'btn-pause', 1: 'btn-1x', 2: 'btn-2x', 4: 'btn-4x' };
    const btn = document.getElementById(btnMap[speed]);
    if (btn) btn.classList.add('active');
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (SIM.gameOver && e.key !== 'r') return;
        if (SIM.decisionEventActive || SIM.weeklyReportActive) return;

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

// -- Toast Notifications --

function showToast(text, level) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Limit visible toasts
    while (container.children.length >= 4) {
        container.removeChild(container.firstChild);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${level}`;
    toast.textContent = text;

    toast.addEventListener('animationend', (e) => {
        if (e.animationName === 'toastFadeOut') {
            toast.remove();
        }
    });

    container.appendChild(toast);
}

// -- Decision Events --

function showDecisionEvent(event) {
    const existing = document.getElementById('decision-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'decision-overlay';

    const choicesHtml = event.choices.map((choice, i) => {
        const effectsHtml = Object.entries(choice.effects).map(([key, val]) => {
            if (val === 0) return '';
            const isNeg = ['tension', 'iranAggression', 'conflictRisk', 'fogOfWar'].includes(key)
                ? val > 0 : val < 0;
            return `<span class="${isNeg ? 'negative' : 'positive'}">${formatEffectName(key)}: ${val > 0 ? '+' : ''}${val}</span>`;
        }).filter(Boolean).join(' ');

        return `
            <button class="decision-choice" data-idx="${i}">
                <span class="choice-text">${choice.text}</span>
                <span class="choice-effects">${effectsHtml || 'No immediate effects'}</span>
            </button>
        `;
    }).join('');

    overlay.innerHTML = `
        <div class="decision-box">
            <div class="decision-header">
                <span class="decision-day">DAY ${SIM.day}</span>
                <span class="decision-label">DECISION REQUIRED</span>
            </div>
            <h2 class="decision-title">${event.title}</h2>
            <p class="decision-desc">${event.description}</p>
            <div class="decision-choices">${choicesHtml}</div>
        </div>
    `;

    document.getElementById('game-container').appendChild(overlay);

    overlay.querySelectorAll('.decision-choice').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            const choice = event.choices[idx];

            // Apply effects
            for (const [key, val] of Object.entries(choice.effects)) {
                if (key === 'oilFlow') SIM.oilFlow = Math.max(10, Math.min(100, SIM.oilFlow + val));
                else if (key === 'oilPrice') SIM.oilPrice = Math.max(40, SIM.oilPrice + val);
                else if (key === 'tension') SIM.tension = Math.max(0, Math.min(100, SIM.tension + val));
                else if (key === 'approval') SIM.approval = Math.max(0, Math.min(100, SIM.approval + val));
                else if (key === 'iranAggression') SIM.iranAggression = Math.max(0, Math.min(100, SIM.iranAggression + val));
                else if (key === 'budget') SIM.budget += val;
                else if (key === 'conflictRisk') SIM.conflictRisk = Math.max(0, Math.min(100, SIM.conflictRisk + val));
                else if (key === 'fogOfWar') SIM.fogOfWar = Math.max(0, Math.min(100, SIM.fogOfWar + val));
                else if (key === 'diplomaticCapital') SIM.diplomaticCapital = Math.max(0, Math.min(100, SIM.diplomaticCapital + val));
            }

            // Log result
            logEvent(`Decision: ${event.title} — ${choice.text}`, 'normal');
            logEvent(choice.flavor, 'good');

            // Record in history
            SIM.decisionHistory.push({
                id: event.id,
                title: event.title,
                choiceText: choice.text,
                day: SIM.day,
            });

            // Show flavor text briefly then dismiss
            const box = overlay.querySelector('.decision-box');
            box.innerHTML = `
                <div class="decision-result">
                    <h2>${choice.text.toUpperCase()}</h2>
                    <p class="decision-flavor">${choice.flavor}</p>
                    <button class="decision-continue-btn">CONTINUE</button>
                </div>
            `;
            box.querySelector('.decision-continue-btn').addEventListener('click', () => {
                overlay.remove();
                SIM.decisionEventActive = false;
            });
        });
    });
}

// -- Weekly Report --

function showWeeklyReport() {
    const existing = document.getElementById('weekly-report-overlay');
    if (existing) existing.remove();

    const week = Math.floor(SIM.day / 7);
    const history = SIM.metricHistory;
    const weekAgo = history.filter(m => m.day >= SIM.day - 7);
    const prevWeek = history.filter(m => m.day >= SIM.day - 14 && m.day < SIM.day - 7);

    function trend(current, prev, invert) {
        if (!prev || prev.length === 0) return { arrow: '-', cls: '' };
        const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
        const diff = current - avg;
        if (Math.abs(diff) < 1) return { arrow: '-', cls: 'stable' };
        const up = diff > 0;
        const good = invert ? !up : up;
        return { arrow: up ? '+' : '-', cls: good ? 'trend-good' : 'trend-bad' };
    }

    const metrics = [
        { label: 'Oil Flow', value: `${Math.round(SIM.oilFlow)}%`, trend: trend(SIM.oilFlow, prevWeek.map(m => m.oilFlow), false) },
        { label: 'Oil Price', value: `$${Math.round(SIM.oilPrice)}`, trend: trend(SIM.oilPrice, prevWeek.map(m => m.oilPrice), true) },
        { label: 'Tension', value: `${Math.round(SIM.tension)}`, trend: trend(SIM.tension, prevWeek.map(m => m.tension), true) },
        { label: 'Approval', value: `${Math.round(SIM.approval)}%`, trend: trend(SIM.approval, prevWeek.map(m => m.approval), false) },
        { label: 'Conflict Risk', value: `${Math.round(SIM.conflictRisk)}%`, trend: trend(SIM.conflictRisk, prevWeek.map(m => m.conflictRisk), true) },
        { label: 'Budget', value: `$${Math.round(SIM.budget)}M`, trend: trend(SIM.budget, prevWeek.map(m => m.budget), false) },
    ];

    const rating = calculateRating();
    const weekDecisions = SIM.decisionHistory.filter(d => d.day > SIM.day - 7 && d.day <= SIM.day);

    const overlay = document.createElement('div');
    overlay.id = 'weekly-report-overlay';

    overlay.innerHTML = `
        <div class="weekly-report-box">
            <div class="report-header">
                <span class="report-week">WEEK ${week} REPORT</span>
                <span class="report-day">Day ${SIM.day}/${SIM.victoryDay}</span>
            </div>
            <div class="report-rating">
                <span class="report-grade ${rating.score >= 80 ? 'good' : rating.score >= 50 ? 'warning' : 'danger'}">${rating.grade}</span>
                <span class="report-label">${rating.label} (${rating.score}/100)</span>
            </div>
            <div class="report-metrics">
                ${metrics.map(m => `
                    <div class="report-metric-row">
                        <span class="report-metric-label">${m.label}</span>
                        <span class="report-metric-value">${m.value}</span>
                        <span class="report-metric-trend ${m.trend.cls}">${m.trend.arrow === '+' ? '&#9650;' : m.trend.arrow === '-' ? (m.trend.cls ? '&#9654;' : '&#8212;') : '&#9660;'}</span>
                    </div>
                `).join('')}
            </div>
            ${weekDecisions.length > 0 ? `
                <div class="report-decisions">
                    <div class="report-decisions-label">DECISIONS THIS WEEK</div>
                    ${weekDecisions.map(d => `<div class="report-decision-item">${d.title}: ${d.choiceText}</div>`).join('')}
                </div>
            ` : ''}
            <button class="report-continue-btn">CONTINUE</button>
        </div>
    `;

    document.getElementById('game-container').appendChild(overlay);

    overlay.querySelector('.report-continue-btn').addEventListener('click', () => {
        overlay.remove();
        SIM.weeklyReportActive = false;
    });
}

// -- Game Over --

function showGameOverScreen() {
    const existing = document.getElementById('game-over-overlay');
    if (existing) existing.remove();

    const rating = calculateRating();

    const overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    overlay.innerHTML = `
        <div class="game-over-box ${SIM.gameWon ? 'victory' : 'defeat'}">
            <h1>${SIM.gameWon ? 'MISSION COMPLETE' : 'MISSION FAILED'}</h1>
            <div class="game-over-rating">
                <span class="go-grade ${rating.score >= 80 ? 'good' : rating.score >= 50 ? 'warning' : 'danger'}">${rating.grade}</span>
                <span class="go-grade-label">${rating.label} (${rating.score}/100)</span>
            </div>
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
                <div class="stat-row"><span>Decisions Made</span><span>${SIM.decisionHistory.length}</span></div>
            </div>
            <button id="btn-restart" class="restart-btn">RESTART [R]</button>
        </div>
    `;

    document.getElementById('game-container').appendChild(overlay);
    document.getElementById('btn-restart').addEventListener('click', restartGame);
}

function restartGame() {
    // Remove all overlays
    ['game-over-overlay', 'decision-overlay', 'weekly-report-overlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    // Clear toasts
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) toastContainer.innerHTML = '';

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
    SIM.decisionEventActive = false;
    SIM.decisionHistory = [];
    SIM.lastDecisionDay = 0;
    SIM.metricHistory = [];
    SIM.weeklyReportActive = false;

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
