/**
 * Character Select Screen — with unique passive abilities
 */

const CHARACTERS = [
    {
        id: 'trump', name: 'Donald Trump', title: '45th & 47th President',
        spriteKey: 'portrait_trump',
        ability: 'Maximum Pressure',
        abilityDesc: 'Sanctions cost -30% and hit Iran economy harder.',
        lore: 'January 2026. You never left. After a decisive re-election, the world expected stability. Then Iran seized three tankers in 72 hours. The Situation Room is yours. The generals are waiting. You\'ve dealt with Iran before \u2014 this time, you finish it.',
        applyBonus(sim) {
            // Applied in dailyUpdate
        },
    },
    {
        id: 'asmongold', name: 'Asmongold', title: 'Streamer & Analyst',
        spriteKey: 'portrait_asmongold',
        ability: 'Chat Reads Intel',
        abilityDesc: 'Fog of War decreases 25% faster. Events reveal more info.',
        lore: 'It started as a joke. A viral 14-hour stream dissecting Pentagon leaked documents got 2 million concurrent viewers. Then the SecDef DM\'d you. "We need someone who can process information faster than anyone alive." Now you\'re in a classified Discord with the Joint Chiefs. Chat is... concerned.',
        applyBonus(sim) {},
    },
    {
        id: 'fuentes', name: 'Nick Fuentes', title: 'Political Commentator',
        spriteKey: 'portrait_fuentes',
        ability: 'America First',
        abilityDesc: 'Approval loss from military actions reduced by 40%.',
        lore: 'The establishment failed. Three administrations, three failed Iran policies. When the crisis hit, the new populist coalition demanded someone outside the machine. You\'re the youngest national security advisor in history. The media hates you. The base loves you. Iran doesn\'t know what to make of you.',
        applyBonus(sim) {},
    },
    {
        id: 'hegseth', name: 'Pete Hegseth', title: 'Secretary of Defense',
        spriteKey: 'portrait_hegseth',
        ability: 'Warrior Ethos',
        abilityDesc: 'Navy ships intercept at longer range. +20% readiness.',
        lore: 'Two tours in Iraq. A Bronze Star. Years on Fox News calling out weak leadership. When the President needed a wartime SecDef, your phone rang at 0300. You\'ve trained for this your entire life. The brass respects you. Iran should too.',
        applyBonus(sim) {},
    },
    {
        id: 'kushner', name: 'Jared Kushner', title: 'Senior Advisor',
        spriteKey: 'portrait_kushner',
        ability: 'Back-Channel Deals',
        abilityDesc: 'Diplomacy cooldowns reduced by 3 days. +10 starting diplomatic capital.',
        lore: 'The Abraham Accords were just the beginning. When the strait crisis erupted, every Gulf leader had your personal number. The President trusts you more than the State Department. You don\'t need a title \u2014 you have relationships. And in the Middle East, relationships are everything.',
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

function showLoreScreen(character) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.id = 'lore-overlay';
        overlay.className = 'lore-overlay';

        overlay.innerHTML = `
            <div class="lore-box">
                <div class="lore-scanlines"></div>
                <canvas class="lore-portrait" id="lore-portrait" width="96" height="96"></canvas>
                <div class="lore-name">${character.name}</div>
                <div class="lore-title">${character.title}</div>
                <div class="lore-ability">${character.ability}</div>
                <div class="lore-text" id="lore-text"></div>
                <button class="lore-proceed-btn" id="lore-proceed" style="display:none">[ ENTER THE SITUATION ROOM ]</button>
            </div>
        `;

        document.getElementById('game-container').appendChild(overlay);

        // Draw portrait
        const canvas = document.getElementById('lore-portrait');
        if (canvas && SPRITES[character.spriteKey]) {
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(SPRITES[character.spriteKey], 0, 0, 96, 96);
        }

        // Typewriter effect
        const textEl = document.getElementById('lore-text');
        const proceedBtn = document.getElementById('lore-proceed');
        const fullText = character.lore || '';
        let charIdx = 0;
        let typing = true;

        function typeNext() {
            if (!typing) return;
            if (charIdx < fullText.length) {
                textEl.textContent += fullText[charIdx];
                charIdx++;
                setTimeout(typeNext, 30);
            } else {
                typing = false;
                proceedBtn.style.display = '';
            }
        }

        typeNext();

        // Click to skip typewriter
        overlay.addEventListener('click', (e) => {
            if (e.target === proceedBtn) return;
            if (typing) {
                typing = false;
                textEl.textContent = fullText;
                proceedBtn.style.display = '';
            }
        });

        proceedBtn.addEventListener('click', () => {
            overlay.remove();
            resolve();
        });
    });
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
