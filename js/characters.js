/**
 * Character Select Screen — with unique passive abilities
 */

const CHARACTERS = [
    {
        id: 'trump', name: 'Donald Trump', title: '45th & 47th President',
        spriteKey: 'portrait_trump',
        ability: 'Maximum Pressure',
        abilityDesc: 'Sanctions cost -30% and hit Iran economy harder.',
        applyBonus(sim) {
            // Applied in dailyUpdate
        },
    },
    {
        id: 'asmongold', name: 'Asmongold', title: 'Streamer & Analyst',
        spriteKey: 'portrait_asmongold',
        ability: 'Chat Reads Intel',
        abilityDesc: 'Fog of War decreases 25% faster. Events reveal more info.',
        applyBonus(sim) {},
    },
    {
        id: 'fuentes', name: 'Nick Fuentes', title: 'Political Commentator',
        spriteKey: 'portrait_fuentes',
        ability: 'America First',
        abilityDesc: 'Approval loss from military actions reduced by 40%.',
        applyBonus(sim) {},
    },
    {
        id: 'hegseth', name: 'Pete Hegseth', title: 'Secretary of Defense',
        spriteKey: 'portrait_hegseth',
        ability: 'Warrior Ethos',
        abilityDesc: 'Navy ships intercept at longer range. +20% readiness.',
        applyBonus(sim) {},
    },
    {
        id: 'kushner', name: 'Jared Kushner', title: 'Senior Advisor',
        spriteKey: 'portrait_kushner',
        ability: 'Back-Channel Deals',
        abilityDesc: 'Diplomacy cooldowns reduced by 3 days. +10 starting diplomatic capital.',
        applyBonus(sim) {
            sim.diplomaticCapital += 10;
        },
    },
];

function getCharacterBonus(key) {
    if (!SIM.character) return 0;
    switch (SIM.character.id) {
        case 'trump':
            if (key === 'sanctionsCostMult') return 0.7;
            if (key === 'sanctionsEconMult') return 1.5;
            break;
        case 'asmongold':
            if (key === 'fogReduction') return 1.25;
            break;
        case 'fuentes':
            if (key === 'approvalLossMult') return 0.6;
            break;
        case 'hegseth':
            if (key === 'interceptRange') return 1.3;
            if (key === 'readinessBonus') return 20;
            break;
        case 'kushner':
            if (key === 'diplomacyCooldownReduction') return 3;
            break;
    }
    return 0;
}

function showCharacterSelect() {
    return new Promise((resolve) => {
        const overlay = document.getElementById('char-select');
        overlay.style.display = 'flex';

        let selectedIdx = null;

        function render() {
            overlay.innerHTML = `
                <div class="char-select-box">
                    <h1>SELECT ADVISOR</h1>
                    <p class="char-subtitle">Choose your policy advisor for the Strait of Hormuz crisis</p>
                    <div class="char-grid">
                        ${CHARACTERS.map((ch, i) => `
                            <div class="char-card ${selectedIdx === i ? 'selected' : ''}" data-idx="${i}">
                                <canvas class="char-portrait" id="char-portrait-${i}" width="48" height="48"></canvas>
                                <div class="char-info">
                                    <div class="char-name">${ch.name}</div>
                                    <div class="char-title">${ch.title}</div>
                                </div>
                                ${selectedIdx === i ? `<div class="char-ability"><span class="ability-name">${ch.ability}</span><span class="ability-desc">${ch.abilityDesc}</span></div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <button class="begin-btn ${selectedIdx !== null ? 'ready' : ''}" id="begin-btn">
                        ${selectedIdx !== null ? '[ BEGIN SIMULATION ]' : '[ SELECT AN ADVISOR ]'}
                    </button>
                </div>
            `;

            // Draw portraits onto their canvases
            CHARACTERS.forEach((ch, i) => {
                const canvas = document.getElementById('char-portrait-' + i);
                if (canvas && SPRITES[ch.spriteKey]) {
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(SPRITES[ch.spriteKey], 0, 0, 48, 48);
                }
            });

            // Card click handlers
            overlay.querySelectorAll('.char-card').forEach(card => {
                card.addEventListener('click', () => {
                    selectedIdx = parseInt(card.dataset.idx);
                    render();
                });
            });

            // Begin button
            const beginBtn = document.getElementById('begin-btn');
            beginBtn.addEventListener('click', () => {
                if (selectedIdx !== null) {
                    overlay.style.display = 'none';
                    resolve(CHARACTERS[selectedIdx]);
                }
            });
        }

        render();
    });
}
