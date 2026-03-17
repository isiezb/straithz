/**
 * Game — entry point, main loop, phase transitions
 */

(async function () {
    try {
        initSprites();

        const character = await showCharacterSelect();
        await showLoreScreen(character);

        SIM.character = character;
        initMap();
        initSimulation();
        initUI();

        // Show initial card pick (Day 1 — pick your first 3 cards)
        SIM.phase = 'initial_pick';
        showInitialPick();

        // Main loop
        let lastFrame = 0;
        const DAY_DURATION_MS = 6000; // 6 seconds per day of real time

        function gameLoop(timestamp) {
            try {
                const dt = timestamp - lastFrame;
                lastFrame = timestamp;

                // Always render the map
                renderMap();

                // Update gauges
                updateGauges();

                // Dayplay phase — advance simulation
                if (SIM.phase === 'dayplay' && !SIM.gameOver) {
                    SIM.dayPlayTimer += dt;

                    // Tick simulation sub-steps (entity movement, etc.)
                    const ticksPerFrame = 2;
                    for (let i = 0; i < ticksPerFrame; i++) {
                        tickSimulation();
                    }

                    // Check if day is complete
                    if (SIM.dayPlayTimer >= DAY_DURATION_MS) {
                        SIM.dayPlayTimer = 0;
                        advanceDay();
                    }
                }

                // Expire effects
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

/**
 * Called when a day completes during dayplay
 */
function advanceDay() {
    // Run daily update (metrics, entities, Iran AI)
    dailyUpdate();

    // Check win/lose
    if (checkWinLose()) return;

    // If dailyUpdate triggered a seizure decision, don't stack another event
    if (SIM.decisionEventActive) return;

    // Check for consequence events
    const event = checkConsequenceEvents();
    if (event) {
        SIM.phase = 'event';
        SIM.decisionEventActive = true;
        showDecisionEvent(event);
        return;
    }

    // Go directly to next day's report
    advanceToMorning();
}

/**
 * Called after overnight summary dismissed or auto-advance
 */
function advanceToMorning() {
    SIM.day++;
    SIM.hour = 0;
    SIM.weekDay = ((SIM.day - 1) % 7) + 1;
    SIM.week = Math.floor((SIM.day - 1) / 7) + 1;
    SIM.phase = 'morning';
    showDailyReport();
}

/**
 * Called after morning brief — start playing the day
 */
function startDayPlay() {
    SIM.phase = 'dayplay';
    SIM.dayPlayTimer = 0;
    SIM.prevGauges = calculateGauges();
    if (typeof showQuickActions === 'function') showQuickActions();
}
