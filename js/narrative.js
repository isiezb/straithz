/**
 * Narrative Feed — scrollable terminal-style text log
 * Replaces the ticker/headline system as the primary information channel.
 *
 * Entry types:
 *   scene    — 2-4 sentence narrative prose (primary content)
 *   dialogue — quoted NPC speech with speaker attribution
 *   alert    — urgent one-liner in red/yellow
 *   stat     — subtle metric change indicator (always preceded by a scene)
 *   headline — news ticker style, single line
 *
 * Usage:  addNarrative(type, text, options)
 *   options.speaker   — (dialogue) NPC name
 *   options.metric    — (stat) metric key for color coding
 *   options.delta     — (stat) signed number
 *   options.level     — (alert/headline) 'critical' | 'warning' | 'good' | 'normal'
 *   options.silent    — suppress auto-scroll
 */

const _narrativeEntries = [];
let _narrativePanel = null;
let _narrativeFeed = null;
let _userScrolled = false;
let _lastStatHadScene = false;

// ======================== PUBLIC API ========================

function addNarrative(type, text, options) {
    if (!text && type !== 'stat') return;
    const opts = options || {};

    // Stat entries MUST follow a scene — buffer a generic scene if needed
    if (type === 'stat' && !_lastStatHadScene) {
        _pushEntry('scene', _generateStatContext(opts), {});
    }

    _pushEntry(type, text, opts);

    // Track scene/stat pairing
    if (type === 'scene' || type === 'dialogue') {
        _lastStatHadScene = true;
    } else if (type !== 'stat') {
        _lastStatHadScene = false;
    }
}

/**
 * Get all entries (for save/restore)
 */
function getNarrativeEntries() {
    return _narrativeEntries.slice();
}

/**
 * Clear all entries (for restart)
 */
function clearNarrative() {
    _narrativeEntries.length = 0;
    _lastStatHadScene = false;
    if (_narrativeFeed) _narrativeFeed.innerHTML = '';
}

// ======================== INTERNALS ========================

function _pushEntry(type, text, opts) {
    const entry = {
        type: type,
        text: text,
        hour: SIM.hour || 0,
        day: SIM.day || 1,
        time: Date.now(),
        speaker: opts.speaker || null,
        metric: opts.metric || null,
        delta: opts.delta || null,
        level: opts.level || 'normal'
    };

    _narrativeEntries.push(entry);

    // Render to DOM if feed exists
    if (_narrativeFeed) {
        const el = _renderEntry(entry);
        _narrativeFeed.appendChild(el);
        _autoScroll();
    }

    // Also push to legacy headline system so existing displays still work
    if (type === 'headline' || type === 'alert') {
        if (typeof SIM !== 'undefined' && SIM.headlines) {
            SIM.headlines.push({ text: text, level: opts.level || 'normal', day: SIM.day, hour: SIM.hour, time: Date.now() });
        }
    }
}

function _renderEntry(entry) {
    const el = document.createElement('div');
    el.className = 'nf-entry nf-' + entry.type;

    const timestamp = _formatTimestamp(entry.hour, entry.day);

    switch (entry.type) {
        case 'scene':
            el.innerHTML = `<span class="nf-time">${timestamp}</span><span class="nf-scene-text">${entry.text}</span>`;
            break;

        case 'dialogue':
            el.innerHTML = `<span class="nf-time">${timestamp}</span>`
                + `<span class="nf-speaker">${entry.speaker || 'UNKNOWN'}:</span> `
                + `<span class="nf-dialogue-text">\u201C${entry.text}\u201D</span>`;
            break;

        case 'alert': {
            const cls = entry.level === 'critical' ? 'nf-alert-critical'
                      : entry.level === 'warning' ? 'nf-alert-warning'
                      : 'nf-alert-good';
            const prefix = entry.level === 'critical' ? '\u25A0 FLASH'
                         : entry.level === 'warning' ? '\u25B2 ALERT'
                         : '\u2713 UPDATE';
            el.innerHTML = `<span class="nf-time">${timestamp}</span>`
                + `<span class="nf-alert-prefix ${cls}">${prefix}</span> `
                + `<span class="${cls}">${entry.text}</span>`;
            break;
        }

        case 'stat': {
            const sign = entry.delta > 0 ? '+' : '';
            const valStr = entry.delta != null ? ` (${sign}${entry.delta})` : '';
            const metricName = typeof formatEffectName === 'function' && entry.metric
                ? formatEffectName(entry.metric) : '';
            const cls = entry.delta > 0 ? 'nf-stat-up' : entry.delta < 0 ? 'nf-stat-down' : 'nf-stat-neutral';
            el.innerHTML = `<span class="nf-stat-indicator ${cls}">`
                + `${metricName}${valStr}</span>`;
            break;
        }

        case 'headline':
            el.innerHTML = `<span class="nf-time">${timestamp}</span>`
                + `<span class="nf-headline-text">${entry.text}</span>`;
            break;

        default:
            el.innerHTML = `<span class="nf-time">${timestamp}</span>${entry.text}`;
    }

    return el;
}

function _formatTimestamp(hour, day) {
    const h = Math.floor(Math.max(0, Math.min(23, hour)));
    const hStr = String(h).padStart(2, '0') + ':00';
    return `D${day} ${hStr}`;
}

function _autoScroll() {
    if (!_narrativeFeed || _userScrolled) return;
    // Defer so DOM has updated
    requestAnimationFrame(() => {
        if (_narrativeFeed) {
            _narrativeFeed.scrollTop = _narrativeFeed.scrollHeight;
        }
    });
}

function _generateStatContext(opts) {
    // Generic contextual scene for orphan stat entries
    const metric = opts.metric || '';
    const contexts = {
        tension: 'The situation room monitors flash as new data streams in.',
        oilFlow: 'Reports from the strait filter through the operations desk.',
        domesticApproval: 'Your aide sets down the latest polling memo.',
        internationalStanding: 'The State Department liaison updates the coalition board.',
        fogOfWar: 'An analyst adjusts the intelligence assessment on the wall display.',
        budget: 'The comptroller slides a revised budget sheet across the table.',
        iranAggression: 'Satellite imagery shows movement at Iranian naval bases.',
        conflictRisk: 'The threat board updates with new projections.'
    };
    return contexts[metric] || 'The room hums with activity as new information arrives.';
}

// ======================== DOM SETUP ========================

function initNarrativeFeed() {
    // Create the narrative panel element
    _narrativePanel = document.createElement('div');
    _narrativePanel.id = 'narrative-feed';
    _narrativePanel.innerHTML = `
        <div class="nf-header">
            <span class="nf-header-label">\u2588 OPERATIONAL LOG</span>
            <span class="nf-header-day">DAY ${SIM.day || 1}</span>
        </div>
        <div class="nf-feed" id="nf-feed-scroll"></div>
    `;

    // Insert into center panel, after cp-content area
    const centerPanel = document.getElementById('center-panel');
    if (centerPanel) {
        centerPanel.appendChild(_narrativePanel);
    }

    _narrativeFeed = document.getElementById('nf-feed-scroll');

    // Track user scroll (allow scrollback without fighting auto-scroll)
    if (_narrativeFeed) {
        _narrativeFeed.addEventListener('scroll', () => {
            const atBottom = _narrativeFeed.scrollHeight - _narrativeFeed.scrollTop - _narrativeFeed.clientHeight < 40;
            _userScrolled = !atBottom;
        });
    }

    // Render any entries that were added before DOM was ready
    _narrativeEntries.forEach(entry => {
        if (_narrativeFeed) {
            _narrativeFeed.appendChild(_renderEntry(entry));
        }
    });
    _autoScroll();
}

function updateNarrativeHeader() {
    if (!_narrativePanel) return;
    const dayEl = _narrativePanel.querySelector('.nf-header-day');
    if (dayEl) dayEl.textContent = 'DAY ' + (SIM.day || 1);
}

// ======================== MORNING BRIEFING GENERATOR ========================

const _usedOpenings = {};
const _usedClosers = {};

/**
 * Generate a narrative morning briefing based on current game state.
 * Returns { advisor, opening, iranIntel, closer, gauges }
 */
function generateMorningBriefing() {
    const b = DATA.briefings;
    if (!b) return null;

    // --- Pick advisor based on dominant concern ---
    const advisorPool = _pickAdvisorPool(b.advisorNames);
    const advisor = advisorPool[Math.floor(Math.random() * advisorPool.length)];

    // --- Evaluate conditions and rank by priority ---
    const conditions = _evaluateBriefingConditions();
    const openingKey = conditions.length > 0 ? conditions[0] : 'calmDay';
    const opening = _pickVariant(b.openings, openingKey, _usedOpenings);

    // --- Iran intel note ---
    const iranIntel = _pickIranIntel(b.iranIntel);

    // --- Closer (forward momentum) ---
    const closerKey = _pickCloserCondition();
    const closer = _pickVariant(b.closers, closerKey, _usedClosers);

    // --- Gauges (secondary) ---
    const g = typeof calculateGauges === 'function' ? calculateGauges() : { stability: 50, economy: 50, support: 50, intel: 50 };
    const r = typeof calculateRating === 'function' ? calculateRating() : { grade: 'C', score: 50 };

    return { advisor, opening, iranIntel, closer, gauges: g, rating: r };
}

function _evaluateBriefingConditions() {
    const conditions = [];
    const s = SIM;

    // Priority-ordered condition checks (most urgent first)
    if (s.warPath >= 5) conditions.push('totalWarFooting');
    if (s.tension > 85) conditions.push('criticalTension');
    if (s.budget < 50) conditions.push('budgetDire');
    if (s.conflictRisk > 70) conditions.push('conflictRiskHigh');

    // Recent seizure
    const recentSeizures = s.recentSeizureDays ? s.recentSeizureDays.filter(d => s.day - d <= 1) : [];
    if (recentSeizures.length > 0) conditions.push('seizureYesterday');

    // Yesterday's escalation
    if (s._prevWarPath !== undefined && s.warPath > s._prevWarPath) conditions.push('dayAfterStrike');

    if (s.internationalStanding < 25) conditions.push('internationalPariah');
    if (s.tension > 70) conditions.push('highTension');
    if (s.domesticApproval < 30) conditions.push('lowApproval');
    if (s.oilFlow < 30) conditions.push('lowOilFlow');
    if (s.budget < 200) conditions.push('budgetCrisis');
    if (s.warPath >= 3) conditions.push('highEscalation');
    if (s.iranAggression > 70) conditions.push('iranEscalating');
    if (s.fogOfWar > 70) conditions.push('highFogOfWar');
    if (s.polarization > 60) conditions.push('highPolarization');
    if (s.proxyThreat > 50) conditions.push('proxyThreats');
    if (s.oilFlow < 50) conditions.push('restrictedOilFlow');
    if (s.domesticApproval < 45) conditions.push('fallingApproval');
    if (s.chinaRelations < 30) conditions.push('chinaProblems');
    if (s.mines && s.mines.length > 0) conditions.push('minesThreat');
    if (s.carrier) conditions.push('carrierDeployed');

    // Positive conditions
    if (s.straitOpenDays > 5) conditions.push('straitOpening');
    if (s.diplomaticCapital > 60 && s.tension < 50) conditions.push('diplomaticProgress');
    if (s.internationalStanding > 70) conditions.push('strongCoalition');
    if (s.iranAggression < 30) conditions.push('iranBacked');

    // Composite conditions
    const badCount = (s.tension > 60 ? 1 : 0) + (s.domesticApproval < 40 ? 1 : 0) + (s.oilFlow < 40 ? 1 : 0) + (s.budget < 200 ? 1 : 0);
    if (badCount >= 3) conditions.push('everythingBad');
    const goodCount = (s.tension < 40 ? 1 : 0) + (s.domesticApproval > 55 ? 1 : 0) + (s.oilFlow > 60 ? 1 : 0) + (s.internationalStanding > 55 ? 1 : 0);
    if (goodCount >= 3) conditions.push('goodMomentum');

    // Time-based
    if (s.day < 5) conditions.push('earlyDays');
    else if (s.day >= 10 && s.day <= 20) conditions.push('midGame');
    else if (s.day > 25) conditions.push('lateGame');

    // Default
    if (conditions.length === 0) conditions.push('calmDay');

    return conditions;
}

function _pickCloserCondition() {
    const s = SIM;
    // Priority-ordered closer selection
    const badCount = (s.tension > 60 ? 1 : 0) + (s.domesticApproval < 40 ? 1 : 0) + (s.oilFlow < 40 ? 1 : 0);
    if (badCount >= 2) return 'urgent_action';
    if (s.warPath >= 3) return 'warning_escalation';
    if (s.budget < 200) return 'warning_budget';
    if (s.fogOfWar > 65) return 'recommend_intel';
    if (s.tension > 60) return 'recommend_diplomacy';
    if (s.iranAggression > 60) return 'recommend_military';
    if (s.domesticApproval < 40) return 'recommend_domestic';
    if (s.oilPrice > 130) return 'recommend_economic';
    if (s.tension < 40 && s.oilFlow > 50) return 'cautious_optimism';

    // Check deterioration
    const g = typeof calculateGauges === 'function' ? calculateGauges() : null;
    if (g && (g.stability < 30 || g.economy < 30)) return 'grim_outlook';

    return 'steady_course';
}

function _pickAdvisorPool(advisorNames) {
    if (!advisorNames) return ['Your advisor'];
    const s = SIM;
    // Pick pool based on dominant concern
    if (s.fogOfWar > 65 && advisorNames.intel) return advisorNames.intel;
    if (s.warPath >= 3 && advisorNames.military) return advisorNames.military;
    if (s.tension > 60 && s.diplomaticCapital > 30 && advisorNames.diplomatic) return advisorNames.diplomatic;
    if (s.domesticApproval < 40 && advisorNames.domestic) return advisorNames.domestic;
    return advisorNames.generic || ['Your advisor'];
}

function _pickIranIntel(iranIntel) {
    if (!iranIntel) return '';
    const moves = SIM.iranVisibleMoves || [];
    const lastMove = moves.length > 0 ? moves[moves.length - 1] : null;

    let pool;
    if (lastMove && lastMove.day >= SIM.day - 1) {
        pool = iranIntel[lastMove.type] || iranIntel.ambiguous || ['Iranian activity detected.'];
    } else {
        pool = iranIntel.none || ['No significant Iranian activity overnight.'];
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

function _pickVariant(section, key, history) {
    if (!section) return '';
    let pool = section[key];
    if (!pool || pool.length === 0) {
        // Fallback to calmDay/steady_course
        pool = section.calmDay || section.steady_course || Object.values(section)[0];
    }
    if (!pool || pool.length === 0) return '';

    let idx;
    if (pool.length === 1) {
        idx = 0;
    } else {
        const last = history[key];
        do { idx = Math.floor(Math.random() * pool.length); } while (idx === last && pool.length > 1);
    }
    history[key] = idx;
    return pool[idx];
}
