// ============================================
// MAP.JS — M2 FINAL
// map.png = ground. 16 photos = landmark billboards.
// ============================================

const ASSET = 'assets/';
const TILE_DIR = ASSET + 'tile/';
const ZONE_DIR = ASSET + 'zones/';

// World
const WORLD_W = 6000;
const WORLD_H = 6000;

// 16 landmarks placed at real positions on map.png
// x/y = position on the 6000x6000 world (0,0 top-left)
const ZONES = [
  { id: 'karan_lake', name: 'KARAN LAKE',       img: 'karanpark.png',  x: 1400, y:  900, size: 320, water: true  },
  { id: 'exit_gate',  name: 'KARNAL EXIT GATE', img: 'exit.png',       x: 3000, y:  900, size: 260, water: false },
  { id: 'mugla',      name: 'MUGHAL CANAL',     img: 'mugla.png',      x: 4600, y: 1200, size: 300, water: true  },
  { id: 'ndri',       name: 'NDRI',             img: 'ndri.png',       x: 4700, y: 2200, size: 280, water: false },

  { id: 'meeraghati', name: 'MEERA GHATI',      img: 'meeraghati.png', x:  900, y: 2200, size: 260, water: false },
  { id: 'haveli',     name: 'KARNAL HAVELI',    img: 'haveli.png',     x: 3000, y: 2400, size: 340, water: false, spawn: true },
  { id: 'mall',       name: 'SUPER MALL',       img: 'mall.png',       x: 4400, y: 2800, size: 320, water: false },
  { id: 'atal',       name: 'ATAL PARK',        img: 'atal.png',       x: 4900, y: 3400, size: 280, water: false },

  { id: 'railway',    name: 'RAILWAY STATION',  img: 'railway.png',    x:  700, y: 3400, size: 300, water: false },
  { id: 'clock',      name: 'GHANTA GHAR',      img: 'clock.png',      x: 3000, y: 3600, size: 260, water: false },
  { id: 'namaste',    name: 'NAMASTE CHOWK',    img: 'namaste.png',    x: 3300, y: 4400, size: 300, water: false },
  { id: 'stadium',    name: 'KARAN STADIUM',    img: 'stadium.png',    x: 4600, y: 4400, size: 320, water: false },

  { id: 'alpha',      name: 'ALPHA CITY',       img: 'alpha.png',      x:  900, y: 4600, size: 300, water: false },
  { id: 'iti',        name: 'ITI CHOWK',        img: 'iti.png',        x: 2000, y: 5000, size: 280, water: false },
  { id: 'bus',        name: 'OLD BUS STAND',    img: 'bus.png',        x: 3000, y: 5300, size: 300, water: false },
  { id: 'police',     name: 'POLICE ACADEMY',   img: 'police.png',     x: 4200, y: 5300, size: 320, water: false }
];

const TILE_FILES = {
  grass: 'grass.png', road: 'road.png', turn: 'turn.png',
  uturn: 'uturn.png', four: 'four.png', brick: 'brick.png',
  rail:  'rail.png',  run:  'run.png',  side:  'side.png', highway: 'highway.png'
};

const imageCache = {};

function loadImage(key, src) {
  return new Promise(res => {
    if (imageCache[key]) return res(imageCache[key]);
    const img = new Image();
    img.onload  = () => { imageCache[key] = img; res(img); };
    img.onerror = () => { console.warn('missing', src); res(null); };
    img.src = src;
  });
}

async function preloadMapAssets(onProgress) {
  const total = 1 + ZONES.length + Object.keys(TILE_FILES).length;
  let done = 0;
  const tick = () => { done++; onProgress && onProgress(done / total); };

  const tasks = [];
  tasks.push(loadImage('base_map', ASSET + 'map.png').then(tick));
  for (const z of ZONES) tasks.push(loadImage('zone_' + z.id, ZONE_DIR + z.img).then(tick));
  for (const [k, f] of Object.entries(TILE_FILES)) tasks.push(loadImage('tile_' + k, TILE_DIR + f).then(tick));
  await Promise.all(tasks);
}

// ---------- RENDER ----------
function inView(x, y, w, h, cam) {
  return !(x + w < cam.x || x > cam.x + cam.w || y + h < cam.y || y > cam.y + cam.h);
}

function drawWorld(ctx, cam, zoom) {
  // 1) The base map
  const base = imageCache['base_map'];
  const bx = (0 - cam.x) * zoom;
  const by = (0 - cam.y) * zoom;
  const bw = WORLD_W * zoom;
  const bh = WORLD_H * zoom;
  if (base) {
    ctx.drawImage(base, bx, by, bw, bh);
  } else {
    ctx.fillStyle = '#1a2e1a';
    ctx.fillRect(bx, by, bw, bh);
  }

  // 2) Landmark billboards (photos standing on the map, with shadow)
  // Sort by Y so lower landmarks draw on top (fake depth)
  const sorted = [...ZONES].sort((a, b) => a.y - b.y);
  for (const z of sorted) {
    if (!inView(z.x - 200, z.y - 300, 400, 400, cam)) continue;
    const img = imageCache['zone_' + z.id];
    const sx = (z.x - cam.x) * zoom;
    const sy = (z.y - cam.y) * zoom;
    const w = z.size * zoom;
    // Preserve image aspect for height, but cap it
    const h = img ? Math.min(w * (img.height / img.width), w * 1.6) : w;

    // Shadow ellipse under the landmark
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 4 * zoom, w * 0.55, w * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // The photo billboard (anchored so bottom-center sits at z.x, z.y)
    if (img) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 12 * zoom;
      ctx.drawImage(img, sx - w / 2, sy - h, w, h);
      ctx.restore();
    } else {
      // Fallback rectangle
      ctx.fillStyle = z.water ? '#1b3b5c' : '#4a2e1e';
      ctx.fillRect(sx - w / 2, sy - h, w, h);
      ctx.strokeStyle = '#ff8a3d';
      ctx.lineWidth = 2 * zoom;
      ctx.strokeRect(sx - w / 2, sy - h, w, h);
    }

    // Name plate under landmark
    ctx.save();
    ctx.font = `bold ${Math.max(10, 14 * zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#ff8a3d';
    ctx.strokeText(z.name, sx, sy + 22 * zoom);
    ctx.fillText(z.name, sx, sy + 22 * zoom);
    ctx.restore();
  }
}

// ---------- HELPERS ----------
function getZoneAt(worldX, worldY) {
  let nearest = null;
  let bestD = 400 * 400; // activation radius squared
  for (const z of ZONES) {
    const dx = worldX - z.x;
    const dy = worldY - z.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; nearest = z; }
  }
  return nearest;
}

function getSpawnPoint() {
  const s = ZONES.find(z => z.spawn);
  return s ? { x: s.x, y: s.y + 60 } : { x: WORLD_W / 2, y: WORLD_H / 2 };
}

window.MAP = {
  ZONES, WORLD_W, WORLD_H,
  preloadMapAssets, drawWorld, getZoneAt, getSpawnPoint,
  imageCache
};