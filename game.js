// ============================================
// GAME.JS — 2D player + camera + controls
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
resizeCanvas();

const game = {
  running: false,
  player: null,
  camera: { x: 0, y: 0, w: 0, h: 0, zoom: 0.5, targetZoom: 0.5 },
  keys: {},
  move: { active: false, id: null, baseX: 0, baseY: 0, dx: 0, dy: 0 },
  aim:  { active: false, id: null, baseX: 0, baseY: 0, dx: 0, dy: 0 },
  buttons: { run: false, jump: false },
  lastTime: 0,
  lastZone: null
};

const SPEED = { walk: 300, run: 450, wade: 120 };

function createPlayer(config, spawn) {
  return {
    x: spawn.x, y: spawn.y, vx: 0, vy: 0,
    radius: 22, angle: 0,
    state: 'walk', inWater: false,
    z: 0, vz: 0,
    name: config.playerName || 'PLAYER',
    color: '#ff8a3d'
  };
}

window.addEventListener('keydown', e => game.keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup',   e => game.keys[e.key.toLowerCase()] = false);
window.addEventListener('keydown', e => {
  if (e.key === '+' || e.key === '=') game.camera.targetZoom = Math.min(1.4, game.camera.targetZoom + 0.1);
  if (e.key === '-') game.camera.targetZoom = Math.max(0.2, game.camera.targetZoom - 0.1);
});

function bindJoystick(baseEl, stickEl, ref, maxR) {
  if (!baseEl || !stickEl) return;
  const getR = () => baseEl.getBoundingClientRect();
  const start = e => {
    const t = e.touches ? e.touches[0] : e;
    const r = getR();
    ref.active = true;
    ref.id = t.identifier ?? 'mouse';
    ref.baseX = r.left + r.width / 2;
    ref.baseY = r.top + r.height / 2;
    move(e);
  };
  const move = e => {
    if (!ref.active) return;
    let t = e.touches ? Array.from(e.touches).find(tt => tt.identifier === ref.id) : e;
    if (!t) return;
    const dx = t.clientX - ref.baseX, dy = t.clientY - ref.baseY;
    const dist = Math.min(Math.hypot(dx, dy), maxR);
    const ang = Math.atan2(dy, dx);
    const sx = Math.cos(ang) * dist, sy = Math.sin(ang) * dist;
    stickEl.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`;
    ref.dx = sx / maxR; ref.dy = sy / maxR;
  };
  const end = () => {
    ref.active = false; ref.dx = 0; ref.dy = 0;
    stickEl.style.transform = 'translate(-50%, -50%)';
  };
  baseEl.addEventListener('touchstart', e => { e.preventDefault(); start(e); }, { passive: false });
  baseEl.addEventListener('touchmove',  e => { e.preventDefault(); move(e); },  { passive: false });
  baseEl.addEventListener('touchend', end);
  baseEl.addEventListener('touchcancel', end);
  baseEl.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
}

function setupControls() {
  bindJoystick(document.getElementById('joyBase'), document.getElementById('joyStick'), game.move, 55);
  bindJoystick(document.getElementById('aimBase'), document.getElementById('aimStick'), game.aim, 55);

  const btn = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', e => { e.preventDefault(); game.buttons[key] = true; }, { passive: false });
    el.addEventListener('touchend',   e => { e.preventDefault(); game.buttons[key] = false; }, { passive: false });
    el.addEventListener('mousedown',  () => game.buttons[key] = true);
    el.addEventListener('mouseup',    () => game.buttons[key] = false);
    el.addEventListener('mouseleave', () => game.buttons[key] = false);
  };
  btn('btnRun', 'run');
  btn('btnJump', 'jump');

  const zIn  = document.getElementById('zoomIn');
  const zOut = document.getElementById('zoomOut');
  if (zIn)  zIn.addEventListener('click',  () => game.camera.targetZoom = Math.min(1.4, game.camera.targetZoom + 0.15));
  if (zOut) zOut.addEventListener('click', () => game.camera.targetZoom = Math.max(0.2, game.camera.targetZoom - 0.15));
}

function update(dt) {
  const p = game.player;
  if (!p) return;

  game.camera.zoom += (game.camera.targetZoom - game.camera.zoom) * Math.min(1, dt * 6);

  let ix = 0, iy = 0;
  if (game.keys['a'] || game.keys['arrowleft'])  ix -= 1;
  if (game.keys['d'] || game.keys['arrowright']) ix += 1;
  if (game.keys['w'] || game.keys['arrowup'])    iy -= 1;
  if (game.keys['s'] || game.keys['arrowdown'])  iy += 1;
  if (game.move.dx || game.move.dy) { ix = game.move.dx; iy = game.move.dy; }
  const mag = Math.hypot(ix, iy);
  if (mag > 1) { ix /= mag; iy /= mag; }

  if (game.buttons.jump && p.z === 0 && p.vz === 0) p.vz = 300;
  game.buttons.jump = false;

  if (p.vz !== 0 || p.z > 0) {
    p.z += p.vz * dt;
    p.vz -= 900 * dt;
    if (p.z <= 0) { p.z = 0; p.vz = 0; }
  }

  const zone = window.MAP.getZoneAt(p.x, p.y);
  p.inWater = !!(zone && zone.water);

  if (p.inWater) { p.state = 'wade'; p.speed = SPEED.wade; }
  else if (game.buttons.run) { p.state = 'run'; p.speed = SPEED.run; }
  else { p.state = 'walk'; p.speed = SPEED.walk; }
  if (p.z > 0) p.state = 'jump';

  p.vx = ix * p.speed;
  p.vy = iy * p.speed;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.x = Math.max(p.radius, Math.min(window.MAP.WORLD_W - p.radius, p.x));
  p.y = Math.max(p.radius, Math.min(window.MAP.WORLD_H - p.radius, p.y));
  if (mag > 0.1) p.angle = Math.atan2(iy, ix);

  const z = game.camera.zoom;
  const vw = canvas.width / z, vh = canvas.height / z;
  game.camera.w = vw; game.camera.h = vh;
  game.camera.x = Math.max(0, Math.min(window.MAP.WORLD_W - vw, p.x - vw / 2));
  game.camera.y = Math.max(0, Math.min(window.MAP.WORLD_H - vh, p.y - vh / 2));

  const zn = document.getElementById('zoneName');
  if (zn) zn.textContent = zone ? zone.name : 'KARNAL';
  const st = document.getElementById('stateLabel');
  if (st) st.textContent = p.state.toUpperCase();

  // Zone popup on entry
  if (zone && zone.id !== game.lastZone) {
    game.lastZone = zone.id;
    showZonePopup(zone.name);
  }
  if (!zone) game.lastZone = null;
}

function showZonePopup(name) {
  let el = document.getElementById('zonePopup');
  if (!el) {
    el = document.createElement('div');
    el.id = 'zonePopup';
    el.className = 'zone-popup';
    document.getElementById('gameScreen').appendChild(el);
  }
  el.textContent = name;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function render() {
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cam = game.camera;
  const z = cam.zoom;

  window.MAP.drawWorld(ctx, cam, z);

  const p = game.player;
  if (p) {
    const sx = (p.x - cam.x) * z;
    const sy = (p.y - cam.y) * z - p.z * z * 0.5;
    const r  = p.radius * z;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse((p.x - cam.x) * z, (p.y - cam.y) * z + r * 0.5, r * 0.9, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(p.angle + Math.PI / 2);
    ctx.fillStyle = p.inWater ? '#3d6ea8' : p.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(1.5, 2 * z);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -r * 0.6, Math.max(2, 4 * z), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = `bold ${Math.max(11, 14 * z)}px Arial`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    const ny = sy - r - 12 * z;
    ctx.strokeText(p.name, sx, ny);
    ctx.fillText(p.name, sx, ny);
    ctx.restore();
  }
}

function loop(ts) {
  if (!game.running) return;
  const dt = Math.min((ts - game.lastTime) / 1000, 0.05);
  game.lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

async function startGame(config) {
  document.getElementById('gameScreen').classList.remove('hidden');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  showLoading(0);
  await window.MAP.preloadMapAssets(p => showLoading(p));
  hideLoading();

  const spawn = window.MAP.getSpawnPoint();
  game.player = createPlayer(config, spawn);
  game.camera.w = canvas.width / game.camera.zoom;
  game.camera.h = canvas.height / game.camera.zoom;
  game.camera.x = game.player.x - game.camera.w / 2;
  game.camera.y = game.player.y - game.camera.h / 2;

  setupControls();

  game.running = true;
  game.lastTime = performance.now();
  requestAnimationFrame(loop);
}

function showLoading(progress) {
  let el = document.getElementById('loadingOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadingOverlay';
    el.className = 'loading-overlay';
    el.innerHTML = `<div class="loading-inner"><div class="loading-title">KARNAL ROYALE</div><div class="loading-bar-bg"><div id="loadingBarFill" class="loading-bar-fill"></div></div><div id="loadingPct" class="loading-pct">0%</div><div class="loading-hint">LOADING KARNAL...</div></div>`;
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