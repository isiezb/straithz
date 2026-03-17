/**
 * UI Controller — policy panel, HUD updates, event log
 */

function initUI() {
    renderPolicyCards();
    setupSpeedControls();
}

function renderPolicyCards() {
    const list = document.getElementById('policy-list');
    list.innerHTML = '';

    for (const policy of POLICIES) {
        const card = document.createElement('div');
        card.className = `policy-card ${policy.level > 0 ? 'active' : ''}`;
        card.id = `policy-${policy.id}`;

        const effectsHtml = Object.entries(policy.effects).map(([key, vals]) => {
            const val = vals[policy.level];
            if (val === 0) return '';
            const cls = val > 0 ? (key === 'oilFlowProtection' || key === 'approval' ? 'positive' : 'negative') : (key === 'tension' || key === 'iranAggression' ? 'positive' : 'negative');
            // Flip for "good when negative" effects
            const displayCls = ['tension', 'iranAggression', 'cost', 'conflictRisk', 'fogOfWar'].includes(key)
                ? (val > 0 ? 'negative' : 'positive')
                : (val > 0 ? 'positive' : 'negative');
            return `<span class="${displayCls}">${formatEffectName(key)}: ${val > 0 ? '+' : ''}${val}</span>`;
        }).filter(Boolean).join(' · ');

        card.innerHTML = `
            <div class="policy-name">
                <img class="policy-icon" src="${policy.icon}" onerror="this.style.display='none'" alt="">
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

            policy.level = newLevel;
            policy.active = newLevel > 0;
            policy.cooldown = policy.cooldownMax;

            // Log policy change
            logEvent(`Policy changed: ${policy.name} → ${policy.levelLabels[newLevel]}`, 'normal');

            renderPolicyCards(); // re-render to update effects display
        });

        list.appendChild(card);
    }
}

function updateHUD() {
    document.getElementById('hud-day').textContent = SIM.day;

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
}

function updateEventLog() {
    const inner = document.getElementById('event-log-inner');
    const recent = SIM.eventLog.slice(-20).reverse();

    inner.innerHTML = recent.map(e => `
        <div class="event-entry event-${e.level}">
            <span class="event-day">Day ${e.day}</span>
            ${e.text}
        </div>
    `).join('');
}

function setupSpeedControls() {
    const speeds = { 'btn-pause': 0, 'btn-1x': 1, 'btn-2x': 2, 'btn-4x': 4 };

    for (const [id, speed] of Object.entries(speeds)) {
        document.getElementById(id).addEventListener('click', () => {
            SIM.speed = speed;
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(id).classList.add('active');
        });
    }
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
