/**
 * Game — phase-driven main loop
 * Phases: briefing → playing → debrief → repeat (13 weeks)
 */

(async function () {
    try {
        // Init sprites first
        initSprites();

        // Character select
        const character = await showCharacterSelect();
        await showLoreScreen(character);

        SIM.character = character;

        // Init unique resource from character
        if (character.uniqueResource) {
            SIM.uniqueResource = character.uniqueResource.value;
        }

        // Render advisor portrait in console
        const portrait = document.getElementById('advisor-portrait');
        if (portrait && SPRITES[character.spriteKey]) {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(SPRITES[character.spriteKey], 0, 0, 64, 64);
            portrait.innerHTML = '';
            portrait.appendChild(canvas);
            portrait._drawn = true;
        }
        const nameEl = document.getElementById('advisor-name');
        if (nameEl) nameEl.textContent = character.name;
        const titleEl = document.getElementById('advisor-title');
        if (titleEl) titleEl.textContent = character.title;

        // Init game systems
        initMap();
        initSimulation();
        initUI();

        addHeadline('Crisis begins. Advisor ' + character.name + ' reporting for duty.', 'good');

        // Show first weekly briefing
        showWeeklyBriefing();

        // Main loop
        let lastTick = 0;
        const tickInterval = 100;

        function gameLoop(timestamp) {
            try {
                // Only tick during playing phase
                if (SIM.phase === 'playing' && !SIM.gameOver) {
                    if (timestamp - lastTick >= tickInterval / Math.max(SIM.speed, 1)) {
                        tickSimulation();
                        lastTick = timestamp;
                    }
                }

                // Always render
                renderMap();
                updateGauges();
                updateNewsTicker();
                updateEventLog();
                updateAdvisorConsole();
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
