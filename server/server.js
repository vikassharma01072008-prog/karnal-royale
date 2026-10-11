// Karnal Royale — Phase 3 Server with Grenades
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { WORLD, BUILDINGS, WATER_ZONES, PROPS, LOOT_SPAWNS, isInsideBuilding, isInWater } = require('../map.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
app.use(express.static(path.join(__dirname, '..')));

const WEAPONS = {
  pistol:  { damage: 15, fireRate: 350,  bulletSpeed: 14, bulletLifetime: 1200 },
  rifle:   { damage: 25, fireRate: 200,  bulletSpeed: 16, bulletLifetime: 1500 },
  shotgun: { damage: 60, fireRate: 900,  bulletSpeed: 10, bulletLifetime: 500  },
  sniper:  { damage: 80, fireRate: 1500, bulletSpeed: 22, bulletLifetime: 2500 }
};

const PICKUP_RADIUS = 40;
const PLAYER_RADIUS = 20;

const PLANE_SPEED = 4;
const PLANE_START_DELAY = 3000;
const PLANE_FLIGHT_DURATION = 22000;
const PARACHUTE_FALL_TIME = 2000;
const PARACHUTE_DRIFT_SPEED = 2;

const BOT_COUNT = 8;
const BOT_SPEED = 2;
const BOT_VIEW_RANGE = 800;
const BOT_SHOOT_RANGE = 500;
const BOT_SHOOT_COOLDOWN = 900;
const BOT_TURN_SPEED = 0.08;

const ZONE_PHASES = [
  { duration: 30000, radius: 1600, damage: 0  },
  { duration: 40000, radius: 1200, damage: 2  },
  { duration: 35000, radius: 850,  damage: 4  },
  { duration: 30000, radius: 550,  damage: 8  },
  { duration: 25000, radius: 300,  damage: 15 },
  { duration: 20000, radius: 120,  damage: 25 },
  { duration: 15000, radius: 40,   damage: 50 }
];

// Grenades
const GRENADE_FUSE = 2000;
const GRENADE_DAMAGE = 90;
const GRENADE_RADIUS = 150;
const GRENADE_THROW_SPEED = 14;
const GRENADE_COOLDOWN = 3000;

const COLORS = ['#ff4444','#44ff44','#4444ff','#ffff44','#ff44ff','#44ffff','#ff8844','#8844ff','#44ff88','#ff4488','#88ff44','#4488ff'];
let colorIndex = 0;

const players = {};
const bullets = {};
const grenades = {};
let bulletIdCounter = 0;
let grenadeIdCounter = 0;
let lootItems = [];

const match = { state: 'waiting', planeX: 0, planeY: 0, planeVX: 0, planeVY: 0, planeStartAt: 0, planeEndAt: 0 };

const zone = {
  phase: 0, centerX: WORLD.width / 2, centerY: WORLD.height / 2,
  radius: 1600, targetRadius: 1600, fromRadius: 1600,
  phaseStartedAt: Date.now(),
  nextCenterX: WORLD.width / 2, nextCenterY: WORLD.height / 2
};

function findSpawnPoint() {
  for (let attempt = 0; attempt < 200; attempt++) {
    let x, y;
    if (match.state === 'playing' && zone.radius > 100) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (zone.radius * 0.7);
      x = zone.centerX + Math.cos(angle) * r;
      y = zone.centerY + Math.sin(angle) * r;
      x = Math.max(100, Math.min(WORLD.width - 100, x));
      y = Math.max(100, Math.min(WORLD.height - 100, y));
    } else {
      x = 100 + Math.random() * (WORLD.width - 200);
      y = 100 + Math.random() * (WORLD.height - 200);
    }
    if (!isInsideBuilding(x, y, PLAYER_RADIUS + 5) && !isInWater(x, y)) return { x, y };
  }
  return { x: zone.centerX, y: zone.centerY };
}

function createPlayer(id, isBot) {
  return {
    id: id, x: 0, y: 0,
    color: COLORS[colorIndex++ % COLORS.length],
    health: 100, alive: true, isBot: isBot,
    weapon: 'pistol', ammo: 999, kills: 0, placement: 0,
    state: 'in_plane',
    targetX: 0, targetY: 0, aimAngle: 0,
    lastShotAt: 0, lastGrenadeAt: 0,
    wanderTimer: 0, jumpAt: 0, fallStart: 0
  };
}

function startMatch() {
  console.log('--- NEW MATCH START ---');
  for (const id in players) {
    const p = players[id];
    p.health = 100; p.alive = true; p.weapon = 'pistol'; p.ammo = 999;
    p.kills = 0; p.placement = 0; p.state = 'in_plane';
    p.x = 0; p.y = 0; p.lastShotAt = 0; p.lastGrenadeAt = 0;
    p.fallStart = 0;
    p.jumpAt = p.isBot ? (PLANE_START_DELAY + 2000 + Math.random() * 14000) : 0;
  }

  lootItems = LOOT_SPAWNS.map((l, i) => ({
    id: 'loot_' + i + '_' + Date.now(), x: l.x, y: l.y, type: l.type
  }));

  for (const id in bullets) delete bullets[id];
  for (const id in grenades) delete grenades[id];

  const corners = [
    { x: -100, y: -100, ex: WORLD.width + 100, ey: WORLD.height + 100 },
    { x: WORLD.width + 100, y: -100, ex: -100, ey: WORLD.height + 100 },
    { x: -100, y: WORLD.height + 100, ex: WORLD.width + 100, ey: -100 },
    { x: WORLD.width + 100, y: WORLD.height + 100, ex: -100, ey: -100 }
  ];
  const c = corners[Math.floor(Math.random() * corners.length)];
  const dx = c.ex - c.x, dy = c.ey - c.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  match.state = 'flying';
  match.planeX = c.x; match.planeY = c.y;
  match.planeVX = (dx / len) * PLANE_SPEED;
  match.planeVY = (dy / len) * PLANE_SPEED;
  match.planeStartAt = Date.now() + PLANE_START_DELAY;
  match.planeEndAt = match.planeStartAt + PLANE_FLIGHT_DURATION;

  zone.phase = 0;
  zone.centerX = WORLD.width / 2; zone.centerY = WORLD.height / 2;
  zone.radius = 1600; zone.targetRadius = 1600; zone.fromRadius = 1600;
  zone.phaseStartedAt = Date.now();
  zone.nextCenterX = WORLD.width / 2; zone.nextCenterY = WORLD.height / 2;

  io.emit('matchStarted', {
    players: players, loot: lootItems,
    plane: { x: match.planeX, y: match.planeY, vx: match.planeVX, vy: match.planeVY, startDelay: PLANE_START_DELAY },
    zone: { phase: zone.phase, centerX: zone.centerX, centerY: zone.centerY, radius: zone.radius, nextCenterX: zone.nextCenterX, nextCenterY: zone.nextCenterY, targetRadius: zone.targetRadius }
  });
}

function jumpPlayer(p) {
  if (p.state !== 'in_plane') return;
  p.state = 'parachuting';
  p.x = match.planeX + (Math.random() - 0.5) * 30;
  p.y = match.planeY + (Math.random() - 0.5) * 30;
  p.fallStart = Date.now();
  if (p.isBot) {
    const t = findSpawnPoint();
    p.targetX = t.x; p.targetY = t.y;
  } else { p.targetX = p.x; p.targetY = p.y; }
  io.emit('playerJumped', { id: p.id, x: p.x, y: p.y });
}

setInterval(() => {
  if (match.state !== 'flying') return;
  const now = Date.now();
  if (now < match.planeStartAt) return;
  match.planeX += match.planeVX;
  match.planeY += match.planeVY;
  io.emit('planeMoved', { x: match.planeX, y: match.planeY });
  for (const id in players) {
    const p = players[id];
    if (p.state === 'in_plane') { p.x = match.planeX; p.y = match.planeY; }
  }
  for (const id in players) {
    const p = players[id];
    if (p.isBot && p.state === 'in_plane' && now > p.jumpAt) jumpPlayer(p);
  }
  if (now > match.planeEndAt) {
    for (const id in players) {
      if (players[id].state === 'in_plane') jumpPlayer(players[id]);
    }
    match.state = 'playing';
    io.emit('matchStateChanged', { state: 'playing' });
  }
}, 1000 / 30);

setInterval(() => {
  if (match.state !== 'flying' && match.state !== 'playing') return;
  const now = Date.now();
  for (const id in players) {
    const p = players[id];
    if (p.state !== 'parachuting') continue;
    const dx = p.targetX - p.x, dy = p.targetY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (dist > 20) {
      p.x += (dx / dist) * PARACHUTE_DRIFT_SPEED;
      p.y += (dy / dist) * PARACHUTE_DRIFT_SPEED;
    }
    if (now - p.fallStart > PARACHUTE_FALL_TIME) {
      let lx = p.x, ly = p.y;
      if (isInsideBuilding(lx, ly, PLAYER_RADIUS) || isInWater(lx, ly)) {
        const safe = findSpawnPoint();
        lx = safe.x; ly = safe.y;
      }
      lx = Math.max(PLAYER_RADIUS, Math.min(WORLD.width - PLAYER_RADIUS, lx));
      ly = Math.max(PLAYER_RADIUS, Math.min(WORLD.height - PLAYER_RADIUS, ly));
      p.x = lx; p.y = ly; p.state = 'on_ground';
      io.emit('playerLanded', { id: p.id, x: p.x, y: p.y });
      let allLanded = true;
      for (const pid in players) {
        if (players[pid].state !== 'on_ground') { allLanded = false; break; }
      }
      if (allLanded && match.state === 'flying') {
        match.state = 'playing';
        io.emit('matchStateChanged', { state: 'playing' });
      }
    } else {
      io.emit('playerMoved', { id: p.id, x: p.x, y: p.y });
    }
  }
}, 1000 / 30);

function countAlive() {
  let n = 0;
  for (const id in players) if (players[id].alive) n++;
  return n;
}

function handleDeath(victim, killer) {
  victim.alive = false;
  victim.placement = countAlive() + 1;
  io.emit('killFeed', {
    killer: killer ? killer.id : 'ZONE',
    victim: victim.id,
    weapon: killer ? (killer.weapon || 'gun') : 'zone'
  });
  if (!victim.isBot) {
    io.to(victim.id).emit('youDied', { killerId: killer ? killer.id : 'ZONE', placement: victim.placement, killerName: killer ? killer.id : 'ZONE' });
  }
  if (killer && !killer.isBot && killer.id !== victim.id) {
    io.to(killer.id).emit('youKilled', { victimId: victim.id, kills: killer.kills || 0 });
  }
  const alive = countAlive();
  if (alive <= 1 && match.state === 'playing') {
    match.state = 'ended';
    let winner = null;
    for (const id in players) {
      if (players[id].alive) { winner = players[id]; break; }
    }
    if (winner) {
      winner.placement = 1;
      io.emit('matchEnded', { winnerId: winner.id, winnerIsBot: winner.isBot, winnerKills: winner.kills || 0 });
    } else {
      io.emit('matchEnded', { winnerId: null, winnerIsBot: false });
    }
    setTimeout(() => { startMatch(); }, 10000);
  } else {
    setTimeout(() => {
      const fresh = players[victim.id];
      if (!fresh || match.state === 'ended') return;
      const spawn = findSpawnPoint();
      fresh.health = 100; fresh.alive = true;
      fresh.x = spawn.x; fresh.y = spawn.y;
      fresh.weapon = 'pistol'; fresh.state = 'on_ground'; fresh.fallStart = 0;
      if (fresh.isBot) {
        fresh.targetX = spawn.x; fresh.targetY = spawn.y; fresh.wanderTimer = 0;
      }
      io.emit('playerRespawned', fresh);
    }, 3000);
  }
}

setInterval(() => {
  if (match.state !== 'playing') return;
  const now = Date.now();
  const elapsed = now - zone.phaseStartedAt;
  const current = ZONE_PHASES[zone.phase];
  if (!current) return;
  if (elapsed >= current.duration) {
    zone.phase++;
    const next = ZONE_PHASES[zone.phase];
    if (next) {
      zone.phaseStartedAt = now;
      zone.fromRadius = zone.targetRadius;
      zone.targetRadius = next.radius;
      zone.centerX = zone.nextCenterX;
      zone.centerY = zone.nextCenterY;
      const shrinkRange = next.radius * 0.4;
      zone.nextCenterX = zone.centerX + (Math.random() - 0.5) * 2 * shrinkRange;
      zone.nextCenterY = zone.centerY + (Math.random() - 0.5) * 2 * shrinkRange;
      io.emit('zonePhaseChanged', {
        phase: zone.phase, radius: zone.targetRadius, damage: next.damage,
        centerX: zone.centerX, centerY: zone.centerY,
        nextCenterX: zone.nextCenterX, nextCenterY: zone.nextCenterY
      });
    }
  } else {
    const progress = elapsed / current.duration;
    zone.radius = zone.fromRadius + (zone.targetRadius - zone.fromRadius) * progress;
  }
}, 1000 / 10);

setInterval(() => {
  if (match.state !== 'playing') return;
  const current = ZONE_PHASES[zone.phase];
  if (!current || current.damage === 0) return;
  for (const id in players) {
    const p = players[id];
    if (!p.alive || p.state !== 'on_ground') continue;
    const dx = p.x - zone.centerX, dy = p.y - zone.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > zone.radius) {
      p.health -= current.damage;
      if (p.health <= 0) { p.health = 0; handleDeath(p, null); }
      else io.emit('playerDamaged', { id: p.id, health: p.health });
    }
  }
}, 1000);

setInterval(() => {
  if (match.state !== 'playing') return;
  const now = Date.now();
  for (const id in players) {
    const bot = players[id];
    if (!bot.isBot || !bot.alive || bot.state !== 'on_ground') continue;
    let nearest = null, nearestDist = Infinity;
    for (const pid in players) {
      if (pid === id) continue;
      const p = players[pid];
      if (!p.alive || p.state !== 'on_ground') continue;
      const dx = p.x - bot.x, dy = p.y - bot.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < nearestDist) { nearestDist = d; nearest = p; }
    }
    let moveX = 0, moveY = 0;
    const zdx = bot.x - zone.centerX, zdy = bot.y - zone.centerY;
    const zdist = Math.sqrt(zdx * zdx + zdy * zdy);
    if (zdist > zone.radius * 0.85) {
      moveX = (-zdx / zdist) * BOT_SPEED;
      moveY = (-zdy / zdist) * BOT_SPEED;
      bot.aimAngle = Math.atan2(zdy, zdx);
    } else if (nearest && nearestDist < BOT_VIEW_RANGE) {
      const dx = nearest.x - bot.x, dy = nearest.y - bot.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist, ny = dy / dist;
      const targetAngle = Math.atan2(dy, dx);
      let da = targetAngle - bot.aimAngle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      bot.aimAngle += da * BOT_TURN_SPEED;
      if (dist > 250) { moveX = nx * BOT_SPEED; moveY = ny * BOT_SPEED; }
      else if (dist < 150) { moveX = -nx * BOT_SPEED * 0.5; moveY = -ny * BOT_SPEED * 0.5; }
      if (dist < BOT_SHOOT_RANGE && Math.abs(da) < 0.3 && now - bot.lastShotAt > BOT_SHOOT_COOLDOWN) {
        bot.lastShotAt = now;
        spawnBullet(bot, bot.aimAngle);
      }
    } else {
      if (now - bot.wanderTimer > 3000) {
        bot.wanderTimer = now;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * (zone.radius * 0.6);
        bot.targetX = zone.centerX + Math.cos(angle) * r;
        bot.targetY = zone.centerY + Math.sin(angle) * r;
      }
      const dx = bot.targetX - bot.x, dy = bot.targetY - bot.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist > 30) {
        moveX = (dx / dist) * BOT_SPEED * 0.6;
        moveY = (dy / dist) * BOT_SPEED * 0.6;
        bot.aimAngle = Math.atan2(dy, dx);
      }
    }
    let nx = bot.x + moveX, ny = bot.y + moveY;
    nx = Math.max(PLAYER_RADIUS, Math.min(WORLD.width - PLAYER_RADIUS, nx));
    ny = Math.max(PLAYER_RADIUS, Math.min(WORLD.height - PLAYER_RADIUS, ny));
    if (!isInsideBuilding(nx, bot.y, PLAYER_RADIUS)) bot.x = nx;
    if (!isInsideBuilding(bot.x, ny, PLAYER_RADIUS)) bot.y = ny;
    io.emit('playerMoved', { id: bot.id, x: bot.x, y: bot.y });
    tryPickup(bot);
  }
}, 1000 / 30);

function tryPickup(player) {
  if (!player.alive || player.state !== 'on_ground') return;
  for (let i = lootItems.length - 1; i >= 0; i--) {
    const item = lootItems[i];
    const dx = item.x - player.x, dy = item.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < PICKUP_RADIUS) {
      if (item.type === 'medkit') {
        player.health = Math.min(100, player.health + 30);
        io.emit('playerDamaged', { id: player.id, health: player.health });
      } else {
        player.weapon = item.type;
        player.ammo = 999;
      }
      io.emit('lootPickedUp', { id: item.id, by: player.id, weapon: player.weapon, health: player.health });
      lootItems.splice(i, 1);
    }
  }
}

function spawnBullet(owner, angle) {
  const weapon = WEAPONS[owner.weapon] || WEAPONS.pistol;
  const bulletId = 'b' + (bulletIdCounter++);
  const bullet = {
    id: bulletId, ownerId: owner.id, weapon: owner.weapon,
    x: owner.x + Math.cos(angle) * (PLAYER_RADIUS + 5),
    y: owner.y + Math.sin(angle) * (PLAYER_RADIUS + 5),
    vx: Math.cos(angle) * weapon.bulletSpeed,
    vy: Math.sin(angle) * weapon.bulletSpeed,
    damage: weapon.damage, maxLifetime: weapon.bulletLifetime,
    spawnedAt: Date.now()
  };
  bullets[bulletId] = bullet;
  io.emit('bulletSpawned', bullet);
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  const player = createPlayer(socket.id, false);
  players[socket.id] = player;

  socket.emit('init', {
    self: player, players: players, world: WORLD,
    loot: lootItems, grenades: grenades,
    match: { state: match.state, plane: { x: match.planeX, y: match.planeY, vx: match.planeVX, vy: match.planeVY } },
    zone: { phase: zone.phase, centerX: zone.centerX, centerY: zone.centerY, radius: zone.radius, nextCenterX: zone.nextCenterX, nextCenterY: zone.nextCenterY, targetRadius: zone.targetRadius }
  });

  socket.broadcast.emit('playerJoined', player);

  socket.on('jump', () => {
    const p = players[socket.id];
    if (!p) return;
    jumpPlayer(p);
  });

  socket.on('move', (data) => {
    const p = players[socket.id];
    if (!p || !p.alive || p.state !== 'on_ground') return;
    if (match.state === 'ended') return;
    if (typeof data.x !== 'number' || typeof data.y !== 'number') return;
    let nx = data.x, ny = data.y;
    nx = Math.max(PLAYER_RADIUS, Math.min(WORLD.width - PLAYER_RADIUS, nx));
    ny = Math.max(PLAYER_RADIUS, Math.min(WORLD.height - PLAYER_RADIUS, ny));
    if (!isInsideBuilding(nx, p.y, PLAYER_RADIUS)) p.x = nx;
    if (!isInsideBuilding(p.x, ny, PLAYER_RADIUS)) p.y = ny;
    socket.broadcast.emit('playerMoved', { id: socket.id, x: p.x, y: p.y });
    tryPickup(p);
  });

  socket.on('shoot', (data) => {
    const p = players[socket.id];
    if (!p || !p.alive || p.state !== 'on_ground') return;
    if (match.state === 'ended') return;
    if (typeof data.angle !== 'number') return;
    const weapon = WEAPONS[p.weapon] || WEAPONS.pistol;
    const now = Date.now();
    if (now - (p.lastShotAt || 0) < weapon.fireRate) return;
    p.lastShotAt = now;
    spawnBullet(p, data.angle);
  });

  socket.on('throwGrenade', (data) => {
    const p = players[socket.id];
    if (!p || !p.alive || p.state !== 'on_ground') return;
    if (match.state === 'ended') return;
    if (typeof data.angle !== 'number') return;
    const now = Date.now();
    if (now - (p.lastGrenadeAt || 0) < GRENADE_COOLDOWN) return;
    p.lastGrenadeAt = now;
    const id = 'g' + (grenadeIdCounter++);
    grenades[id] = {
      id: id, ownerId: socket.id,
      x: p.x + Math.cos(data.angle) * (PLAYER_RADIUS + 8),
      y: p.y + Math.sin(data.angle) * (PLAYER_RADIUS + 8),
      vx: Math.cos(data.angle) * GRENADE_THROW_SPEED,
      vy: Math.sin(data.angle) * GRENADE_THROW_SPEED,
      thrownAt: now
    };
    io.emit('grenadeThrown', grenades[id]);
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
    for (const id in bullets) if (bullets[id].ownerId === socket.id) delete bullets[id];
    for (const id in grenades) if (grenades[id].ownerId === socket.id) delete grenades[id];
  });
});

for (let i = 0; i < BOT_COUNT; i++) {
  const bot = createPlayer('BOT_' + Math.floor(Math.random() * 9000 + 1000), true);
  players[bot.id] = bot;
}

// Grenade physics loop
setInterval(() => {
  if (match.state !== 'playing') return;
  const now = Date.now();
  for (const id in grenades) {
    const g = grenades[id];
    const elapsed = now - g.thrownAt;
    g.x += g.vx; g.y += g.vy;
    g.vx *= 0.94; g.vy *= 0.94;
    if (isInsideBuilding(g.x, g.y, 8)) {
      g.x -= g.vx; g.y -= g.vy;
      g.vx = 0; g.vy = 0;
    }
    g.x = Math.max(10, Math.min(WORLD.width - 10, g.x));
    g.y = Math.max(10, Math.min(WORLD.height - 10, g.y));
    io.emit('grenadeMoved', { id: g.id, x: g.x, y: g.y });
    if (elapsed >= GRENADE_FUSE) {
      for (const pid in players) {
        const p = players[pid];
        if (!p.alive) continue;
        const dx = p.x - g.x, dy = p.y - g.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= GRENADE_RADIUS) {
          const falloff = 1 - (dist / GRENADE_RADIUS) * 0.5;
          const dmg = Math.round(GRENADE_DAMAGE * falloff);
          p.health -= dmg;
          if (p.health <= 0) {
            p.health = 0;
            const killer = players[g.ownerId];
            if (killer && killer.id !== p.id) killer.kills = (killer.kills || 0) + 1;
            handleDeath(p, killer);
          } else {
            io.emit('playerDamaged', { id: p.id, health: p.health });
          }
        }
      }
      io.emit('grenadeExploded', { id: g.id, x: g.x, y: g.y });
      delete grenades[id];
    }
  }
}, 1000 / 30);

// Bullet loop
setInterval(() => {
  if (match.state !== 'playing') return;
  const now = Date.now();
  for (const id in bullets) {
    const b = bullets[id];
    if (now - b.spawnedAt > b.maxLifetime) { delete bullets[id]; io.emit('bulletRemoved', id); continue; }
    b.x += b.vx; b.y += b.vy;
    if (isInsideBuilding(b.x, b.y, 4)) { delete bullets[id]; io.emit('bulletRemoved', id); continue; }
    if (b.x < 0 || b.x > WORLD.width || b.y < 0 || b.y > WORLD.height) { delete bullets[id]; io.emit('bulletRemoved', id); continue; }
    let hit = false;
    for (const pid in players) {
      const p = players[pid];
      if (!p.alive || p.state !== 'on_ground') continue;
      if (p.id === b.ownerId) continue;
      const dx = p.x - b.x, dy = p.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PLAYER_RADIUS) {
        p.health -= b.damage;
        hit = true;
        if (p.health <= 0) {
          p.health = 0;
          const killer = players[b.ownerId];
          if (killer && killer.id !== p.id) killer.kills = (killer.kills || 0) + 1;
          handleDeath(p, killer);
        } else {
          io.emit('playerDamaged', { id: p.id, health: p.health });
        }
        break;
      }
    }
    if (hit) { delete bullets[id]; io.emit('bulletRemoved', id); }
  }
}, 1000 / 30);

setTimeout(() => { startMatch(); }, 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Karnal Royale server running on port ' + PORT);
  console.log(BOT_COUNT + ' bots spawned. Match starting...');
});