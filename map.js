// ============================================
// MAP.JS — World data for Karnal Royale
// 16 landmarks + zones + roads + spawn
// ============================================

const WORLD_W = 4000;
const WORLD_H = 4000;
const ASSET = 'assets/';

// --------------------------------------------
// ZONES — placed per map.png layout (0-100% → world coords)
// r = radius in world units (for zone detection / minimap)
// --------------------------------------------
const ZONES = [
  // NORTH (top)
  { id:'karan_lake',    name:'KARAN LAKE',         x:2000, y: 720, r:360, water:true  },
  { id:'exit_gate',     name:'KARNAL EXIT GATE',   x:1920, y:1200, r:280, water:false },

  // NORTH-EAST (green belt)
  { id:'ndri',          name:'NDRI',               x:3120, y:1320, r:300, water:false },
  { id:'atal_park',     name:'ATAL PARK',          x:3280, y:1920, r:280, water:false },
  { id:'mall',          name:'KARNAL MALL',        x:3280, y:2480, r:300, water:false },

  // NORTH-WEST (railway + alpha)
  { id:'railway',       name:'RAILWAY STATION',    x: 320, y:1520, r:320, water:false },
  { id:'alpha',         name:'ALPHA CITY',         x: 600, y:1920, r:300, water:false },

  // CENTER (red downtown core)
  { id:'meeraghati',    name:'MEERA GHATI',        x:1520, y:1520, r:280, water:false },
  { id:'haveli',        name:'KARNAL HAVELI',      x:1920, y:1600, r:320, water:false, spawn:true },
  { id:'stadium',       name:'KARAN STADIUM',      x:2320, y:1600, r:300, water:false },

  // CANAL (water)
  { id:'mugla',         name:'MUGHAL CANAL',       x:2720, y:2080, r:340, water:true  },

  // SOUTH-WEST (orange suburban)
  { id:'iti',           name:'ITI CHOWK',          x: 480, y:2480, r:280, water:false },

  // SOUTH (red downtown south)
  { id:'bus_stand',     name:'OLD BUS STAND',      x:1520, y:2400, r:300, water:false },
  { id:'clock',         name:'GHANTA GHAR',        x:1920, y:2480, r:260, water:false },
  { id:'namaste',       name:'NAMASTE CHOWK',      x:1920, y:3120, r:280, water:false },

  // SOUTH-BOTTOM (police academy)
  { id:'police',        name:'POLICE ACADEMY',     x:1920, y:3600, r:340, water:false }
];

// --------------------------------------------
// LANDMARK BUILDINGS — 3D boxes with zone photo on wall
// x,y = center position in world
// w,d,h = width, depth, height
// rot = rotation in radians (Y axis)
// photo = image file in assets/zones/
// --------------------------------------------
const BUILDINGS = [
  { id:'karan_lake',   x:2000, y: 720, w:300, d:300, h:  2, rot:0, photo:'karanpark.png',  color:0x1e5a8c, water:true  },
  { id:'exit_gate',    x:1920, y:1200, w:260, d:120, h: 80, rot:0, photo:'exit.png',       color:0x6a4a2a },
  { id:'ndri',         x:3120, y:1320, w:340, d:280, h:110, rot:0, photo:'ndri.png',       color:0x4a6a3a },
  { id:'atal_park',    x:3280, y:1920, w:300, d:300, h: 40, rot:0, photo:'atal.png',       color:0x2e5a2e },
  { id:'mall',         x:3280, y:2480, w:320, d:260, h:120, rot:0, photo:'mall.png',       color:0x8a5a3a },
  { id:'railway',      x: 320, y:1520, w:360, d:180, h: 90, rot:0, photo:'railway.png',    color:0x555555 },
  { id:'alpha',        x: 600, y:1920, w:340, d:300, h:100, rot:0, photo:'alpha.png',      color:0x7a5a4a },
  { id:'meeraghati',   x:1520, y:1520, w:280, d:240, h: 90, rot:0, photo:'meeraghati.png', color:0x8a3a2a },
  { id:'haveli',       x:1920, y:1600, w:360, d:320, h:140, rot:0, photo:'haveli.png',     color:0x9a4a2a, spawn:true },
  { id:'stadium',      x:2320, y:1600, w:340, d:300, h:110, rot:0, photo:'stadium.png',    color:0x6a5a3a },
  { id:'iti',          x: 480, y:2480, w:280, d:240, h: 90, rot:0, photo:'iti.png',        color:0x7a6a4a },
  { id:'bus_stand',    x:1520, y:2400, w:320, d:220, h: 95, rot:0, photo:'bus.png',        color:0x6a4a3a },
  { id:'clock',        x:1920, y:2480, w:220, d:220, h:160, rot:0, photo:'clock.png',      color:0x8a6a3a },
  { id:'namaste',      x:1920, y:3120, w:280, d:240, h: 90, rot:0, photo:'namaste.png',    color:0x8a4a3a },
  { id:'police',       x:1920, y:3600, w:400, d:320, h:130, rot:0, photo:'police.png',     color:0x4a5a6a }
];

// --------------------------------------------
// ROADS — long ground strips (NH-44 + cross roads)
// --------------------------------------------
const ROADS = [
  // NH-44 highway — vertical through middle-left
  { x:1280, y:2000, w: 120, d:4000, color:0x2a2a2a },
  // Cross road through haveli / clock (horizontal center)
  { x:1920, y:2400, w:3800, d: 100, color:0x2a2a2a },
  // Cross road north (lake to ndri)
  { x:2000, y:1300, w:2800, d:  90, color:0x2a2a2a },
  // Cross road south (bus to police)
  { x:1920, y:3300, w:3400, d:  90, color:0x2a2a2a }
];

// --------------------------------------------
// WATER BODIES — extra water beyond zones
// --------------------------------------------
const WATER = [
  // Mughal Canal diagonal strip (top-right → center)
  { x1:3200, y1: 900, x2:2200, y2:2600, w: 100 },
];

// --------------------------------------------
// IMAGE LOADER
// --------------------------------------------
const imageCache = {};
function loadImage(key, src) {
  return new Promise(res => {
    if (imageCache[key]) return res(imageCache[key]);
    const img = new Image();
    img.onload  = () => { imageCache[key] = img; res(img); };
    img.onerror = () => { console.warn('missing:', src); imageCache[key] = null; res(null); };
    img.src = src;
  });
}

// --------------------------------------------
// PRELOAD — grass tile, road tile, brick, zone photos, base map
// --------------------------------------------
async function preloadMapAssets(onProgress) {
  const tasks = [];

  // Tiles
  tasks.push(loadImage('tile_grass', ASSET + 'tile/grass.png'));
  tasks.push(loadImage('tile_road',  ASSET + 'tile/road.png'));
  tasks.push(loadImage('tile_brick', ASSET + 'tile/brick.png'));
  tasks.push(loadImage('tile_side',  ASSET + 'tile/side.png'));
  tasks.push(loadImage('tile_rail',  ASSET + 'tile/rail.png'));
  tasks.push(loadImage('tile_water', ASSET + 'tile/run.png'));

  // Base map (for minimap)
  tasks.push(loadImage('base_map', ASSET + 'map.png'));

  // Zone photos — used as building wall textures
  for (const b of BUILDINGS) {
    tasks.push(loadImage('photo_' + b.id, ASSET + 'zones/' + b.photo));
  }

  // Progress
  let done = 0;
  const total = tasks.length;
  tasks.forEach(t => t.then(() => { done++; onProgress && onProgress(done / total); }));

  await Promise.all(tasks);
}

// --------------------------------------------
// ZONE LOOKUP
// --------------------------------------------
function getZoneAt(x, y) {
  for (const z of ZONES) {
    const dx = x - z.x, dy = y - z.y;
    if (dx*dx + dy*dy < z.r * z.r) return z;
  }
  return null;
}

function getSpawnPoint() {
  const s = ZONES.find(z => z.spawn);
  return s ? { x: s.x, y: s.y } : { x: WORLD_W/2, y: WORLD_H/2 };
}

// --------------------------------------------
// EXPORT
// --------------------------------------------
window.MAP = {
  WORLD_W, WORLD_H,
  ZONES, BUILDINGS, ROADS, WATER,
  imageCache,
  preloadMapAssets,
  getZoneAt,
  getSpawnPoint,
  ASSET
};