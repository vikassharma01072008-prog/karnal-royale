// ============================================
// MAP.JS v13 — ENTERABLE ZONES + SWIM LOGIC
// ============================================

const WORLD_W = 4000;
const WORLD_H = 4000;
const ASSET = 'assets/';

// ZONES
const ZONES = [
  { id: 'exit',        name: 'EXIT',         x: 600,  y: 600,  size: 400, photo: 'exit.png',       solidRadius: 120, water: false },
  { id: 'mall',        name: 'MALL',         x: 1000, y: 1400, size: 500, photo: 'mall.png',       solidRadius: 150, water: false },
  { id: 'railway',     name: 'RAILWAY',      x: 400,  y: 1800, size: 500, photo: 'railway.png',    solidRadius: 150, water: false },
  { id: 'bus',         name: 'BUS',          x: 800,  y: 3000, size: 450, photo: 'bus.png',        solidRadius: 100, water: false },
  { id: 'ndri',        name: 'NDRI',         x: 2200, y: 600,  size: 600, photo: 'ndri.png',       solidRadius: 180, water: false },
  { id: 'karan',       name: 'KARAN',        x: 2200, y: 2000, size: 500, photo: 'stadium.png',    solidRadius: 150, water: false },
  { id: 'clock',       name: 'CLOCK',        x: 2200, y: 3000, size: 450, photo: 'clock.png',      solidRadius: 100, water: false },
  { id: 'haveli',      name: 'HAVELI',       x: 3400, y: 600,  size: 600, photo: 'haveli.png',     solidRadius: 180, water: false },
  { id: 'atal',        name: 'ATAL PARK',    x: 3800, y: 1400, size: 450, photo: 'atal.png',       solidRadius: 100, water: true  }, // WATER
  { id: 'meera',       name: 'MEERA',        x: 2800, y: 1800, size: 450, photo: 'meeraghati.png', solidRadius: 100, water: false },
  { id: 'namaste',     name: 'NAMASTE',      x: 3400, y: 1800, size: 500, photo: 'namaste.png',    solidRadius: 120, water: false },
  { id: 'police',      name: 'POLICE',       x: 3800, y: 3400, size: 500, photo: 'police.png',     solidRadius: 150, water: false }
];

// ROADS
const ROADS = [
  { x: 1600, y: 600, w: 1200, h: 120 }, 
  { x: 2200, y: 1400, w: 1200, h: 120 }, 
  { x: 2200, y: 3000, w: 2400, h: 120 }, 
  { x: 1000, y: 2200, w: 120, h: 1600 }, 
  { x: 2200, y: 2200, w: 120, h: 1600 }, 
  { x: 3400, y: 2000, w: 120, h: 2800 }, 
  { x: 3800, y: 2400, w: 120, h: 2000 }  
];

// RAILS
const RAILS = [ { x: 200, y: 2000, w: 120, h: 4000 } ];

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
  tasks.push(loadImage('tile_grass', ASSET + 'tile/grass.png'));
  tasks.push(loadImage('tile_horizontal', ASSET + 'tile/horizontal.png'));
  tasks.push(loadImage('tile_vertical', ASSET + 'tile/vertical.png'));
  tasks.push(loadImage('tile_rail', ASSET + 'tile/rail.png'));
  for (const z of ZONES) { tasks.push(loadImage('zone_' + z.id, ASSET + 'zones/' + z.photo)); }
  let done = 0; const total = tasks.length;
  tasks.forEach(t => t.then(() => { done++; if (onProgress) onProgress(done / total); }));
  await Promise.all(tasks);
}

// COLLISION (Zones + Border Hedges)
function resolveCollisions(entity, rocks) {
  for (const z of ZONES) {
    // 1. Center Building Collision (Circle)
    const dx = entity.x - z.x; const dy = entity.y - z.y; 
    const dist = Math.hypot(dx, dy);
    const minDist = z.solidRadius + entity.radius;
    
    if (dist < minDist) {
      const angle = Math.atan2(dy, dx);
      entity.x = z.x + Math.cos(angle) * minDist;
      entity.y = z.y + Math.sin(angle) * minDist;
    }
  }
}

// CHECK IF SWIMMING
function isInWater(x, y) {
  for (const z of ZONES) {
    if (!z.water) continue;
    const dist = Math.hypot(x - z.x, y - z.y);
    // If inside the plaza size (excluding the very center)
    if (dist < z.size / 2) return true; 
  }
  return false;
}

window.MAP = {
  WORLD_W, WORLD_H, ZONES, ROADS, RAILS, imageCache,
  preloadMapAssets, resolveCollisions, isInWater, ASSET
};
