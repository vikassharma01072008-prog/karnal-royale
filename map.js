// ============================================
// MAP.JS v6.1 — FIXED GRID (exactly 20 rows)
// ============================================

const WORLD_W = 4000;
const WORLD_H = 4000;
const ASSET = 'assets/';

const GRID_COLS = 20;
const GRID_ROWS = 20;
const TILE_SIZE = WORLD_W / GRID_COLS;

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

// ============================================
// THE GRID — EXACTLY 20 rows x 20 chars each
// g=grass r=road t=turn u=uturn 4=four
// h=highway l=rail s=side d=run b=brick
// ============================================
const GRID = [
  'gggggggggggggggggggg', // 0
  'gggggggggggggggggggg', // 1
  'gggggggggggggggggggg', // 2
  'gggggggggggggggggggg', // 3
  'ggggggrrggggrrgggggg', // 4
  'ggggggrrggggrrgggggg', // 5
  'ggggggrrggggrrgggggg', // 6
  'ggggggrrggggrrgggggg', // 7
  'rrrrrr44rrrr44rrrrrr', // 8  ← cross road
  'ggggggrrggggrrgggggg', // 9
  'ggggggrrggggrrgggggg', // 10
  'rrrrrr44rrrr44rrrrrr', // 11 ← cross road
  'ggggggrrggggrrgggggg', // 12
  'ggggggrrggggrrgggggg', // 13
  'rrrrrr44rrrr44rrrrrr', // 14 ← cross road
  'ggggggrrggggrrgggggg', // 15
  'ggggggrrggggrrgggggg', // 16
  'rrrrrr44rrrr44rrrrrr', // 17 ← cross road
  'ggggggrrggggrrgggggg', // 18
  'ggggggrrggggrrgggggg'  // 19
];

// --------------------------------------------
// IMAGE CACHE
// --------------------------------------------
const imageCache = {};
function loadImage(key, src) {
  return new Promise(res => {
    if (imageCache[key]) return res(imageCache[key]);
    const img = new Image();
    img.onload  = () => { imageCache[key] = img; res(img); };
    img.onerror = () => { console.warn('missing tile:', src); imageCache[key] = null; res(null); };
    img.src = src;
  });
}

// --------------------------------------------
// PRELOAD
// --------------------------------------------
async function preloadMapAssets(onProgress) {
  const entries = Object.entries(TILE_FILES);
  const total = entries.length;
  let done = 0;

  const tasks = entries.map(([key, file]) =>
    loadImage('tile_' + key, ASSET + 'tile/' + file).then(() => {
      done++;
      if (onProgress) onProgress(done / total);
    })
  );

  await Promise.all(tasks);
  console.log('[MAP v6.1] preloaded', done, 'tiles');
}

// --------------------------------------------
// HELPERS
// --------------------------------------------
function charToType(c) {
  switch (c) {
    case 'r': return 'road';
    case 't': return 'turn';
    case 'u': return 'uturn';
    case '4': return 'four';
    case 'h': return 'highway';
    case 'l': return 'rail';
    case 's': return 'side';
    case 'd': return 'run';
    case 'b': return 'brick';
    default:  return 'grass';
  }
}

function getTileTypeAt(col, row) {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return 'grass';
  const rowStr = GRID[row];
  if (!rowStr) return 'grass';
  const c = rowStr[col];
  if (!c) return 'grass';
  return charToType(c);
}

// --------------------------------------------
// EXPORT
// --------------------------------------------
window.MAP = {
  WORLD_W, WORLD_H,
  GRID_COLS, GRID_ROWS, TILE_SIZE,
  TILE_FILES, GRID,
  imageCache,
  preloadMapAssets,
  getTileTypeAt,
  charToType,
  ASSET
};