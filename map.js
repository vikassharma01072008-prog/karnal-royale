// ============================================
// MAP.JS — FINAL
// world.png IS the map. 16 photos = zone popups.
// ============================================

const ASSET = 'assets/';

// WORLD SIZE — matches world.png aspect (1920x1200)
const WORLD_W = 3840;
const WORLD_H = 2400;

// Zone positions — where each named area sits on world.png
// (x,y = center of the zone in world coords)
const ZONES = [
  { id: 'stadium',    name: 'STADIUM',           photo: 'stadium.png',    x:  700, y:  500, r: 500, water: false },
  { id: 'railway',    name: 'RAILWAY STATION',   photo: 'railway.png',    x:  620, y: 1650, r: 420, water: false },
  { id: 'namaste',    name: 'NAMASTE CHOWK',     photo: 'namaste.png',    x: 1650, y: 1150, r: 380, water: false },
  { id: 'market',     name: 'MARKET',            photo: 'mall.png',       x: 2650, y:  900, r: 400, water: false },
  { id: 'warehouse',  name: 'WAREHOUSE AREA',    photo: 'bus.png',        x: 2500, y: 1450, r: 420, water: false },
  { id: 'construction',name: 'CONSTRUCTION SITE',photo: 'iti.png',        x: 3150, y: 1200, r: 320, water: false },
  { id: 'highway',    name: 'KARNAL HIGHWAY',    photo: 'exit.png',       x: 1900, y:  680, r: 600, water: false }
];

// water zones (Karan Lake / Mughal Canal are in the classic version;
// this new world.png doesn't show big water — placeholder for later)
const WATER_ZONES = [];

const imageCache = {};

function loadImage(key, src) {
  return new Promise(res => {
    if (imageCache[key]) return res(imageCache[key]);
    const img = new Image();
    img.onload  = () => { imageCache[key] = img; res(img); };
    img.onerror = () => { res(null); };
    img.src = src;
  });
}

async function preloadMapAssets(onProgress) {
  const total = 1 + ZONES.length;
  let done = 0;
  const tick = () => { done++; onProgress && onProgress(done / total); };
  const tasks = [];
  tasks.push(loadImage('world', ASSET + 'world.png').then(tick));
  for (const z of ZONES) {
    tasks.push(loadImage('photo_' + z.id, ASSET + 'zones/' + z.photo).then(tick));
  }
  await Promise.all(tasks);
}

function drawWorld(ctx, cam, zoom) {
  const world = imageCache['world'];
  const dx = (0 - cam.x) * zoom;
  const dy = (0 - cam.y) * zoom;
  const dw = WORLD_W * zoom;
  const dh = WORLD_H * zoom;

  if (world) {
    ctx.drawImage(world, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = '#1a1f2a';
    ctx.fillRect(dx, dy, dw, dh);
  }
}

function getZoneAt(x, y) {
  for (const z of ZONES) {
    const dx = x - z.x, dy = y - z.y;
    if (dx * dx + dy * dy < z.r * z.r) return z;
  }
  return null;
}

function getSpawnPoint() {
  // Spawn on highway near center
  return { x: 1900, y: 1200 };
}

window.MAP = {
  ZONES, WATER_ZONES, WORLD_W, WORLD_H,
  preloadMapAssets, drawWorld, getZoneAt, getSpawnPoint,
  imageCache
};