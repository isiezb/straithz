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
 *   options.portrait  — image path or character/NPC ID for inline portrait
 */

// ======================== PORTRAIT REGISTRY ========================

const PORTRAIT_REGISTRY = {
    // Player characters
    trump:      'assets/trump.png',
    hegseth:    'assets/pete.png',
    kushner:    'assets/kushner.png',
    asmongold:  'assets/asmongold.png',
    fuentes:    'assets/nick.png',

    // Character variants (angry/positive)
    'trump-angry':      'assets/trump-angry.png',
    'trump-positive':   'assets/trump-smug.png',
    'hegseth-angry':    'assets/pete-angry.png',
    'hegseth-positive': 'assets/pete.png',
    'kushner-angry':    'assets/kushner.png',
    'kushner-positive': 'assets/kushner-scheming.png',
    'asmongold-angry':  'assets/asmongold.png',
    'asmongold-positive': 'assets/asmongold-hype.png',
    'fuentes-angry':    'assets/nick.png',
    'fuentes-positive': 'assets/nick.png',

    // Iranian NPCs
    tangsiri:   'assets/iran-tangsiri.png',
    araghchi:   'assets/iran-araghchi.png',
    mojtaba:    'assets/iran-mojtaba.png',

    // Flags (for generic / institutional speakers)
    us:         'assets/us-flag.png',
    iran:       'assets/iran-flag.png',
    domestic:   'assets/us-flag.png',

    // Advisor name lookups (map common briefing advisor names to portraits)
    'CIA Director':         'assets/us-flag.png',
    'DNI':                  'assets/us-flag.png',
    'SecDef':               'assets/us-flag.png',
    'SecState':             'assets/us-flag.png',
    'National Security Advisor': 'assets/us-flag.png',
    'NSA Director':         'assets/us-flag.png',
    'Joint Chiefs Chair':   'assets/us-flag.png',
    'CENTCOM Commander':    'assets/us-flag.png',
    'Press Secretary':      'assets/us-flag.png',
    'Chief of Staff':       'assets/us-flag.png',
    'Treasury Secretary':   'assets/us-flag.png',
    'Energy Secretary':     'assets/us-flag.png',
    'Your advisor':         'assets/us-flag.png',

    // Iranian names for dialogue
    'Araghchi':   'assets/iran-araghchi.png',
    'Tangsiri':   'assets/iran-tangsiri.png',
    'Mojtaba':    'assets/iran-mojtaba.png',
    'IRGC':       'assets/iran-flag.png',
    'Tehran':     'assets/iran-flag.png',
};

/**
 * Resolve a portrait option to an image path.
 * Accepts: image path, character ID, speaker name, or null.
 */
function _resolvePortrait(portrait, speaker) {
    // Direct path
    if (portrait && portrait.indexOf('/') !== -1) return portrait;
    // Registry lookup by portrait key
    if (portrait && PORTRAIT_REGISTRY[portrait]) return PORTRAIT_REGISTRY[portrait];
    // Fallback: try speaker name
    if (speaker && PORTRAIT_REGISTRY[speaker]) return PORTRAIT_REGISTRY[speaker];
    return null;
}

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
    _clearSceneImage(0);
}

// ======================== INTERNALS ========================

function _pushEntry(type, text, opts) {
    const portraitSrc = (type === 'scene' || type === 'dialogue' || (type === 'alert' && opts.portrait))
        ? _resolvePortrait(opts.portrait, opts.speaker)
        : null;

    const entry = {
        type: type,
        text: text,
        hour: SIM.hour || 0,
        day: SIM.day || 1,
        time: Date.now(),
        speaker: opts.speaker || null,
        metric: opts.metric || null,
        delta: opts.delta || null,
        level: opts.level || 'normal',
        portrait: portraitSrc
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
    const portraitHtml = entry.portrait
        ? `<img class="nf-portrait" src="${entry.portrait}" alt="" draggable="false">`
        : '';
    const hasPortrait = !!entry.portrait;
    if (hasPortrait) el.classList.add('nf-has-portrait');

    switch (entry.type) {
        case 'scene':
            el.innerHTML = portraitHtml
                + `<div class="nf-text-body"><span class="nf-time">${timestamp}</span><span class="nf-scene-text">${entry.text}</span></div>`;
            break;

        case 'dialogue':
            el.innerHTML = portraitHtml
                + `<div class="nf-text-body"><span class="nf-time">${timestamp}</span>`
                + `<span class="nf-speaker">${entry.speaker || 'UNKNOWN'}:</span> `
                + `<span class="nf-dialogue-text">\u201C${entry.text}\u201D</span></div>`;
            break;

        case 'alert': {
            const cls = entry.level === 'critical' ? 'nf-alert-critical'
                      : entry.level === 'warning' ? 'nf-alert-warning'
                      : 'nf-alert-good';
            const prefix = entry.level === 'critical' ? '\u25A0 FLASH'
                         : entry.level === 'warning' ? '\u25B2 ALERT'
                         : '\u2713 UPDATE';
            if (hasPortrait) {
                el.innerHTML = portraitHtml
                    + `<div class="nf-text-body"><span class="nf-time">${timestamp}</span>`
                    + `<span class="nf-alert-prefix ${cls}">${prefix}</span> `
                    + `<span class="${cls}">${entry.text}</span></div>`;
            } else {
                el.innerHTML = `<span class="nf-time">${timestamp}</span>`
                    + `<span class="nf-alert-prefix ${cls}">${prefix}</span> `
                    + `<span class="${cls}">${entry.text}</span>`;
            }
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

// ======================== SCENE PANEL ========================

let _scenePanel = null;
let _sceneImg = null;

function getScenePanel() { return _scenePanel; }
let _sceneCaptionEl = null;
let _sceneTimeout = null;
let _sceneAmbientSrc = '';

/**
 * Show an image in the scene panel with crossfade.
 * @param {string} src — image path (or null to clear)
 * @param {object} [options]
 * @param {number} [options.duration] — ms to show (0 or omitted = persistent until replaced)
 * @param {number} [options.fadeIn] — ms crossfade (default 500)
 * @param {string} [options.caption] — optional text overlay
 * @param {number} [options.opacity] — image opacity (default 1)
 * @param {boolean} [options.ambient] — if true, this is ambient art (lower priority, dimmer)
 */
function showSceneImage(src, options) {
    if (!_scenePanel) return;
    const opts = options || {};
    const fadeMs = opts.fadeIn != null ? opts.fadeIn : 500;
    const opacity = opts.opacity != null ? opts.opacity : 1;

    // Clear any pending auto-hide
    if (_sceneTimeout) { clearTimeout(_sceneTimeout); _sceneTimeout = null; }

    // No source — show idle state
    if (!src) {
        _clearSceneImage(fadeMs);
        return;
    }

    // Create new image element for crossfade
    const newImg = document.createElement('img');
    newImg.className = 'sp-image sp-image-entering';
    newImg.alt = 'Scene';
    newImg.style.opacity = '0';
    newImg.style.transition = 'opacity ' + fadeMs + 'ms ease';
    newImg.draggable = false;

    newImg.onload = function () {
        // Fade out old image
        if (_sceneImg && _sceneImg.parentNode) {
            const old = _sceneImg;
            old.style.transition = 'opacity ' + fadeMs + 'ms ease';
            old.style.opacity = '0';
            setTimeout(function () { if (old.parentNode) old.remove(); }, fadeMs);
        }
        // Fade in new
        _scenePanel.querySelector('.sp-viewport').appendChild(newImg);
        // Force reflow then set opacity
        newImg.offsetHeight;
        newImg.style.opacity = String(opacity);
        newImg.classList.remove('sp-image-entering');
        _sceneImg = newImg;
    };

    newImg.onerror = function () {
        // Fallback to procedural placeholder
        if (typeof SPRITES !== 'undefined' && SPRITES.eventPlaceholder) {
            newImg.onerror = null;
            newImg.src = SPRITES.eventPlaceholder;
        }
    };

    newImg.src = src;

    // Caption
    if (_sceneCaptionEl) {
        _sceneCaptionEl.textContent = opts.caption || '';
        _sceneCaptionEl.style.display = opts.caption ? 'block' : 'none';
    }

    // Mark panel as active
    _scenePanel.classList.add('sp-active');

    // Auto-hide after duration
    if (opts.duration && opts.duration > 0) {
        _sceneTimeout = setTimeout(function () {
            _sceneTimeout = null;
            showSceneAmbient();
        }, opts.duration);
    }
}

/**
 * Show the current story arc image as ambient background at low opacity.
 */
function showSceneAmbient() {
    if (typeof getCurrentStoryArc !== 'function') return;
    const arc = getCurrentStoryArc();
    if (arc && arc.image) {
        _sceneAmbientSrc = arc.image;
        showSceneImage(arc.image, { opacity: 0.4, fadeIn: 800 });
    } else {
        _clearSceneImage(500);
    }
}

/**
 * Clear the scene panel to idle state.
 */
function clearSceneImage() {
    _clearSceneImage(300);
}

function _clearSceneImage(fadeMs) {
    if (!_scenePanel) return;
    if (_sceneImg && _sceneImg.parentNode) {
        const old = _sceneImg;
        old.style.transition = 'opacity ' + (fadeMs || 300) + 'ms ease';
        old.style.opacity = '0';
        setTimeout(function () { if (old.parentNode) old.remove(); }, fadeMs || 300);
        _sceneImg = null;
    }
    if (_sceneCaptionEl) {
        _sceneCaptionEl.textContent = '';
        _sceneCaptionEl.style.display = 'none';
    }
    _scenePanel.classList.remove('sp-active');
}

function _initScenePanel(centerPanel) {
    _scenePanel = document.createElement('div');
    _scenePanel.id = 'scene-panel';
    _scenePanel.innerHTML = `
        <div class="sp-viewport">
            <div class="sp-idle-bg"></div>
            <div class="sp-scanlines"></div>
        </div>
        <div class="sp-caption"></div>
    `;
    // Insert before the narrative feed
    centerPanel.insertBefore(_scenePanel, centerPanel.firstChild);
    _sceneCaptionEl = _scenePanel.querySelector('.sp-caption');
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
        // Create scene panel above narrative feed
        _initScenePanel(centerPanel);
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

    // --- Character-specific briefing line ---
    const characterNote = _pickCharacterBriefingLine(b.characterBriefing);

    return { advisor, opening, iranIntel, closer, characterNote, gauges: g, rating: r };
}

function _pickCharacterBriefingLine(charBriefings) {
    if (!charBriefings || !SIM.character) return null;
    const cb = charBriefings[SIM.character.id];
    if (!cb) return null;

    // Pick the most relevant line based on game state
    let pool = null;
    let advisorName = cb.advisor || 'Your advisor';

    if (SIM.domesticApproval > 60 && cb.highApproval) pool = cb.highApproval;
    else if (SIM.domesticApproval < 35 && cb.lowApproval) pool = cb.lowApproval;
    else if (SIM.budget < 200 && cb.budgetCrisis) pool = cb.budgetCrisis;
    else if (SIM.tension > 70 && cb.highTension) pool = cb.highTension;
    // Character-specific checks
    else if (SIM.character.id === 'kushner' && SIM.uniqueResource > 50 && cb.exposureRisk) pool = cb.exposureRisk;
    else if (SIM.character.id === 'asmongold' && cb.predictionTracker) pool = cb.predictionTracker;
    else if (SIM.character.id === 'fuentes' && cb.troopCount) pool = cb.troopCount;
    else if (SIM.character.id === 'hegseth' && cb.casualtyReport) pool = cb.casualtyReport;
    // Win available check
    else if (cb.winAvailable && _checkWinProximity()) pool = cb.winAvailable;
    else if (cb.noWin) pool = cb.noWin;

    if (!pool || pool.length === 0) return null;
    const line = pool[Math.floor(Math.random() * pool.length)];
    return { advisor: advisorName, text: line };
}

function _checkWinProximity() {
    if (!SIM.character || !SIM.character.scenario || !SIM.character.scenario.winConditions) return false;
    // Rough check: are any win conditions close to being met?
    for (const wc of SIM.character.scenario.winConditions) {
        if (wc.check && wc._days && wc._days > 0) return true;
    }
    return false;
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
