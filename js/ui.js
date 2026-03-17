/**
 * UI Controller — Weekly Briefing, Card Picker, Advisor Console, Gauges,
 * News Ticker, Decision Events, Newspaper Debrief, Post-Mortem, Game Over
 * P3: Visible escalation track, surfaced hidden systems
 * P4: Watchable playing phase with day counter
 * P5: Sharpened debrief (one big number, one sentence)
 */

function initUI() {
    updateGauges();
    setupKeyboardShortcuts();
}

// ======================== GAUGES + ESCALATION TRACK ========================

function updateGauges() {
    const g = calculateGauges();
    setGauge('gauge-stability', g.stability);
    setGauge('gauge-economy', g.economy);
    setGauge('gauge-support', g.support);
    setGauge('gauge-intel', g.intel);

    // Unique resource gauge (5th gauge)
    updateUniqueResourceGauge();

    // Week / Day indicator — prominent day counter (P4)
    const weekEl = document.getElementById('hud-week');
    if (weekEl) {
        weekEl.textContent = `WEEK ${SIM.week} — DAY ${SIM.weekDay}/7`;
        // Flash on day change
        if (SIM.phase === 'playing') {
            weekEl.className = 'gauge-week playing';
        } else {
            weekEl.className = 'gauge-week';
        }
    }

    // Escalation Track — P3: visible warPath pips (0-5)
    const escEl = document.getElementById('hud-escalation');
    if (escEl) {
        let pips = '';
        for (let i = 0; i < 5; i++) {
            pips += i < SIM.warPath ? '◆' : '◇';
        }
        escEl.innerHTML = `<span class="esc-label">ESCALATION</span><span class="esc-pips ${SIM.warPath >= 4 ? 'danger' : SIM.warPath >= 2 ? 'warning' : 'good'}">${pips}</span>`;
    }

    // Strait open progress
    const straitEl = document.getElementById('hud-strait');
    if (straitEl) {
        if (SIM.straitOpenDays > 0) {
            let bar = '';
            for (let i = 0; i < 14; i++) {
                bar += i < SIM.straitOpenDays ? '█' : '░';
            }
            straitEl.innerHTML = `<span class="strait-label">STRAIT OPEN</span><span class="strait-bar">${bar}</span><span class="strait-num">${SIM.straitOpenDays}/14</span>`;
            straitEl.className = 'strait-counter active';
        } else {
            straitEl.textContent = 'STRAIT: CONTESTED';
            straitEl.className = 'strait-counter';
        }
    }

    // Special action button
    updateSpecialAction();
}

function setGauge(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const fill = el.querySelector('.gauge-fill');
    const valEl = el.querySelector('.gauge-val');
    if (fill) {
        fill.style.width = value + '%';
        fill.className = 'gauge-fill ' + (value >= 60 ? 'good' : value >= 35 ? 'warning' : 'danger');
    }
    if (valEl) {
        const label = value >= 75 ? 'Strong' : value >= 50 ? 'Stable' : value >= 30 ? 'Weak' : 'Critical';
        valEl.textContent = label;
        valEl.className = 'gauge-val ' + (value >= 60 ? 'good' : value >= 35 ? 'warning' : 'danger');
    }
}

function updateUniqueResourceGauge() {
    const el = document.getElementById('gauge-unique');
    if (!el || !SIM.character || !SIM.character.uniqueResource) {
        if (el) el.style.display = 'none';
        return;
    }
    el.style.display = '';
    const res = SIM.character.uniqueResource;
    const val = SIM.uniqueResource;
    const max = res.max || 100;
    const pct = Math.max(0, Math.min(100, (val / max) * 100));
    const inverted = res.inverted;

    const label = el.querySelector('.gauge-label');
    const fill = el.querySelector('.gauge-fill');
    const valEl = el.querySelector('.gauge-val');

    if (label) label.textContent = res.name;
    if (fill) {
        fill.style.width = pct + '%';
        fill.style.background = res.color;
        fill.style.boxShadow = `0 0 4px ${res.color}40`;
        // For inverted (exposure): high = danger
        if (inverted) {
            fill.className = 'gauge-fill ' + (pct <= 40 ? 'good' : pct <= 65 ? 'warning' : 'danger');
        } else {
            fill.className = 'gauge-fill ' + (pct >= 60 ? 'good' : pct >= 35 ? 'warning' : 'danger');
        }
    }
    if (valEl) {
        valEl.textContent = Math.round(val);
        valEl.style.color = res.color;
    }
}

function updateSpecialAction() {
    const btn = document.getElementById('special-action-btn');
    if (!btn) return;

    if (!SIM.character || !SIM.character.specialAction) {
        btn.style.display = 'none';
        return;
    }

    const sa = SIM.character.specialAction;
    btn.style.display = '';
    const onCooldown = sa.cooldown > 0;
    const canAfford = !sa.cost || Object.entries(sa.cost).every(([k, v]) => SIM.uniqueResource >= v);

    btn.textContent = onCooldown ? `${sa.name} (${sa.cooldown}d)` : sa.name;
    btn.className = 'special-action-btn' + (onCooldown || !canAfford || SIM.phase !== 'playing' ? ' disabled' : '');
    btn.title = sa.description;
    btn.onclick = () => {
        if (onCooldown || !canAfford || SIM.phase !== 'playing') return;
        // Pay cost
        if (sa.cost) {
            for (const [k, v] of Object.entries(sa.cost)) {
                SIM.uniqueResource -= v;
            }
        }
        sa.cooldown = sa.cooldownMax;
        sa.execute(SIM);
    };

    // Tick cooldown each day (called from dailyUpdate via updateGauges)
    // Actually handled in tickSimulation
}

// ======================== EVENT LOG ========================

let _lastEventLogLen = 0;

function updateEventLog() {
    if (SIM.headlines.length === _lastEventLogLen) return;
    _lastEventLogLen = SIM.headlines.length;

    const log = document.getElementById('event-log');
    if (!log) return;

    const recent = SIM.headlines.slice(-30).reverse();
    log.innerHTML = '<div class="event-log-header">SITUATION LOG</div>' +
        recent.map(h =>
            `<div class="event-log-entry elog-${h.level}"><span class="elog-day">D${h.day}</span>${h.text}</div>`
        ).join('');
}

// ======================== NEWS TICKER ========================

let _lastTickerLen = 0;

function updateNewsTicker() {
    if (SIM.headlines.length === _lastTickerLen) return;
    _lastTickerLen = SIM.headlines.length;

    const ticker = document.getElementById('news-ticker-inner');
    if (!ticker) return;

    const recent = SIM.headlines.slice(-10);
    ticker.innerHTML = recent.map(h =>
        `<span class="ticker-item ticker-${h.level}">Day ${h.day}: ${h.text}</span>`
    ).join('<span class="ticker-sep">|</span>');

    const container = ticker.parentElement;
    if (container) container.scrollLeft = container.scrollWidth;
}

// ======================== ADVISOR CONSOLE ========================

let _lastAdvisorText = '';

function updateAdvisorConsole() {
    const textEl = document.getElementById('advisor-text');
    if (!textEl || !SIM.character) return;

    let text = '';
    // Check unique resource state first
    if (SIM.character.uniqueResource) {
        const inverted = SIM.character.uniqueResource.inverted;
        if (inverted && SIM.uniqueResource > 70) text = getAdvisorReaction('uniqueResourceCritical');
        else if (inverted && SIM.uniqueResource > 50) text = getAdvisorReaction('uniqueResourceLow');
        else if (!inverted && SIM.uniqueResource < 15) text = getAdvisorReaction('uniqueResourceCritical');
        else if (!inverted && SIM.uniqueResource < 30) text = getAdvisorReaction('uniqueResourceLow');
    }
    if (!text) {
        if (SIM.tension > 70) text = getAdvisorReaction('highTension');
        else if (SIM.domesticApproval < 30) text = getAdvisorReaction('lowApproval');
        else if (SIM.budget < 200) text = getAdvisorReaction('lowBudget');
        else if (SIM.proxyThreat > 50) text = getAdvisorReaction('highProxy');
        else if (SIM.straitOpenDays >= 10) text = getAdvisorReaction('victory');
        else text = getAdvisorReaction('weekStart');
    }

    if (text && text !== _lastAdvisorText) {
        _lastAdvisorText = text;
        textEl.textContent = text;
        textEl.className = 'advisor-speech fresh';
        setTimeout(() => textEl.className = 'advisor-speech', 300);
    }

    // Portrait
    const portrait = document.getElementById('advisor-portrait');
    if (portrait && !portrait._drawn && SPRITES[SIM.character.spriteKey]) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(SPRITES[SIM.character.spriteKey], 0, 0, 64, 64);
        portrait.innerHTML = '';
        portrait.appendChild(canvas);
        portrait._drawn = true;

        const nameEl = document.getElementById('advisor-name');
        if (nameEl) nameEl.textContent = SIM.character.name;
        const titleEl = document.getElementById('advisor-title');
        if (titleEl) titleEl.textContent = SIM.character.title;
    }

    // Status lines — P3: surface key hidden metrics
    const statusEl = document.getElementById('advisor-status');
    if (statusEl) {
        const rating = calculateRating();
        statusEl.innerHTML = `
            <div class="advisor-stat"><span>Rating</span><span class="${rating.score >= 60 ? 'good' : rating.score >= 35 ? 'warning' : 'danger'}">${rating.grade}</span></div>
            <div class="advisor-stat"><span>Iran</span><span class="${SIM.iranStrategy === 'confrontational' ? 'danger' : SIM.iranStrategy === 'escalatory' ? 'warning' : 'good'}">${SIM.iranStrategy.toUpperCase()}</span></div>
            <div class="advisor-stat"><span>Proxy</span><span class="${SIM.proxyThreat > 50 ? 'danger' : SIM.proxyThreat > 25 ? 'warning' : 'good'}">${SIM.proxyThreat > 50 ? 'HIGH' : SIM.proxyThreat > 25 ? 'MED' : 'LOW'}</span></div>
            <div class="advisor-stat"><span>Crisis</span><span class="${SIM.crisisLevel >= 2 ? 'danger' : SIM.crisisLevel >= 1 ? 'warning' : 'good'}">${['NONE', 'ELEV', 'MAJOR', 'WAR'][SIM.crisisLevel]}</span></div>
            <div class="advisor-stat"><span>Budget</span><span class="${SIM.budget < 200 ? 'danger' : SIM.budget < 500 ? 'warning' : 'good'}">$${Math.round(SIM.budget)}M</span></div>
            <div class="advisor-stat"><span>China</span><span class="${SIM.chinaRelations < 30 ? 'danger' : SIM.chinaRelations < 50 ? 'warning' : 'good'}">${SIM.chinaRelations < 30 ? 'HOSTILE' : SIM.chinaRelations < 50 ? 'COOL' : 'NEUTRAL'}</span></div>
            <div class="advisor-stat"><span>Russia</span><span class="${SIM.russiaRelations < 25 ? 'danger' : SIM.russiaRelations < 50 ? 'warning' : 'good'}">${SIM.russiaRelations < 25 ? 'HOSTILE' : SIM.russiaRelations < 50 ? 'COOL' : 'NEUTRAL'}</span></div>
            ${SIM.character.contacts ? `<div class="advisor-stat"><span>Contacts</span><span class="good">${SIM.character.contacts.filter(c => c.trust >= 60).length}/${SIM.character.contacts.length}</span></div>` : ''}
        `;
    }
}

// ======================== WEEKLY BRIEFING (Card Picker) ========================

function showWeeklyBriefing() {
    const existing = document.getElementById('weekly-briefing-overlay');
    if (existing) existing.remove();

    const hand = dealHand(SIM.character, SIM.week, SIM.playedExclusives);
    const maxPicks = (SIM.character.cardPool && SIM.character.cardPool.maxPicks) || 3;
    const selected = []; // [{card, funding}]

    const overlay = document.createElement('div');
    overlay.id = 'weekly-briefing-overlay';
    overlay.className = 'fullscreen-overlay';

    function render() {
        const advisorQuote = getAdvisorReaction('weekStart');
        const effectMult = (SIM.character.cardPool && SIM.character.cardPool.effectMultiplier) || 1;
        overlay.innerHTML = `
            <div class="briefing-box">
                <div class="briefing-header">
                    <span class="briefing-week">WEEK ${SIM.week} BRIEFING</span>
                    <span class="briefing-label">SELECT ${maxPicks} STRATEGY CARDS${effectMult > 1 ? ` (${effectMult}x EFFECTS)` : ''}</span>
                </div>
                <div class="briefing-advisor">
                    <span class="advisor-quote">"${advisorQuote}"</span>
                    <span class="advisor-attr">— ${SIM.character.name}</span>
                </div>
                <div class="briefing-cards">
                    ${hand.map((card, i) => {
                        const sel = selected.find(s => s.card === card);
                        const isSelected = !!sel;
                        const isBonus = Object.values(CHARACTER_BONUS_CARDS).some(b => b.id === card.id);
                        const isContact = typeof CONTACT_CARDS !== 'undefined' && Object.values(CONTACT_CARDS).some(b => b.id === card.id);
                        const catColors = { military: '#dd4444', diplomatic: '#4488dd', economic: '#ddaa44', intelligence: '#44dd88', domestic: '#aa88dd' };
                        const catColor = catColors[card.category] || '#44dd88';
                        return `
                            <div class="briefing-card ${isSelected ? 'selected' : ''} ${isBonus ? 'bonus' : ''} ${isContact ? 'contact' : ''} ${selected.length >= maxPicks && !isSelected ? 'disabled' : ''}" data-idx="${i}" style="border-color: ${isSelected ? catColor : ''}">
                                <div class="bcard-cat" style="color: ${catColor}">${card.category.toUpperCase()}${isBonus ? ' ★' : ''}${isContact ? ' 🤝' : ''}</div>
                                <div class="bcard-name">${card.name}</div>
                                <div class="bcard-desc">${card.description}</div>
                                ${isSelected ? `
                                    <div class="bcard-funding">
                                        <button class="fund-btn ${sel.funding === 'low' ? 'active' : ''}" data-card="${i}" data-fund="low">LOW</button>
                                        <button class="fund-btn ${sel.funding === 'medium' ? 'active' : ''}" data-card="${i}" data-fund="medium">MED</button>
                                        <button class="fund-btn ${sel.funding === 'high' ? 'active' : ''}" data-card="${i}" data-fund="high">HIGH</button>
                                    </div>
                                    <div class="bcard-hint">${card.hint[sel.funding]}</div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="briefing-summary">
                    <span>${selected.length}/${maxPicks} cards selected</span>
                    ${selected.length > 0 ? `<span class="briefing-cost">Est. cost: $${selected.reduce((t, s) => t + (s.card.effects[s.funding].cost || 0), 0)}M/week</span>` : ''}
                </div>
                <button class="briefing-confirm ${selected.length === maxPicks ? 'ready' : ''}" id="briefing-confirm">
                    ${selected.length === maxPicks ? '[ DEPLOY STRATEGY ]' : `[ SELECT ${maxPicks} CARDS ]`}
                </button>
            </div>
        `;

        // Card click to select/deselect
        overlay.querySelectorAll('.briefing-card').forEach(cardEl => {
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

        // Funding level buttons
        overlay.querySelectorAll('.fund-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.card);
                const card = hand[idx];
                const sel = selected.find(s => s.card === card);
                if (sel) {
                    sel.funding = btn.dataset.fund;
                    render();
                }
            });
        });

        // Confirm
        const confirmBtn = document.getElementById('briefing-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (selected.length !== maxPicks) return;

                // Apply selections
                SIM.activeStances = selected.map(s => ({ cardId: s.card.id, funding: s.funding }));

                // Track exclusive cards
                for (const s of selected) {
                    const isBonus = Object.values(CHARACTER_BONUS_CARDS).some(b => b.id === s.card.id);
                    if (isBonus || s.card.exclusive) {
                        SIM.playedExclusives.push(s.card.id);
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
                            addHeadline(`Military order costs ${cost} Command Authority`, 'warning');
                        }
                    }
                }

                // Log
                for (const s of selected) {
                    addHeadline(`Strategy deployed: ${s.card.name} (${s.funding})`, 'normal');
                }

                overlay.remove();
                SIM.phase = 'playing';
                SIM.weekDay = 1;
                SIM.speed = 2;

                // Tick special action cooldowns
                if (SIM.character.specialAction && SIM.character.specialAction.cooldown > 0) {
                    SIM.character.specialAction.cooldown = Math.max(0, SIM.character.specialAction.cooldown - 7);
                }
            });
        }
    }

    document.getElementById('game-container').appendChild(overlay);
    render();
}

// ======================== WEEKLY DEBRIEF — P5: Sharpened ========================

function showWeeklyDebrief() {
    const existing = document.getElementById('weekly-debrief-overlay');
    if (existing) existing.remove();

    const g = calculateGauges();
    const rating = calculateRating();
    const history = SIM.metricHistory;
    const prevWeek = history.filter(m => m.day > (SIM.week - 2) * 7 && m.day <= (SIM.week - 1) * 7);

    function trendArrow(current, prev, invert) {
        if (prev.length === 0) return { arrow: '—', cls: '' };
        const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
        const diff = current - avg;
        if (Math.abs(diff) < 2) return { arrow: '—', cls: 'stable' };
        const up = diff > 0;
        const good = invert ? !up : up;
        return { arrow: up ? '▲' : '▼', cls: good ? 'trend-good' : 'trend-bad' };
    }

    const weekHeadlines = SIM.headlines.filter(h => h.day > (SIM.week - 1) * 7 && h.day <= SIM.week * 7);
    const topHeadline = weekHeadlines.find(h => h.level === 'critical') || weekHeadlines[weekHeadlines.length - 1] || { text: 'Situation unchanged in Strait of Hormuz' };

    // One sentence summary of what changed
    const deltaStability = g.stability - (prevWeek.length > 0 ? prevWeek[prevWeek.length - 1]?.gauges?.stability ?? 50 : 50);
    const deltaEconomy = g.economy - (prevWeek.length > 0 ? prevWeek[prevWeek.length - 1]?.gauges?.economy ?? 50 : 50);
    let weekSummary = '';
    if (deltaStability < -10) weekSummary = 'The situation deteriorated significantly this week.';
    else if (deltaStability > 10) weekSummary = 'Major progress toward stability this week.';
    else if (deltaEconomy < -10) weekSummary = 'Economic pressure mounted this week.';
    else if (deltaEconomy > 10) weekSummary = 'Markets rallied on improved conditions.';
    else weekSummary = 'A week of holding the line.';

    const metrics = [
        { label: 'Stability', value: g.stability, trend: trendArrow(g.stability, prevWeek.map(m => m.gauges?.stability ?? 50), false) },
        { label: 'Economy', value: g.economy, trend: trendArrow(g.economy, prevWeek.map(m => m.gauges?.economy ?? 50), false) },
        { label: 'Support', value: g.support, trend: trendArrow(g.support, prevWeek.map(m => m.gauges?.support ?? 50), false) },
        { label: 'Intel', value: g.intel, trend: trendArrow(g.intel, prevWeek.map(m => m.gauges?.intel ?? 50), false) },
    ];

    const overlay = document.createElement('div');
    overlay.id = 'weekly-debrief-overlay';
    overlay.className = 'fullscreen-overlay';

    // P5: One big number, one sentence, gauge bars. Details expandable.
    overlay.innerHTML = `
        <div class="debrief-box">
            <div class="debrief-masthead">
                <div class="debrief-paper-name">WEEK ${SIM.week} COMPLETE</div>
                <div class="debrief-date">Day ${SIM.day} — ${SIM.character.name}</div>
            </div>
            <div class="debrief-rating">
                <span class="debrief-grade ${rating.score >= 60 ? 'good' : rating.score >= 35 ? 'warning' : 'danger'}">${rating.grade}</span>
                <span class="debrief-grade-label">${rating.label}</span>
            </div>
            <div class="debrief-summary-text">${weekSummary}</div>
            <div class="debrief-headline">${topHeadline.text.toUpperCase()}</div>
            <div class="debrief-gauges">
                ${metrics.map(m => `
                    <div class="debrief-gauge-row">
                        <span class="dg-label">${m.label}</span>
                        <div class="dg-bar"><div class="dg-fill ${m.value >= 60 ? 'good' : m.value >= 35 ? 'warning' : 'danger'}" style="width:${m.value}%"></div></div>
                        <span class="dg-trend ${m.trend.cls}">${m.trend.arrow}</span>
                    </div>
                `).join('')}
            </div>
            <div class="debrief-key-stats">
                <span class="debrief-stat">Escalation: ${SIM.warPath}/5</span>
                <span class="debrief-stat">Strait: ${SIM.straitOpenDays}/14</span>
                <span class="debrief-stat">Budget: $${Math.round(SIM.budget)}M</span>
                ${SIM.character.uniqueResource ? `<span class="debrief-stat">${SIM.character.uniqueResource.name}: ${Math.round(SIM.uniqueResource)}</span>` : ''}
            </div>
            <div class="debrief-advisor-quote">"${getAdvisorReaction('weekStart')}" — ${SIM.character.name}</div>
            <button class="debrief-continue" id="debrief-continue">
                ${SIM.week >= 13 ? '[ FINAL ASSESSMENT ]' : '[ PROCEED TO WEEK ' + (SIM.week + 1) + ' ]'}
            </button>
        </div>
    `;

    document.getElementById('game-container').appendChild(overlay);

    document.getElementById('debrief-continue').addEventListener('click', () => {
        overlay.remove();
        SIM.week++;
        SIM.weekDay = 0;
        SIM.phase = 'briefing';
        SIM.speed = 0;
        showWeeklyBriefing();
    });
}

// ======================== TOAST NOTIFICATIONS ========================

function showToast(text, level) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    while (container.children.length >= 4) {
        container.removeChild(container.firstChild);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${level}`;
    toast.textContent = text;

    toast.addEventListener('animationend', (e) => {
        if (e.animationName === 'toastFadeOut') toast.remove();
    });

    container.appendChild(toast);
}

// ======================== DECISION EVENTS ========================

function showDecisionEvent(event) {
    const existing = document.getElementById('decision-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'decision-overlay';
    overlay.className = 'fullscreen-overlay';

    let countdown = event.countdown || 0;
    let countdownInterval = null;

    function renderEvent() {
        const choicesHtml = event.choices.map((choice, i) => {
            const hints = Object.entries(choice.effects).map(([key, val]) => {
                if (val === 0) return '';
                const isNeg = ['tension', 'iranAggression', 'conflictRisk', 'fogOfWar', 'polarization', 'assassinationRisk', 'warPath', 'proxyThreat', 'exposure'].includes(key)
                    ? val > 0 : val < 0;
                const arrow = Math.abs(val) > 10 ? (val > 0 ? '▲▲' : '▼▼') : (val > 0 ? '▲' : '▼');
                return `<span class="${isNeg ? 'negative' : 'positive'}">${formatEffectName(key)} ${arrow}</span>`;
            }).filter(Boolean).join(' ');

            return `
                <button class="decision-choice" data-idx="${i}">
                    <span class="choice-text">${choice.text}</span>
                    <span class="choice-effects">${hints || 'No immediate effects'}</span>
                </button>
            `;
        }).join('');

        overlay.innerHTML = `
            <div class="decision-box">
                <div class="decision-header">
                    <span class="decision-day">WEEK ${SIM.week} — DAY ${SIM.weekDay}</span>
                    <span class="decision-label">${countdown > 0 ? `${countdown}s` : 'DECISION REQUIRED'}</span>
                </div>
                <h2 class="decision-title">${event.title}</h2>
                <p class="decision-desc">${event.description}</p>
                <div class="decision-choices">${choicesHtml}</div>
            </div>
        `;

        overlay.querySelectorAll('.decision-choice').forEach(btn => {
            btn.addEventListener('click', () => {
                if (countdownInterval) clearInterval(countdownInterval);
                resolveDecision(overlay, event, parseInt(btn.dataset.idx));
            });
        });
    }

    renderEvent();
    document.getElementById('game-container').appendChild(overlay);

    if (countdown > 0) {
        countdownInterval = setInterval(() => {
            countdown--;
            const label = overlay.querySelector('.decision-label');
            if (label) label.textContent = countdown > 0 ? `${countdown}s` : 'TIME UP';
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                resolveDecision(overlay, event, 0);
            }
        }, 1000);
    }
}

function resolveDecision(overlay, event, choiceIdx) {
    const choice = event.choices[choiceIdx];

    // Apply effects
    for (const [key, val] of Object.entries(choice.effects)) {
        if (key === 'oilFlow') SIM.oilFlow = Math.max(10, Math.min(100, SIM.oilFlow + val));
        else if (key === 'oilFlowProtection') {} // handled by stances
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
        // Character-specific resource effects
        else if (key === 'politicalCapital' || key === 'commandAuthority' || key === 'credibility' || key === 'baseEnthusiasm' || key === 'exposure') {
            SIM.uniqueResource = Math.max(0, Math.min(100, SIM.uniqueResource + val));
        }
    }

    // Apply contact trust effects (Kushner)
    if (choice.contactEffect && SIM.character.contacts) {
        const contact = SIM.character.contacts.find(c => c.id === choice.contactEffect.id);
        if (contact) {
            contact.trust = Math.max(0, Math.min(100, contact.trust + choice.contactEffect.trust));
            if (choice.contactEffect.trust > 0) {
                addHeadline(`${contact.name}: trust increased to ${contact.trust}`, 'good');
            }
        }
    }

    addHeadline(`Decision: ${event.title} — ${choice.text}`, 'normal');
    if (choice.flavor) addHeadline(choice.flavor, 'good');

    SIM.decisionHistory.push({
        id: event.id,
        title: event.title,
        choiceText: choice.text,
        day: SIM.day,
    });

    // Show result
    const box = overlay.querySelector('.decision-box');
    box.innerHTML = `
        <div class="decision-result">
            <h2>${choice.text.toUpperCase()}</h2>
            <p class="decision-flavor">${choice.flavor || ''}</p>
            <button class="decision-continue-btn">CONTINUE</button>
        </div>
    `;
    box.querySelector('.decision-continue-btn').addEventListener('click', () => {
        overlay.remove();
        SIM.decisionEventActive = false;
    });
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

    // Turning points
    const h = SIM.metricHistory;
    let turningPoints = '';
    if (h.length > 1) {
        let maxDrop = { metric: '', day: 0, delta: 0 };
        let maxSpike = { metric: '', day: 0, delta: 0 };
        for (let i = 1; i < h.length; i++) {
            if (!h[i].gauges || !h[i - 1].gauges) continue;
            for (const m of ['stability', 'economy', 'support', 'intel']) {
                const delta = (h[i].gauges[m] || 0) - (h[i - 1].gauges[m] || 0);
                if (delta < maxDrop.delta) maxDrop = { metric: m, day: h[i].day, delta };
                if (delta > maxSpike.delta) maxSpike = { metric: m, day: h[i].day, delta };
            }
        }
        if (maxDrop.day > 0) {
            turningPoints += `<div class="pm-turning"><span class="negative">Worst day:</span> ${gradeLabels[maxDrop.metric]} dropped ${Math.round(Math.abs(maxDrop.delta))} pts on Day ${maxDrop.day}</div>`;
        }
        if (maxSpike.day > 0) {
            turningPoints += `<div class="pm-turning"><span class="positive">Best day:</span> ${gradeLabels[maxSpike.metric]} rose ${Math.round(maxSpike.delta)} pts on Day ${maxSpike.day}</div>`;
        }
    }

    // Tips by lose condition
    let tipHtml = '';
    if (SIM.gameWon) {
        tipHtml = '<div class="tip-box tip-good">Strong performance. The strait is open. Try a different advisor for a completely different experience.</div>';
    } else if (SIM.warPath >= 5) {
        tipHtml = '<div class="tip-box tip-critical">Watch the Escalation Track. Every military card and incident adds pips. Use diplomacy to remove them.</div>';
    } else if (SIM.domesticApproval <= 15) {
        tipHtml = '<div class="tip-box tip-warning">Balance military action with domestic cards. Congressional briefings and media campaigns prevent approval collapse.</div>';
    } else if (SIM.polarization >= 90) {
        tipHtml = '<div class="tip-box tip-warning">Keep spending under control and approval high. Polarization rises when the public is divided on a costly war.</div>';
    } else if (SIM.internationalStanding <= 10) {
        tipHtml = '<div class="tip-box tip-warning">Coalition and UN cards protect international standing. Going it alone makes you a pariah.</div>';
    } else {
        // Character-specific tip
        const charTips = {
            trump: 'Your political capital is finite. Don\'t overplay your hand — Congress can block you.',
            hegseth: 'Command Authority is your lifeline. The Joint Chiefs respect results, not bravado.',
            kushner: 'Keep your exposure low. Every back-channel deal increases the risk of exposure.',
            asmongold: 'Credibility comes from good intel. Keep fog of war low to maintain trust.',
            fuentes: 'Your base needs constant feeding. Play America First cards regularly or they\'ll abandon you.',
        };
        const tip = charTips[SIM.character?.id] || '';
        if (tip) tipHtml = `<div class="tip-box tip-warning">${tip}</div>`;
    }

    // Decision recap (last 5)
    let decisionHtml = '';
    if (SIM.decisionHistory.length > 0) {
        const recent = SIM.decisionHistory.slice(-5);
        decisionHtml = '<div class="pm-decisions"><div class="pm-decisions-label">KEY DECISIONS</div>';
        for (const d of recent) {
            decisionHtml += `<div class="pm-decision-item">Day ${d.day}: ${d.title} — ${d.choiceText}</div>`;
        }
        decisionHtml += '</div>';
    }

    return `
        <div class="post-mortem">
            <div class="pm-section-label">PERFORMANCE</div>
            ${breakdownHtml}
            ${turningPoints}
            ${tipHtml}
            ${decisionHtml}
        </div>
    `;
}

// ======================== GAME OVER ========================

function showGameOverScreen() {
    const existing = document.getElementById('game-over-overlay');
    if (existing) existing.remove();

    const rating = calculateRating();
    const postMortem = generatePostMortem();

    const overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    overlay.className = 'fullscreen-overlay';
    overlay.innerHTML = `
        <div class="game-over-box ${SIM.gameWon ? 'victory' : 'defeat'}">
            <h1>${SIM.gameWon ? 'MISSION COMPLETE' : 'MISSION FAILED'}</h1>
            <div class="game-over-rating">
                <span class="go-grade ${rating.score >= 60 ? 'good' : rating.score >= 35 ? 'warning' : 'danger'}">${rating.grade}</span>
                <span class="go-grade-label">${rating.label} (${rating.score}/100)</span>
            </div>
            <p class="game-over-reason">${SIM.gameOverReason}</p>
            <div class="game-over-stats">
                <div class="stat-row"><span>Advisor</span><span>${SIM.character ? SIM.character.name : 'None'}</span></div>
                <div class="stat-row"><span>Days Survived</span><span>${SIM.day}</span></div>
                <div class="stat-row"><span>Escalation</span><span>${SIM.warPath}/5</span></div>
                <div class="stat-row"><span>Strait Open</span><span>${SIM.straitOpenDays}/14</span></div>
                <div class="stat-row"><span>Tankers Seized</span><span>${SIM.seizureCount}</span></div>
                <div class="stat-row"><span>Intercepts</span><span>${SIM.interceptCount}</span></div>
                <div class="stat-row"><span>Budget</span><span>$${Math.round(SIM.budget)}M</span></div>
                ${SIM.character?.uniqueResource ? `<div class="stat-row"><span>${SIM.character.uniqueResource.name}</span><span>${Math.round(SIM.uniqueResource)}</span></div>` : ''}
            </div>
            ${postMortem}
            <button id="btn-restart" class="restart-btn">RESTART [R]</button>
        </div>
    `;

    document.getElementById('game-container').appendChild(overlay);
    document.getElementById('btn-restart').addEventListener('click', restartGame);
}

// ======================== RESTART ========================

function restartGame() {
    ['game-over-overlay', 'decision-overlay', 'weekly-briefing-overlay', 'weekly-debrief-overlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) toastContainer.innerHTML = '';

    SIM.day = 1;
    SIM.hour = 0;
    SIM.week = 1;
    SIM.weekDay = 1;
    SIM.speed = 0;
    SIM.phase = 'briefing';
    SIM.oilFlow = 85;
    SIM.oilPrice = 90;
    SIM.tension = 20;
    SIM.domesticApproval = 65;
    SIM.internationalStanding = 70;
    SIM.conflictRisk = 5;
    SIM.budget = 1200;
    SIM.iranAggression = 25;
    SIM.iranEconomy = 55;
    SIM.iranStrategy = 'probing';
    SIM.fogOfWar = 75;
    SIM.diplomaticCapital = 40;
    SIM.proxyThreat = 15;
    SIM.chinaRelations = 50;
    SIM.russiaRelations = 40;
    SIM.polarization = 25;
    SIM.assassinationRisk = 0;
    SIM.warPath = 0;
    SIM.straitOpenDays = 0;
    SIM.lowApprovalDays = 0;
    SIM.lowStandingDays = 0;
    SIM.recentSeizureDays = [];
    SIM.tankers = [];
    SIM.navyShips = [];
    SIM.iranBoats = [];
    SIM.platforms = [];
    SIM.mines = [];
    SIM.drones = [];
    SIM.carrier = null;
    SIM.eventLog = [];
    SIM.headlines = [];
    SIM.effects = [];
    SIM.gameOver = false;
    SIM.gameOverReason = '';
    SIM.gameWon = false;
    SIM.activeStances = [];
    SIM.playedExclusives = [];
    SIM.crisisLevel = 0;
    SIM.crisisTimer = 0;
    SIM.consecutiveProvocations = 0;
    SIM.interceptCount = 0;
    SIM.seizureCount = 0;
    SIM.selectedEntity = null;
    SIM.selectedType = null;
    SIM.decisionEventActive = false;
    SIM.decisionHistory = [];
    SIM.lastDecisionDay = 0;
    SIM.metricHistory = [];
    SIM.weeklyReportActive = false;
    SIM.incidentMarkers = [];
    SIM.uniqueResource = SIM.character?.uniqueResource?.value || 0;
    SIM._leakCount = 0;

    // Reset character-specific state
    if (SIM.character) {
        if (SIM.character._addressNationUses !== undefined) SIM.character._addressNationUses = 0;
        if (SIM.character._withdrawalStreak !== undefined) SIM.character._withdrawalStreak = 0;
        if (SIM.character.specialAction) SIM.character.specialAction.cooldown = 0;
        if (SIM.character.contacts) {
            // Reset contact trust to defaults
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

    _lastAdvisorText = '';
    _lastTickerLen = 0;
    _lastEventLogLen = 0;

    initSimulation();
    updateGauges();
    showWeeklyBriefing();
}

// ======================== KEYBOARD SHORTCUTS ========================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (SIM.gameOver && e.key === 'r') {
            restartGame();
            return;
        }
        if (SIM.phase !== 'playing') return;
        if (SIM.decisionEventActive) return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                SIM.speed = SIM.speed === 0 ? 2 : 0;
                break;
            case 'Escape':
                SIM.selectedEntity = null;
                SIM.selectedType = null;
                break;
        }
    });
}

// ======================== HELPERS ========================

function formatEffectName(key) {
    const names = {
        tension: 'Tension',
        oilFlowProtection: 'Oil Protection',
        oilPrice: 'Oil Price',
        domesticApproval: 'Approval',
        internationalStanding: 'Standing',
        iranAggression: 'Iran Aggression',
        iranEconomy: 'Iran Economy',
        cost: 'Cost',
        conflictRisk: 'Conflict Risk',
        fogOfWar: 'Fog of War',
        diplomaticCapital: 'Diplomacy',
        proxyThreat: 'Proxy Threat',
        chinaRelations: 'China',
        russiaRelations: 'Russia',
        polarization: 'Polarization',
        assassinationRisk: 'Assassination Risk',
        warPath: 'Escalation',
        navalPresence: 'Naval Presence',
        blockadeLevel: 'Blockade',
        intelLevel: 'Intel Level',
        carrier: 'Carrier',
        politicalCapital: 'Political Capital',
        commandAuthority: 'Command Auth',
        credibility: 'Credibility',
        baseEnthusiasm: 'Base',
        exposure: 'Exposure',
    };
    return names[key] || key;
}
