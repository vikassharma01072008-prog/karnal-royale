// ============================================
// MAP.JS v6 — TILEMAP WORLD
// 20x20 grid of tiles from assets/tile/
// No zones yet — pure tilemap battle royale field
// ============================================

const WORLD_W = 4000;
const WORLD_H = 4000;
const ASSET = 'assets/';

// Tile grid: 20 columns x 20 rows
const GRID_COLS = 20;
const GRID_ROWS = 20;
const TILE_SIZE = WORLD_W / GRID_COLS; // 200 units per tile

// --------------------------------------------
// TILE TYPES — files live in assets/tile/
// --------------------------------------------
const TILE_FILES = {
  grass:    'grass.png',
  road:     'road.png',
  turn:     'turn.png',
  uturn:    'uturn.png',
  four:     'four.png',
  highway:  'highway.png',
  rail:     'rail.png',
  side:     'side.png',
  run:      'run.png',
  brick:    'brick.png'
};

// --------------------------------------------
// THE GRID — 20 rows x 20 cols
// g = grass, r = road, t = turn, u = uturn,
// 4 = four-way, h = highway, l = rail,
// s = side, d = dirt/run, b = brick
// --------------------------------------------
const GRID = [
  // row 0
  'gggggggggggggggggggg',
  'gggggggggggggggggggg',
  'gggggggggggggggggggg',
  'gggggggggggggggggggg',
  // row 4  — top area / lake side
  'gggggggggggggggggggg',
  'ggggggrrggggrrgggggg',
  'ggggggrrggggrrgggggg',
  // row 7 — cross road top
  'ggggggrrggggrrgggggg',
  'rrrrrr44rrrr44rrrrrr',
  'ggggggrrggggrrgggggg',
  // row 10 — center (haveli / stadium)
  'ggggggrrggggrrgggggg',
  'rrrrrr44rrrr44rrrrrr',
  'ggggggrrggggrrgggggg',
  // row 13 — mid south
  'ggggggrrggggrrgggggg',
  'rrrrrr44rrrr44rrrrrr',
  'ggggggrrggggrrgggggg',
  // row 16 — south
  'ggggggrrggggrrgggggg',
  'rrrrrr44rrrr44rrrrrr',
  'ggggggrrggggrrgggggg'
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
// PRELOAD — only 10 tiles
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
  console.log('[MAP v6] preloaded', done, 'tiles');
}

// --------------------------------------------
// GET TILE TYPE AT WORLD POSITION
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
  return charToType(GRID[row][col]);
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