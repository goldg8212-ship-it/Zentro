// ==========================================
// BLOCK DUNGEON LEGENDS - PROCEDURAL DUNGEON GENERATOR
// Room-and-Corridor BSP layout with voxel geometry and collision grid
// ==========================================

class DungeonGenerator {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.tileSize = 2.0; // 2 meters per tile
    this.gridWidth = 32;
    this.gridHeight = 32;
    this.grid = []; // 0 = empty/void, 1 = floor, 2 = wall
    this.rooms = [];
    this.spawnPoint = new THREE.Vector3(0, 0, 0);
    this.exitPoint = new THREE.Vector3(0, 0, 0);
    this.chests = [];
    this.crates = [];
    this.traps = [];
    this.torches = [];
    this.staticMeshes = [];
    this.currentTheme = null;
  }

  isWall(x, z) {
    if (x < 0 || x >= this.gridWidth || z < 0 || z >= this.gridHeight) return true;
    return this.grid[z][x] === 2 || this.grid[z][x] === 0;
  }

  isFloor(x, z) {
    if (x < 0 || x >= this.gridWidth || z < 0 || z >= this.gridHeight) return false;
    return this.grid[z][x] === 1;
  }

  generate(dungeonDef, isBossFloor = false) {
    this.clear();
    this.currentTheme = dungeonDef;

    // 1. Initialize grid with 0 (void)
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = new Array(this.gridWidth).fill(0);
    }
    this.rooms = [];

    // 2. Generate Rooms
    const roomCount = isBossFloor ? 3 : 5 + Math.floor(Math.random() * 3);
    const attempts = 30;

    for (let a = 0; a < attempts && this.rooms.length < roomCount; a++) {
      const w = isBossFloor && this.rooms.length === 1 ? 12 : 5 + Math.floor(Math.random() * 4);
      const h = isBossFloor && this.rooms.length === 1 ? 12 : 5 + Math.floor(Math.random() * 4);
      const x = 2 + Math.floor(Math.random() * (this.gridWidth - w - 4));
      const y = 2 + Math.floor(Math.random() * (this.gridHeight - h - 4));

      // Overlap check
      let overlap = false;
      for (const r of this.rooms) {
        if (
          x < r.x + r.w + 2 &&
          x + w + 2 > r.x &&
          y < r.y + r.h + 2 &&
          y + h + 2 > r.y
        ) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        const room = { x, y, w, h, id: this.rooms.length };
        this.rooms.push(room);

        // Carve floor
        for (let ry = y; ry < y + h; ry++) {
          for (let rx = x; rx < x + w; rx++) {
            this.grid[ry][rx] = 1;
          }
        }
      }
    }

    // 3. Connect rooms with Corridors
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const r1 = this.rooms[i];
      const r2 = this.rooms[i + 1];

      let cx = Math.floor(r1.x + r1.w / 2);
      let cy = Math.floor(r1.y + r1.h / 2);
      const targetX = Math.floor(r2.x + r2.w / 2);
      const targetY = Math.floor(r2.y + r2.h / 2);

      // Horizontal corridor
      while (cx !== targetX) {
        this.grid[cy][cx] = 1;
        this.grid[cy + 1][cx] = 1; // 2 tiles wide corridor for easy mobile combat
        cx += cx < targetX ? 1 : -1;
      }
      // Vertical corridor
      while (cy !== targetY) {
        this.grid[cy][cx] = 1;
        this.grid[cy][cx + 1] = 1;
        cy += cy < targetY ? 1 : -1;
      }
    }

    // 4. Place Walls around floors
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.grid[y][x] === 0) {
          // If adjacent to any floor, mark as wall
          let hasNeighborFloor = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < this.gridHeight && nx >= 0 && nx < this.gridWidth) {
                if (this.grid[ny][nx] === 1) {
                  hasNeighborFloor = true;
                  break;
                }
              }
            }
            if (hasNeighborFloor) break;
          }
          if (hasNeighborFloor) {
            this.grid[y][x] = 2; // Wall
          }
        }
      }
    }

    // 5. Determine Spawn & Exit
    const startRoom = this.rooms[0];
    const endRoom = this.rooms[this.rooms.length - 1];

    this.spawnPoint.set(
      (startRoom.x + startRoom.w / 2) * this.tileSize,
      0,
      (startRoom.y + startRoom.h / 2) * this.tileSize
    );

    this.exitPoint.set(
      (endRoom.x + endRoom.w / 2) * this.tileSize,
      0,
      (endRoom.y + endRoom.h / 2) * this.tileSize
    );

    // 6. Build 3D Meshes for floors, walls, and props
    this.build3DEnvironment(dungeonDef);

    return {
      spawnPoint: this.spawnPoint,
      exitPoint: this.exitPoint,
      rooms: this.rooms
    };
  }

  build3DEnvironment(dungeonDef) {
    const floorColor = dungeonDef.floorColor || 0x3d3a47;
    const wallColor = dungeonDef.wallColor || 0x524e61;
    const accentColor = dungeonDef.accentColor || 0xff8c00;

    // Materials
    const floorMat = new THREE.MeshStandardMaterial({
      color: floorColor,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });

    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    const wallTopMat = new THREE.MeshStandardMaterial({
      color: Math.round(wallColor * 0.8),
      roughness: 0.9,
      flatShading: true
    });

    const floorGeo = new THREE.BoxGeometry(this.tileSize, 0.4, this.tileSize);
    const wallGeo = new THREE.BoxGeometry(this.tileSize, 3.2, this.tileSize);

    // Instantiate Meshes
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const type = this.grid[y][x];
        const wx = x * this.tileSize;
        const wz = y * this.tileSize;

        if (type === 1) {
          // Floor block
          const floor = new THREE.Mesh(floorGeo, floorMat);
          floor.position.set(wx, -0.2, wz);
          floor.receiveShadow = true;
          this.scene.add(floor);
          this.staticMeshes.push(floor);
        } else if (type === 2) {
          // Wall block
          const wall = new THREE.Mesh(wallGeo, wallMat);
          wall.position.set(wx, 1.6, wz);
          wall.castShadow = true;
          wall.receiveShadow = true;
          this.scene.add(wall);
          this.staticMeshes.push(wall);

          // Wall cap / trim
          const cap = new THREE.Mesh(new THREE.BoxGeometry(this.tileSize, 0.2, this.tileSize), wallTopMat);
          cap.position.set(wx, 3.3, wz);
          this.scene.add(cap);
          this.staticMeshes.push(cap);

          // Random chance for wall torch if facing floor
          if (Math.random() < 0.22 && this.torches.length < 12) {
            // Check if south neighbor is floor
            if (this.isFloor(x, y + 1)) {
              const torchObj = window.ModelBuilder.createWallTorch(accentColor);
              torchObj.group.position.set(wx, 1.8, wz + this.tileSize / 2 + 0.1);
              torchObj.group.rotation.y = 0;
              this.scene.add(torchObj.group);
              this.torches.push(torchObj);
            }
          }
        }
      }
    }

    // 7. Populate Rooms with Crates, Chests, and Traps
    for (let i = 0; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      const isStart = i === 0;
      const isEnd = i === this.rooms.length - 1;

      // Crates in corners
      if (!isStart) {
        const crateCount = 1 + Math.floor(Math.random() * 3);
        for (let c = 0; c < crateCount; c++) {
          const cx = (room.x + 1 + Math.floor(Math.random() * (room.w - 2))) * this.tileSize;
          const cz = (room.y + 1 + Math.floor(Math.random() * (room.h - 2))) * this.tileSize;
          const crate = window.ModelBuilder.createCrate();
          crate.position.set(cx, 0, cz);
          this.scene.add(crate);
          this.crates.push({ mesh: crate, hp: 1, x: cx, z: cz });
        }
      }

      // Treasure Chest
      if (!isStart && Math.random() < 0.75) {
        const rarities = ['COMMON', 'RARE', 'EPIC'];
        const rarity = isEnd ? 'EPIC' : rarities[Math.floor(Math.random() * rarities.length)];
        const chest = window.ModelBuilder.createTreasureChest(rarity);
        const chx = (room.x + Math.floor(room.w / 2)) * this.tileSize;
        const chz = (room.y + 1) * this.tileSize;
        chest.group.position.set(chx, 0, chz);
        this.scene.add(chest.group);
        this.chests.push({ ...chest, opened: false, x: chx, z: chz });
      }

      // Spike Trap in intermediate rooms
      if (!isStart && !isEnd && Math.random() < 0.5) {
        const trap = window.ModelBuilder.createSpikeTrap();
        const tx = (room.x + Math.floor(room.w / 2)) * this.tileSize;
        const tz = (room.y + Math.floor(room.h / 2)) * this.tileSize;
        trap.group.position.set(tx, 0, tz);
        this.scene.add(trap.group);
        this.traps.push({ ...trap, state: 'lowered', timer: Math.random() * 2.0, x: tx, z: tz });
      }
    }

    // 8. Exit Portal
    const portal = window.ModelBuilder.createExitPortal(accentColor);
    portal.group.position.copy(this.exitPoint);
    this.scene.add(portal.group);
    this.exitPortal = portal;
  }

  update(dt, player) {
    // Animate Torches
    for (const t of this.torches) {
      t.flame.scale.y = 1.0 + Math.sin(Date.now() * 0.01 + t.group.position.x) * 0.15;
      t.light.intensity = 1.0 + Math.sin(Date.now() * 0.015 + t.group.position.z) * 0.25;
    }

    // Animate Traps (Toggle every 2.5s)
    for (const trap of this.traps) {
      trap.timer += dt;
      if (trap.timer > 2.2) {
        trap.timer = 0;
        trap.state = trap.state === 'raised' ? 'lowered' : 'raised';
      }

      const targetY = trap.state === 'raised' ? 0.0 : -0.6;
      trap.spikes.position.y += (targetY - trap.spikes.position.y) * dt * 8.0;

      // Trap damage check if player is stepping on raised trap
      if (trap.state === 'raised' && trap.spikes.position.y > -0.2 && player.alive) {
        const dist = player.group.position.distanceTo(new THREE.Vector3(trap.x, 0, trap.z));
        if (dist < 1.1) {
          player.takeDamage(12, new THREE.Vector3(0, 0, 0));
        }
      }
    }

    // Animate Exit Portal
    if (this.exitPortal) {
      this.exitPortal.energy.rotation.z += dt * 1.5;
    }
  }

  checkChestInteract(playerPos) {
    for (const chest of this.chests) {
      if (chest.opened) continue;
      const dist = playerPos.distanceTo(new THREE.Vector3(chest.x, 0, chest.z));
      if (dist < 2.0) {
        // Open chest!
        chest.opened = true;
        chest.lidPivot.rotation.x = -Math.PI / 2.2;
        chest.glowBeam.visible = true;
        window.Sound.playChestOpen();
        this.particles.spawnHitSparks(chest.group.position, 0xffd54f, 15);
        return chest;
      }
    }
    return null;
  }

  checkExitPortal(playerPos) {
    if (!this.exitPoint) return false;
    return playerPos.distanceTo(this.exitPoint) < 2.2;
  }

  clear() {
    for (const mesh of this.staticMeshes) {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    }
    this.staticMeshes = [];

    for (const c of this.chests) this.scene.remove(c.group);
    this.chests = [];

    for (const c of this.crates) this.scene.remove(c.mesh);
    this.crates = [];

    for (const t of this.traps) this.scene.remove(t.group);
    this.traps = [];

    for (const t of this.torches) this.scene.remove(t.group);
    this.torches = [];

    if (this.exitPortal) {
      this.scene.remove(this.exitPortal.group);
      this.exitPortal = null;
    }
  }
}

window.DungeonGenerator = DungeonGenerator;
