// Karnal Royale — Map with Real Karnal Landmarks + Loot Spawns

const WORLD = {
  width: 4000,
  height: 4000
};

// ===== ZONES =====
const ZONES = [
  { name: 'ITI Chowk',           x: 1850, y: 1850, w: 300,  h: 300 },
  { name: 'Sadar Bazaar',        x: 1100, y: 1600, w: 500,  h: 600 },
  { name: 'Karna Lake',          x: 2600, y: 2600, w: 900,  h: 900 },
  { name: 'Railway Station',     x: 700,  y: 2600, w: 700,  h: 500 },
  { name: 'Old Bus Stand',       x: 1600, y: 700,  w: 500,  h: 400 },
  { name: 'New Bus Stand',       x: 2600, y: 700,  w: 600,  h: 500 },
  { name: 'Model Town',          x: 2600, y: 1500, w: 700,  h: 500 },
  { name: 'Sector 16',           x: 600,  y: 600,  w: 500,  h: 500 },
  { name: 'Sector 32',           x: 3300, y: 600,  w: 500,  h: 500 },
  { name: 'Sector 4',            x: 600,  y: 3300, w: 500,  h: 500 },
  { name: 'Ram Nagar',           x: 3300, y: 3300, w: 500,  h: 500 },
  { name: 'Sector 12 Market',    x: 1200, y: 1200, w: 400,  h: 400 },
  { name: 'Kalander Shah Tomb',  x: 200,  y: 1500, w: 300,  h: 300 },
  { name: 'Atal Park',           x: 1800, y: 3100, w: 500,  h: 500 },
  { name: 'Super Mall',          x: 3000, y: 2600, w: 400,  h: 400 },
  { name: 'Kalpana Chawla Hospital', x: 900, y: 1900, w: 400, h: 400 },
  { name: 'Karan Stadium',       x: 250,  y: 2900, w: 500,  h: 500 },
  { name: 'Karna Gate',          x: 1500, y: 2200, w: 300,  h: 300 },
  { name: 'Sector 3',            x: 2000, y: 300,  w: 400,  h: 400 },
  { name: 'Namaste Chowk',       x: 2200, y: 1000, w: 400,  h: 400 }
];

// ===== BUILDINGS =====
const BUILDINGS = [
  // Sector 16
  { x: 620,  y: 620,  w: 120, h: 100, type: 'building' },
  { x: 800,  y: 620,  w: 120, h: 100, type: 'building' },
  { x: 980,  y: 620,  w: 100, h: 100, type: 'building' },
  { x: 620,  y: 820,  w: 120, h: 100, type: 'building' },
  { x: 800,  y: 820,  w: 120, h: 100, type: 'building' },
  { x: 980,  y: 820,  w: 100, h: 100, type: 'building' },
  { x: 620,  y: 1000, w: 120, h: 80,  type: 'building' },
  { x: 800,  y: 1000, w: 120, h: 80,  type: 'building' },

  // Sector 32
  { x: 3320, y: 620,  w: 120, h: 100, type: 'building' },
  { x: 3500, y: 620,  w: 120, h: 100, type: 'building' },
  { x: 3680, y: 620,  w: 100, h: 100, type: 'building' },
  { x: 3320, y: 820,  w: 120, h: 100, type: 'building' },
  { x: 3500, y: 820,  w: 120, h: 100, type: 'building' },
  { x: 3680, y: 820,  w: 100, h: 100, type: 'building' },

  // Sector 4
  { x: 620,  y: 3320, w: 120, h: 100, type: 'building' },
  { x: 800,  y: 3320, w: 120, h: 100, type: 'building' },
  { x: 620,  y: 3520, w: 120, h: 100, type: 'building' },
  { x: 800,  y: 3520, w: 120, h: 100, type: 'building' },

  // Ram Nagar
  { x: 3320, y: 3320, w: 120, h: 100, type: 'building' },
  { x: 3500, y: 3320, w: 120, h: 100, type: 'building' },
  { x: 3320, y: 3520, w: 120, h: 100, type: 'building' },
  { x: 3500, y: 3520, w: 120, h: 100, type: 'building' },

  // Sadar Bazaar
  { x: 1120, y: 1620, w: 80,  h: 60,  type: 'building' },
  { x: 1220, y: 1620, w: 80,  h: 60,  type: 'building' },
  { x: 1320, y: 1620, w: 80,  h: 60,  type: 'building' },
  { x: 1420, y: 1620, w: 80,  h: 60,  type: 'building' },
  { x: 1520, y: 1620, w: 60,  h: 60,  type: 'building' },
  { x: 1120, y: 1750, w: 80,  h: 60,  type: 'building' },
  { x: 1220, y: 1750, w: 80,  h: 60,  type: 'building' },
  { x: 1320, y: 1750, w: 80,  h: 60,  type: 'building' },
  { x: 1420, y: 1750, w: 80,  h: 60,  type: 'building' },
  { x: 1520, y: 1750, w: 60,  h: 60,  type: 'building' },
  { x: 1120, y: 1880, w: 80,  h: 60,  type: 'building' },
  { x: 1220, y: 1880, w: 80,  h: 60,  type: 'building' },
  { x: 1320, y: 1880, w: 80,  h: 60,  type: 'building' },
  { x: 1420, y: 1880, w: 80,  h: 60,  type: 'building' },
  { x: 1520, y: 1880, w: 60,  h: 60,  type: 'building' },
  { x: 1120, y: 2010, w: 80,  h: 60,  type: 'building' },
  { x: 1220, y: 2010, w: 80,  h: 60,  type: 'building' },
  { x: 1320, y: 2010, w: 80,  h: 60,  type: 'building' },
  { x: 1420, y: 2010, w: 80,  h: 60,  type: 'building' },
  { x: 1520, y: 2010, w: 60,  h: 60,  type: 'building' },

  // Railway Station
  { x: 720,  y: 2620, w: 640, h: 100, type: 'building' },
  { x: 720,  y: 2760, w: 100, h: 240, type: 'building' },
  { x: 1260, y: 2760, w: 100, h: 240, type: 'building' },

  // Old Bus Stand
  { x: 1620, y: 720,  w: 460, h: 80,  type: 'building' },

  // New Bus Stand
  { x: 2620, y: 720,  w: 560, h: 100, type: 'building' },

  // Model Town
  { x: 2660, y: 1560, w: 140, h: 100, type: 'building' },
  { x: 2860, y: 1560, w: 140, h: 100, type: 'building' },
  { x: 3060, y: 1560, w: 140, h: 100, type: 'building' },
  { x: 2660, y: 1760, w: 140, h: 100, type: 'building' },
  { x: 2860, y: 1760, w: 140, h: 100, type: 'building' },
  { x: 3060, y: 1760, w: 140, h: 100, type: 'building' },

  // Sector 12 Market
  { x: 1220, y: 1220, w: 100, h: 70, type: 'building' },
  { x: 1360, y: 1220, w: 100, h: 70, type: 'building' },
  { x: 1220, y: 1340, w: 100, h: 70, type: 'building' },
  { x: 1360, y: 1340, w: 100, h: 70, type: 'building' },
  { x: 1220, y: 1460, w: 100, h: 70, type: 'building' },
  { x: 1360, y: 1460, w: 100, h: 70, type: 'building' },

  // Kalander Shah Tomb
  { x: 260,  y: 1560, w: 200, h: 180, type: 'building' },

  // Super Mall
  { x: 3060, y: 2660, w: 300, h: 260, type: 'building' },

  // Kalpana Chawla Hospital
  { x: 940,  y: 1940, w: 340, h: 300, type: 'building' },

  // Karan Stadium
  { x: 260,  y: 2920, w: 500, h: 30,  type: 'building' },
  { x: 260,  y: 3350, w: 500, h: 30,  type: 'building' },
  { x: 260,  y: 2950, w: 30,  h: 400, type: 'building' },
  { x: 730,  y: 2950, w: 30,  h: 400, type: 'building' },

  // Karna Gate
  { x: 1520, y: 2240, w: 60,  h: 220, type: 'building' },
  { x: 1700, y: 2240, w: 60,  h: 220, type: 'building' },

  // Sector 3
  { x: 2020, y: 320,  w: 120, h: 100, type: 'building' },
  { x: 2200, y: 320,  w: 120, h: 100, type: 'building' },
  { x: 2020, y: 520,  w: 120, h: 100, type: 'building' },
  { x: 2200, y: 520,  w: 120, h: 100, type: 'building' },

  // ITI Chowk
  { x: 1900, y: 1750, w: 80,  h: 80,  type: 'building' },
  { x: 2020, y: 1750, w: 80,  h: 80,  type: 'building' },
  { x: 1900, y: 2120, w: 80,  h: 80,  type: 'building' },
  { x: 2020, y: 2120, w: 80,  h: 80,  type: 'building' },

  // Namaste Chowk
  { x: 2280, y: 1080, w: 100, h: 100, type: 'building' },
  { x: 2420, y: 1080, w: 100, h: 100, type: 'building' },

  // Atal Park trees
  { x: 1820, y: 3120, w: 60,  h: 60,  type: 'tree' },
  { x: 1960, y: 3120, w: 60,  h: 60,  type: 'tree' },
  { x: 2100, y: 3120, w: 60,  h: 60,  type: 'tree' },
  { x: 2240, y: 3120, w: 60,  h: 60,  type: 'tree' },
  { x: 1820, y: 3260, w: 60,  h: 60,  type: 'tree' },
  { x: 2240, y: 3260, w: 60,  h: 60,  type: 'tree' },
  { x: 1820, y: 3400, w: 60,  h: 60,  type: 'tree' },
  { x: 1960, y: 3400, w: 60,  h: 60,  type: 'tree' },
  { x: 2100, y: 3400, w: 60,  h: 60,  type: 'tree' },
  { x: 2240, y: 3400, w: 60,  h: 60,  type: 'tree' },

  // Trees around Karna Lake
  { x: 2600, y: 2540, w: 50, h: 50, type: 'tree' },
  { x: 3420, y: 2540, w: 50, h: 50, type: 'tree' },
  { x: 2600, y: 3460, w: 50, h: 50, type: 'tree' },
  { x: 3420, y: 3460, w: 50, h: 50, type: 'tree' },

  // Trees around Namaste Chowk
  { x: 2150, y: 950, w: 50, h: 50, type: 'tree' },
  { x: 2650, y: 950, w: 50, h: 50, type: 'tree' },
  { x: 2150, y: 1320, w: 50, h: 50, type: 'tree' },
  { x: 2650, y: 1320, w: 50, h: 50, type: 'tree' }
];

// ===== WATER =====
const WATER_ZONES = [
  { x: 2650, y: 2650, w: 800, h: 800 }
];

// ===== LOOT SPAWN POINTS =====
const LOOT_SPAWNS = [
  // ITI Chowk
  { x: 1900, y: 1900, type: 'rifle' },
  { x: 2100, y: 2000, type: 'ammo' },
  { x: 1980, y: 2080, type: 'medkit' },

  // Sadar Bazaar
  { x: 1150, y: 1650, type: 'pistol' },
  { x: 1250, y: 1650, type: 'rifle' },
  { x: 1350, y: 1650, type: 'ammo' },
  { x: 1450, y: 1650, type: 'medkit' },
  { x: 1150, y: 1780, type: 'shotgun' },
  { x: 1250, y: 1780, type: 'ammo' },
  { x: 1350, y: 1780, type: 'pistol' },
  { x: 1450, y: 1780, type: 'medkit' },
  { x: 1250, y: 1910, type: 'rifle' },
  { x: 1350, y: 1910, type: 'ammo' },

  // Railway Station
  { x: 900,  y: 2700, type: 'rifle' },
  { x: 1050, y: 2700, type: 'sniper' },
  { x: 1200, y: 2700, type: 'ammo' },
  { x: 900,  y: 3050, type: 'medkit' },
  { x: 1200, y: 3050, type: 'ammo' },

  // Old Bus Stand
  { x: 1700, y: 900, type: 'shotgun' },
  { x: 1850, y: 900, type: 'ammo' },
  { x: 1950, y: 900, type: 'medkit' },

  // New Bus Stand
  { x: 2700, y: 900, type: 'rifle' },
  { x: 2900, y: 900, type: 'ammo' },
  { x: 3100, y: 900, type: 'medkit' },

  // Model Town
  { x: 2750, y: 1650, type: 'pistol' },
  { x: 2950, y: 1650, type: 'ammo' },
  { x: 2750, y: 1850, type: 'medkit' },
  { x: 3150, y: 1850, type: 'rifle' },

  // Sector 16
  { x: 700,  y: 700,  type: 'pistol' },
  { x: 900,  y: 700,  type: 'ammo' },
  { x: 700,  y: 900,  type: 'medkit' },

  // Sector 32
  { x: 3400, y: 700,  type: 'pistol' },
  { x: 3600, y: 700,  type: 'ammo' },
  { x: 3400, y: 900,  type: 'medkit' },

  // Sector 4
  { x: 700,  y: 3400, type: 'shotgun' },
  { x: 900,  y: 3400, type: 'ammo' },

  // Ram Nagar
  { x: 3400, y: 3400, type: 'rifle' },
  { x: 3600, y: 3400, type: 'medkit' },

  // Sector 12 Market
  { x: 1250, y: 1280, type: 'pistol' },
  { x: 1400, y: 1280, type: 'ammo' },
  { x: 1250, y: 1420, type: 'rifle' },

  // Kalander Shah Tomb
  { x: 350,  y: 1650, type: 'medkit' },
  { x: 350,  y: 1700, type: 'sniper' },

  // Atal Park
  { x: 1950, y: 3250, type: 'shotgun' },
  { x: 2100, y: 3250, type: 'ammo' },
  { x: 2200, y: 3400, type: 'medkit' },

  // Super Mall
  { x: 3120, y: 2700, type: 'rifle' },
  { x: 3220, y: 2700, type: 'ammo' },
  { x: 3120, y: 2850, type: 'ammo' },
  { x: 3220, y: 2850, type: 'medkit' },

  // Kalpana Chawla Hospital
  { x: 1000, y: 2000, type: 'medkit' },
  { x: 1100, y: 2000, type: 'medkit' },
  { x: 1000, y: 2150, type: 'ammo' },

  // Karan Stadium
  { x: 400,  y: 3100, type: 'sniper' },
  { x: 550,  y: 3100, type: 'rifle' },
  { x: 400,  y: 3250, type: 'medkit' },

  // Karna Gate
  { x: 1600, y: 2300, type: 'ammo' },
  { x: 1680, y: 2300, type: 'pistol' },

  // Sector 3
  { x: 2100, y: 400,  type: 'pistol' },
  { x: 2280, y: 400,  type: 'ammo' },

  // Namaste Chowk
  { x: 2350, y: 1200, type: 'rifle' },
  { x: 2500, y: 1200, type: 'medkit' },

  // Karna Lake
  { x: 2750, y: 2700, type: 'sniper' },
  { x: 3400, y: 2700, type: 'sniper' },
  { x: 2750, y: 3400, type: 'medkit' },
  { x: 3400, y: 3400, type: 'ammo' }
];

// ===== ROADS =====
const ROADS = [
  { x: 1940, y: 0,    w: 120, h: 4000 },
  { x: 0,    y: 1940, w: 4000, h: 120 },
  { x: 700,  y: 400,  w: 80,  h: 1600 },
  { x: 3260, y: 400,  w: 80,  h: 1600 },
  { x: 700,  y: 2200, w: 80,  h: 1400 },
  { x: 3260, y: 2200, w: 80,  h: 1400 },
  { x: 1600, y: 1600, w: 400, h: 80 },
  { x: 700,  y: 2600, w: 1200, h: 80 },
  { x: 2600, y: 2500, w: 80,  h: 1000 },
  { x: 2200, y: 1000, w: 600, h: 80 },
  { x: 2350, y: 600,  w: 80,  h: 400 }
];

// ===== PROPS =====
const PROPS = [
  // ITI Chowk
  { type: 'flyover', x: 1850, y: 1780, w: 500, h: 40, color: '#6a6a6a' },
  { type: 'mural',   x: 1850, y: 2150, w: 400, h: 30, color: '#8899aa' },
  { type: 'car', x: 1880, y: 1880, w: 40, h: 24, color: '#ffffff' },
  { type: 'car', x: 2100, y: 1960, w: 40, h: 24, color: '#cc3333' },
  { type: 'tractor', x: 2160, y: 2020, w: 50, h: 30, color: '#884422' },

  // Sadar Bazaar
  { type: 'awning', x: 1120, y: 1610, w: 80, h: 10, color: '#cc3333' },
  { type: 'awning', x: 1220, y: 1610, w: 80, h: 10, color: '#ffaa22' },
  { type: 'awning', x: 1320, y: 1610, w: 80, h: 10, color: '#33aa55' },
  { type: 'awning', x: 1420, y: 1610, w: 80, h: 10, color: '#cc3333' },
  { type: 'awning', x: 1120, y: 1740, w: 80, h: 10, color: '#ffaa22' },
  { type: 'awning', x: 1220, y: 1740, w: 80, h: 10, color: '#33aa55' },
  { type: 'awning', x: 1320, y: 1740, w: 80, h: 10, color: '#cc3333' },
  { type: 'awning', x: 1420, y: 1740, w: 80, h: 10, color: '#ffaa22' },
  { type: 'erickshaw', x: 1300, y: 1690, w: 34, h: 20, color: '#3366aa' },

  // Railway Station
  { type: 'train_track', x: 720, y: 2860, w: 640, h: 4, color: '#3a2a1a' },
  { type: 'train_track', x: 720, y: 2940, w: 640, h: 4, color: '#3a2a1a' },
  { type: 'train_track', x: 720, y: 3020, w: 640, h: 4, color: '#3a2a1a' },
  { type: 'train', x: 900, y: 2900, w: 200, h: 30, color: '#cc2222' },
  { type: 'trashbin', x: 1300, y: 2740, w: 16, h: 16, color: '#33aa44' },
  { type: 'trashbin', x: 1320, y: 2740, w: 16, h: 16, color: '#3366cc' },

  // Old Bus Stand
  { type: 'bus', x: 1680, y: 830,  w: 90,  h: 34, color: '#3366cc' },
  { type: 'bus', x: 1800, y: 830,  w: 90,  h: 34, color: '#ffaa22' },
  { type: 'bus', x: 1920, y: 830,  w: 90,  h: 34, color: '#3366cc' },

  // New Bus Stand
  { type: 'bus', x: 2680, y: 850,  w: 100, h: 36, color: '#3366cc' },
  { type: 'bus', x: 2820, y: 850,  w: 100, h: 36, color: '#cc3333' },
  { type: 'bus', x: 2960, y: 850,  w: 100, h: 36, color: '#3366cc' },

  // Atal Park
  { type: 'signboard', x: 1980, y: 3180, w: 140, h: 30, color: '#ffffff', text: 'ATAL PARK' },
  { type: 'lamppost', x: 1830, y: 3100, w: 4, h: 60, color: '#333333' },
  { type: 'lamppost', x: 2260, y: 3100, w: 4, h: 60, color: '#333333' },
  { type: 'lamppost', x: 1830, y: 3450, w: 4, h: 60, color: '#333333' },
  { type: 'lamppost', x: 2260, y: 3450, w: 4, h: 60, color: '#333333' },
  { type: 'flowerbed', x: 2050, y: 3150, w: 100, h: 20, color: '#ff5588' },

  // Super Mall
  { type: 'mall_band', x: 3060, y: 2680, w: 300, h: 20, color: '#3355cc' },
  { type: 'mall_band', x: 3060, y: 2780, w: 300, h: 20, color: '#3355cc' },
  { type: 'mall_band', x: 3060, y: 2880, w: 300, h: 20, color: '#3355cc' },
  { type: 'mall_pillar', x: 3195, y: 2660, w: 20, h: 260, color: '#cc2222' },
  { type: 'car', x: 3020, y: 2960, w: 40, h: 24, color: '#ffffff' },
  { type: 'car', x: 3100, y: 2960, w: 40, h: 24, color: '#aaaaaa' },
  { type: 'car', x: 3180, y: 2960, w: 40, h: 24, color: '#ffffff' },
  { type: 'car', x: 3280, y: 2960, w: 40, h: 24, color: '#333333' },

  // Karan Stadium
  { type: 'track', x: 320, y: 3000, w: 360, h: 350, color: '#cc6644' },
  { type: 'field', x: 380, y: 3060, w: 240, h: 230, color: '#3a8a3a' },

  // Namaste Chowk
  { type: 'namaste_base', x: 2300, y: 1150, w: 200, h: 60, color: '#cc4422' },
  { type: 'namaste_hands', x: 2360, y: 1060, w: 80, h: 100, color: '#dd6622' },
  { type: 'namaste_steps', x: 2320, y: 1220, w: 160, h: 40, color: '#cc4422' },
  { type: 'flyover', x: 2200, y: 1300, w: 500, h: 40, color: '#6a6a6a' },
  { type: 'barrier', x: 2200, y: 1420, w: 500, h: 12, color: '#ffcc00' },

  // Karna Lake
  { type: 'railing', x: 2650, y: 2650, w: 800, h: 4, color: '#888888' },
  { type: 'railing', x: 2650, y: 2650, w: 4, h: 800, color: '#888888' },
  { type: 'boat', x: 2900, y: 2900, w: 60, h: 25, color: '#8a5a2a' },
  { type: 'boat', x: 3200, y: 3100, w: 60, h: 25, color: '#8a5a2a' },

  // Scattered cars on roads
  { type: 'car', x: 1000, y: 1980, w: 40, h: 24, color: '#cc3333' },
  { type: 'car', x: 1400, y: 1960, w: 40, h: 24, color: '#ffffff' },
  { type: 'car', x: 2500, y: 1960, w: 40, h: 24, color: '#333333' },
  { type: 'car', x: 3000, y: 1980, w: 40, h: 24, color: '#cc3333' },
  { type: 'car', x: 1980, y: 800,  w: 40, h: 24, color: '#ffffff' },
  { type: 'car', x: 1980, y: 1200, w: 40, h: 24, color: '#333333' }
];

// ===== HELPERS =====
function isInsideBuilding(x, y, radius) {
  for (const b of BUILDINGS) {
    if (b.type === 'water') continue;
    const closestX = Math.max(b.x, Math.min(x, b.x + b.w));
    const closestY = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - closestX;
    const dy = y - closestY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

function isInWater(x, y) {
  for (const w of WATER_ZONES) {
    if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return true;
  }
  return false;
}

function getZoneName(x, y) {
  for (const z of ZONES) {
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
      return z.name;
    }
  }
  return '';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WORLD, ZONES, BUILDINGS, WATER_ZONES, ROADS, PROPS, LOOT_SPAWNS,
    isInsideBuilding, isInWater, getZoneName
  };
}