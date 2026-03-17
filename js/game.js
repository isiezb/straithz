/**
 * Game — main loop, initialization
 */

(function () {
    try {
        // Init
        initMap();
        initSimulation();
        initUI();

        // Log starting event
        logEvent('Simulation initialized. Set policies and press Play to begin.', 'good');

        // Main loop
        let lastTick = 0;
        const tickInterval = 100; // ms per simulation tick at 1x

        function gameLoop(timestamp) {
            try {
                // Tick simulation
                if (timestamp - lastTick >= tickInterval / Math.max(SIM.speed, 1)) {
                    tickSimulation();
                    lastTick = timestamp;
                }

                // Render every frame
                renderMap();
                updateHUD();
                updateEventLog();

                // Re-render policy cards every 2 seconds (for cooldown updates)
                if (Math.floor(timestamp / 2000) !== Math.floor((timestamp - 16) / 2000)) {
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
