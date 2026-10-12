// ==========================================
// BLOCK DUNGEON LEGENDS - 3D VOXEL MODEL BUILDER
// Generates stylized blocky meshes with materials & hierarchical joints
// ==========================================

const ModelBuilder = {
  // Helper to build a colored box mesh
  box(w, h, d, colorHex, roughness = 0.7, metalness = 0.1) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: roughness,
      metalness: metalness,
      flatShading: true
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  },

  // Helper for glowing emissive blocks
  glowBox(w, h, d, colorHex, emissiveHex, emissiveIntensity = 1.0) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: emissiveHex,
      emissiveIntensity: emissiveIntensity,
      roughness: 0.3,
      flatShading: true
    });
    return new THREE.Mesh(geo, mat);
  },

  // --- PLAYER HERO MODEL ---
  createHero(skinColor = 0xf5c69b, tunicColor = 0x1976d2, pantsColor = 0x263238) {
    const group = new THREE.Group();

    // Torso
    const torso = this.box(0.7, 0.9, 0.45, tunicColor);
    torso.position.y = 1.15;
    group.add(torso);

    // Belt
    const belt = this.box(0.72, 0.15, 0.47, 0x4e342e);
    belt.position.y = 0.78;
    group.add(belt);
    const buckle = this.box(0.2, 0.16, 0.49, 0xffd54f);
    buckle.position.y = 0.78;
    group.add(buckle);

    // Head
    const head = this.box(0.55, 0.55, 0.55, skinColor);
    head.position.y = 1.95;
    group.add(head);

    // Hair / Helmet
    const hair = this.box(0.58, 0.22, 0.58, 0x5d4037);
    hair.position.y = 2.18;
    group.add(hair);

    // Eyes
    const eyeR = this.glowBox(0.08, 0.08, 0.02, 0x212121, 0x4fc3f7, 0.8);
    eyeR.position.set(0.14, 1.95, 0.28);
    const eyeL = this.glowBox(0.08, 0.08, 0.02, 0x212121, 0x4fc3f7, 0.8);
    eyeL.position.set(-0.14, 1.95, 0.28);
    group.add(eyeR);
    group.add(eyeL);

    // Right Arm Pivot & Arm (Holds weapon)
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.5, 1.5, 0);
    const rightArm = this.box(0.24, 0.75, 0.26, tunicColor);
    rightArm.position.y = -0.32;
    rightArmPivot.add(rightArm);

    // Hand
    const rightHand = this.box(0.22, 0.2, 0.22, skinColor);
    rightHand.position.y = -0.72;
    rightArmPivot.add(rightHand);

    // Weapon mount socket on right hand
    const weaponSocket = new THREE.Group();
    weaponSocket.position.set(0, -0.75, 0.1);
    rightArmPivot.add(weaponSocket);
    group.add(rightArmPivot);

    // Left Arm Pivot & Arm
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.5, 1.5, 0);
    const leftArm = this.box(0.24, 0.75, 0.26, tunicColor);
    leftArm.position.y = -0.32;
    leftArmPivot.add(leftArm);
    const leftHand = this.box(0.22, 0.2, 0.22, skinColor);
    leftHand.position.y = -0.72;
    leftArmPivot.add(leftHand);
    group.add(leftArmPivot);

    // Legs
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.2, 0.7, 0);
    const rightLeg = this.box(0.28, 0.75, 0.32, pantsColor);
    rightLeg.position.y = -0.35;
    rightLegPivot.add(rightLeg);
    group.add(rightLegPivot);

    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.2, 0.7, 0);
    const leftLeg = this.box(0.28, 0.75, 0.32, pantsColor);
    leftLeg.position.y = -0.35;
    leftLegPivot.add(leftLeg);
    group.add(leftLegPivot);

    // Circular ground shadow
    const shadowGeo = new THREE.CircleGeometry(0.55, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    return {
      root: group,
      torso,
      head,
      rightArmPivot,
      leftArmPivot,
      rightLegPivot,
      leftLegPivot,
      weaponSocket
    };
  },

  // --- WEAPON MODELS ---
  createWeapon(weaponKey, rarityHex = 0xffa000) {
    const group = new THREE.Group();

    switch (weaponKey) {
      case 'iron_sword':
      case 'frost_blade': {
        const isFrost = weaponKey === 'frost_blade';
        const bladeColor = isFrost ? 0x80deea : 0xe0e0e0;
        const glowColor = isFrost ? 0x00e5ff : 0x90caf9;
        
        // Hilt & Guard
        const hilt = this.box(0.08, 0.35, 0.08, 0x5d4037);
        hilt.position.y = -0.15;
        group.add(hilt);

        const guard = this.box(0.35, 0.08, 0.12, isFrost ? 0x006064 : 0xffb300);
        guard.position.y = 0.05;
        group.add(guard);

        // Blade
        const blade = this.glowBox(0.14, 0.95, 0.05, bladeColor, glowColor, isFrost ? 0.8 : 0.2);
        blade.position.y = 0.55;
        group.add(blade);

        // Tip
        const tip = this.box(0.1, 0.2, 0.05, bladeColor);
        tip.position.y = 1.05;
        group.add(tip);
        break;
      }
      case 'heavy_hammer': {
        const handle = this.box(0.09, 1.1, 0.09, 0x4e342e);
        handle.position.y = 0.3;
        group.add(handle);

        const head = this.box(0.5, 0.35, 0.45, 0x455a64);
        head.position.y = 0.85;
        group.add(head);

        const runes = this.glowBox(0.52, 0.12, 0.47, 0xff9800, 0xff5722, 1.2);
        runes.position.y = 0.85;
        group.add(runes);
        break;
      }
      case 'twin_daggers': {
        const hilt = this.box(0.06, 0.22, 0.06, 0x3e2723);
        group.add(hilt);
        const blade = this.glowBox(0.09, 0.55, 0.04, 0xb0bec5, 0x80d8ff, 0.4);
        blade.position.y = 0.35;
        group.add(blade);
        break;
      }
      case 'wooden_bow': {
        const bowCurve = new THREE.Group();
        const woodColor = 0x6d4c41;
        const b1 = this.box(0.08, 0.4, 0.08, woodColor);
        b1.position.set(0, 0.2, 0.08);
        b1.rotation.x = -0.3;
        const b2 = this.box(0.08, 0.4, 0.08, woodColor);
        b2.position.set(0, -0.2, 0.08);
        b2.rotation.x = 0.3;
        bowCurve.add(b1);
        bowCurve.add(b2);

        // String
        const string = this.box(0.02, 0.8, 0.02, 0xeeeeee);
        string.position.set(0, 0, 0);
        bowCurve.add(string);
        group.add(bowCurve);
        break;
      }
      case 'fire_staff': {
        const staffShaft = this.box(0.08, 1.4, 0.08, 0x3e2723);
        staffShaft.position.y = 0.4;
        group.add(staffShaft);

        const crown = this.box(0.24, 0.2, 0.24, 0xffb300);
        crown.position.y = 1.15;
        group.add(crown);

        // Floating glowing orb
        const orb = this.glowBox(0.2, 0.2, 0.2, 0xff5722, 0xff3d00, 1.8);
        orb.position.y = 1.35;
        group.add(orb);
        break;
      }
      case 'thunder_axe': {
        const haft = this.box(0.08, 1.1, 0.08, 0x37474f);
        haft.position.y = 0.3;
        group.add(haft);

        const blade1 = this.glowBox(0.4, 0.35, 0.06, 0x00bcd4, 0x00e5ff, 1.2);
        blade1.position.set(0.2, 0.8, 0);
        group.add(blade1);

        const blade2 = this.glowBox(0.3, 0.25, 0.06, 0x00bcd4, 0x00e5ff, 1.0);
        blade2.position.set(-0.16, 0.8, 0);
        group.add(blade2);
        break;
      }
      default: {
        const defaultBlade = this.box(0.1, 0.8, 0.05, 0xcccccc);
        defaultBlade.position.y = 0.4;
        group.add(defaultBlade);
      }
    }

    return group;
  },

  // --- ENEMIES MODELS ---

  createGoblin() {
    const group = new THREE.Group();
    const skin = 0x43a047;
    const cloth = 0x5d4037;

    const torso = this.box(0.5, 0.6, 0.35, cloth);
    torso.position.y = 0.75;
    group.add(torso);

    const head = this.box(0.48, 0.45, 0.45, skin);
    head.position.y = 1.35;
    group.add(head);

    // Goblin pointed ears
    const earL = this.box(0.18, 0.1, 0.08, skin);
    earL.position.set(-0.32, 1.35, 0);
    earL.rotation.z = 0.4;
    const earR = this.box(0.18, 0.1, 0.08, skin);
    earR.position.set(0.32, 1.35, 0);
    earR.rotation.z = -0.4;
    group.add(earL);
    group.add(earR);

    // Yellow glowing eyes
    const eyeL = this.glowBox(0.08, 0.08, 0.02, 0xffeb3b, 0xffd600, 1.2);
    eyeL.position.set(-0.12, 1.35, 0.23);
    const eyeR = this.glowBox(0.08, 0.08, 0.02, 0xffeb3b, 0xffd600, 1.2);
    eyeR.position.set(0.12, 1.35, 0.23);
    group.add(eyeL);
    group.add(eyeR);

    // Arm pivots
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.34, 0.95, 0);
    const rArm = this.box(0.18, 0.55, 0.18, skin);
    rArm.position.y = -0.25;
    rightArmPivot.add(rArm);
    // Spiked club
    const club = this.box(0.14, 0.65, 0.14, 0x3e2723);
    club.position.set(0, -0.45, 0.2);
    rightArmPivot.add(club);
    group.add(rightArmPivot);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.34, 0.95, 0);
    const lArm = this.box(0.18, 0.55, 0.18, skin);
    lArm.position.y = -0.25;
    leftArmPivot.add(lArm);
    group.add(leftArmPivot);

    const rLegPivot = new THREE.Group();
    rLegPivot.position.set(0.15, 0.45, 0);
    const rLeg = this.box(0.2, 0.5, 0.22, 0x3e2723);
    rLeg.position.y = -0.25;
    rLegPivot.add(rLeg);
    group.add(rLegPivot);

    const lLegPivot = new THREE.Group();
    lLegPivot.position.set(-0.15, 0.45, 0);
    const lLeg = this.box(0.2, 0.5, 0.22, 0x3e2723);
    lLeg.position.y = -0.25;
    lLegPivot.add(lLeg);
    group.add(lLegPivot);

    return { root: group, rightArmPivot, leftArmPivot, rLegPivot, lLegPivot, torso };
  },

  createSkeleton() {
    const group = new THREE.Group();
    const bone = 0xe0e0e0;

    const spine = this.box(0.16, 0.65, 0.16, bone);
    spine.position.y = 1.0;
    group.add(spine);

    const ribs = this.box(0.48, 0.4, 0.32, bone);
    ribs.position.y = 1.1;
    group.add(ribs);

    const skull = this.box(0.46, 0.46, 0.46, bone);
    skull.position.y = 1.65;
    group.add(skull);

    // Glowing red eye sockets
    const eyeL = this.glowBox(0.08, 0.08, 0.02, 0x000000, 0xff1744, 1.5);
    eyeL.position.set(-0.11, 1.65, 0.24);
    const eyeR = this.glowBox(0.08, 0.08, 0.02, 0x000000, 0xff1744, 1.5);
    eyeR.position.set(0.11, 1.65, 0.24);
    group.add(eyeL);
    group.add(eyeR);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.35, 1.3, 0);
    const rArm = this.box(0.14, 0.65, 0.14, bone);
    rArm.position.y = -0.3;
    rightArmPivot.add(rArm);
    const bowMesh = this.box(0.06, 0.8, 0.06, 0x5d4037);
    bowMesh.position.set(0, -0.4, 0.15);
    rightArmPivot.add(bowMesh);
    group.add(rightArmPivot);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.35, 1.3, 0);
    const lArm = this.box(0.14, 0.65, 0.14, bone);
    lArm.position.y = -0.3;
    leftArmPivot.add(lArm);
    group.add(leftArmPivot);

    const rLegPivot = new THREE.Group();
    rLegPivot.position.set(0.15, 0.65, 0);
    const rLeg = this.box(0.16, 0.7, 0.16, bone);
    rLeg.position.y = -0.35;
    rLegPivot.add(rLeg);
    group.add(rLegPivot);

    const lLegPivot = new THREE.Group();
    lLegPivot.position.set(-0.15, 0.65, 0);
    const lLeg = this.box(0.16, 0.7, 0.16, bone);
    lLeg.position.y = -0.35;
    lLegPivot.add(lLeg);
    group.add(lLegPivot);

    return { root: group, rightArmPivot, leftArmPivot, rLegPivot, lLegPivot, torso: ribs };
  },

  createStoneGuardian() {
    const group = new THREE.Group();
    const stone = 0x546e7a;

    const torso = this.box(0.95, 1.05, 0.65, stone);
    torso.position.y = 1.35;
    group.add(torso);

    // Glowing cyan runic chest core
    const core = this.glowBox(0.35, 0.35, 0.67, 0x00e5ff, 0x00e5ff, 1.6);
    core.position.y = 1.35;
    group.add(core);

    const head = this.box(0.65, 0.5, 0.55, stone);
    head.position.y = 2.15;
    group.add(head);

    const eyeBand = this.glowBox(0.45, 0.08, 0.57, 0x00e5ff, 0x00e5ff, 2.0);
    eyeBand.position.y = 2.15;
    group.add(eyeBand);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.65, 1.7, 0);
    const rArm = this.box(0.38, 0.95, 0.38, stone);
    rArm.position.y = -0.4;
    rightArmPivot.add(rArm);
    group.add(rightArmPivot);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.65, 1.7, 0);
    const lArm = this.box(0.38, 0.95, 0.38, stone);
    lArm.position.y = -0.4;
    leftArmPivot.add(lArm);
    group.add(leftArmPivot);

    const rLegPivot = new THREE.Group();
    rLegPivot.position.set(0.28, 0.8, 0);
    const rLeg = this.box(0.38, 0.85, 0.38, stone);
    rLeg.position.y = -0.42;
    rLegPivot.add(rLeg);
    group.add(rLegPivot);

    const lLegPivot = new THREE.Group();
    lLegPivot.position.set(-0.28, 0.8, 0);
    const lLeg = this.box(0.38, 0.85, 0.38, stone);
    lLeg.position.y = -0.42;
    lLegPivot.add(lLeg);
    group.add(lLegPivot);

    return { root: group, rightArmPivot, leftArmPivot, rLegPivot, lLegPivot, torso };
  },

  createShadowCreature() {
    const group = new THREE.Group();
    const darkVoid = 0x120024;

    const torso = this.box(0.65, 0.85, 0.45, darkVoid);
    torso.position.y = 1.25;
    group.add(torso);

    const head = this.box(0.55, 0.55, 0.55, darkVoid);
    head.position.y = 2.0;
    group.add(head);

    // Glowing purple horn spikes & eyes
    const hornL = this.glowBox(0.1, 0.35, 0.1, 0x7b1fa2, 0xab47bc, 1.5);
    hornL.position.set(-0.22, 2.38, 0);
    hornL.rotation.z = -0.25;
    const hornR = this.glowBox(0.1, 0.35, 0.1, 0x7b1fa2, 0xab47bc, 1.5);
    hornR.position.set(0.22, 2.38, 0);
    hornR.rotation.z = 0.25;
    group.add(hornL);
    group.add(hornR);

    const eyeL = this.glowBox(0.1, 0.1, 0.02, 0xe040fb, 0xe040fb, 2.2);
    eyeL.position.set(-0.14, 2.0, 0.28);
    const eyeR = this.glowBox(0.1, 0.1, 0.02, 0xe040fb, 0xe040fb, 2.2);
    eyeR.position.set(0.14, 2.0, 0.28);
    group.add(eyeL);
    group.add(eyeR);

    // Shadowy claw arms
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.48, 1.6, 0);
    const rArm = this.box(0.2, 0.8, 0.2, darkVoid);
    rArm.position.y = -0.38;
    rightArmPivot.add(rArm);
    const clawR = this.glowBox(0.08, 0.3, 0.16, 0xab47bc, 0xab47bc, 1.5);
    clawR.position.set(0, -0.85, 0.08);
    rightArmPivot.add(clawR);
    group.add(rightArmPivot);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.48, 1.6, 0);
    const lArm = this.box(0.2, 0.8, 0.2, darkVoid);
    lArm.position.y = -0.38;
    leftArmPivot.add(lArm);
    const clawL = this.glowBox(0.08, 0.3, 0.16, 0xab47bc, 0xab47bc, 1.5);
    clawL.position.set(0, -0.85, 0.08);
    leftArmPivot.add(clawL);
    group.add(leftArmPivot);

    const rLegPivot = new THREE.Group();
    rLegPivot.position.set(0.2, 0.8, 0);
    const rLeg = this.box(0.22, 0.8, 0.24, darkVoid);
    rLeg.position.y = -0.4;
    rLegPivot.add(rLeg);
    group.add(rLegPivot);

    const lLegPivot = new THREE.Group();
    lLegPivot.position.set(-0.2, 0.8, 0);
    const lLeg = this.box(0.22, 0.8, 0.24, darkVoid);
    lLeg.position.y = -0.4;
    lLegPivot.add(lLeg);
    group.add(lLegPivot);

    return { root: group, rightArmPivot, leftArmPivot, rLegPivot, lLegPivot, torso };
  },

  createDungeonBrute() {
    const group = new THREE.Group();
    const skin = 0xb71c1c; // Deep crimson orc brute
    const armor = 0x212121;

    const torso = this.box(1.2, 1.25, 0.85, armor);
    torso.position.y = 1.65;
    group.add(torso);

    const head = this.box(0.7, 0.65, 0.7, skin);
    head.position.y = 2.55;
    group.add(head);

    // Spiked iron jaw
    const jaw = this.box(0.72, 0.25, 0.72, 0x424242);
    jaw.position.y = 2.35;
    group.add(jaw);

    // Eyes
    const eyeL = this.glowBox(0.1, 0.1, 0.02, 0xff5722, 0xff3d00, 1.8);
    eyeL.position.set(-0.18, 2.58, 0.36);
    const eyeR = this.glowBox(0.1, 0.1, 0.02, 0xff5722, 0xff3d00, 1.8);
    eyeR.position.set(0.18, 2.58, 0.36);
    group.add(eyeL);
    group.add(eyeR);

    // Spiked Pauldrons
    const pauldronL = this.box(0.55, 0.45, 0.55, 0x37474f);
    pauldronL.position.set(-0.85, 2.1, 0);
    group.add(pauldronL);
    const pauldronR = this.box(0.55, 0.45, 0.55, 0x37474f);
    pauldronR.position.set(0.85, 2.1, 0);
    group.add(pauldronR);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.85, 1.9, 0);
    const rArm = this.box(0.45, 1.1, 0.45, skin);
    rArm.position.y = -0.55;
    rightArmPivot.add(rArm);
    // Heavy spiked cleaver
    const cleaver = this.box(0.2, 1.3, 0.55, 0x424242);
    cleaver.position.set(0, -0.9, 0.35);
    rightArmPivot.add(cleaver);
    group.add(rightArmPivot);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.85, 1.9, 0);
    const lArm = this.box(0.45, 1.1, 0.45, skin);
    lArm.position.y = -0.55;
    leftArmPivot.add(lArm);
    group.add(leftArmPivot);

    const rLegPivot = new THREE.Group();
    rLegPivot.position.set(0.35, 1.0, 0);
    const rLeg = this.box(0.45, 1.0, 0.45, armor);
    rLeg.position.y = -0.5;
    rLegPivot.add(rLeg);
    group.add(rLegPivot);

    const lLegPivot = new THREE.Group();
    lLegPivot.position.set(-0.35, 1.0, 0);
    const lLeg = this.box(0.45, 1.0, 0.45, armor);
    lLeg.position.y = -0.5;
    lLegPivot.add(lLeg);
    group.add(lLegPivot);

    return { root: group, rightArmPivot, leftArmPivot, rLegPivot, lLegPivot, torso };
  },

  // --- BOSS: THE OBSIDIAN TITAN ---
  createObsidianTitan() {
    const group = new THREE.Group();
    group.scale.set(1.5, 1.5, 1.5); // Towering boss presence!

    const obsidian = 0x1a1829;
    const magma = 0xff3d00;

    // Massive chest block
    const torso = this.box(1.5, 1.6, 1.1, obsidian, 0.8, 0.2);
    torso.position.y = 2.1;
    group.add(torso);

    // Glowing magma fissure veins in chest
    const vein1 = this.glowBox(0.25, 0.9, 1.12, magma, magma, 2.5);
    vein1.position.set(0, 2.1, 0);
    group.add(vein1);

    const vein2 = this.glowBox(0.9, 0.2, 1.12, magma, magma, 2.5);
    vein2.position.set(0, 2.3, 0);
    group.add(vein2);

    // Head with obsidian crown spikes
    const head = this.box(0.9, 0.8, 0.85, obsidian);
    head.position.y = 3.3;
    group.add(head);

    const crown = this.glowBox(1.0, 0.25, 0.95, magma, magma, 1.5);
    crown.position.y = 3.75;
    group.add(crown);

    // Burning eyes
    const eyeL = this.glowBox(0.16, 0.12, 0.02, magma, magma, 3.0);
    eyeL.position.set(-0.25, 3.35, 0.44);
    const eyeR = this.glowBox(0.16, 0.12, 0.02, magma, magma, 3.0);
    eyeR.position.set(0.25, 3.35, 0.44);
    group.add(eyeL);
    group.add(eyeR);

    // Right Arm Pivot & Colossal Obsidian Hammer
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(1.15, 2.6, 0);
    const rArm = this.box(0.65, 1.5, 0.65, obsidian);
    rArm.position.y = -0.7;
    rightArmPivot.add(rArm);

    // Colossal Titan Hammer
    const hammerShaft = this.box(0.18, 2.8, 0.18, 0x263238);
    hammerShaft.position.set(0, -0.9, 0.5);
    rightArmPivot.add(hammerShaft);
    const hammerHead = this.glowBox(1.1, 0.75, 0.8, obsidian, magma, 1.2);
    hammerHead.position.set(0, 0.3, 0.5);
    rightArmPivot.add(hammerHead);
    group.add(rightArmPivot);

    // Left Arm Pivot
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-1.15, 2.6, 0);
    const lArm = this.box(0.65, 1.5, 0.65, obsidian);
    lArm.position.y = -0.7;
    leftArmPivot.add(lArm);
    group.add(leftArmPivot);

    // Massive Legs
    const rLegPivot = new THREE.Group();
    rLegPivot.position.set(0.5, 1.3, 0);
    const rLeg = this.box(0.6, 1.35, 0.65, obsidian);
    rLeg.position.y = -0.65;
    rLegPivot.add(rLeg);
    group.add(rLegPivot);

    const lLegPivot = new THREE.Group();
    lLegPivot.position.set(-0.5, 1.3, 0);
    const lLeg = this.box(0.6, 1.35, 0.65, obsidian);
    lLeg.position.y = -0.65;
    lLegPivot.add(lLeg);
    group.add(lLegPivot);

    // Boss Aura ring on ground
    const auraGeo = new THREE.RingGeometry(1.6, 1.8, 32);
    const auraMat = new THREE.MeshBasicMaterial({ color: magma, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.05;
    group.add(aura);

    return { root: group, rightArmPivot, leftArmPivot, rLegPivot, lLegPivot, torso, aura };
  },

  // --- DUNGEON PROPS ---

  createWallTorch(accentColor = 0xff8c00) {
    const group = new THREE.Group();
    // Wall sconce bracket
    const bracket = this.box(0.12, 0.12, 0.35, 0x37474f);
    bracket.position.z = 0.18;
    group.add(bracket);

    const torchWood = this.box(0.1, 0.45, 0.1, 0x4e342e);
    torchWood.position.set(0, 0.15, 0.35);
    group.add(torchWood);

    // Glowing flame block
    const flame = this.glowBox(0.16, 0.22, 0.16, accentColor, accentColor, 2.5);
    flame.position.set(0, 0.42, 0.35);
    group.add(flame);

    // Dynamic torch light
    const light = new THREE.PointLight(accentColor, 1.2, 8.0, 1.5);
    light.position.set(0, 0.45, 0.4);
    group.add(light);

    return { group, flame, light };
  },

  createCrate() {
    const group = new THREE.Group();
    const wood = 0x6d4c41;
    const rim = 0x3e2723;

    const base = this.box(0.9, 0.9, 0.9, wood);
    base.position.y = 0.45;
    group.add(base);

    // Decorative edge bands
    const bandH = this.box(0.92, 0.14, 0.92, rim);
    bandH.position.y = 0.45;
    group.add(bandH);

    return group;
  },

  createTreasureChest(rarity = 'RARE') {
    const group = new THREE.Group();
    const woodColor = 0x5d4037;
    const goldRim = rarity === 'LEGENDARY' ? 0xffb300 : (rarity === 'EPIC' ? 0xab47bc : 0x42a5f5);

    // Base body
    const body = this.box(0.9, 0.48, 0.65, woodColor);
    body.position.y = 0.24;
    group.add(body);

    const bodyRim = this.glowBox(0.92, 0.1, 0.67, goldRim, goldRim, 0.8);
    bodyRim.position.y = 0.42;
    group.add(bodyRim);

    // Hinged Lid Pivot
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.48, -0.32);

    const lid = this.box(0.92, 0.24, 0.67, woodColor);
    lid.position.set(0, 0.12, 0.33);
    lidPivot.add(lid);

    const lock = this.glowBox(0.18, 0.18, 0.08, 0xffd54f, goldRim, 1.2);
    lock.position.set(0, 0.05, 0.67);
    lidPivot.add(lock);

    group.add(lidPivot);

    // Glowing interior beam that turns on when opened
    const glowBeam = this.glowBox(0.8, 0.1, 0.5, goldRim, goldRim, 2.0);
    glowBeam.position.set(0, 0.45, 0);
    glowBeam.visible = false;
    group.add(glowBeam);

    return { group, lidPivot, glowBeam, rarity };
  },

  createSpikeTrap() {
    const group = new THREE.Group();
    // Floor grate
    const grate = this.box(1.8, 0.08, 1.8, 0x212121);
    grate.position.y = 0.04;
    group.add(grate);

    // Retractable spikes group
    const spikes = new THREE.Group();
    const iron = 0xb0bec5;
    for (let x = -0.6; x <= 0.6; x += 0.4) {
      for (let z = -0.6; z <= 0.6; z += 0.4) {
        const spike = this.box(0.08, 0.65, 0.08, iron);
        spike.position.set(x, 0.35, z);
        spikes.add(spike);
      }
    }
    spikes.position.y = -0.6; // initially lowered underground
    group.add(spikes);

    return { group, spikes };
  },

  createExitPortal(colorHex = 0x00e5ff) {
    const group = new THREE.Group();
    const stone = 0x37474f;

    // Left pillar
    const p1 = this.box(0.55, 3.2, 0.55, stone);
    p1.position.set(-1.3, 1.6, 0);
    group.add(p1);

    // Right pillar
    const p2 = this.box(0.55, 3.2, 0.55, stone);
    p2.position.set(1.3, 1.6, 0);
    group.add(p2);

    // Top lintel
    const lintel = this.box(3.2, 0.6, 0.6, stone);
    lintel.position.set(0, 3.2, 0);
    group.add(lintel);

    // Swirling portal energy slab
    const energy = this.glowBox(2.0, 2.6, 0.15, colorHex, colorHex, 2.0);
    energy.position.set(0, 1.5, 0);
    group.add(energy);

    // Light
    const light = new THREE.PointLight(colorHex, 1.5, 10.0);
    light.position.set(0, 1.6, 0.5);
    group.add(light);

    return { group, energy, light };
  }
};

window.ModelBuilder = ModelBuilder;
