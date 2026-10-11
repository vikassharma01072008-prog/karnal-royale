// ============================================
// MAP.JS — M2 REAL
// 16 zone photos as ground. Tile strips hide seams.
// ============================================

const TILE_DIR = 'assets/tile/';
const ZONE_DIR = 'assets/zones/';

// ---------- WORLD ----------
const WORLD_COLS = 4;
const WORLD_ROWS = 4;
const ZONE_SIZE = 1024;                 // each zone = 1024x1024 world units
const WORLD_W = WORLD_COLS * ZONE_SIZE; // 4096
const WORLD_H = WORLD_ROWS * ZONE_SIZE; // 4096

// ---------- ZONE LAYOUT (matches map.png) ----------
const ZONES = [
  // Row 0 — top (Karan Lake area)
  { id: 'karan_lake', name: 'KARAN LAKE',       img: 'karanpark.png',  row: 0, col: 0, water: true  },
  { id: 'exit_gate',  name: 'KARNAL EXIT GATE', img: 'exit.png',       row: 0, col: 1, water: false },
  { id: 'mugla',      name: 'MUGHAL CANAL',     img: 'mugla.png',      row: 0, col: 2, water: true  },
  { id: 'ndri',       name: 'NDRI',             img: 'ndri.png',       row: 0, col: 3, water: false },

  // Row 1
  { id: 'meeraghati', name: 'MEERA GHATI',      img: 'meeraghati.png', row: 1, col: 0, water: false },
  { id: 'haveli',     name: 'KARNAL HAVELI',    img: 'haveli.png',     row: 1, col: 1, water: false, spawn: true },
  { id: 'mall',       name: 'SUPER MALL',       img: 'mall.png',       row: 1, col: 2, water: false },
  { id: 'atal',       name: 'ATAL PARK',        img: 'atal.png',       row: 1, col: 3, water: false },

  // Row 2
  { id: 'railway',    name: 'RAILWAY STATION',  img: 'railway.png',    row: 2, col: 0, water: false },
  { id: 'clock',      name: 'GHANTA GHAR',      img: 'clock.png',      row: 2, col: 1, water: false },
  { id: 'namaste',    name: 'NAMASTE CHOWK',    img: 'namaste.png',    row: 2, col: 2, water: false },
  { id: 'stadium',    name: 'KARAN STADIUM',    img: 'stadium.png',    row: 2, col: 3, water: false },

  // Row 3 — bottom (Police Academy area)
  { id: 'alpha',      name: 'ALPHA CITY',       img: 'alpha.png',      row: 3, col: 0, water: false },
  { id: 'iti',        name: 'ITI CHOWK',        img: 'iti.png',        row: 3, col: 1, water: false },
  { id: 'bus',        name: 'OLD BUS STAND',    img: 'bus.png',        row: 3, col: 2, water: false },
  { id: 'police',     name: 'POLICE ACADEMY',   img: 'police.png',     row: 3, col: 3, water: false }
];

// ---------- TILE FILES ----------
const TILES = {
  grass:   'grass.png',
  road:    'road.png',
  turn:    'turn.png',
  uturn:   'uturn.png',
  four:    'four.png',
  brick:   'brick.png',
  rail:    'rail.png',
  run:     'run.png',
  side:    'side.png',
  highway: 'highway.png'
};

// ---------- IMAGE CACHE ----------
const imageCache = {};
const imageLoadErrors = {};

function loadImage(key, src) {
  return new Promise((resolve) => {
    if (imageCache[key]) { resolve(imageCache[key]); return; }
    const img = new Image();
    img.onload  = () => { imageCache[key] = img; resolve(img); };
    img.onerror = () => { imageLoadErrors[key] = true; resolve(null); };
    img.src = src;
  });
}

async function preloadMapAssets(onProgress) {
  const total = ZONES.length + Object.keys(TILES).length;
  let done = 0;
  const tick = () => { done++; if (onProgress) onProgress(done / total); };

  const tasks = [];
  for (const z of ZONES) tasks.push(loadImage('zone_' + z.id, ZONE_DIR + z.img).then(tick));
  for (const [k, f] of Object.entries(TILES)) tasks.push(loadImage('tile_' + k, TILE_DIR + f).then(tick));
  await Promise.all(tasks);
}

// ---------- DRAWING ----------
function drawCover(ctx, img, dx, dy, dw, dh) {
  const sa = img.width / img.height;
  const da = dw / dh;
  let sx, sy, sw, sh;
  if (sa > da) { sh = img.height; sw = img.height * da; sx = (img.width - sw) / 2; sy = 0; }
  else         { sw = img.width;  sh = img.width / da;  sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// Camera-relative rect
function inView(x, y, w, h, cam) {
  return !(x + w < cam.x || x > cam.x + cam.w || y + h < cam.y || y > cam.y + cam.h);
}

// ---------- RENDER THE WHOLE WORLD ----------
function drawWorld(ctx, cam, zoom) {
  // 1) Draw every zone photo into its cell (cover-fit)
  for (const z of ZONES) {
    const wx = z.col * ZONE_SIZE;
    const wy = z.row * ZONE_SIZE;
    const x = (wx - cam.x) * zoom;
    const y = (wy - cam.y) * zoom;
    const w = ZONE_SIZE * zoom;
    const h = ZONE_SIZE * zoom;
    if (!inView(wx, wy, ZONE_SIZE, ZONE_SIZE, cam)) continue;

    const img = imageCache['zone_' + z.id];
    if (!img) {
      ctx.fillStyle = z.water ? '#1b3b5c' : '#2e4a2e';
      ctx.fillRect(x, y, w, h);
    } else {
      drawCover(ctx, img, x, y, w, h);
    }
  }

  // 2) Tile strips between zones — hide hard seams
  // Horizontal seams (between rows)
  const grassImg = imageCache['tile_grass'];
  const roadImg  = imageCache['tile_road'];
  const brickImg = imageCache['tile_brick'];
  const railImg  = imageCache['tile_rail'];

  // Draw a grass strip on every horizontal seam (row borders)
  for (let r = 1; r < WORLD_ROWS; r++) {
    const wy = r * ZONE_SIZE;
    const wx = 0;
    const ww = WORLD_W;
    const wh = 40; // strip thickness
    if (!inView(wx, wy - wh / 2, ww, wh, cam)) continue;
    const x = (wx - cam.x) * zoom;
    const y = (wy - wh / 2 - cam.y) * zoom;
    const w = ww * zoom;
    const h = wh * zoom;
    if (grassImg) tileFill(ctx, grassImg, x, y, w, h, 64 * zoom);
    else { ctx.fillStyle = '#3a5c3a'; ctx.fillRect(x, y, w, h); }
  }

  // Draw a grass strip on every vertical seam (column borders)
  for (let c = 1; c < WORLD_COLS; c++) {
    const wx = c * ZONE_SIZE;
    const wy = 0;
    const ww = 40;
    const wh = WORLD_H;
    if (!inView(wx - ww / 2, wy, ww, wh, cam)) continue;
    const x = (wx - ww / 2 - cam.x) * zoom;
    const y = (wy - cam.y) * zoom;
    const w = ww * zoom;
    const h = wh * zoom;
    if (grassImg) tileFill(ctx, grassImg, x, y, w, h, 64 * zoom);
    else { ctx.fillStyle = '#3a5c3a'; ctx.fillRect(x, y, w, h); }
  }

  // 3) Decorative road strips along column 1-2 boundary (main road)
  // (visual only — no collision yet)
  drawRoadGrid(ctx, cam, zoom, roadImg);

  // 4) Railway line across row 2
  if (railImg) {
    const wx = 0;
    const wy = 2 * ZONE_SIZE + ZONE_SIZE * 0.7;
    const ww = WORLD_W;
    const wh = 48;
    const x = (wx - cam.x) * zoom;
    const y = (wy - cam.y) * zoom;
    const w = ww * zoom;
    const h = wh * zoom;
    if (inView(wx, wy, ww, wh, cam)) tileFill(ctx, railImg, x, y, w, h, 96 * zoom, true);
  }

  // 5) Zone labels
  for (const z of ZONES) {
    const wx = z.col * ZONE_SIZE;
    const wy = z.row * ZONE_SIZE;
    if (!inView(wx, wy, ZONE_SIZE, ZONE_SIZE, cam)) continue;
    const x = (wx - cam.x) * zoom;
    const y = (wy - cam.y) * zoom;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 12 * zoom, y + 12 * zoom, 240 * zoom, 28 * zoom);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff8a3d';
    ctx.font = `bold ${Math.max(10, 15 * zoom)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(z.name, x + 22 * zoom, y + 32 * zoom);
    ctx.restore();
  }
}

// Tile a source image across a rect
function tileFill(ctx, img, x, y, w, h, tileSize, verticalOnly) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!tileSize || tileSize <= 0) tileSize = 64;
  if (verticalOnly) {
    // Repeat along X
    for (let xx = x; xx < x + w; xx += tileSize) {
      ctx.drawImage(img, xx, y, tileSize, h);
    }
  } else {
    for (let yy = y; yy < y + h; yy += tileSize) {
      for (let xx = x; xx < x + w; xx += tileSize) {
        ctx.drawImage(img, xx, yy, tileSize, tileSize);
      }
    }
  }
  ctx.restore();
}

// Draw a couple of main roads through the middle columns
function drawRoadGrid(ctx, cam, zoom, roadImg) {
  if (!roadImg) return;
  // Vertical road down the middle (col 1/col 2 boundary)
  const vx = 2 * ZONE_SIZE - 30;
  const vy = 0;
  const vw = 60;
  const vh = WORLD_H;
  if (inView(vx, vy, vw, vh, cam)) {
    const x = (vx - cam.x) * zoom;
    const y = (vy - cam.y) * zoom;
    tileFill(ctx, roadImg, x, y, vw * zoom, vh * zoom, 96 * zoom, true);
  }
  // Horizontal road at row 2 boundary
  const hx = 0;
  const hy = 2 * ZONE_SIZE - 30;
  const hw = WORLD_W;
  const hh = 60;
  if (inView(hx, hy, hw, hh, cam)) {
    const x = (hx - cam.x) * zoom;
    const y = (hy - cam.y) * zoom;
    tileFill(ctx, roadImg, x, y, hw * zoom, hh * zoom, 96 * zoom);
  }
}

// ---------- HELPERS ----------
function getZoneAt(worldX, worldY) {
  const col = Math.floor(worldX / ZONE_SIZE);
  const row = Math.floor(worldY / ZONE_SIZE);
  if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return null;
  return ZONES.find(z => z.row === row && z.col === col) || null;
}

function getSpawnPoint() {
  const s = ZONES.find(z => z.spawn);
  if (!s) return { x: WORLD_W / 2, y: WORLD_H / 2 };
  return { x: s.col * ZONE_SIZE + ZONE_SIZE / 2, y: s.row * ZONE_SIZE + ZONE_SIZE / 2 };
}

window.MAP = {
  ZONES, TILES, ZONE_SIZE, WORLD_W, WORLD_H, WORLD_COLS, WORLD_ROWS,
  preloadMapAssets, drawWorld, getZoneAt, getSpawnPoint,
  imageCache, imageLoadErrors
};