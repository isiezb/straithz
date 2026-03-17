/**
 * Map Renderer — draws the strait, entities, and effects on canvas
 * Falls back to procedural rendering if assets aren't loaded
 */

const MAP = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    assets: {},
    assetsLoaded: false,
};

const ASSET_LIST = [
    { key: 'tanker', src: 'assets/tanker.png' },
    { key: 'navy', src: 'assets/navy.png' },
    { key: 'iranboat', src: 'assets/iranboat.png' },
    { key: 'platform', src: 'assets/platform.png' },
    { key: 'mapBg', src: 'assets/map-bg.png' },
];

function initMap() {
    MAP.canvas = document.getElementById('game-canvas');
    MAP.ctx = MAP.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    loadAssets();
}

function resizeCanvas() {
    MAP.width = MAP.canvas.parentElement.clientWidth;
    MAP.height = MAP.canvas.parentElement.clientHeight;
    MAP.canvas.width = MAP.width;
    MAP.canvas.height = MAP.height;
}

function loadAssets() {
    let loaded = 0;
    const total = ASSET_LIST.length;

    for (const asset of ASSET_LIST) {
        const img = new Image();
        img.onload = () => {
            MAP.assets[asset.key] = img;
            loaded++;
            if (loaded === total) MAP.assetsLoaded = true;
        };
        img.onerror = () => {
            loaded++;
            if (loaded === total) MAP.assetsLoaded = true;
        };
        img.src = asset.src;
    }
}

function renderMap() {
    const ctx = MAP.ctx;
    const w = MAP.width;
    const h = MAP.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background — asset or procedural
    if (MAP.assets.mapBg) {
        ctx.drawImage(MAP.assets.mapBg, 0, 0, w, h);
    } else {
        drawProceduralMap(ctx, w, h);
    }

    // Shipping lanes (subtle dotted lines)
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.15)';
    ctx.lineWidth = 1;
    for (const lane of SHIPPING_LANES) {
        ctx.beginPath();
        for (let i = 0; i < lane.points.length; i++) {
            const [lx, ly] = lane.points[i];
            if (i === 0) ctx.moveTo(lx * w, ly * h);
            else ctx.lineTo(lx * w, ly * h);
        }
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Oil platforms
    for (const plat of SIM.platforms) {
        if (MAP.assets.platform) {
            ctx.drawImage(MAP.assets.platform, plat.x * w - 16, plat.y * h - 16, 32, 32);
        } else {
            ctx.fillStyle = '#ffaa33';
            ctx.fillRect(plat.x * w - 6, plat.y * h - 6, 12, 12);
            ctx.strokeStyle = '#cc8800';
            ctx.lineWidth = 1;
            ctx.strokeRect(plat.x * w - 6, plat.y * h - 6, 12, 12);
        }
    }

    // Tankers
    for (const t of SIM.tankers) {
        const pos = getLanePosition(t.lane, t.progress);
        const x = pos.x * w;
        const y = pos.y * h;
        const angle = pos.angle;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        if (MAP.assets.tanker) {
            ctx.drawImage(MAP.assets.tanker, -20, -8, 40, 16);
        } else {
            // Procedural tanker
            ctx.fillStyle = t.seized ? '#ff4d4d' : '#88aacc';
            ctx.fillRect(-16, -5, 32, 10);
            ctx.fillStyle = t.seized ? '#cc0000' : '#6688aa';
            ctx.fillRect(-16, -5, 8, 10);
        }
        ctx.restore();

        // Seized indicator
        if (t.seized) {
            ctx.fillStyle = '#ff4d4d';
            ctx.font = '10px monospace';
            ctx.fillText('SEIZED', x - 14, y - 12);
        }
    }

    // Navy ships
    for (const ship of SIM.navyShips) {
        const x = ship.x * w;
        const y = ship.y * h;

        if (MAP.assets.navy) {
            ctx.drawImage(MAP.assets.navy, x - 20, y - 8, 40, 16);
        } else {
            ctx.fillStyle = '#4488ff';
            ctx.fillRect(x - 18, y - 6, 36, 12);
            ctx.fillStyle = '#2266dd';
            ctx.fillRect(x - 18, y - 6, 10, 12);
            // Flag
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 10, y - 10, 6, 4);
        }

        // Label
        ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';
        ctx.font = '8px monospace';
        ctx.fillText(ship.id, x - 16, y + 16);
    }

    // Iran boats
    for (const boat of SIM.iranBoats) {
        const x = boat.x * w;
        const y = boat.y * h;

        if (MAP.assets.iranboat) {
            ctx.drawImage(MAP.assets.iranboat, x - 12, y - 6, 24, 12);
        } else {
            ctx.fillStyle = '#dd4444';
            ctx.fillRect(x - 10, y - 4, 20, 8);
            ctx.fillStyle = '#aa2222';
            ctx.fillRect(x - 10, y - 4, 6, 8);
        }
    }

    // Tension overlay — red tint when tension is high
    if (SIM.tension > 40) {
        const alpha = (SIM.tension - 40) / 200;
        ctx.fillStyle = `rgba(255, 30, 30, ${alpha})`;
        ctx.fillRect(0, 0, w, h);
    }

    // Fog of war overlay
    if (SIM.fogOfWar > 50) {
        const fogAlpha = (SIM.fogOfWar - 50) / 300;
        // Patchy fog
        for (let i = 0; i < 8; i++) {
            const fx = (Math.sin(Date.now() / 5000 + i * 2) * 0.15 + 0.5) * w;
            const fy = (Math.cos(Date.now() / 7000 + i * 3) * 0.15 + 0.4) * h;
            const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, 120);
            grad.addColorStop(0, `rgba(10, 14, 23, ${fogAlpha})`);
            grad.addColorStop(1, 'rgba(10, 14, 23, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }
    }
}

function drawProceduralMap(ctx, w, h) {
    // Water
    const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
    waterGrad.addColorStop(0, '#0a1628');
    waterGrad.addColorStop(0.5, '#0d1f3c');
    waterGrad.addColorStop(1, '#0a1628');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle water ripples
    ctx.strokeStyle = 'rgba(30, 80, 140, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
        const ry = h * 0.3 + (i / 20) * h * 0.5;
        const offset = Math.sin(Date.now() / 3000 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        for (let x = 0; x < w; x += 30) {
            ctx.lineTo(x, ry + Math.sin(x / 60 + Date.now() / 2000 + i) * 3 + offset);
        }
        ctx.stroke();
    }

    // Iran (north landmass)
    ctx.fillStyle = '#1a2a1a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h * 0.18);
    ctx.bezierCurveTo(w * 0.8, h * 0.22, w * 0.65, h * 0.28, w * 0.5, h * 0.32);
    ctx.bezierCurveTo(w * 0.4, h * 0.34, w * 0.25, h * 0.30, w * 0.15, h * 0.25);
    ctx.bezierCurveTo(w * 0.08, h * 0.22, 0, h * 0.20, 0, h * 0.15);
    ctx.closePath();
    ctx.fill();

    // Iran border glow
    ctx.strokeStyle = 'rgba(255, 80, 80, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Iran label
    ctx.fillStyle = 'rgba(255, 100, 100, 0.4)';
    ctx.font = '14px monospace';
    ctx.fillText('IRAN', w * 0.45, h * 0.12);

    // UAE/Oman (south landmass)
    ctx.fillStyle = '#1a2a1a';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h);
    ctx.lineTo(w, h * 0.75);
    ctx.bezierCurveTo(w * 0.85, h * 0.72, w * 0.7, h * 0.78, w * 0.55, h * 0.73);
    ctx.bezierCurveTo(w * 0.45, h * 0.70, w * 0.35, h * 0.75, w * 0.2, h * 0.80);
    ctx.bezierCurveTo(w * 0.1, h * 0.83, 0, h * 0.85, 0, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(100, 200, 100, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // UAE/Oman labels
    ctx.fillStyle = 'rgba(100, 200, 100, 0.4)';
    ctx.font = '14px monospace';
    ctx.fillText('UAE', w * 0.6, h * 0.88);
    ctx.fillText('OMAN', w * 0.25, h * 0.90);

    // Strait label
    ctx.fillStyle = 'rgba(100, 180, 255, 0.25)';
    ctx.font = '11px monospace';
    ctx.fillText('STRAIT OF HORMUZ', w * 0.35, h * 0.50);

    // Persian Gulf label
    ctx.fillStyle = 'rgba(100, 180, 255, 0.15)';
    ctx.font = '11px monospace';
    ctx.fillText('PERSIAN GULF', w * 0.75, h * 0.55);

    // Gulf of Oman label
    ctx.fillStyle = 'rgba(100, 180, 255, 0.15)';
    ctx.fillText('GULF OF OMAN', w * 0.08, h * 0.65);
}

function getLanePosition(lane, progress) {
    const pts = lane.points;
    const totalSegments = pts.length - 1;
    const rawIdx = progress * totalSegments;
    const idx = Math.floor(rawIdx);
    const t = rawIdx - idx;

    const i = Math.min(idx, totalSegments - 1);
    const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t;
    const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
    const angle = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]);

    return { x, y, angle };
}
