// ============================================
// MAP.JS v10 — HAND-DRAWN MAP LAYOUT
// ============================================

const WORLD_W = 4000;
const WORLD_H = 4000;
const ASSET = 'assets/';

// 1. ZONES (Exact placement from your sketch)
const ZONES = [
  // Top Left
  { id: 'exit',        name: 'EXIT GATE',        x: 600,  y: 600,  size: 450, photo: 'exit.png',       solidRadius: 120 },
  
  // Left Column
  { id: 'mall',        name: 'KARNAL MALL',      x: 1200, y: 1200, size: 500, photo: 'mall.png',       solidRadius: 150 },
  { id: 'bus_stand',   name: 'OLD BUS STAND',    x: 800,  y: 2800, size: 450, photo: 'bus.png',        solidRadius: 120 },
  
  // Top Center & Right
  { id: 'ndri',        name: 'NDRI',             x: 2200, y: 600,  size: 600, photo: 'ndri.png',       solidRadius: 180 },
  { id: 'haveli',      name: 'KARNAL HAVELI',    x: 3400, y: 600,  size: 600, photo: 'haveli.png',     solidRadius: 180 },
  
  // Center Hub
  { id: 'meeraghati',  name: 'MEERA GHATI',      x: 1800, y: 2000, size: 600, photo: 'meeraghati.png', solidRadius: 150 },
  { id: 'clock',       name: 'GHANTA GHAR',      x: 1800, y: 3000, size: 500, photo: 'clock.png',      solidRadius: 100 },
  
  // Right Side
  { id: 'atal',        name: 'ATAL PARK',        x: 3600, y: 1600, size: 450, photo: 'atal.png',       solidRadius: 100 },
  { id: 'namaste',     name: 'NAMASTE CHOWK',    x: 3200, y: 2400, size: 500, photo: 'namaste.png',    solidRadius: 150 },
  { id: 'police',      name: 'POLICE ACADEMY',   x: 3600, y: 3600, size: 600, photo: 'police.png',     solidRadius: 180 },
  
  // Water
  { id: 'water',       name: 'MUGHAL CANAL',     x: 2600, y: 3000, size: 600, photo: 'water.png',      solidRadius: 0   } 
];

// 2. ROADS (Exactly as drawn)
const ROADS = [
  // --- VERTICAL ROADS ---
  // Left road (Exit -> Mall -> Bus Stand)
  { type: 'vertical',   x: 800,  y: 1800, w: 150, h: 2400 },
  // Center road (NDRI -> Meeraghati -> Clock)
  { type: 'vertical',   x: 2200, y: 2000, w: 150, h: 2000 },
  // Right road (Haveli -> Atal -> Police)
  { type: 'vertical',   x: 3400, y: 2200, w: 150, h: 2800 },
  
  // --- HORIZONTAL ROADS ---
  // Top road (Mall -> NDRI -> Haveli)
  { type: 'horizontal', x: 2200, y: 1000, w: 2800, h: 150 },
  // Center road (Meeraghati -> Namaste)
  { type: 'horizontal', x: 2400, y: 2000, w: 1200, h: 150 },
  // Bottom road (Bus Stand -> Clock -> Namaste)
  { type: 'horizontal', x: 2200, y: 2800, w: 2800, h: 150 },

  // --- TURNS (Connecting the roads) ---
  { type: 'turn', x: 800,  y: 1000, w: 150, h: 150, rot: 90  }, // Top Left
  { type: 'turn', x: 3400, y: 1000, w: 150, h: 150, rot: 0   }, // Top Right
  { type: 'turn', x: 3400, y: 2800, w: 150, h: 150, rot: 270 }, // Bottom Right
  { type: 'turn', x: 1800, y: 2000, w: 150, h: 150, rot: 0   }, // Center (Meeraghati)
  { type: 'turn', x: 1800, y: 2800, w: 150, h: 150, rot: 90  }  // Clock connector
];

// 3. RAILWAY LINE (Far left)
const RAILS = [
  { type: 'vertical', x: 200, y: 2000, w: 100, h: 3600 }
];

// 4. WATER RIVER (Mughal Canal)
const RIVERS = [
  { type: 'vertical', x: 2600, y: 2200, w: 150, h: 2000 }
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
  tasks.push(loadImage('tile_grass', ASSET + 'tile/grass.png'));
  tasks.push(loadImage('tile_horizontal', ASSET + 'tile/horizontal.png'));
  tasks.push(loadImage('tile_vertical', ASSET + 'tile/vertical.png'));
  tasks.push(loadImage('tile_turn', ASSET + 'tile/turn.png'));
  tasks.push(loadImage('tile_water', ASSET + 'tile/water.png'));
  tasks.push(loadImage('tile_rail', ASSET + 'tile/rail.png'));
  
  // Load zones
  for (const z of ZONES) {
    tasks.push(loadImage('zone_' + z.id, ASSET + 'zones/' + z.photo));
  }
  
  let done = 0;
  const total = tasks.length;
  tasks.forEach(t => t.then(() => { done++; if (onProgress) onProgress(done / total); }));
  await Promise.all(tasks);
}

// COLLISION (Solid centers for zones + Rocks)
function resolveCollisions(entity, rocks) {
  for (const z of ZONES) {
    if (z.solidRadius === 0) continue;
    const dx = entity.x - z.x; const dy = entity.y - z.y; const dist = Math.hypot(dx, dy);
    const minDist = z.solidRadius + entity.radius;
    if (dist < minDist) {
      const angle = Math.atan2(dy, dx);
      entity.x = z.x + Math.cos(angle) * minDist;
      entity.y = z.y + Math.sin(angle) * minDist;
    }
  }
  if (rocks) {
    for (const r of rocks) {
      const dx = entity.x - r.x; const dy = entity.y - r.y; const dist = Math.hypot(dx, dy);
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
  WORLD_W, WORLD_H, ZONES, ROADS, RAILS, RIVERS, imageCache,
  preloadMapAssets, resolveCollisions, ASSET
};
