// ============================================
// MAP.JS v12 — SOLID BOX COLLISION
// ============================================

const WORLD_W = 4000;
const WORLD_H = 4000;
const ASSET = 'assets/';

const ZONES = [
  { id: 'exit',        name: 'EXIT',         x: 600,  y: 600,  size: 400, photo: 'exit.png',       solidRadius: 200 },
  { id: 'mall',        name: 'MALL',         x: 1000, y: 1400, size: 500, photo: 'mall.png',       solidRadius: 250 },
  { id: 'railway',     name: 'RAILWAY',      x: 400,  y: 1800, size: 500, photo: 'railway.png',    solidRadius: 250 },
  { id: 'bus',         name: 'BUS',          x: 800,  y: 3000, size: 450, photo: 'bus.png',        solidRadius: 225 },
  { id: 'ndri',        name: 'NDRI',         x: 2200, y: 600,  size: 600, photo: 'ndri.png',       solidRadius: 300 },
  { id: 'karan',       name: 'KARAN',        x: 2200, y: 2000, size: 500, photo: 'stadium.png',    solidRadius: 250 },
  { id: 'clock',       name: 'CLOCK',        x: 2200, y: 3000, size: 450, photo: 'clock.png',      solidRadius: 225 },
  { id: 'haveli',      name: 'HAVELI',       x: 3400, y: 600,  size: 600, photo: 'haveli.png',     solidRadius: 300 },
  { id: 'atal',        name: 'ATAL',         x: 3800, y: 1400, size: 400, photo: 'atal.png',       solidRadius: 200 },
  { id: 'meera',       name: 'MEERA',        x: 2800, y: 1800, size: 450, photo: 'meeraghati.png', solidRadius: 225 },
  { id: 'namaste',     name: 'NAMASTE',      x: 3400, y: 1800, size: 500, photo: 'namaste.png',    solidRadius: 250 },
  { id: 'police',      name: 'POLICE',       x: 3800, y: 3400, size: 500, photo: 'police.png',     solidRadius: 250 }
];

const ROADS = [
  { x: 1600, y: 600, w: 1200, h: 120 }, // Top Horizontal
  { x: 2200, y: 1400, w: 1200, h: 120 }, // Mid Horizontal
  { x: 2200, y: 3000, w: 2400, h: 120 }, // Bottom Horizontal
  { x: 1000, y: 2200, w: 120, h: 1600 }, // Left Vertical
  { x: 2200, y: 2200, w: 120, h: 1600 }, // Center Vertical
  { x: 3400, y: 2000, w: 120, h: 2800 }, // Right Vertical
  { x: 3800, y: 2400, w: 120, h: 2000 }  // Far Right Vertical
];

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

// FULL BOX COLLISION
function resolveCollisions(entity, rocks) {
  for (const z of ZONES) {
    // Treating the solidRadius as a box half-width
    const hw = z.solidRadius;
    const hh = z.solidRadius;
    
    const dx = entity.x - z.x;
    const dy = entity.y - z.y;
    
    if (Math.abs(dx) < hw + entity.radius && Math.abs(dy) < hh + entity.radius) {
      // Push out along the smallest axis
      const overlapX = (hw + entity.radius) - Math.abs(dx);
      const overlapY = (hh + entity.radius) - Math.abs(dy);
      
      if (overlapX < overlapY) {
        entity.x = z.x + Math.sign(dx || 1) * (hw + entity.radius);
      } else {
        entity.y = z.y + Math.sign(dy || 1) * (hh + entity.radius);
      }
    }
  }
}

window.MAP = {
  WORLD_W, WORLD_H, ZONES, ROADS, RAILS, imageCache,
  preloadMapAssets, resolveCollisions, ASSET
};
