// ==========================================
// BLOCK DUNGEON LEGENDS - TOUCH CONTROLS & MOBILE UI
// Full landscape UI with Virtual Joystick & Multitouch
// ==========================================

class UIManager {
  constructor() {
    this.joystickVector = new THREE.Vector2(0, 0); // (x: -1..1, y: -1..1)
    this.joystickTouchId = null;
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickKnob = document.getElementById('joystick-knob');
    this.joystickZone = document.getElementById('joystick-zone');

    this.selectedItem = null;
    this.initJoystick();
    this.initActionButtons();
    this.initMenuButtons();
    this.initModals();
  }

  // --- VIRTUAL JOYSTICK (LEFT THUMB) ---
  initJoystick() {
    if (!this.joystickZone) return;

    const handleStart = (clientX, clientY, identifier) => {
      this.joystickTouchId = identifier;
      const rect = this.joystickZone.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      this.updateJoystick(clientX, clientY, centerX, centerY);
    };

    const handleMove = (clientX, clientY) => {
      const rect = this.joystickZone.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.updateJoystick(clientX, clientY, centerX, centerY);
    };

    const handleEnd = () => {
      this.joystickTouchId = null;
      this.joystickVector.set(0, 0);
      if (this.joystickKnob) {
        this.joystickKnob.style.transform = `translate(0px, 0px)`;
      }
    };

    // Touch events for mobile
    this.joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.joystickTouchId !== null) return;
      const touch = e.changedTouches[0];
      handleStart(touch.clientX, touch.clientY, touch.identifier);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.joystickTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          e.preventDefault();
          handleMove(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (this.joystickTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          handleEnd();
          break;
        }
      }
    });

    window.addEventListener('touchcancel', (e) => {
      handleEnd();
    });

    // Mouse fallback for browser testing
    let isMouseDown = false;
    this.joystickZone.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      handleStart(e.clientX, e.clientY, 'mouse');
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) handleMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        handleEnd();
      }
    });
  }

  updateJoystick(clientX, clientY, centerX, centerY) {
    const maxRadius = 45; // pixels
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    if (this.joystickKnob) {
      this.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    // Isometric screen mapping:
    // In isometric view (camera angled 45 degrees), up-right is world -Z, down-left is world +Z
    // Map screen dx/dy to world X and Z at 45 degree rotation
    const normX = dx / maxRadius;
    const normY = dy / maxRadius;

    const angle = -Math.PI / 4; // rotate 45 degrees for isometric projection
    const isoX = normX * Math.cos(angle) - normY * Math.sin(angle);
    const isoY = normX * Math.sin(angle) + normY * Math.cos(angle);

    this.joystickVector.set(isoX, isoY);
  }

  // --- ACTION BUTTONS (RIGHT THUMB) ---
  initActionButtons() {
    const bindBtn = (id, callback) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        callback();
      }, { passive: false });

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        callback();
      });
    };

    // Attack
    bindBtn('btn-attack', () => {
      const game = window.GameInstance;
      if (game?.player && game.player.alive) {
        game.player.performAttack(game.enemies);
      }
    });

    // Dodge / Roll
    bindBtn('btn-dodge', () => {
      const game = window.GameInstance;
      if (game?.player && game.player.alive) {
        game.player.dodge(this.joystickVector);
      }
    });

    // Ranged / Bow Button
    bindBtn('btn-bow', () => {
      const game = window.GameInstance;
      if (game?.player && game.player.alive) {
        // Temporarily fire ranged arrow if bow equipped, or wooden bow shot
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), game.player.group.rotation.y);
        window.Sound.playArrowShoot();
        game.combat.spawnProjectile({
          type: 'arrow',
          origin: game.player.group.position,
          direction: forward,
          speed: 18.0,
          damage: Math.round(game.player.getAttackDamage() * 0.9),
          range: 15.0,
          isPlayer: true
        });
      }
    });

    // Potion Button
    bindBtn('btn-potion', () => {
      const game = window.GameInstance;
      if (game?.player) {
        game.player.usePotion();
        this.updateHUD(game.player);
      }
    });

    // Special Ability Button
    bindBtn('btn-ability', () => {
      const game = window.GameInstance;
      if (game?.player && game.player.alive) {
        game.player.performSpecialAbility(game.enemies);
      }
    });

    // Interact / Chest button
    bindBtn('btn-interact', () => {
      const game = window.GameInstance;
      if (game?.player && game.dungeon) {
        const openedChest = game.dungeon.checkChestInteract(game.player.group.position);
        if (openedChest) {
          game.player.rollLootDrop(openedChest.rarity === 'LEGENDARY');
        } else if (game.dungeon.checkExitPortal(game.player.group.position)) {
          game.onFloorCompleted();
        }
      }
    });
  }

  // --- TOP HUD BUTTONS & MENUS ---
  initMenuButtons() {
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      this.openModal('pause-modal');
    });

    document.getElementById('btn-inventory-hud')?.addEventListener('click', () => {
      this.openInventory();
    });

    document.getElementById('btn-main-play')?.addEventListener('click', () => {
      window.Sound.init();
      window.Sound.resume();
      this.hideMainMenu();
      window.GameInstance?.startDungeon(window.SaveManager.data.unlockedDungeons[0] || 'dungeon_1');
    });

    document.getElementById('btn-main-dungeons')?.addEventListener('click', () => {
      this.openDungeonSelect();
    });

    document.getElementById('btn-main-inv')?.addEventListener('click', () => {
      this.openInventory();
    });

    document.getElementById('btn-main-settings')?.addEventListener('click', () => {
      this.openSettings();
    });
  }

  initModals() {
    // Close modal buttons
    document.querySelectorAll('.close-modal-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const modalId = btn.getAttribute('data-close');
        if (modalId) this.closeModal(modalId);
      });
    });

    // Pause menu buttons
    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this.closeModal('pause-modal');
    });
    document.getElementById('btn-pause-settings')?.addEventListener('click', () => {
      this.closeModal('pause-modal');
      this.openSettings();
    });
    document.getElementById('btn-quit-main')?.addEventListener('click', () => {
      this.closeModal('pause-modal');
      this.showMainMenu();
      window.GameInstance?.clearLevel();
    });

    // Victory modal
    document.getElementById('btn-victory-continue')?.addEventListener('click', () => {
      this.closeModal('victory-modal');
      this.openDungeonSelect();
    });

    // Defeat modal
    document.getElementById('btn-defeat-retry')?.addEventListener('click', () => {
      this.closeModal('defeat-modal');
      window.GameInstance?.retryCurrentFloor();
    });
    document.getElementById('btn-defeat-main')?.addEventListener('click', () => {
      this.closeModal('defeat-modal');
      this.showMainMenu();
      window.GameInstance?.clearLevel();
    });

    // Settings actions
    document.getElementById('setting-graphics')?.addEventListener('change', (e) => {
      window.SaveManager.data.settings.graphics = e.target.value;
      window.SaveManager.save();
      window.GameInstance?.applyGraphicsSettings();
    });

    document.getElementById('setting-sfx')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      window.SaveManager.data.settings.sfxVolume = val;
      window.Sound.setSfxVolume(val);
      window.SaveManager.save();
    });

    document.getElementById('setting-music')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      window.SaveManager.data.settings.musicVolume = val;
      window.Sound.setMusicVolume(val);
      window.SaveManager.save();
    });

    document.getElementById('setting-mute')?.addEventListener('change', (e) => {
      const muted = e.target.checked;
      window.SaveManager.data.settings.soundMuted = muted;
      window.Sound.setMute(muted);
      window.SaveManager.save();
    });

    document.getElementById('btn-reset-save')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all game progress?')) {
        window.SaveManager.reset();
        alert('Save game progress reset.');
        location.reload();
      }
    });
  }

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  }

  showMainMenu() {
    document.getElementById('main-menu')?.classList.remove('hidden');
    document.getElementById('game-hud')?.classList.add('hidden');
  }

  hideMainMenu() {
    document.getElementById('main-menu')?.classList.add('hidden');
    document.getElementById('game-hud')?.classList.remove('hidden');
  }

  // --- INVENTORY MODAL ---
  openInventory() {
    this.renderInventory();
    this.openModal('inventory-modal');
  }

  renderInventory() {
    const save = window.SaveManager.data;
    const equipped = save.equipped;
    const inventory = save.inventory;

    // Render Equipped slots
    ['weapon', 'head', 'chest', 'boots', 'artifact'].forEach((slot) => {
      const slotEl = document.getElementById(`slot-${slot}`);
      if (!slotEl) return;
      slotEl.innerHTML = '';

      const item = equipped[slot];
      if (item) {
        const def = slot === 'weapon' ? window.WEAPONS[item.id] : window.ARMOR[item.id];
        const rarity = window.RARITY[item.rarity || 'COMMON'];
        slotEl.innerHTML = `
          <div class="item-card" style="border-color:${rarity.color};">
            <span class="item-icon">${def?.icon || '🛡️'}</span>
            <span class="item-name" style="color:${rarity.color};">${def?.name || item.id}</span>
          </div>
        `;
        slotEl.onclick = () => this.showItemDetails(item, slot, true);
      } else {
        slotEl.innerHTML = `<span class="empty-slot-label">${slot.toUpperCase()}</span>`;
        slotEl.onclick = null;
      }
    });

    // Render Backpack Grid (24 slots)
    const grid = document.getElementById('backpack-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < 24; i++) {
      const slotDiv = document.createElement('div');
      slotDiv.className = 'grid-slot';
      const item = inventory[i];

      if (item) {
        const isWeapon = window.WEAPONS[item.id] !== undefined;
        const def = isWeapon ? window.WEAPONS[item.id] : window.ARMOR[item.id];
        const rarity = window.RARITY[item.rarity || 'COMMON'];
        slotDiv.style.borderColor = rarity.color;
        slotDiv.innerHTML = `
          <span class="slot-icon">${def?.icon || '📦'}</span>
          <span class="slot-rarity-dot" style="background:${rarity.color};"></span>
        `;
        slotDiv.onclick = () => this.showItemDetails(item, i, false);
      } else {
        slotDiv.innerHTML = `<span class="empty-dot"></span>`;
      }
      grid.appendChild(slotDiv);
    }

    // Player stats summary in inventory
    const p = window.GameInstance?.player;
    if (p) {
      document.getElementById('inv-stat-hp').innerText = `${p.hp} / ${p.maxHp}`;
      document.getElementById('inv-stat-dmg').innerText = `${p.getAttackDamage()}`;
      document.getElementById('inv-stat-def').innerText = `${p.getDefense()}`;
      document.getElementById('inv-stat-speed').innerText = `${p.getSpeed().toFixed(1)}`;
      document.getElementById('inv-stat-gold').innerText = `${p.gold}`;
    }
  }

  showItemDetails(item, slotOrIndex, isEquipped) {
    const isWeapon = window.WEAPONS[item.id] !== undefined;
    const def = isWeapon ? window.WEAPONS[item.id] : window.ARMOR[item.id];
    const rarity = window.RARITY[item.rarity || 'COMMON'];

    const detailBox = document.getElementById('item-detail-view');
    if (!detailBox) return;

    let statLines = '';
    if (isWeapon) {
      statLines += `<p>Damage: <b>${Math.round(def.damage * rarity.mult)}</b></p>`;
      statLines += `<p>Speed: <b>${def.speed}s</b></p>`;
      statLines += `<p>Effect: <b>${def.effect}</b></p>`;
    } else {
      if (def.defense) statLines += `<p>Defense: <b>+${Math.round(def.defense * rarity.mult)}</b></p>`;
      if (def.hp) statLines += `<p>Max HP: <b>+${Math.round(def.hp * rarity.mult)}</b></p>`;
      if (def.speed) statLines += `<p>Speed: <b>+${def.speed}</b></p>`;
      if (def.critChance) statLines += `<p>Crit Chance: <b>+${Math.round(def.critChance * 100)}%</b></p>`;
    }

    detailBox.innerHTML = `
      <div class="detail-header" style="color:${rarity.color}">
        <h3>${def.icon} ${def.name}</h3>
        <span class="rarity-tag" style="background:${rarity.color}">${rarity.name}</span>
      </div>
      <p class="item-desc">${def.description || ''}</p>
      <div class="stats-list">${statLines}</div>
      <div class="action-buttons-row">
        ${isEquipped 
          ? `<button id="btn-unequip-item" class="btn-action">UNEQUIP</button>` 
          : `<button id="btn-equip-item" class="btn-action btn-gold">EQUIP</button>`}
        ${!isEquipped ? `<button id="btn-scrap-item" class="btn-action btn-danger">SCRAP (+15🪙)</button>` : ''}
      </div>
    `;

    document.getElementById('btn-equip-item')?.addEventListener('click', () => {
      this.equipItem(slotOrIndex);
    });

    document.getElementById('btn-unequip-item')?.addEventListener('click', () => {
      this.unequipItem(slotOrIndex);
    });

    document.getElementById('btn-scrap-item')?.addEventListener('click', () => {
      this.scrapItem(slotOrIndex);
    });
  }

  equipItem(inventoryIndex) {
    const save = window.SaveManager.data;
    const item = save.inventory[inventoryIndex];
    if (!item) return;

    const isWeapon = window.WEAPONS[item.id] !== undefined;
    const slot = isWeapon ? 'weapon' : window.ARMOR[item.id]?.slot;

    if (!slot) return;

    // Swap item
    const currentlyEquipped = save.equipped[slot];
    save.equipped[slot] = item;
    if (currentlyEquipped) {
      save.inventory[inventoryIndex] = currentlyEquipped;
    } else {
      save.inventory.splice(inventoryIndex, 1);
    }

    window.SaveManager.save();
    window.Sound.playCoin();

    // Update player model & stats
    if (window.GameInstance?.player) {
      window.GameInstance.player.updateEquippedWeapon();
    }
    this.renderInventory();
    this.updateHUD(window.GameInstance?.player);
  }

  unequipItem(slot) {
    const save = window.SaveManager.data;
    if (save.inventory.length >= 24) {
      alert('Backpack is full!');
      return;
    }

    const item = save.equipped[slot];
    if (!item) return;

    save.equipped[slot] = null;
    save.inventory.push(item);
    window.SaveManager.save();

    if (window.GameInstance?.player) {
      window.GameInstance.player.updateEquippedWeapon();
    }
    this.renderInventory();
    this.updateHUD(window.GameInstance?.player);
  }

  scrapItem(inventoryIndex) {
    const save = window.SaveManager.data;
    save.inventory.splice(inventoryIndex, 1);
    save.player.gold = (save.player.gold || 0) + 15;
    window.SaveManager.save();
    window.Sound.playCoin();

    document.getElementById('item-detail-view').innerHTML = '<p class="select-hint">Item scrapped for 15 gold.</p>';
    this.renderInventory();
  }

  // --- DUNGEON SELECT MODAL ---
  openDungeonSelect() {
    const list = document.getElementById('dungeon-cards-list');
    if (!list) return;
    list.innerHTML = '';

    const unlocked = window.SaveManager.data.unlockedDungeons;

    window.DUNGEONS_DATA.forEach((d) => {
      const isUnlocked = unlocked.includes(d.id);
      const card = document.createElement('div');
      card.className = `dungeon-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      card.innerHTML = `
        <div class="card-icon">${d.icon}</div>
        <div class="card-info">
          <h3>${d.name}</h3>
          <p>${d.description}</p>
          <div class="card-meta">
            <span>Req. Lv ${d.recommendedLevel}</span>
            <span>Floors: ${d.floors}</span>
            <span>Boss: ${d.bossName}</span>
          </div>
        </div>
        <button class="btn-play-dungeon ${isUnlocked ? 'btn-gold' : 'btn-disabled'}" ${!isUnlocked ? 'disabled' : ''}>
          ${isUnlocked ? 'ENTER' : 'LOCKED'}
        </button>
      `;

      if (isUnlocked) {
        card.querySelector('.btn-play-dungeon').onclick = () => {
          this.closeModal('dungeon-select-modal');
          this.hideMainMenu();
          window.GameInstance?.startDungeon(d.id);
        };
      }
      list.appendChild(card);
    });

    this.openModal('dungeon-select-modal');
  }

  // --- SETTINGS MODAL ---
  openSettings() {
    const s = window.SaveManager.data.settings;
    if (document.getElementById('setting-graphics')) document.getElementById('setting-graphics').value = s.graphics;
    if (document.getElementById('setting-sfx')) document.getElementById('setting-sfx').value = s.sfxVolume;
    if (document.getElementById('setting-music')) document.getElementById('setting-music').value = s.musicVolume;
    if (document.getElementById('setting-mute')) document.getElementById('setting-mute').checked = s.soundMuted;

    this.openModal('settings-modal');
  }

  // --- HUD UPDATES (CALLED IN TICK) ---
  updateHUD(player) {
    if (!player) return;

    // Health Bar
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    const hpBar = document.getElementById('hud-hp-fill');
    if (hpBar) hpBar.style.width = `${hpPct}%`;
    const hpText = document.getElementById('hud-hp-text');
    if (hpText) hpText.innerText = `${player.hp} / ${player.maxHp}`;

    // XP Bar & Level
    const xpPct = Math.max(0, Math.min(100, (player.xp / player.maxXp) * 100));
    const xpBar = document.getElementById('hud-xp-fill');
    if (xpBar) xpBar.style.width = `${xpPct}%`;
    const levelBadge = document.getElementById('hud-level-badge');
    if (levelBadge) levelBadge.innerText = `Lv.${player.level}`;

    // Gold
    const goldText = document.getElementById('hud-gold-text');
    if (goldText) goldText.innerText = `${player.gold}`;

    // Potions count & Cooldown
    const potionCount = document.getElementById('potion-count');
    if (potionCount) potionCount.innerText = `${player.potions}`;

    const potionCooldownOverlay = document.getElementById('potion-cooldown-overlay');
    if (potionCooldownOverlay) {
      const pcd = Math.max(0, 1.0 - player.potionTimer / player.potionCooldown);
      potionCooldownOverlay.style.height = `${pcd * 100}%`;
    }

    // Ability Cooldown
    const abilityCooldownOverlay = document.getElementById('ability-cooldown-overlay');
    if (abilityCooldownOverlay) {
      const acd = Math.max(0, 1.0 - player.abilityTimer / player.abilityCooldown);
      abilityCooldownOverlay.style.height = `${acd * 100}%`;
    }

    // Dodge Cooldown
    const dodgeCooldownOverlay = document.getElementById('dodge-cooldown-overlay');
    if (dodgeCooldownOverlay) {
      const dcd = Math.max(0, 1.0 - player.dodgeTimer / player.dodgeCooldown);
      dodgeCooldownOverlay.style.height = `${dcd * 100}%`;
    }

    // Current Weapon Icon
    const weaponDef = player.equippedWeapon;
    const weaponIcon = document.getElementById('hud-weapon-icon');
    if (weaponIcon && weaponDef) {
      weaponIcon.innerText = weaponDef.icon;
    }

    // Boss Bar
    const boss = window.GameInstance?.bossEnemy;
    const bossContainer = document.getElementById('boss-bar-container');
    if (boss && boss.alive) {
      bossContainer?.classList.remove('hidden');
      const bossPct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
      const bossFill = document.getElementById('boss-hp-fill');
      if (bossFill) bossFill.style.width = `${bossPct}%`;
      const bossTitle = document.getElementById('boss-title');
      if (bossTitle) bossTitle.innerText = boss.def.name;
    } else {
      bossContainer?.classList.add('hidden');
    }
  }

  showVictoryModal(stats) {
    document.getElementById('vic-enemies').innerText = `${stats.enemiesKilled || 0}`;
    document.getElementById('vic-gold').innerText = `${stats.goldEarned || 0}`;
    window.Sound.playLevelUp();
    this.openModal('victory-modal');
  }

  showDefeatModal() {
    this.openModal('defeat-modal');
  }
}

window.UIManager = UIManager;
