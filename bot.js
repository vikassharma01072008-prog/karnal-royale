// ============================================
// BOT.JS v6 — no zones, random positions on tilemap
// ============================================

const BOT_CHARS = ['soldier1', 'Hitman1', 'manblue', 'Manbrown', 'Robot1', 'Survivor1', 'WomanGreen'];

const CHAR_PREFIX = {
  'Hitman1':    'hitman1',
  'manblue':    'manBlue',
  'Manbrown':   'manbrown',
  'Robot1':     'robot1',
  'soldier1':   'soldier1',
  'Survivor1':  'survivor1',
  'WomanGreen': 'womanGreen'
};

const NO_MACHINE = ['Manbrown'];

class Bot {
  constructor(id, spawnX, spawnY) {
    this.id = id;
    this.x = spawnX; this.y = spawnY;
    this.hp = 100; this.maxHp = 100;
    this.alive = true; this.radius = 20; this.angle = 0;
    this.speed = 130 + Math.random() * 50;
    this.state = 'patrol';
    this.targetX = spawnX; this.targetY = spawnY;
    this.nextThink = 0;
    this.shootCooldown = 0;
    this.shootRange = 520;
    this.detectRange = 700;
    this.reloadTimer = 0;
    this.ammo = 30; this.maxAmmo = 30;
    this.reloadDuration = 2.2;
    this.hitFlash = 0; this.walkFrame = 0;

    const folder = BOT_CHARS[id % BOT_CHARS.length];
    this.charFolder = folder;
    this.prefix = CHAR_PREFIX[folder];
    this.name = 'BOT_' + (id + 1);
    this.hasMachine = !NO_MACHINE.includes(folder);
  }

  update(dt, player, world) {
    if (!this.alive) return;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    if (this.reloadTimer > 0) { this.reloadTimer -= dt; this.state = 'reload'; return; }
    if (this.ammo <= 0) { this.reloadTimer = this.reloadDuration; this.ammo = this.maxAmmo; return; }

    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    this.nextThink -= dt;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.hypot(dx, dy);

    // DECIDE STATE
    if (player.hp > 0 && distToPlayer < this.detectRange) {
      this.state = 'chase';
      if (distToPlayer < this.shootRange * 0.85) this.state = 'shoot';
    } else {
      if (this.nextThink <= 0) {
        // pick random spot anywhere on map
        this.targetX = 200 + Math.random() * (world.WORLD_W - 400);
        this.targetY = 200 + Math.random() * (world.WORLD_H - 400);
        this.nextThink = 3 + Math.random() * 3;
      }
      this.state = 'patrol';
    }

    // MOVE
    let moveX = 0, moveY = 0;
    if (this.state === 'chase' || this.state === 'patrol') {
      const tx = (this.state === 'chase' ? player.x : this.targetX) - this.x;
      const ty = (this.state === 'chase' ? player.y : this.targetY) - this.y;
      const tl = Math.hypot(tx, ty) || 1;
      moveX = tx / tl; moveY = ty / tl;
      this.x += moveX * this.speed * dt;
      this.y += moveY * this.speed * dt;
      this.walkFrame += dt * 8;
    }

    // AIM
    if (this.state === 'shoot' || this.state === 'chase') {
      const targetAngle = Math.atan2(dy, dx);
      let diff = targetAngle - this.angle;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += diff * Math.min(1, dt * 6);
    } else if (moveX || moveY) {
      this.angle = Math.atan2(moveY, moveX);
    }

    // SHOOT
    if (this.state === 'shoot' && this.shootCooldown <= 0 && this.ammo > 0) {
      if (window.GAME && window.GAME.spawnBullet) {
        const spread = (Math.random() - 0.5) * 0.12;
        const a = this.angle + spread;
        const bx = this.x + Math.cos(a) * 30;
        const by = this.y + Math.sin(a) * 30;
        window.GAME.spawnBullet(bx, by, a, 'bot', this.id, 12);
      }
      this.ammo--;
      this.shootCooldown = 0.45 + Math.random() * 0.35;
    }

    // BOUNDS
    this.x = Math.max(this.radius, Math.min(world.WORLD_W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(world.WORLD_H - this.radius, this.y));
  }

  takeDamage(amount, fromId) {
    if (!this.alive) return;
    this.hp -= amount;
    this.hitFlash = 0.15;
    if (this.hp <= 0) {
      this.hp = 0; this.alive = false; this.state = 'dead';
      if (window.GAME && window.GAME.onBotKilled) window.GAME.onBotKilled(this, fromId);
    }
  }

  getSprite() {
    const base = 'assets/' + this.charFolder + '/';
    if (this.state === 'reload') return base + this.prefix + '_reload.png';
    if (this.state === 'shoot') {
      if (this.hasMachine) return base + this.prefix + '_machine.png';
      return base + this.prefix + '_gun.png';
    }
    if (this.state === 'chase') return base + this.prefix + '_hold.png';
    if (this.walkFrame > 0)     return base + this.prefix + '_hold.png';
    return base + this.prefix + '_stand.png';
  }
}

// --------------------------------------------
// SPAWN N BOTS — random positions far from player
// --------------------------------------------
function spawnBots(count, playerSpawn, world) {
  const bots = [];
  const minDistFromPlayer = 900;

  for (let i = 0; i < count; i++) {
    let tries = 0;
    let bx, by;
    do {
      bx = 300 + Math.random() * (world.WORLD_W - 600);
      by = 300 + Math.random() * (world.WORLD_H - 600);
      tries++;
    } while (Math.hypot(bx - playerSpawn.x, by - playerSpawn.y) < minDistFromPlayer && tries < 30);

    bots.push(new Bot(i, bx, by));
  }
  return bots;
}

window.BOT = { Bot, spawnBots, BOT_CHARS, CHAR_PREFIX };