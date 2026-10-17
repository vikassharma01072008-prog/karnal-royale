// ============================================
// MAP.JS v7 — TILEMAP + ZONES (Test Build)
// Only loads clock & bus for now
// ============================================

const WORLD_W = 4000;
const WORLD_H = 4000;
const ASSET = 'assets/';

const GRID_COLS = 20;
const GRID_ROWS = 20;
const TILE_SIZE = WORLD_W / GRID_COLS;

// Tile textures
const TILE_FILES = {
  grass:   'grass.png',
  road:    'road.png',
  turn:    'turn.png',
  uturn:   'uturn.png',
  four:    'four.png',
  highway: 'highway.png',
  rail:    'rail.png',
  side:    'side.png',
  run:     'run.png',
  brick:   'brick.png'
};

// The 20x20 Grid (g=grass, r=road, 4=four-way)
const GRID = [
  'gggggggggggggggggggg', // 0
  'gggggggggggggggggggg', // 1
  'gggggggggggggggggggg', // 2
  'gggggggggggggggggggg', // 3
  'ggggggrrggggrrgggggg', // 4
  'ggggggrrggggrrgggggg', // 5
  'ggggggrrggggrrgggggg', // 6
  'ggggggrrggggrrgggggg', // 7
  'rrrrrr44rrrr44rrrrrr', // 8
  'ggggggrrggggrrgggggg', // 9
  'ggggggrrggggrrgggggg', // 10
  'rrrrrr44rrrr44rrrrrr', // 11
  'ggggggrrggggrrgggggg', // 12
  'ggggggrrggggrrgggggg', // 13
  'rrrrrr44rrrr44rrrrrr', // 14
  'ggggggrrggggrrgggggg', // 15
  'ggggggrrggggrrgggggg', // 16
  'rrrrrr44rrrr44rrrrrr', // 17
  'ggggggrrggggrrgggggg', // 18
  'ggggggrrggggrrgggggg'  // 19
];

// ============================================
// ZONES — ONLY ADDED CLOCK & BUS FOR TESTING
// ============================================
const ZONES = [
  // Grid position converted to world coordinates
  // (col * 200 + 100, row * 200 + 100)
  
  // Ghanta Ghar (Clock) - Placed near center intersection (row 11, col 10)
  { 
    id: 'clock', 
    name: 'GHANTA GHAR', 
    x: 2100, y: 2300, 
    size: 380, 
    photo: 'clock.png',
    collisionRadius: 120 // Player can walk on plaza, but not through the tower
  },

  // Old Bus Stand - Placed west of center (row 14, col 6)
  { 
    id: 'bus_stand', 
    name: 'OLD BUS STAND', 
    x: 1300, y: 2900, 
    size: 380, 
    photo: 'bus.png',
    collisionRadius: 140 // Bigger collision for the buses/stand
  }
];

// ============================================
// LOADER
// ============================================
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

  // Load zones (only clock and bus)
  for (const z of ZONES) {
    tasks.push(loadImage('zone_' + z.id, ASSET + 'zones/' + z.photo));
  }

  let done = 0;
  const total = tasks.length;
  tasks.forEach(t => t.then(() => {
    done++;
    if (onProgress) onProgress(done / total);
  }));

  await Promise.all(tasks);
  console.log('[MAP v7] preloaded assets:', done);
}

// Helpers
function charToType(c) {
  if (c === 'r') return 'road';
  if (c === '4') return 'four';
  return 'grass';
}

function getTileTypeAt(col, row) {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return 'grass';
  const rowStr = GRID[row];
  if (!rowStr) return 'grass';
  const c = rowStr[col];
  if (!c) return 'grass';
  return charToType(c);
}

// Collision check for the center of the zones
function resolveCollisions(entity) {
  for (const z of ZONES) {
    const dx = entity.x - z.x;
    const dy = entity.y - z.y;
    const dist = Math.hypot(dx, dy);
    const minDist = z.collisionRadius + entity.radius;
    
    // If player walks into the central statue/building collision
    if (dist < minDist) {
      const angle = Math.atan2(dy, dx);
      entity.x = z.x + Math.cos(angle) * minDist;
      entity.y = z.y + Math.sin(angle) * minDist;
    }
  }
}

// Export
window.MAP = {
  WORLD_W, WORLD_H,
  GRID_COLS, GRID_ROWS, TILE_SIZE,
  TILE_FILES, GRID, ZONES,
  imageCache,
  preloadMapAssets,
  getTileTypeAt,
  resolveCollisions,
  ASSET
};