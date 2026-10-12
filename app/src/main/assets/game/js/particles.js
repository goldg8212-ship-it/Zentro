// ==========================================
// BLOCK DUNGEON LEGENDS - PARTICLE & FX SYSTEM
// Mobile-optimized object pooling for smooth performance
// ==========================================

class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 120; // safe mobile limit
    this.floatingNumbers = [];

    // Shared box geometry for voxel particle debris
    this.boxGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    this.sparkGeo = new THREE.PlaneGeometry(0.25, 0.25);
  }

  spawnHitSparks(pos, colorHex = 0xffe066, count = 7) {
    const quality = window.SaveManager?.data?.settings?.graphics || 'high';
    const num = quality === 'low' ? 3 : (quality === 'medium' ? 5 : count);

    for (let i = 0; i < num; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 1.0 });
      const mesh = new THREE.Mesh(this.boxGeo, mat);
      mesh.position.copy(pos);
      mesh.position.y += 0.5 + (Math.random() * 0.4);

      const vx = (Math.random() - 0.5) * 6.0;
      const vy = Math.random() * 5.0 + 2.0;
      const vz = (Math.random() - 0.5) * 6.0;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx,
        vy,
        vz,
        gravity: -16.0,
        life: 0.45 + Math.random() * 0.2,
        maxLife: 0.65,
        rotSpeed: (Math.random() - 0.5) * 15
      });
    }
  }

  spawnBloodDebris(pos, colorHex = 0x990000, count = 6) {
    this.spawnHitSparks(pos, colorHex, count);
  }

  spawnExplosion(pos, radius = 2.5) {
    // Fireball explosion voxel cloud
    for (let i = 0; i < 16; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const isFire = Math.random() > 0.3;
      const colorHex = isFire ? (Math.random() > 0.5 ? 0xff4500 : 0xffa500) : 0x444444;
      const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(this.boxGeo, mat);
      mesh.scale.setScalar(1.5 + Math.random() * 1.0);
      mesh.position.copy(pos);

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5.5 + 2.0;
      const vx = Math.cos(angle) * speed;
      const vy = Math.random() * 4.5 + 1.5;
      const vz = Math.sin(angle) * speed;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx,
        vy,
        vz,
        gravity: -10.0,
        life: 0.55 + Math.random() * 0.25,
        maxLife: 0.8,
        rotSpeed: 5.0
      });
    }
  }

  spawnShockwave(pos, colorHex = 0xffaa33) {
    // Expanding ground ring
    const ringGeo = new THREE.RingGeometry(0.2, 0.6, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, pos.y + 0.1, pos.z);
    this.scene.add(ring);

    this.particles.push({
      mesh: ring,
      vx: 0,
      vy: 0,
      vz: 0,
      gravity: 0,
      isRing: true,
      life: 0.45,
      maxLife: 0.45,
      scaleRate: 14.0
    });
  }

  spawnLightning(p1, p2) {
    // Jagged line between p1 and p2
    const points = [];
    const segments = 5;
    points.push(p1.clone().add(new THREE.Vector3(0, 1.0, 0)));
    for (let i = 1; i < segments; i++) {
      const alpha = i / segments;
      const mid = p1.clone().lerp(p2, alpha);
      mid.y += 1.0 + (Math.random() - 0.5) * 0.8;
      mid.x += (Math.random() - 0.5) * 0.8;
      mid.z += (Math.random() - 0.5) * 0.8;
      points.push(mid);
    }
    points.push(p2.clone().add(new THREE.Vector3(0, 1.0, 0)));

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 3 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);

    this.particles.push({
      mesh: line,
      vx: 0,
      vy: 0,
      vz: 0,
      gravity: 0,
      life: 0.2,
      maxLife: 0.2
    });
  }

  spawnHealSparkles(pos) {
    for (let i = 0; i < 10; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(this.boxGeo, mat);
      mesh.scale.setScalar(0.8);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 1.2,
        pos.y + Math.random() * 1.5,
        pos.z + (Math.random() - 0.5) * 1.2
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 0.8,
        vy: Math.random() * 2.5 + 1.2,
        vz: (Math.random() - 0.5) * 0.8,
        gravity: 0,
        life: 0.7,
        maxLife: 0.7,
        rotSpeed: 4.0
      });
    }
  }

  spawnFloatingNumber(pos, text, color = '#ff3d00', isCrit = false) {
    const el = document.createElement('div');
    el.className = `floating-dmg ${isCrit ? 'crit' : ''}`;
    el.innerText = text;
    el.style.color = color;
    document.getElementById('floating-ui-container').appendChild(el);

    this.floatingNumbers.push({
      el,
      worldPos: pos.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        1.6 + Math.random() * 0.4,
        (Math.random() - 0.5) * 0.6
      )),
      vy: 2.2,
      life: 0.85,
      maxLife: 0.85
    });
  }

  update(dt, camera) {
    // Update 3D particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry && !p.isRing) {
          // shared geometry, don't dispose boxGeo
        }
        if (p.mesh.material) {
          p.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      if (p.isRing) {
        const s = (1.0 - p.life / p.maxLife) * p.scaleRate + 1.0;
        p.mesh.scale.set(s, s, s);
        p.mesh.material.opacity = p.life / p.maxLife;
      } else {
        p.vy += p.gravity * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;

        if (p.mesh.position.y < 0.1 && p.gravity < 0) {
          p.mesh.position.y = 0.1;
          p.vy = -p.vy * 0.35; // bounce
        }

        if (p.rotSpeed) {
          p.mesh.rotation.x += p.rotSpeed * dt;
          p.mesh.rotation.y += p.rotSpeed * dt;
        }

        if (p.mesh.material) {
          p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
        }
      }
    }

    // Update floating damage numbers (Project 3D worldPos to 2D screen coordinates)
    const container = document.getElementById('floating-ui-container');
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    for (let i = this.floatingNumbers.length - 1; i >= 0; i--) {
      const fn = this.floatingNumbers[i];
      fn.life -= dt;
      if (fn.life <= 0) {
        fn.el.remove();
        this.floatingNumbers.splice(i, 1);
        continue;
      }

      fn.worldPos.y += fn.vy * dt;
      fn.vy *= 0.94; // damp upward rise

      // Project to screen
      const screenPos = fn.worldPos.clone().project(camera);
      const x = (screenPos.x * 0.5 + 0.5) * width;
      const y = (-(screenPos.y * 0.5) + 0.5) * height;

      fn.el.style.left = `${x}px`;
      fn.el.style.top = `${y}px`;
      fn.el.style.opacity = `${Math.min(1.0, fn.life * 2.0)}`;
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      if (p.mesh.material) p.mesh.material.dispose();
    }
    this.particles = [];

    for (const fn of this.floatingNumbers) {
      fn.el.remove();
    }
    this.floatingNumbers = [];
  }
}

window.ParticleSystem = ParticleSystem;
