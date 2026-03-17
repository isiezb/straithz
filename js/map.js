/**
 * Map Renderer — draws the strait, entities, and effects on canvas
 * Uses procedural SC1-style sprites from sprites.js
 * Falls back to loading external assets if available
 */

const MAP = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    assets: {},
    assetsLoaded: false,
};

function initMap() {
    MAP.canvas = document.getElementById('game-canvas');
    MAP.ctx = MAP.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Try to load map background image
    const mapImg = new Image();
    mapImg.onload = () => { MAP.assets.mapBg = mapImg; };
    mapImg.onerror = () => {};
    mapImg.src = 'assets/map-bg.png';
}

function resizeCanvas() {
    MAP.width = MAP.canvas.parentElement.clientWidth;
    MAP.height = MAP.canvas.parentElement.clientHeight;
    MAP.canvas.width = MAP.width;
    MAP.canvas.height = MAP.height;
}

function renderMap() {
    const ctx = MAP.ctx;
    const w = MAP.width;
    const h = MAP.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    if (MAP.assets.mapBg) {
        ctx.drawImage(MAP.assets.mapBg, 0, 0, w, h);
        // Darken slightly for better sprite visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, w, h);
    } else {
        drawProceduralMap(ctx, w, h);
    }

    // Shipping lanes (subtle dotted lines)
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.2)';
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
        const px = plat.x * w;
        const py = plat.y * h;
        ctx.drawImage(SPRITES.platform, px - 24, py - 24, 48, 48);
    }

    // Tankers
    for (const t of SIM.tankers) {
        const pos = getLanePosition(t.lane, t.progress);
        const x = pos.x * w;
        const y = pos.y * h;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(pos.angle);
        ctx.drawImage(SPRITES.tanker, -32, -12, 64, 24);
        ctx.restore();

        if (t.seized) {
            ctx.fillStyle = '#ff4d4d';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('SEIZED', x - 16, y - 16);
        }
    }

    // Navy ships
    for (const ship of SIM.navyShips) {
        const x = ship.x * w;
        const y = ship.y * h;

        ctx.save();
        ctx.translate(x, y);
        // Face toward target
        const navAngle = Math.atan2(ship.targetY * h - y, ship.targetX * w - x);
        ctx.rotate(navAngle);
        ctx.drawImage(SPRITES.navy, -32, -12, 64, 24);
        ctx.restore();

        // Selection circle (SC1 style)
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(x, y + 4, 28, 10, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#44dd88';
        ctx.font = '8px monospace';
        ctx.fillText(ship.id, x - 20, y + 20);
    }

    // Iran boats
    for (const boat of SIM.iranBoats) {
        const x = boat.x * w;
        const y = boat.y * h;

        ctx.save();
        ctx.translate(x, y);
        const boatAngle = Math.atan2(boat.targetY * h - y, boat.targetX * w - x);
        ctx.rotate(boatAngle);
        ctx.drawImage(SPRITES.iranboat, -24, -10, 48, 20);
        ctx.restore();

        // Red selection circle
        ctx.strokeStyle = 'rgba(255, 60, 60, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 20, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Tension overlay
    if (SIM.tension > 40) {
        const alpha = (SIM.tension - 40) / 200;
        ctx.fillStyle = `rgba(255, 30, 30, ${alpha})`;
        ctx.fillRect(0, 0, w, h);
    }

    // Fog of war
    if (SIM.fogOfWar > 50) {
        const fogAlpha = (SIM.fogOfWar - 50) / 300;
        for (let i = 0; i < 8; i++) {
            const fx = (Math.sin(Date.now() / 5000 + i * 2) * 0.15 + 0.5) * w;
            const fy = (Math.cos(Date.now() / 7000 + i * 3) * 0.15 + 0.4) * h;
            const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, 120);
            grad.addColorStop(0, `rgba(0, 0, 0, ${fogAlpha})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }
    }
}

function drawProceduralMap(ctx, w, h) {
    // Deep water
    const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
    waterGrad.addColorStop(0, '#0c1a30');
    waterGrad.addColorStop(0.5, '#102844');
    waterGrad.addColorStop(1, '#0c1a30');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, w, h);

    // Water ripples
    ctx.strokeStyle = 'rgba(40, 90, 160, 0.12)';
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

    // Iran (north) — SC1 terrain colors
    ctx.fillStyle = '#2a3520';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h * 0.18);
    ctx.bezierCurveTo(w * 0.8, h * 0.22, w * 0.65, h * 0.28, w * 0.5, h * 0.32);
    ctx.bezierCurveTo(w * 0.4, h * 0.34, w * 0.25, h * 0.30, w * 0.15, h * 0.25);
    ctx.bezierCurveTo(w * 0.08, h * 0.22, 0, h * 0.20, 0, h * 0.15);
    ctx.closePath();
    ctx.fill();

    // Iran coast highlight
    ctx.strokeStyle = 'rgba(180, 140, 80, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Iran label
    ctx.fillStyle = 'rgba(220, 180, 140, 0.5)';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('IRAN', w * 0.42, h * 0.12);

    // UAE/Oman (south)
    ctx.fillStyle = '#2a3520';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h);
    ctx.lineTo(w, h * 0.75);
    ctx.bezierCurveTo(w * 0.85, h * 0.72, w * 0.7, h * 0.78, w * 0.55, h * 0.73);
    ctx.bezierCurveTo(w * 0.45, h * 0.70, w * 0.35, h * 0.75, w * 0.2, h * 0.80);
    ctx.bezierCurveTo(w * 0.1, h * 0.83, 0, h * 0.85, 0, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(180, 140, 80, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'rgba(220, 180, 140, 0.5)';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('UAE', w * 0.58, h * 0.88);
    ctx.fillText('OMAN', w * 0.22, h * 0.90);

    ctx.fillStyle = 'rgba(100, 180, 255, 0.3)';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('STRAIT OF HORMUZ', w * 0.33, h * 0.50);

    ctx.fillStyle = 'rgba(100, 180, 255, 0.18)';
    ctx.font = '11px monospace';
    ctx.fillText('PERSIAN GULF', w * 0.72, h * 0.55);
    ctx.fillText('GULF OF OMAN', w * 0.06, h * 0.65);
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
