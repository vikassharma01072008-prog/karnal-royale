// ============================================
// GAME.JS — M2A: Map + Player + Camera + Movement
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ---------- RESIZE ----------
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
resizeCanvas();

// ---------- GAME STATE ----------
const game = {
  running: false,
  player: null,
  camera: { x: 0, y: 0, w: 0, h: 0 },
  world: null,
  keys: {},
  joystick: { active: false, dx: 0, dy: 0, id: null, baseX: 0, baseY: 0 },
  lastTime: 0,
  dpr: window.devicePixelRatio || 1
};

// ---------- SPEED TABLE ----------
const SPEED = {
  walk: 320,       // px/sec, "100%"
  run: 480,        // 150%
  wade: 128,       // 40% in water
  swim: 256,       // 80%
  surf: 320        // 100%
};

// ---------- PLAYER ----------
function createPlayer(config, spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    radius: 22,
    speed: SPEED.walk,
    vx: 0,
    vy: 0,
    angle: 0,
    // state
    state: 'walk',  // walk | run | wade | swim | surf
    inWater: false,
    // rendering
    name: config.playerName || 'PLAYER',
    sprite: null,   // set by sprite loader (M2B)
    spriteFolder: config.character ? config.character.folder : 'manblue',
    color: '#ff8a3d' // fallback render color
  };
}

// ---------- INPUT ----------
window.addEventListener('keydown', (e) => { game.keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { game.keys[e.key.toLowerCase()] = false; });

// ---------- MOBILE JOYSTICK (left side only for M2A) ----------
// The joystick UI is defined in index.html; we just read its state.
function setupJoystick() {
  const base = document.getElementById('joyBase');
  const stick = document.getElementById('joyStick');
  if (!base || !stick) return;

  const baseRect = () => base.getBoundingClientRect();

  const start = (e) => {
    const t = e.touches ? e.touches[0] : e;
    const r = baseRect();
    game.joystick.active = true;
    game.joystick.id = t.identifier ?? 'mouse';
    game.joystick.baseX = r.left + r.width / 2;
    game.joystick.baseY = r.top + r.height / 2;
    move(t);
  };
  const move = (e) => {
    if (!game.joystick.active) return;
    let t = e.touches ? Array.from(e.touches).find(t => t.identifier === game.joystick.id) : e;
    if (!t) return;
    const dx = t.clientX - game.joystick.baseX;
    const dy = t.clientY - game.joystick.baseY;
    const max = 55;
    const dist = Math.min(Math.hypot(dx, dy), max);
    const ang = Math.atan2(dy, dx);
    const sx = Math.cos(ang) * dist;
    const sy = Math.sin(ang) * dist;
    stick.style.transform = `translate(${sx}px, ${sy}px)`;
    game.joystick.dx = sx / max;
    game.joystick.dy = sy / max;
  };
  const end = () => {
    game.joystick.active = false;
    game.joystick.dx = 0;
    game.joystick.dy = 0;
    stick.style.transform = 'translate(0,0)';
  };

  base.addEventListener('touchstart', (e) => { e.preventDefault(); start(e); }, { passive: false });
  base.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, { passive: false });
  base.addEventListener('touchend', end);
  base.addEventListener('touchcancel', end);
  base.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
}

// ---------- UPDATE ----------
function update(dt) {
  const p = game.player;
  if (!p) return;

  // Input vector
  let ix = 0, iy = 0;
  if (game.keys['a'] || game.keys['arrowleft']) ix -= 1;
  if (game.keys['d'] || game.keys['arrowright']) ix += 1;
  if (game.keys['w'] || game.keys['arrowup']) iy -= 1;
  if (game.keys['s'] || game.keys['arrowdown']) iy += 1;
  if (game.joystick.dx || game.joystick.dy) {
    ix = game.joystick.dx;
    iy = game.joystick.dy;
  }

  const mag = Math.hypot(ix, iy);
  if (mag > 1) { ix /= mag; iy /= mag; }

  // Movement
  p.vx = ix * p.speed;
  p.vy = iy * p.speed;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Clamp to world
  p.x = Math.max(p.radius, Math.min(window.MAP.WORLD_W - p.radius, p.x));
  p.y = Math.max(p.radius, Math.min(window.MAP.WORLD_H - p.radius, p.y));

  // Face direction
  if (mag > 0.1) p.angle = Math.atan2(iy, ix);

  // Zone detection (surface type)
  const zone = window.MAP.getZoneAt(p.x, p.y);
  p.inWater = !!(zone && zone.water);

  // Speed by state (M2A: water = wade only; swim/surf in M2B)
  if (p.inWater) {
    p.state = 'wade';
    p.speed = SPEED.wade;
  } else {
    p.state = 'walk';
    p.speed = SPEED.walk;
  }

  // Camera follow (centered on player)
  game.camera.x = p.x - game.camera.w / 2;
  game.camera.y = p.y - game.camera.h / 2;
  // Clamp camera to world edges
  game.camera.x = Math.max(0, Math.min(window.MAP.WORLD_W - game.camera.w, game.camera.x));
  game.camera.y = Math.max(0, Math.min(window.MAP.WORLD_H - game.camera.h, game.camera.y));

  // HUD updates
  updateHUD(zone);
}

function updateHUD(zone) {
  const el = document.getElementById('zoneName');
  if (el) el.textContent = zone ? zone.name : '';
  const st = document.getElementById('stateLabel');
  if (st) st.textContent = game.player.state.toUpperCase();
}

// ---------- RENDER ----------
function render() {
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cam = game.camera;
  cam.w = canvas.width;
  cam.h = canvas.height;

  // Draw world
  window.MAP.drawWorld(ctx, cam);

  // Draw player
  const p = game.player;
  if (p) {
    const sx = p.x - cam.x;
    const sy = p.y - cam.y;

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx, sy + p.radius * 0.7, p.radius * 0.9, p.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body (fallback circle until M2B sprite loader)
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(p.angle + Math.PI / 2);
    ctx.fillStyle = p.inWater ? '#3d6ea8' : p.color;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing indicator
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -p.radius * 0.6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Name tag
    ctx.save();
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(p.name, sx, sy - p.radius - 12);
    ctx.fillText(p.name, sx, sy - p.radius - 12);
    ctx.restore();
  }

  // FPS-ish debug (top-left, tiny)
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#fff';
  ctx.font = '11px monospace';
  ctx.fillText(`X:${Math.round(game.player.x)} Y:${Math.round(game.player.y)}`, 10, 18);
  ctx.restore();
}

// ---------- MAIN LOOP ----------
function loop(ts) {
  if (!game.running) return;
  const dt = Math.min((ts - game.lastTime) / 1000, 0.05);
  game.lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// ---------- START GAME (called by lobby.js) ----------
async function startGame(config) {
  document.getElementById('gameScreen').classList.remove('hidden');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Loading overlay
  showLoading(0);

  await window.MAP.preloadMapAssets((p) => showLoading(p));

  hideLoading();

  const spawn = window.MAP.getSpawnPoint();
  game.player = createPlayer(config, spawn);
  game.camera.w = canvas.width;
  game.camera.h = canvas.height;
  game.camera.x = game.player.x - canvas.width / 2;
  game.camera.y = game.player.y - canvas.height / 2;

  setupJoystick();

  game.running = true;
  game.lastTime = performance.now();
  requestAnimationFrame(loop);
}

// ---------- LOADING OVERLAY ----------
function showLoading(progress) {
  let el = document.getElementById('loadingOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadingOverlay';
    el.className = 'loading-overlay';
    el.innerHTML = `
      <div class="loading-inner">
        <div class="loading-title">KARNAL ROYALE</div>
        <div class="loading-bar-bg"><div id="loadingBarFill" class="loading-bar-fill"></div></div>
        <div id="loadingPct" class="loading-pct">0%</div>
        <div class="loading-hint">LOADING KARNAL...</div>
      </div>`;
    document.body.appendChild(el);
  }
  el.classList.remove('hidden');
  const pct = Math.round(progress * 100);
  document.getElementById('loadingBarFill').style.width = pct + '%';
  document.getElementById('loadingPct').textContent = pct + '%';
}
function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.classList.add('hidden');
}

window.startGame = startGame;