// ============================================
// MAP.JS v11 — EXACT SKETCH LAYOUT
// ============================================

const WORLD_W = 4000;
const WORLD_H = 4000;
const ASSET = 'assets/';

// 1. ZONES (Placed exactly where you drew the boxes)
const ZONES = [
  // Top Left
  { id: 'exit',        name: 'EXIT',         x: 600,  y: 600,  size: 400, photo: 'exit.png',       solidRadius: 100 },
  // Left Mid
  { id: 'mall',        name: 'MALL',         x: 1000, y: 1400, size: 500, photo: 'mall.png',       solidRadius: 120 },
  // Far Left
  { id: 'railway',     name: 'RAILWAY',      x: 400,  y: 1800, size: 500, photo: 'railway.png',    solidRadius: 150 },
  // Bottom Left
  { id: 'bus',         name: 'BUS',          x: 800,  y: 3000, size: 450, photo: 'bus.png',        solidRadius: 100 },
  
  // Top Center
  { id: 'ndri',        name: 'NDRI',         x: 2200, y: 600,  size: 600, photo: 'ndri.png',       solidRadius: 180 },
  // Center
  { id: 'karan',       name: 'KARAN',        x: 2200, y: 2000, size: 500, photo: 'stadium.png',    solidRadius: 150 },
  // Bottom Center
  { id: 'clock',       name: 'CLOCK',        x: 2200, y: 3000, size: 450, photo: 'clock.png',      solidRadius: 100 },

  // Top Right
  { id: 'haveli',      name: 'HAVELI',       x: 3400, y: 600,  size: 600, photo: 'haveli.png',     solidRadius: 180 },
  // Mid Right
  { id: 'atal',        name: 'ATAL',         x: 3800, y: 1400, size: 400, photo: 'atal.png',       solidRadius: 100 },
  { id: 'meera',       name: 'MEERA',        x: 2800, y: 1800, size: 450, photo: 'meeraghati.png', solidRadius: 100 },
  { id: 'namaste',     name: 'NAMASTE',      x: 3400, y: 1800, size: 500, photo: 'namaste.png',    solidRadius: 120 },
  // Bottom Right
  { id: 'police',      name: 'POLICE',       x: 3800, y: 3400, size: 500, photo: 'police.png',     solidRadius: 150 }
];

// 2. ROADS (Straight lines connecting the zones)
const ROADS = [
  // --- HORIZONTAL ROADS ---
  { x: 1600, y: 600, w: 1200, h: 120 }, // Exit turn -> NDRI -> Haveli (Top)
  { x: 2200, y: 1400, w: 1200, h: 120 }, // Mall -> Meera -> Namaste (Mid)
  { x: 2200, y: 3000, w: 2400, h: 120 }, // Bus -> Clock -> Namaste (Bottom)
  
  // --- VERTICAL ROADS ---
  { x: 1000, y: 2200, w: 120, h: 1600 }, // Exit/Mall -> Bus (Left)
  { x: 2200, y: 2200, w: 120, h: 1600 }, // NDRI -> Karan -> Clock (Center)
  { x: 3400, y: 2000, w: 120, h: 2800 }, // Haveli -> Namaste -> Police (Right)
  { x: 3800, y: 2400, w: 120, h: 2000 }, // Atal -> Police (Far Right)
];

// 3. RAILWAY
const RAILS = [
  { x: 200, y: 2000, w: 120, h: 4000 } // Far left edge
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

// COLLISION (Solid centers)
function resolveCollisions(entity, rocks) {
  for (const z of ZONES) {
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
  WORLD_W, WORLD_H, ZONES, ROADS, RAILS, imageCache,
  preloadMapAssets, resolveCollisions, ASSET
};
