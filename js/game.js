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
        // Set character-specific AIPAC starting value
        if (character.aipacStart !== undefined) {
            SIM.aipacPressure = character.aipacStart;
        }
        initMap();
        initSimulation();
        initUI();
        initNarrativeFeed();

        SIM.phase = 'morning';
        // Show situation room image for first morning briefing
        if (typeof showSceneImage === 'function') {
            showSceneImage('assets/situation-room.png', { fadeIn: 800, caption: 'THE SITUATION ROOM' });
        }
        showDailyReport();

        // Verify all event image references resolve to real files
        if (typeof verifyEventAssets === 'function') verifyEventAssets();

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
                    // Update side panels every ~500ms (not every frame)
                    _cpUpdateTimer += dt;
                    if (_cpUpdateTimer > 500) {
                        _cpUpdateTimer = 0;
                        if (typeof updateCharPanel === 'function') updateCharPanel();
                        if (typeof updateCardsPanel === 'function') updateCardsPanel();
                    }
                }

                // Render tactical map in sidebar
                if (typeof renderMap === 'function' && MAP.canvas && MAP.canvas.offsetParent !== null) {
                    renderMap();
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
    // Track day-start values for character mechanics
    SIM._dayStartWarPath = SIM.warPath;
    SIM._prevOilFlow = SIM.oilFlow;
    if (typeof showActionPanel === 'function') showActionPanel();
    if (typeof updateCharPanel === 'function') updateCharPanel();
    if (typeof updateCardsPanel === 'function') updateCardsPanel();
    // Show current story arc as ambient art during dayplay
    if (typeof showSceneAmbient === 'function') showSceneAmbient();
}
