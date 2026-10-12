// ============================================
// LOBBY.JS — character select, mode select, start
// Passes config to boot3D()
// ============================================

const CHARACTERS = [
  { id: 'manblue',    name: 'MAN BLUE',    folder: 'manblue',    prefix: 'manBlue',    sprite: 'manBlue_stand.png' },
  { id: 'soldier1',   name: 'SOLDIER',     folder: 'soldier1',   prefix: 'soldier1',   sprite: 'soldier1_stand.png' },
  { id: 'hitman1',    name: 'HITMAN',      folder: 'Hitman1',    prefix: 'hitman1',    sprite: 'hitman1_stand.png' },
  { id: 'manbrown',   name: 'MAN BROWN',   folder: 'Manbrown',   prefix: 'manbrown',   sprite: 'manbrown_stand.png' },
  { id: 'robot1',     name: 'ROBOT',       folder: 'Robot1',     prefix: 'robot1',     sprite: 'robot1_stand.png' },
  { id: 'survivor1',  name: 'SURVIVOR',    folder: 'Survivor1',  prefix: 'survivor1',  sprite: 'survivor1_stand.png' },
  { id: 'womangreen', name: 'WOMAN GREEN', folder: 'WomanGreen', prefix: 'womanGreen', sprite: 'womanGreen_stand.png' }
];

let selectedChar = CHARACTERS[0];
let selectedMode = 'bots';

// --------------------------------------------
function initLobby() {
  buildCharStrip();
  buildModeButtons();
  buildStartButton();
}

// --------------------------------------------
function buildCharStrip() {
  const strip = document.getElementById('charStrip');
  if (!strip) return;
  strip.innerHTML = '';

  CHARACTERS.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'char-item' + (i === 0 ? ' selected' : '');

    const img = document.createElement('img');
    img.src = 'assets/' + c.folder + '/' + c.sprite;
    img.alt = c.name;
    img.onerror = () => {
      div.innerHTML = '';
      const fb = document.createElement('div');
      fb.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;background:linear-gradient(135deg,#ff8a3d,#ff4500);color:#fff;';
      fb.textContent = c.name[0];
      div.appendChild(fb);
    };
    div.appendChild(img);
    div.addEventListener('click', () => selectChar(c, div));
    strip.appendChild(div);
  });

  const cn = document.getElementById('charName');
  if (cn) cn.textContent = CHARACTERS[0].name;
}

function selectChar(c, el) {
  selectedChar = c;
  document.querySelectorAll('.char-item').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
  const cn = document.getElementById('charName');
  if (cn) cn.textContent = c.name;
}

// --------------------------------------------
function buildModeButtons() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.style.background = '');
      btn.style.background = 'rgba(255,138,61,0.25)';
      selectedMode = btn.dataset.mode;
    });
  });
  const def = document.querySelector('.mode-btn[data-mode="bots"]');
  if (def) def.style.background = 'rgba(255,138,61,0.25)';
}

// --------------------------------------------
function buildStartButton() {
  const start = document.getElementById('startBtn');
  if (!start) return;

  const doStart = () => {
    const playerName = (document.getElementById('playerName')?.value || 'PLAYER').trim() || 'PLAYER';

    document.getElementById('lobbyOverlay').classList.add('hidden');

    if (typeof window.boot3D === 'function') {
      window.boot3D({
        playerName,
        character: selectedChar,
        mode: selectedMode
      });
    } else {
      console.error('boot3D not found — check script order');
    }
  };

  start.addEventListener('click', doStart);
  start.addEventListener('touchstart', (e) => { e.preventDefault(); doStart(); }, { passive: false });
}

// --------------------------------------------
window.initLobby = initLobby;
window.CHARACTERS = CHARACTERS;