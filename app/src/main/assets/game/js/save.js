// ==========================================
// BLOCK DUNGEON LEGENDS - SAVE & PERSISTENCE
// ==========================================

const SAVE_KEY = 'BLOCK_DUNGEON_LEGENDS_SAVE_V1';

const DEFAULT_SAVE = {
  version: 1,
  player: {
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 150,
    maxHp: 150,
    gold: 50,
    potions: 3,
    maxPotions: 5,
    kills: 0,
    dungeonsCleared: 0
  },
  equipped: {
    weapon: { id: 'iron_sword', rarity: 'COMMON' },
    head: null,
    chest: { id: 'leather_vest', rarity: 'COMMON' },
    boots: { id: 'leather_boots', rarity: 'COMMON' },
    artifact: null
  },
  inventory: [
    { id: 'wooden_bow', rarity: 'COMMON' },
    { id: 'iron_helm', rarity: 'COMMON' }
  ],
  unlockedDungeons: ['dungeon_1'],
  settings: {
    graphics: 'high', // 'low', 'medium', 'high'
    renderScale: 1.0,
    sfxVolume: 0.8,
    musicVolume: 0.6,
    soundMuted: false,
    cameraAngle: 'iso' // 'iso' or 'top'
  }
};

class SaveSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults to guarantee all schema fields exist
        return {
          ...DEFAULT_SAVE,
          ...parsed,
          player: { ...DEFAULT_SAVE.player, ...(parsed.player || {}) },
          equipped: { ...DEFAULT_SAVE.equipped, ...(parsed.equipped || {}) },
          settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) },
          unlockedDungeons: parsed.unlockedDungeons || DEFAULT_SAVE.unlockedDungeons,
          inventory: parsed.inventory || DEFAULT_SAVE.inventory
        };
      }
    } catch (e) {
      console.warn('Could not read save from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  reset() {
    try {
      localStorage.removeItem(SAVE_KEY);
      this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
      this.save();
      return true;
    } catch (e) {
      return false;
    }
  }

  unlockDungeon(dungeonId) {
    if (!this.data.unlockedDungeons.includes(dungeonId)) {
      this.data.unlockedDungeons.push(dungeonId);
      this.save();
    }
  }
}

window.SaveManager = new SaveSystem();
