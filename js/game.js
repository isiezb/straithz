/**
 * Game — entry point, main loop, phase transitions
 */

(async function () {
    try {
        await loadGameData();
        hydrateCards();
        hydrateSimulation();
        hydrateUI();
        hydrateCharacters();
        initSprites();

        await showTitleScreen();
        const character = await showCharacterSelect();
        await showLoreScreen(character);

        SIM.character = character;
        initMap();
        initSimulation();
        initUI();
        initNarrativeFeed();

        SIM.phase = 'morning';
        showDailyReport();

        let lastFrame = 0;
        let _cpUpdateTimer = 0;

        function gameLoop(timestamp) {
            try {
                const dt = timestamp - lastFrame;
                lastFrame = timestamp;
                updateGauges();

                // During dayplay, tick entity movement + update center panel periodically
                if (SIM.phase === 'dayplay' && !SIM.gameOver) {
                    const ticksPerFrame = 2;
                    for (let i = 0; i < ticksPerFrame; i++) {
                        tickSimulation();
                    }
                    // Update center panel every ~500ms (not every frame)
                    _cpUpdateTimer += dt;
                    if (_cpUpdateTimer > 500) {
                        _cpUpdateTimer = 0;
                        if (typeof updateCenterPanel === 'function') updateCenterPanel();
                        if (typeof updateSituationPanel === 'function') updateSituationPanel();
                    }
                }

                SIM.effects = SIM.effects.filter(fx => {
                    fx.life--;
                    return fx.life > 0;
                });
            } catch (e) {
                console.error('Game loop error:', e);
            }
            requestAnimationFrame(gameLoop);
        }
        requestAnimationFrame(gameLoop);
    } catch (e) {
        console.error('Init error:', e);
        document.body.innerHTML = '<div style="color:red;padding:20px;font-family:monospace">Init Error: ' + e.message + '</div>';
    }
})();

function advanceDay() {
    SIM._prevWarPath = SIM.warPath;
    dailyUpdate();
    if (checkWinLose()) return;
    if (SIM.decisionEventActive) return;
    const event = checkConsequenceEvents();
    if (event) {
        SIM.phase = 'event';
        SIM.decisionEventActive = true;
        showDecisionEvent(event);
        return;
    }
    advanceToMorning();
}

function advanceToMorning() {
    SIM.day++;
    SIM.hour = 0;
    SIM.weekDay = ((SIM.day - 1) % 7) + 1;
    SIM.week = Math.floor((SIM.day - 1) / 7) + 1;
    SIM.phase = 'morning';
    // Add day separator to narrative feed
    if (typeof addNarrative === 'function') {
        _narrativeEntries.push({
            type: 'daybreak', text: '', hour: 0, day: SIM.day, time: Date.now(),
            speaker: null, metric: null, delta: null, level: 'normal'
        });
        if (_narrativeFeed) {
            const sep = document.createElement('div');
            sep.className = 'nf-entry nf-day-break';
            sep.innerHTML = `<span class="nf-day-break-line">\u2501\u2501\u2501 DAY ${SIM.day} \u2501\u2501\u2501</span>`;
            _narrativeFeed.appendChild(sep);
        }
    }
    if (typeof updateNarrativeHeader === 'function') updateNarrativeHeader();
    showDailyReport();
}

function startDayPlay() {
    SIM.phase = 'dayplay';
    SIM.actionPoints = 3;
    SIM.prevGauges = calculateGauges();
    if (typeof showActionPanel === 'function') showActionPanel();
    if (typeof updateCenterPanel === 'function') updateCenterPanel();
}
