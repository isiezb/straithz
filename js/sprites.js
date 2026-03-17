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

// ── Oil Tanker (48x18 at 3x scale) ──
function createTankerSprite(loaded) {
    const s = 3;
    const c = makeCanvas(48 * s, 18 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const hd= '#2e3845'; // hull darkest
    const h = '#3e4d5e'; // hull dark
    const H = '#5a6e80'; // hull mid
    const hl= '#7a8e9e'; // hull light
    const hx= '#95a8b5'; // hull highlight
    const dd= '#2a3a4a'; // deck dark
    const d = '#3e5060'; // deck
    const D = '#546878'; // deck mid
    const dl= '#6a7e90'; // deck light
    const bd= '#1a2838'; // bridge darkest
    const b = '#2a3e52'; // bridge dark
    const B = '#3e546a'; // bridge mid
    const bl= '#506880'; // bridge light
    const wd= '#8eaab8'; // window dark
    const w = '#b0d0e0'; // window
    const W = '#d0e8f0'; // window bright
    const wh= '#e8f4ff'; // window highlight
    const rd= '#5a1818'; // waterline darkest
    const r = '#8a2020'; // waterline dark
    const R = '#aa3333'; // waterline
    const rl= '#c04040'; // waterline light
    const g = '#6a7a88'; // railing
    const sk= '#3a3a3a'; // smokestack dark
    const S = '#555555'; // smokestack
    const sm= '#888888'; // smoke
    const t = loaded ? '#6a3818' : '#556678'; // cargo dark
    const T = loaded ? '#884a22' : '#6a7e90'; // cargo mid
    const tl= loaded ? '#a06030' : '#7e92a2'; // cargo light
    const th= loaded ? '#b87840' : '#90a5b5'; // cargo highlight

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,sm,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,sm,sm,sm,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,sk,S,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,sk,S,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,bd,b,B,bl,B,b,bd,_,_],
        [_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,b,B,w,W,w,B,b,h,_],
        [_,_,_,_,_,_,h,H,g,g,dl,T,tl,T,dl,T,tl,T,dl,T,tl,T,dl,T,tl,T,dl,T,tl,T,dl,g,dl,dl,dl,g,dl,dl,b,B,wd,w,wh,w,B,b,H,h],
        [_,_,_,_,_,h,H,D,D,T,T,tl,th,tl,T,T,tl,th,tl,T,T,tl,th,tl,T,T,tl,th,tl,T,D,D,dl,dl,dl,dl,D,D,b,bl,wd,w,W,wd,bl,b,D,H],
        [_,_,_,_,h,H,D,D,t,T,tl,th,th,th,tl,t,T,tl,th,tl,t,T,tl,th,tl,t,T,tl,th,tl,D,D,dl,D,D,dl,D,D,b,bl,wd,w,W,wd,bl,b,D,H],
        [_,_,_,h,H,D,D,t,T,tl,th,th,th,th,tl,t,T,tl,th,tl,t,T,tl,th,tl,t,T,tl,th,T,D,D,dl,D,D,dl,D,D,bd,b,B,bl,B,B,b,bd,D,H],
        [_,_,h,H,D,D,D,t,T,T,tl,T,D,T,tl,t,T,T,D,T,t,T,T,D,T,t,T,T,D,T,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,H],
        [_,_,h,H,hl,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,H,h],
        [_,_,_,h,H,hl,hl,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,hl,H,h,_],
        [_,_,_,_,h,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,h,_,_],
        [_,_,_,_,_,h,R,rl,r,R,rl,r,R,rl,r,R,rl,r,R,rl,r,R,rl,r,R,rl,r,R,rl,r,R,rl,r,R,rl,r,R,rl,r,R,rl,r,R,h,_,_,_,_],
        [_,_,_,_,_,_,h,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,h,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── US Navy Destroyer (48x18 at 3x scale) ──
function createNavySprite() {
    const s = 3;
    const c = makeCanvas(48 * s, 18 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const hd= '#1a2440'; // hull darkest
    const h = '#2a3a5a'; // hull dark
    const H = '#3e5070'; // hull mid
    const hl= '#5a6e8a'; // hull light
    const hx= '#7888a0'; // hull highlight
    const dd= '#1e3050'; // deck darkest
    const d = '#2e4262'; // deck dark
    const D = '#3e5878'; // deck
    const dl= '#506a88'; // deck light
    const bd= '#101830'; // bridge darkest
    const b = '#1a2848'; // bridge dark
    const B = '#2a3e60'; // bridge mid
    const bl= '#3a5070'; // bridge light
    const wd= '#6888a8'; // window dark
    const w = '#88aac8'; // window
    const W = '#a8c8e0'; // window bright
    const wh= '#c8e0f0'; // window highlight
    const gd= '#384860'; // gun darkest
    const g = '#506878'; // gun dark
    const G = '#6a8090'; // gun mid
    const gl= '#8898a8'; // gun barrel
    const ad= '#506070'; // antenna dark
    const a = '#708898'; // antenna
    const A = '#90a8b8'; // antenna tip
    const md= '#405868'; // missile bay dark
    const m = '#607888'; // missile bay
    const ml= '#7890a0'; // missile bay light
    const f = '#c8c8ff'; // flag
    const fd= '#8888cc'; // flag dark
    const cw= '#90a8a8'; // CIWS dome
    const hp= '#485868'; // helo pad

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,a,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,a,A,a,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,ad,a,A,a,ad,_,_,_,_,_,_,_,_,_,_,f,fd,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,ad,a,ad,ad,a,ad,_,_,_,_,_,_,_,_,_,f,fd,f,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,bd,b,B,bl,bl,B,b,bd,_,_,_,_,_,_,_,_,_,ad,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,b,B,w,W,W,w,B,b,h,h,h,h,h,h,h,h,h,h,h,h,h,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,gl,gl,_,_,h,H,dl,gd,g,G,gl,d,d,B,w,W,wh,W,w,B,d,md,m,ml,m,md,d,gl,G,g,d,dl,cw,H,h,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,gl,_,h,H,dl,D,gd,g,G,gl,D,d,B,bl,w,W,w,bl,B,d,md,m,ml,ml,m,md,D,gl,G,g,gd,dl,D,H,h,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,h,H,dl,D,D,d,gd,g,G,D,D,b,B,bl,bl,bl,B,b,D,D,md,m,m,md,D,D,G,g,gd,D,D,D,D,H,h,_,_],
        [_,_,_,_,_,_,_,_,_,_,h,H,dl,D,D,D,D,d,d,D,D,D,d,d,d,d,d,d,d,D,D,D,D,D,D,D,D,d,d,D,D,hp,hp,D,D,H,h,_],
        [_,_,_,_,_,_,_,_,_,_,h,H,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,hp,hp,hp,D,D,H,h,_],
        [_,_,_,_,_,_,_,_,_,_,_,h,H,hl,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,hl,H,h,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,h,H,hl,hl,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,hl,hl,H,h,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,h,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,h,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── Aircraft Carrier (64x20 at 3x scale) ──
function createCarrierSprite() {
    const s = 3;
    const c = makeCanvas(64 * s, 20 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const hd= '#1a2440'; // hull darkest
    const h = '#2a3858'; // hull dark
    const H = '#3a4a6a'; // hull mid
    const hl= '#5a6a88'; // hull light
    const hx= '#6a7a98'; // hull highlight
    const dd= '#2a3a58'; // deck darkest
    const d = '#3a4e6e'; // deck dark
    const D = '#4e6282'; // deck mid
    const dl= '#5e7292'; // deck light
    const dx= '#6e82a0'; // deck highlight
    const bd= '#101828'; // island darkest
    const b = '#1a2a42'; // island dark
    const B = '#2a3e5a'; // island mid
    const bl= '#3a5270'; // island light
    const wd= '#607898'; // window dark
    const w = '#80a0c0'; // window
    const W = '#a0c0d8'; // window bright
    const wh= '#c0d8e8'; // window highlight
    const ad= '#506878'; // antenna dark
    const a = '#6a8898'; // antenna
    const A = '#88a8b8'; // antenna bright
    const yd= '#aa9920'; // yellow marking dark
    const y2= '#ccbb30'; // yellow marking
    const yl= '#ddcc44'; // yellow marking light
    const cd= '#505a68'; // catapult dark
    const cl= '#687880'; // catapult light
    const pd= '#3a4858'; // aircraft dark (parked)
    const p = '#506070'; // aircraft body
    const pl= '#687880'; // aircraft light
    const pw= '#788a98'; // aircraft wing

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,a,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,a,A,a,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,ad,ad,a,A,a,ad,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,bd,b,B,bl,bl,B,b,bd,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,b,B,w,W,W,w,B,b,h,h,h,h,h,h,h,h,h,h,h,_,_,_],
        [_,_,_,_,_,_,_,h,H,dl,yd,y2,yl,dl,dl,dl,dl,cd,cl,dl,dl,dl,cd,cl,dl,dl,dl,dl,cd,cl,dl,dl,dl,dl,dl,dl,pd,p,pl,D,b,B,wd,w,wh,w,B,b,D,dl,dl,dl,dl,dl,dl,pd,p,pl,D,dl,H,h,_,_],
        [_,_,_,_,_,_,h,H,D,yd,y2,yl,D,D,dl,D,cd,cl,D,D,dl,D,cd,cl,D,D,dl,D,cd,cl,D,D,dl,D,D,pw,pw,p,pd,D,b,bl,wd,w,W,wd,bl,b,D,D,dl,D,D,pw,pw,p,pd,D,D,dl,D,H,h,_],
        [_,_,_,_,_,h,H,D,yd,y2,yl,D,D,D,cd,cl,D,D,D,D,cd,cl,D,D,D,D,cd,cl,D,D,D,D,D,D,D,pw,pd,D,D,bd,b,B,bl,bl,B,b,bd,D,D,D,D,D,D,D,pw,pd,D,D,D,D,D,H,h,_],
        [_,_,_,_,h,H,D,yd,y2,yl,D,D,D,D,cd,cl,D,D,D,D,cd,cl,D,D,D,D,cd,cl,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,H,h],
        [_,_,_,h,H,D,D,D,D,D,D,D,D,cd,cl,D,D,D,D,cd,cl,D,D,D,D,cd,cl,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,H,h],
        [_,_,_,h,H,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,H,h],
        [_,_,_,_,h,H,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,H,h,_],
        [_,_,_,_,_,h,H,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,H,h,_,_],
        [_,_,_,_,_,_,h,H,hl,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,hl,H,h,_,_,_],
        [_,_,_,_,_,_,_,h,H,hl,hl,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,hl,H,h,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,h,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,h,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,hd,h,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── Iranian Patrol Boat (36x14 at 3x scale) ──
function createIranBoatSprite() {
    const s = 3;
    const c = makeCanvas(36 * s, 14 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const hd= '#2a3518'; // hull darkest
    const h = '#3a4a28'; // hull dark olive
    const H = '#4e5e3a'; // hull mid
    const hl= '#6a7a52'; // hull light
    const hx= '#808e68'; // hull highlight
    const dd= '#344828'; // deck darkest
    const d = '#4a5a38'; // deck dark
    const D = '#5e6e4a'; // deck mid
    const dl= '#728260'; // deck light
    const gd= '#5a6848'; // gun turret dark
    const g = '#728860'; // gun turret
    const G = '#8a9a78'; // gun barrel
    const gl= '#a0b090'; // gun barrel light
    const bd= '#3a4830'; // cabin dark
    const b = '#4e5e42'; // cabin
    const B = '#627558'; // cabin mid
    const bl= '#788a6e'; // cabin light
    const wd= '#607850'; // window dark
    const w = '#88a070'; // window
    const wh= '#a0b890'; // window bright
    const rd= '#442210'; // waterline darkest
    const r = '#663318'; // waterline dark
    const R = '#884422'; // waterline
    const f = '#cc1818'; // flag red
    const fd= '#991010'; // flag dark red
    const fw= '#dddddd'; // flag white accent

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,gl,_,_,f,fd],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,gl,G,gl,_,fd,f],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,gd,g,G,g,gd,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,gd,g,G,g,H,h,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,h,H,dl,D,D,bd,b,B,bl,B,b,bd,D,D,dl,D,D,dl,gd,g,gd,dl,H,h],
        [_,_,_,_,_,_,_,_,_,_,_,h,H,D,dl,D,bd,b,B,w,wh,w,B,b,bd,D,D,dl,D,D,D,D,D,D,D,H],
        [_,_,_,_,_,_,_,_,_,_,h,H,D,D,D,dd,bd,b,B,wd,w,wd,B,b,bd,dd,D,D,D,D,D,D,D,D,D,H],
        [_,_,_,_,_,_,_,_,_,h,H,D,D,D,D,D,d,d,d,d,d,d,d,d,d,D,D,D,D,D,D,D,D,D,D,H],
        [_,_,_,_,_,_,_,_,_,h,H,hl,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,hl,H,h],
        [_,_,_,_,_,_,_,_,_,_,h,H,hl,hl,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,hl,H,h,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,h,R,r,R,r,R,r,R,r,R,r,R,r,R,r,R,r,R,r,R,r,h,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,h,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,r,rd,h,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── Sea Mine (16x16 at 3x scale) ──
function createMineSprite() {
    const s = 3;
    const c = makeCanvas(16 * s, 16 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const md= '#2a2420'; // metal darkest
    const m = '#3e3830'; // metal dark
    const M = '#585048'; // metal mid
    const ml= '#706860'; // metal light
    const mx= '#888078'; // metal highlight
    const rd= '#4a2818'; // rust dark
    const r = '#6a3820'; // rust
    const rl= '#885030'; // rust light
    const rx= '#a06838'; // rust highlight
    const sd= '#606060'; // spike dark
    const S = '#888888'; // spike
    const sl= '#a8a8a8'; // spike light
    const sx= '#c0c0c0'; // spike tip
    const ch= '#3a3a3a'; // chain dark
    const C = '#505050'; // chain
    const cl= '#686868'; // chain light

    const rows = [
        [_,_,_,_,_,_,_,sx,sx,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,sx,sl,sl,sx,_,_,_,_,_,_],
        [_,_,_,sx,_,_,sd,S,S,sd,_,_,sx,_,_,_],
        [_,_,sx,sl,_,_,md,m,m,md,_,_,sl,sx,_,_],
        [_,_,_,sd,md,m,M,ml,ml,M,m,md,sd,_,_,_],
        [_,_,_,m,M,ml,mx,mx,mx,mx,ml,M,m,_,_,_],
        [_,sx,sd,m,ml,mx,mx,rl,rx,mx,mx,ml,m,sd,sx,_],
        [sx,sl,S,M,ml,mx,rl,rx,rx,rl,mx,ml,M,S,sl,sx],
        [sx,sl,S,M,ml,mx,r,rx,rx,r,mx,ml,M,S,sl,sx],
        [_,sx,sd,m,ml,mx,mx,r,rl,mx,mx,ml,m,sd,sx,_],
        [_,_,_,m,M,ml,mx,mx,mx,mx,ml,M,m,_,_,_],
        [_,_,_,sd,md,m,M,ml,ml,M,m,md,sd,_,_,_],
        [_,_,sx,sl,_,_,md,r,r,md,_,_,sl,sx,_,_],
        [_,_,_,sx,_,_,_,ch,ch,_,_,_,sx,_,_,_],
        [_,_,_,_,_,_,_,C,cl,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,ch,C,_,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── Surveillance Drone MQ-9 style (28x14 at 3x scale) ──
function createDroneSprite() {
    const s = 3;
    const c = makeCanvas(28 * s, 14 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const bd= '#3a3a48'; // body darkest
    const b = '#4e4e5e'; // body dark
    const B = '#666678'; // body mid
    const bl= '#7e7e90'; // body light
    const bx= '#9898a8'; // body highlight
    const wd= '#6a7888'; // wing dark
    const w = '#8090a0'; // wing mid
    const W = '#98a8b8'; // wing light
    const wx= '#b0c0cc'; // wing highlight
    const sd= '#505060'; // sensor dark
    const sn= '#707888'; // sensor
    const sl= '#90a0b0'; // sensor light
    const td= '#484858'; // tail dark
    const t = '#606070'; // tail
    const tl= '#787888'; // tail light
    const rd= '#882020'; // nav light red
    const r = '#cc3333'; // nav light red bright
    const gd= '#208820'; // nav light green
    const g = '#33cc33'; // nav light green bright

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,td,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,td,t,tl,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,bd,b,b,b,b,b,b,B,bl,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,bd,b,b,B,B,b,B,bl,bl,B,b,bd,B,_,_],
        [_,_,_,_,_,wd,w,W,wx,W,w,wd,bd,b,B,bl,bx,bl,B,bl,bx,bx,bl,b,_,td,_,_],
        [_,_,_,wd,w,W,wx,wx,W,w,wd,b,b,B,bl,bx,bx,bl,B,bl,bx,bx,bl,B,b,b,td,_],
        [_,sd,sn,sl,sn,sd,bd,b,B,bl,bx,bl,B,bl,bx,bx,bx,bl,B,bl,bx,bx,bl,B,b,b,td,_],
        [_,_,_,wd,w,W,wx,wx,W,w,wd,b,b,B,bl,bx,bx,bl,B,bl,bx,bx,bl,B,b,b,td,_],
        [_,_,_,_,_,wd,w,W,wx,W,w,wd,bd,b,B,bl,bx,bl,B,bl,bx,bx,bl,b,_,td,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,bd,b,b,B,B,b,B,bl,bl,B,b,bd,B,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,bd,b,b,b,b,b,b,B,bl,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,td,t,tl,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,td,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];

    for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    return c;
}

// ── Oil Platform (32x32 at 3x scale) ──
function createPlatformSprite() {
    const s = 3;
    const c = makeCanvas(32 * s, 32 * s);
    const ctx = c.getContext('2d');

    const _ = null;
    const md= '#383838'; // metal darkest
    const m = '#4e4e4e'; // metal dark
    const M = '#686868'; // metal mid
    const ml= '#808080'; // metal light
    const mx= '#989898'; // metal highlight
    const dd= '#303030'; // dark metal
    const rd= '#3e2210'; // rust darkest
    const r = '#5a3418'; // rust dark
    const R = '#704420'; // rust
    const rl= '#886030'; // rust light
    const fd= '#cc5500'; // flame darkest
    const f = '#ee7722'; // flame dark
    const F = '#ff9933'; // flame mid
    const fl= '#ffbb44'; // flame light
    const fx= '#ffdd66'; // flame bright
    const fy= '#ffee88'; // flame core
    const wd= '#707070'; // wall dark
    const w = '#8a8a8a'; // wall
    const W = '#a0a0a0'; // wall light
    const wx= '#b8b8b8'; // wall highlight
    const pd= '#505050'; // pipe dark
    const p = '#686868'; // pipe
    const pl= '#808080'; // pipe light
    const hd= '#3a5040'; // helipad dark
    const hp= '#4a6850'; // helipad
    const hl= '#5a7860'; // helipad light
    const hm= '#dddd44'; // helipad H marking
    const cd= '#444444'; // crane dark
    const cr= '#5a5a5a'; // crane
    const cl= '#707070'; // crane light
    const lg= '#303830'; // leg dark
    const L = '#404840'; // leg
    const ll= '#505850'; // leg light

    const rows = [
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,fy,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,fx,fy,fx,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,fl,fx,fy,fx,fl,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,F,fl,fx,fl,F,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,fd,f,F,fl,F,f,fd,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,dd,md,dd,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,dd,m,dd,_,_,_,_,_,cr,cl,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,dd,m,dd,_,_,_,_,cd,cr,cl,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,dd,m,dd,_,_,_,cd,cr,cr,_,_,_,_,_],
        [_,_,_,_,_,_,md,m,m,m,m,m,m,m,m,m,m,m,m,M,m,m,m,m,cd,cr,m,m,m,m,m,_],
        [_,_,_,_,_,_,m,M,ml,mx,wx,W,w,M,ml,mx,wx,W,w,M,m,hd,hp,hl,cr,cd,hp,hd,M,ml,m,_],
        [_,_,_,_,_,_,m,M,wd,dd,dd,pd,p,M,wd,dd,dd,pd,p,M,m,hd,hp,hm,hp,hp,hm,hp,hd,M,m,_],
        [_,_,_,_,_,_,m,M,wd,dd,r,pd,p,M,wd,dd,R,pd,p,M,m,hd,hm,hp,hp,hp,hp,hm,hd,M,m,_],
        [_,_,_,_,_,_,m,M,wd,dd,R,pd,p,M,wd,r,dd,pd,p,M,m,hd,hp,hm,hp,hp,hm,hp,hd,M,m,_],
        [_,_,_,_,_,_,m,M,wd,dd,dd,pd,p,M,wd,dd,dd,pd,p,M,m,hd,hp,hp,hm,hm,hp,hp,hd,M,m,_],
        [_,_,_,_,_,_,m,M,ml,w,w,w,w,M,ml,w,w,w,w,M,m,hd,hp,hl,hp,hp,hl,hp,hd,M,m,_],
        [_,_,_,_,_,_,m,M,ml,mx,wx,W,w,M,ml,mx,wx,W,w,M,m,m,m,m,m,m,m,m,m,M,m,_],
        [_,_,_,_,_,_,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,_],
        [_,_,_,_,_,_,_,_,_,dd,_,_,_,_,_,dd,_,_,_,_,_,dd,_,_,_,_,dd,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,dd,_,_,_,_,_,dd,_,_,_,_,_,dd,_,_,_,_,dd,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,lg,L,lg,_,_,_,lg,L,lg,_,_,_,lg,L,lg,_,lg,L,lg,_,_,_,_,_],
        [_,_,_,_,_,_,_,lg,L,r,L,lg,_,lg,L,R,L,lg,_,lg,L,r,L,lg,L,R,L,lg,_,_,_,_],
        [_,_,_,_,_,_,lg,L,_,_,_,L,lg,L,_,_,_,L,lg,L,_,_,_,L,_,_,_,L,lg,_,_,_],
        [_,_,_,_,_,lg,L,_,_,_,_,_,L,_,_,_,_,_,L,_,_,_,_,_,_,_,_,_,L,lg,_,_],
        [_,_,_,_,lg,L,_,_,_,_,_,_,L,_,_,_,_,_,L,_,_,_,_,_,_,_,_,_,_,L,lg,_],
        [_,_,_,lg,L,_,_,_,_,_,_,_,L,_,_,_,_,_,L,_,_,_,_,_,_,_,_,_,_,_,L,lg],
        [_,_,lg,L,_,_,_,_,_,_,_,_,L,lg,lg,lg,lg,lg,L,_,_,_,_,_,_,_,_,_,_,_,L,lg],
        [_,lg,L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,L],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
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


// ── Character Portraits (32x32 logical, 2x scale = 64x64) — High Detail ──
function createPortraitSprite(type) {
    const s = 2;
    const c = makeCanvas(32 * s, 32 * s);
    const ctx = c.getContext('2d');
    const _ = null;

    if (type === 'trump') {
        // Hair: voluminous blonde swept right
        const H = '#e8bb33'; const Hh = '#ddaa22'; const Hd = '#cc9911'; const Hs = '#f0cc55';
        // Skin: orange-tan, 5 tones
        const S = '#ecc898'; const S2 = '#ddb080'; const S3 = '#cc9a68'; const S4 = '#bb8858'; const S5 = '#aa7848';
        // Eyes
        const Ew = '#ffffff'; const Ei = '#4488bb'; const Ep = '#223344';
        // Brows
        const Br = '#aa8822';
        // Nose/mouth/lips
        const N = '#ddaa80'; const Li = '#cc6655'; const Lp = '#bb5544';
        // Tie (red)
        const T = '#cc2222'; const Td = '#aa1111'; const Tl = '#dd3333';
        // Suit (dark navy)
        const J = '#1a1a2e'; const Jm = '#2a2a3e'; const Jl = '#3a3a4e'; const Jh = '#4a4a5e';
        // Shirt
        const W = '#eaeaea'; const Wd = '#d0d0d0';
        const rows = [
            [_,_,_,_,_,_,_,_,Hs,H,H,H,H,H,H,H,H,H,H,H,H,Hs,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,Hs,H,H,Hh,H,H,H,H,H,H,H,H,H,H,H,Hs,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,Hs,H,H,Hh,H,H,Hs,H,H,Hs,H,H,H,H,H,Hh,H,Hs,_,_,_,_,_,_],
            [_,_,_,_,_,Hs,H,H,Hh,H,H,Hs,Hs,H,H,Hs,Hs,H,H,H,H,H,H,H,Hs,_,_,_,_,_],
            [_,_,_,_,_,H,H,Hh,Hd,H,H,H,Hs,H,H,H,Hs,H,H,H,H,H,Hd,H,H,_,_,_,_,_],
            [_,_,_,_,_,H,Hh,Hd,Hd,Hh,H,H,H,H,H,H,H,H,H,H,H,Hd,Hd,Hh,H,_,_,_,_,_],
            [_,_,_,_,_,H,Hd,Hd,Hd,Hh,H,H,H,H,H,H,H,H,H,H,Hh,Hd,Hd,Hd,H,_,_,_,_,_],
            [_,_,_,_,_,Hd,Hd,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,Hd,Hd,_,_,_,_,_],
            [_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_],
            [_,_,_,_,_,_,S,S,S2,S,S,S,S,S,S,S,S,S,S,S,S,S2,S,S,_,_,_,_,_,_],
            [_,_,_,_,_,_,S2,S,Br,Br,Br,S,S,S,S,S,S,Br,Br,Br,S,S,S,S2,_,_,_,_,_,_],
            [_,_,_,_,_,_,S2,S,Ew,Ew,Ei,Ei,S,S,S,S,Ei,Ei,Ew,Ew,S,S,S,S2,_,_,_,_,_,_],
            [_,_,_,_,_,_,S2,S,Ew,Ep,Ei,Ei,S,S,S,S,Ei,Ei,Ep,Ew,S,S,S,S2,_,_,_,_,_,_],
            [_,_,_,_,_,_,S3,S2,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S2,S3,_,_,_,_,_,_],
            [_,_,_,_,_,_,S3,S2,S,S,S,S,N,N,N,N,N,N,S,S,S,S,S2,S3,_,_,_,_,_,_],
            [_,_,_,_,_,_,S3,S2,S,S,S,N,N,S2,S2,N,N,N,S,S,S,S,S2,S3,_,_,_,_,_,_],
            [_,_,_,_,_,_,S4,S3,S2,S,S,S,N,N,N,N,N,S,S,S,S,S2,S3,S4,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,S3,S2,S,S,S,S,S,S,S,S,S,S,S,S,S2,S3,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,S4,S3,S,Li,Li,Li,Li,Li,Li,Li,Li,Li,S,S3,S4,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,S3,S2,S,Lp,Li,Li,Li,Li,Li,Lp,S,S2,S3,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,S4,S3,S2,S,S,Li,Li,S,S,S,S2,S3,S4,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S4,S3,S3,S2,S2,S2,S2,S3,S3,S4,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S5,S4,S3,S3,S3,S3,S4,S5,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,W,W,Wd,Wd,T,Tl,Tl,T,Wd,Wd,W,W,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,W,W,Wd,Wd,T,T,Tl,Tl,T,T,Wd,Wd,W,W,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,J,Jm,W,Wd,Wd,Td,T,Tl,Tl,T,Td,Wd,Wd,W,Jm,J,_,_,_,_,_,_],
            [_,_,_,_,_,J,J,Jm,Jl,Wd,Wd,Td,T,T,T,T,Td,Wd,Wd,Jl,Jm,J,J,_,_,_,_,_],
            [_,_,_,_,J,J,J,Jm,Jl,Jl,Wd,Td,T,T,T,T,Td,Wd,Jl,Jl,Jm,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,Jm,Jl,Jl,Jh,Td,Td,T,T,Td,Td,Jh,Jl,Jl,Jm,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,Jm,Jl,Jl,Jh,Td,Td,Td,Td,Jh,Jl,Jl,Jm,J,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,Jm,Jm,Jl,Jl,Jh,Jh,Jh,Jh,Jl,Jl,Jm,Jm,J,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,J,Jm,Jm,Jl,Jl,Jl,Jl,Jl,Jl,Jm,Jm,J,J,J,J,J,J,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'hegseth') {
        // Hair: short military-cut sandy/brown
        const H = '#6a5a3a'; const Hh = '#5a4a2a'; const Hd = '#4a3a1a';
        // Skin: 5 tones
        const S = '#ddb088'; const S2 = '#cc9a78'; const S3 = '#bb8a68'; const S4 = '#aa7a58'; const S5 = '#997050';
        // Eyes
        const Ew = '#eeeeee'; const Ei = '#445566'; const Ep = '#222233';
        // Brows
        const Br = '#4a3a22';
        // Nose/mouth
        const N = '#ccaa88'; const Li = '#cc8877'; const Lp = '#bb7766';
        // Military jacket: olive/army green, 4 shades
        const J = '#2a3a22'; const Jm = '#3a4a32'; const Jl = '#4a5a42'; const Jh = '#5a6a52';
        // Collar / shirt
        const W = '#ccccbb'; const Wd = '#aaaaaa';
        // Gold star
        const St = '#ccaa33'; const Stl = '#ddbb44';
        const rows = [
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,H,H,H,H,H,H,H,H,H,H,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,H,H,Hh,Hh,H,H,H,H,Hh,Hh,H,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,H,Hh,Hd,Hh,H,H,H,H,Hh,Hd,Hh,H,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,Hh,Hd,Hd,Hd,Hh,H,H,Hh,Hd,Hd,Hd,Hh,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,Hh,Hd,Hd,Hd,Hd,Hh,Hh,Hd,Hd,Hd,Hd,Hh,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S,S2,S,S,S,S,S,S,S,S,S,S2,S,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S2,Br,Br,Br,S,S,S,S,Br,Br,Br,S,S2,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S2,Ew,Ew,Ei,Ei,S,S,Ei,Ei,Ew,Ew,S,S2,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S2,Ew,Ep,Ei,Ei,S,S,Ei,Ei,Ep,Ew,S,S2,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S3,S2,S,S,S,S,S,S,S,S,S,S2,S3,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S3,S2,S,S,N,N,N,N,N,S,S,S2,S3,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S3,S2,S,N,N,S2,S2,N,N,S,S,S2,S3,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S4,S3,S2,S,N,N,N,N,S,S,S2,S3,S4,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,S4,S3,S2,S,S,S,S,S,S,S,S2,S3,S4,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S4,S3,Li,Li,Li,Li,Li,Li,S3,S4,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,S3,S2,Lp,Li,Li,Lp,S2,S3,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,S4,S3,S2,S2,S2,S2,S3,S4,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,S4,S4,S3,S3,S4,S4,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,S5,S4,S4,S4,S4,S5,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,W,W,Wd,Wd,J,Jm,Jm,J,Wd,Wd,W,W,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,W,W,Wd,Wd,J,J,Jm,Jm,J,J,Wd,Wd,W,W,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,J,Jm,Wd,Wd,J,J,Jm,Jm,Jm,Jm,J,J,Wd,Wd,Jm,J,_,_,_,_,_,_],
            [_,_,_,_,_,_,J,J,Jm,Jl,St,Stl,J,Jm,Jl,Jl,Jm,J,Stl,St,Jl,Jm,J,J,_,_,_,_,_],
            [_,_,_,_,_,J,J,J,Jm,Jl,St,St,Jm,Jl,Jl,Jl,Jl,Jm,St,St,Jl,Jm,J,J,J,_,_,_,_],
            [_,_,_,_,J,J,J,J,Jm,Jl,Jl,Jh,Jm,Jl,Jl,Jl,Jl,Jm,Jh,Jl,Jl,Jm,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,Jm,Jl,Jl,Jh,Jh,Jl,Jl,Jl,Jl,Jh,Jh,Jl,Jl,Jm,J,J,J,J,J,_,_],
            [_,_,_,J,J,J,J,J,J,Jm,Jl,Jl,Jh,Jh,Jh,Jh,Jh,Jh,Jl,Jl,Jm,J,J,J,J,J,J,_,_],
            [_,_,_,J,J,J,J,J,J,Jm,Jm,Jl,Jl,Jl,Jl,Jl,Jl,Jl,Jl,Jm,Jm,J,J,J,J,J,J,_,_],
            [_,_,_,J,J,J,J,J,J,J,Jm,Jm,Jl,Jl,Jl,Jl,Jl,Jl,Jm,Jm,J,J,J,J,J,J,J,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'kushner') {
        // Hair: dark, neatly combed to side
        const H = '#222233'; const Hh = '#333344'; const Hd = '#151528';
        // Skin: pale, 5 tones
        const S = '#f0d0a8'; const S2 = '#e0c098'; const S3 = '#d0b088'; const S4 = '#c0a078'; const S5 = '#b09068';
        // Eyes
        const Ew = '#eeeeff'; const Ei = '#445566'; const Ep = '#222233';
        // Brows
        const Br = '#2a2a33';
        // Nose/mouth
        const N = '#ddbb99'; const Li = '#ccaa99'; const Lp = '#bb9988';
        // Suit: navy blue, 4 shades
        const J = '#1a1a30'; const Jm = '#2a2a40'; const Jl = '#3a3a50'; const Jh = '#4a4a60';
        // Shirt
        const W = '#eeeeff'; const Wd = '#ccccdd';
        // Light blue tie
        const T = '#5577bb'; const Td = '#4466aa'; const Tl = '#6688cc';
        const rows = [
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,H,H,H,H,H,H,H,H,H,H,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,H,H,Hh,Hd,H,H,H,H,Hd,Hh,H,H,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,H,Hh,Hd,Hd,Hh,H,H,Hh,Hd,Hd,Hh,H,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,Hh,Hd,Hd,Hd,Hd,Hh,Hh,Hd,Hd,Hd,Hd,Hh,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,Hh,Hd,Hd,Hd,Hd,Hd,Hd,Hd,Hd,Hd,Hd,Hh,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S,S2,S,S,S,S,S,S,S,S2,S,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S2,Br,Br,S,S,S,S,S,Br,Br,S2,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S2,Ew,Ew,Ei,S,S,S,Ei,Ew,Ew,S2,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S2,Ew,Ep,Ei,S,S,S,Ei,Ep,Ew,S2,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S3,S2,S,S,S,S,S,S,S,S,S2,S3,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S3,S2,S,N,N,N,N,N,S,S,S2,S3,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S3,S2,S,N,S2,S2,N,N,S,S,S2,S3,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S4,S3,S2,S,N,N,N,S,S,S2,S3,S4,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S4,S3,S2,S,S,S,S,S,S,S2,S3,S4,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,S4,S3,Li,Li,Li,Li,Li,S3,S4,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,S3,S2,Lp,Li,Lp,S2,S3,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,S4,S3,S2,S2,S3,S4,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,S4,S4,S4,S4,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,S5,S4,S4,S5,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,W,W,Wd,Wd,T,Tl,Tl,T,Wd,Wd,W,W,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,W,W,Wd,Wd,T,T,Tl,Tl,T,T,Wd,Wd,W,W,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,J,Jm,Wd,Wd,Td,T,T,Tl,Tl,T,T,Td,Wd,Wd,Jm,J,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,J,J,Jm,Jl,Wd,Td,T,Td,Tl,Tl,Td,T,Td,Wd,Jl,Jm,J,J,_,_,_,_,_,_],
            [_,_,_,_,_,J,J,J,Jm,Jl,Jl,Td,Td,Td,T,T,Td,Td,Td,Jl,Jl,Jm,J,J,J,_,_,_,_,_],
            [_,_,_,_,J,J,J,J,Jm,Jl,Jl,Jh,Td,Td,Td,Td,Td,Td,Jh,Jl,Jl,Jm,J,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,J,Jm,Jl,Jl,Jh,Jh,Td,Td,Td,Td,Jh,Jh,Jl,Jl,Jm,J,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,J,Jm,Jl,Jl,Jh,Jh,Jh,Jh,Jh,Jh,Jl,Jl,Jm,J,J,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,J,Jm,Jm,Jl,Jl,Jl,Jl,Jl,Jl,Jl,Jl,Jm,Jm,J,J,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,J,J,Jm,Jm,Jl,Jl,Jl,Jl,Jl,Jl,Jm,Jm,J,J,J,J,J,J,J,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'asmongold') {
        // Hair: long flowing brown, very prominent - his signature look
        const H = '#5a3a1a'; const Hh = '#7a4a22'; const Hd = '#3a2a10'; const Hs = '#8a5a2a';
        // Skin: pale, 5 tones
        const S = '#e0c0a0'; const S2 = '#d0b090'; const S3 = '#c0a080'; const S4 = '#b09070'; const S5 = '#a08060';
        // Eyes
        const Ew = '#eeeeee'; const Ei = '#445566'; const Ep = '#222233';
        // Brows
        const Br = '#4a3a22';
        // Beard: scraggly brown
        const Bd = '#5a3a22'; const Bm = '#6a4a2a'; const Bl = '#7a5a32';
        // Nose/mouth
        const N = '#ccaa88'; const Li = '#cc8877';
        // T-shirt: dark gray/black, casual
        const T = '#333333'; const Tm = '#444444'; const Tl = '#555555'; const Th = '#666666';
        // Headset
        const Hp = '#2a2a2a'; const Hpm = '#3a3a3a';
        const rows = [
            [_,_,_,_,_,_,H,H,H,H,H,Hh,Hh,H,H,H,H,H,H,H,Hh,H,H,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,H,Hh,Hs,H,Hh,Hs,H,H,H,H,H,H,H,H,Hs,Hh,H,Hs,H,H,_,_,_,_,_],
            [_,_,_,_,H,Hh,Hs,H,H,Hs,H,H,H,H,H,H,H,H,H,H,Hs,H,H,Hs,Hh,H,_,_,_,_],
            [_,_,_,H,Hh,Hs,H,H,H,H,H,Hh,H,H,H,H,H,H,H,H,H,H,H,H,Hs,Hh,H,_,_,_],
            [_,_,_,H,Hh,H,Hd,H,H,H,Hh,Hd,Hh,H,H,H,H,Hh,Hd,Hh,H,H,H,Hd,H,Hh,H,_,_,_],
            [_,_,_,H,Hd,Hd,Hd,H,Hh,Hd,Hd,Hd,Hh,H,H,Hh,Hd,Hd,Hd,Hh,H,Hd,Hd,Hd,H,_,_,_],
            [_,_,H,Hd,Hd,_,_,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,_,_,Hd,Hd,H,_,_,_],
            [_,_,H,Hd,Hp,Hpm,_,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,_,_,Hd,Hd,H,_,_,_],
            [_,_,H,Hd,_,Hp,_,S,S2,S,S,S,S,S,S,S,S,S,S,S,S2,S,_,Hp,_,Hd,H,_,_,_],
            [_,_,H,Hd,_,Hp,_,S2,Br,Br,Br,S,S,S,S,S,S,Br,Br,Br,S,S2,_,Hp,_,Hd,H,_,_,_],
            [_,_,H,Hh,_,Hpm,_,S2,Ew,Ew,Ei,Ei,S,S,S,S,Ei,Ei,Ew,Ew,S,S2,_,Hpm,_,Hh,H,_,_,_],
            [_,_,H,Hh,_,_,_,S2,Ew,Ep,Ei,Ei,S,S,S,S,Ei,Ei,Ep,Ew,S,S2,_,_,_,Hh,H,_,_,_],
            [_,_,_,H,Hh,_,_,S3,S2,S,S,S,S,S,S,S,S,S,S,S,S2,S3,_,_,Hh,H,_,_,_,_],
            [_,_,_,H,Hh,_,_,S3,S2,S,S,N,N,N,N,N,N,S,S,S,S2,S3,_,_,Hh,H,_,_,_,_],
            [_,_,_,_,H,Hh,_,S3,S2,S,N,N,S2,S2,N,N,N,S,S,S2,S3,_,Hh,H,_,_,_,_,_,_],
            [_,_,_,_,H,Hh,_,S4,S3,Bd,S,S,N,N,N,N,S,S,Bd,S3,S4,_,Hh,H,_,_,_,_,_,_],
            [_,_,_,_,_,H,Hh,S4,Bd,Bm,Bd,S,S,S,S,S,S,Bd,Bm,Bd,S4,Hh,H,_,_,_,_,_,_,_],
            [_,_,_,_,_,H,Hh,_,Bd,Bm,Bl,Bd,Li,Li,Li,Li,Bd,Bl,Bm,Bd,_,Hh,H,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,H,_,_,Bd,Bm,Bl,Bm,Li,Li,Bm,Bl,Bm,Bd,_,_,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,H,Hh,_,_,Bd,Bm,Bl,Bm,Bm,Bl,Bm,Bd,_,_,Hh,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,H,Hh,_,_,Bd,Bd,Bm,Bm,Bd,Bd,_,_,Hh,H,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,H,Hh,_,_,_,S5,S4,S4,S5,_,_,_,Hh,H,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,Hh,_,_,S5,S4,S4,S5,_,_,Hh,H,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,Hh,T,Tm,Tl,Tl,Tl,Tl,Tm,T,Hh,H,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,T,T,Tm,Tl,Th,Th,Tl,Tm,T,T,H,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,H,T,T,Tm,Tl,Tl,Th,Th,Tl,Tl,Tm,T,T,H,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,H,T,T,T,Tm,Tl,Tl,Th,Th,Tl,Tl,Tm,T,T,T,H,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,H,Hh,T,T,T,Tm,Tm,Tl,Tl,Tl,Tl,Tm,Tm,T,T,T,Hh,H,_,_,_,_,_,_,_],
            [_,_,_,_,H,Hh,Hd,T,T,T,T,Tm,Tm,Tl,Tl,Tm,Tm,T,T,T,T,Hd,Hh,H,_,_,_,_,_,_],
            [_,_,_,H,Hh,Hd,_,T,T,T,T,Tm,Tm,Tm,Tm,Tm,Tm,T,T,T,T,_,Hd,Hh,H,_,_,_,_,_],
            [_,_,_,H,Hd,_,_,T,T,T,T,T,Tm,Tm,Tm,Tm,T,T,T,T,T,_,_,Hd,H,_,_,_,_,_],
            [_,_,H,Hd,_,_,_,T,T,T,T,T,T,Tm,Tm,T,T,T,T,T,T,_,_,_,Hd,H,_,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    if (type === 'fuentes') {
        // Hair: styled dark black
        const H = '#1a1a22'; const Hh = '#2a2a33'; const Hd = '#0e0e18'; const Hs = '#3a3a44';
        // Skin: 5 tones (young, round face)
        const S = '#ddb088'; const S2 = '#cc9a78'; const S3 = '#bb8a68'; const S4 = '#aa7a58'; const S5 = '#997050';
        // Eyes
        const Ew = '#eeeeee'; const Ei = '#223344'; const Ep = '#111122';
        // Brows
        const Br = '#1a1a22';
        // Nose/mouth
        const N = '#ccaa88'; const Li = '#cc8877'; const Lp = '#bb7766';
        // Suit: dark navy, 4 shades
        const J = '#141428'; const Jm = '#1e1e38'; const Jl = '#2a2a48'; const Jh = '#3a3a58';
        // Shirt
        const W = '#e0e0e8'; const Wd = '#ccccdd';
        // Tie: dark navy
        const T = '#1a1a44'; const Tl = '#2a2a55';
        // Flag pin: red + blue dots
        const Fr = '#cc2222'; const Fb = '#2244aa';
        const rows = [
            [_,_,_,_,_,_,_,_,_,_,H,H,H,H,H,H,H,H,H,H,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,H,H,Hh,Hs,H,H,H,H,Hs,Hh,H,H,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,H,Hh,Hd,Hs,Hh,H,H,Hh,Hs,Hd,Hh,H,H,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,Hh,Hd,Hd,Hd,Hh,H,H,Hh,Hd,Hd,Hd,Hh,H,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,Hh,Hd,Hd,Hd,Hd,Hh,Hh,Hd,Hd,Hd,Hd,Hh,H,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,H,Hh,Hd,Hd,Hd,Hd,Hd,Hd,Hd,Hd,Hd,Hd,Hh,H,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S,S,S,S,S,S,S,S,S,S,S,S,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S,S,S2,S,S,S,S,S,S,S2,S,S,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S2,Br,Br,Br,S,S,S,S,Br,Br,Br,S2,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S2,Ew,Ew,Ei,Ei,S,S,Ei,Ei,Ew,Ew,S2,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S2,Ew,Ep,Ei,Ei,S,S,Ei,Ei,Ep,Ew,S2,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S3,S2,S,S,S,S,S,S,S,S,S2,S3,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S3,S2,S,S,N,N,N,N,S,S,S2,S3,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S3,S2,S,N,N,S2,S2,N,N,S,S2,S3,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S4,S3,S2,S,N,N,N,N,S,S2,S3,S4,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,S4,S3,S2,S,S,S,S,S,S,S2,S3,S4,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,S4,S3,S2,Li,Li,Li,Li,S2,S3,S4,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,S4,S3,Lp,Li,Li,Lp,S3,S4,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,S4,S3,S2,S2,S3,S4,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,S5,S4,S4,S4,S4,S5,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,S5,S5,S4,S4,S5,S5,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,W,W,Wd,Wd,T,Tl,Tl,T,Wd,Wd,W,W,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,W,W,Wd,Wd,T,T,Tl,Tl,T,T,Wd,Wd,W,W,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,J,Jm,Wd,Wd,T,T,T,Tl,Tl,T,T,T,Wd,Wd,Jm,J,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,J,J,Jm,Jl,Fr,Fb,T,T,Tl,Tl,T,T,Wd,Jl,Jm,J,J,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,J,J,J,Jm,Jl,Jl,Jh,T,T,T,T,T,T,Jh,Jl,Jl,Jm,J,J,J,_,_,_,_,_,_],
            [_,_,_,_,J,J,J,J,Jm,Jl,Jl,Jh,Jh,T,T,T,T,Jh,Jh,Jl,Jl,Jm,J,J,J,J,_,_,_,_],
            [_,_,_,J,J,J,J,J,Jm,Jl,Jl,Jh,Jh,Jh,T,T,Jh,Jh,Jh,Jl,Jl,Jm,J,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,J,Jm,Jl,Jl,Jh,Jh,Jh,Jh,Jh,Jh,Jl,Jl,Jm,J,J,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,J,Jm,Jm,Jl,Jl,Jl,Jl,Jl,Jl,Jl,Jl,Jm,Jm,J,J,J,J,J,J,_,_,_],
            [_,_,_,J,J,J,J,J,J,J,Jm,Jm,Jl,Jl,Jl,Jl,Jl,Jl,Jm,Jm,J,J,J,J,J,J,J,_,_,_],
        ];
        for (let y = 0; y < rows.length; y++) drawPixelRow(ctx, y, rows[y], s);
    }

    // SC1 green phosphor border
    ctx.strokeStyle = '#1a3a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, c.width, c.height);

    return c;
}
