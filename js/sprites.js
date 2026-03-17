/**
 * SC1-style Pixel Art Sprite Generator
 * Draws all game sprites as offscreen canvases at init
 */

const SPRITES = {};

function initSprites() {
    SPRITES.tanker = createTankerSprite();
    SPRITES.navy = createNavySprite();
    SPRITES.iranboat = createIranBoatSprite();
    SPRITES.platform = createPlatformSprite();
    SPRITES.iconNaval = createIconSprite('naval');
    SPRITES.iconSanctions = createIconSprite('sanctions');
    SPRITES.iconDiplomacy = createIconSprite('diplomacy');
    SPRITES.iconBlockade = createIconSprite('blockade');
}

function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

function drawPixel(ctx, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size, size);
}

function drawPixelRow(ctx, y, pixels, size) {
    for (let x = 0; x < pixels.length; x++) {
        if (pixels[x]) {
            drawPixel(ctx, x, y, pixels[x], size);
        }
    }
}

// ── Oil Tanker ──
function createTankerSprite() {
    const s = 2; // pixel scale
    const c = makeCanvas(32 * s, 12 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const h = '#5a6a7a'; // hull dark
    const H = '#7a8a9a'; // hull light
    const d = '#4a5a6a'; // deck
    const D = '#8a9aaa'; // deck highlight
    const b = '#3a4a5a'; // bridge
    const r = '#aa4444'; // rust/waterline
    const w = '#ccddee'; // white superstructure

    const rows = [
        //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, h, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, h, H, h, _],
        [_, _, _, _, _, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, H, d, h, _],
        [_, _, _, _, h, H, H, d, d, d, d, D, d, d, w, w, b, d, d, d, D, d, d, d, d, d, d, H, d, d, H, h],
        [_, _, _, h, H, d, d, d, d, d, D, d, d, d, w, w, w, b, d, d, d, d, D, d, d, d, d, d, d, d, H, h],
        [_, _, _, h, H, d, d, d, d, d, d, d, D, d, w, w, b, d, d, D, d, d, d, d, d, d, d, d, d, d, H, h],
        [_, _, _, h, H, H, d, d, d, d, D, d, d, d, w, w, w, d, d, d, d, D, d, d, d, d, d, H, d, d, H, h],
        [_, _, _, _, h, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, d, H, h, _],
        [_, _, _, _, _, h, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, r, h, h, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];

    for (let y = 0; y < rows.length; y++) {
        drawPixelRow(ctx, y, rows[y], s);
    }

    return c;
}

// ── US Navy Destroyer ──
function createNavySprite() {
    const s = 2;
    const c = makeCanvas(32 * s, 12 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const h = '#3a4a6a'; // hull dark navy
    const H = '#5a6a8a'; // hull light
    const d = '#4a5a7a'; // deck
    const D = '#6a7a9a'; // deck highlight
    const b = '#2a3a5a'; // bridge
    const w = '#aabbdd'; // white superstructure
    const g = '#6a8aaa'; // gun turret
    const a = '#8899bb'; // antenna/radar
    const f = '#ddddff'; // flag white

    const rows = [
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, a, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, a, a, a, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, h, h, h, h, h, h, h, w, h, h, h, h, h, h, h, h, h, h, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, h, H, d, d, g, d, d, w, w, w, b, d, d, g, d, d, d, d, H, h, _, _, _],
        [_, _, _, _, _, _, _, _, h, H, d, d, g, g, d, d, w, w, w, b, b, d, g, g, d, d, d, d, H, h, _, _],
        [_, _, _, _, _, _, _, h, H, d, d, d, g, d, d, D, w, w, w, b, d, d, g, d, d, D, d, d, d, H, h, _],
        [_, _, _, _, _, _, _, h, H, H, d, d, d, d, D, d, d, d, d, d, d, D, d, d, d, d, d, d, H, H, h, _],
        [_, _, _, _, _, _, _, _, h, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, h, _, _],
        [_, _, _, _, _, _, _, _, _, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];

    for (let y = 0; y < rows.length; y++) {
        drawPixelRow(ctx, y, rows[y], s);
    }

    return c;
}

// ── Iranian Patrol Boat ──
function createIranBoatSprite() {
    const s = 2;
    const c = makeCanvas(24 * s, 10 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const h = '#4a5a3a'; // hull dark olive
    const H = '#6a7a5a'; // hull light
    const d = '#5a6a4a'; // deck
    const g = '#7a8a6a'; // gun
    const r = '#884433'; // rust
    const w = '#99aa88'; // cabin

    const rows = [
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, h, _],
        [_, _, _, _, _, _, _, _, _, h, h, h, h, h, h, h, h, h, h, h, h, h, H, h],
        [_, _, _, _, _, _, _, _, h, H, d, d, g, d, w, w, d, d, d, d, d, H, d, h],
        [_, _, _, _, _, _, _, h, H, d, d, g, g, d, w, w, d, d, d, d, d, d, H, h],
        [_, _, _, _, _, _, _, h, H, H, d, d, g, d, d, d, d, d, d, d, d, H, H, h],
        [_, _, _, _, _, _, _, _, h, h, r, r, r, r, r, r, r, r, r, r, r, h, h, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];

    for (let y = 0; y < rows.length; y++) {
        drawPixelRow(ctx, y, rows[y], s);
    }

    return c;
}

// ── Oil Platform ──
function createPlatformSprite() {
    const s = 2;
    const c = makeCanvas(24 * s, 24 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const m = '#6a6a6a'; // metal
    const M = '#8a8a8a'; // metal light
    const d = '#5a5a5a'; // dark metal
    const f = '#ee8833'; // flame
    const F = '#ffaa44'; // flame bright
    const y2 = '#ffcc44'; // flame tip
    const r = '#884422'; // rust
    const w = '#aaaaaa'; // white

    const rows = [
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, y2,_, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, F, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, f, F, f, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, f, f, f, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, d, d, d, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, d, M, d, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, m, m, m, m, m, m, m, m, m, M, m, m, m, m, _, _, _, _],
        [_, _, _, _, _, _, m, M, M, w, w, M, M, M, w, w, M, M, M, m, _, _, _, _],
        [_, _, _, _, _, _, m, M, d, d, d, d, M, d, d, d, d, d, M, m, _, _, _, _],
        [_, _, _, _, _, _, m, M, d, d, d, d, M, d, d, d, d, d, M, m, _, _, _, _],
        [_, _, _, _, _, _, m, M, M, M, M, M, M, M, M, M, M, M, M, m, _, _, _, _],
        [_, _, _, _, _, _, m, m, m, m, m, m, m, m, m, m, m, m, m, m, _, _, _, _],
        [_, _, _, _, _, _, _, d, _, _, _, _, d, _, _, _, _, d, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, d, _, _, _, _, d, _, _, _, _, d, _, _, _, _, _, _],
        [_, _, _, _, _, _, d, d, d, _, _, d, d, d, _, _, d, d, d, _, _, _, _, _],
        [_, _, _, _, _, d, d, r, d, d, d, d, r, d, d, d, d, r, d, d, _, _, _, _],
        [_, _, _, _, d, d, _, _, _, d, d, _, _, _, d, d, _, _, _, d, d, _, _, _],
        [_, _, _, d, d, _, _, _, _, _, d, _, _, _, _, d, _, _, _, _, d, d, _, _],
        [_, _, d, d, _, _, _, _, _, _, d, _, _, _, _, d, _, _, _, _, _, d, d, _],
        [_, d, d, _, _, _, _, _, _, _, d, d, d, d, d, d, _, _, _, _, _, _, d, d],
        [d, d, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, d],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    ];

    for (let y = 0; y < rows.length; y++) {
        drawPixelRow(ctx, y, rows[y], s);
    }

    return c;
}

// ── SC1-style UI Icons ──
function createIconSprite(type) {
    const s = 2;
    const c = makeCanvas(16 * s, 16 * s);
    const ctx = c.getContext('2d');

    const _ = null;

    if (type === 'naval') {
        const g = '#44ddaa'; // SC1 teal/green
        const G = '#22aa77';
        const d = '#115533';
        const rows = [
            [_, _, _, _, _, _, _, g, g, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, g, g, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, g, G, G, g, _, _, _, _, _, _],
            [_, _, _, _, _, g, G, g, g, G, g, _, _, _, _, _],
            [_, _, _, _, g, G, _, g, g, _, G, g, _, _, _, _],
            [_, _, _, _, g, _, _, g, g, _, _, g, _, _, _, _],
            [_, _, _, _, _, _, _, g, g, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, g, g, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, g, g, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, g, g, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, g, g, g, g, _, _, _, _, _, _],
            [_, _, _, _, _, g, G, g, g, G, g, _, _, _, _, _],
            [_, _, _, _, g, g, g, g, g, g, g, g, _, _, _, _],
            [_, _, _, g, G, G, G, G, G, G, G, G, g, _, _, _],
            [_, _, _, _, d, d, d, d, d, d, d, d, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'sanctions') {
        const r = '#dd4444';
        const R = '#aa2222';
        const y2 = '#dddd44';
        const rows = [
            [_, _, _, _, _, r, r, r, r, r, r, _, _, _, _, _],
            [_, _, _, _, r, R, _, _, _, _, R, r, _, _, _, _],
            [_, _, _, r, R, _, _, _, _, _, r, R, r, _, _, _],
            [_, _, r, _, _, _, _, y2,_, _, _, r, R, r, _, _],
            [_, r, R, _, _, _, y2,y2,y2,_, _, _, R, r, _, _],
            [r, R, _, _, _, _, _, y2,_, _, _, _, _, R, r, _],
            [r, _, _, _, _, _, y2,y2,y2,_, _, _, _, _, r, _],
            [r, _, _, _, _, _, _, y2,_, _, _, _, _, _, r, _],
            [r, _, _, _, _, _, _, y2,_, _, _, _, _, _, r, _],
            [r, _, _, _, _, _, _, _, _, _, _, _, _, _, r, _],
            [r, R, _, _, _, _, _, _, _, _, _, _, _, R, r, _],
            [_, r, R, _, _, _, _, _, _, _, _, _, R, r, _, _],
            [_, _, r, R, _, _, _, _, _, _, _, R, r, _, _, _],
            [_, _, _, r, R, _, _, _, _, _, R, r, _, _, _, _],
            [_, _, _, _, r, R, R, R, R, R, r, _, _, _, _, _],
            [_, _, _, _, _, r, r, r, r, r, _, _, _, _, _, _],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'diplomacy') {
        const g = '#44dd88';
        const G = '#22aa55';
        const w = '#ccddcc';
        const rows = [
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, g, g, _, _, _, _, g, g, _, _, _, _],
            [_, _, _, g, G, G, g, _, _, g, G, G, g, _, _, _],
            [_, _, g, G, _, _, G, g, g, G, _, _, G, g, _, _],
            [_, _, g, _, _, _, _, g, g, _, _, _, _, g, _, _],
            [_, _, _, g, _, _, g, G, G, g, _, _, g, _, _, _],
            [_, _, _, _, g, g, G, w, w, G, g, g, _, _, _, _],
            [_, _, _, _, _, g, G, w, w, G, g, _, _, _, _, _],
            [_, _, _, _, g, G, w, G, G, w, G, g, _, _, _, _],
            [_, _, _, g, G, w, G, _, _, G, w, G, g, _, _, _],
            [_, _, _, g, G, G, _, _, _, _, G, G, g, _, _, _],
            [_, _, _, _, g, g, _, _, _, _, g, g, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'blockade') {
        const g = '#ddaa44'; // gold
        const G = '#aa7722';
        const b = '#4466aa'; // blue center
        const rows = [
            [_, _, _, _, _, _, _, g, g, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, g, G, G, g, _, _, _, _, _, _],
            [_, _, _, _, _, g, G, G, G, G, g, _, _, _, _, _],
            [_, _, _, _, g, G, G, G, G, G, G, g, _, _, _, _],
            [_, _, _, g, G, G, G, b, b, G, G, G, g, _, _, _],
            [_, _, g, G, G, G, b, b, b, b, G, G, G, g, _, _],
            [_, g, G, G, G, b, b, b, b, b, b, G, G, G, g, _],
            [_, g, G, G, G, b, b, b, b, b, b, G, G, G, g, _],
            [_, g, G, G, G, b, b, b, b, b, b, G, G, G, g, _],
            [_, g, G, G, G, G, b, b, b, b, G, G, G, G, g, _],
            [_, _, g, G, G, G, G, b, b, G, G, G, G, g, _, _],
            [_, _, _, g, G, G, G, G, G, G, G, G, g, _, _, _],
            [_, _, _, _, g, G, G, G, G, G, G, g, _, _, _, _],
            [_, _, _, _, _, g, G, G, G, G, g, _, _, _, _, _],
            [_, _, _, _, _, _, g, g, g, g, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    return c;
}
