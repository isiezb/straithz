/**
 * UI Controller — Daily Desk terminal screens
 * All screens use the lore intro typewriter aesthetic
 * Phases: initial_pick → daily_report → dayplay → event → daily_report (loop)
 * Quick actions available during dayplay
 */

const TERMINAL = document.getElementById('terminal-overlay');

// Quick action cooldowns (reset each day)
let _quickActionCooldowns = { intel: false, press: false, emergency: false, skip: false };

function initUI() {
    updateGauges();
    setupKeyboardShortcuts();
}

// ======================== TERMINAL HELPERS ========================

function openTerminal(html) {
    hideQuickActions();
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

function updateGauges() {
    const g = calculateGauges();
    setGauge('gauge-stability', g.stability);
    setGauge('gauge-economy', g.economy);
    setGauge('gauge-support', g.support);
    setGauge('gauge-intel', g.intel);

    // Day counter in HUD
    const dayEl = document.getElementById('hud-day');
    if (dayEl) dayEl.textContent = 'DAY ' + SIM.day;

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
}

function setGauge(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const fill = el.querySelector('.gauge-fill');
    const valEl = el.querySelector('.gauge-value');
    if (fill) {
        fill.style.width = value + '%';
        fill.className = 'gauge-fill ' + (value >= 60 ? 'good' : value >= 35 ? 'warning' : 'danger');
    }
    if (valEl) {
        valEl.textContent = Math.round(value);
        valEl.className = 'gauge-value ' + (value >= 60 ? 'good' : value >= 35 ? 'warning' : 'danger');
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
            <div class="term-line dim" style="text-align:center;margin-top:8px">${selected.length}/${maxPicks} selected</div>
            <div class="term-btn-row">
                <button class="term-btn ${selected.length === maxPicks ? 'visible' : ''}" id="pick-confirm">
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
                if (selected.length !== maxPicks) return;
                applyStances(selected);
                closeTerminal();
                resetQuickActions();
                startDayPlay();
            });
        }
    }

    render();
}

/** Apply selected stances to SIM */
function applyStances(selected) {
    SIM.activeStances = selected.map(s => ({ cardId: s.card.id, funding: s.funding }));
    // Track activation day
    for (const s of selected) {
        if (!SIM.stanceActivationDay[s.card.id]) {
            SIM.stanceActivationDay[s.card.id] = SIM.day;
        }
    }
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
    for (const s of selected) {
        addHeadline(`Strategy deployed: ${s.card.name} (${s.funding})`, 'normal');
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

    // Headlines for current day
    const todayHeadlines = SIM.headlines.filter(h => h.day === SIM.day).slice(-5);
    let headlinesHtml;
    if (SIM.day === 1) {
        headlinesHtml = '<div class="morning-news-item critical">Crisis ongoing \u2014 Iran has seized three tankers in the Strait of Hormuz.</div>';
    } else if (todayHeadlines.length > 0) {
        headlinesHtml = todayHeadlines.map(h => `<div class="morning-news-item ${h.level}">${h.text}</div>`).join('');
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

    openTerminal(`
        <div class="term-header">DAILY REPORT \u2014 DAY ${SIM.day}</div>
        <div class="term-title">SITUATION ROOM</div>
        <div class="term-line dim">"${advisorQuote}" \u2014 ${SIM.character.name}</div>
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
            <div class="term-section-label">ACTIVE STRATEGY</div>
            ${stanceHtml || '<div class="term-line dim">No active strategies.</div>'}
        </div>

        <div class="term-section">
            <div class="term-section-label">STATUS</div>
            <div class="stat-row"><span>Escalation</span><span>${SIM.warPath}/5</span></div>
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
        resetQuickActions();
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
    action.cooldown = action.cooldownDuration || 3;

    addHeadline(`Special action: ${action.name}`, 'good');
    showToast(`${action.name} activated!`, 'good');
}

// ======================== ADJUST STRATEGY ========================

function showAdjustStrategy() {
    // Player can swap ONE card (with credibility cost)
    const hand = dealHand(SIM.character, SIM.week, SIM.playedExclusives);
    const allCards = [...STRATEGY_CARDS, ...Object.values(CHARACTER_BONUS_CARDS), ...Object.values(CONTACT_CARDS)];
    const catColors = { military: '#dd4444', diplomatic: '#4488dd', economic: '#ddaa44', intelligence: '#44dd88', domestic: '#aa88dd' };

    // Current stances
    const currentCards = SIM.activeStances.map(s => {
        return { card: allCards.find(c => c.id === s.cardId), funding: s.funding };
    }).filter(s => s.card);

    let removingIdx = null; // index in currentCards to remove
    let replacement = null; // {card, funding}

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
                // Remove old stance
                const removed = currentCards[removingIdx];
                SIM.activeStances = SIM.activeStances.filter(s => s.cardId !== removed.card.id);
                delete SIM.stanceActivationDay[removed.card.id];

                // Add new stance
                SIM.activeStances.push({ cardId: replacement.card.id, funding: replacement.funding });
                SIM.stanceActivationDay[replacement.card.id] = SIM.day;

                // Track exclusives
                const isBonus = Object.values(CHARACTER_BONUS_CARDS).some(b => b.id === replacement.card.id);
                if (isBonus || replacement.card.exclusive) {
                    if (!SIM.playedExclusives.includes(replacement.card.id)) SIM.playedExclusives.push(replacement.card.id);
                }

                addHeadline(`Strategy changed: ${removed.card.name} \u2192 ${replacement.card.name}`, 'warning');

                closeTerminal();
                resetQuickActions();
                startDayPlay();
            });
        }
    }

    render();
}

// ======================== QUICK ACTIONS (during dayplay) ========================

const _intelSnippets = [
    'SIGINT intercept: IRGC naval base showing increased activity.',
    'Satellite imagery: new missile battery deployed near Bandar Abbas.',
    'HUMINT report: Iranian commander expressing doubts about escalation.',
    'Intercepted comms: supply convoy scheduled for next 48 hours.',
    'Drone recon: mine-laying vessel spotted near shipping lane.',
    'Signal analysis: Iranian C2 network traffic spike detected.',
    'Asset report: internal regime debate over strait strategy.',
    'NSA intercept: Chinese tanker negotiating alternate route.',
];

function resetQuickActions() {
    _quickActionCooldowns = { intel: false, press: false, emergency: false, skip: false };
}

function showQuickActions() {
    hideQuickActions(); // clean up any existing panel

    const panel = document.createElement('div');
    panel.id = 'quick-actions';
    panel.style.cssText = 'position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:6px;z-index:900;';

    function renderButtons() {
        const intelDisabled = _quickActionCooldowns.intel || SIM.budget < 20;
        const pressDisabled = _quickActionCooldowns.press;
        const emergencyDisabled = _quickActionCooldowns.emergency;
        const skipDisabled = _quickActionCooldowns.skip;

        // Determine emergency action label
        let emergencyLabel = 'EMERGENCY CALL';
        if (SIM.tension > 60) emergencyLabel = 'EMERGENCY CALL: DE-ESCALATE';
        else if (SIM.oilFlow < 40) emergencyLabel = 'EMERGENCY CALL: OIL FLOW';

        panel.innerHTML = `
            <button class="qa-btn" id="qa-intel" ${intelDisabled ? 'disabled' : ''} style="${_btnStyle(intelDisabled)}">INTEL BRIEF ($20M)</button>
            <button class="qa-btn" id="qa-press" ${pressDisabled ? 'disabled' : ''} style="${_btnStyle(pressDisabled)}">PRESS STATEMENT</button>
            <button class="qa-btn" id="qa-emergency" ${emergencyDisabled ? 'disabled' : ''} style="${_btnStyle(emergencyDisabled)}">${emergencyLabel}</button>
            <button class="qa-btn" id="qa-skip" ${skipDisabled ? 'disabled' : ''} style="${_btnStyle(skipDisabled)}">SKIP >></button>
        `;

        // INTEL BRIEF
        const intelBtn = panel.querySelector('#qa-intel');
        if (intelBtn && !intelDisabled) {
            intelBtn.addEventListener('click', () => {
                _quickActionCooldowns.intel = true;
                SIM.budget -= 20;
                SIM.fogOfWar = Math.max(0, SIM.fogOfWar - 5);
                const snippet = _intelSnippets[Math.floor(Math.random() * _intelSnippets.length)];
                showToast(snippet, 'good');
                addHeadline('Intelligence brief requested.', 'normal');
                renderButtons();
            });
        }

        // PRESS STATEMENT
        const pressBtn = panel.querySelector('#qa-press');
        if (pressBtn && !pressDisabled) {
            pressBtn.addEventListener('click', () => {
                _quickActionCooldowns.press = true;
                SIM.domesticApproval = Math.min(100, SIM.domesticApproval + 3);
                SIM.internationalStanding = Math.max(0, SIM.internationalStanding - 1);
                showToast('Press statement issued. Domestic approval +3, Standing -1.', 'normal');
                addHeadline('White House issues press statement on strait crisis.', 'normal');
                renderButtons();
            });
        }

        // EMERGENCY CALL
        const emergencyBtn = panel.querySelector('#qa-emergency');
        if (emergencyBtn && !emergencyDisabled) {
            emergencyBtn.addEventListener('click', () => {
                _quickActionCooldowns.emergency = true;
                if (SIM.tension > 60) {
                    SIM.tension = Math.max(0, SIM.tension - 5);
                    SIM.iranAggression = Math.min(100, SIM.iranAggression + 2);
                    showToast('Emergency call: Tension -5, Iran aggression +2.', 'warning');
                    addHeadline('Emergency diplomatic channel activated.', 'normal');
                } else if (SIM.oilFlow < 40) {
                    SIM.oilFlow = Math.min(100, SIM.oilFlow + 5);
                    showToast('Emergency call: Oil flow +5.', 'good');
                    addHeadline('Emergency coordination restored partial oil flow.', 'normal');
                } else {
                    showToast('Emergency call placed. No immediate effect.', 'normal');
                }
                renderButtons();
            });
        }

        // SKIP DAY
        const skipBtn = panel.querySelector('#qa-skip');
        if (skipBtn && !skipDisabled) {
            skipBtn.addEventListener('click', () => {
                _quickActionCooldowns.skip = true;
                hideQuickActions();
                advanceDay();
            });
        }
    }

    document.body.appendChild(panel);
    renderButtons();
}

function _btnStyle(disabled) {
    if (disabled) {
        return 'background:#1a1a2e;color:#555;border:1px solid #333;padding:6px 12px;font-family:inherit;font-size:11px;cursor:not-allowed;text-transform:uppercase;letter-spacing:1px;';
    }
    return 'background:#0a1a12;color:#44dd88;border:1px solid #44dd88;padding:6px 12px;font-family:inherit;font-size:11px;cursor:pointer;text-transform:uppercase;letter-spacing:1px;';
}

function hideQuickActions() {
    const existing = document.getElementById('quick-actions');
    if (existing) existing.remove();
}

// ======================== DECISION EVENTS ========================

function showDecisionEvent(event) {
    hideQuickActions();
    let countdown = event.countdown || 0;
    let countdownInterval = null;

    function renderEvent() {
        const choicesHtml = event.choices.map((choice, i) => {
            const hints = Object.entries(choice.effects).map(([key, val]) => {
                if (val === 0) return '';
                const isNeg = ['tension', 'iranAggression', 'conflictRisk', 'fogOfWar', 'polarization', 'assassinationRisk', 'warPath', 'proxyThreat', 'exposure'].includes(key)
                    ? val > 0 : val < 0;
                const arrow = Math.abs(val) > 10 ? (val > 0 ? '\u25B2\u25B2' : '\u25BC\u25BC') : (val > 0 ? '\u25B2' : '\u25BC');
                return `<span class="${isNeg ? 'negative' : 'positive'}">${formatEffectName(key)} ${arrow}</span>`;
            }).filter(Boolean).join(' ');

            return `
                <button class="decision-choice" data-idx="${i}">
                    <span class="choice-text">${choice.text}</span>
                    <span class="choice-effects">${hints || 'No immediate effects'}</span>
                </button>
            `;
        }).join('');

        openTerminal(`
            ${countdown > 0 ? `<div class="decision-timer">${countdown}s</div>` : ''}
            <div class="term-header">DAY ${SIM.day} \u2014 DECISION REQUIRED</div>
            <div class="term-title">${event.title}</div>
            <div class="term-line" style="margin-bottom:16px">${event.description}</div>
            <div class="term-section">
                <div class="term-section-label">OPTIONS</div>
                ${choicesHtml}
            </div>
        `);

        TERMINAL.querySelectorAll('.decision-choice').forEach(btn => {
            btn.addEventListener('click', () => {
                if (countdownInterval) clearInterval(countdownInterval);
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
                resolveDecision(event, 0);
            }
        }, 1000);
    }
}

function resolveDecision(event, choiceIdx) {
    const choice = event.choices[choiceIdx];

    // Apply effects
    for (const [key, val] of Object.entries(choice.effects)) {
        if (key === 'oilFlow') SIM.oilFlow = Math.max(10, Math.min(100, SIM.oilFlow + val));
        else if (key === 'oilFlowProtection') {}
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
        else if (key === 'politicalCapital' || key === 'commandAuthority' || key === 'credibility' || key === 'baseEnthusiasm' || key === 'exposure') {
            SIM.uniqueResource = Math.max(0, Math.min(100, SIM.uniqueResource + val));
        }
    }

    // Contact trust effects (Kushner)
    if (choice.contactEffect && SIM.character.contacts) {
        const contact = SIM.character.contacts.find(c => c.id === choice.contactEffect.id);
        if (contact) {
            contact.trust = Math.max(0, Math.min(100, contact.trust + choice.contactEffect.trust));
            if (choice.contactEffect.trust > 0) addHeadline(`${contact.name}: trust increased to ${contact.trust}`, 'good');
        }
    }

    addHeadline(`Decision: ${event.title} \u2014 ${choice.text}`, 'normal');
    if (choice.flavor) addHeadline(choice.flavor, 'good');

    SIM.decisionHistory.push({
        id: event.id, title: event.title,
        choiceText: choice.text, day: SIM.day,
    });

    // Show result
    openTerminal(`
        <div class="term-header">DECISION MADE</div>
        <div class="term-title">${choice.text.toUpperCase()}</div>
        <div class="term-line" style="margin-top:12px">${choice.flavor || ''}</div>
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
    hideQuickActions();
    const rating = calculateRating();
    const postMortem = generatePostMortem();
    const gradeClass = rating.score >= 60 ? 'good' : rating.score >= 35 ? 'warning' : 'danger';

    openTerminal(`
        <div class="gameover-title ${SIM.gameWon ? 'victory' : 'defeat'}">
            ${SIM.gameWon ? 'MISSION COMPLETE' : 'MISSION FAILED'}
        </div>

        <div class="gameover-grade ${gradeClass}">${rating.grade}</div>
        <div class="gameover-reason">${SIM.gameOverReason}</div>

        <div class="term-section">
            <div class="term-section-label">FINAL STATS</div>
            <div class="stat-row"><span>Advisor</span><span>${SIM.character ? SIM.character.name : 'None'}</span></div>
            <div class="stat-row"><span>Days Survived</span><span>${SIM.day}</span></div>
            <div class="stat-row"><span>Escalation</span><span>${SIM.warPath}/5</span></div>
            <div class="stat-row"><span>Strait Open</span><span>${SIM.straitOpenDays}/14</span></div>
            <div class="stat-row"><span>Tankers Seized</span><span>${SIM.seizureCount}</span></div>
            <div class="stat-row"><span>Intercepts</span><span>${SIM.interceptCount}</span></div>
            <div class="stat-row"><span>Budget</span><span>$${Math.round(SIM.budget)}M</span></div>
            ${SIM.character && SIM.character.uniqueResource ? `<div class="stat-row"><span>${SIM.character.uniqueResource.name}</span><span>${Math.round(SIM.uniqueResource)}</span></div>` : ''}
        </div>

        <div class="term-section">
            <div class="term-section-label">PERFORMANCE</div>
            ${postMortem}
        </div>

        <div class="term-btn-row">
            <button class="term-btn" id="btn-restart">[ RESTART ]</button>
        </div>
    `);

    fadeInButtons(TERMINAL, 800);

    document.getElementById('btn-restart').addEventListener('click', restartGame);
}

// ======================== RESTART ========================

function restartGame() {
    closeTerminal();
    hideQuickActions();

    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) toastContainer.innerHTML = '';

    SIM.day = 1;
    SIM.hour = 0;
    SIM.week = 1;
    SIM.weekDay = 1;
    SIM.speed = 2;
    SIM.phase = 'initial_pick';
    SIM.dayPlayTimer = 0;
    SIM.stanceActivationDay = {};
    SIM.firedConsequences = [];
    SIM.pendingNews = [];
    SIM.prevGauges = null;
    SIM.oilFlow = 25;
    SIM.oilPrice = 145;
    SIM.tension = 72;
    SIM.domesticApproval = 55;
    SIM.internationalStanding = 50;
    SIM.conflictRisk = 35;
    SIM.budget = 900;
    SIM.iranAggression = 65;
    SIM.iranEconomy = 40;
    SIM.iranStrategy = 'escalatory';
    SIM.fogOfWar = 82;
    SIM.diplomaticCapital = 25;
    SIM.proxyThreat = 40;
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
    SIM.crisisLevel = 1;
    SIM.crisisTimer = 5;
    SIM.consecutiveProvocations = 3;
    SIM.interceptCount = 0;
    SIM.seizureCount = 0;
    SIM.decisionEventActive = false;
    SIM.decisionHistory = [];
    SIM.lastDecisionDay = 0;
    SIM.metricHistory = [];
    SIM.incidentMarkers = [];
    SIM.uniqueResource = SIM.character?.uniqueResource?.value || 0;
    SIM._leakCount = 0;
    SIM.warPath = 1;

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

    resetQuickActions();
    initSimulation();
    updateGauges();
    showInitialPick();
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

// ======================== HELPERS ========================

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
    };
    return names[key] || key;
}
