/**
 * Character Select Screen
 */

const CHARACTERS = [
    { id: 'trump', name: 'Donald Trump', title: '45th & 47th President', spriteKey: 'portrait_trump' },
    { id: 'asmongold', name: 'Asmongold', title: 'Streamer & Analyst', spriteKey: 'portrait_asmongold' },
    { id: 'fuentes', name: 'Nick Fuentes', title: 'Political Commentator', spriteKey: 'portrait_fuentes' },
    { id: 'hegseth', name: 'Pete Hegseth', title: 'Secretary of Defense', spriteKey: 'portrait_hegseth' },
    { id: 'kushner', name: 'Jared Kushner', title: 'Senior Advisor', spriteKey: 'portrait_kushner' },
];

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
