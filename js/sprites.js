/**
 * SC1-style Pixel Art Sprite Generator — Enhanced Edition
 * Much more detailed sprites with sub-pixel shading, new entity types
 */

const SPRITES = {};

function initSprites() {
    SPRITES.tanker = createTankerSprite();
    SPRITES.tankerLoaded = createTankerSprite(true);
    SPRITES.navy = createNavySprite();
    SPRITES.carrier = createCarrierSprite();
    SPRITES.iranboat = createIranBoatSprite();
    SPRITES.platform = createPlatformSprite();
    SPRITES.mine = createMineSprite();
    SPRITES.drone = createDroneSprite();
    SPRITES.iconNaval = createIconSprite('naval');
    SPRITES.iconSanctions = createIconSprite('sanctions');
    SPRITES.iconDiplomacy = createIconSprite('diplomacy');
    SPRITES.iconBlockade = createIconSprite('blockade');
    SPRITES.iconCoalition = createIconSprite('coalition');
    SPRITES.iconIntel = createIconSprite('intel');

    // Character portraits
    SPRITES.portrait_trump = createPortraitSprite('trump');
    SPRITES.portrait_asmongold = createPortraitSprite('asmongold');
    SPRITES.portrait_fuentes = createPortraitSprite('fuentes');
    SPRITES.portrait_hegseth = createPortraitSprite('hegseth');
    SPRITES.portrait_kushner = createPortraitSprite('kushner');
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

// ── Oil Tanker (improved with more detail) ──
function createTankerSprite(loaded) {
    const s = 2;
    const c = makeCanvas(36 * s, 14 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const h = '#4a5868'; // hull dark
    const H = '#6a7888'; // hull mid
    const L = '#8a98a8'; // hull light
    const d = '#3a4858'; // deck dark
    const D = '#5a6878'; // deck
    const b = '#2a3848'; // bridge dark
    const B = '#4a5a6a'; // bridge
    const r = '#993333'; // rust/waterline
    const R = '#773322'; // rust dark
    const w = '#c8d8e8'; // white
    const W = '#e0e8f0'; // white bright
    const g = '#889898'; // railing
    const t = loaded ? '#884422' : '#667788'; // cargo color

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,h,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,h,W,h,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,h,w,w,W,h],
        [_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,b,B,w,h,_],
        [_,_,_,_,h,H,g,g,D,t,t,t,D,t,t,t,D,t,t,t,D,w,w,B,b,D,t,t,t,D,g,b,B,w,H,h],
        [_,_,_,h,H,D,D,t,t,t,t,t,t,t,t,t,t,t,t,t,D,w,W,w,B,b,D,t,t,t,D,D,B,w,H,h],
        [_,_,h,H,D,D,t,t,t,t,t,t,t,t,t,t,t,t,t,t,D,w,w,B,b,D,t,t,t,t,D,D,B,D,H,h],
        [_,_,h,H,D,D,D,t,t,t,D,t,t,t,D,t,t,t,D,t,D,w,w,w,B,D,t,t,t,D,D,g,B,D,H,h],
        [_,_,h,H,L,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,H,H,h],
        [_,_,_,h,H,L,L,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,L,H,h,_],
        [_,_,_,_,h,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,h,_,_],
        [_,_,_,_,_,h,r,r,R,r,r,R,r,r,R,r,r,R,r,r,R,r,r,R,r,r,R,r,r,R,r,r,h,_,_,_],
        [_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── US Navy Destroyer (much more detailed) ──
function createNavySprite() {
    const s = 2;
    const c = makeCanvas(36 * s, 14 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const h = '#2a3a5a'; // hull dark
    const H = '#4a5a7a'; // hull mid
    const L = '#6a7a9a'; // hull light
    const d = '#3a4a6a'; // deck
    const D = '#5a6a8a'; // deck light
    const b = '#1a2a4a'; // bridge dark
    const w = '#99aacc'; // superstructure
    const W = '#baccdd'; // superstructure bright
    const g = '#556688'; // gun turret
    const G = '#778899'; // gun barrel
    const a = '#7788aa'; // antenna
    const A = '#99aabb'; // antenna tip
    const f = '#ddddff'; // flag
    const m = '#889aaa'; // missile bay

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,a,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,a,A,a,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,a,a,a,a,a,_,_,_,_,_,_,f,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,w,W,w,h,h,h,h,h,h,h,h,h,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,h,H,D,g,G,d,d,d,w,W,W,W,w,d,m,m,d,G,g,d,D,H,h,_,_,_],
        [_,_,_,_,_,_,_,_,_,h,H,D,g,g,G,D,d,d,w,W,W,W,w,b,m,m,D,G,g,g,D,D,H,h,_,_],
        [_,_,_,_,_,_,_,_,h,H,D,D,d,g,G,D,D,d,w,W,W,w,b,b,d,D,D,G,g,d,D,D,D,H,h,_],
        [_,_,_,_,_,_,_,_,h,H,D,D,D,d,d,D,D,D,d,d,d,d,d,D,D,D,D,d,d,D,D,D,D,H,h,_],
        [_,_,_,_,_,_,_,_,_,h,H,L,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,L,H,h,_,_],
        [_,_,_,_,_,_,_,_,_,_,h,H,H,L,L,H,H,H,H,H,H,H,H,H,H,H,H,L,L,H,H,h,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,h,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,h,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── Aircraft Carrier (new, large) ──
function createCarrierSprite() {
    const s = 2;
    const c = makeCanvas(48 * s, 16 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const h = '#2a3a5a'; // hull
    const H = '#3a4a6a';
    const L = '#5a6a8a';
    const d = '#4a5a7a'; // deck (flight deck)
    const D = '#667a9a'; // deck light
    const w = '#99aacc'; // superstructure (island)
    const W = '#baccdd';
    const r = '#666666'; // runway marking
    const R = '#888888';
    const a = '#7788aa'; // antenna
    const y2= '#dddd44'; // deck marking yellow
    const g = '#556688';

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,a,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,a,a,a,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,w,W,w,h,h,h,h,h,h,h,_,_,_,_],
        [_,_,_,_,_,h,H,D,D,y2,D,D,D,D,D,D,D,r,D,D,D,D,D,D,D,D,r,D,D,D,D,D,D,D,w,W,w,D,D,D,D,D,D,H,h,_,_,_],
        [_,_,_,_,h,H,D,D,y2,D,D,D,D,r,D,D,D,D,D,r,D,D,D,D,r,D,D,D,D,r,D,D,D,D,w,w,g,D,D,D,D,D,D,D,H,h,_,_],
        [_,_,_,h,H,D,D,y2,D,D,D,r,D,D,D,D,r,D,D,D,D,r,D,D,D,D,D,r,D,D,D,D,r,D,D,D,D,D,D,r,D,D,D,D,D,H,h,_],
        [_,_,h,H,D,D,y2,D,D,r,D,D,D,D,r,D,D,D,D,D,r,D,D,D,D,r,D,D,D,D,D,r,D,D,D,D,D,D,r,D,D,D,D,D,D,D,H,h],
        [_,_,h,H,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,H,h],
        [_,_,_,h,H,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,H,h,_],
        [_,_,_,_,h,H,L,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,L,H,h,_,_],
        [_,_,_,_,_,h,H,H,L,L,L,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,L,L,L,H,h,_,_,_,_],
        [_,_,_,_,_,_,h,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,h,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── Iranian Patrol Boat (improved detail) ──
function createIranBoatSprite() {
    const s = 2;
    const c = makeCanvas(28 * s, 12 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const h = '#3a4a2a'; // hull dark olive
    const H = '#5a6a4a'; // hull mid
    const L = '#7a8a6a'; // hull light
    const d = '#4a5a3a'; // deck
    const D = '#6a7a5a'; // deck light
    const g = '#8a9a7a'; // gun turret
    const G = '#aaba9a'; // gun barrel
    const r = '#774433'; // rust
    const R = '#553322'; // rust dark
    const w = '#8a9a78'; // cabin
    const W = '#aabb99'; // cabin bright
    const f = '#dd2222'; // Iran flag red

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,h,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,h,H,h],
        [_,_,_,_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,H,L,h],
        [_,_,_,_,_,_,_,_,_,h,H,D,g,G,d,w,W,w,d,D,d,d,D,d,D,H,D,h],
        [_,_,_,_,_,_,_,_,h,H,D,g,g,G,d,w,W,W,w,d,D,d,d,D,d,D,H,h],
        [_,_,_,_,_,_,_,h,H,D,D,d,g,G,d,d,w,w,d,d,D,d,d,d,D,D,H,h],
        [_,_,_,_,_,_,_,h,H,L,D,D,d,d,D,D,d,d,D,D,d,D,D,D,D,L,H,h],
        [_,_,_,_,_,_,_,_,h,H,L,L,H,H,H,H,H,H,H,H,H,H,H,L,L,H,h,_],
        [_,_,_,_,_,_,_,_,_,h,r,R,r,r,R,r,r,R,r,r,R,r,r,R,r,h,_,_],
        [_,_,_,_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── Sea Mine (new) ──
function createMineSprite() {
    const s = 2;
    const c = makeCanvas(12 * s, 12 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const m = '#4a4a4a'; // metal dark
    const M = '#6a6a6a'; // metal
    const L = '#8a8a8a'; // metal light
    const r = '#884433'; // rust
    const S = '#aaaaaa'; // spike
    const d = '#333333'; // dark

    const rows = [
        [_,_,_,_,_,S,S,_,_,_,_,_],
        [_,_,_,S,_,d,d,_,S,_,_,_],
        [_,_,_,_,m,m,m,m,_,_,_,_],
        [_,S,_,m,M,M,M,M,m,_,S,_],
        [_,_,m,M,L,M,M,L,M,m,_,_],
        [S,d,m,M,M,M,M,M,M,m,d,S],
        [S,d,m,M,M,M,M,M,M,m,d,S],
        [_,_,m,M,L,M,M,L,M,m,_,_],
        [_,S,_,m,M,M,M,M,m,_,S,_],
        [_,_,_,_,m,r,r,m,_,_,_,_],
        [_,_,_,S,_,d,d,_,S,_,_,_],
        [_,_,_,_,_,S,S,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── Surveillance Drone (new) ──
function createDroneSprite() {
    const s = 2;
    const c = makeCanvas(20 * s, 12 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const b = '#555566'; // body dark
    const B = '#777788'; // body
    const L = '#999aaa'; // body light
    const w = '#aabbcc'; // wing
    const W = '#8899aa'; // wing dark
    const r = '#dd3333'; // light
    const g = '#33dd33'; // light

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,_,_],
        [_,_,_,_,_,_,_,_,_,b,b,b,b,b,b,b,b,B,b,_],
        [_,_,_,w,W,w,w,w,w,B,B,L,L,B,B,B,b,B,b,_],
        [_,_,w,W,w,w,w,W,B,B,L,L,L,L,B,b,b,B,L,b],
        [_,_,w,W,w,w,w,W,B,B,L,L,L,L,B,b,b,B,L,b],
        [_,_,_,w,W,w,w,w,w,B,B,L,L,B,B,B,b,B,b,_],
        [_,_,_,_,_,_,_,_,_,b,b,b,b,b,b,b,b,B,b,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── Oil Platform (improved with animated-ready frame) ──
function createPlatformSprite() {
    const s = 2;
    const c = makeCanvas(24 * s, 24 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const m = '#5a5a5a'; // metal
    const M = '#7a7a7a'; // metal light
    const N = '#8a8a8a'; // metal lighter
    const d = '#4a4a4a'; // dark metal
    const f = '#ee7722'; // flame
    const F = '#ffaa33'; // flame bright
    const Y = '#ffdd44'; // flame tip
    const y2= '#ffee77'; // flame core
    const r = '#774422'; // rust
    const R = '#553311'; // rust dark
    const w = '#999999'; // white/gray
    const W = '#aaaaaa'; // white bright
    const p = '#666666'; // pipe

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,y2,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,Y,y2,Y,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,F,Y,F,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,f,F,F,F,f,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,d,d,d,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,d,M,d,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,m,m,m,m,m,m,m,m,m,M,m,m,m,m,m,_,_,_,_],
        [_,_,_,_,_,m,M,N,W,W,N,M,N,W,W,N,M,N,M,m,_,_,_,_],
        [_,_,_,_,_,m,M,d,d,d,p,d,M,d,d,p,d,d,M,m,_,_,_,_],
        [_,_,_,_,_,m,M,d,r,d,p,d,M,d,r,p,d,d,M,m,_,_,_,_],
        [_,_,_,_,_,m,M,d,d,d,p,d,M,d,d,p,d,d,M,m,_,_,_,_],
        [_,_,_,_,_,m,M,N,N,N,N,N,M,N,N,N,N,N,M,m,_,_,_,_],
        [_,_,_,_,_,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,_,_,_,_],
        [_,_,_,_,_,_,_,d,_,_,_,_,d,_,_,_,_,d,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,d,_,_,_,_,d,_,_,_,_,d,_,_,_,_,_,_],
        [_,_,_,_,_,_,d,d,d,_,_,d,d,d,_,_,d,d,d,_,_,_,_,_],
        [_,_,_,_,_,d,d,r,d,d,d,d,R,d,d,d,d,r,d,d,_,_,_,_],
        [_,_,_,_,d,d,_,_,_,d,d,_,_,_,d,d,_,_,_,d,d,_,_,_],
        [_,_,_,d,d,_,_,_,_,_,d,_,_,_,_,d,_,_,_,_,d,d,_,_],
        [_,_,d,d,_,_,_,_,_,_,d,_,_,_,_,d,_,_,_,_,_,d,d,_],
        [_,d,d,_,_,_,_,_,_,_,d,d,d,d,d,d,_,_,_,_,_,_,d,d],
        [d,d,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,d],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── SC1-style UI Icons (improved + new types) ──
function createIconSprite(type) {
    const s = 2;
    const c = makeCanvas(16 * s, 16 * s);
    const ctx = c.getContext('2d');

    const _ = null;

    if (type === 'naval') {
        const g = '#44ddaa';
        const G = '#22aa77';
        const d = '#115533';
        const w = '#88ffcc';
        const rows = [
            [_,_,_,_,_,_,_,g,g,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,g,w,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,g,G,G,g,_,_,_,_,_,_],
            [_,_,_,_,_,g,G,g,g,G,g,_,_,_,_,_],
            [_,_,_,_,g,G,_,g,g,_,G,g,_,_,_,_],
            [_,_,_,_,g,_,_,g,g,_,_,g,_,_,_,_],
            [_,_,_,_,_,_,_,g,g,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,g,g,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,g,g,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,g,g,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,g,g,g,g,_,_,_,_,_,_],
            [_,_,_,_,_,g,G,g,g,G,g,_,_,_,_,_],
            [_,_,_,_,g,g,g,g,g,g,g,g,_,_,_,_],
            [_,_,_,g,G,G,G,G,G,G,G,G,g,_,_,_],
            [_,_,_,_,d,d,d,d,d,d,d,d,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'sanctions') {
        const r = '#dd4444';
        const R = '#aa2222';
        const y2 = '#dddd44';
        const Y = '#ffff66';
        const rows = [
            [_,_,_,_,_,r,r,r,r,r,r,_,_,_,_,_],
            [_,_,_,_,r,R,_,_,_,_,R,r,_,_,_,_],
            [_,_,_,r,R,_,_,_,_,_,r,R,r,_,_,_],
            [_,_,r,_,_,_,_,Y,_,_,_,r,R,r,_,_],
            [_,r,R,_,_,_,y2,Y,y2,_,_,_,R,r,_,_],
            [r,R,_,_,_,_,_,Y,_,_,_,_,_,R,r,_],
            [r,_,_,_,_,_,y2,Y,y2,_,_,_,_,_,r,_],
            [r,_,_,_,_,_,_,Y,_,_,_,_,_,_,r,_],
            [r,_,_,_,_,_,_,y2,_,_,_,_,_,_,r,_],
            [r,_,_,_,_,_,_,_,_,_,_,_,_,_,r,_],
            [r,R,_,_,_,_,_,_,_,_,_,_,_,R,r,_],
            [_,r,R,_,_,_,_,_,_,_,_,_,R,r,_,_],
            [_,_,r,R,_,_,_,_,_,_,_,R,r,_,_,_],
            [_,_,_,r,R,_,_,_,_,_,R,r,_,_,_,_],
            [_,_,_,_,r,R,R,R,R,R,r,_,_,_,_,_],
            [_,_,_,_,_,r,r,r,r,r,_,_,_,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'diplomacy') {
        const g = '#44dd88';
        const G = '#22aa55';
        const w = '#ccddcc';
        const W = '#eeffee';
        const rows = [
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,g,g,_,_,_,_,g,g,_,_,_,_],
            [_,_,_,g,G,G,g,_,_,g,G,G,g,_,_,_],
            [_,_,g,G,_,_,G,g,g,G,_,_,G,g,_,_],
            [_,_,g,_,_,_,_,g,g,_,_,_,_,g,_,_],
            [_,_,_,g,_,_,g,G,G,g,_,_,g,_,_,_],
            [_,_,_,_,g,g,G,W,W,G,g,g,_,_,_,_],
            [_,_,_,_,_,g,G,w,w,G,g,_,_,_,_,_],
            [_,_,_,_,g,G,w,G,G,w,G,g,_,_,_,_],
            [_,_,_,g,G,w,G,_,_,G,w,G,g,_,_,_],
            [_,_,_,g,G,G,_,_,_,_,G,G,g,_,_,_],
            [_,_,_,_,g,g,_,_,_,_,g,g,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'blockade') {
        const g = '#ddaa44';
        const G = '#aa7722';
        const b = '#4466aa';
        const B = '#6688cc';
        const rows = [
            [_,_,_,_,_,_,_,g,g,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,g,G,G,g,_,_,_,_,_,_],
            [_,_,_,_,_,g,G,G,G,G,g,_,_,_,_,_],
            [_,_,_,_,g,G,G,G,G,G,G,g,_,_,_,_],
            [_,_,_,g,G,G,G,b,b,G,G,G,g,_,_,_],
            [_,_,g,G,G,G,b,B,B,b,G,G,G,g,_,_],
            [_,g,G,G,G,b,b,B,B,b,b,G,G,G,g,_],
            [_,g,G,G,G,b,B,B,B,B,b,G,G,G,g,_],
            [_,g,G,G,G,b,b,B,B,b,b,G,G,G,g,_],
            [_,g,G,G,G,G,b,B,B,b,G,G,G,G,g,_],
            [_,_,g,G,G,G,G,b,b,G,G,G,G,g,_,_],
            [_,_,_,g,G,G,G,G,G,G,G,G,g,_,_,_],
            [_,_,_,_,g,G,G,G,G,G,G,g,_,_,_,_],
            [_,_,_,_,_,g,G,G,G,G,g,_,_,_,_,_],
            [_,_,_,_,_,_,g,g,g,g,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'coalition') {
        const g = '#44bb88';
        const G = '#228855';
        const b = '#4488cc';
        const B = '#2266aa';
        const w = '#ccddee';
        const rows = [
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,g,g,_,_,_,_,_,_,b,b,_,_,_],
            [_,_,g,G,G,g,_,_,_,_,b,B,B,b,_,_],
            [_,g,G,w,w,G,g,_,_,b,B,w,w,B,b,_],
            [_,g,G,w,w,G,g,_,_,b,B,w,w,B,b,_],
            [_,_,g,G,G,g,_,_,_,_,b,B,B,b,_,_],
            [_,_,_,g,g,g,_,_,_,_,b,b,b,_,_,_],
            [_,_,_,_,g,g,g,g,g,b,b,b,_,_,_,_],
            [_,_,_,_,_,g,g,g,g,b,b,_,_,_,_,_],
            [_,_,_,_,g,g,g,g,g,b,b,b,_,_,_,_],
            [_,_,_,g,g,g,_,_,_,_,b,b,b,_,_,_],
            [_,_,g,G,G,g,_,_,_,_,b,B,B,b,_,_],
            [_,g,G,w,w,G,g,_,_,b,B,w,w,B,b,_],
            [_,_,g,G,G,g,_,_,_,_,b,B,B,b,_,_],
            [_,_,_,g,g,_,_,_,_,_,_,b,b,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'intel') {
        const g = '#44aadd';
        const G = '#2288aa';
        const d = '#115577';
        const w = '#88ccee';
        const r = '#dd4444';
        const rows = [
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,g,g,g,g,_,_,_,_,_,_],
            [_,_,_,_,g,g,G,G,G,G,g,g,_,_,_,_],
            [_,_,_,g,G,d,d,d,d,d,d,G,g,_,_,_],
            [_,_,g,G,d,_,_,_,_,_,_,d,G,g,_,_],
            [_,_,g,G,_,_,r,_,_,r,_,_,G,g,_,_],
            [_,_,g,G,_,_,_,_,_,_,_,_,G,g,_,_],
            [_,_,g,G,_,_,_,w,w,_,_,_,G,g,_,_],
            [_,_,g,G,_,_,_,_,_,_,_,_,G,g,_,_],
            [_,_,g,G,d,_,_,_,_,_,_,d,G,g,_,_],
            [_,_,_,g,G,d,d,d,d,d,d,G,g,_,_,_],
            [_,_,_,_,g,g,G,G,G,G,g,g,_,_,_,_],
            [_,_,_,_,_,_,g,g,g,g,g,g,g,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,g,G,g,g,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,g,G,g,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,g,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    return c;
}

// ── Character Portraits (24x24 logical, 2x scale = 48x48) — Improved ──
function createPortraitSprite(type) {
    const s = 2;
    const c = makeCanvas(24 * s, 24 * s);
    const ctx = c.getContext('2d');
    const _ = null;

    if (type === 'trump') {
        const H = '#ddaa33'; const h = '#cc9922'; const hd = '#aa7711';
        const S = '#e8c088'; const s2= '#d4a068'; const s3 = '#c09058';
        const E = '#4477aa'; const Ew = '#ffffff';
        const M = '#cc6655'; const N = '#d4a878';
        const T = '#cc2222'; const J = '#2a2a3a'; const j = '#3a3a4a';
        const W = '#e8e8e8'; const Ws = '#cccccc';
        const rows = [
            [_,_,_,_,_,_,_,H,H,H,H,H,H,H,H,H,H,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,H,H,h,H,H,H,H,H,H,h,H,H,_,_,_,_,_,_],
            [_,_,_,_,_,H,H,h,H,H,H,H,H,H,H,H,h,H,H,_,_,_,_,_],
            [_,_,_,_,H,H,h,H,H,H,H,H,H,H,H,H,H,h,H,H,_,_,_,_],
            [_,_,_,_,H,hd,hd,h,H,H,H,H,H,H,H,H,h,hd,H,_,_,_,_],
            [_,_,_,_,_,hd,S,S,S,S,S,S,S,S,S,S,S,S,hd,_,_,_,_,_],
            [_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_],
            [_,_,_,_,_,_,S,Ew,E,E,S,S,S,S,E,E,Ew,S,_,_,_,_,_,_],
            [_,_,_,_,_,_,s2,S,E,E,S,S,S,S,E,E,S,s2,_,_,_,_,_,_],
            [_,_,_,_,_,_,s2,S,S,S,S,N,N,S,S,S,S,s2,_,_,_,_,_,_],
            [_,_,_,_,_,_,s2,S,S,S,N,N,N,N,S,S,S,s2,_,_,_,_,_,_],
            [_,_,_,_,_,_,s3,s2,S,S,S,S,S,S,S,S,s2,s3,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,s2,S,M,M,M,M,M,M,S,s2,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,s3,s2,S,S,M,M,S,S,s2,s3,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,s3,s2,S,S,S,S,s2,s3,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,s3,s3,s3,s3,s3,s3,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,W,W,Ws,T,T,T,T,Ws,W,W,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,J,W,Ws,Ws,T,T,T,T,Ws,Ws,W,J,_,_,_,_,_,_],
            [_,_,_,_,_,J,J,j,Ws,Ws,T,T,T,T,Ws,Ws,j,J,J,_,_,_,_,_],
            [_,_,_,_,J,J,J,j,j,Ws,T,T,T,T,Ws,j,j,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,j,j,j,T,T,T,T,j,j,j,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,j,j,j,j,T,T,j,j,j,j,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,j,j,j,j,j,j,j,j,J,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,J,j,j,j,j,j,j,J,J,J,J,J,J,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'asmongold') {
        const H = '#5a3a1a'; const h = '#7a4a22'; const hd = '#3a2a10';
        const R = '#cc3333'; const r = '#992222'; const Rb = '#ff4444';
        const S = '#d4a878'; const s2= '#bb9068'; const s3 = '#aa7a58';
        const E = '#334455'; const Ew = '#eeeeee';
        const Br = '#5a3a22'; const b = '#4a2a18'; const bd = '#3a1a0a';
        const T = '#444444'; const t = '#555555'; const tl = '#666666';
        const rows = [
            [_,_,_,_,_,_,H,H,H,H,H,H,H,H,H,H,H,H,_,_,_,_,_,_],
            [_,_,_,_,_,H,h,h,hd,H,H,H,H,H,hd,h,h,H,_,_,_,_,_,_],
            [_,_,_,_,H,h,h,hd,hd,h,H,H,H,h,hd,hd,h,h,H,_,_,_,_,_],
            [_,_,_,_,H,h,hd,hd,hd,h,h,h,h,h,hd,hd,hd,h,H,_,_,_,_,_],
            [_,_,_,_,r,R,R,Rb,R,R,R,R,R,R,R,Rb,R,R,r,_,_,_,_,_],
            [_,_,_,_,r,R,R,R,Rb,R,R,R,R,R,Rb,R,R,R,r,_,_,_,_,_],
            [_,_,_,H,h,h,S,S,S,S,S,S,S,S,S,S,S,h,h,H,_,_,_,_],
            [_,_,_,H,h,_,S,Ew,E,S,S,S,S,S,E,Ew,S,_,h,H,_,_,_,_],
            [_,_,_,H,h,_,s2,S,E,S,S,S,S,S,E,S,s2,_,h,H,_,_,_,_],
            [_,_,_,_,h,_,s2,S,S,S,S,S,S,S,S,S,s2,_,h,_,_,_,_,_],
            [_,_,_,_,h,_,s3,S,S,S,S,s2,s2,S,S,S,s3,_,h,_,_,_,_,_],
            [_,_,_,_,h,_,Br,Br,S,S,S,S,S,S,S,Br,Br,_,h,_,_,_,_,_],
            [_,_,_,_,_,_,Br,Br,Br,Br,s2,s2,s2,Br,Br,Br,Br,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,b,Br,Br,Br,Br,Br,Br,Br,Br,Br,b,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,bd,b,Br,Br,Br,Br,Br,Br,Br,b,bd,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,bd,b,b,b,b,b,b,b,bd,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,T,t,tl,t,t,tl,t,T,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,T,T,t,tl,t,t,tl,t,T,T,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,T,T,t,t,tl,t,t,tl,t,t,T,T,_,_,_,_,_,_],
            [_,_,_,_,_,T,T,T,t,t,t,tl,tl,t,t,t,T,T,T,_,_,_,_,_],
            [_,_,_,_,T,T,T,T,t,t,t,t,t,t,t,t,T,T,T,T,_,_,_,_,_],
            [_,_,_,T,T,T,T,T,t,t,t,t,t,t,t,t,T,T,T,T,T,_,_,_],
            [_,_,_,T,T,T,T,T,t,t,t,t,t,t,t,t,T,T,T,T,T,_,_,_],
            [_,_,_,T,T,T,T,T,T,t,t,t,t,t,t,T,T,T,T,T,T,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'fuentes') {
        const H = '#1a1a22'; const h = '#2a2a33'; const hd = '#111118';
        const S = '#ddb088'; const s2= '#cc9a78'; const s3 = '#bb8a68';
        const E = '#223344'; const Ew = '#eeeeee'; const eb = '#111122';
        const M = '#cc8877'; const N = '#ccaa88';
        const T = '#2244aa'; const Tb = '#3355bb';
        const J = '#1a1a2a'; const j = '#2a2a3a'; const jl = '#3a3a4a';
        const W = '#e0e0e0'; const Ws = '#cccccc';
        const rows = [
            [_,_,_,_,_,_,_,_,H,H,H,H,H,H,H,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,H,H,h,H,H,H,H,h,H,H,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,H,H,h,hd,h,H,H,h,hd,h,H,H,_,_,_,_,_,_],
            [_,_,_,_,_,_,H,h,hd,hd,h,H,H,h,hd,hd,h,H,_,_,_,_,_,_],
            [_,_,_,_,_,_,H,h,hd,hd,hd,h,h,hd,hd,hd,h,H,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,S,Ew,E,S,S,S,S,E,Ew,S,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,s2,eb,E,S,S,S,S,E,eb,s2,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,s2,S,S,S,N,N,S,S,S,s2,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,s2,S,S,N,N,N,N,S,S,s2,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,s3,s2,S,S,S,S,S,S,s2,s3,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,s2,M,M,M,M,M,M,s2,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,s3,S,M,M,M,M,S,s3,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,s3,s2,s2,s2,s2,s3,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,s3,S,S,S,S,s3,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,W,Ws,Ws,T,Tb,T,Ws,Ws,W,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,J,W,Ws,Ws,T,Tb,T,Ws,Ws,W,J,_,_,_,_,_,_,_],
            [_,_,_,_,_,J,J,j,Ws,Ws,T,Tb,T,Ws,Ws,j,J,J,_,_,_,_,_,_],
            [_,_,_,_,J,J,J,j,jl,Ws,T,Tb,T,Ws,jl,j,J,J,J,_,_,_,_,_],
            [_,_,_,J,J,J,J,j,jl,jl,T,Tb,T,jl,jl,j,J,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,j,jl,jl,jl,T,jl,jl,jl,j,J,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,J,jl,jl,jl,jl,jl,jl,jl,J,J,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,J,J,jl,jl,jl,jl,jl,J,J,J,J,J,J,_,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'hegseth') {
        const H = '#5a4a33'; const h = '#4a3a28'; const hd = '#3a2a18';
        const S = '#ddb088'; const s2= '#cc9a78'; const s3 = '#bb8a68';
        const E = '#334455'; const Ew = '#eeeeee';
        const M = '#cc8877'; const N = '#ccaa88';
        const J = '#2a3a2a'; const j = '#3a4a3a'; const jl = '#4a5a4a';
        const W = '#dddddd'; const Ws = '#bbbbbb';
        const St = '#888844'; // star
        const rows = [
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,H,H,H,H,H,H,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,H,H,h,h,H,H,h,h,H,H,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,H,h,hd,h,H,H,h,hd,h,H,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,h,hd,hd,hd,h,h,hd,hd,hd,h,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,S,Ew,E,S,S,S,S,E,Ew,S,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,s2,S,E,S,S,S,S,E,S,s2,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,s2,S,S,S,N,N,S,S,S,s2,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,s2,S,S,N,N,N,N,S,S,s2,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,s3,s2,S,S,S,S,S,S,s2,s3,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,s3,S,M,M,M,M,M,M,S,s3,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,s3,s2,S,S,S,S,s2,s3,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,s3,s3,s2,s2,s2,s3,s3,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,s3,S,S,S,S,s3,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,W,Ws,Ws,J,J,J,Ws,Ws,W,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,J,W,Ws,Ws,J,J,J,Ws,Ws,W,J,_,_,_,_,_,_,_],
            [_,_,_,_,_,J,J,j,Ws,St,j,j,j,St,Ws,j,J,J,_,_,_,_,_,_],
            [_,_,_,_,J,J,J,j,jl,jl,j,j,j,jl,jl,j,J,J,J,_,_,_,_,_],
            [_,_,_,J,J,J,J,j,jl,jl,jl,j,jl,jl,jl,j,J,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,j,jl,jl,jl,jl,jl,jl,jl,j,J,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,J,jl,jl,jl,jl,jl,jl,jl,J,J,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,J,J,jl,jl,jl,jl,jl,J,J,J,J,J,J,_,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'kushner') {
        const H = '#2a2233'; const h = '#3a3344'; const hd = '#1a1828';
        const S = '#e0c098'; const s2= '#d0b088'; const s3 = '#c0a078';
        const E = '#334455'; const Ew = '#eeeeee'; const eb = '#222233';
        const M = '#ccaa99'; const N = '#ccaa88';
        const T = '#333355'; const Tb = '#444466';
        const J = '#1a1a28'; const j = '#2a2a38'; const jl = '#3a3a48';
        const W = '#eeeeff'; const Ws = '#ccccdd';
        const rows = [
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,H,H,H,H,H,H,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,H,H,h,hd,H,hd,h,H,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,H,h,hd,hd,H,hd,hd,h,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,H,h,hd,hd,hd,hd,hd,h,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,S,Ew,E,S,S,E,Ew,S,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,s2,eb,E,S,S,E,eb,s2,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,s2,S,S,N,N,S,S,s2,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,s2,S,N,N,N,N,S,s2,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,s3,s2,S,S,S,S,s2,s3,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,s2,M,M,M,M,s2,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,s3,S,M,M,S,s3,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,s3,s2,s2,s3,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,s3,s3,s3,s3,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,W,Ws,Ws,T,Tb,T,Ws,Ws,W,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,J,W,Ws,Ws,T,Tb,T,Ws,Ws,W,J,_,_,_,_,_,_,_],
            [_,_,_,_,_,J,J,j,Ws,Ws,T,Tb,T,Ws,Ws,j,J,J,_,_,_,_,_,_],
            [_,_,_,_,J,J,J,j,jl,Ws,T,Tb,T,Ws,jl,j,J,J,J,_,_,_,_,_],
            [_,_,_,J,J,J,J,j,jl,jl,T,Tb,T,jl,jl,j,J,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,j,jl,jl,jl,T,jl,jl,jl,j,J,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,J,jl,jl,jl,jl,jl,jl,jl,J,J,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,J,J,jl,jl,jl,jl,jl,J,J,J,J,J,J,_,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    // SC1 green phosphor border
    ctx.strokeStyle = '#1a3a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, c.width, c.height);

    return c;
}
