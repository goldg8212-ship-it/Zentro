// ==========================================
// BLOCK DUNGEON LEGENDS - GAME DATA & DEFINITIONS
// ==========================================

const RARITY = {
  COMMON: { name: 'Common', color: '#9E9E9E', glow: 'rgba(158,158,158,0.3)', mult: 1.0 },
  RARE: { name: 'Rare', color: '#29B6F6', glow: 'rgba(41,182,246,0.4)', mult: 1.35 },
  EPIC: { name: 'Epic', color: '#AB47BC', glow: 'rgba(171,71,188,0.5)', mult: 1.8 },
  LEGENDARY: { name: 'Legendary', color: '#FFA000', glow: 'rgba(255,160,0,0.7)', mult: 2.5 }
};

const WEAPONS = {
  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Sword',
    type: 'melee',
    category: 'Sword',
    icon: '⚔️',
    description: 'A finely balanced blade crafted from forged iron.',
    damage: 24,
    speed: 0.35, // seconds between attacks
    range: 2.3,
    knockback: 1.6,
    effect: 'balanced',
    projectile: null,
    modelType: 'sword'
  },
  heavy_hammer: {
    id: 'heavy_hammer',
    name: 'Heavy Hammer',
    type: 'melee',
    category: 'Hammer',
    icon: '🔨',
    description: 'Devastating bludgeon. Creates a crushing ground shockwave.',
    damage: 58,
    speed: 0.72,
    range: 2.8,
    knockback: 3.5,
    effect: 'shockwave',
    projectile: null,
    modelType: 'hammer'
  },
  twin_daggers: {
    id: 'twin_daggers',
    name: 'Twin Daggers',
    type: 'melee',
    category: 'Daggers',
    icon: '🗡️',
    description: 'Paired stealth blades with rapid strike frequency.',
    damage: 15,
    speed: 0.18,
    range: 1.9,
    knockback: 0.8,
    effect: 'rapid',
    projectile: null,
    modelType: 'daggers'
  },
  wooden_bow: {
    id: 'wooden_bow',
    name: 'Wooden Bow',
    type: 'ranged',
    category: 'Bow',
    icon: '🏹',
    description: 'Fires high-speed piercing wooden arrows.',
    damage: 32,
    speed: 0.45,
    range: 15.0,
    knockback: 1.4,
    effect: 'arrow',
    projectile: 'arrow',
    modelType: 'bow'
  },
  fire_staff: {
    id: 'fire_staff',
    name: 'Fire Staff',
    type: 'magic',
    category: 'Staff',
    icon: '🔥',
    description: 'Hurls an explosive fireball that ignites area enemies.',
    damage: 48,
    speed: 0.58,
    range: 14.0,
    knockback: 2.2,
    effect: 'explosion',
    projectile: 'fireball',
    modelType: 'staff'
  },
  frost_blade: {
    id: 'frost_blade',
    name: 'Frost Blade',
    type: 'melee',
    category: 'Sword',
    icon: '❄️',
    description: 'Chills targets on hit, slowing movement speed by 50%.',
    damage: 30,
    speed: 0.38,
    range: 2.4,
    knockback: 1.8,
    effect: 'frost_slow',
    projectile: null,
    modelType: 'frost_sword'
  },
  thunder_axe: {
    id: 'thunder_axe',
    name: 'Thunder Axe',
    type: 'melee',
    category: 'Axe',
    icon: '⚡',
    description: 'Arcing lightning strikes up to 3 nearby enemies.',
    damage: 42,
    speed: 0.48,
    range: 2.5,
    knockback: 2.0,
    effect: 'chain_lightning',
    projectile: null,
    modelType: 'thunder_axe'
  }
};

const ARMOR = {
  iron_helm: { id: 'iron_helm', slot: 'head', name: 'Iron Helmet', icon: '🪖', defense: 6, hp: 30 },
  obsidian_helm: { id: 'obsidian_helm', slot: 'head', name: 'Obsidian Visor', icon: '👑', defense: 14, hp: 70 },
  frost_crown: { id: 'frost_crown', slot: 'head', name: 'Frost Crown', icon: '❄️', defense: 10, hp: 50 },
  
  leather_vest: { id: 'leather_vest', slot: 'chest', name: 'Reinforced Vest', icon: '🦺', defense: 8, hp: 45 },
  steel_cuirass: { id: 'steel_cuirass', slot: 'chest', name: 'Steel Cuirass', icon: '🛡️', defense: 16, hp: 80 },
  obsidian_plate: { id: 'obsidian_plate', slot: 'chest', name: 'Titan Obsidian Plate', icon: '🥋', defense: 26, hp: 140 },

  leather_boots: { id: 'leather_boots', slot: 'boots', name: 'Scout Boots', icon: '🥾', defense: 4, speed: 0.4 },
  iron_greaves: { id: 'iron_greaves', slot: 'boots', name: 'Iron Greaves', icon: '👢', defense: 9, speed: 0.2 },
  swift_striders: { id: 'swift_striders', slot: 'boots', name: 'Swift Striders', icon: '👟', defense: 12, speed: 0.8 },

  ring_vigor: { id: 'ring_vigor', slot: 'artifact', name: 'Ring of Vigor', icon: '💍', hpRegen: 3, hp: 40 },
  ruby_fury: { id: 'ruby_fury', slot: 'artifact', name: 'Ruby of Fury', icon: '💎', critChance: 0.2, damage: 10 },
  amulet_thunder: { id: 'amulet_thunder', slot: 'artifact', name: 'Storm Amulet', icon: '🧿', damage: 12, speed: 0.3 }
};

const ENEMIES_DATA = {
  goblin: {
    id: 'goblin',
    name: 'Goblin Scout',
    hp: 60,
    damage: 10,
    speed: 4.8,
    attackRange: 1.5,
    attackCooldown: 1.1,
    detectRadius: 13,
    xp: 25,
    model: 'goblin',
    color: '#388E3C',
    type: 'melee'
  },
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton Archer',
    hp: 75,
    damage: 14,
    speed: 3.2,
    attackRange: 10.0,
    preferredDist: 7.0,
    attackCooldown: 1.7,
    detectRadius: 15,
    xp: 35,
    model: 'skeleton',
    color: '#ECEFF1',
    type: 'ranged'
  },
  stone_guardian: {
    id: 'stone_guardian',
    name: 'Stone Guardian',
    hp: 190,
    damage: 22,
    speed: 2.2,
    defense: 8,
    attackRange: 2.0,
    attackCooldown: 1.8,
    detectRadius: 12,
    xp: 65,
    model: 'stone_guardian',
    color: '#78909C',
    type: 'tank'
  },
  shadow_creature: {
    id: 'shadow_creature',
    name: 'Shadow Creature',
    hp: 110,
    damage: 24,
    speed: 5.5,
    attackRange: 1.6,
    attackCooldown: 1.4,
    detectRadius: 14,
    teleportCooldown: 4.5,
    xp: 55,
    model: 'shadow',
    color: '#311B92',
    type: 'teleporter'
  },
  dungeon_brute: {
    id: 'dungeon_brute',
    name: 'Dungeon Brute',
    hp: 300,
    damage: 32,
    speed: 3.5,
    defense: 12,
    attackRange: 2.4,
    attackCooldown: 1.9,
    detectRadius: 14,
    xp: 120,
    model: 'brute',
    color: '#BF360C',
    type: 'elite'
  },
  boss_obsidian_titan: {
    id: 'boss_obsidian_titan',
    name: 'THE OBSIDIAN TITAN',
    subtitle: 'Ancient Colossus of the Core',
    hp: 950,
    damage: 45,
    speed: 2.8,
    defense: 16,
    attackRange: 3.4,
    attackCooldown: 2.0,
    detectRadius: 30,
    xp: 500,
    model: 'obsidian_titan',
    color: '#1A1829',
    type: 'boss'
  }
};

const DUNGEONS_DATA = [
  {
    id: 'dungeon_1',
    name: 'Crypt of the Forgotten',
    theme: 'ancient_stone',
    description: 'Mossy stone catacombs teeming with ravenous goblins and skeleton archers.',
    icon: '🏰',
    recommendedLevel: 1,
    floors: 2,
    ambientLight: 0x5a5565,
    fogColor: 0x15131e,
    floorColor: 0x3d3a47,
    wallColor: 0x524e61,
    accentColor: 0xff8c00, // Torches
    enemies: ['goblin', 'skeleton', 'stone_guardian'],
    bossType: 'dungeon_brute',
    bossName: 'CATACOMB BRUTE'
  },
  {
    id: 'dungeon_2',
    name: 'Dark Forest Ruins',
    theme: 'dark_forest',
    description: 'Overgrown temple ruins shrouded in mystical mist and shadow stalkers.',
    icon: '🌲',
    recommendedLevel: 3,
    floors: 2,
    ambientLight: 0x3c5545,
    fogColor: 0x0f1c13,
    floorColor: 0x273b2c,
    wallColor: 0x3c5943,
    accentColor: 0x00e676, // Green flame
    enemies: ['goblin', 'shadow_creature', 'stone_guardian'],
    bossType: 'dungeon_brute',
    bossName: 'TEMPLE WARDEN'
  },
  {
    id: 'dungeon_3',
    name: 'Frostbite Citadel',
    theme: 'frozen_fortress',
    description: 'Glacial underground halls guarded by the legendary Obsidian Titan.',
    icon: '❄️',
    recommendedLevel: 5,
    floors: 3,
    ambientLight: 0x48647a,
    fogColor: 0x0c1926,
    floorColor: 0x243b4f,
    wallColor: 0x3b5f7e,
    accentColor: 0x00e5ff, // Cyan ice light
    enemies: ['skeleton', 'shadow_creature', 'dungeon_brute', 'stone_guardian'],
    bossType: 'boss_obsidian_titan',
    bossName: 'THE OBSIDIAN TITAN'
  }
];
