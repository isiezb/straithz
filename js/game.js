/**
 * Game — entry point, main loop, phase transitions
 */

(async function () {
    try {
        initSprites();

        await showTitleScreen();
        const character = await showCharacterSelect();
        await showLoreScreen(character);

        SIM.character = character;
        initMap();
        initSimulation();
        initUI();

        SIM.phase = 'morning';
        showDailyReport();

        let lastFrame = 0;

        function gameLoop(timestamp) {
            try {
                const dt = timestamp - lastFrame;
                lastFrame = timestamp;
                renderMap();
                updateGauges();

                // During dayplay, just tick entity movement (no auto-advance)
                if (SIM.phase === 'dayplay' && !SIM.gameOver) {
                    const ticksPerFrame = 2;
                    for (let i = 0; i < ticksPerFrame; i++) {
                        tickSimulation();
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
    showDailyReport();
}

function startDayPlay() {
    SIM.phase = 'dayplay';
    SIM.actionPoints = 5;
    SIM.prevGauges = calculateGauges();
    if (typeof showActionPanel === 'function') showActionPanel();
}
