// ============================================
// MAP.JS v8 — REAL TILEMAP & ALL ZONES
// ============================================

const WORLD_W = 4000;
const WORLD_H = 4000;
const ASSET = 'assets/';

const GRID_COLS = 20;
const GRID_ROWS = 20;
const TILE_SIZE = WORLD_W / GRID_COLS; // 200x200 per tile

// Your exact uploaded tiles
const TILE_FILES = {
  grass: 'grass.png',         // plain grass
  flower: 'flower.png',       // grass with flowers
  mud: 'mud.png',             // dirt/mud
  water: 'water.png',         // water
  roadH: 'horizontal.png',    // horizontal road
  roadV: 'vertical.png',      // vertical road
  turn: 'turn.png',           // curved road
  rail: 'rail.png'            // railway
};

// ============================================
// THE GRID (20x20) - g=grass, f=flower, m=mud, 
// w=water, H=roadH, V=roadV, t=turn, r=rail
// ============================================
const GRID = [
  'wwwwwwwwwwggggrrrrrr', // 0
  'wwwwwwwwwwggggrrrrrr', // 1
  'wwwwwwwwwwgggggggggg', // 2
  'gggggggggggggggggggg', // 3
  'ggggggVVggggVVgggggg', // 4
  'ggggggVVggggVVgggggg', // 5
  'ggggggVVggggVVgggggg', // 6
  'ggggggVVggggVVgggggg', // 7
  'HHHHHHttHHHHttHHHHHH', // 8
  'ggggggVVggggVVgggwww', // 9
  'ggggggVVggggVVgggwww', // 10
  'HHHHHHttHHHHttHHHwww', // 11
  'ggggggVVggggVVggggww', // 12
  'ggggggVVggggVVggggww', // 13
  'HHHHHHttHHHHttHHHHww', // 14
  'ggggggVVggggVVgggggg', // 15
  'ggggggVVggggVVgggggg', // 16
  'HHHHHHttHHHHttHHHHHH', // 17
  'ggggggVVggggVVgggggg', // 18
  'ggggggVVggggVVgggggg'  // 19
];

// ============================================
// ALL 15 ZONES — Placed perfectly on the map
// ============================================
const ZONES = [
  { id: 'karan_lake',  name: 'KARAN LAKE',       x: 2100, y: 500,  size: 700, photo: 'karan.png',      collisionRadius: 0   }, 
  { id: 'exit_gate',   name: 'KARNAL EXIT GATE', x: 2100, y: 1300, size: 500, photo: 'exit.png',       collisionRadius: 100 }, 
  { id: 'ndri',        name: 'NDRI',             x: 3100, y: 1300, size: 600, photo: 'ndri.png',       collisionRadius: 150 }, 
  { id: 'atal_park',   name: 'ATAL PARK',        x: 3300, y: 1900, size: 600, photo: 'atal.png',       collisionRadius: 80  }, 
  { id: 'mall',        name: 'KARNAL MALL',      x: 3300, y: 2500, size: 600, photo: 'mall.png',       collisionRadius: 180 }, 
  { id: 'railway',     name: 'RAILWAY STATION',  x: 700,  y: 1300, size: 600, photo: 'railway.png',    collisionRadius: 150 },
  { id: 'alpha',       name: 'ALPHA CITY',       x: 500,  y: 1900, size: 600, photo: 'alpha.png',      collisionRadius: 100 },
  { id: 'meeraghati',  name: 'MEERA GHATI',      x: 1500, y: 1500, size: 500, photo: 'meeraghati.png', collisionRadius: 80  },
  { id: 'haveli',      name: 'KARNAL HAVELI',    x: 1900, y: 1900, size: 600, photo: 'haveli.png',     collisionRadius: 150 },
  { id: 'stadium',     name: 'KARAN STADIUM',    x: 2500, y: 1500, size: 600, photo: 'stadium.png',    collisionRadius: 150 },
  { id: 'mugla',       name: 'MUGHAL CANAL',     x: 2900, y: 2300, size: 500, photo: 'mugla.png',      collisionRadius: 0   },
  { id: 'iti',         name: 'ITI CHOWK',        x: 500,  y: 2500, size: 600, photo: 'iti.png',        collisionRadius: 120 },
  { id: 'bus_stand',   name: 'OLD BUS STAND',    x: 1500, y: 2500, size: 600, photo: 'bus.png',        collisionRadius: 120 },
  { id: 'clock',       name: 'GHANTA GHAR',      x: 2100, y: 2500, size: 600, photo: 'clock.png',      collisionRadius: 80  },
  { id: 'namaste',     name: 'NAMASTE CHOWK',    x: 2100, y: 3100, size: 600, photo: 'namaste.png',    collisionRadius: 100 },
  { id: 'police',      name: 'POLICE ACADEMY',   x: 2100, y: 3700, size: 600, photo: 'police.png',     collisionRadius: 160 }
];

const imageCache = {};
function loadImage(key, src) {
  return new Promise(res => {
    if (imageCache[key]) return res(imageCache[key]);
    const img = new Image();
    img.onload  = () => { imageCache[key] = img; res(img); };
    img.onerror = () => { console.warn('missing image:', src); imageCache[key] = null; res(null); };
    img.src = src;
  });
}

async function preloadMapAssets(onProgress) {
  const tasks = [];
  // Load tiles
  for (const [key, file] of Object.entries(TILE_FILES)) {
    tasks.push(loadImage('tile_' + key, ASSET + 'tile/' + file));
  }
  // Load zones
  for (const z of ZONES) {
    tasks.push(loadImage('zone_' + z.id, ASSET + 'zones/' + z.photo));
  }
  let done = 0;
  const total = tasks.length;
  tasks.forEach(t => t.then(() => { done++; if (onProgress) onProgress(done / total); }));
  await Promise.all(tasks);
}

function charToType(c) {
  if (c === 'f') return 'flower';
  if (c === 'm') return 'mud';
  if (c === 'w') return 'water';
  if (c === 'H') return 'roadH';
  if (c === 'V') return 'roadV';
  if (c === 't') return 'turn';
  if (c === 'r') return 'rail';
  return 'grass';
}

function getTileTypeAt(col, row) {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return 'grass';
  const rowStr = GRID[row];
  if (!rowStr) return 'grass';
  return charToType(rowStr[col] || 'g');
}

// Collision for buildings
function resolveCollisions(entity) {
  for (const z of ZONES) {
    if (z.collisionRadius === 0) continue;
    const dx = entity.x - z.x;
    const dy = entity.y - z.y;
    const dist = Math.hypot(dx, dy);
    const minDist = z.collisionRadius + entity.radius;
    if (dist < minDist) {
      const angle = Math.atan2(dy, dx);
      entity.x = z.x + Math.cos(angle) * minDist;
      entity.y = z.y + Math.sin(angle) * minDist;
    }
  }
}

window.MAP = {
  WORLD_W, WORLD_H, GRID_COLS, GRID_ROWS, TILE_SIZE,
  TILE_FILES, GRID, ZONES, imageCache,
  preloadMapAssets, getTileTypeAt, resolveCollisions, ASSET
};
