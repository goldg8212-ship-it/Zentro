// ==========================================
// BLOCK DUNGEON LEGENDS - CORE GAME ENGINE
// Three.js Isometric Renderer, Loop, & Level Orchestrator
// ==========================================

class BlockDungeonGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.dirLight = null;
    this.ambientLight = null;

    // Subsystems
    this.particles = null;
    this.combat = null;
    this.dungeon = null;
    this.player = null;
    this.enemies = [];
    this.bossEnemy = null;

    // Game Loop
    this.lastTime = 0;
    this.isRunning = false;
    this.currentDungeonDef = null;
    this.currentFloor = 1;
    this.isBossFloor = false;

    // Stats for victory screen
    this.sessionKills = 0;
    this.sessionGoldStart = 0;

    this.initEngine();
  }

  initEngine() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x15131e, 0.035);

    // 2. Camera (Isometric Perspective)
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.5, 90);
    this.cameraOffset = new THREE.Vector3(12.0, 16.0, 12.0); // Classic isometric vector

    // 3. Renderer with Mobile Optimization
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.ambientLight = new THREE.AmbientLight(0x5a5565, 0.85);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff3e0, 1.2);
    this.dirLight.position.set(20, 35, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 5;
    this.dirLight.shadow.camera.far = 70;
    this.dirLight.shadow.camera.left = -22;
    this.dirLight.shadow.camera.right = 22;
    this.dirLight.shadow.camera.top = 22;
    this.dirLight.shadow.camera.bottom = -22;
    this.scene.add(this.dirLight);

    // 5. Initialize Subsystems
    this.particles = new window.ParticleSystem(this.scene);
    this.combat = new window.CombatSystem(this.scene, this.particles);
    this.dungeon = new window.DungeonGenerator(this.scene, this.particles);
    this.player = new window.Player(this.scene, this.particles, this.combat);

    // Window Resize Handler
    window.addEventListener('resize', () => this.onWindowResize());

    // Apply Saved Graphics
    this.applyGraphicsSettings();

    // Start Animation Loop
    this.lastTime = performance.now();
    this.isRunning = true;
    requestAnimationFrame((t) => this.tick(t));
  }

  applyGraphicsSettings() {
    const quality = window.SaveManager.data.settings.graphics || 'high';
    if (quality === 'low') {
      this.renderer.setPixelRatio(0.75);
      this.renderer.shadowMap.enabled = false;
      this.dirLight.castShadow = false;
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = true;
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 512;
      this.dirLight.shadow.mapSize.height = 512;
    } else { // high
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
    }
  }

  startDungeon(dungeonId) {
    const def = window.DUNGEONS_DATA.find((d) => d.id === dungeonId) || window.DUNGEONS_DATA[0];
    this.currentDungeonDef = def;
    this.currentFloor = 1;
    this.sessionKills = 0;
    this.sessionGoldStart = this.player.gold;

    this.loadFloor();
  }

  loadFloor() {
    this.clearLevel();
    const isFinalFloor = this.currentFloor >= this.currentDungeonDef.floors;
    this.isBossFloor = isFinalFloor;

    // Adjust Scene Fog & Lighting for theme
    this.scene.fog.color.setHex(this.currentDungeonDef.fogColor);
    this.ambientLight.color.setHex(this.currentDungeonDef.ambientLight);
    this.renderer.setClearColor(this.currentDungeonDef.fogColor, 1);

    // Generate Layout
    const result = this.dungeon.generate(this.currentDungeonDef, this.isBossFloor);

    // Position Player at Spawn
    this.player.respawn(result.spawnPoint);
    this.camera.position.copy(result.spawnPoint).add(this.cameraOffset);

    // Populate Enemies
    this.spawnFloorEnemies(result.rooms);

    // Audio Theme
    if (this.isBossFloor && this.currentDungeonDef.bossType === 'boss_obsidian_titan') {
      window.Sound.startBossMusic();
    } else {
      window.Sound.startDungeonAmbient();
    }

    // Floating Announcement
    const floorLabel = this.isBossFloor ? `${this.currentDungeonDef.name} - BOSS CHAMBER` : `${this.currentDungeonDef.name} - Floor ${this.currentFloor}`;
    this.particles.spawnFloatingNumber(result.spawnPoint, floorLabel, '#ffd54f', true);
  }

  spawnFloorEnemies(rooms) {
    this.enemies = [];
    this.bossEnemy = null;

    if (this.isBossFloor) {
      // Spawn Boss in last room
      const lastRoom = rooms[rooms.length - 1];
      const bossPos = new THREE.Vector3(
        (lastRoom.x + lastRoom.w / 2) * this.dungeon.tileSize,
        0,
        (lastRoom.y + lastRoom.h / 2) * this.dungeon.tileSize
      );

      const bossDef = window.ENEMIES_DATA[this.currentDungeonDef.bossType] || window.ENEMIES_DATA.boss_obsidian_titan;
      this.bossEnemy = new window.Enemy(bossDef, this.scene, this.particles, this.combat, bossPos);
      this.enemies.push(this.bossEnemy);

      // Add a couple of guard minions
      const guardPos1 = bossPos.clone().add(new THREE.Vector3(3.5, 0, 3.5));
      const guardPos2 = bossPos.clone().add(new THREE.Vector3(-3.5, 0, 3.5));
      this.enemies.push(new window.Enemy(window.ENEMIES_DATA.goblin, this.scene, this.particles, this.combat, guardPos1));
      this.enemies.push(new window.Enemy(window.ENEMIES_DATA.skeleton, this.scene, this.particles, this.combat, guardPos2));
    } else {
      // Normal floor: Spawn enemies in non-starting rooms
      for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        const count = 2 + Math.floor(Math.random() * 3);

        for (let e = 0; e < count; e++) {
          const enemyTypeKey = this.currentDungeonDef.enemies[
            Math.floor(Math.random() * this.currentDungeonDef.enemies.length)
          ];
          const enemyDef = window.ENEMIES_DATA[enemyTypeKey] || window.ENEMIES_DATA.goblin;

          const ex = (room.x + 1 + Math.random() * (room.w - 2)) * this.dungeon.tileSize;
          const ez = (room.y + 1 + Math.random() * (room.h - 2)) * this.dungeon.tileSize;

          const enemy = new window.Enemy(enemyDef, this.scene, this.particles, this.combat, new THREE.Vector3(ex, 0, ez));
          this.enemies.push(enemy);
        }
      }
    }
  }

  spawnBossMinion(aroundPos) {
    const minionPos = aroundPos.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * 4.0,
      0,
      (Math.random() - 0.5) * 4.0
    ));
    const minion = new window.Enemy(window.ENEMIES_DATA.shadow_creature, this.scene, this.particles, this.combat, minionPos);
    this.enemies.push(minion);
    this.particles.spawnExplosion(minionPos, 2.0);
  }

  onFloorCompleted() {
    if (this.isBossFloor) {
      // Dungeon Completed!
      window.Sound.stopMusic();

      // Unlock next dungeon
      const currIdx = window.DUNGEONS_DATA.findIndex((d) => d.id === this.currentDungeonDef.id);
      if (currIdx >= 0 && currIdx < window.DUNGEONS_DATA.length - 1) {
        const nextId = window.DUNGEONS_DATA[currIdx + 1].id;
        window.SaveManager.unlockDungeon(nextId);
      }

      window.UI?.showVictoryModal({
        enemiesKilled: this.sessionKills,
        goldEarned: this.player.gold - this.sessionGoldStart
      });
    } else {
      // Advance to next floor
      this.currentFloor++;
      this.loadFloor();
    }
  }

  retryCurrentFloor() {
    this.loadFloor();
  }

  clearLevel() {
    for (const e of this.enemies) {
      this.scene.remove(e.group);
    }
    this.enemies = [];
    this.bossEnemy = null;

    this.combat.clear();
    this.particles.clear();
    this.dungeon.clear();
  }

  tick(timestamp) {
    requestAnimationFrame((t) => this.tick(t));
    if (!this.isRunning) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    const inputVec = window.UI?.joystickVector || new THREE.Vector2(0, 0);

    // 1. Update Player
    if (this.player) {
      this.player.update(dt, inputVec, this.dungeon);

      // Camera Smooth Follow (Isometric tracking)
      const targetCamPos = this.player.group.position.clone().add(this.cameraOffset);
      this.camera.position.lerp(targetCamPos, dt * 5.5);
      this.camera.lookAt(this.player.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)));

      // Directional Light follow player for consistent shadow coverage
      this.dirLight.position.set(
        this.player.group.position.x + 18,
        this.player.group.position.y + 32,
        this.player.group.position.z + 14
      );
      this.dirLight.target.position.copy(this.player.group.position);
      this.dirLight.target.updateMatrixWorld();
    }

    // 2. Update Dungeon (traps, torches, portals)
    if (this.dungeon) {
      this.dungeon.update(dt, this.player);
    }

    // 3. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.alive) {
        enemy.update(dt, this.player, this.dungeon);
      } else {
        this.sessionKills++;
        this.enemies.splice(i, 1);
        if (enemy === this.bossEnemy) {
          this.bossEnemy = null;
          // Spawn Legendary Boss Victory Chest!
          const chest = window.ModelBuilder.createTreasureChest('LEGENDARY');
          chest.group.position.copy(enemy.group.position);
          this.scene.add(chest.group);
          this.dungeon.chests.push({ ...chest, opened: false, x: enemy.group.position.x, z: enemy.group.position.z });
          this.particles.spawnShockwave(enemy.group.position, 0xffa000);
          this.particles.spawnFloatingNumber(enemy.group.position, 'BOSS DEFEATED! LOOT CHEST SPAWNED!', '#ffd54f', true);
        }
      }
    }

    // 4. Update Combat & Projectiles
    if (this.combat) {
      this.combat.update(dt, this.dungeon, this.enemies, this.player);
    }

    // 5. Update Particles & 3D to 2D Floating Numbers
    if (this.particles) {
      this.particles.update(dt, this.camera);
    }

    // 6. Update HUD
    if (window.UI && this.player) {
      window.UI.updateHUD(this.player);
    }

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
}

// Global hook for Android Hardware Back button
window.handleAndroidBack = function () {
  const pauseModal = document.getElementById('pause-modal');
  const invModal = document.getElementById('inventory-modal');
  const dModal = document.getElementById('dungeon-select-modal');
  const setModal = document.getElementById('settings-modal');

  if (invModal?.classList.contains('active')) {
    window.UI?.closeModal('inventory-modal');
  } else if (dModal?.classList.contains('active')) {
    window.UI?.closeModal('dungeon-select-modal');
  } else if (setModal?.classList.contains('active')) {
    window.UI?.closeModal('settings-modal');
  } else if (pauseModal?.classList.contains('active')) {
    window.UI?.closeModal('pause-modal');
  } else {
    window.UI?.openModal('pause-modal');
  }
};

// Start Game on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.GameInstance = new BlockDungeonGame();
  window.UI = new window.UIManager();
});
