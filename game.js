// Karnal Royale — Full Client: Grenades + Trajectory + Mobile + 2.5D
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const minimap = document.getElementById('minimap');
const mctx = minimap.getContext('2d');

const statusEl = document.getElementById('status');
const playerCountEl = document.getElementById('player-count');
const coordsEl = document.getElementById('coords');
const myHealthEl = document.getElementById('my-health');
const myWeaponEl = document.getElementById('my-weapon');
const killFeedEl = document.getElementById('kill-feed');
const deathScreenEl = document.getElementById('death-screen');
const zoneNameEl = document.getElementById('zone-name');
const zoneWarningEl = document.getElementById('zone-warning');
const jumpPromptEl = document.getElementById('jump-prompt');
const victoryOverlayEl = document.getElementById('victory-overlay');
const victorySubEl = document.getElementById('victory-sub');
const victoryStatsEl = document.getElementById('victory-stats');
const victoryTimerEl = document.getElementById('victory-timer');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ===== DETECT MOBILE =====
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 800;

// ===== ASSETS =====
const SPRITES = { playerSelf: null, playerOther: null, grass: null, water: null, road: null, building: null, plane: null, intro: null };
let assetsLoaded = 0;
const TOTAL_ASSETS = 8;
function loadImage(key, src) {
  const img = new Image();
  img.onload = () => { SPRITES[key] = img; assetsLoaded++; if (assetsLoaded === TOTAL_ASSETS) console.log('All assets loaded'); };
  img.onerror = () => { console.warn('Failed to load:', src); assetsLoaded++; };
  img.src = src;
}
loadImage('playerSelf',  'assets/manblue/manBlue_gun.png');
loadImage('playerOther', 'assets/soldier1/soldier1_gun.png');
loadImage('grass',       'assets/tiles/tile_01.png');
loadImage('water',       'assets/tiles/tile_07.png');
loadImage('road',        'assets/tiles/tile_13.png');
loadImage('building',    'assets/tiles/tile_96.png');
loadImage('plane',       'assets/plane.png');
loadImage('intro',       'assets/intro.png');

// ===== INTRO =====
let showIntro = true;
const introOverlay = document.createElement('div');
introOverlay.id = 'intro-overlay';
const introBg = document.createElement('div');
introBg.id = 'intro-bg';
const introContent = document.createElement('div');
introContent.id = 'intro-content';
introContent.innerHTML = '<div id="intro-title">KARNAL ROYALE</div><div id="intro-sub">Battle Royale • Karnal Edition</div><div id="intro-btn">CLICK TO PLAY</div>';
introOverlay.appendChild(introBg);
introOverlay.appendChild(introContent);
document.body.appendChild(introOverlay);

function paintIntroBg() {
  if (SPRITES.intro) introBg.style.backgroundImage = "url('assets/intro.png')";
  else introBg.style.background = 'linear-gradient(135deg, #1a3a5a 0%, #4a2a1a 100%)';
}
setTimeout(paintIntroBg, 500);

introOverlay.addEventListener('click', () => {
  introOverlay.style.opacity = '0';
  setTimeout(() => { introOverlay.style.display = 'none'; showIntro = false; }, 500);
});

// ===== MOBILE TOUCH CONTROLS =====
const touchState = {
  moveActive: false, moveStartX: 0, moveStartY: 0, moveX: 0, moveY: 0,
  aimActive: false, aimStartX: 0, aimStartY: 0, aimX: 0, aimY: 0,
  firing: false
};

if (isMobile) {
  const controls = document.createElement('div');
  controls.id = 'mobile-controls';
  controls.innerHTML = `
    <div id="joy-left" class="joy-zone">
      <div id="joy-left-knob" class="joy-knob"></div>
    </div>
    <div id="joy-right" class="joy-zone">
      <div id="joy-right-knob" class="joy-knob"></div>
    </div>
    <button id="btn-fire" class="mobile-btn">FIRE</button>
    <button id="btn-jump" class="mobile-btn">JUMP</button>
    <button id="btn-nade" class="mobile-btn">NADE</button>
  `;
  document.body.appendChild(controls);

  const joyLeft = document.getElementById('joy-left');
  const joyLeftKnob = document.getElementById('joy-left-knob');
  const joyRight = document.getElementById('joy-right');
  const joyRightKnob = document.getElementById('joy-right-knob');
  const btnFire = document.getElementById('btn-fire');
  const btnJump = document.getElementById('btn-jump');
  const btnNade = document.getElementById('btn-nade');

  const JOY_RADIUS = 60;

  function handleJoyStart(which, e) {
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    const rect = (which === 'move' ? joyLeft : joyRight).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (which === 'move') {
      touchState.moveActive = true;
      touchState.moveStartX = cx;
      touchState.moveStartY = cy;
    } else {
      touchState.aimActive = true;
      touchState.aimStartX = cx;
      touchState.aimStartY = cy;
    }
    handleJoyMove(which, e);
  }

  function handleJoyMove(which, e) {
    if (which === 'move' && !touchState.moveActive) return;
    if (which === 'aim' && !touchState.aimActive) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    const startX = which === 'move' ? touchState.moveStartX : touchState.aimStartX;
    const startY = which === 'move' ? touchState.moveStartY : touchState.aimStartY;
    let dx = t.clientX - startX;
    let dy = t.clientY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOY_RADIUS) { dx = (dx / dist) * JOY_RADIUS; dy = (dy / dist) * JOY_RADIUS; }
    if (which === 'move') {
      touchState.moveX = dx / JOY_RADIUS;
      touchState.moveY = dy / JOY_RADIUS;
      joyLeftKnob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    } else {
      touchState.aimX = dx / JOY_RADIUS;
      touchState.aimY = dy / JOY_RADIUS;
      joyRightKnob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    }
  }

  function handleJoyEnd(which, e) {
    e.preventDefault();
    if (which === 'move') {
      touchState.moveActive = false;
      touchState.moveX = 0; touchState.moveY = 0;
      joyLeftKnob.style.transform = 'translate(0, 0)';
    } else {
      touchState.aimActive = false;
      touchState.aimX = 0; touchState.aimY = 0;
      joyRightKnob.style.transform = 'translate(0, 0)';
    }
  }

  joyLeft.addEventListener('touchstart', (e) => handleJoyStart('move', e), { passive: false });
  joyLeft.addEventListener('touchmove', (e) => handleJoyMove('move', e), { passive: false });
  joyLeft.addEventListener('touchend', (e) => handleJoyEnd('move', e), { passive: false });

  joyRight.addEventListener('touchstart', (e) => handleJoyStart('aim', e), { passive: false });
  joyRight.addEventListener('touchmove', (e) => handleJoyMove('aim', e), { passive: false });
  joyRight.addEventListener('touchend', (e) => handleJoyEnd('aim', e), { passive: false });

  btnFire.addEventListener('touchstart', (e) => { e.preventDefault(); touchState.firing = true; }, { passive: false });
  btnFire.addEventListener('touchend', (e) => { e.preventDefault(); touchState.firing = false; }, { passive: false });
  btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); tryJump(); }, { passive: false });
  btnNade.addEventListener('touchstart', (e) => { e.preventDefault(); tryThrowGrenade(); }, { passive: false });
}

// ===== GAME STATE =====
let myId = null;
let myPlayer = null;
let world = { width: 4000, height: 4000 };
let allPlayers = {};
let renderPlayers = {};
let bullets = {};
let renderBullets = {};
let grenades = {};
let renderGrenades = {};
let explosions = [];
let particles = [];
let lootItems = {};
let currentZone = '';
let aimAngle = 0;
let lastGrenadeAt = 0;
const GRENADE_COOLDOWN = 3000;
const GRENADE_RADIUS = 150;

let matchState = 'waiting';
let plane = { x: 0, y: 0, vx: 0, vy: 0 };
let zone = { centerX: 2000, centerY: 2000, radius: 1600, nextCenterX: 2000, nextCenterY: 2000, targetRadius: 1600, phase: 0 };
let isOutsideZone = false;

const MOVE_SPEED = 4;
const PLAYER_RADIUS = 20;
const BULLET_RADIUS = 4;
const TILE_SIZE = 64;
const SPRITE_SIZE = 48;
const PLANE_SIZE = 180;

// ===== MOUSE =====
let mouseX = 0, mouseY = 0, shooting = false;
canvas.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
canvas.addEventListener('mousedown', (e) => { if (e.button === 0) shooting = true; });
canvas.addEventListener('mouseup',   (e) => { if (e.button === 0) shooting = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ===== KEYBOARD =====
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') { e.preventDefault(); tryJump(); }
  if (e.key.toLowerCase() === 'g') tryThrowGrenade();
});
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// ===== SOCKET =====
const socket = io('https://karnal-royale.onrender.com');

socket.on('connect', () => statusEl.classList.add('hidden'));
socket.on('disconnect', () => {
  statusEl.textContent = 'Disconnected. Refresh to reconnect.';
  statusEl.classList.remove('hidden');
});

socket.on('init', (data) => {
  myId = data.self.id;
  myPlayer = data.self;
  world = data.world;
  allPlayers = data.players;
  lootItems = {};
  if (data.loot) for (const l of data.loot) lootItems[l.id] = l;
  grenades = {};
  if (data.grenades) for (const g in data.grenades) grenades[g] = data.grenades[g];
  if (data.zone) zone = data.zone;
  if (data.match) {
    matchState = data.match.state || 'waiting';
    if (data.match.plane) plane = data.match.plane;
  }
  for (const id in allPlayers) renderPlayers[id] = { x: allPlayers[id].x, y: allPlayers[id].y };
  updatePlayerCount();
  updateHealthDisplay();
  updateWeaponDisplay();
});

socket.on('playerJoined', (p) => {
  allPlayers[p.id] = p;
  renderPlayers[p.id] = { x: p.x, y: p.y };
  updatePlayerCount();
});

socket.on('playerMoved', (data) => {
  if (allPlayers[data.id]) { allPlayers[data.id].x = data.x; allPlayers[data.id].y = data.y; }
});

socket.on('playerLeft', (id) => {
  delete allPlayers[id];
  delete renderPlayers[id];
  updatePlayerCount();
});

socket.on('bulletSpawned', (b) => { bullets[b.id] = b; renderBullets[b.id] = { x: b.x, y: b.y }; });
socket.on('bulletRemoved', (id) => { delete bullets[id]; delete renderBullets[id]; });

socket.on('grenadeThrown', (g) => { grenades[g.id] = g; renderGrenades[g.id] = { x: g.x, y: g.y }; });
socket.on('grenadeMoved', (data) => { if (grenades[data.id]) { grenades[data.id].x = data.x; grenades[data.id].y = data.y; } });
socket.on('grenadeExploded', (data) => {
  explosions.push({ x: data.x, y: data.y, startedAt: Date.now(), duration: 500 });
  // Spawn particles
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 8;
    particles.push({
      x: data.x, y: data.y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 500 + Math.random() * 400,
      born: Date.now(),
      color: Math.random() > 0.5 ? '#ff9922' : '#ffcc44'
    });
  }
  delete grenades[data.id];
  delete renderGrenades[data.id];
});

socket.on('playerDamaged', (data) => {
  if (allPlayers[data.id]) {
    allPlayers[data.id].health = data.health;
    if (data.id === myId) updateHealthDisplay();
  }
});

socket.on('youDied', (data) => {
  if (myPlayer) myPlayer.alive = false;
  deathScreenEl.classList.remove('hidden');
  deathScreenEl.textContent = data && data.placement ? ('YOU DIED — #' + data.placement) : 'YOU DIED';
  addKillFeedEntry('YOU were killed', '#ff6666');
});

socket.on('youKilled', () => addKillFeedEntry('You got a kill!', '#88ff88'));

socket.on('playerRespawned', (player) => {
  allPlayers[player.id] = player;
  renderPlayers[player.id] = { x: player.x, y: player.y };
  if (player.id === myId) {
    myPlayer = player;
    deathScreenEl.classList.add('hidden');
    updateHealthDisplay();
    updateWeaponDisplay();
  }
});

socket.on('killFeed', (data) => {
  const k = data.killer === myId ? 'YOU' : (data.killer || '').substring(0, 8);
  const v = data.victim === myId ? 'YOU' : (data.victim || '').substring(0, 8);
  const w = data.weapon ? ' [' + data.weapon + ']' : '';
  addKillFeedEntry(k + ' \u2192 ' + v + w, '#ffcc66');
});

socket.on('matchStarted', (data) => {
  matchState = 'flying';
  if (data.players) allPlayers = data.players;
  if (data.loot) { lootItems = {}; for (const l of data.loot) lootItems[l.id] = l; }
  if (data.plane) plane = data.plane;
  if (data.zone) zone = data.zone;
  renderPlayers = {};
  for (const id in allPlayers) renderPlayers[id] = { x: allPlayers[id].x, y: allPlayers[id].y };
  if (myPlayer) {
    myPlayer.state = 'in_plane';
    myPlayer.alive = true;
    myPlayer.health = 100;
    myPlayer.weapon = 'pistol';
  }
  deathScreenEl.classList.add('hidden');
  victoryOverlayEl.style.display = 'none';
  updatePlayerCount();
  updateHealthDisplay();
  updateWeaponDisplay();
});

socket.on('matchStateChanged', (data) => { matchState = data.state; });

socket.on('matchEnded', (data) => {
  matchState = 'ended';
  victoryOverlayEl.style.display = 'flex';
  if (data.winnerId === myId) { victorySubEl.textContent = 'YOU WIN!'; victorySubEl.style.color = '#ffcc33'; }
  else if (data.winnerIsBot) { victorySubEl.textContent = 'A BOT WON'; victorySubEl.style.color = '#ff8888'; }
  else if (data.winnerId) { victorySubEl.textContent = data.winnerId.substring(0, 8) + ' WON'; victorySubEl.style.color = '#ff8888'; }
  else { victorySubEl.textContent = 'NO WINNER'; victorySubEl.style.color = '#aaaaaa'; }
  let stats = '';
  if (myPlayer) stats = 'Your kills: ' + (myPlayer.kills || 0) + '  |  Placement: #' + (myPlayer.placement || '?');
  victoryStatsEl.textContent = stats;
  let seconds = 10;
  victoryTimerEl.textContent = 'Next match in ' + seconds + 's...';
  const iv = setInterval(() => {
    seconds--;
    if (seconds <= 0) { clearInterval(iv); victoryTimerEl.textContent = 'Starting...'; }
    else victoryTimerEl.textContent = 'Next match in ' + seconds + 's...';
  }, 1000);
});

socket.on('planeMoved', (data) => { plane.x = data.x; plane.y = data.y; });

socket.on('playerJumped', (data) => {
  if (allPlayers[data.id]) {
    allPlayers[data.id].state = 'parachuting';
    allPlayers[data.id].x = data.x; allPlayers[data.id].y = data.y;
  }
  if (data.id === myId && myPlayer) {
    myPlayer.state = 'parachuting';
    myPlayer.x = data.x; myPlayer.y = data.y;
  }
});

socket.on('playerLanded', (data) => {
  if (allPlayers[data.id]) {
    allPlayers[data.id].state = 'on_ground';
    allPlayers[data.id].x = data.x; allPlayers[data.id].y = data.y;
  }
  if (data.id === myId && myPlayer) {
    myPlayer.state = 'on_ground';
    myPlayer.x = data.x; myPlayer.y = data.y;
    allPlayers[myId].x = data.x; allPlayers[myId].y = data.y;
    renderPlayers[myId] = { x: data.x, y: data.y };
  }
});

socket.on('zonePhaseChanged', (data) => {
  zone.phase = data.phase;
  zone.targetRadius = data.radius;
  zone.centerX = data.centerX; zone.centerY = data.centerY;
  zone.nextCenterX = data.nextCenterX; zone.nextCenterY = data.nextCenterY;
});

socket.on('lootPickedUp', (data) => {
  delete lootItems[data.id];
  if (data.by === myId && myPlayer) {
    myPlayer.weapon = data.weapon;
    if (data.health !== undefined) { myPlayer.health = data.health; updateHealthDisplay(); }
    updateWeaponDisplay();
  }
  if (allPlayers[data.by]) allPlayers[data.by].weapon = data.weapon;
});

function updatePlayerCount() { playerCountEl.textContent = 'Players: ' + Object.keys(allPlayers).length; }
function updateHealthDisplay() { if (myPlayer) myHealthEl.textContent = 'HP: ' + Math.max(0, Math.round(myPlayer.health)); }
function updateWeaponDisplay() { if (myPlayer) myWeaponEl.textContent = 'Weapon: ' + (myPlayer.weapon || 'pistol'); }
function addKillFeedEntry(text, color) {
  const entry = document.createElement('div');
  entry.textContent = text;
  entry.style.color = color;
  killFeedEl.appendChild(entry);
  setTimeout(() => { if (entry.parentNode) entry.parentNode.removeChild(entry); }, 5000);
}

function tryJump() {
  if (!myPlayer || showIntro) return;
  if (myPlayer.state === 'in_plane') socket.emit('jump');
}

let lastShotAt = 0;
const SHOT_COOLDOWN = 100;
function tryShoot() {
  if (!myPlayer || !myPlayer.alive) return;
  if (myPlayer.state !== 'on_ground') return;
  if (showIntro) return;
  const now = Date.now();
  if (now - lastShotAt < SHOT_COOLDOWN) return;
  lastShotAt = now;
  socket.emit('shoot', { angle: aimAngle });
}

function tryThrowGrenade() {
  if (!myPlayer || !myPlayer.alive) return;
  if (myPlayer.state !== 'on_ground') return;
  if (showIntro) return;
  const now = Date.now();
  if (now - lastGrenadeAt < GRENADE_COOLDOWN) return;
  lastGrenadeAt = now;
  socket.emit('throwGrenade', { angle: aimAngle });
}

// ===== UPDATE =====
function update() {
  if (!myPlayer || showIntro) return;
  if (!isFinite(aimAngle)) aimAngle = 0;

  const camX = myPlayer.x - canvas.width / 2;
  const camY = myPlayer.y - canvas.height / 2;

  if (isMobile) {
    // Mobile aim — right joystick direction
    if (touchState.aimActive) {
      const ax = touchState.aimX, ay = touchState.aimY;
      if (Math.abs(ax) > 0.1 || Math.abs(ay) > 0.1) {
        aimAngle = Math.atan2(ay, ax);
      }
    }
  } else {
    aimAngle = Math.atan2((mouseY + camY) - myPlayer.y, (mouseX + camX) - myPlayer.x);
  }

  if (isMobile ? touchState.firing : shooting) tryShoot();

  if (myPlayer.state === 'on_ground' && myPlayer.alive) {
    let dx = 0, dy = 0;
    if (isMobile) {
      if (touchState.moveActive) { dx = touchState.moveX; dy = touchState.moveY; }
    } else {
      if (keys['w'] || keys['arrowup'])    dy -= 1;
      if (keys['s'] || keys['arrowdown'])  dy += 1;
      if (keys['a'] || keys['arrowleft'])  dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;
    }
    if (dx !== 0 && dy !== 0) {
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 1) { dx /= mag; dy /= mag; }
    }
    if (dx !== 0 || dy !== 0) {
      let nx = myPlayer.x + dx * MOVE_SPEED;
      let ny = myPlayer.y + dy * MOVE_SPEED;
      nx = Math.max(PLAYER_RADIUS, Math.min(world.width - PLAYER_RADIUS, nx));
      ny = Math.max(PLAYER_RADIUS, Math.min(world.height - PLAYER_RADIUS, ny));
      if (!isInsideBuilding(nx, myPlayer.y, PLAYER_RADIUS)) myPlayer.x = nx;
      if (!isInsideBuilding(myPlayer.x, ny, PLAYER_RADIUS)) myPlayer.y = ny;
      allPlayers[myId].x = myPlayer.x; allPlayers[myId].y = myPlayer.y;
      renderPlayers[myId].x = myPlayer.x; renderPlayers[myId].y = myPlayer.y;
      socket.emit('move', { x: myPlayer.x, y: myPlayer.y });
      coordsEl.textContent = 'X: ' + Math.round(myPlayer.x) + ', Y: ' + Math.round(myPlayer.y);
      const zn = getZoneName(myPlayer.x, myPlayer.y);
      if (zn !== currentZone) {
        currentZone = zn;
        if (zn) { zoneNameEl.textContent = zn; zoneNameEl.classList.add('show'); }
        else zoneNameEl.classList.remove('show');
      }
    }
  }

  if (matchState === 'playing' && myPlayer.state === 'on_ground' && myPlayer.alive) {
    const zdx = myPlayer.x - zone.centerX, zdy = myPlayer.y - zone.centerY;
    const zdist = Math.sqrt(zdx * zdx + zdy * zdy);
    const outside = zdist > zone.radius;
    if (outside && !isOutsideZone) { isOutsideZone = true; zoneWarningEl.classList.remove('hidden'); }
    else if (!outside && isOutsideZone) { isOutsideZone = false; zoneWarningEl.classList.add('hidden'); }
  } else {
    if (isOutsideZone) { isOutsideZone = false; zoneWarningEl.classList.add('hidden'); }
  }

  if (myPlayer.state === 'in_plane' && matchState === 'flying' && !showIntro) {
    jumpPromptEl.classList.remove('hidden');
  } else {
    jumpPromptEl.classList.add('hidden');
  }

  for (const id in allPlayers) {
    if (id === myId) continue;
    if (!renderPlayers[id]) renderPlayers[id] = { x: allPlayers[id].x, y: allPlayers[id].y };
    renderPlayers[id].x += (allPlayers[id].x - renderPlayers[id].x) * 0.3;
    renderPlayers[id].y += (allPlayers[id].y - renderPlayers[id].y) * 0.3;
  }
  for (const id in bullets) {
    if (!renderBullets[id]) renderBullets[id] = { x: bullets[id].x, y: bullets[id].y };
    renderBullets[id].x += (bullets[id].x - renderBullets[id].x) * 0.5;
    renderBullets[id].y += (bullets[id].y - renderBullets[id].y) * 0.5;
  }
  for (const id in grenades) {
    if (!renderGrenades[id]) renderGrenades[id] = { x: grenades[id].x, y: grenades[id].y };
    renderGrenades[id].x += (grenades[id].x - renderGrenades[id].x) * 0.4;
    renderGrenades[id].y += (grenades[id].y - renderGrenades[id].y) * 0.4;
  }
  explosions = explosions.filter(ex => Date.now() - ex.startedAt < ex.duration);

  const now = Date.now();
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    if (now - pt.born > pt.life) { particles.splice(i, 1); continue; }
    pt.x += pt.vx; pt.y += pt.vy;
    pt.vx *= 0.95; pt.vy *= 0.95;
  }

  if (allPlayers[myId]) {
    allPlayers[myId].state = myPlayer.state;
    allPlayers[myId].weapon = myPlayer.weapon;
    allPlayers[myId].kills = myPlayer.kills;
  }
}

// ===== RENDER =====
function render() {
  if (!myPlayer || showIntro) return;
  const camX = myPlayer.x - canvas.width / 2;
  const camY = myPlayer.y - canvas.height / 2;

  if (SPRITES.grass) {
    const sX = Math.floor(camX / TILE_SIZE) * TILE_SIZE;
    const sY = Math.floor(camY / TILE_SIZE) * TILE_SIZE;
    const eX = camX + canvas.width + TILE_SIZE;
    const eY = camY + canvas.height + TILE_SIZE;
    for (let ty = sY; ty < eY; ty += TILE_SIZE)
      for (let tx = sX; tx < eX; tx += TILE_SIZE)
        ctx.drawImage(SPRITES.grass, tx - camX, ty - camY, TILE_SIZE, TILE_SIZE);
  } else { ctx.fillStyle = '#2d4a2d'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

  for (const w of WATER_ZONES) {
    if (SPRITES.water) {
      const sX = Math.floor(w.x / TILE_SIZE) * TILE_SIZE;
      const sY = Math.floor(w.y / TILE_SIZE) * TILE_SIZE;
      for (let ty = sY; ty < w.y + w.h; ty += TILE_SIZE)
        for (let tx = sX; tx < w.x + w.w; tx += TILE_SIZE) {
          const dX = tx - camX, dY = ty - camY;
          if (dX > canvas.width || dX + TILE_SIZE < 0 || dY > canvas.height || dY + TILE_SIZE < 0) continue;
          ctx.drawImage(SPRITES.water, dX, dY, TILE_SIZE, TILE_SIZE);
        }
    } else { ctx.fillStyle = '#1a4a7a'; ctx.fillRect(w.x - camX, w.y - camY, w.w, w.h); }
  }

  for (const r of ROADS) {
    if (SPRITES.road) {
      const sX = Math.floor(r.x / TILE_SIZE) * TILE_SIZE;
      const sY = Math.floor(r.y / TILE_SIZE) * TILE_SIZE;
      for (let ty = sY; ty < r.y + r.h; ty += TILE_SIZE)
        for (let tx = sX; tx < r.x + r.w; tx += TILE_SIZE) {
          const dX = tx - camX, dY = ty - camY;
          if (dX > canvas.width || dX + TILE_SIZE < 0 || dY > canvas.height || dY + TILE_SIZE < 0) continue;
          ctx.drawImage(SPRITES.road, dX, dY, TILE_SIZE, TILE_SIZE);
        }
    } else { ctx.fillStyle = '#4a4a4a'; ctx.fillRect(r.x - camX, r.y - camY, r.w, r.h); }
  }

  ctx.font = '20px Arial'; ctx.textAlign = 'center';
  for (const z of ZONES) {
    const lX = z.x + z.w / 2 - camX, lY = z.y + z.h / 2 - camY;
    if (lX < -200 || lX > canvas.width + 200 || lY < -200 || lY > canvas.height + 200) continue;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText(z.name.toUpperCase(), lX, lY);
  }

  for (const b of BUILDINGS) {
    if (b.type === 'tree') {
      const cx = b.x + b.w / 2 - camX, cy = b.y + b.h / 2 - camY;
      const r = Math.max(b.w, b.h) / 2;
      if (cx < -100 || cx > canvas.width + 100 || cy < -100 || cy > canvas.height + 100) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.arc(cx + 4, cy + 4, r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1a5a1a'; ctx.fill();
      ctx.strokeStyle = '#0a3a0a'; ctx.lineWidth = 2; ctx.stroke();
    } else {
      // 2.5D shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(b.x - camX + 8, b.y - camY + 8, b.w, b.h);
      if (SPRITES.building) {
        const sX = Math.floor(b.x / TILE_SIZE) * TILE_SIZE;
        const sY = Math.floor(b.y / TILE_SIZE) * TILE_SIZE;
        for (let ty = sY; ty < b.y + b.h; ty += TILE_SIZE)
          for (let tx = sX; tx < b.x + b.w; tx += TILE_SIZE) {
            const dX = tx - camX, dY = ty - camY;
            if (dX > canvas.width || dX + TILE_SIZE < 0 || dY > canvas.height || dY + TILE_SIZE < 0) continue;
            ctx.drawImage(SPRITES.building, dX, dY, TILE_SIZE, TILE_SIZE);
          }
      } else { ctx.fillStyle = '#8a6a4a'; ctx.fillRect(b.x - camX, b.y - camY, b.w, b.h); }
      // Top highlight (2.5D)
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(b.x - camX, b.y - camY, b.w, 4);
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2;
      ctx.strokeRect(b.x - camX, b.y - camY, b.w, b.h);
    }
  }

  if (typeof PROPS !== 'undefined') {
    for (const p of PROPS) {
      const sx = p.x - camX, sy = p.y - camY;
      if (sx + p.w < 0 || sx > canvas.width || sy + p.h < 0 || sy > canvas.height) continue;

      // Shadow for all props (2.5D)
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(sx + 4, sy + 4, p.w, p.h);

      if (p.type === 'car') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(sx, sy, p.w, p.h);
        ctx.fillStyle = 'rgba(100,150,200,0.6)'; ctx.fillRect(sx + 4, sy + 4, p.w - 8, p.h / 2 - 4);
      } else if (p.type === 'bus') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(sx, sy, p.w, p.h);
        ctx.fillStyle = '#fff';
        for (let wx = sx + 8; wx < sx + p.w - 8; wx += 20) ctx.fillRect(wx, sy + 6, 12, 12);
      } else if (p.type === 'tractor') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath(); ctx.arc(sx + 10, sy + p.h - 4, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + p.w - 10, sy + p.h - 4, 6, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'train') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(sx, sy, p.w, p.h);
        ctx.fillStyle = '#ffcc00';
        for (let wx = sx + 10; wx < sx + p.w - 10; wx += 25) ctx.fillRect(wx, sy + 8, 14, 12);
      } else if (p.type === 'train_track') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        ctx.fillStyle = '#555';
        for (let t = 0; t < p.w; t += 12) ctx.fillRect(sx + t, sy - 2, 4, p.h + 4);
      } else if (p.type === 'flyover') {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(sx + 8, sy + 8, p.w, p.h);
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.strokeRect(sx, sy, p.w, p.h);
      } else if (p.type === 'mural') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        const colors = ['#ff6688','#66aaff','#ffee66','#88dd88','#aa66dd'];
        for (let i = 0; i < 5; i++) { ctx.fillStyle = colors[i]; ctx.fillRect(sx + i * 60, sy, 40, p.h); }
      } else if (p.type === 'awning') { ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h); }
      else if (p.type === 'signboard') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(sx, sy, p.w, p.h);
        ctx.fillStyle = '#333'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(p.text || '', sx + p.w / 2, sy + p.h / 2 + 5);
      } else if (p.type === 'lamppost') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        ctx.fillStyle = '#ffff88';
        ctx.beginPath(); ctx.arc(sx + p.w / 2, sy, 6, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'trashbin') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(sx, sy, p.w, p.h);
      } else if (p.type === 'flowerbed') {
        ctx.fillStyle = '#3a6a3a'; ctx.fillRect(sx, sy, p.w, p.h);
        ctx.fillStyle = p.color;
        for (let fx = sx + 6; fx < sx + p.w - 6; fx += 12) {
          ctx.beginPath(); ctx.arc(fx, sy + p.h / 2, 4, 0, Math.PI * 2); ctx.fill();
        }
      } else if (p.type === 'mall_band' || p.type === 'mall_pillar') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
      } else if (p.type === 'track') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(sx + p.w / 2, sy + p.h / 2, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
        for (let i = 0.2; i < 1; i += 0.2) {
          ctx.beginPath(); ctx.ellipse(sx + p.w / 2, sy + p.h / 2, p.w / 2 * i, p.h / 2 * i, 0, 0, Math.PI * 2); ctx.stroke();
        }
      } else if (p.type === 'field') {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.ellipse(sx + p.w / 2, sy + p.h / 2, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'namaste_hands') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(sx + p.w / 2, sy);
        ctx.lineTo(sx + p.w - 10, sy + p.h * 0.6);
        ctx.lineTo(sx + p.w / 2 + 10, sy + p.h);
        ctx.lineTo(sx + p.w / 2 - 10, sy + p.h);
        ctx.lineTo(sx + 10, sy + p.h * 0.6);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#883311'; ctx.lineWidth = 2; ctx.stroke();
      } else if (p.type === 'namaste_base' || p.type === 'namaste_steps' || p.type === 'barrier' || p.type === 'railing') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        if (p.type === 'barrier') {
          ctx.fillStyle = '#000';
          for (let bx = 0; bx < p.w; bx += 20) ctx.fillRect(sx + bx, sy, 10, p.h);
        }
      } else if (p.type === 'boat') {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.ellipse(sx + p.w / 2, sy + p.h / 2, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.stroke();
      } else if (p.type === 'erickshaw') {
        ctx.fillStyle = p.color; ctx.fillRect(sx, sy, p.w, p.h);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(sx, sy, p.w, p.h);
      }
    }
  }

  // Loot
  for (const id in lootItems) {
    const l = lootItems[id];
    const sx = l.x - camX, sy = l.y - camY;
    if (sx < -30 || sx > canvas.width + 30 || sy < -30 || sy > canvas.height + 30) continue;
    let color = '#ffffff';
    if (l.type === 'pistol')  color = '#cccccc';
    if (l.type === 'rifle')   color = '#44aaff';
    if (l.type === 'shotgun') color = '#ff8844';
    if (l.type === 'sniper')  color = '#aa44ff';
    if (l.type === 'ammo')    color = '#ffcc44';
    if (l.type === 'medkit')  color = '#44ff44';
    // Pulsing glow
    const pulse = 0.6 + Math.sin(Date.now() / 300) * 0.4;
    ctx.fillStyle = 'rgba(' + (color === '#44ff44' ? '68,255,68' : '255,255,255') + ',' + (pulse * 0.3) + ')';
    ctx.beginPath(); ctx.arc(sx, sy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(sx - 10, sy - 10, 20, 20);
    ctx.fillStyle = color; ctx.fillRect(sx - 8, sy - 8, 16, 16);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(sx - 10, sy - 10, 20, 20);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
    ctx.fillText(l.type.toUpperCase(), sx, sy - 14);
  }

  // Zone
  if (matchState === 'playing' || matchState === 'ended') {
    const zx = zone.centerX - camX, zy = zone.centerY - camY;
    ctx.strokeStyle = 'rgba(50, 150, 255, 0.8)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(zx, zy, zone.radius, 0, Math.PI * 2); ctx.stroke();
    if (zone.nextCenterX !== zone.centerX || zone.nextCenterY !== zone.centerY) {
      const nx = zone.nextCenterX - camX, ny = zone.nextCenterY - camY;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.arc(nx, ny, zone.targetRadius, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 6;
  ctx.strokeRect(-camX, -camY, world.width, world.height);

  // Plane
  if (matchState === 'flying') {
    const px = plane.x - camX, py = plane.y - camY;
    if (px > -300 && px < canvas.width + 300 && py > -300 && py < canvas.height + 300) {
      if (SPRITES.plane) {
        ctx.save();
        ctx.translate(px, py);
        const angle = Math.atan2(plane.vy || 0, plane.vx || 0);
        ctx.rotate(angle + Math.PI);
        ctx.drawImage(SPRITES.plane, -PLANE_SIZE / 2, -PLANE_SIZE / 2, PLANE_SIZE, PLANE_SIZE);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(px, py);
        const angle = Math.atan2(plane.vy || 0, plane.vx || 0);
        ctx.rotate(angle);
        ctx.fillStyle = '#dddddd';
        ctx.beginPath();
        ctx.moveTo(-60, 0); ctx.lineTo(-20, -15); ctx.lineTo(60, -10);
        ctx.lineTo(60, 10); ctx.lineTo(-20, 15); ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Players
  for (const id in renderPlayers) {
    const rp = renderPlayers[id];
    const player = allPlayers[id];
    if (!player || !player.alive) continue;
    const sx = rp.x - camX, sy = rp.y - camY;
    if (sx < -100 || sx > canvas.width + 100 || sy < -100 || sy > canvas.height + 100) continue;
    const isMe = id === myId;

    if (player.state === 'parachuting') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(sx, sy - 40, 35, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 35, sy - 40); ctx.lineTo(sx, sy - 5);
      ctx.moveTo(sx + 35, sy - 40); ctx.lineTo(sx, sy - 5);
      ctx.moveTo(sx, sy - 75); ctx.lineTo(sx, sy - 5);
      ctx.stroke();
    }

    if (player.state === 'in_plane') continue;

    // 2.5D shadow under player
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(sx + 3, sy + 18, 18, 8, 0, 0, Math.PI * 2); ctx.fill();

    const sprite = isMe ? SPRITES.playerSelf : SPRITES.playerOther;
    const angle = isMe ? aimAngle : (player.aimAngle || 0);

    if (sprite) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.drawImage(sprite, -SPRITE_SIZE / 2, -SPRITE_SIZE / 2, SPRITE_SIZE, SPRITE_SIZE);
      ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(sx, sy, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = player.color || '#888'; ctx.fill();
      ctx.strokeStyle = isMe ? '#ffffff' : '#000000'; ctx.lineWidth = isMe ? 4 : 2; ctx.stroke();
    }

    const barW = 50, barH = 6;
    const barX = sx - barW / 2, barY = sy - PLAYER_RADIUS - 16;
    const hp = Math.max(0, player.health);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hp > 50 ? '#44ff44' : hp > 25 ? '#ffaa00' : '#ff4444';
    ctx.fillRect(barX, barY, barW * (hp / 100), barH);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = player.isBot ? '#ffaaaa' : '#ffffff';
    ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    const label = isMe ? 'YOU' : (player.isBot ? 'BOT' : id.substring(0, 6));
    ctx.strokeText(label, sx, barY - 5);
    ctx.fillText(label, sx, barY - 5);
  }

  // Bullets
  for (const id in renderBullets) {
    const rb = renderBullets[id];
    const sx = rb.x - camX, sy = rb.y - camY;
    if (sx < -20 || sx > canvas.width + 20 || sy < -20 || sy > canvas.height + 20) continue;
    const b = bullets[id];
    if (b) {
      const tl = 12;
      const len = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
      const nx = b.vx / len, ny = b.vy / len;
      ctx.strokeStyle = 'rgba(255, 220, 100, 0.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx - nx * tl, sy - ny * tl); ctx.lineTo(sx, sy); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(sx, sy, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#ffee44'; ctx.fill();
    ctx.strokeStyle = '#ff9900'; ctx.lineWidth = 1; ctx.stroke();
  }

  // GRENADES
  for (const id in renderGrenades) {
    const rg = renderGrenades[id];
    const sx = rg.x - camX, sy = rg.y - camY;
    if (sx < -30 || sx > canvas.width + 30 || sy < -30 || sy > canvas.height + 30) continue;
    const g = grenades[id];
    const elapsed = g ? (Date.now() - g.thrownAt) : 0;
    const blinkSpeed = 100 + (elapsed / 2000) * 200;
    const blinkOn = Math.floor(Date.now() / blinkSpeed) % 2 === 0;
    ctx.fillStyle = blinkOn ? '#ff2200' : '#333333';
    ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(sx, sy - 6, 3, 0, Math.PI * 2); ctx.fill();
  }

  // GRENADE TRAJECTORY PREVIEW (when G held or grenade recently thrown)
  if (myPlayer.alive && myPlayer.state === 'on_ground' && matchState === 'playing' && !showIntro) {
    const now = Date.now();
    const sinceLast = now - lastGrenadeAt;
    if (sinceLast > GRENADE_COOLDOWN - 800 || keys['g']) {
      const startX = myPlayer.x - camX;
      const startY = myPlayer.y - camY;
      const previewDist = 300;
      const endX = startX + Math.cos(aimAngle) * previewDist;
      const endY = startY + Math.sin(aimAngle) * previewDist;
      // Dotted line
      ctx.strokeStyle = 'rgba(255, 200, 50, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
      // Landing circle preview
      ctx.strokeStyle = 'rgba(255, 100, 50, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(endX, endY, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 100, 50, 0.15)';
      ctx.fill();
      // Radius preview
      ctx.strokeStyle = 'rgba(255, 100, 50, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(endX, endY, GRENADE_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Explosions
  for (const ex of explosions) {
    const sx = ex.x - camX, sy = ex.y - camY;
    if (sx < -300 || sx > canvas.width + 300 || sy < -300 || sy > canvas.height + 300) continue;
    const progress = (Date.now() - ex.startedAt) / ex.duration;
    const radius = 30 + progress * GRENADE_RADIUS;
    ctx.fillStyle = 'rgba(255, 150, 50, ' + (1 - progress) * 0.5 + ')';
    ctx.beginPath(); ctx.arc(sx, sy, radius * 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 220, 80, ' + (1 - progress) * 0.8 + ')';
    ctx.beginPath(); ctx.arc(sx, sy, radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (1 - progress) + ')';
    ctx.beginPath(); ctx.arc(sx, sy, radius * 0.5, 0, Math.PI * 2); ctx.fill();
  }

  // Particles
  for (const pt of particles) {
    const sx = pt.x - camX, sy = pt.y - camY;
    if (sx < -20 || sx > canvas.width + 20 || sy < -20 || sy > canvas.height + 20) continue;
    const lifeRemaining = 1 - (Date.now() - pt.born) / pt.life;
    ctx.fillStyle = pt.color;
    ctx.globalAlpha = lifeRemaining;
    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Crosshair (desktop only)
  if (!isMobile && myPlayer.state === 'on_ground') {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mouseX, mouseY, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mouseX - 16, mouseY); ctx.lineTo(mouseX - 8, mouseY);
    ctx.moveTo(mouseX + 8, mouseY);  ctx.lineTo(mouseX + 16, mouseY);
    ctx.moveTo(mouseX, mouseY - 16); ctx.lineTo(mouseX, mouseY - 8);
    ctx.moveTo(mouseX, mouseY + 8);  ctx.lineTo(mouseX, mouseY + 16);
    ctx.stroke();
  }

  // Outside zone red tint
  if (isOutsideZone) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  renderMinimap();
}

function renderMinimap() {
  const w = minimap.width, h = minimap.height;
  const sx = w / world.width, sy = h / world.height;
  mctx.fillStyle = '#1a3a1a'; mctx.fillRect(0, 0, w, h);
  mctx.fillStyle = '#1a4a7a';
  for (const zw of WATER_ZONES) mctx.fillRect(zw.x * sx, zw.y * sy, zw.w * sx, zw.h * sy);
  mctx.fillStyle = '#555';
  for (const r of ROADS) mctx.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
  mctx.fillStyle = '#8a6a4a';
  for (const b of BUILDINGS) { if (b.type === 'tree') continue; mctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy); }
  if (matchState === 'playing' || matchState === 'ended') {
    mctx.strokeStyle = 'rgba(50, 150, 255, 0.9)'; mctx.lineWidth = 2;
    mctx.beginPath(); mctx.arc(zone.centerX * sx, zone.centerY * sy, zone.radius * sx, 0, Math.PI * 2); mctx.stroke();
  }
  for (const id in allPlayers) {
    const p = allPlayers[id];
    if (!p.alive) continue;
    if (p.state === 'in_plane' || p.state === 'parachuting') continue;
    mctx.fillStyle = id === myId ? '#ffffff' : (p.isBot ? '#ff8888' : '#ff4444');
    mctx.beginPath();
    mctx.arc(p.x * sx, p.y * sy, id === myId ? 4 : 3, 0, Math.PI * 2);
    mctx.fill();
  }
}

function gameLoop() { update(); render(); requestAnimationFrame(gameLoop); }
gameLoop();