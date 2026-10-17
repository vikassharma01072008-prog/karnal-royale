// ============================================
// MAP.JS v8 — ACTUAL MAP + REAL COLLISIONS
// ============================================

const WORLD_W = 4000;
const WORLD_H = 4000;
const ASSET = 'assets/';

// Zones placed according to the actual map.png layout
const ZONES = [
  // North
  { id: 'karan_lake',  name: 'KARAN LAKE',       x: 2000, y: 600,  size: 700, photo: 'karan.png',      solidRadius: 0   }, // Water
  { id: 'exit_gate',   name: 'KARNAL EXIT GATE', x: 1900, y: 1200, size: 500, photo: 'exit.png',       solidRadius: 120 }, 
  { id: 'ndri',        name: 'NDRI',             x: 3200, y: 1200, size: 700, photo: 'ndri.png',       solidRadius: 200 }, 
  
  // North-West
  { id: 'railway',     name: 'RAILWAY STATION',  x: 600,  y: 1400, size: 700, photo: 'railway.png',    solidRadius: 180 },
  { id: 'alpha',       name: 'ALPHA CITY',       x: 800,  y: 1900, size: 600, photo: 'alpha.png',      solidRadius: 150 },
  
  // Center
  { id: 'meeraghati',  name: 'MEERA GHATI',      x: 1500, y: 1500, size: 500, photo: 'meeraghati.png', solidRadius: 100 },
  { id: 'haveli',      name: 'KARNAL HAVELI',    x: 2000, y: 1700, size: 700, photo: 'haveli.png',     solidRadius: 200 },
  { id: 'stadium',     name: 'KARAN STADIUM',    x: 2500, y: 1500, size: 600, photo: 'stadium.png',    solidRadius: 150 },
  
  // North-East
  { id: 'atal_park',   name: 'ATAL PARK',        x: 3400, y: 1900, size: 600, photo: 'atal.png',       solidRadius: 100 },
  { id: 'mall',        name: 'KARNAL MALL',      x: 3300, y: 2500, size: 600, photo: 'mall.png',       solidRadius: 180 },
  
  // Canal
  { id: 'mugla',       name: 'MUGHAL CANAL',     x: 2800, y: 2000, size: 600, photo: 'water.png',      solidRadius: 0   }, // Water
  
  // South-West
  { id: 'iti',         name: 'ITI CHOWK',        x: 600,  y: 2600, size: 600, photo: 'iti.png',        solidRadius: 150 },
  
  // South
  { id: 'bus_stand',   name: 'OLD BUS STAND',    x: 1400, y: 2600, size: 600, photo: 'bus.png',        solidRadius: 150 },
  { id: 'clock',       name: 'GHANTA GHAR',      x: 2000, y: 2600, size: 600, photo: 'clock.png',      solidRadius: 100 },
  { id: 'namaste',     name: 'NAMASTE CHOWK',    x: 2000, y: 3200, size: 600, photo: 'namaste.png',    solidRadius: 120 },
  { id: 'police',      name: 'POLICE ACADEMY',   x: 2000, y: 3800, size: 700, photo: 'police.png',     solidRadius: 200 }
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
  tasks.push(loadImage('base_map', ASSET + 'map.png')); // Load the actual map as ground
  
  for (const z of ZONES) {
    tasks.push(loadImage('zone_' + z.id, ASSET + 'zones/' + z.photo));
  }
  
  let done = 0;
  const total = tasks.length;
  tasks.forEach(t => t.then(() => { done++; if (onProgress) onProgress(done / total); }));
  await Promise.all(tasks);
}

// TRUE SOLID COLLISION (Circle based)
function resolveCollisions(entity) {
  for (const z of ZONES) {
    if (z.solidRadius === 0) continue; // Skip water
    
    const dx = entity.x - z.x;
    const dy = entity.y - z.y;
    const dist = Math.hypot(dx, dy);
    const minDist = z.solidRadius + entity.radius;
    
    if (dist < minDist) {
      // Push player out of the building
      const angle = Math.atan2(dy, dx);
      entity.x = z.x + Math.cos(angle) * minDist;
      entity.y = z.y + Math.sin(angle) * minDist;
    }
  }
}

window.MAP = {
  WORLD_W, WORLD_H, ZONES, imageCache,
  preloadMapAssets, resolveCollisions, ASSET
};
