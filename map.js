// ============================================
// MAP.JS v9 — AI DESIGNED BATTLE ROYALE MAP
// Uses your exact tiles and zones. No map.png.
// ============================================

const WORLD_W = 4000;
const WORLD_H = 4000;
const ASSET = 'assets/';

// 1. THE ZONES (Placed strategically on the map)
const ZONES = [
  // North-West (Railway side)
  { id: 'railway',     name: 'RAILWAY STATION',  x: 600,  y: 600,  size: 700, photo: 'railway.png',    solidRadius: 180 },
  { id: 'alpha',       name: 'ALPHA CITY',       x: 1200, y: 800,  size: 600, photo: 'alpha.png',      solidRadius: 120 },
  
  // North-Center / North-East
  { id: 'ndri',        name: 'NDRI',             x: 3000, y: 600,  size: 700, photo: 'ndri.png',       solidRadius: 180 },
  { id: 'karan_lake',  name: 'KARAN LAKE',       x: 3500, y: 1500, size: 800, photo: 'karan.png',      solidRadius: 0   }, // Water
  
  // Downtown Center
  { id: 'haveli',      name: 'KARNAL HAVELI',    x: 1600, y: 1600, size: 700, photo: 'haveli.png',     solidRadius: 180 },
  { id: 'clock',       name: 'GHANTA GHAR',      x: 2400, y: 1800, size: 600, photo: 'clock.png',      solidRadius: 100 },
  { id: 'stadium',     name: 'KARAN STADIUM',    x: 3200, y: 2000, size: 700, photo: 'stadium.png',    solidRadius: 180 },
  
  // South-West
  { id: 'iti',         name: 'ITI CHOWK',        x: 800,  y: 2800, size: 600, photo: 'iti.png',        solidRadius: 150 },
  { id: 'bus_stand',   name: 'OLD BUS STAND',    x: 1400, y: 3000, size: 600, photo: 'bus.png',        solidRadius: 150 },
  
  // South-East
  { id: 'mall',        name: 'KARNAL MALL',      x: 3000, y: 3000, size: 700, photo: 'mall.png',       solidRadius: 180 },
  { id: 'atal_park',   name: 'ATAL PARK',        x: 3600, y: 3400, size: 600, photo: 'atal.png',       solidRadius: 120 },
  
  // Deep South
  { id: 'meeraghati',  name: 'MEERA GHATI',      x: 1800, y: 3600, size: 500, photo: 'meeraghati.png', solidRadius: 100 },
  { id: 'namaste',     name: 'NAMASTE CHOWK',    x: 2400, y: 3800, size: 600, photo: 'namaste.png',    solidRadius: 120 },
  { id: 'police',      name: 'POLICE ACADEMY',   x: 3200, y: 3900, size: 700, photo: 'police.png',     solidRadius: 180 }
];

// 2. THE GROUND TILES
const TILE_FILES = {
  grass: 'grass.png',
  road: 'road.png',
  rail: 'rail.png',
  highway: 'horizontal.png' // Using your horizontal tile for the main highway
};

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
  for (const [key, file] of Object.entries(TILE_FILES)) {
    tasks.push(loadImage('tile_' + key, ASSET + 'tile/' + file));
  }
  for (const z of ZONES) {
    tasks.push(loadImage('zone_' + z.id, ASSET + 'zones/' + z.photo));
  }
  
  let done = 0;
  const total = tasks.length;
  tasks.forEach(t => t.then(() => { done++; if (onProgress) onProgress(done / total); }));
  await Promise.all(tasks);
}

// 3. COLLISION (Zones + Rocks)
function resolveCollisions(entity, rocks) {
  // Check Zones
  for (const z of ZONES) {
    if (z.solidRadius === 0) continue;
    const dx = entity.x - z.x;
    const dy = entity.y - z.y;
    const dist = Math.hypot(dx, dy);
    const minDist = z.solidRadius + entity.radius;
    if (dist < minDist) {
      const angle = Math.atan2(dy, dx);
      entity.x = z.x + Math.cos(angle) * minDist;
      entity.y = z.y + Math.sin(angle) * minDist;
    }
  }
  
  // Check Rocks (Cover)
  if (rocks) {
    for (const r of rocks) {
      const dx = entity.x - r.x;
      const dy = entity.y - r.y;
      const dist = Math.hypot(dx, dy);
      const minDist = r.radius + entity.radius;
      if (dist < minDist) {
        const angle = Math.atan2(dy, dx);
        entity.x = r.x + Math.cos(angle) * minDist;
        entity.y = r.y + Math.sin(angle) * minDist;
      }
    }
  }
}

window.MAP = {
  WORLD_W, WORLD_H, ZONES, TILE_FILES, imageCache,
  preloadMapAssets, resolveCollisions, ASSET
};
