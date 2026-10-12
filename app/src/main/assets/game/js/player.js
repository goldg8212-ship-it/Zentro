// ==========================================
// BLOCK DUNGEON LEGENDS - HERO PLAYER CONTROLLER
// ==========================================

class Player {
  constructor(scene, particles, combat) {
    this.scene = scene;
    this.particles = particles;
    this.combat = combat;

    // Load saved data
    const save = window.SaveManager.data;
    this.level = save.player.level || 1;
    this.xp = save.player.xp || 0;
    this.maxXp = save.player.maxXp || 100;
    this.maxHp = (save.player.maxHp || 150) + (this.level - 1) * 20;
    this.hp = this.maxHp;
    this.gold = save.player.gold || 50;
    this.potions = save.player.potions || 3;
    this.maxPotions = 5;

    // State
    this.alive = true;
    this.isDodging = false;
    this.dodgeCooldown = 1.2;
    this.dodgeTimer = 1.2;
    this.dodgeDuration = 0.35;
    this.dodgeElapsed = 0;
    this.dodgeVelocity = new THREE.Vector3();

    this.attackCooldown = 0.35;
    this.attackTimer = 0.35;
    this.isAttacking = false;

    this.potionCooldown = 8.0;
    this.potionTimer = 8.0;

    this.abilityCooldown = 7.0;
    this.abilityTimer = 7.0;

    this.baseSpeed = 6.2;
    this.velocity = new THREE.Vector3();
    this.animTime = 0;

    // Build Model
    this.modelObj = window.ModelBuilder.createHero();
    this.group = this.modelObj.root;
    this.scene.add(this.group);

    // Equip default weapon model
    this.equippedWeapon = null;
    this.weaponMesh = null;
    this.updateEquippedWeapon();
  }

  updateEquippedWeapon() {
    const weaponData = window.SaveManager.data.equipped.weapon;
    const def = window.WEAPONS[weaponData?.id || 'iron_sword'] || window.WEAPONS.iron_sword;
    this.equippedWeapon = def;
    this.attackCooldown = def.speed;

    // Remove old weapon mesh from socket
    if (this.weaponMesh) {
      this.modelObj.weaponSocket.remove(this.weaponMesh);
      this.weaponMesh = null;
    }

    // Attach new weapon mesh
    this.weaponMesh = window.ModelBuilder.createWeapon(def.id);
    this.modelObj.weaponSocket.add(this.weaponMesh);
  }

  getAttackDamage() {
    const base = this.equippedWeapon?.damage || 20;
    const levelBonus = (this.level - 1) * 4;
    const artifact = window.SaveManager.data.equipped.artifact;
    const artifactBonus = artifact ? (window.ARMOR[artifact.id]?.damage || 0) : 0;
    const rarity = window.SaveManager.data.equipped.weapon?.rarity || 'COMMON';
    const mult = window.RARITY[rarity]?.mult || 1.0;

    return Math.round((base + levelBonus + artifactBonus) * mult);
  }

  getDefense() {
    let def = 0;
    const equipped = window.SaveManager.data.equipped;
    for (const slot of ['head', 'chest', 'boots', 'artifact']) {
      const item = equipped[slot];
      if (item) {
        const itemDef = window.ARMOR[item.id];
        if (itemDef?.defense) {
          const rarity = item.rarity || 'COMMON';
          def += Math.round(itemDef.defense * (window.RARITY[rarity]?.mult || 1.0));
        }
      }
    }
    return def;
  }

  getSpeed() {
    let bonus = 0;
    const boots = window.SaveManager.data.equipped.boots;
    if (boots) {
      const def = window.ARMOR[boots.id];
      if (def?.speed) bonus += def.speed;
    }
    return this.baseSpeed + bonus;
  }

  getCritChance() {
    let crit = 0.08; // 8% base
    const artifact = window.SaveManager.data.equipped.artifact;
    if (artifact && window.ARMOR[artifact.id]?.critChance) {
      crit += window.ARMOR[artifact.id].critChance;
    }
    return crit;
  }

  update(dt, inputVector, dungeon) {
    if (!this.alive) return;

    // Cooldown clocks
    this.attackTimer += dt;
    this.dodgeTimer += dt;
    this.potionTimer += dt;
    this.abilityTimer += dt;

    // Dodge Roll Processing
    if (this.isDodging) {
      this.dodgeElapsed += dt;
      this.group.position.addScaledVector(this.dodgeVelocity, dt);
      this.group.rotation.y += dt * 16.0; // spinning roll

      // Particle trail
      if (Math.random() < 0.6) {
        this.particles.spawnHitSparks(this.group.position, 0x80d8ff, 2);
      }

      if (this.dodgeElapsed >= this.dodgeDuration) {
        this.isDodging = false;
        this.group.rotation.x = 0;
      }
      return;
    }

    // Normal Movement
    const isMoving = inputVector.lengthSq() > 0.01;

    if (isMoving) {
      const speed = this.getSpeed();
      const moveX = inputVector.x * speed * dt;
      const moveZ = inputVector.y * speed * dt; // inputVector.y is forward/back axis

      const nextX = this.group.position.x + moveX;
      const nextZ = this.group.position.z + moveZ;

      // Dungeon wall collisions
      const tileX = Math.round(nextX / dungeon.tileSize);
      const tileZ = Math.round(nextZ / dungeon.tileSize);

      if (!dungeon.isWall(tileX, tileZ)) {
        this.group.position.x = nextX;
        this.group.position.z = nextZ;
      } else {
        // Slide on walls
        const canX = !dungeon.isWall(tileX, Math.round(this.group.position.z / dungeon.tileSize));
        const canZ = !dungeon.isWall(Math.round(this.group.position.x / dungeon.tileSize), tileZ);
        if (canX) this.group.position.x = nextX;
        if (canZ) this.group.position.z = nextZ;
      }

      // Smooth rotation towards movement direction
      const angle = Math.atan2(inputVector.x, inputVector.y);
      this.group.rotation.y = angle;

      this.animateRun(dt);
    } else {
      this.animateIdle(dt);
    }
  }

  dodge(inputVector) {
    if (!this.alive || this.isDodging || this.dodgeTimer < this.dodgeCooldown) return;

    this.isDodging = true;
    this.dodgeTimer = 0;
    this.dodgeElapsed = 0;

    let dir;
    if (inputVector && inputVector.lengthSq() > 0.05) {
      dir = new THREE.Vector3(inputVector.x, 0, inputVector.y).normalize();
    } else {
      dir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.group.rotation.y);
    }

    this.dodgeVelocity.copy(dir).multiplyScalar(13.0); // fast leap
    window.Sound.playDodge();
  }

  performAttack(enemies) {
    if (!this.alive || this.isDodging || this.attackTimer < this.attackCooldown) return;
    this.attackTimer = 0;

    const weapon = this.equippedWeapon;
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.group.rotation.y);

    // Arm swing animation
    this.modelObj.rightArmPivot.rotation.x = -1.6;
    setTimeout(() => {
      if (this.alive && this.modelObj.rightArmPivot) {
        this.modelObj.rightArmPivot.rotation.x = 0;
      }
    }, 180);

    if (weapon.type === 'ranged' || weapon.type === 'magic') {
      // Ranged projectile
      if (weapon.projectile === 'arrow') {
        window.Sound.playArrowShoot();
        this.combat.spawnProjectile({
          type: 'arrow',
          origin: this.group.position,
          direction: forward,
          speed: 18.0,
          damage: this.getAttackDamage(),
          range: weapon.range,
          isPlayer: true
        });
      } else if (weapon.projectile === 'fireball') {
        window.Sound.playFireball();
        this.combat.spawnProjectile({
          type: 'fireball',
          origin: this.group.position,
          direction: forward,
          speed: 15.0,
          damage: this.getAttackDamage(),
          range: weapon.range,
          isPlayer: true
        });
      }
    } else {
      // Melee Swing
      if (weapon.id === 'heavy_hammer') {
        window.Sound.playHeavyHammer();
        this.particles.spawnShockwave(this.group.position, 0xffa000);
      } else {
        window.Sound.playSlash();
      }

      // Check melee arc
      const hitRange = weapon.range;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const toEnemy = enemy.group.position.clone().sub(this.group.position);
        const dist = toEnemy.length();

        if (dist <= hitRange) {
          // Check forward arc (within ~110 degrees) or hammer 360 AoE
          const dot = forward.dot(toEnemy.clone().normalize());
          if (dot > 0.25 || weapon.id === 'heavy_hammer') {
            this.combat.handlePlayerHitEnemy(this, enemy, this.getAttackDamage(), weapon.id);
          }
        }
      }
    }
  }

  performSpecialAbility(enemies) {
    if (!this.alive || this.abilityTimer < this.abilityCooldown) return;
    this.abilityTimer = 0;

    // WHIRLWIND / THUNDER CLEAVE 360 AOE
    window.Sound.playHeavyHammer();
    this.particles.spawnShockwave(this.group.position, 0x00e5ff);
    this.particles.spawnExplosion(this.group.position, 2.5);

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = this.group.position.distanceTo(enemy.group.position);
      if (dist <= 4.2) {
        const abilityDmg = Math.round(this.getAttackDamage() * 1.7);
        this.combat.handlePlayerHitEnemy(this, enemy, abilityDmg, 'thunder_axe');
      }
    }
  }

  usePotion() {
    if (!this.alive || this.potions <= 0 || this.potionTimer < this.potionCooldown) return false;
    if (this.hp >= this.maxHp) return false;

    this.potions--;
    this.potionTimer = 0;
    const healAmount = Math.round(this.maxHp * 0.55);
    this.hp = Math.min(this.maxHp, this.hp + healAmount);

    window.Sound.playPotion();
    this.particles.spawnHealSparkles(this.group.position);
    this.particles.spawnFloatingNumber(this.group.position, `+${healAmount} HP`, '#00e676');

    window.SaveManager.data.player.potions = this.potions;
    window.SaveManager.save();
    return true;
  }

  takeDamage(amount, fromDir) {
    if (!this.alive || this.isDodging) return;

    this.hp -= amount;

    // Flinch flash
    if (this.modelObj.torso?.material) {
      const orig = this.modelObj.torso.material.color.getHex();
      this.modelObj.torso.material.color.setHex(0xff1744);
      setTimeout(() => {
        if (this.modelObj.torso?.material) {
          this.modelObj.torso.material.color.setHex(orig);
        }
      }, 120);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  addXp(amount) {
    this.xp += amount;
    while (this.xp >= this.maxXp) {
      this.xp -= this.maxXp;
      this.levelUp();
    }
    window.SaveManager.data.player.xp = this.xp;
    window.SaveManager.save();
  }

  levelUp() {
    this.level++;
    this.maxXp = Math.round(this.maxXp * 1.45);
    this.maxHp += 20;
    this.hp = this.maxHp;

    window.Sound.playLevelUp();
    this.particles.spawnShockwave(this.group.position, 0xffd54f);
    this.particles.spawnHealSparkles(this.group.position);
    this.particles.spawnFloatingNumber(this.group.position, `LEVEL UP! Lv.${this.level}`, '#ffd54f', true);

    window.SaveManager.data.player.level = this.level;
    window.SaveManager.data.player.maxHp = this.maxHp;
    window.SaveManager.data.player.maxXp = this.maxXp;
    window.SaveManager.save();
  }

  onKillEnemy(enemy) {
    // Collect XP
    this.addXp(enemy.def.xp || 30);

    // Collect Gold
    const goldEarned = Math.floor(Math.random() * 15) + (enemy.isBoss ? 80 : 8);
    this.gold += goldEarned;
    window.SaveManager.data.player.gold = this.gold;
    window.Sound.playCoin();
    this.particles.spawnFloatingNumber(enemy.group.position, `+${goldEarned} 🪙`, '#ffd54f');

    // Loot Drop Chance
    const dropRoll = Math.random();
    if (enemy.isBoss || dropRoll < 0.35) {
      this.rollLootDrop(enemy.isBoss);
    }
  }

  rollLootDrop(guaranteedHighTier = false) {
    const allWeaponKeys = Object.keys(window.WEAPONS);
    const allArmorKeys = Object.keys(window.ARMOR);
    const isWeapon = Math.random() < 0.55;
    const itemId = isWeapon
      ? allWeaponKeys[Math.floor(Math.random() * allWeaponKeys.length)]
      : allArmorKeys[Math.floor(Math.random() * allArmorKeys.length)];

    let rarity = 'COMMON';
    const rRoll = Math.random();
    if (guaranteedHighTier) {
      rarity = rRoll < 0.4 ? 'LEGENDARY' : 'EPIC';
    } else if (rRoll < 0.08) {
      rarity = 'LEGENDARY';
    } else if (rRoll < 0.28) {
      rarity = 'EPIC';
    } else if (rRoll < 0.65) {
      rarity = 'RARE';
    }

    const newItem = { id: itemId, rarity };
    if (window.SaveManager.data.inventory.length < 24) {
      window.SaveManager.data.inventory.push(newItem);
      window.SaveManager.save();
      const itemName = window.WEAPONS[itemId]?.name || window.ARMOR[itemId]?.name || 'Loot';
      this.particles.spawnFloatingNumber(this.group.position, `[${rarity}] ${itemName}`, window.RARITY[rarity].color);
    }
  }

  animateRun(dt) {
    this.animTime += dt * 11.0;
    const sin = Math.sin(this.animTime);

    this.modelObj.rightLegPivot.rotation.x = sin * 0.7;
    this.modelObj.leftLegPivot.rotation.x = -sin * 0.7;
    this.modelObj.leftArmPivot.rotation.x = sin * 0.55;
    this.modelObj.torso.position.y = 1.15 + Math.abs(sin) * 0.07;
  }

  animateIdle(dt) {
    this.animTime += dt * 3.0;
    const sin = Math.sin(this.animTime);

    this.modelObj.rightLegPivot.rotation.x *= 0.85;
    this.modelObj.leftLegPivot.rotation.x *= 0.85;
    this.modelObj.leftArmPivot.rotation.x *= 0.85;
    this.modelObj.torso.position.y = 1.15 + sin * 0.03;
  }

  die() {
    this.alive = false;
    window.Sound.playMonsterDeath();
    this.particles.spawnHitSparks(this.group.position, 0xff1744, 20);

    // Fall backwards
    let t = 0;
    const interval = setInterval(() => {
      this.group.rotation.x -= 0.15;
      this.group.position.y -= 0.04;
      t += 0.1;
      if (t > 1.2) {
        clearInterval(interval);
        if (window.UI) window.UI.showDefeatModal();
      }
    }, 40);
  }

  respawn(spawnPos) {
    this.alive = true;
    this.hp = this.maxHp;
    this.group.rotation.set(0, 0, 0);
    this.group.position.copy(spawnPos);
    this.particles.spawnHealSparkles(this.group.position);
  }
}

window.Player = Player;
