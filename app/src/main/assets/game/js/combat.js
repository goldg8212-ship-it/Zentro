// ==========================================
// BLOCK DUNGEON LEGENDS - COMBAT & PROJECTILE SYSTEM
// ==========================================

class CombatSystem {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.projectiles = [];
  }

  // --- PROJECTILES ---

  spawnProjectile({
    type,
    origin,
    direction,
    speed,
    damage,
    range,
    isPlayer,
    color = 0xffa000,
    onHit = null
  }) {
    const group = new THREE.Group();
    group.position.copy(origin);
    group.position.y += 0.8; // waist height

    let mesh;
    if (type === 'arrow') {
      mesh = window.ModelBuilder.box(0.06, 0.06, 0.7, 0x8d6e63);
      const tip = window.ModelBuilder.box(0.12, 0.12, 0.16, 0xb0bec5);
      tip.position.z = 0.38;
      group.add(mesh);
      group.add(tip);
    } else if (type === 'fireball') {
      mesh = window.ModelBuilder.glowBox(0.35, 0.35, 0.35, 0xff5722, 0xff3d00, 2.0);
      group.add(mesh);
    } else if (type === 'boulder') { // Titan boulder toss
      mesh = window.ModelBuilder.box(0.85, 0.85, 0.85, 0x263238);
      group.add(mesh);
    } else {
      mesh = window.ModelBuilder.glowBox(0.2, 0.2, 0.2, color, color, 1.5);
      group.add(mesh);
    }

    // Orient projectile along direction
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());

    this.scene.add(group);

    this.projectiles.push({
      group,
      dir: direction.clone().normalize(),
      speed,
      damage,
      distanceTraveled: 0,
      maxRange: range,
      isPlayer,
      type,
      onHit
    });
  }

  update(dt, dungeon, enemies, player) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const dist = p.speed * dt;
      p.group.position.addScaledVector(p.dir, dist);
      p.distanceTraveled += dist;

      // Spin fireball or boulder
      if (p.type === 'fireball' || p.type === 'boulder') {
        p.group.rotation.x += dt * 6.0;
        p.group.rotation.y += dt * 8.0;
      }

      // Check wall collision
      const checkX = Math.round(p.group.position.x / dungeon.tileSize);
      const checkZ = Math.round(p.group.position.z / dungeon.tileSize);
      if (dungeon.isWall(checkX, checkZ)) {
        this.destroyProjectile(i, p);
        continue;
      }

      // Max range check
      if (p.distanceTraveled >= p.maxRange) {
        this.destroyProjectile(i, p);
        continue;
      }

      // Hit detection
      if (p.isPlayer) {
        // Player shot -> Hits enemies
        let hitEnemy = false;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const distToEnemy = p.group.position.distanceTo(enemy.group.position);
          const hitRadius = enemy.isBoss ? 2.5 : 1.1;

          if (distToEnemy <= hitRadius) {
            this.handlePlayerHitEnemy(player, enemy, p.damage, p.type);
            if (p.onHit) p.onHit(enemy);
            hitEnemy = true;
            break;
          }
        }
        if (hitEnemy) {
          this.destroyProjectile(i, p);
          continue;
        }
      } else {
        // Enemy shot -> Hits player
        if (player.alive && !player.isDodging) {
          const distToPlayer = p.group.position.distanceTo(player.group.position);
          if (distToPlayer <= 1.1) {
            this.handleEnemyHitPlayer(player, p.damage, p.dir);
            this.destroyProjectile(i, p);
            continue;
          }
        }
      }
    }
  }

  destroyProjectile(idx, p) {
    if (p.type === 'fireball') {
      this.particles.spawnExplosion(p.group.position, 2.5);
      window.Sound.playHit();
    } else {
      this.particles.spawnHitSparks(p.group.position, 0xcccccc, 4);
    }
    this.scene.remove(p.group);
    this.projectiles.splice(idx, 1);
  }

  // --- DAMAGE LOGIC & EFFECTS ---

  handlePlayerHitEnemy(player, enemy, baseDamage, weaponKey) {
    // Stat & Crit calculations
    const critChance = player.getCritChance();
    const isCrit = Math.random() < critChance;
    let finalDmg = baseDamage * (isCrit ? 1.85 : 1.0);

    // Defense reduction
    const defense = enemy.defense || 0;
    finalDmg = Math.max(1, Math.round(finalDmg - defense * 0.45));

    // Apply damage to enemy
    const killed = enemy.takeDamage(finalDmg, player.group.position);

    // Visuals & Sound
    const hitColor = isCrit ? '#ffea00' : (weaponKey === 'frost_blade' ? '#00e5ff' : '#ff3d00');
    this.particles.spawnFloatingNumber(enemy.group.position, `${finalDmg}${isCrit ? '!' : ''}`, hitColor, isCrit);
    this.particles.spawnHitSparks(enemy.group.position, isCrit ? 0xffea00 : 0xff3d00, isCrit ? 10 : 6);
    window.Sound.playHit();

    // Weapon special effect triggers
    if (weaponKey === 'frost_blade') {
      enemy.applySlow(0.5, 3.0); // 50% slow for 3s
    } else if (weaponKey === 'thunder_axe') {
      this.triggerChainLightning(enemy, player);
    }

    if (killed) {
      player.onKillEnemy(enemy);
    }
  }

  triggerChainLightning(targetEnemy, player) {
    // Finds up to 2 other nearby enemies and zaps them
    const allEnemies = window.GameInstance?.enemies || [];
    let chains = 0;

    for (const other of allEnemies) {
      if (other === targetEnemy || !other.alive) continue;
      const dist = targetEnemy.group.position.distanceTo(other.group.position);
      if (dist < 6.0 && chains < 2) {
        chains++;
        this.particles.spawnLightning(targetEnemy.group.position, other.group.position);
        const chainDmg = Math.round(player.getAttackDamage() * 0.6);
        other.takeDamage(chainDmg, targetEnemy.group.position);
        this.particles.spawnFloatingNumber(other.group.position, `${chainDmg}`, '#00e5ff');
      }
    }
  }

  handleEnemyHitPlayer(player, enemyDamage, hitDirection) {
    if (!player.alive || player.isDodging) return;

    // Player defense reduction
    const defense = player.getDefense();
    const finalDmg = Math.max(2, Math.round(enemyDamage - defense * 0.5));

    player.takeDamage(finalDmg, hitDirection);
    this.particles.spawnFloatingNumber(player.group.position, `-${finalDmg}`, '#f44336');
    this.particles.spawnBloodDebris(player.group.position, 0xb71c1c, 8);
    window.Sound.playHit();
  }

  clear() {
    for (const p of this.projectiles) {
      this.scene.remove(p.group);
    }
    this.projectiles = [];
  }
}

window.CombatSystem = CombatSystem;
