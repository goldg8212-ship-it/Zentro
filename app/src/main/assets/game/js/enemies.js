// ==========================================
// BLOCK DUNGEON LEGENDS - ENEMY AI CONTROLLER & BOSS
// ==========================================

class Enemy {
  constructor(def, scene, particles, combat, pos) {
    this.def = def;
    this.scene = scene;
    this.particles = particles;
    this.combat = combat;

    this.hp = def.hp;
    this.maxHp = def.hp;
    this.damage = def.damage;
    this.speed = def.speed;
    this.defense = def.defense || 0;
    this.detectRadius = def.detectRadius || 12;
    this.attackRange = def.attackRange || 1.8;
    this.attackCooldown = def.attackCooldown || 1.5;
    this.attackTimer = 0;
    this.isBoss = def.id === 'boss_obsidian_titan';

    this.alive = true;
    this.state = 'idle'; // idle, chase, attack, hurt, death
    this.slowTimer = 0;
    this.slowFactor = 1.0;
    this.teleportTimer = 0;
    this.bossPhase = 1;

    // Build Model
    this.modelObj = this.buildModel(def.model);
    this.group = this.modelObj.root;
    this.group.position.copy(pos);
    this.scene.add(this.group);

    // Procedural walk cycle timer
    this.animTime = Math.random() * 10;
  }

  buildModel(modelType) {
    switch (modelType) {
      case 'goblin': return window.ModelBuilder.createGoblin();
      case 'skeleton': return window.ModelBuilder.createSkeleton();
      case 'stone_guardian': return window.ModelBuilder.createStoneGuardian();
      case 'shadow': return window.ModelBuilder.createShadowCreature();
      case 'brute': return window.ModelBuilder.createDungeonBrute();
      case 'obsidian_titan': return window.ModelBuilder.createObsidianTitan();
      default: return window.ModelBuilder.createGoblin();
    }
  }

  takeDamage(amount, fromPos) {
    if (!this.alive) return false;

    this.hp -= amount;

    // Knockback
    if (!this.isBoss && fromPos) {
      const kbDir = this.group.position.clone().sub(fromPos).normalize();
      this.group.position.addScaledVector(kbDir, 0.45);
    }

    // Boss Phase 2 Check (<50% HP)
    if (this.isBoss && this.bossPhase === 1 && this.hp <= this.maxHp * 0.5) {
      this.bossPhase = 2;
      this.speed *= 1.35;
      this.damage *= 1.3;
      if (this.modelObj.aura) {
        this.modelObj.aura.material.color.setHex(0xff1744);
      }
      this.particles.spawnExplosion(this.group.position, 3.5);
      this.particles.spawnFloatingNumber(this.group.position, 'MAGMA ENRAGE!', '#ff1744', true);
      window.Sound.playHeavyHammer();
    }

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  applySlow(factor, duration) {
    this.slowFactor = factor;
    this.slowTimer = duration;
    this.particles.spawnHitSparks(this.group.position, 0x80deea, 5);
  }

  update(dt, player, dungeon) {
    if (!this.alive) return;

    this.attackTimer += dt;

    // Slow status
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowFactor = 1.0;
      }
    }

    const distToPlayer = this.group.position.distanceTo(player.group.position);

    // AI State Machine
    if (distToPlayer <= this.detectRadius && player.alive) {
      // Look at player smoothly
      const lookDir = player.group.position.clone().sub(this.group.position);
      lookDir.y = 0;
      if (lookDir.lengthSq() > 0.001) {
        const targetAngle = Math.atan2(lookDir.x, lookDir.z);
        this.group.rotation.y = targetAngle;
      }

      // Shadow Teleport Ability
      if (this.def.type === 'teleporter') {
        this.teleportTimer += dt;
        if (this.teleportTimer > 4.5 && distToPlayer > 3.0) {
          this.teleportTimer = 0;
          this.teleportBehindPlayer(player);
        }
      }

      // Attack or Chase
      if (distToPlayer <= this.attackRange) {
        if (this.attackTimer >= this.attackCooldown) {
          this.attack(player);
        }
      } else {
        // Move towards player
        this.moveTowards(player.group.position, dt, dungeon);
      }
    } else {
      this.state = 'idle';
      this.animateIdle(dt);
    }
  }

  moveTowards(targetPos, dt, dungeon) {
    const moveDir = targetPos.clone().sub(this.group.position).normalize();
    moveDir.y = 0;

    const actualSpeed = this.speed * this.slowFactor;
    const nextX = this.group.position.x + moveDir.x * actualSpeed * dt;
    const nextZ = this.group.position.z + moveDir.z * actualSpeed * dt;

    // Wall collision checks
    const tileX = Math.round(nextX / dungeon.tileSize);
    const tileZ = Math.round(nextZ / dungeon.tileSize);

    if (!dungeon.isWall(tileX, tileZ)) {
      this.group.position.x = nextX;
      this.group.position.z = nextZ;
    } else {
      // Slide along axes
      const canX = !dungeon.isWall(tileX, Math.round(this.group.position.z / dungeon.tileSize));
      const canZ = !dungeon.isWall(Math.round(this.group.position.x / dungeon.tileSize), tileZ);
      if (canX) this.group.position.x = nextX;
      if (canZ) this.group.position.z = nextZ;
    }

    this.animateWalk(dt);
  }

  teleportBehindPlayer(player) {
    this.particles.spawnExplosion(this.group.position, 1.5);
    window.Sound.playDodge();

    // Teleport 2m behind player
    const behindVec = new THREE.Vector3(0, 0, -2.0).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.group.rotation.y);
    this.group.position.copy(player.group.position).add(behindVec);
    this.particles.spawnHitSparks(this.group.position, 0xab47bc, 10);
  }

  attack(player) {
    this.attackTimer = 0;

    if (this.isBoss) {
      this.performBossAttack(player);
      return;
    }

    if (this.def.type === 'ranged') {
      // Skeleton bow shot
      const dir = player.group.position.clone().sub(this.group.position).normalize();
      this.combat.spawnProjectile({
        type: 'arrow',
        origin: this.group.position,
        direction: dir,
        speed: 13.0,
        damage: this.damage,
        range: 16.0,
        isPlayer: false,
        color: 0xcccccc
      });
      window.Sound.playArrowShoot();
    } else {
      // Melee strike
      this.combat.handleEnemyHitPlayer(player, this.damage, this.group.position);
      // Arm swing animation
      if (this.modelObj.rightArmPivot) {
        this.modelObj.rightArmPivot.rotation.x = -1.2;
        setTimeout(() => {
          if (this.alive && this.modelObj.rightArmPivot) this.modelObj.rightArmPivot.rotation.x = 0;
        }, 200);
      }
    }
  }

  performBossAttack(player) {
    const roll = Math.random();

    if (roll < 0.45) {
      // 1. Titan Ground Slam Shockwave!
      window.Sound.playHeavyHammer();
      this.particles.spawnShockwave(this.group.position, 0xff3d00);
      this.particles.spawnExplosion(this.group.position, 3.0);

      // Radial damage within 4.5m
      const dist = this.group.position.distanceTo(player.group.position);
      if (dist < 4.5) {
        this.combat.handleEnemyHitPlayer(player, this.damage, this.group.position);
      }
    } else if (roll < 0.75) {
      // 2. Rolling Boulder Toss
      const dir = player.group.position.clone().sub(this.group.position).normalize();
      this.combat.spawnProjectile({
        type: 'boulder',
        origin: this.group.position,
        direction: dir,
        speed: 9.0,
        damage: Math.round(this.damage * 0.9),
        range: 18.0,
        isPlayer: false
      });
      window.Sound.playHeavyHammer();
    } else {
      // 3. Summon Minions in Phase 2
      if (this.bossPhase === 2 && window.GameInstance) {
        window.GameInstance.spawnBossMinion(this.group.position);
        this.particles.spawnFloatingNumber(this.group.position, 'SUMMON SHADOWS!', '#ab47bc');
      } else {
        // Heavy Cleave
        this.combat.handleEnemyHitPlayer(player, this.damage * 1.2, this.group.position);
        window.Sound.playHeavyHammer();
      }
    }
  }

  animateWalk(dt) {
    this.animTime += dt * 9.0;
    const sin = Math.sin(this.animTime);

    if (this.modelObj.rLegPivot && this.modelObj.lLegPivot) {
      this.modelObj.rLegPivot.rotation.x = sin * 0.65;
      this.modelObj.lLegPivot.rotation.x = -sin * 0.65;
    }
    if (this.modelObj.leftArmPivot) {
      this.modelObj.leftArmPivot.rotation.x = sin * 0.55;
    }
    if (this.modelObj.torso) {
      this.modelObj.torso.position.y = (this.isBoss ? 2.1 : 1.1) + Math.abs(sin) * 0.08;
    }
  }

  animateIdle(dt) {
    this.animTime += dt * 3.0;
    const sin = Math.sin(this.animTime);

    if (this.modelObj.rLegPivot && this.modelObj.lLegPivot) {
      this.modelObj.rLegPivot.rotation.x *= 0.85;
      this.modelObj.lLegPivot.rotation.x *= 0.85;
    }
    if (this.modelObj.torso) {
      this.modelObj.torso.position.y = (this.isBoss ? 2.1 : 1.1) + sin * 0.04;
    }
  }

  die() {
    this.alive = false;
    window.Sound.playMonsterDeath();
    this.particles.spawnHitSparks(this.group.position, this.isBoss ? 0xff3d00 : 0x76ff03, this.isBoss ? 25 : 12);

    // Tumble death animation
    let fade = 1.0;
    const tumbleInterval = setInterval(() => {
      this.group.rotation.x += 0.2;
      this.group.position.y -= 0.05;
      fade -= 0.15;
      if (fade <= 0) {
        clearInterval(tumbleInterval);
        this.scene.remove(this.group);
      }
    }, 40);
  }
}

window.Enemy = Enemy;
