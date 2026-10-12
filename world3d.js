// ============================================
// WORLD3D.JS — full 16-photo Karnal 3D world
// ============================================

const WORLD = {
  width: 140,
  depth: 700,
  roadWidth: 16,
  railOffsetX: 14,
  fogColor: 0x2a3040,
  bgColor: 0x1a1f2a
};

const PHOTOS = [
  { src: 'assets/zones/karanpark.png',   x: -18, z:  320, w: 12, h: 8, label: 'KARAN LAKE' },
  { src: 'assets/zones/ndri.png',        x:  18, z:  280, w: 12, h: 8, label: 'NDRI' },
  { src: 'assets/zones/exit.png',        x: -18, z:  230, w: 12, h: 8, label: 'KARNAL EXIT GATE' },
  { src: 'assets/zones/mugla.png',       x:  18, z:  180, w: 12, h: 8, label: 'MUGHAL CANAL' },
  { src: 'assets/zones/mall.png',        x: -18, z:  130, w: 12, h: 8, label: 'SUPER MALL' },
  { src: 'assets/zones/atal.png',        x:  18, z:   80, w: 12, h: 8, label: 'ATAL PARK' },
  { src: 'assets/zones/stadium.png',     x: -18, z:   30, w: 12, h: 8, label: 'KARAN STADIUM' },
  { src: 'assets/zones/railway.png',     x:  18, z:  -20, w: 12, h: 8, label: 'RAILWAY STATION' },
  { src: 'assets/zones/clock.png',       x: -18, z:  -70, w: 12, h: 8, label: 'GHANTA GHAR' },
  { src: 'assets/zones/meeraghati.png',  x:  18, z: -120, w: 12, h: 8, label: 'MEERA GHATI' },
  { src: 'assets/zones/namaste.png',     x: -18, z: -170, w: 12, h: 8, label: 'NAMASTE CHOWK' },
  { src: 'assets/zones/iti.png',         x:  18, z: -220, w: 12, h: 8, label: 'ITI CHOWK' },
  { src: 'assets/zones/alpha.png',       x: -18, z: -270, w: 12, h: 8, label: 'ALPHA CITY' },
  { src: 'assets/zones/bus.png',         x:  18, z: -320, w: 12, h: 8, label: 'OLD BUS STAND' },
  { src: 'assets/zones/haveli.png',      x: -18, z: -370, w: 12, h: 8, label: 'KARNAL HAVELI' },
  { src: 'assets/zones/police.png',      x:  18, z: -420, w: 12, h: 8, label: 'POLICE ACADEMY' }
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(WORLD.bgColor);
scene.fog = new THREE.Fog(WORLD.fogColor, 80, 300);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);

const container = document.getElementById('threeContainer');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x8899bb, 0.55));

const sun = new THREE.DirectionalLight(0xfff0d0, 0.9);
sun.position.set(-50, 90, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -100; sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;   sun.shadow.camera.bottom = -100;
sun.shadow.camera.near = 1;    sun.shadow.camera.far = 400;
scene.add(sun);

scene.add(new THREE.HemisphereLight(0xaaccff, 0x222222, 0.35));

const texLoader = new THREE.TextureLoader();
texLoader.crossOrigin = 'anonymous';

function loadTex(path, rx = 1, ry = 1) {
  const t = texLoader.load(path, undefined, undefined, () => console.warn('missing:', path));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}

// GROUND
const grassMat = new THREE.MeshStandardMaterial({ map: loadTex('assets/tile/grass.png', 30, 150), roughness: 0.95 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.width, WORLD.depth), grassMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ROAD
const roadMat = new THREE.MeshStandardMaterial({ map: loadTex('assets/tile/road.png', 1, 60), roughness: 0.35, metalness: 0.15 });
const road = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.roadWidth, WORLD.depth), roadMat);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.01, 0);
road.receiveShadow = true;
scene.add(road);

// RAIL (parallel right)
const railMat = new THREE.MeshStandardMaterial({ map: loadTex('assets/tile/rail.png', 1, 60), roughness: 0.7 });
const railBed = new THREE.Mesh(new THREE.PlaneGeometry(6, WORLD.depth), railMat);
railBed.rotation.x = -Math.PI / 2;
railBed.position.set(WORLD.railOffsetX + 6, 0.015, 0);
railBed.receiveShadow = true;
scene.add(railBed);

// BILLBOARDS
function createBillboard(p) {
  const group = new THREE.Group();

  const tex = texLoader.load(p.src, undefined, undefined, () => console.warn('missing photo:', p.src));
  tex.anisotropy = 4;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(p.w, p.h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, side: THREE.DoubleSide })
  );
  plane.position.y = p.h / 2 + 0.6;
  plane.castShadow = true;
  group.add(plane);

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(p.w + 0.6, p.h + 0.6),
    new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.9 })
  );
  frame.position.set(0, p.h / 2 + 0.6, -0.02);
  group.add(frame);

  const post = new THREE.Mesh(
    new THREE.BoxGeometry(p.w * 0.9, 1.2, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 1 })
  );
  post.position.y = 0.6;
  group.add(post);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(p.w * 0.65, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  // Label
  const lc = document.createElement('canvas');
  lc.width = 1024; lc.height = 128;
  const lctx = lc.getContext('2d');
  lctx.fillStyle = 'rgba(0,0,0,0.85)';
  lctx.fillRect(0, 0, 1024, 128);
  lctx.strokeStyle = '#00ffc8';
  lctx.lineWidth = 6;
  lctx.strokeRect(4, 4, 1016, 120);
  lctx.fillStyle = '#00ffc8';
  lctx.font = 'bold 64px Arial';
  lctx.textAlign = 'center';
  lctx.textBaseline = 'middle';
  lctx.fillText(p.label, 512, 68);
  const labelTex = new THREE.CanvasTexture(lc);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(p.w, p.w * 0.125),
    new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
  );
  label.position.set(0, 1.2, 0.05);
  group.add(label);

  group.position.set(p.x, 0, p.z);
  scene.add(group);
}
PHOTOS.forEach(createBillboard);

// PLAYER
const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.6, 1.6, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.6 })
);
body.position.y = 1.4;
body.castShadow = true;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.55, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xffb580 })
);
head.position.y = 2.6;
head.castShadow = true;
player.add(head);

player.position.set(0, 0, 380);
scene.add(player);

// CAMERA
const cameraOffset = new THREE.Vector3(0, 6, 11);
let camYaw = 0;

// KEYBOARD
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup',   e => keys[e.key.toLowerCase()] = false);

// MOUSE look
let mouseDown = false, lastMX = 0;
renderer.domElement.addEventListener('mousedown', e => { mouseDown = true; lastMX = e.clientX; });
window.addEventListener('mouseup', () => mouseDown = false);
window.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  camYaw -= (e.clientX - lastMX) * 0.006;
  lastMX = e.clientX;
});

// MOBILE joysticks
const joyBase = document.getElementById('joyBase');
const joyStick = document.getElementById('joyStick');
const lookBase = document.getElementById('lookBase');
const lookStick = document.getElementById('lookStick');

const moveInput = { x: 0, y: 0, active: false, id: null };
const lookInput = { active: false, id: null, lastX: 0 };

function bindJoystick(baseEl, stickEl, input, isLook) {
  if (!baseEl || !stickEl) return;
  const maxR = 55;
  const getRect = () => baseEl.getBoundingClientRect();

  const start = e => {
    const t = e.touches ? e.touches[0] : e;
    const r = getRect();
    input.active = true;
    input.id = t.identifier ?? 'mouse';
    input.baseX = r.left + r.width / 2;
    input.baseY = r.top + r.height / 2;
    if (isLook) input.lastX = t.clientX;
    move(e);
  };
  const move = e => {
    if (!input.active) return;
    let t = e.touches ? Array.from(e.touches).find(tt => tt.identifier === input.id) : e;
    if (!t) return;
    if (isLook) {
      const dx = t.clientX - input.lastX;
      camYaw -= dx * 0.01;
      input.lastX = t.clientX;
      return;
    }
    const dx = t.clientX - input.baseX;
    const dy = t.clientY - input.baseY;
    const dist = Math.min(Math.hypot(dx, dy), maxR);
    const ang = Math.atan2(dy, dx);
    const sx = Math.cos(ang) * dist;
    const sy = Math.sin(ang) * dist;
    stickEl.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`;
    input.x = sx / maxR;
    input.y = sy / maxR;
  };
  const end = () => {
    input.active = false;
    if (!isLook) {
      input.x = 0; input.y = 0;
      stickEl.style.transform = 'translate(-50%, -50%)';
    }
  };
  baseEl.addEventListener('touchstart', e => { e.preventDefault(); start(e); }, { passive: false });
  baseEl.addEventListener('touchmove',  e => { e.preventDefault(); move(e); },  { passive: false });
  baseEl.addEventListener('touchend', end);
  baseEl.addEventListener('touchcancel', end);
  baseEl.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
}
bindJoystick(joyBase, joyStick, moveInput, false);
bindJoystick(lookBase, lookStick, lookInput, true);

// UPDATE
const playerSpeed = 10;
let playerAngle = 0;

function update(dt) {
  let ix = 0, iz = 0;
  if (keys['w'] || keys['arrowup'])    iz -= 1;
  if (keys['s'] || keys['arrowdown'])  iz += 1;
  if (keys['a'] || keys['arrowleft'])  ix -= 1;
  if (keys['d'] || keys['arrowright']) ix += 1;
  if (moveInput.x || moveInput.y) { ix = moveInput.x; iz = moveInput.y; }

  const mag = Math.hypot(ix, iz);
  if (mag > 0.1) {
    const cosY = Math.cos(camYaw), sinY = Math.sin(camYaw);
    const wx = ix * cosY - iz * sinY;
    const wz = ix * sinY + iz * cosY;
    const nx = wx / mag, nz = wz / mag;
    player.position.x += nx * playerSpeed * dt;
    player.position.z += nz * playerSpeed * dt;
    playerAngle = Math.atan2(nx, nz);
  }

  player.position.x = Math.max(-WORLD.width/2 + 6, Math.min(WORLD.width/2 - 6, player.position.x));
  player.position.z = Math.max(-WORLD.depth/2 + 6, Math.min(WORLD.depth/2 - 6, player.position.z));

  player.rotation.y += (playerAngle - player.rotation.y) * Math.min(1, dt * 12);

  const cosY = Math.cos(camYaw), sinY = Math.sin(camYaw);
  const offX = cameraOffset.x * cosY - cameraOffset.z * sinY;
  const offZ = cameraOffset.x * sinY + cameraOffset.z * cosY;
  const tx = player.position.x + offX;
  const tz = player.position.z + offZ;
  camera.position.x += (tx - camera.position.x) * Math.min(1, dt * 6);
  camera.position.z += (tz - camera.position.z) * Math.min(1, dt * 6);
  camera.position.y = cameraOffset.y;
  camera.lookAt(player.position.x, player.position.y + 1.6, player.position.z);
}

// LOOP
let last = performance.now();
let running = false;
function loop() {
  if (!running) return;
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// BOOT
function boot3D() {
  document.getElementById('gameScreen').classList.remove('hidden');
  document.getElementById('lobbyOverlay').classList.add('hidden');
  document.getElementById('introOverlay').classList.add('hidden');
  last = performance.now();
  running = true;
  requestAnimationFrame(loop);
}

window.boot3D = boot3D;