/**
 * Game — main loop, initialization
 */

(async function () {
    try {
        // Init sprites first (needed for character select)
        initSprites();

        // Show character select
        const character = await showCharacterSelect();

        // Show lore intro
        await showLoreScreen(character);

        // Store selected character
        SIM.character = character;

        // Render portrait in HUD
        const hudPortrait = document.getElementById('hud-portrait');
        if (hudPortrait && SPRITES[character.spriteKey]) {
            const canvas = document.createElement('canvas');
            canvas.width = 48;
            canvas.height = 48;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(SPRITES[character.spriteKey], 0, 0, 48, 48);
            hudPortrait.innerHTML = '';
            hudPortrait.appendChild(canvas);
            const nameEl = document.createElement('span');
            nameEl.className = 'hud-char-name';
            nameEl.textContent = character.name.split(' ').pop(); // last name
            hudPortrait.appendChild(nameEl);
        }

        // Init game
        initMap();
        initSimulation();
        if (character.applyBonus) character.applyBonus(SIM);
        initUI();

        // Log starting event
        logEvent('Advisor ' + character.name + ' selected. Set policies and press Play.', 'good');

        // Main loop
        let lastTick = 0;
        let lastPolicyRender = 0;
        const tickInterval = 100;

        function gameLoop(timestamp) {
            try {
                if (timestamp - lastTick >= tickInterval / Math.max(SIM.speed, 1)) {
                    tickSimulation();
                    lastTick = timestamp;
                }

                renderMap();
                updateHUD();
                updateEventLog();

                if (timestamp - lastPolicyRender >= 2000) {
                    lastPolicyRender = timestamp;
                    renderPolicyCards();
                }
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
