// ============================================
// WORLD3D.JS — Three.js third-person test
// ============================================

const WORLD = {
  width: 200, depth: 200,
  roadWidth: 12, railOffsetX: 10,
  fogColor: 0x2a3040, bgColor: 0x1a1f2a
};

const PHOTOS = [
  { src: 'assets/zones/police.png',  x: -14, z:  30, w: 8, h: 5.5, label: 'POLICE ACADEMY' },
  { src: 'assets/zones/railway.png', x:  14, z:   0, w: 7, h: 5,   label: 'RAILWAY STATION' },
  { src: 'assets/zones/mall.png',    x: -14, z: -30, w: 8, h: 5.5, label: 'SUPER MALL' }
];

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(WORLD.bgColor);
scene.fog = new THREE.Fog(WORLD.fogColor, 40, 140);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('gameScreen').appendChild(renderer.domElement);

// ---------- Lights ----------
scene.add(new THREE.AmbientLight(0x8899bb, 0.55));

const sun = new THREE.DirectionalLight(0xfff0d0, 0.9);
sun.position.set(-30, 60, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;   sun.shadow.camera.bottom = -80;
sun.shadow.camera.near = 1;   sun.shadow.camera.far = 200;
scene.add(sun);

scene.add(new THREE.HemisphereLight(0xaaccff, 0x222222, 0.35));

// ---------- Textures ----------
const texLoader = new THREE.TextureLoader();
texLoader.crossOrigin = 'anonymous';

function loadTex(path, rx = 1, ry = 1) {
  const t = texLoader.load(path, undefined, undefined, () => console.warn('missing texture:', path));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}

// ---------- Ground ----------
const grassMat = new THREE.MeshStandardMaterial({
  map: loadTex('assets/tile/grass.png', 40, 40),
  roughness: 0.9
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.width, WORLD.depth), grassMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ---------- Road ----------
const roadMat = new THREE.MeshStandardMaterial({
  map: loadTex('assets/tile/road.png', 1, 20),
  roughness: 0.35,
  metalness: 0.15
});
const road = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.roadWidth, WORLD.depth), roadMat);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.01, 0);
road.receiveShadow = true;
scene.add(road);

// ---------- Rail ----------
const railMat = new THREE.MeshStandardMaterial({
  map: loadTex('assets/tile/rail.png', 1, 20),
  roughness: 0.7
});
const railBed = new THREE.Mesh(new THREE.PlaneGeometry(6, WORLD.depth), railMat);
railBed.rotation.x = -Math.PI / 2;
railBed.position.set(WORLD.railOffsetX + 4, 0.015, 0);
railBed.receiveShadow = true;
scene.add(railBed);

// ---------- Billboards ----------
function createBillboard(p) {
  const group = new THREE.Group();

  const tex = texLoader.load(p.src, undefined, undefined, () => console.warn('missing photo:', p.src));
  tex.anisotropy = 4;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(p.w, p.h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, side: THREE.DoubleSide })
  );
  plane.position.y = p.h / 2;
  plane.castShadow = true;
  group.add(plane);

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(p.w + 0.3, p.h + 0.3),
    new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.85 })
  );
  frame.position.set(0, p.h / 2, -0.02);
  group.add(frame);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(p.w * 0.6, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  // Label
  const lc = document.createElement('canvas');
  lc.width = 512; lc.height = 96;
  const lctx = lc.getContext('2d');
  lctx.fillStyle = 'rgba(0,0,0,0.8)';
  lctx.fillRect(0, 0, 512, 96);
  lctx.fillStyle = '#00ffc8';
  lctx.font = 'bold 44px Arial';
  lctx.textAlign = 'center';
  lctx.textBaseline = 'middle';
  lctx.fillText(p.label, 256, 52);
  const labelTex = new THREE.CanvasTexture(lc);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(p.w, p.w * 0.19),
    new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
  );
  label.position.set(0, -0.5, 0);
  group.add(label);

  group.position.set(p.x, 0, p.z);
  scene.add(group);
}
PHOTOS.forEach(createBillboard);

// ---------- Player ----------
const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.5, 1.2, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.6 })
);
body.position.y = 1.1;
body.castShadow = true;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.45, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xffb580 })
);
head.position.y = 2.1;
head.castShadow = true;
player.add(head);

player.position.set(0, 0, 40);
scene.add(player);

// ---------- Camera ----------
const cameraOffset = new THREE.Vector3(0, 4, 7);
let camYaw = 0;

// ---------- Input ----------
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup',   e => keys[e.key.toLowerCase()] = false);

let mouseDown = false, lastMX = 0;
renderer.domElement.addEventListener('mousedown', e => { mouseDown = true; lastMX = e.clientX; });
window.addEventListener('mouseup', () => mouseDown = false);
window.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  camYaw -= (e.clientX - lastMX) * 0.005;
  lastMX = e.clientX;
});

let touchId = null, lastTX = 0;
renderer.domElement.addEventListener('touchstart', e => {
  const t = e.touches[0];
  touchId = t.identifier; lastTX = t.clientX;
}, { passive: true });
renderer.domElement.addEventListener('touchmove', e => {
  for (const t of e.touches) {
    if (t.identifier === touchId) {
      camYaw -= (t.clientX - lastTX) * 0.008;
      lastTX = t.clientX;
    }
  }
}, { passive: true });
renderer.domElement.addEventListener('touchend', () => { touchId = null; });

// ---------- Update ----------
const playerSpeed = 8;
let playerAngle = 0;

function update(dt) {
  let ix = 0, iz = 0;
  if (keys['w'] || keys['arrowup'])    iz -= 1;
  if (keys['s'] || keys['arrowdown'])  iz += 1;
  if (keys['a'] || keys['arrowleft'])  ix -= 1;
  if (keys['d'] || keys['arrowright']) ix += 1;

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

  player.rotation.y += (playerAngle - player.rotation.y) * Math.min(1, dt * 12);

  const cosY = Math.cos(camYaw), sinY = Math.sin(camYaw);
  const offX = cameraOffset.x * cosY - cameraOffset.z * sinY;
  const offZ = cameraOffset.x * sinY + cameraOffset.z * cosY;
  const tx = player.position.x + offX;
  const tz = player.position.z + offZ;
  camera.position.x += (tx - camera.position.x) * Math.min(1, dt * 6);
  camera.position.z += (tz - camera.position.z) * Math.min(1, dt * 6);
  camera.position.y = cameraOffset.y;
  camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z);
}

// ---------- Loop ----------
let last = performance.now();
function loop() {
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

// ---------- Boot ----------
window.addEventListener('load', () => {
  document.getElementById('gameScreen').classList.remove('hidden');
  document.getElementById('lobbyOverlay').classList.add('hidden');
  document.getElementById('introOverlay').classList.add('hidden');
  requestAnimationFrame(loop);
});