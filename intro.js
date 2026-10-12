// ============================================
// INTRO.JS — Particle intro + sound system
// Calls initLobby() when done
// ============================================

// ---------- SOUND SYSTEM ----------
const SOUND_BASE = 'assets/sound/';
const SOUND_EXTS = ['mp3', 'wav', 'ogg'];
const soundCache = {};

function loadSound(name) {
  if (soundCache[name] !== undefined) return soundCache[name];
  let i = 0;
  const tryNext = () => {
    if (i >= SOUND_EXTS.length) { soundCache[name] = null; return; }
    const audio = new Audio(SOUND_BASE + name + '.' + SOUND_EXTS[i]);
    audio.volume = 0.5;
    audio.preload = 'auto';
    audio.addEventListener('canplaythrough', () => { soundCache[name] = audio; }, { once: true });
    audio.addEventListener('error', () => { i++; tryNext(); }, { once: true });
    audio.load();
  };
  tryNext();
}

function playSound(name, loop) {
  const s = soundCache[name];
  if (!s) return null;
  try {
    const clone = loop ? s.cloneNode() : s;
    clone.loop = !!loop;
    clone.currentTime = 0;
    clone.play().catch(() => {});
    return clone;
  } catch (e) { return null; }
}

// Preload
['plane','click','jump','loot','victory','death','walking','swim'].forEach(loadSound);

// ---------- PARTICLE SYSTEM ----------
const pc = document.getElementById('particleCanvas');
const pctx = pc ? pc.getContext('2d') : null;
let particles = [];
let particleRaf = null;

function resizeParticles() {
  if (!pc) return;
  pc.width = window.innerWidth;
  pc.height = window.innerHeight;
}

class Particle {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.vx = (opts.vx ?? (Math.random() - 0.5)) * 6;
    this.vy = (opts.vy ?? (Math.random() - 0.5)) * 6;
    this.life = opts.life ?? 1.0;
    this.decay = opts.decay ?? 0.012 + Math.random() * 0.02;
    this.size = opts.size ?? 1.5 + Math.random() * 3;
    this.color = opts.color ?? `hsl(${20 + Math.random() * 20}, 100%, ${50 + Math.random() * 30}%)`;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.97; this.vy *= 0.97;
    this.life -= this.decay;
  }
  draw() {
    pctx.globalAlpha = Math.max(0, this.life);
    pctx.fillStyle = this.color;
    pctx.shadowColor = this.color;
    pctx.shadowBlur = 12;
    pctx.beginPath();
    pctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    pctx.fill();
  }
}

function burstParticles(cx, cy, count, opts = {}) {
  for (let i = 0; i < count; i++) particles.push(new Particle(cx, cy, opts));
}

function particleLoop() {
  if (!pctx) return;
  pctx.clearRect(0, 0, pc.width, pc.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
  pctx.globalAlpha = 1;
  pctx.shadowBlur = 0;
  particleRaf = requestAnimationFrame(particleLoop);
}

function startParticles() { resizeParticles(); particleLoop(); }
function stopParticles() {
  if (particleRaf) cancelAnimationFrame(particleRaf);
  particles = [];
  if (pctx) pctx.clearRect(0, 0, pc.width, pc.height);
}

window.addEventListener('resize', resizeParticles);

// ---------- INTRO SEQUENCE ----------
const introOverlay = document.getElementById('introOverlay');
const phase1 = document.getElementById('phase1');
const phase2 = document.getElementById('phase2');
const phase3 = document.getElementById('phase3');
const skipBtn = document.getElementById('skipIntro');
const planeImg = document.getElementById('planeImg');

let introTimers = [];
let introInterval = null;
let introEnded = false;

function clearIntroTimers() {
  introTimers.forEach(t => clearTimeout(t));
  introTimers = [];
  if (introInterval) { clearInterval(introInterval); introInterval = null; }
}

function scheduleIntro(fn, delay) {
  const t = setTimeout(fn, delay);
  introTimers.push(t);
  return t;
}

function skipIntro() {
  if (introEnded) return;
  introEnded = true;
  clearIntroTimers();
  playSound('click');
  endIntro();
}

function endIntro() {
  stopParticles();
  if (introOverlay) {
    introOverlay.style.transition = 'opacity 0.5s';
    introOverlay.style.opacity = '0';
  }
  setTimeout(() => {
    if (introOverlay) introOverlay.classList.add('hidden');
    const lobby = document.getElementById('lobbyOverlay');
    if (lobby) lobby.classList.remove('hidden');
    if (typeof window.initLobby === 'function') window.initLobby();
  }, 500);
}

function startIntro() {
  startParticles();
  const cx = pc.width / 2, cy = pc.height / 2;

  // PHASE 1: Logo burst (0 - 1.6s)
  playSound('plane');
  burstParticles(cx, cy, 160, { life: 1.4, decay: 0.008, size: 1 + Math.random() * 3 });
  scheduleIntro(() => burstParticles(cx, cy, 80, { life: 1.6, decay: 0.006 }), 400);
  scheduleIntro(() => burstParticles(cx, cy, 60, { life: 1.8, decay: 0.005 }), 800);

  // PHASE 2: Plane flyby (1.6 - 4.4s)
  scheduleIntro(() => {
    phase1.classList.add('hidden');
    phase2.classList.remove('hidden');
  }, 1600);

  scheduleIntro(() => {
    introInterval = setInterval(() => {
      if (introEnded) return;
      const rect = planeImg.getBoundingClientRect();
      if (rect.width > 0) {
        burstParticles(rect.left + 40, rect.top + rect.height / 2, 4, {
          vx: -2 - Math.random() * 3,
          vy: (Math.random() - 0.5) * 2,
          life: 0.9, decay: 0.02, size: 1 + Math.random() * 2
        });
      }
    }, 40);
  }, 1700);

  // PHASE 3: Vaan (4.4 - 6s)
  scheduleIntro(() => {
    phase2.classList.add('hidden');
    phase3.classList.remove('hidden');
    burstParticles(pc.width / 2, pc.height / 2, 100, { life: 1.2, decay: 0.012 });
  }, 4400);

  // END
  scheduleIntro(() => endIntro(), 6000);
}

if (skipBtn) {
  skipBtn.addEventListener('click', skipIntro);
  skipBtn.addEventListener('touchstart', (e) => { e.preventDefault(); skipIntro(); }, { passive: false });
}

window.addEventListener('load', () => {
  setTimeout(startIntro, 200);
});

// Export
window.playSound = playSound;