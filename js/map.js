/**
 * Situation Room Board — strategic overview map with symbolic overlays
 * Auto-narrating watch screen — no zone clicking
 * Incident markers accumulate, CNN ticker at bottom
 */

const MAP = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    assets: {},
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
    mapImg.src = 'assets/strait-map.png';
}

function resizeCanvas() {
    const rect = MAP.canvas.getBoundingClientRect();
    const newW = Math.round(rect.width);
    const newH = Math.round(rect.height);
    // Only update if size actually changed (avoids clearing canvas every frame)
    if (MAP.width !== newW || MAP.height !== newH) {
        MAP.width = newW;
        MAP.height = newH;
        MAP.canvas.width = MAP.width;
        MAP.canvas.height = MAP.height;
    }
}

function renderMap() {
    // Sync canvas resolution with CSS size every frame
    resizeCanvas();

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

    // --- Overlays (no entity sprites — just lane flow and markers) ---
    drawShippingLaneFlow(ctx, w, h);
    drawIncidentMarkers(ctx, w, h);

    // Day counter
    drawDayCounter(ctx, w, h);

    // Event flash card
    drawEventFlash(ctx, w, h);

    // Tension overlay — red tint as things heat up
    if (SIM.tension > 40) {
        const alpha = (SIM.tension - 40) / 200;
        ctx.fillStyle = `rgba(255, 30, 30, ${alpha})`;
        ctx.fillRect(0, 0, w, h);
    }

    // Crisis border flash
    if (SIM.crisisLevel >= 2) {
        const pulse = Math.sin(Date.now() / 500) * 0.5 + 0.5;
        const alpha = pulse * 0.15 * SIM.crisisLevel;
        ctx.strokeStyle = `rgba(255, 30, 30, ${alpha})`;
        ctx.lineWidth = SIM.crisisLevel * 2;
        ctx.strokeRect(0, 0, w, h);
    }
}

// --- Incident Markers (accumulate over time) ---

function drawIncidentMarkers(ctx, w, h) {
    if (!SIM.incidentMarkers || SIM.incidentMarkers.length === 0) return;

    for (const marker of SIM.incidentMarkers) {
        const mx = marker.x * w;
        const my = marker.y * h;
        const age = SIM.day - marker.day;
        const fadeAlpha = Math.max(0.15, 1 - age / 30);

        ctx.globalAlpha = fadeAlpha;

        if (marker.type === 'seizure') {
            ctx.fillStyle = '#dd4444';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('✕', mx - 4, my + 4);
        } else if (marker.type === 'intercept') {
            ctx.fillStyle = '#44dd88';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('✓', mx - 4, my + 4);
        } else if (marker.type === 'mine') {
            ctx.fillStyle = '#ddaa44';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('⚠', mx - 5, my + 4);
        }

        ctx.globalAlpha = 1;
    }
}

// --- Shipping Lane Flow Arrow ---

function drawShippingLaneFlow(ctx, w, h) {
    const flow = SIM.oilFlow;
    let color, glowColor;
    if (flow >= 75) { color = '#44dd88'; glowColor = 'rgba(68, 221, 136, 0.15)'; }
    else if (flow >= 50) { color = '#ddaa44'; glowColor = 'rgba(221, 170, 68, 0.12)'; }
    else if (flow >= 20) { color = '#dd4444'; glowColor = 'rgba(221, 68, 68, 0.12)'; }
    else { color = '#551111'; glowColor = 'rgba(85, 17, 17, 0.08)'; }

    const lineWidth = Math.max(1, (flow / 100) * 6);
    const alpha = Math.max(0.15, flow / 100);

    for (const lane of SHIPPING_LANES) {
        const pts = lane.points;

        // Glow
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = lineWidth + 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
            if (i === 0) ctx.moveTo(pts[i][0] * w, pts[i][1] * h);
            else ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
        }
        ctx.stroke();

        // Main lane line
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
            if (i === 0) ctx.moveTo(pts[i][0] * w, pts[i][1] * h);
            else ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Animated flowing dots
        if (flow > 10) {
            const time = Date.now() / 1500;
            const dotCount = Math.max(2, Math.floor(flow / 15));
            for (let d = 0; d < dotCount; d++) {
                const prog = ((time + d / dotCount) % 1);
                const pos = getLanePosition(lane, prog);
                const dotAlpha = 0.3 + Math.sin(prog * Math.PI) * 0.4;
                ctx.fillStyle = color;
                ctx.globalAlpha = dotAlpha * alpha;
                ctx.beginPath();
                ctx.arc(pos.x * w, pos.y * h, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // Direction arrow
        const mid = getLanePosition(lane, 0.5);
        const ahead = getLanePosition(lane, 0.55);
        const angle = Math.atan2((ahead.y - mid.y) * h, (ahead.x - mid.x) * w);
        ctx.save();
        ctx.translate(mid.x * w, mid.y * h);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // Blocked label
    if (flow < 20) {
        ctx.save();
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#dd4444';
        ctx.textAlign = 'center';
        const blink = Math.sin(Date.now() / 400) > 0 ? 1 : 0.3;
        ctx.globalAlpha = blink;
        ctx.fillText('BLOCKED', w * 0.48, h * 0.50);
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // Flow label
    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(`FLOW: ${Math.round(flow)}%`, w * 0.48, h * 0.55);
    ctx.restore();
}

// --- Draw Entity Sprites ---

function drawEntities(ctx, w, h) {
    const time = Date.now();

    // --- Tankers along shipping lanes ---
    for (const t of SIM.tankers) {
        const pos = getLanePosition(t.lane, t.progress);
        const px = pos.x * w;
        const py = pos.y * h;

        // Get direction for rotation
        const ahead = getLanePosition(t.lane, Math.min(t.progress + 0.02, 0.999));
        const angle = Math.atan2((ahead.y - pos.y) * h, (ahead.x - pos.x) * w);

        const sprite = t.seized ? SPRITES.tanker : (t.damaged ? SPRITES.tanker : (SPRITES.tankerLoaded || SPRITES.tanker));
        if (!sprite) continue;

        const scale = 0.28;
        const sw = sprite.width * scale;
        const sh = sprite.height * scale;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);

        if (t.seized) {
            // Red tint for seized
            ctx.globalAlpha = 0.5 + Math.sin(time / 400) * 0.3;
        } else if (t.damaged) {
            ctx.globalAlpha = 0.6;
        } else {
            ctx.globalAlpha = 0.85;
        }

        ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);

        // Seized indicator
        if (t.seized) {
            ctx.globalAlpha = Math.sin(time / 300) > 0 ? 1 : 0.4;
            ctx.fillStyle = '#dd4444';
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SEIZED', 0, -sh / 2 - 3);
        }

        // Escort indicator
        if (t.escorted) {
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = '#44dd88';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.arc(0, 0, sw / 2 + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // --- US Navy Ships ---
    for (const ship of SIM.navyShips) {
        const px = ship.x * w;
        const py = ship.y * h;
        const sprite = SPRITES.navy;
        if (!sprite) continue;

        const scale = 0.3;
        const sw = sprite.width * scale;
        const sh = sprite.height * scale;

        // Face toward target
        const angle = Math.atan2((ship.targetY - ship.y) * h, (ship.targetX - ship.x) * w);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
        ctx.restore();

        // Ship ID label
        ctx.save();
        ctx.font = '6px monospace';
        ctx.fillStyle = 'rgba(68, 221, 136, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(ship.id, px, py + sh / 2 + 8);
        ctx.restore();

        // Intercepting indicator
        if (ship.intercepting) {
            ctx.save();
            ctx.strokeStyle = 'rgba(68, 221, 136, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(px, py, sw / 2 + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    // --- IRGC Boats ---
    for (const boat of SIM.iranBoats) {
        const px = boat.x * w;
        const py = boat.y * h;
        const sprite = SPRITES.iranboat;
        if (!sprite) continue;

        const scale = 0.3;
        const sw = sprite.width * scale;
        const sh = sprite.height * scale;

        const angle = Math.atan2((boat.targetY - boat.y) * h, (boat.targetX - boat.x) * w);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.globalAlpha = boat.fleeing ? 0.5 : 0.85;
        ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
        ctx.restore();

        // Targeting indicator — pulsing red ring
        if (boat.targeting) {
            const pulse = Math.sin(time / 250) * 0.4 + 0.6;
            ctx.save();
            ctx.strokeStyle = `rgba(221, 68, 68, ${pulse})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px, py, sw / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Aggressive posture — small red triangle above
        if (boat.aggressive && !boat.fleeing) {
            ctx.save();
            ctx.fillStyle = 'rgba(221, 68, 68, 0.6)';
            ctx.beginPath();
            ctx.moveTo(px, py - sh / 2 - 6);
            ctx.lineTo(px + 3, py - sh / 2 - 2);
            ctx.lineTo(px - 3, py - sh / 2 - 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // --- Carrier ---
    if (SIM.carrier) {
        const c = SIM.carrier;
        const px = c.x * w;
        const py = c.y * h;
        const sprite = SPRITES.carrier;
        if (sprite) {
            const scale = 0.35;
            const sw = sprite.width * scale;
            const sh = sprite.height * scale;

            const angle = Math.atan2((c.targetY - c.y) * h, (c.targetX - c.x) * w);

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angle);
            ctx.globalAlpha = 0.9;
            ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
            ctx.restore();

            // Carrier label
            ctx.save();
            ctx.font = 'bold 7px monospace';
            ctx.fillStyle = '#ddaa44';
            ctx.textAlign = 'center';
            ctx.fillText('CSG EISENHOWER', px, py + sh / 2 + 10);
            ctx.restore();

            // Carrier patrol zone ring
            ctx.save();
            ctx.strokeStyle = 'rgba(221, 170, 68, 0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.arc(px, py, 45, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    // --- Drones (sprite version) ---
    for (const drone of SIM.drones) {
        const orbitAngle = time / 3000 + drone.x * 10;
        const dx = (drone.x + Math.cos(orbitAngle) * 0.02) * w;
        const dy = (drone.y + Math.sin(orbitAngle) * 0.02) * h;
        const sprite = SPRITES.drone;
        if (sprite) {
            const scale = 0.35;
            const sw = sprite.width * scale;
            const sh = sprite.height * scale;
            ctx.save();
            ctx.translate(dx, dy);
            ctx.rotate(orbitAngle + Math.PI / 2);
            ctx.globalAlpha = 0.7;
            ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
            ctx.restore();
        }

        // Orbit circle
        ctx.save();
        ctx.strokeStyle = 'rgba(68, 136, 221, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(drone.x * w, drone.y * h, drone.radius * Math.min(w, h), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    // --- Mines (sprite version) ---
    for (const mine of SIM.mines) {
        const mx = mine.x * w;
        const my = mine.y * h;
        const sprite = SPRITES.mine;
        if (sprite) {
            const scale = 0.5;
            const sw = sprite.width * scale;
            const sh = sprite.height * scale;
            const pulse = Math.sin(time / 400 + mx) * 0.2 + 0.7;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.drawImage(sprite, mx - sw / 2, my - sh / 2, sw, sh);
            ctx.restore();
        }

        // Danger radius
        ctx.save();
        ctx.strokeStyle = `rgba(221, 68, 68, 0.15)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mx, my, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // --- Summary counts (replacing old badge overlays) ---
    ctx.save();
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';

    // Navy count
    const ships = SIM.navyShips.length;
    const hasCarrier = SIM.carrier !== null;
    if (ships > 0 || hasCarrier) {
        ctx.fillStyle = 'rgba(68, 221, 136, 0.5)';
        ctx.fillText(`USN: ${ships}${hasCarrier ? ' +CSG' : ''}`, w * 0.82, h * 0.62);
    }

    // IRGC count
    const boats = SIM.iranBoats.length;
    if (boats > 0) {
        const isAggressive = SIM.iranAggression > 50;
        ctx.fillStyle = isAggressive ? 'rgba(221, 68, 68, 0.6)' : 'rgba(221, 136, 68, 0.5)';
        ctx.fillText(`IRGC: ${boats}`, w * 0.82, h * 0.37);
    }
    ctx.restore();
}

// --- Navy Presence Badge (legacy — kept for reference) ---

function drawNavyPresence(ctx, w, h) {
    const ships = SIM.navyShips.length;
    const hasCarrier = SIM.carrier !== null;
    const zx = w * 0.55;
    const zy = h * 0.62;

    if (ships === 0 && !hasCarrier) {
        ctx.save();
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(42, 106, 74, 0.4)';
        ctx.textAlign = 'center';
        ctx.fillText('NO NAVAL PRESENCE', zx, zy);
        ctx.restore();
        return;
    }

    const radius = 40 + ships * 4;
    const grad = ctx.createRadialGradient(zx, zy, 0, zx, zy, radius);
    grad.addColorStop(0, 'rgba(68, 221, 136, 0.06)');
    grad.addColorStop(1, 'rgba(68, 221, 136, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(zx - radius, zy - radius, radius * 2, radius * 2);

    ctx.fillStyle = '#44dd88';
    ctx.beginPath();
    ctx.moveTo(zx, zy - 8);
    ctx.lineTo(zx + 6, zy);
    ctx.lineTo(zx, zy + 8);
    ctx.lineTo(zx - 6, zy);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(68, 221, 136, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(zx, zy, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#44dd88';
    ctx.textAlign = 'center';
    ctx.fillText(`USN: ${ships} SHIPS`, zx, zy + 24);

    if (hasCarrier) {
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#ddaa44';
        ctx.fillText('CSG EISENHOWER', zx, zy + 34);
        ctx.strokeStyle = 'rgba(221, 170, 68, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(zx, zy, 22, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

// --- IRGC Threat Zone ---

function drawIRGCThreatZone(ctx, w, h) {
    const boats = SIM.iranBoats.length;
    const aggression = SIM.iranAggression;
    const isAggressive = aggression > 50;
    const hasTargeting = SIM.iranBoats.some(b => b.targeting);

    if (boats === 0) return;

    const zx = w * 0.35;
    const zy = h * 0.30;
    const zw = w * 0.25;
    const zh = h * 0.16;

    const threatAlpha = Math.min(0.15, aggression / 500);
    ctx.fillStyle = `rgba(221, 68, 68, ${threatAlpha})`;
    ctx.fillRect(zx, zy, zw, zh);

    if (isAggressive) {
        const pulse = Math.sin(Date.now() / 600) * 0.3 + 0.5;
        ctx.strokeStyle = `rgba(221, 68, 68, ${pulse * 0.5})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(zx, zy, zw, zh);
    }

    const cx = zx + zw * 0.5;
    const cy = zy + zh * 0.4;
    ctx.fillStyle = '#dd4444';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx + 7, cy + 5);
    ctx.lineTo(cx - 7, cy + 5);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#dd4444';
    ctx.textAlign = 'center';
    ctx.fillText(`IRGC: ${boats} BOATS`, cx, cy + 18);

    if (hasTargeting) {
        const blink = Math.sin(Date.now() / 300) > 0 ? 1 : 0.4;
        ctx.globalAlpha = blink;
        ctx.font = 'bold 8px monospace';
        ctx.fillText('ACTIVE THREAT', cx, cy + 28);
        ctx.globalAlpha = 1;
    } else if (isAggressive) {
        ctx.font = '8px monospace';
        ctx.fillStyle = '#dd8844';
        ctx.fillText('HOSTILE POSTURE', cx, cy + 28);
    }
    ctx.restore();
}

// --- Hazard Markers ---

function drawHazardMarkers(ctx, w, h) {
    // Hazard count labels (sprites drawn by drawEntities)
    if (SIM.mines.length > 0) {
        ctx.save();
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#dd4444';
        ctx.fillText(`MINES: ${SIM.mines.length}`, w * 0.42, h * 0.60);
        ctx.restore();
    }

    if (SIM.drones.length > 0) {
        ctx.save();
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#4488dd';
        ctx.fillText(`DRONES: ${SIM.drones.length}`, w * 0.58, h * 0.60);
        ctx.restore();
    }
}

// --- Oil Platforms ---

function drawPlatforms(ctx, w, h) {
    for (const plat of SIM.platforms) {
        const px = plat.x * w;
        const py = plat.y * h;

        if (SPRITES.platform) {
            ctx.drawImage(SPRITES.platform, px - 16, py - 16, 32, 32);
        }

        const statusColor = plat.active ? '#44dd88' : '#dd4444';
        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.arc(px + 12, py - 12, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- Status Info Panel (canvas overlay) ---

function drawStatusPanel(ctx, w, h) {
    const px = 10;
    const py = h - 108;
    const pw = 220;
    const ph = 50;

    ctx.fillStyle = 'rgba(10, 10, 10, 0.75)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(26, 58, 42, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, ph);

    ctx.save();
    ctx.font = '9px monospace';

    const tankerCount = SIM.tankers.filter(t => !t.seized).length;
    const seizedCount = SIM.tankers.filter(t => t.seized).length;
    const damagedCount = SIM.tankers.filter(t => t.damaged).length;

    ctx.fillStyle = '#44dd88';
    ctx.fillText(`TANKERS: ${tankerCount}`, px + 6, py + 14);
    ctx.fillStyle = seizedCount > 0 ? '#dd4444' : '#2a6a4a';
    ctx.fillText(`SEIZED: ${seizedCount}`, px + 90, py + 14);
    ctx.fillStyle = damagedCount > 0 ? '#ddaa44' : '#2a6a4a';
    ctx.fillText(`DMG: ${damagedCount}`, px + 160, py + 14);

    ctx.fillStyle = SIM.interceptCount > 0 ? '#44dd88' : '#2a6a4a';
    ctx.fillText(`INTERCEPTS: ${SIM.interceptCount}`, px + 6, py + 28);
    ctx.fillStyle = '#2a6a4a';
    ctx.fillText(`CRISIS: ${SIM.crisisLevel}`, px + 110, py + 28);

    const crisisLabels = ['NONE', 'ELEVATED', 'MAJOR', 'WAR FOOTING'];
    const crisisColors = ['#2a6a4a', '#ddaa44', '#dd8844', '#dd4444'];
    ctx.fillStyle = crisisColors[SIM.crisisLevel];
    ctx.fillText(`CRISIS: ${crisisLabels[SIM.crisisLevel]}`, px + 6, py + 42);

    ctx.restore();
}

// --- Effects ---

function drawEffect(ctx, fx, w, h) {
    const x = fx.x * w;
    const y = fx.y * h;
    const progress = 1 - (fx.life / fx.maxLife);
    const alpha = 1 - progress;

    if (fx.type === 'seizure') {
        const radius = 10 + progress * 40;
        ctx.strokeStyle = `rgba(255, 40, 40, ${alpha * 0.8})`;
        ctx.lineWidth = 3 - progress * 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (progress < 0.3) {
            ctx.fillStyle = `rgba(255, 100, 40, ${(0.3 - progress) * 2})`;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (fx.type === 'intercept') {
        const radius = 8 + progress * 30;
        ctx.strokeStyle = `rgba(68, 221, 136, ${alpha * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    } else if (fx.type === 'explosion') {
        const radius = 8 + progress * 50;
        ctx.strokeStyle = `rgba(255, 100, 20, ${alpha * 0.6})`;
        ctx.lineWidth = 4 - progress * 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (progress < 0.4) {
            const innerAlpha = (0.4 - progress) * 2;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, 15);
            grad.addColorStop(0, `rgba(255, 255, 100, ${innerAlpha})`);
            grad.addColorStop(0.5, `rgba(255, 120, 20, ${innerAlpha * 0.7})`);
            grad.addColorStop(1, `rgba(200, 40, 0, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(x - 20, y - 20, 40, 40);
        }
        if (progress > 0.2) {
            ctx.fillStyle = `rgba(80, 80, 80, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(x + progress * 15, y - progress * 25, 6 + progress * 12, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (fx.type === 'crisis') {
        const radius = 20 + progress * 80;
        ctx.strokeStyle = `rgba(255, 30, 30, ${alpha * 0.5})`;
        ctx.lineWidth = 4 - progress * 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// --- Procedural Map ---

function drawProceduralMap(ctx, w, h) {
    const waterGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.6);
    waterGrad.addColorStop(0, '#102844');
    waterGrad.addColorStop(0.4, '#0e2440');
    waterGrad.addColorStop(1, '#0a1a30');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, w, h);

    // Shallow water
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

    // Iran (north)
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
    ctx.strokeStyle = 'rgba(200, 170, 100, 0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Mountains
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

    // Islands
    ctx.fillStyle = '#2a3520';
    ctx.beginPath();
    ctx.ellipse(w * 0.48, h * 0.36, w * 0.06, h * 0.02, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 170, 100, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#2a3520';
    ctx.beginPath();
    ctx.ellipse(w * 0.56, h * 0.38, w * 0.015, h * 0.01, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2a3520';
    ctx.beginPath();
    ctx.ellipse(w * 0.52, h * 0.34, w * 0.012, h * 0.008, 0, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    ctx.fillStyle = 'rgba(220, 180, 140, 0.5)';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('IRAN', w * 0.42, h * 0.10);

    ctx.fillStyle = 'rgba(255, 220, 120, 0.4)';
    ctx.beginPath();
    ctx.arc(w * 0.50, h * 0.29, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 180, 140, 0.35)';
    ctx.font = '8px monospace';
    ctx.fillText('Bandar Abbas', w * 0.50 + 6, h * 0.29 + 3);

    // UAE/Oman (south)
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

    ctx.fillStyle = 'rgba(220, 180, 140, 0.5)';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('UAE', w * 0.58, h * 0.88);
    ctx.fillText('OMAN', w * 0.22, h * 0.90);

    ctx.fillStyle = 'rgba(255, 220, 120, 0.35)';
    ctx.beginPath();
    ctx.arc(w * 0.68, h * 0.76, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 180, 140, 0.3)';
    ctx.font = '8px monospace';
    ctx.fillText('Fujairah', w * 0.68 + 6, h * 0.76 + 3);

    ctx.fillStyle = 'rgba(255, 220, 120, 0.35)';
    ctx.beginPath();
    ctx.arc(w * 0.15, h * 0.78, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 180, 140, 0.3)';
    ctx.font = '8px monospace';
    ctx.fillText('Muscat', w * 0.15 + 6, h * 0.78 + 3);

    ctx.fillStyle = 'rgba(200, 170, 100, 0.25)';
    ctx.font = '7px monospace';
    ctx.fillText('Qeshm', w * 0.44, h * 0.35 - 6);

    // Water labels
    ctx.fillStyle = 'rgba(100, 180, 255, 0.25)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('STRAIT OF HORMUZ', w * 0.34, h * 0.50);
    ctx.fillStyle = 'rgba(100, 180, 255, 0.15)';
    ctx.font = '10px monospace';
    ctx.fillText('PERSIAN GULF', w * 0.72, h * 0.55);
    ctx.fillText('GULF OF OMAN', w * 0.06, h * 0.65);

    // Grid
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

// --- Day Counter (large centered text during dayplay) ---

function drawDayCounter(ctx, w, h) {
    if (SIM.phase !== 'dayplay') return;

    const dayText = 'DAY ' + SIM.day;

    ctx.save();
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = 'rgba(68, 221, 136, 0.25)';
    ctx.textAlign = 'center';
    ctx.fillText(dayText, w * 0.5, 40);

    // AP indicator dots
    const ap = SIM.actionPoints || 0;
    const dotSize = 6;
    const dotGap = 10;
    const totalDotsW = 5 * dotSize + 4 * dotGap;
    const dotsX = w * 0.5 - totalDotsW / 2;
    const dotsY = 50;
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < ap ? 'rgba(68, 221, 136, 0.6)' : 'rgba(26, 58, 42, 0.3)';
        ctx.beginPath();
        ctx.arc(dotsX + i * (dotSize + dotGap) + dotSize / 2, dotsY, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// --- Event Flash Card ---

let _eventFlash = null;

function triggerEventFlash(text, level) {
    _eventFlash = { text, level, timer: 180 }; // ~3 seconds at 60fps
}

function drawEventFlash(ctx, w, h) {
    if (!_eventFlash || _eventFlash.timer <= 0) {
        _eventFlash = null;
        return;
    }

    _eventFlash.timer--;
    const alpha = Math.min(1, _eventFlash.timer / 30); // fade out last 0.5s
    const slideIn = Math.min(1, (180 - _eventFlash.timer) / 15); // slide in first 0.25s

    const flashW = Math.min(400, w * 0.6);
    const flashH = 36;
    const flashX = w * 0.5 - flashW / 2;
    const flashY = h * 0.12 + (1 - slideIn) * -20;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Background
    ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
    ctx.fillRect(flashX, flashY, flashW, flashH);

    // Border
    const colors = { critical: '#dd4444', warning: '#ddaa44', good: '#44dd88', normal: '#2a6a4a' };
    const color = colors[_eventFlash.level] || colors.normal;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(flashX, flashY, flashW, flashH);

    // Left accent bar
    ctx.fillStyle = color;
    ctx.fillRect(flashX, flashY, 3, flashH);

    // Text
    ctx.font = '11px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';

    // Truncate text if too long
    let text = _eventFlash.text;
    if (text.length > 50) text = text.substring(0, 47) + '...';
    ctx.fillText(text, flashX + 12, flashY + flashH / 2 + 4);

    ctx.globalAlpha = 1;
    ctx.restore();
}

// --- Lane Position ---

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

    return { x, y };
}
