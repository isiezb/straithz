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

function initUI() {
    updateGauges();
    setupKeyboardShortcuts();
    _injectActionPanelStyles();
    initMusic();
    updateTickers();
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

function updateGauges() {
    const g = calculateGauges();
    setGauge('gauge-stability', g.stability);
    setGauge('gauge-economy', g.economy);
    setGauge('gauge-support', g.support);
    setGauge('gauge-intel', g.intel);

    // Day counter in HUD
    const dayEl = document.getElementById('hud-day');
    if (dayEl) dayEl.textContent = _getDateString();

    // Update tickers periodically
    if (SIM.day && typeof updateTickers === 'function') updateTickers();

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
        headlinesHtml = '<div class="morning-news-item critical">US-Israel strikes killed Khamenei. Iran retaliating with 500+ missiles and 2,000 drones. Strait under siege.</div>';
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
        <div class="term-header">${_getDateString()} \u2014 DAY ${SIM.day}</div>
        <div class="term-title">${_getBriefingTitle()}</div>
        <div class="term-line dim">"${_getMorningBrief()}" \u2014 ${SIM.character.name}</div>
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
    action.cooldown = action.cooldownDuration || 3;

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
    if (canvas) canvas.style.width = 'calc(100% - 280px)';
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

        panel.innerHTML = `
            <div class="ap-header">
                <div class="ap-title">ACTIONS</div>
                <div class="ap-points">AP: ${apDots}</div>
                <div class="ap-budget">${budgetStr}</div>
            </div>

            <div class="ap-scroll">
                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#44dd88">INTELLIGENCE</div>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 15 ? 'disabled' : ''}" data-action="gather-intel">GATHER INTEL <span class="ap-cost">$15M</span></button>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="analyze-threats">ANALYZE THREATS</button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#4488dd">DIPLOMACY</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="phone-call">MAKE PHONE CALL</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 10 ? 'disabled' : ''}" data-action="draft-proposal">DRAFT PROPOSAL <span class="ap-cost">$10M</span></button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#dd4444">MILITARY</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="reposition-fleet">REPOSITION FLEET</button>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="change-roe">CHANGE ROE <span class="ap-roe" style="color:${roeColor}">[${roeLabel}]</span></button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#aa88dd">DOMESTIC</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="press-conference">PRESS CONFERENCE</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 5 ? 'disabled' : ''}" data-action="brief-congress">BRIEF CONGRESS <span class="ap-cost">$5M</span></button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#ddaa44">ECONOMIC</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="adjust-sanctions">ADJUST SANCTIONS</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 25 ? 'disabled' : ''}" data-action="market-intervention">MARKET INTERVENTION <span class="ap-cost">$25M</span></button>
                </div>

                <div class="ap-category">
                    <div class="ap-cat-header" style="color:#dd4444">CRISIS</div>
                    <button class="ap-btn ${ap <= 0 ? 'disabled' : ''}" data-action="issue-ultimatum">ISSUE ULTIMATUM</button>
                    <button class="ap-btn ${ap <= 0 || SIM.budget < 20 ? 'disabled' : ''}" data-action="emergency-coalition">EMERGENCY COALITION <span class="ap-cost">$20M</span></button>
                </div>

                ${specialHtml}
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
    renderPanel();

    // Slide-in animation
    requestAnimationFrame(() => {
        panel.classList.add('visible');
    });
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
            const snippet = _intelSnippets[Math.floor(Math.random() * _intelSnippets.length)];
            toastMsg = snippet;
            toastLevel = 'good';
            addHeadline('Intelligence gathering operation conducted.', 'normal');
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

    // Check if AP exhausted
    if (SIM.actionPoints <= 0) {
        setTimeout(() => {
            _endDay();
        }, 600);
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
    advanceDay();
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

            // Apply effects
            _applyEffects(choice.effects);

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
    if (canvas) canvas.style.width = '';
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
    hideActionPanel();
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
            <div class="stat-row"><span>Escalation</span><span style="color:${_getEscalationColor()}">${_getEscalationName()} (${SIM.warPath}/5)</span></div>
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

    // Public ticker: recent headlines (last 8)
    const publicNews = SIM.headlines
        .filter(h => h.level !== 'normal')
        .slice(-8)
        .map(h => h.text)
        .join('  ///  ');

    // Intel ticker: fog-dependent
    let intelNews;
    if (SIM.fogOfWar > 70) {
        intelNews = 'INTEL DEGRADED \u2014 INCREASE SURVEILLANCE ASSETS  ///  Signal clarity: LOW  ///  Multiple unverified contacts  ///  Assessment confidence: MINIMAL';
    } else if (SIM.fogOfWar > 40) {
        const intelItems = [
            `Iran strategy: ${(SIM.iranStrategy || 'unknown').toUpperCase()}`,
            `Iran aggression index: ${Math.round(SIM.iranAggression)}`,
            `Proxy threat level: ${SIM.proxyThreat > 50 ? 'HIGH' : SIM.proxyThreat > 25 ? 'MODERATE' : 'LOW'}`,
            `IRGC naval assets tracked: ${SIM.iranBoats.length}`,
            `Active mines detected: ${SIM.mines.length}`,
            `FOG: ${Math.round(SIM.fogOfWar)}% \u2014 partial picture`,
        ];
        intelNews = intelItems.join('  ///  ');
    } else {
        const intelItems = [
            `Iran strategy: ${(SIM.iranStrategy || 'unknown').toUpperCase()}`,
            `Aggression: ${Math.round(SIM.iranAggression)} | Economy: ${Math.round(SIM.iranEconomy)}`,
            `IRGC boats: ${SIM.iranBoats.length} | Mines: ${SIM.mines.length}`,
            `Proxy threat: ${Math.round(SIM.proxyThreat)} | China relations: ${Math.round(SIM.chinaRelations)}`,
            `Nuclear risk: ${SIM.iranAggression > 70 ? 'ELEVATED' : 'BASELINE'}`,
            `Escalation: ${_getEscalationName()}`,
            `FOG: ${Math.round(SIM.fogOfWar)}% \u2014 good intel picture`,
        ];
        intelNews = intelItems.join('  ///  ');
    }

    // Duplicate for seamless scroll
    publicEl.innerHTML = publicNews ? `<span>${publicNews}  ///  ${publicNews}</span>` : '<span>No breaking news.</span>';
    intelEl.innerHTML = `<span>${intelNews}  ///  ${intelNews}</span>`;
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

// ======================== ACTION PANEL CSS ========================
// All action panel, interrupt, and floating number styles are in css/style.css

function _injectActionPanelStyles() {
    // Styles moved to css/style.css
}
