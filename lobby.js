// ============================================
// LOBBY — character select + mode buttons
// ============================================

const CHARACTERS = [
  { id: 'manblue',    name: 'MAN BLUE',   folder: 'manblue',    sprite: 'stand.png' },
  { id: 'soldier1',   name: 'SOLDIER',    folder: 'soldier1',   sprite: 'stand.png' },
  { id: 'hitman1',    name: 'HITMAN',     folder: 'Hitman1',    sprite: 'stand.png' },
  { id: 'manbrown',   name: 'MAN BROWN',  folder: 'Manbrown',   sprite: 'stand.png' },
  { id: 'robot1',     name: 'ROBOT',      folder: 'Robot1',     sprite: 'stand.png' },
  { id: 'survivor1',  name: 'SURVIVOR',   folder: 'Survivor1',  sprite: 'stand.png' },
  { id: 'womangreen', name: 'WOMAN GREEN',folder: 'WomanGreen', sprite: 'stand.png' }
];

let selectedChar = CHARACTERS[0];
let selectedMode = 'bots';

function initLobby() {
  buildCharStrip();
  buildModeButtons();
  buildStartButton();
}

function buildCharStrip() {
  const strip = document.getElementById('charStrip');
  strip.innerHTML = '';
  CHARACTERS.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'char-item' + (i === 0 ? ' selected' : '');
    div.dataset.charId = c.id;

    const img = document.createElement('img');
    img.src = `assets/${c.folder}/${c.sprite}`;
    img.alt = c.name;
    img.onerror = () => {
      // Fallback: colored circle with initial
      div.innerHTML = '';
      const fb = document.createElement('div');
      fb.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;background:linear-gradient(135deg,#ff8a3d,#ff4500);color:#fff;`;
      fb.textContent = c.name[0];
      div.appendChild(fb);
    };

    div.appendChild(img);
    div.addEventListener('click', () => selectChar(c, div));
    strip.appendChild(div);
  });
  document.getElementById('charName').textContent = CHARACTERS[0].name;
}

function selectChar(c, el) {
  playSound('click');
  selectedChar = c;
  document.querySelectorAll('.char-item').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('charName').textContent = c.name;
  // Save for game
  localStorage.setItem('kr_char', JSON.stringify(c));
}

function buildModeButtons() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      document.querySelectorAll('.mode-btn').forEach(b => b.style.background = '');
      btn.style.background = 'rgba(255,138,61,0.25)';
      selectedMode = btn.dataset.mode;
      localStorage.setItem('kr_mode', selectedMode);
    });
  });
  // Default highlight
  document.querySelector('.mode-btn[data-mode="bots"]').style.background = 'rgba(255,138,61,0.25)';
}

function buildStartButton() {
  const start = document.getElementById('startBtn');
  const doStart = () => {
    playSound('click');
    const playerName = document.getElementById('playerName').value.trim() || 'PLAYER';
    localStorage.setItem('kr_name', playerName);
    localStorage.setItem('kr_char', JSON.stringify(selectedChar));
    localStorage.setItem('kr_mode', selectedMode);

    document.getElementById('lobbyOverlay').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    // Hand off to game.js (Chunk M2 will define this)
    if (typeof startGame === 'function') {
      startGame({
        playerName,
        character: selectedChar,
        mode: selectedMode
      });
    } else {
      // Placeholder until game.js loads
      const ctx = document.getElementById('gameCanvas').getContext('2d');
      const gc = document.getElementById('gameCanvas');
      gc.width = window.innerWidth; gc.height = window.innerHeight;
      ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, gc.width, gc.height);
      ctx.fillStyle = '#ff8a3d'; ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CHUNK M2 LOADING...', gc.width / 2, gc.height / 2);
      ctx.font = '13px Arial'; ctx.fillStyle = '#888';
      ctx.fillText('Map + collision + swim coming next', gc.width / 2, gc.height / 2 + 30);
    }
  };
  start.addEventListener('click', doStart);
  start.addEventListener('touchstart', (e) => { e.preventDefault(); doStart(); });
}