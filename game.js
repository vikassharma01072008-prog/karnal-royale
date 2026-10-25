// ============================================
// GAME.JS v13 — SWIM & ZONE COLLISION
// ============================================

let renderer, scene, camera;
let clock, running = false;
let container, worldGroup;

const state = {
  player: null, bots: [], bullets: [], bloodParticles: [],
  kills: 0, alive: 1, gameOver: false
};

const spriteCache = {};

const controls = {
  move: { active: false, id: null, baseX: 0, baseY: 0, dx: 0, dy: 0 },
  aim:  { active: false, id: null, baseX: 0, baseY: 0, dx: 0, dy: 0, firing: false },
  keys: {}, jumpPressed: false, reloadPressed: false
};

function loadSpriteTexture(path) {
  if (spriteCache[path] !== undefined) return spriteCache[path];
  const tex = new THREE.TextureLoader().load(path, undefined, undefined, () => {});
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearFilter;
  spriteCache[path] = tex;
  return tex;
}

async function boot3D(config) {
  container = document.getElementById('threeContainer');
  document.getElementById('gameScreen').classList.remove('hidden');
  document.getElementById('lobbyOverlay').classList.add('hidden');
  document.getElementById('introOverlay').classList.add('hidden');
  document.getElementById('endOverlay').classList.add('hidden');

  showLoading(0);
  await window.MAP.preloadMapAssets(p => showLoading(p));
  hideLoading();

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87a9c9);
  scene.fog = new THREE.Fog(0x87a9c9, 1200, 3500);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 1, 8000);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x3a2f22, 0.5));
  const sun = new THREE.DirectionalLight(0xfff2d8, 0.85);
  sun.position.set(400, 1200, 300);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.name = 'sun';
  scene.add(sun);
  scene.add(sun.target);

  worldGroup = new THREE.Group();
  scene.add(worldGroup);

  buildMap();
  buildZones();

  state.player = createPlayer(config, { x: 2000, y: 2000 });
  worldGroup.add(state.player.mesh);
  worldGroup.add(state.player.shadow);

  if (config.mode !== 'explore') {
    state.bots = window.BOT.spawnBots(5, { x: state.player.x, y: state.player.y }, window.MAP);
    for (const b of state.bots) {
      buildBotMesh(b);
      worldGroup.add(b.mesh);
      worldGroup.add(b.shadow);
    }
    state.alive = state.bots.length + 1;
  } else {
    state.alive = 1;
  }
  
  updateAliveHUD();

  clock = new THREE.Clock();
  setupControls();
  window.addEventListener('resize', onResize);

  running = true;
  state.gameOver = false;
  requestAnimationFrame(loop);
}

function buildMap() {
  const grassImg = window.MAP.imageCache['tile_grass'];
  if (grassImg) {
    const tex = new THREE.Texture(grassImg); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(60, 60); tex.needsUpdate = true;
    const geo = new THREE.PlaneGeometry(window.MAP.WORLD_W, window.MAP.WORLD_H);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(window.MAP.WORLD_W/2, 0, window.MAP.WORLD_H/2);
    worldGroup.add(mesh);
  }

  const placePiece = (imgKey, config, yOffset) => {
    const img = window.MAP.imageCache[imgKey];
    if (!img) return;
    const tex = new THREE.Texture(img); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.needsUpdate = true;
    if (config.w > config.h) tex.repeat.set(config.w / 200, 1);
    else tex.repeat.set(1, config.h / 200);

    const geo = new THREE.PlaneGeometry(config.w, config.h);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(config.x, yOffset, config.y);
    worldGroup.add(mesh);
  };

  window.MAP.ROADS.forEach(r => {
    if (r.w > r.h) placePiece('tile_horizontal', r, 0.1);
    else placePiece('tile_vertical', r, 0.1);
  });

  window.MAP.RAILS.forEach(r => placePiece('tile_rail', r, 0.15)); 
}

function buildZones() {
  for (const z of window.MAP.ZONES) {
    const img = window.MAP.imageCache['zone_' + z.id];
    if (!img) continue;
    
    const tex = new THREE.Texture(img); 
    tex.encoding = THREE.sRGBEncoding; 
    tex.needsUpdate = true; 
    tex.anisotropy = 8;
    
    const geo = new THREE.PlaneGeometry(z.size, z.size);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(z.x, 0.2, z.y); 
    worldGroup.add(mesh);

    // Name Tag
    const nameCanvas = document.createElement('canvas'); nameCanvas.width = 512; nameCanvas.height = 128;
    const nctx = nameCanvas.getContext('2d');
    nctx.fillStyle = 'rgba(0,0,0,0.85)'; nctx.fillRect(0, 0, 512, 128);
    nctx.strokeStyle = '#00ffc8'; nctx.lineWidth = 6; nctx.strokeRect(4, 4, 504, 120);
    nctx.fillStyle = '#00ffc8'; nctx.font = 'bold 50px Arial'; nctx.textAlign = 'center'; nctx.textBaseline = 'middle';
    nctx.fillText(z.name, 256, 64);
    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameMesh = new THREE.Mesh(new THREE.PlaneGeometry(150, 37), new THREE.MeshBasicMaterial({ map: nameTex, transparent: true, depthTest: false }));
    nameMesh.rotation.x = -Math.PI / 2; nameMesh.position.set(z.x, 60, z.y); nameMesh.renderOrder = 10;
    worldGroup.add(nameMesh);
  }
}

function showLoading(progress) {
  let el = document.getElementById('karnalLoading');
  if (!el) {
    el = document.createElement('div'); el.id = 'karnalLoading';
    el.style.cssText = 'position:fixed;inset:0;background:#0a0a0f;z-index:9000;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#ff8a3d;font-family:Arial;';
    el.innerHTML = '<div style="font-size:32px;letter-spacing:6px;margin-bottom:20px;text-shadow:0 0 20px #ff4500;">KARNAL ROYALE</div><div style="width:60%;max-width:400px;height:8px;background:#222;border-radius:4px;overflow:hidden;"><div id="karnalLoadBar" style="height:100%;width:0%;background:linear-gradient(90deg,#ff8a3d,#ff4500);transition:width 0.2s;"></div></div><div id="karnalLoadPct" style="margin-top:12px;font-size:14px;letter-spacing:3px;color:#888;">LOADING 0%</div>';
    document.body.appendChild(el);
  }
  const pct = Math.round(progress * 100);
  const bar = document.getElementById('karnalLoadBar'); const txt = document.getElementById('karnalLoadPct');
  if (bar) bar.style.width = pct + '%'; if (txt) txt.textContent = 'LOADING ' + pct + '%';
}
function hideLoading() { const el = document.getElementById('karnalLoading'); if (el) el.remove(); }

function createPlayer(config, spawn) {
  const prefix = window.BOT.CHAR_PREFIX[config.character.folder] || 'manBlue';
  const folder = config.character.folder;
  const mat = new THREE.SpriteMaterial({ map: loadSpriteTexture('assets/' + folder + '/' + prefix + '_stand.png'), transparent: true });
  const sprite = new THREE.Sprite(mat); sprite.scale.set(35, 35, 1); sprite.renderOrder = 999;
  const mesh = new THREE.Group(); mesh.add(sprite); mesh.position.set(spawn.x, 20, spawn.y);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(12, 20), shadowMat);
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(spawn.x, 0.3, spawn.y);
  return { x: spawn.x, y: spawn.y, angle: 0, hp: 100, maxHp: 100, radius: 12, speed: 280, mesh, shadow, sprite, charFolder: folder, prefix, ammo: 30, maxAmmo: 30, reloadTimer: 0, reloadDuration: 1.8, shootCooldown: 0, fireRate: 0.12, walkFrame: 0, inWater: false, config };
}

function buildBotMesh(bot) {
  const mat = new THREE.SpriteMaterial({ map: loadSpriteTexture('assets/' + bot.charFolder + '/' + bot.prefix + '_stand.png'), transparent: true });
  const sprite = new THREE.Sprite(mat); sprite.scale.set(35, 35, 1); sprite.renderOrder = 999;
  const mesh = new THREE.Group(); mesh.add(sprite); mesh.position.set(bot.x, 20, bot.y);
  bot.mesh = mesh; bot.sprite = sprite;
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(12, 20), shadowMat);
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(bot.x, 0.3, bot.y);
  bot.shadow = shadow;
}

function setupControls() {
  bindJoystick(document.getElementById('joyBase'), document.getElementById('joyStick'), controls.move, false);
  bindJoystick(document.getElementById('aimBase'), document.getElementById('aimStick'), controls.aim, true);
  const btnJump = document.getElementById('btnJump'); if (btnJump) { btnJump.addEventListener('touchstart', e => { e.preventDefault(); controls.jumpPressed = true; }, { passive: false }); btnJump.addEventListener('mousedown', () => controls.jumpPressed = true); }
  const btnReload = document.getElementById('btnReload'); if (btnReload) { btnReload.addEventListener('touchstart', e => { e.preventDefault(); controls.reloadPressed = true; }, { passive: false }); btnReload.addEventListener('mousedown', () => controls.reloadPressed = true); }
  window.addEventListener('keydown', e => { controls.keys[e.key.toLowerCase()] = true; if (e.key === ' ') controls.jumpPressed = true; if (e.key.toLowerCase() === 'r') controls.reloadPressed = true; });
  window.addEventListener('keyup', e => { controls.keys[e.key.toLowerCase()] = false; });
}

function bindJoystick(baseEl, stickEl, ref, isAim) {
  if (!baseEl || !stickEl) return;
  const maxR = 55; const rect = () => baseEl.getBoundingClientRect();
  const start = e => { const t = e.touches ? e.touches[0] : e; const r = rect(); ref.active = true; ref.id = t.identifier ?? 'mouse'; ref.baseX = r.left + r.width/2; ref.baseY = r.top + r.height/2; if (isAim) ref.firing = true; move(e); };
  const move = e => { if (!ref.active) return; let t = e.touches ? Array.from(e.touches).find(tt => tt.identifier === ref.id) : e; if (!t) return; const dx = t.clientX - ref.baseX; const dy = t.clientY - ref.baseY; const dist = Math.min(Math.hypot(dx, dy), maxR); const ang = Math.atan2(dy, dx); const sx = Math.cos(ang) * dist, sy = Math.sin(ang) * dist; stickEl.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`; ref.dx = sx / maxR; ref.dy = sy / maxR; };
  const end = () => { ref.active = false; ref.dx = 0; ref.dy = 0; if (isAim) ref.firing = false; stickEl.style.transform = 'translate(-50%, -50%)'; };
  baseEl.addEventListener('touchstart', e => { e.preventDefault(); start(e); }, { passive: false }); baseEl.addEventListener('touchmove', e => { e.preventDefault(); move(e); }, { passive: false }); baseEl.addEventListener('touchend', end); baseEl.addEventListener('touchcancel', end); baseEl.addEventListener('mousedown', start); window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
}

function spawnBullet(x, y, angle, owner, ownerId, damage) {
  const speed = 1600; const geo = new THREE.SphereGeometry(3, 6, 6);
  const mat = new THREE.MeshBasicMaterial({ color: owner === 'player' ? 0xffdd44 : 0xff4433 });
  const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, 20, y); worldGroup.add(mesh);
  state.bullets.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.2, owner, ownerId, damage, mesh });
}

function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.mesh.position.set(b.x, 20, b.y);
    let hit = false;
    if (b.owner === 'player') { for (const bot of state.bots) { if (!bot.alive) continue; if (Math.hypot(bot.x - b.x, bot.y - b.y) < bot.radius + 6) { bot.takeDamage(b.damage, 'player'); spawnBlood(b.x, b.y); hit = true; break; } } }
    else { const p = state.player; if (p.hp > 0 && Math.hypot(p.x - b.x, p.y - b.y) < p.radius + 6) { damagePlayer(b.damage); spawnBlood(b.x, b.y); hit = true; } }
    if (hit || b.life <= 0) { worldGroup.remove(b.mesh); b.mesh.geometry.dispose(); b.mesh.material.dispose(); state.bullets.splice(i, 1); }
  }
}

function spawnBlood(x, y) {
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.SphereGeometry(2, 4, 4); const mat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const m = new THREE.Mesh(geo, mat); m.position.set(x, 20, y); worldGroup.add(m);
    const a = Math.random() * Math.PI * 2; const sp = 200 + Math.random() * 200;
    state.bloodParticles.push({ mesh: m, x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 0.5 });
  }
}

function updateBlood(dt) {
  for (let i = state.bloodParticles.length - 1; i >= 0; i--) {
    const p = state.bloodParticles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; p.mesh.position.set(p.x, 20, p.y);
    p.mesh.material.opacity = Math.max(0, p.life * 2); p.mesh.material.transparent = true;
    if (p.life <= 0) { worldGroup.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); state.bloodParticles.splice(i, 1); }
  }
}

function damagePlayer(amount) { if (state.gameOver) return; state.player.hp -= amount; updateHPBar(); if (state.player.hp <= 0) { state.player.hp = 0; endGame(false); } }
function updateHPBar() { const hp = Math.max(0, state.player ? state.player.hp : 100); const bar = document.getElementById('hpBar'); const txt = document.getElementById('hpText'); if (bar) { bar.style.width = hp + '%'; bar.classList.remove('low','mid'); if (hp < 30) bar.classList.add('low'); else if (hp < 60) bar.classList.add('mid'); } if (txt) txt.textContent = Math.round(hp); }
function onBotKilled(bot, fromId) { if (bot.mesh) worldGroup.remove(bot.mesh); if (bot.shadow) worldGroup.remove(bot.shadow); state.alive--; if (fromId === 'player') { state.kills++; addKillFeed('YOU ☠ ' + bot.name); } else addKillFeed(bot.name + ' ☠'); updateAliveHUD(); updateKillsHUD(); spawnBlood(bot.x, bot.y); if (state.alive <= 1 && !state.gameOver && state.bots.length > 0) endGame(true); }
function updateAliveHUD() { const el = document.getElementById('aliveCount'); if (el) el.textContent = state.alive; }
function updateKillsHUD() { const el = document.getElementById('killCount'); if (el) el.textContent = state.kills; }
function addKillFeed(text) { const feed = document.getElementById('killFeed'); if (!feed) return; const div = document.createElement('div'); div.className = 'kill-item'; div.textContent = text; feed.appendChild(div); setTimeout(() => div.classList.add('fade'), 2500); setTimeout(() => div.remove(), 3200); }
function updateAmmoHUD() { const el = document.getElementById('ammoCount'); if (el) el.textContent = state.player.ammo; }

function updatePlayer(dt) {
  const p = state.player; if (p.hp <= 0) return;
  if (p.reloadTimer > 0) { p.reloadTimer -= dt; if (p.reloadTimer <= 0) { p.ammo = p.maxAmmo; updateAmmoHUD(); } }
  if (controls.reloadPressed && p.ammo < p.maxAmmo && p.reloadTimer <= 0) p.reloadTimer = p.reloadDuration; controls.reloadPressed = false;
  let ix = 0, iy = 0;
  if (controls.keys['w'] || controls.keys['arrowup']) iy -= 1; if (controls.keys['s'] || controls.keys['arrowdown']) iy += 1; if (controls.keys['a'] || controls.keys['arrowleft']) ix -= 1; if (controls.keys['d'] || controls.keys['arrowright']) ix += 1;
  if (controls.move.dx || controls.move.dy) { ix = controls.move.dx; iy = controls.move.dy; }
  const mag = Math.hypot(ix, iy); if (mag > 1) { ix /= mag; iy /= mag; }

  // SWIM LOGIC
  p.inWater = window.MAP.isInWater(p.x, p.y);
  let currentSpeed = p.speed;
  if (p.inWater) currentSpeed = p.speed * 0.45; // 55% slower in water
  
  p.x += ix * currentSpeed * dt; 
  p.y += iy * currentSpeed * dt;
  
  window.MAP.resolveCollisions(p, null);

  p.x = Math.max(p.radius, Math.min(window.MAP.WORLD_W - p.radius, p.x)); p.y = Math.max(p.radius, Math.min(window.MAP.WORLD_H - p.radius, p.y));
  if (mag > 0.1) p.walkFrame += dt * 8;
  if (controls.aim.active && (controls.aim.dx || controls.aim.dy)) p.angle = Math.atan2(controls.aim.dy, controls.aim.dx); else if (mag > 0.1) p.angle = Math.atan2(iy, ix);
  if (p.shootCooldown > 0) p.shootCooldown -= dt;
  if ((controls.aim.firing || controls.keys[' ']) && p.shootCooldown <= 0 && p.ammo > 0 && p.reloadTimer <= 0) {
    const bx = p.x + Math.cos(p.angle) * 30; const by = p.y + Math.sin(p.angle) * 30; const spread = (Math.random() - 0.5) * 0.06;
    spawnBullet(bx, by, p.angle + spread, 'player', 'player', 18); p.ammo--; p.shootCooldown = p.fireRate; updateAmmoHUD(); if (p.ammo === 0) p.reloadTimer = p.reloadDuration;
  }
  p.mesh.position.set(p.x, 20, p.y); p.shadow.position.set(p.x, 0.3, p.y);
  
  const spriteName = getPlayerSpriteName(p); const newTex = loadSpriteTexture('assets/' + p.charFolder + '/' + spriteName);
  if (p.sprite.material.map !== newTex) { p.sprite.material.map = newTex; p.sprite.material.needsUpdate = true; }
}

function getPlayerSpriteName(p) {
  const pre = p.prefix; 
  
  // If swimming, ideally we'd have a swim sprite. 
  // For now, we force the walk/hold sprite if moving in water.
  if (p.inWater) {
    if (Math.hypot(controls.move.dx || 0, controls.move.dy || 0) > 0.1 || controls.keys['w'] || controls.keys['a'] || controls.keys['s'] || controls.keys['d']) {
      return pre + '_hold.png';
    }
  }

  if (p.reloadTimer > 0) return pre + '_reload.png'; 
  if (controls.aim.active && (controls.aim.dx || controls.aim.dy)) return pre + '_machine.png'; 
  if (controls.aim.firing || controls.keys[' ']) return pre + '_machine.png';
  const ix = controls.move.dx || (controls.keys['d'] ? 1 : (controls.keys['a'] ? -1 : 0)); 
  const iy = controls.move.dy || (controls.keys['s'] ? 1 : (controls.keys['w'] ? -1 : 0));
  if (Math.hypot(ix, iy) > 0.1) return pre + '_hold.png'; 
  return pre + '_stand.png';
}

function updateCamera(dt) {
  const p = state.player; 
  const camHeight = 150; const camDist = 120; 
  const tx = p.x, tz = p.y + camDist;
  camera.position.x += (tx - camera.position.x) * Math.min(1, dt * 10); camera.position.y = camHeight; camera.position.z += (tz - camera.position.z) * Math.min(1, dt * 10); camera.lookAt(p.x, 20, p.y);
  const sun = scene.getObjectByName('sun'); if (sun) { sun.position.set(p.x + 500, 1200, p.y + 400); sun.target.position.set(p.x, 0, p.y); sun.target.updateMatrixWorld(); }
}

function endGame(win) {
  if (state.gameOver) return; state.gameOver = true; running = false;
  const ov = document.getElementById('endOverlay'); const t = document.getElementById('endTitle'); const s = document.getElementById('endSub');
  if (ov) ov.classList.remove('hidden'); if (t) { t.textContent = win ? 'VICTORY' : 'DEFEATED'; t.classList.toggle('dead', !win); }
  if (s) s.textContent = win ? 'Winner winner chicken dinner · ' + state.kills + ' kills' : 'You were eliminated · ' + state.kills + ' kills';
}

function loop() {
  if (!running) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!state.gameOver) {
    updatePlayer(dt);
    for (const b of state.bots) { b.update(dt, state.player, window.MAP); }
    updateBullets(dt); updateBlood(dt);
  }
  updateCamera(dt);
  for (const b of state.bots) {
    if (!b.mesh || !b.alive) continue;
    b.mesh.position.set(b.x, 20, b.y); b.shadow.position.set(b.x, 0.3, b.y);
    const sp = loadSpriteTexture(b.getSprite()); if (b.sprite.material.map !== sp) { b.sprite.material.map = sp; b.sprite.material.needsUpdate = true; }
  }
  renderer.render(scene, camera); requestAnimationFrame(loop);
}

function onResize() { if (!renderer || !camera) return; camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }
document.addEventListener('DOMContentLoaded', () => { const btn = document.getElementById('endBtn'); if (btn) btn.addEventListener('click', () => location.reload()); });
window.GAME = { boot3D, spawnBullet, onBotKilled }; window.boot3D = boot3D;
