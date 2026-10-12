// ============================================
// MINIMAP.JS — Top-right PUBG-style minimap
// Uses map.png as base + draws player + bots + zones
// ============================================

const mm = document.getElementById('minimap');
const mmCtx = mm ? mm.getContext('2d') : null;

// Zoom: show only a window around player (like PUBG), not the whole map
const MINIMAP_VIEW = 1200; // world units visible in the minimap (1000 = zoomed in)

function drawMinimap(player, bots, zone) {
  if (!mmCtx) return;

  const W = mm.width;
  const H = mm.height;
  const scale = W / MINIMAP_VIEW;

  mmCtx.clearRect(0, 0, W, H);

  // --- dark background ---
  mmCtx.fillStyle = '#0a0a0f';
  mmCtx.fillRect(0, 0, W, H);

  // --- base map image (window around player) ---
  const base = window.MAP.imageCache['base_map'];
  if (base && player) {
    // The map image represents the entire WORLD_W x WORLD_H area
    const imgScale = base.width / window.MAP.WORLD_W; // pixels per world unit

    // Player is at center of minimap.
    // We want to draw a MINIMAP_VIEW x MINIMAP_VIEW window centered on player.
    const viewHalf = MINIMAP_VIEW / 2;
    const srcX = Math.max(0, (player.x - viewHalf) * imgScale);
    const srcY = Math.max(0, (player.y - viewHalf) * imgScale);
    const srcW = Math.min(base.width  - srcX, MINIMAP_VIEW * imgScale);
    const srcH = Math.min(base.height - srcY, MINIMAP_VIEW * imgScale);

    // Where the player sits in the destination minimap (clamped if near edges)
    const drawX = ((player.x - viewHalf) < 0 ? 0 : 0);
    const drawY = ((player.y - viewHalf) < 0 ? 0 : 0);

    mmCtx.globalAlpha = 0.85;
    mmCtx.drawImage(base, srcX, srcY, srcW, srcH, 0, 0, W, H);
    mmCtx.globalAlpha = 1.0;
  } else {
    // fallback grid
    mmCtx.strokeStyle = 'rgba(0,255,200,0.15)';
    mmCtx.lineWidth = 1;
    for (let i = 0; i <= W; i += 30) {
      mmCtx.beginPath(); mmCtx.moveTo(i, 0); mmCtx.lineTo(i, H); mmCtx.stroke();
      mmCtx.beginPath(); mmCtx.moveTo(0, i); mmCtx.lineTo(W, i); mmCtx.stroke();
    }
  }

  // --- dark vignette ---
  mmCtx.fillStyle = 'rgba(0,0,0,0.25)';
  mmCtx.fillRect(0, 0, W, H);

  if (!player) return;

  // --- World→Minimap helper ---
  // Player is always at center (W/2, H/2)
  const cx = W / 2, cy = H / 2;
  const worldToMM = (wx, wy) => ({
    x: cx + (wx - player.x) * scale,
    y: cy + (wy - player.y) * scale
  });

  // --- Draw zone rings ---
  for (const z of window.MAP.ZONES) {
    const p = worldToMM(z.x, z.y);
    const r = z.r * scale;
    if (p.x + r < 0 || p.x - r > W || p.y + r < 0 || p.y - r > H) continue;

    mmCtx.beginPath();
    mmCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
    mmCtx.strokeStyle = z.water ? 'rgba(80,160,255,0.7)' : 'rgba(0,255,200,0.5)';
    mmCtx.lineWidth = 1.5;
    mmCtx.stroke();

    // name label (tiny)
    if (r > 12) {
      mmCtx.fillStyle = z.water ? '#7ec9ff' : '#00ffc8';
      mmCtx.font = 'bold 9px Arial';
      mmCtx.textAlign = 'center';
      mmCtx.fillText(z.name, p.x, p.y + 3);
    }
  }

  // --- Draw bots as red dots ---
  if (bots) {
    for (const b of bots) {
      if (!b.alive) continue;
      const p = worldToMM(b.x, b.y);
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) continue;
      mmCtx.beginPath();
      mmCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      mmCtx.fillStyle = '#ff3b3b';
      mmCtx.fill();
      mmCtx.strokeStyle = '#fff';
      mmCtx.lineWidth = 1;
      mmCtx.stroke();
    }
  }

  // --- Draw player at center as green arrow ---
  mmCtx.save();
  mmCtx.translate(cx, cy);
  mmCtx.rotate((player.angle || 0) + Math.PI / 2);
  mmCtx.beginPath();
  mmCtx.moveTo(0, -8);
  mmCtx.lineTo(-6, 6);
  mmCtx.lineTo(0, 3);
  mmCtx.lineTo(6, 6);
  mmCtx.closePath();
  mmCtx.fillStyle = '#00ff88';
  mmCtx.fill();
  mmCtx.strokeStyle = '#000';
  mmCtx.lineWidth = 1.5;
  mmCtx.stroke();
  mmCtx.restore();

  // --- Compass "N" ---
  mmCtx.fillStyle = '#ff8a3d';
  mmCtx.font = 'bold 11px Arial';
  mmCtx.textAlign = 'center';
  mmCtx.fillText('N', W - 14, 14);

  // --- Border glow ---
  mmCtx.strokeStyle = 'rgba(255,138,61,0.9)';
  mmCtx.lineWidth = 2;
  mmCtx.strokeRect(1, 1, W - 2, H - 2);
}

window.MINIMAP = { drawMinimap };