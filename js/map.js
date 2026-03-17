/**
 * Map Renderer — draws the strait, entities, effects, tooltips on canvas
 * Uses procedural SC1-style sprites from sprites.js
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

    // Click handling for entity selection
    MAP.canvas.addEventListener('click', (e) => {
        const rect = MAP.canvas.getBoundingClientRect();
        const scaleX = MAP.width / rect.width;
        const scaleY = MAP.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        handleMapClick(x, y, MAP.width, MAP.height);
    });

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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, w, h);
    } else {
        drawProceduralMap(ctx, w, h);
    }

    // Shipping lanes
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

        // Selected highlight
        if (SIM.selectedEntity === plat) {
            drawSelectionBox(ctx, px, py, 28, '#ffaa44');
        }
    }

    // Tankers
    for (const t of SIM.tankers) {
        const pos = getLanePosition(t.lane, t.progress);
        const x = pos.x * w;
        const y = pos.y * h;

        // Wake effect
        drawWake(ctx, x, y, pos.angle, t.seized ? 0 : 1);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(pos.angle);
        const tankerSprite = t.lane.dir === 'out' ? (SPRITES.tankerLoaded || SPRITES.tanker) : SPRITES.tanker;
        ctx.drawImage(tankerSprite, -36, -14, 72, 28);
        ctx.restore();

        if (t.damaged && !t.seized) {
            ctx.fillStyle = '#ddaa44';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('DAMAGED', x - 20, y - 16);
            // Smoke effect
            ctx.fillStyle = `rgba(100, 100, 100, ${0.2 + Math.sin(Date.now() / 500) * 0.1})`;
            ctx.beginPath();
            ctx.arc(x + 5, y - 20 - Math.sin(Date.now() / 400) * 4, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        if (t.seized) {
            ctx.fillStyle = '#ff4d4d';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('SEIZED', x - 16, y - 16);

            // Red pulsing circle
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.5;
            ctx.strokeStyle = `rgba(255, 60, 60, ${pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(x, y + 4, 34, 12, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Selected highlight
        if (SIM.selectedEntity === t) {
            ctx.strokeStyle = '#ffcc44';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(x, y + 4, 34, 12, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Navy ships
    for (const ship of SIM.navyShips) {
        const x = ship.x * w;
        const y = ship.y * h;

        // Wake
        const navAngle = Math.atan2(ship.targetY * h - y, ship.targetX * w - x);
        drawWake(ctx, x, y, navAngle, 1.2);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(navAngle);
        ctx.drawImage(SPRITES.navy, -36, -14, 72, 28);
        ctx.restore();

        // Selection circle (SC1 style)
        const isSelected = SIM.selectedEntity === ship;
        ctx.strokeStyle = isSelected ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 255, 0, 0.4)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.ellipse(x, y + 4, 28, 10, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#44dd88';
        ctx.font = '8px monospace';
        ctx.fillText(ship.id, x - 20, y + 20);

        // Intercept line
        if (ship.intercepting) {
            const target = SIM.iranBoats.find(b => b.id === ship.intercepting);
            if (target) {
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 6]);
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(target.x * w, target.y * h);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    // Iran boats
    for (const boat of SIM.iranBoats) {
        const x = boat.x * w;
        const y = boat.y * h;

        const boatAngle = Math.atan2(boat.targetY * h - y, boat.targetX * w - x);
        drawWake(ctx, x, y, boatAngle, 0.8);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(boatAngle);
        ctx.drawImage(SPRITES.iranboat, -28, -12, 56, 24);
        ctx.restore();

        // Red selection circle — brighter if aggressive
        const isSelected = SIM.selectedEntity === boat;
        const aggAlpha = boat.aggressive ? 0.7 : 0.4;
        ctx.strokeStyle = isSelected ? 'rgba(255, 60, 60, 0.9)' : `rgba(255, 60, 60, ${aggAlpha})`;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 20, 7, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Targeting line to tanker
        if (boat.targeting) {
            const tanker = SIM.tankers.find(t => t.id === boat.targeting);
            if (tanker) {
                const tpos = getLanePosition(tanker.lane, tanker.progress);
                ctx.strokeStyle = 'rgba(255, 40, 40, 0.4)';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 4]);
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(tpos.x * w, tpos.y * h);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Label for aggressive boats
        if (boat.aggressive && !boat.fleeing) {
            ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
            ctx.font = '7px monospace';
            ctx.fillText(boat.id, x - 18, y + 16);
        }
    }

    // Mines (draw before effects)
    for (const mine of SIM.mines) {
        const mx = mine.x * w;
        const my = mine.y * h;
        if (SPRITES.mine) {
            ctx.drawImage(SPRITES.mine, mx - 12, my - 12, 24, 24);
        }
        // Pulsing danger indicator
        const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.4;
        ctx.fillStyle = `rgba(255, 60, 60, ${pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(mx, my, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Drones
    for (const drone of SIM.drones) {
        const dx = drone.x * w;
        const dy = drone.y * h;
        if (SPRITES.drone) {
            ctx.save();
            ctx.translate(dx, dy);
            const droneAngle = drone.angle + Math.PI / 2;
            ctx.rotate(droneAngle);
            ctx.globalAlpha = 0.8;
            ctx.drawImage(SPRITES.drone, -20, -12, 40, 24);
            ctx.globalAlpha = 1;
            ctx.restore();
        }
        // Scan circle
        ctx.strokeStyle = 'rgba(68, 170, 221, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(dx, dy, drone.radius * Math.min(w, h), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Label
        ctx.fillStyle = 'rgba(68, 170, 221, 0.5)';
        ctx.font = '7px monospace';
        ctx.fillText(drone.id, dx - 12, dy + 18);
    }

    // Aircraft carrier
    if (SIM.carrier) {
        const cx = SIM.carrier.x * w;
        const cy = SIM.carrier.y * h;
        const cAngle = Math.atan2(
            SIM.carrier.targetY * h - cy,
            SIM.carrier.targetX * w - cx
        );

        drawWake(ctx, cx, cy, cAngle, 2.0);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(cAngle);
        if (SPRITES.carrier) {
            ctx.drawImage(SPRITES.carrier, -48, -16, 96, 32);
        }
        ctx.restore();

        // Green selection circle
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 44, 14, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#44dd88';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(SIM.carrier.id, cx - 28, cy + 24);
    }

    // Visual effects (explosions, intercepts, etc.)
    for (const fx of SIM.effects) {
        drawEffect(ctx, fx, w, h);
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

    // Crisis border flash
    if (SIM.crisisLevel >= 2) {
        const pulse = Math.sin(Date.now() / 500) * 0.5 + 0.5;
        const alpha = pulse * 0.15 * SIM.crisisLevel;
        ctx.strokeStyle = `rgba(255, 30, 30, ${alpha})`;
        ctx.lineWidth = SIM.crisisLevel * 2;
        ctx.strokeRect(0, 0, w, h);
    }

    // Entity tooltip
    if (SIM.selectedEntity) {
        drawEntityTooltip(ctx, w, h);
    }
}

function drawWake(ctx, x, y, angle, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const wakeLen = 20 * scale;
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-wakeLen, -3 * scale);
    ctx.lineTo(-wakeLen - 12 * scale, -8 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-wakeLen, 3 * scale);
    ctx.lineTo(-wakeLen - 12 * scale, 8 * scale);
    ctx.stroke();

    // Small foam particles
    ctx.fillStyle = 'rgba(180, 220, 255, 0.1)';
    for (let i = 0; i < 3; i++) {
        const px = -wakeLen - 5 - i * 6;
        const py = (Math.sin(Date.now() / 300 + i * 2) * 3) * scale;
        ctx.fillRect(px, py - 1, 2, 2);
    }

    ctx.restore();
}

function drawSelectionBox(ctx, x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const s = size;
    const corner = 5;
    // Top-left
    ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x - s + corner, y - s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x - s, y - s + corner); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(x + s, y - s); ctx.lineTo(x + s - corner, y - s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s, y - s); ctx.lineTo(x + s, y - s + corner); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(x - s, y + s); ctx.lineTo(x - s + corner, y + s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s, y + s); ctx.lineTo(x - s, y + s - corner); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(x + s, y + s); ctx.lineTo(x + s - corner, y + s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s, y + s); ctx.lineTo(x + s, y + s - corner); ctx.stroke();
}

function drawEffect(ctx, fx, w, h) {
    const x = fx.x * w;
    const y = fx.y * h;
    const progress = 1 - (fx.life / fx.maxLife);
    const alpha = 1 - progress;

    if (fx.type === 'seizure') {
        // Red expanding ring
        const radius = 10 + progress * 40;
        ctx.strokeStyle = `rgba(255, 40, 40, ${alpha * 0.8})`;
        ctx.lineWidth = 3 - progress * 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner flash
        if (progress < 0.3) {
            ctx.fillStyle = `rgba(255, 100, 40, ${(0.3 - progress) * 2})`;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (fx.type === 'intercept') {
        // Green flash
        const radius = 8 + progress * 30;
        ctx.strokeStyle = `rgba(68, 221, 136, ${alpha * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    } else if (fx.type === 'explosion') {
        // Fiery explosion with particles
        const radius = 8 + progress * 50;
        // Outer ring
        ctx.strokeStyle = `rgba(255, 100, 20, ${alpha * 0.6})`;
        ctx.lineWidth = 4 - progress * 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        // Inner fire
        if (progress < 0.4) {
            const innerAlpha = (0.4 - progress) * 2;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, 15);
            grad.addColorStop(0, `rgba(255, 255, 100, ${innerAlpha})`);
            grad.addColorStop(0.5, `rgba(255, 120, 20, ${innerAlpha * 0.7})`);
            grad.addColorStop(1, `rgba(200, 40, 0, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(x - 20, y - 20, 40, 40);
        }
        // Smoke
        if (progress > 0.2) {
            const smokeAlpha = alpha * 0.3;
            ctx.fillStyle = `rgba(80, 80, 80, ${smokeAlpha})`;
            ctx.beginPath();
            ctx.arc(x + progress * 15, y - progress * 25, 6 + progress * 12, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (fx.type === 'crisis') {
        // Large red pulse
        const radius = 20 + progress * 80;
        ctx.strokeStyle = `rgba(255, 30, 30, ${alpha * 0.5})`;
        ctx.lineWidth = 4 - progress * 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawEntityTooltip(ctx, w, h) {
    const e = SIM.selectedEntity;
    const type = SIM.selectedType;
    let lines = [];
    let tx, ty;

    if (type === 'navy') {
        tx = e.x * w + 30;
        ty = e.y * h - 10;
        lines = [
            e.id,
            `Type: ${e.type === 'DDG' ? 'Destroyer' : e.type === 'CG' ? 'Cruiser' : 'Frigate'}`,
            `Status: ${e.intercepting ? 'INTERCEPTING' : 'Patrolling'}`,
            `Readiness: ${e.readiness}%`,
        ];
    } else if (type === 'iran') {
        tx = e.x * w + 24;
        ty = e.y * h - 10;
        lines = [
            e.id,
            `Status: ${e.fleeing ? 'FLEEING' : e.targeting ? 'TARGETING' : e.aggressive ? 'Aggressive' : 'Patrol'}`,
            e.targeting ? `Target: ${e.targeting}` : '',
        ].filter(Boolean);
    } else if (type === 'tanker') {
        const pos = getLanePosition(e.lane, e.progress);
        tx = pos.x * w + 34;
        ty = pos.y * h - 10;
        lines = [
            e.id,
            `Flag: ${e.flag}`,
            `Cargo: ${(e.cargo / 1000000).toFixed(1)}M bbl`,
            `Direction: ${e.lane.dir === 'in' ? 'Inbound' : 'Outbound'}`,
            e.seized ? 'STATUS: SEIZED' : '',
        ].filter(Boolean);
    } else if (type === 'platform') {
        tx = e.x * w + 28;
        ty = e.y * h - 10;
        lines = [
            'Oil Platform',
            `Status: ${e.active ? 'Active' : 'Offline'}`,
            `Health: ${e.health}%`,
        ];
    }

    if (lines.length === 0) return;

    // Keep tooltip on screen
    const boxW = 140;
    const boxH = lines.length * 14 + 10;
    if (tx + boxW > w - 280) tx -= boxW + 40;
    if (ty + boxH > h - 90) ty -= boxH;
    if (ty < 40) ty = 40;

    // Background
    ctx.fillStyle = 'rgba(10, 10, 10, 0.92)';
    ctx.strokeStyle = type === 'navy' ? '#44dd88' : type === 'iran' ? '#dd4444' : '#aabbcc';
    ctx.lineWidth = 1;
    ctx.fillRect(tx, ty, boxW, boxH);
    ctx.strokeRect(tx, ty, boxW, boxH);

    // Text
    ctx.font = '10px monospace';
    for (let i = 0; i < lines.length; i++) {
        const isHeader = i === 0;
        const isSeized = lines[i].includes('SEIZED') || lines[i].includes('INTERCEPTING') || lines[i].includes('TARGETING');
        ctx.fillStyle = isSeized ? '#dd4444' : isHeader ? '#ffffff' : '#88aa99';
        ctx.fillText(lines[i], tx + 6, ty + 14 + i * 14);
    }
}

function drawProceduralMap(ctx, w, h) {
    // Deep water with depth zones
    const waterGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.6);
    waterGrad.addColorStop(0, '#102844');
    waterGrad.addColorStop(0.4, '#0e2440');
    waterGrad.addColorStop(1, '#0a1a30');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, w, h);

    // Shallow water zones near coasts
    ctx.fillStyle = 'rgba(20, 60, 100, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.20);
    ctx.bezierCurveTo(w * 0.2, h * 0.30, w * 0.5, h * 0.38, w, h * 0.24);
    ctx.lineTo(w, h * 0.18);
    ctx.bezierCurveTo(w * 0.5, h * 0.32, w * 0.2, h * 0.25, 0, h * 0.15);
    ctx.closePath();
    ctx.fill();

    // Water ripples
    ctx.strokeStyle = 'rgba(40, 90, 160, 0.10)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 25; i++) {
        const ry = h * 0.25 + (i / 25) * h * 0.55;
        const offset = Math.sin(Date.now() / 3000 + i) * 8;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        for (let x = 0; x < w; x += 25) {
            ctx.lineTo(x, ry + Math.sin(x / 50 + Date.now() / 2500 + i * 0.7) * 2.5 + offset);
        }
        ctx.stroke();
    }

    // Iran (north) — with terrain gradient
    const iranGrad = ctx.createLinearGradient(0, 0, 0, h * 0.35);
    iranGrad.addColorStop(0, '#3a4530');
    iranGrad.addColorStop(0.6, '#2a3520');
    iranGrad.addColorStop(1, '#364428');
    ctx.fillStyle = iranGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h * 0.18);
    ctx.bezierCurveTo(w * 0.8, h * 0.22, w * 0.65, h * 0.28, w * 0.5, h * 0.32);
    ctx.bezierCurveTo(w * 0.4, h * 0.34, w * 0.25, h * 0.30, w * 0.15, h * 0.25);
    ctx.bezierCurveTo(w * 0.08, h * 0.22, 0, h * 0.20, 0, h * 0.15);
    ctx.closePath();
    ctx.fill();

    // Coast sand strip
    ctx.strokeStyle = 'rgba(200, 170, 100, 0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Mountain texture on Iran
    ctx.fillStyle = 'rgba(60, 50, 30, 0.15)';
    for (let i = 0; i < 12; i++) {
        const mx = w * (0.1 + i * 0.07);
        const my = h * (0.05 + Math.sin(i * 1.3) * 0.04);
        ctx.beginPath();
        ctx.moveTo(mx - 15, my + 10);
        ctx.lineTo(mx, my - 8);
        ctx.lineTo(mx + 15, my + 10);
        ctx.closePath();
        ctx.fill();
    }

    // Qeshm Island (in the strait)
    ctx.fillStyle = '#2a3520';
    ctx.beginPath();
    ctx.ellipse(w * 0.48, h * 0.36, w * 0.06, h * 0.02, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 170, 100, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Larak Island
    ctx.fillStyle = '#2a3520';
    ctx.beginPath();
    ctx.ellipse(w * 0.56, h * 0.38, w * 0.015, h * 0.01, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Hormuz Island
    ctx.fillStyle = '#2a3520';
    ctx.beginPath();
    ctx.ellipse(w * 0.52, h * 0.34, w * 0.012, h * 0.008, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iran label
    ctx.fillStyle = 'rgba(220, 180, 140, 0.5)';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('IRAN', w * 0.42, h * 0.10);

    // Bandar Abbas city marker
    ctx.fillStyle = 'rgba(255, 220, 120, 0.4)';
    ctx.beginPath();
    ctx.arc(w * 0.50, h * 0.29, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 180, 140, 0.35)';
    ctx.font = '8px monospace';
    ctx.fillText('Bandar Abbas', w * 0.50 + 6, h * 0.29 + 3);

    // UAE/Oman (south) — with terrain gradient
    const uaeGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
    uaeGrad.addColorStop(0, '#364428');
    uaeGrad.addColorStop(0.4, '#2a3520');
    uaeGrad.addColorStop(1, '#3a4530');
    ctx.fillStyle = uaeGrad;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h);
    ctx.lineTo(w, h * 0.75);
    ctx.bezierCurveTo(w * 0.85, h * 0.72, w * 0.7, h * 0.78, w * 0.55, h * 0.73);
    ctx.bezierCurveTo(w * 0.45, h * 0.70, w * 0.35, h * 0.75, w * 0.2, h * 0.80);
    ctx.bezierCurveTo(w * 0.1, h * 0.83, 0, h * 0.85, 0, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(200, 170, 100, 0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'rgba(220, 180, 140, 0.5)';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('UAE', w * 0.58, h * 0.88);
    ctx.fillText('OMAN', w * 0.22, h * 0.90);

    // Dubai/Fujairah markers
    ctx.fillStyle = 'rgba(255, 220, 120, 0.35)';
    ctx.beginPath();
    ctx.arc(w * 0.68, h * 0.76, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 180, 140, 0.3)';
    ctx.font = '8px monospace';
    ctx.fillText('Fujairah', w * 0.68 + 6, h * 0.76 + 3);

    // Muscat
    ctx.fillStyle = 'rgba(255, 220, 120, 0.35)';
    ctx.beginPath();
    ctx.arc(w * 0.15, h * 0.78, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 180, 140, 0.3)';
    ctx.font = '8px monospace';
    ctx.fillText('Muscat', w * 0.15 + 6, h * 0.78 + 3);

    // Island labels
    ctx.fillStyle = 'rgba(200, 170, 100, 0.25)';
    ctx.font = '7px monospace';
    ctx.fillText('Qeshm', w * 0.44, h * 0.35 - 6);

    // Water body labels
    ctx.fillStyle = 'rgba(100, 180, 255, 0.25)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('STRAIT OF HORMUZ', w * 0.34, h * 0.50);

    ctx.fillStyle = 'rgba(100, 180, 255, 0.15)';
    ctx.font = '10px monospace';
    ctx.fillText('PERSIAN GULF', w * 0.72, h * 0.55);
    ctx.fillText('GULF OF OMAN', w * 0.06, h * 0.65);

    // Grid overlay (subtle)
    ctx.strokeStyle = 'rgba(40, 80, 120, 0.05)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += w / 16) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
    }
    for (let gy = 0; gy < h; gy += h / 12) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
    }
}

function getLanePosition(lane, progress) {
    const pts = lane.points;
    const totalSegments = pts.length - 1;
    const clampedProgress = Math.max(0, Math.min(progress, 0.9999));
    const rawIdx = clampedProgress * totalSegments;
    const idx = Math.floor(rawIdx);
    const t = rawIdx - idx;

    const i = Math.min(idx, totalSegments - 1);
    const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t;
    const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
    const angle = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]);

    return { x, y, angle };
}
