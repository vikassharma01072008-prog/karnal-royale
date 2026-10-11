// ============================================
// ORIENTATION — force landscape + fullscreen
// ============================================

const rotateOverlay = document.getElementById('rotateOverlay');

function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

function updateOrientation() {
  if (isPortrait()) {
    rotateOverlay.classList.remove('hidden');
  } else {
    rotateOverlay.classList.add('hidden');
  }
  // Resize canvases
  const pc = document.getElementById('particleCanvas');
  if (pc) { pc.width = window.innerWidth; pc.height = window.innerHeight; }
  const gc = document.getElementById('gameCanvas');
  if (gc) { gc.width = window.innerWidth; gc.height = window.innerHeight; }
}

// Request fullscreen + lock orientation on first tap
function requestFullscreenLandscape() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  if (req) {
    req.call(el).then(() => {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    }).catch(() => {});
  } else if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {});
  }
}

// Trigger on first user gesture
window.addEventListener('touchstart', function once() {
  requestFullscreenLandscape();
  window.removeEventListener('touchstart', once);
}, { once: true });
window.addEventListener('click', function once() {
  requestFullscreenLandscape();
  window.removeEventListener('click', once);
}, { once: true });

window.addEventListener('orientationchange', () => setTimeout(updateOrientation, 100));
window.addEventListener('resize', updateOrientation);
updateOrientation();