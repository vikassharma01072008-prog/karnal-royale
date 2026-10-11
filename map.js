// ============================================
// MAP.JS — World grid, zones, tile autotiling
// Chunk M2A — auto-fit mixed image sizes (cover mode)
// ============================================

const TILE_DIR = 'assets/tile/';
const ZONE_DIR = 'assets/zones/';

// ---------- WORLD SETTINGS ----------
const WORLD_COLS = 4;
const WORLD_ROWS = 4;
const TILE_SIZE = 1024; // world units per grid cell
const WORLD_W = WORLD_COLS * TILE_SIZE;
const WORLD_H = WORLD_ROWS * TILE_SIZE;

// ---------- ZONE LAYOUT (matches map.png layout) ----------
// Row 0 = top (Karan Lake area)
// Row 3 = bottom (Police Academy area)
const ZONES = [
  // Row 0
  { id: 'karan_lake',    name: 'KARAN LAKE',      img: 'karanpark.png', row: 0, col: 0, water: true },
  { id: 'exit_gate',     name: 'KARNAL EXIT GATE',img: 'exit.png',      row: 0, col: 1, water: false },
  { id: 'mugla',         name: 'MUGHAL CANAL',    img: 'mugla.png',     row: 0, col: 2, water: true },
  { id: 'ndri',          name: 'NDRI',            img: 'ndri.png',      row: 0, col: 3, water: false },

  // Row 1
  { id: 'meeraghati',    name: 'MEERA GHATI',     img: 'meeraghati.png',row: 1, col: 0, water: false },
  { id: 'haveli',        name: 'KARNAL HAVELI',   img: 'haveli.png',    row: 1, col: 1, water: false, spawn: true },
  { id: 'mall',          name: 'SUPER MALL',      img: 'mall.png',      row: 1, col: 2, water: false },
  { id: 'atal',          name: 'ATAL PARK',       img: 'atal.png',      row: 1, col: 3, water: false },

  // Row 2
  { id: 'railway',       name: 'RAILWAY STATION', img: 'railway.png',   row: 2, col: 0, water: false },
  { id: 'clock',         name: 'GHANTA GHAR',     img: 'clock.png',     row: 2, col: 1, water: false },
  { id: 'namaste',       name: 'NAMASTE CHOWK',   img: 'namaste.png',   row: 2, col: 2, water: false },
  { id: 'stadium',       name: 'KARAN STADIUM',   img: 'stadium.png',   row: 2, col: 3, water: false },

  // Row 3
  { id: 'alpha',         name: 'ALPHA CITY',      img: 'alpha.png',     row: 3, col: 0, water: false },
  { id: 'iti',           name: 'ITI CHOWK',       img: 'iti.png',       row: 3, col: 1, water: false },
  { id: 'bus',           name: 'OLD BUS STAND',   img: 'bus.png',       row: 3, col: 2, water: false },
  { id: 'police',        name: 'POLICE ACADEMY',  img: 'police.png',    row: 3, col: 3, water: false }
];

// ---------- TILE DEFINITIONS ----------
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

// ---------- IMAGE LOADER (auto-fit) ----------
const imageCache = {};
const imageLoadErrors = {};

function loadImage(key, src) {
  return new Promise((resolve) => {
    if (imageCache[key]) { resolve(imageCache[key]); return; }
    const img = new Image();
    img.onload = () => { imageCache[key] = img; resolve(img); };
    img.onerror = () => {
      imageLoadErrors[key] = true;
      console.warn('[map] Missing:', src);
      resolve(null);
    };
    img.src = src;
  });
}

// Preload all zone + tile images
async function preloadMapAssets(onProgress) {
  const total = ZONES.length + Object.keys(TILES).length;
  let done = 0;
  const tick = () => { done++; if (onProgress) onProgress(done / total); };

  const tasks = [];
  for (const z of ZONES) {
    tasks.push(loadImage('zone_' + z.id, ZONE_DIR + z.img).then(tick));
  }
  for (const [k, f] of Object.entries(TILES)) {
    tasks.push(loadImage('tile_' + k, TILE_DIR + f).then(tick));
  }
  await Promise.all(tasks);
}

// ---------- RENDER WORLD ----------
// Draw all zones first, then overlay tile strips for road borders.
function drawWorld(ctx, camera) {
  // 1) Draw every zone image into its grid cell
  for (const z of ZONES) {
    const img = imageCache['zone_' + z.id];
    const x = z.col * TILE_SIZE - camera.x;
    const y = z.row * TILE_SIZE - camera.y;
    const w = TILE_SIZE;
    const h = TILE_SIZE;

    // Cull off-screen
    if (x + w < 0 || x > camera.w || y + h < 0 || y > camera.h) continue;

    if (!img) {
      // Fallback: solid color if image missing
      ctx.fillStyle = z.water ? '#1b3b5c' : '#2e4a2e';
      ctx.fillRect(x, y, w, h);
    } else {
      // "cover" fit — crop source to fill square, no distortion
      drawCover(ctx, img, x, y, w, h);
    }

    // Zone label (subtle, top-left of cell)
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 12, y + 12, 260, 26);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ff8a3d';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(z.name, x + 20, y + 30);
    ctx.restore();
  }

  // 2) Overlay road strips along zone seams (visual cohesion)
  // Only draw if we have grass/road tiles
  // (kept minimal — zones mostly self-contain their roads)
}

// "cover" logic — crop source rectangle to match destination aspect ratio
function drawCover(ctx, img, dx, dy, dw, dh) {
  const srcAspect = img.width / img.height;
  const dstAspect = dw / dh;
  let sx, sy, sw, sh;
  if (srcAspect > dstAspect) {
    // image is wider — crop sides
    sh = img.height;
    sw = img.height * dstAspect;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // image is taller — crop top/bottom
    sw = img.width;
    sh = img.width / dstAspect;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// ---------- HELPERS ----------
function getZoneAt(worldX, worldY) {
  const col = Math.floor(worldX / TILE_SIZE);
  const row = Math.floor(worldY / TILE_SIZE);
  if (col < 0 || col >= WORLD_COLS || row < 0 || row >= WORLD_ROWS) return null;
  return ZONES.find(z => z.row === row && z.col === col) || null;
}

function getSpawnPoint() {
  const spawnZone = ZONES.find(z => z.spawn);
  if (!spawnZone) return { x: WORLD_W / 2, y: WORLD_H / 2 };
  return {
    x: spawnZone.col * TILE_SIZE + TILE_SIZE / 2,
    y: spawnZone.row * TILE_SIZE + TILE_SIZE / 2
  };
}

// ---------- EXPORTS (globals for browser) ----------
window.MAP = {
  ZONES, TILES, TILE_SIZE, WORLD_W, WORLD_H, WORLD_COLS, WORLD_ROWS,
  preloadMapAssets, drawWorld, getZoneAt, getSpawnPoint, imageCache, imageLoadErrors
};