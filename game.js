// ============================================
// GAME.JS — Main engine for Karnal Royale
// Top-down 3D camera + player + bullets + bots + HUD
// ============================================

// --------------------------------------------
// GLOBALS
// --------------------------------------------
let renderer, scene, camera;
let clock;
let running = false;
let container;
let worldGroup;

const state = {
  player: null,
  bots: [],
  bullets: [],
  bloodParticles: [],
  kills: 0,
  alive: 6, // player + 5 bots in v1
  currentZone: null,
  lastZoneId: null,
  gameOver: false
};

// Character sprite prefix map
const CHAR_PREFIX = {
  'Hitman1':    'hitman1',
  'manblue':    'manBlue',
  'Manbrown':   'manbrown',
  'Robot1':     'robot1',
  'soldier1':   'soldier1',
  'Survivor1':  'survivor1',
  'WomanGreen': 'womanGreen'
};

// Sprite texture cache
const spriteCache = {};

// Controls state
const controls = {
  move:  { active: false, id: null, baseX: 0, baseY: 0, dx: 0, dy: 0 },
  aim:   { active: false, id: null, baseX: 0, baseY: 0, dx: 0, dy: 0, firing: false },
  keys:  {},
  jumpPressed: false,
  reloadPressed: false
};

// --------------------------------------------
// SPRITE LOADER
// --------------------------------------------
function loadSpriteTexture(path) {
  if (spriteCache[path] !== undefined) return spriteCache[path];
  const tex = new THREE.TextureLoader().load(
    path,
    undefined,
    undefined,
    () => { console.warn('missing sprite:', path); }
  );
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearFilter;
  spriteCache[path] = tex;
  return tex;
}

// --------------------------------------------
// BOOT — called by lobby
// --------------------------------------------
function boot3D(config) {
  container = document.getElementById('threeContainer');
  document.getElementById('gameScreen').classList.remove('hidden');
  document.getElementById('lobbyOverlay').classList.add('hidden');
  document.getElementById('introOverlay').classList.add('hidden');
  document.getElementById('endOverlay').classList.add('hidden');

  // --- Renderer ---
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // --- Scene ---
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101418);
  scene.fog = new THREE.Fog(0x101418, 1200, 2200);

  // --- Camera (top-down tilted 45°) ---
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 6000);

  // --- Lights ---
  scene.add(new THREE.AmbientLight(0xa8b8d8, 0.65));
  const hemi = new THREE.HemisphereLight(0xbdd4ff, 0x2a221a, 0.45);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 0.9);
  sun.position.set(400, 800, 300);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -600; sc.right = 600; sc.top = 600; sc.bottom = -600;
  sc.near = 1; sc.far = 2400;
  scene.add(sun);
  scene.add(sun.target);

  // --- World ---
  worldGroup = new THREE.Group();
  scene.add(worldGroup);

  buildGround();
  buildRoads();
  buildWater();
  buildBuildings();
  buildTrees();

  // --- Player ---
  state.player = createPlayer(config, window.MAP.getSpawnPoint());
  worldGroup.add(state.player.mesh);
  worldGroup.add(state.player.shadow);

  // --- Bots (5 in v1) ---
  state.bots = window.BOT.spawnBots(5, { x: state.player.x, y: state.player.y }, window.MAP);
  for (const b of state.bots) {
    buildBotMesh(b);
    worldGroup.add(b.mesh);
    worldGroup.add(b.shadow);
  }
  updateAliveHUD();

  // --- Clock ---
  clock = new THREE.Clock();

  // --- Controls ---
  setupControls();

  // --- Resize ---
  window.addEventListener('resize', onResize);

  // --- Background music loop (walking sound low) ---
  // (skipping: walking.mp3 is used as event, not loop)

  running = true;
  state.gameOver = false;
  requestAnimationFrame(loop);
}

// --------------------------------------------
// GROUND — big plane with grass texture
// --------------------------------------------
function buildGround() {
  const grassTex = window.MAP.imageCache['tile_grass'];
  let mat;
  if (grassTex) {
    const t = grassTex.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(80, 80);
    t.anisotropy = 4;
    mat = new THREE.MeshStandardMaterial({ map: t, roughness: 1 });
  } else {
    mat = new THREE.MeshStandardMaterial({ color: 0x2e3d26, roughness: 1 });
  }
  const geo = new THREE.PlaneGeometry(window.MAP.WORLD_W, window.MAP.WORLD_H);
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(window.MAP.WORLD_W/2, 0, window.MAP.WORLD_H/2);
  ground.receiveShadow = true;
  worldGroup.add(ground);
}

// --------------------------------------------
// ROADS
// --------------------------------------------
function buildRoads() {
  const roadTex = window.MAP.imageCache['tile_road'];
  for (const r of window.MAP.ROADS) {
    let mat;
    if (roadTex) {
      const t = roadTex.clone();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(Math.max(1, r.w / 200), Math.max(1, r.d / 200));
      mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
    } else {
      mat = new THREE.MeshStandardMaterial({ color: r.color || 0x2a2a2a });
    }
    const geo = new THREE.PlaneGeometry(r.w, r.d);
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(r.x, 0.02, r.y);
    m.receiveShadow = true;
    worldGroup.add(m);
  }
}

// --------------------------------------------
// WATER — cyan planes
// --------------------------------------------
function buildWater() {
  for (const z of window.MAP.ZONES) {
    if (!z.water) continue;
    const geo = new THREE.CircleGeometry(z.r, 40);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2b6ea8,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
      metalness: 0.3
    });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(z.x, 0.05, z.y);
    worldGroup.add(m);
  }
}

// --------------------------------------------
// BUILDINGS — box + zone photo billboard on top
// --------------------------------------------
function buildBuildings() {
  for (const b of window.MAP.BUILDINGS) {
    const group = new THREE.Group();
    group.position.set(b.x, 0, b.y);
    group.rotation.y = b.rot || 0;

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: b.color || 0x555555, roughness: 0.85 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), bodyMat);
    body.position.y = b.h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Roof line
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w + 4, 4, b.d + 4), roofMat);
    roof.position.y = b.h + 2;
    group.add(roof);

    // Zone photo — as a large billboard standing on top of the building
    const photo = window.MAP.imageCache['photo_' + b.id];
    if (photo) {
      const tex = new THREE.CanvasTexture(makeLabeledPhotoCanvas(photo, b.id));
      tex.magFilter = THREE.LinearFilter;
      const photoMat = new THREE.MeshBasicMaterial({ map: tex, transparent: false });
      const pw = Math.min(b.w * 1.1, 220);
      const ph = pw * 0.62;
      const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), photoMat);
      photoMesh.position.set(0, b.h + 40 + ph / 2, 0);
      // Billboard always faces camera — we update in loop
      photoMesh.userData.isBillboard = true;
      group.add(photoMesh);
    }

    // Name label under photo
    const labelTex = new THREE.CanvasTexture(makeLabelCanvas(b.id));
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(180, 34), labelMat);
    labelMesh.position.set(0, b.h + 30, 0);
    labelMesh.userData.isBillboard = true;
    group.add(labelMesh);

    worldGroup.add(group);
  }
}

// Draw a canvas with the zone photo + name label
function makeLabeledPhotoCanvas(img, id) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const ctx = c.getContext('2d');
  // background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, 512, 320);
  // image
  try { ctx.drawImage(img, 0, 0, 512, 288); } catch(e) {}
  // bottom bar
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 288, 512, 32);
  ctx.strokeStyle = '#00ffc8';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 512, 320);
  return c;
}

// Draw only the name text (transparent bg)
function makeLabelCanvas(id) {
  const zone = window.MAP.ZONES.find(z => z.id === id);
  const name = zone ? zone.name : id.toUpperCase();
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = '#00ffc8';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 92);
  ctx.fillStyle = '#00ffc8';
  ctx.font = 'bold 54px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 256, 50);
  return c;
}

// --------------------------------------------
// TREES — scattered across map for cover
// --------------------------------------------
function buildTrees() {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 1 });
  const leafMat  = new THREE.MeshStandardMaterial({ color: 0x2e6a2e, roughness: 1 });

  const treeZones = window.MAP.ZONES.filter(z => !z.water);
  for (let i = 0; i < 70; i++) {
    const z = treeZones[i % treeZones.length];
    const x = z.x + (Math.random() - 0.5) * 700;
    const y = z.y + (Math.random() - 0.5) * 700;
    if (x < 60 || x > window.MAP.WORLD_W - 60) continue;
    if (y < 60 || y > window.MAP.WORLD_H - 60) continue;

    const g = new THREE.Group();
    g.position.set(x, 0, y);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 30, 6), trunkMat);
    trunk.position.y = 15;
    trunk.castShadow = true;
    g.add(trunk);

    const leaves = new THREE.Mesh(new THREE.SphereGeometry(22, 8, 6), leafMat);
    leaves.position.y = 42;
    leaves.castShadow = true;
    g.add(leaves);

    worldGroup.add(g);
  }
}

// --------------------------------------------
// PLAYER
// --------------------------------------------
function createPlayer(config, spawn) {
  const prefix = CHAR_PREFIX[config.character.folder] || 'manBlue';
  const folder = config.character.folder;

  const mat = new THREE.SpriteMaterial({
    map: loadSpriteTexture('assets/' + folder + '/' + prefix + '_stand.png'),
    transparent: true,
    depthTest: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(90, 90, 1);
  sprite.center.set(0.5, 0.5);

  const mesh = new THREE.Group();
  mesh.add(sprite);
  mesh.position.set(spawn.x, 50, spawn.y);

  // Shadow blob
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(26, 20), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(spawn.x, 0.6, spawn.y);

  return {
    x: spawn.x, y: spawn.y,
    angle: 0,
    hp: 100, maxHp: 100,
    radius: 22,
    speed: 320,
    mesh, shadow, sprite,
    charFolder: folder,
    prefix,
    ammo: 30, maxAmmo: 30,
    reloadTimer: 0,
    reloadDuration: 1.8,
    shootCooldown: 0,
    fireRate: 0.12,
    walkFrame: 0,
    hitFlash: 0,
    config
  };
}

// --------------------------------------------
// BOT MESH
// --------------------------------------------
function buildBotMesh(bot) {
  const mat = new THREE.SpriteMaterial({
    map: loadSpriteTexture('assets/' + bot.charFolder + '/' + bot.prefix + '_stand.png'),
    transparent: true,
    depthTest: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(90, 90, 1);
  const mesh = new THREE.Group();
  mesh.add(sprite);
  mesh.position.set(bot.x, 50, bot.y);
  bot.mesh = mesh;
  bot.sprite = sprite;

  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(26, 20), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(bot.x, 0.6, bot.y);
  bot.shadow = shadow;
}

// --------------------------------------------
// CONTROLS
// --------------------------------------------
function setupControls() {
  bindJoystick(document.getElementById('joyBase'), document.getElementById('joyStick'), controls.move, false);
  bindJoystick(document.getElementById('aimBase'), document.getElementById('aimStick'), controls.aim,  true);

  // buttons
  const btnJump = document.getElementById('btnJump');
  if (btnJump) {
    btnJump.addEventListener('touchstart', e => { e.preventDefault(); controls.jumpPressed = true; }, { passive: false });
    btnJump.addEventListener('mousedown', () => controls.jumpPressed = true);
  }
  const btnReload = document.getElementById('btnReload');
  if (btnReload) {
    btnReload.addEventListener('touchstart', e => { e.preventDefault(); controls.reloadPressed = true; }, { passive: false });
    btnReload.addEventListener('mousedown', () => controls.reloadPressed = true);
  }

  // keyboard
  window.addEventListener('keydown', e => {
    controls.keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') controls.jumpPressed = true;
    if (e.key.toLowerCase() === 'r') controls.reloadPressed = true;
  });
  window.addEventListener('keyup', e => { controls.keys[e.key.toLowerCase()] = false; });
}

function bindJoystick(baseEl, stickEl, ref, isAim) {
  if (!baseEl || !stickEl) return;
  const maxR = 55;
  const rect = () => baseEl.getBoundingClientRect();

  const start = e => {
    const t = e.touches ? e.touches[0] : e;
    const r = rect();
    ref.active = true;
    ref.id = t.identifier ?? 'mouse';
    ref.baseX = r.left + r.width / 2;
    ref.baseY = r.top + r.height / 2;
    if (isAim) ref.firing = true;
    move(e);
  };
  const move = e => {
    if (!ref.active) return;
    let t = e.touches ? Array.from(e.touches).find(tt => tt.identifier === ref.id) : e;
    if (!t) return;
    const dx = t.clientX - ref.baseX;
    const dy = t.clientY - ref.baseY;
    const dist = Math.min(Math.hypot(dx, dy), maxR);
    const ang = Math.atan2(dy, dx);
    const sx = Math.cos(ang) * dist, sy = Math.sin(ang) * dist;
    stickEl.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`;
    ref.dx = sx / maxR;
    ref.dy = sy / maxR;
  };
  const end = () => {
    ref.active = false;
    ref.dx = 0; ref.dy = 0;
    if (isAim) ref.firing = false;
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

// --------------------------------------------
// BULLETS
// --------------------------------------------
function spawnBullet(x, y, angle, owner, ownerId, damage) {
  const speed = 1400;
  const geo = new THREE.SphereGeometry(4, 6, 6);
  const mat = new THREE.MeshBasicMaterial({ color: owner === 'player' ? 0xffdd44 : 0xff4433 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, 50, y);
  worldGroup.add(mesh);

  state.bullets.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1.2,
    owner, ownerId, damage,
    mesh
  });
}

function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    b.mesh.position.set(b.x, 50, b.y);

    let hit = false;

    // vs bots
    if (b.owner === 'player') {
      for (const bot of state.bots) {
        if (!bot.alive) continue;
        if (Math.hypot(bot.x - b.x, bot.y - b.y) < bot.radius + 6) {
          bot.takeDamage(b.damage, 'player');
          spawnBlood(b.x, b.y);
          hit = true;
          break;
        }
      }
    } else {
      // bot bullet vs player
      const p = state.player;
      if (p.hp > 0 && Math.hypot(p.x - b.x, p.y - b.y) < p.radius + 6) {
        damagePlayer(b.damage);
        spawnBlood(b.x, b.y);
        hit = true;
      }
    }

    if (hit || b.life <= 0) {
      worldGroup.remove(b.mesh);
      b.mesh.geometry.dispose();
      b.mesh.material.dispose();
      state.bullets.splice(i, 1);
    }
  }
}

// --------------------------------------------
// BLOOD PARTICLES
// --------------------------------------------
function spawnBlood(x, y) {
  for (let i = 0; i < 8; i++) {
    const geo = new THREE.SphereGeometry(3, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, 50, y);
    worldGroup.add(m);
    const a = Math.random() * Math.PI * 2;
    const sp = 200 + Math.random() * 200;
    state.bloodParticles.push({
      mesh: m,
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.5
    });
  }
}

function updateBlood(dt) {
  for (let i = state.bloodParticles.length - 1; i >= 0; i--) {
    const p = state.bloodParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= dt;
    p.mesh.position.set(p.x, 50, p.y);
    p.mesh.material.opacity = Math.max(0, p.life * 2);
    p.mesh.material.transparent = true;
    if (p.life <= 0) {
      worldGroup.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      state.bloodParticles.splice(i, 1);
    }
  }
}

// --------------------------------------------
// DAMAGE
// --------------------------------------------
function damagePlayer(amount) {
  if (state.gameOver) return;
  state.player.hp -= amount;
  state.player.hitFlash = 0.15;
  updateHPBar();
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    endGame(false);
  }
}

function updateHPBar() {
  const hp = Math.max(0, state.player ? state.player.hp : 100);
  const bar = document.getElementById('hpBar');
  const txt = document.getElementById('hpText');
  if (bar) {
    bar.style.width = hp + '%';
    bar.classList.remove('low','mid');
    if (hp < 30) bar.classList.add('low');
    else if (hp < 60) bar.classList.add('mid');
  }
  if (txt) txt.textContent = Math.round(hp);
}

// --------------------------------------------
// EVENTS FROM BOTS
// --------------------------------------------
function onBotKilled(bot, fromId) {
  // remove mesh
  if (bot.mesh) worldGroup.remove(bot.mesh);
  if (bot.shadow) worldGroup.remove(bot.shadow);
  state.alive--;
  if (fromId === 'player') {
    state.kills++;
    addKillFeed('YOU ☠ ' + bot.name);
  } else {
    addKillFeed(bot.name + ' ☠');
  }
  updateAliveHUD();
  updateKillsHUD();
  spawnBlood(bot.x, bot.y);
  if (state.alive <= 1 && !state.gameOver) endGame(true);
}

function updateAliveHUD() {
  const el = document.getElementById('aliveCount');
  if (el) el.textContent = state.alive;
}
function updateKillsHUD() {
  const el = document.getElementById('killCount');
  if (el) el.textContent = state.kills;
}
function addKillFeed(text) {
  const feed = document.getElementById('killFeed');
  if (!feed) return;
  const div = document.createElement('div');
  div.className = 'kill-item';
  div.textContent = text;
  feed.appendChild(div);
  setTimeout(() => div.classList.add('fade'), 2500);
  setTimeout(() => div.remove(), 3200);
}

// --------------------------------------------
// PLAYER UPDATE
// --------------------------------------------
function updatePlayer(dt) {
  const p = state.player;
  if (p.hp <= 0) return;

  // reload
  if (p.reloadTimer > 0) {
    p.reloadTimer -= dt;
    if (p.reloadTimer <= 0) {
      p.ammo = p.maxAmmo;
      updateAmmoHUD();
    }
  }
  if (controls.reloadPressed && p.ammo < p.maxAmmo && p.reloadTimer <= 0) {
    p.reloadTimer = p.reloadDuration;
  }
  controls.reloadPressed = false;

  // move
  let ix = 0, iy = 0;
  if (controls.keys['w'] || controls.keys['arrowup'])    iy -= 1;
  if (controls.keys['s'] || controls.keys['arrowdown'])  iy += 1;
  if (controls.keys['a'] || controls.keys['arrowleft'])  ix -= 1;
  if (controls.keys['d'] || controls.keys['arrowright']) ix += 1;
  if (controls.move.dx || controls.move.dy) { ix = controls.move.dx; iy = controls.move.dy; }
  const mag = Math.hypot(ix, iy);
  if (mag > 1) { ix /= mag; iy /= mag; }

  const zone = window.MAP.getZoneAt(p.x, p.y);
  state.currentZone = zone;
  let speed = p.speed;
  if (zone && zone.water) speed = 130;

  p.x += ix * speed * dt;
  p.y += iy * speed * dt;
  p.x = Math.max(p.radius, Math.min(window.MAP.WORLD_W - p.radius, p.x));
  p.y = Math.max(p.radius, Math.min(window.MAP.WORLD_H - p.radius, p.y));

  // walk anim
  if (mag > 0.1) p.walkFrame += dt * 8;
  if (mag > 0.1 && !p._lastWalkSound) {
    p._lastWalkSound = performance.now();
  }

  // aim (right joystick)
  if (controls.aim.active && (controls.aim.dx || controls.aim.dy)) {
    p.angle = Math.atan2(controls.aim.dy, controls.aim.dx);
  } else if (mag > 0.1) {
    p.angle = Math.atan2(iy, ix);
  }

  // shoot
  if (p.shootCooldown > 0) p.shootCooldown -= dt;
  if ((controls.aim.firing || controls.keys[' ']) && p.shootCooldown <= 0 && p.ammo > 0 && p.reloadTimer <= 0) {
    const bx = p.x + Math.cos(p.angle) * 40;
    const by = p.y + Math.sin(p.angle) * 40;
    const spread = (Math.random() - 0.5) * 0.06;
    spawnBullet(bx, by, p.angle + spread, 'player', 'player', 18);
    p.ammo--;
    p.shootCooldown = p.fireRate;
    updateAmmoHUD();
    if (p.ammo === 0) p.reloadTimer = p.reloadDuration;
  }

  // hit flash
  if (p.hitFlash > 0) p.hitFlash -= dt;

  // Update mesh
  p.mesh.position.set(p.x, 50, p.y);
  p.shadow.position.set(p.x, 0.6, p.y);

  // sprite
  const spriteName = getPlayerSpriteName(p);
  const newTex = loadSpriteTexture('assets/' + p.charFolder + '/' + spriteName);
  if (p.sprite.material.map !== newTex) {
    p.sprite.material.map = newTex;
    p.sprite.material.needsUpdate = true;
  }
}

function getPlayerSpriteName(p) {
  const pre = p.prefix;
  if (p.reloadTimer > 0) return pre + '_reload.png';
  if (controls.aim.active && (controls.aim.dx || controls.aim.dy)) return pre + '_machine.png';
  if (controls.aim.firing || controls.keys[' ']) return pre + '_machine.png';
  // walking?
  const ix = controls.move.dx || (controls.keys['d'] ? 1 : (controls.keys['a'] ? -1 : 0));
  const iy = controls.move.dy || (controls.keys['s'] ? 1 : (controls.keys['w'] ? -1 : 0));
  if (Math.hypot(ix, iy) > 0.1) return pre + '_hold.png';
  return pre + '_stand.png';
}

function updateAmmoHUD() {
  const el = document.getElementById('ammoCount');
  if (el) el.textContent = state.player.ammo;
}

// --------------------------------------------
// ZONE POPUP
// --------------------------------------------
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
  el._t = setTimeout(() => el.classList.remove('show'), 2000);
}

// --------------------------------------------
// HUD ZONE NAME
// --------------------------------------------
function updateZoneHUD() {
  const el = document.getElementById('zoneName');
  if (!el) return;
  const z = state.currentZone;
  if (z && z.id !== state.lastZoneId) {
    state.lastZoneId = z.id;
    showZonePopup(z.name);
  }
  el.textContent = z ? z.name : 'KARNAL';
}

// --------------------------------------------
// CAMERA — top-down tilted
// --------------------------------------------
function updateCamera(dt) {
  const p = state.player;
  const camHeight = 260;
  const camDist   = 260;
  const tx = p.x;
  const tz = p.y + camDist;
  camera.position.x += (tx - camera.position.x) * Math.min(1, dt * 7);
  camera.position.y  = camHeight;
  camera.position.z += (tz - camera.position.z) * Math.min(1, dt * 7);
  camera.lookAt(p.x, 20, p.y);

  // sun follow player (shadow coverage)
  const sun = scene.children.find(o => o.isDirectionalLight && o.castShadow);
  if (sun) {
    sun.position.set(p.x + 400, 800, p.y + 300);
    sun.target.position.set(p.x, 0, p.y);
    sun.target.updateMatrixWorld();
  }
}

// --------------------------------------------
// BILLBOARDS face camera
// --------------------------------------------
function updateBillboards() {
  worldGroup.traverse(o => {
    if (o.userData && o.userData.isBillboard) {
      o.lookAt(camera.position.x, o.position.y, camera.position.z);
    }
  });
}

// --------------------------------------------
// END GAME
// --------------------------------------------
function endGame(win) {
  if (state.gameOver) return;
  state.gameOver = true;
  running = false;
  const ov = document.getElementById('endOverlay');
  const t  = document.getElementById('endTitle');
  const s  = document.getElementById('endSub');
  if (ov) ov.classList.remove('hidden');
  if (t) {
    t.textContent = win ? 'VICTORY' : 'DEFEATED';
    t.classList.toggle('dead', !win);
  }
  if (s) s.textContent = win
    ? 'Winner winner chicken dinner · ' + state.kills + ' kills'
    : 'You were eliminated · ' + state.kills + ' kills';
}

// --------------------------------------------
// MAIN LOOP
// --------------------------------------------
function loop() {
  if (!running) return;
  const dt = Math.min(clock.getDelta(), 0.05);

  if (!state.gameOver) {
    updatePlayer(dt);
    for (const b of state.bots) b.update(dt, state.player, window.MAP);
    updateBullets(dt);
    updateBlood(dt);
    updateBillboards();
    updateZoneHUD();
  }
  updateCamera(dt);

  // sync bot meshes
  for (const b of state.bots) {
    if (!b.mesh || !b.alive) continue;
    b.mesh.position.set(b.x, 50, b.y);
    b.shadow.position.set(b.x, 0.6, b.y);
    const sp = loadSpriteTexture(b.getSprite());
    if (b.sprite.material.map !== sp) {
      b.sprite.material.map = sp;
      b.sprite.material.needsUpdate = true;
    }
  }

  // minimap
  if (window.MINIMAP) window.MINIMAP.drawMinimap(state.player, state.bots, state.currentZone);

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function onResize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --------------------------------------------
// END BUTTON → back to lobby
// --------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('endBtn');
  if (btn) {
    btn.addEventListener('click', () => location.reload());
  }
});

// --------------------------------------------
// EXPORT
// --------------------------------------------
window.GAME = {
  boot3D,
  spawnBullet,
  onBotKilled
};
window.boot3D = boot3D;