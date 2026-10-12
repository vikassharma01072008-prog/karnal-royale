// ============================================
// MAP.JS — 2D world using map.png as the ground
// ============================================

const ASSET = 'assets/';

// World size — the map.png gets scaled into this
const WORLD_W = 4000;
const WORLD_H = 4000;

// Zones — named areas on the map, detected by walking near their center
// Coordinates are in world units (0,0 = top-left)
const ZONES = [
  { id: 'karan_lake', name: 'KARAN LAKE',       x: 1500, y:  900, r: 350, water: true  },
  { id: 'exit_gate',  name: 'KARNAL EXIT GATE', x: 2600, y: 1000, r: 300, water: false },
  { id: 'mugla',      name: 'MUGHAL CANAL',     x: 3500, y: 1200, r: 300, water: true  },
  { id: 'ndri',       name: 'NDRI',             x: 3500, y: 1900, r: 300, water: false },
  { id: 'meeraghati', name: 'MEERA GHATI',      x: 1200, y: 1700, r: 280, water: false },
  { id: 'haveli',     name: 'KARNAL HAVELI',    x: 2000, y: 2200, r: 320, water: false, spawn: true },
  { id: 'mall',       name: 'SUPER MALL',       x: 3000, y: 2300, r: 300, water: false },
  { id: 'atal',       name: 'ATAL PARK',        x: 3400, y: 2800, r: 300, water: false },
  { id: 'railway',    name: 'RAILWAY STATION',  x:  800, y: 2000, r: 350, water: false },
  { id: 'clock',      name: 'GHANTA GHAR',      x: 2000, y: 2900, r: 260, water: false },
  { id: 'namaste',    name: 'NAMASTE CHOWK',    x: 2700, y: 2900, r: 300, water: false },
  { id: 'stadium',    name: 'KARAN STADIUM',    x: 3300, y: 3100, r: 320, water: false },
  { id: 'alpha',      name: 'ALPHA CITY',       x:  900, y: 3100, r: 320, water: false },
  { id: 'iti',        name: 'ITI CHOWK',        x: 1500, y: 3300, r: 280, water: false },
  { id: 'bus',        name: 'OLD BUS STAND',    x: 2000, y: 3400, r: 300, water: false },
  { id: 'police',     name: 'POLICE ACADEMY',   x: 2800, y: 3600, r: 340, water: false }
];

// Tile files (used later when we add tile detail on top)
const TILE_FILES = {
  grass: 'grass.png', road: 'road.png', brick: 'brick.png',
  rail: 'rail.png',  run: 'run.png',   side:  'side.png'
};

const imageCache = {};

function loadImage(key, src) {
  return new Promise(res => {
    if (imageCache[key]) return res(imageCache[key]);
    const img = new Image();
    img.onload  = () => { imageCache[key] = img; res(img); };
    img.onerror = () => { console.warn('missing:', src); res(null); };
    img.src = src;
  });
}

async function preloadMapAssets(onProgress) {
  const total = 1 + Object.keys(TILE_FILES).length;
  let done = 0;
  const tick = () => { done++; onProgress && onProgress(done / total); };

  const tasks = [];
  tasks.push(loadImage('base', ASSET + 'map.png').then(tick));
  for (const [k, f] of Object.entries(TILE_FILES)) {
    tasks.push(loadImage('tile_' + k, ASSET + 'tile/' + f).then(tick));
  }
  await Promise.all(tasks);
}

function drawWorld(ctx, cam, zoom) {
  const base = imageCache['base'];
  const x = (0 - cam.x) * zoom;
  const y = (0 - cam.y) * zoom;
  const w = WORLD_W * zoom;
  const h = WORLD_H * zoom;

  if (base) {
    ctx.drawImage(base, x, y, w, h);
  } else {
    // Fallback: dark grid
    ctx.fillStyle = '#1a2e1a';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,138,61,0.3)';
    ctx.lineWidth = 2;
    const step = 500 * zoom;
    for (let gx = 0; gx <= WORLD_W; gx += 500) {
      const sx = (gx - cam.x) * zoom;
      ctx.beginPath();
      ctx.moveTo(sx, (0 - cam.y) * zoom);
      ctx.lineTo(sx, (WORLD_H - cam.y) * zoom);
      ctx.stroke();
    }
    for (let gy = 0; gy <= WORLD_H; gy += 500) {
      const sy = (gy - cam.y) * zoom;
      ctx.beginPath();
      ctx.moveTo((0 - cam.x) * zoom, sy);
      ctx.lineTo((WORLD_W - cam.x) * zoom, sy);
      ctx.stroke();
    }
  }

  // Zone markers (small dots + labels — visible on top of map)
  ctx.save();
  ctx.font = `bold ${Math.max(11, 13 * zoom)}px Arial`;
  ctx.textAlign = 'center';
  for (const z of ZONES) {
    const sx = (z.x - cam.x) * zoom;
    const sy = (z.y - cam.y) * zoom;
    // Cull if off screen
    if (sx < -200 || sx > ctx.canvas.width + 200 || sy < -100 || sy > ctx.canvas.height + 100) continue;

    // Zone ring
    ctx.beginPath();
    ctx.arc(sx, sy, z.r * zoom * 0.9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,255,200,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Zone label
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#00ffc8';
    ctx.strokeText(z.name, sx, sy - 4);
    ctx.fillText(z.name, sx, sy - 4);
  }
  ctx.restore();
}

function getZoneAt(x, y) {
  for (const z of ZONES) {
    const dx = x - z.x, dy = y - z.y;
    if (dx * dx + dy * dy < z.r * z.r) return z;
  }
  return null;
}

function getSpawnPoint() {
  const s = ZONES.find(z => z.spawn);
  return s ? { x: s.x, y: s.y } : { x: WORLD_W / 2, y: WORLD_H / 2 };
}

window.MAP = {
  ZONES, WORLD_W, WORLD_H,
  preloadMapAssets, drawWorld, getZoneAt, getSpawnPoint,
  imageCache
};