/**
 * FENG SHUI PARTICLES - Hiệu ứng Linh Khí Phong Thủy
 * Nguồn linh khí lơ lửng trên nhà, cường độ theo điểm số
 * Bát Quái xoay khi đạt 90+ điểm
 * Style: Tiên hiệp, thần bí, ấn tượng
 */

import * as THREE from 'three';

export class FengShuiParticles {
  constructor(options = {}) {
    this.gridSize = options.gridSize || 10;

    // State
    this.enabled = true;
    this.score = 0;
    this.goodDirections = [];
    this.badDirections = [];
    this.floorPlan = null;
    this.mainDirection = null;
    this.houseCenter = new THREE.Vector3(0, 0, 0);
    this.houseBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };

    // Animation
    this.clock = new THREE.Clock();

    // Components
    this.centralOrb = null;
    this.energyRings = [];
    this.baguaSymbol = null;
    this.arrows = [];
    this.auraParticles = null;
    this.ascendingParticles = null;

    // Settings theo điểm
    this.intensityLevels = {
      veryLow: { min: 0, max: 30 },
      low: { min: 31, max: 50 },
      medium: { min: 51, max: 70 },
      high: { min: 71, max: 89 },
      legendary: { min: 90, max: 100 }
    };

    // Colors
    this.colors = {
      veryLow: {
        primary: new THREE.Color(0x444466),
        glow: new THREE.Color(0x333355),
        particle: new THREE.Color(0x555577)
      },
      low: {
        primary: new THREE.Color(0x6688aa),
        glow: new THREE.Color(0x557799),
        particle: new THREE.Color(0x7799bb)
      },
      medium: {
        primary: new THREE.Color(0x44aaff),
        glow: new THREE.Color(0x66bbff),
        particle: new THREE.Color(0x88ccff)
      },
      high: {
        primary: new THREE.Color(0x00ffaa),
        glow: new THREE.Color(0x44ffcc),
        particle: new THREE.Color(0x88ffdd)
      },
      legendary: {
        primary: new THREE.Color(0xffdd00),
        glow: new THREE.Color(0xffee66),
        particle: new THREE.Color(0xffffaa),
        bagua: new THREE.Color(0xffd700)
      }
    };

    // Group chính
    this.particleGroup = new THREE.Group();
    this.particleGroup.name = 'fengshui-particles';
  }

  /**
   * Khởi tạo hệ thống
   */
  init() {
    this.createCentralOrb();
    this.createEnergyRings();
    this.createBaguaSymbol();
    this.createArrowPool();
    this.createAuraParticles();
    this.createAscendingParticles();

    // Ẩn tất cả ban đầu
    this.hideAll();

    return this.particleGroup;
  }

  /**
   * Tạo cầu linh khí trung tâm
   */
  createCentralOrb() {
    const group = new THREE.Group();
    group.name = 'central-orb';

    // Core - lõi sáng
    const coreGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Inner glow
    const innerGlowGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0.5,
      side: THREE.BackSide
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    group.add(innerGlow);

    // Outer glow
    const outerGlowGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffee88,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    group.add(outerGlow);

    // Point light
    const light = new THREE.PointLight(0xffdd00, 1, 10);
    group.add(light);

    group.position.y = 4; // Lơ lửng trên cao

    this.centralOrb = {
      group,
      core,
      innerGlow,
      outerGlow,
      light,
      coreMat,
      innerGlowMat,
      outerGlowMat
    };

    this.particleGroup.add(group);
  }

  /**
   * Tạo các vòng năng lượng xoay
   */
  createEnergyRings() {
    const ringCount = 5;

    for (let i = 0; i < ringCount; i++) {
      const radius = 1 + i * 0.5;
      const tubeRadius = 0.03 + (ringCount - i) * 0.01;

      const geometry = new THREE.TorusGeometry(radius, tubeRadius, 8, 64);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: true,
        opacity: 0.6 - i * 0.1
      });

      const ring = new THREE.Mesh(geometry, material);
      ring.position.y = 4;

      ring.userData = {
        index: i,
        baseRadius: radius,
        rotationSpeed: (0.3 + i * 0.1) * (i % 2 === 0 ? 1 : -1),
        tiltSpeed: 0.2 + i * 0.05,
        baseOpacity: 0.6 - i * 0.1
      };

      this.energyRings.push({ mesh: ring, material });
      this.particleGroup.add(ring);
    }
  }

  /**
   * Tạo biểu tượng Bát Quái (cho 90+ điểm)
   */
  createBaguaSymbol() {
    const group = new THREE.Group();
    group.name = 'bagua-symbol';

    // Vòng ngoài Bát Quái
    const outerRingGeo = new THREE.TorusGeometry(1.8, 0.08, 8, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.8
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    group.add(outerRing);

    // 8 quái tượng (trigrams)
    const trigrams = this.createTrigrams();
    trigrams.forEach(t => group.add(t));

    // Âm Dương ở giữa
    const yinYang = this.createYinYang();
    group.add(yinYang);

    // Hào quang xung quanh Bát Quái
    const haloGeo = new THREE.RingGeometry(1.9, 2.5, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    group.add(halo);

    group.rotation.x = -Math.PI / 2; // Nằm ngang
    group.position.y = 4.5;
    group.visible = false;

    this.baguaSymbol = {
      group,
      outerRing,
      outerRingMat,
      halo,
      haloMat
    };

    this.particleGroup.add(group);
  }

  /**
   * Tạo 8 quái tượng
   */
  createTrigrams() {
    const trigrams = [];
    const trigramData = [
      { lines: [1, 1, 1], name: 'Càn' },   // ☰
      { lines: [0, 0, 0], name: 'Khôn' },  // ☷
      { lines: [1, 0, 0], name: 'Chấn' },  // ☳
      { lines: [0, 1, 1], name: 'Tốn' },   // ☴
      { lines: [0, 1, 0], name: 'Khảm' },  // ☵
      { lines: [1, 0, 1], name: 'Ly' },    // ☲
      { lines: [1, 1, 0], name: 'Cấn' },   // ☶
      { lines: [0, 0, 1], name: 'Đoài' }   // ☱
    ];

    trigramData.forEach((data, i) => {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const distance = 1.3;

      const trigramGroup = new THREE.Group();
      trigramGroup.position.x = Math.cos(angle) * distance;
      trigramGroup.position.y = Math.sin(angle) * distance;
      trigramGroup.rotation.z = angle + Math.PI / 2;

      // Vẽ 3 hào
      data.lines.forEach((line, j) => {
        const y = (1 - j) * 0.12;

        if (line === 1) {
          // Hào dương (—)
          const lineGeo = new THREE.PlaneGeometry(0.25, 0.03);
          const lineMat = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            side: THREE.DoubleSide
          });
          const lineMesh = new THREE.Mesh(lineGeo, lineMat);
          lineMesh.position.y = y;
          trigramGroup.add(lineMesh);
        } else {
          // Hào âm (— —)
          const lineGeo = new THREE.PlaneGeometry(0.1, 0.03);
          const lineMat = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            side: THREE.DoubleSide
          });

          const leftLine = new THREE.Mesh(lineGeo, lineMat);
          leftLine.position.set(-0.07, y, 0);
          trigramGroup.add(leftLine);

          const rightLine = new THREE.Mesh(lineGeo, lineMat);
          rightLine.position.set(0.07, y, 0);
          trigramGroup.add(rightLine);
        }
      });

      trigrams.push(trigramGroup);
    });

    return trigrams;
  }

  /**
   * Tạo biểu tượng Âm Dương
   */
  createYinYang() {
    const group = new THREE.Group();

    // Nền tròn
    const bgGeo = new THREE.CircleGeometry(0.4, 32);
    const bgMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide
    });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    group.add(bg);

    // Nửa trắng
    const whiteGeo = new THREE.CircleGeometry(0.4, 32, 0, Math.PI);
    const whiteMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    const white = new THREE.Mesh(whiteGeo, whiteMat);
    white.rotation.z = Math.PI / 2;
    group.add(white);

    // Vòng tròn nhỏ trên
    const smallWhiteGeo = new THREE.CircleGeometry(0.2, 32);
    const smallWhite = new THREE.Mesh(smallWhiteGeo, whiteMat);
    smallWhite.position.y = 0.2;
    smallWhite.position.z = 0.01;
    group.add(smallWhite);

    // Vòng tròn nhỏ dưới
    const smallBlackGeo = new THREE.CircleGeometry(0.2, 32);
    const smallBlack = new THREE.Mesh(smallBlackGeo, bgMat.clone());
    smallBlack.position.y = -0.2;
    smallBlack.position.z = 0.01;
    group.add(smallBlack);

    // Chấm đen trong trắng
    const dotBlackGeo = new THREE.CircleGeometry(0.06, 16);
    const dotBlack = new THREE.Mesh(dotBlackGeo, bgMat.clone());
    dotBlack.position.set(0, 0.2, 0.02);
    group.add(dotBlack);

    // Chấm trắng trong đen
    const dotWhiteGeo = new THREE.CircleGeometry(0.06, 16);
    const dotWhite = new THREE.Mesh(dotWhiteGeo, whiteMat.clone());
    dotWhite.position.set(0, -0.2, 0.02);
    group.add(dotWhite);

    return group;
  }

  /**
   * Tạo pool mũi tên thần lực
   */
  createArrowPool() {
    const arrowCount = 80;
    const arrowShape = this.createArrowShape();

    for (let i = 0; i < arrowCount; i++) {
      const arrow = this.createSingleArrow(arrowShape, i);
      this.arrows.push(arrow);
      this.particleGroup.add(arrow.group);
    }
  }

  /**
   * Tạo hình mũi tên
   */
  createArrowShape() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.35);
    shape.lineTo(-0.1, 0.1);
    shape.lineTo(-0.04, 0.1);
    shape.lineTo(-0.04, -0.25);
    shape.lineTo(0.04, -0.25);
    shape.lineTo(0.04, 0.1);
    shape.lineTo(0.1, 0.1);
    shape.closePath();
    return shape;
  }

  /**
   * Tạo một mũi tên
   */
  createSingleArrow(shape, index) {
    const group = new THREE.Group();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.015,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 1
    });

    const material = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    const arrow = new THREE.Mesh(geometry, material);
    arrow.rotation.x = -Math.PI / 2;
    group.add(arrow);

    // Glow
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffee88,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(geometry.clone(), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.scale.setScalar(1.4);
    group.add(glow);

    // Trail
    const trails = [];
    for (let t = 0; t < 6; t++) {
      const trailGeo = new THREE.SphereGeometry(0.025 - t * 0.003, 6, 6);
      const trailMat = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: true,
        opacity: 0.5 - t * 0.08
      });
      const trail = new THREE.Mesh(trailGeo, trailMat);
      trail.visible = false;
      trails.push(trail);
      group.add(trail);
    }

    group.visible = false;

    return {
      group,
      arrow,
      material,
      glowMat,
      trails,
      active: false,
      progress: 0,
      speed: 0,
      angle: 0,
      startY: 0,
      delay: index * 0.05,
      trailPositions: [],
      scale: 1
    };
  }

  /**
   * Tạo aura particles xung quanh nguồn
   */
  createAuraParticles() {
    const count = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 1.5;
      const height = Math.random() * 2 - 1;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 4 + height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 0.4;

      sizes[i] = Math.random() * 0.08 + 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.auraParticles = new THREE.Points(geometry, material);
    this.auraParticles.visible = false;
    this.particleGroup.add(this.auraParticles);
  }

  /**
   * Tạo particles bay lên (thăng thiên effect)
   */
  createAscendingParticles() {
    const count = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 0.3;

      velocities[i] = 0.5 + Math.random() * 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.userData = { velocities };

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.ascendingParticles = new THREE.Points(geometry, material);
    this.ascendingParticles.visible = false;
    this.particleGroup.add(this.ascendingParticles);
  }

  /**
   * Ẩn tất cả
   */
  hideAll() {
    if (this.centralOrb) this.centralOrb.group.visible = false;
    this.energyRings.forEach(r => r.mesh.visible = false);
    if (this.baguaSymbol) this.baguaSymbol.group.visible = false;
    this.arrows.forEach(a => {
      a.group.visible = false;
      a.active = false;
    });
    if (this.auraParticles) this.auraParticles.visible = false;
    if (this.ascendingParticles) this.ascendingParticles.visible = false;
  }

  /**
   * Cập nhật điểm số và hiệu ứng
   */
  updateScore(score) {
    this.score = Math.max(0, Math.min(100, score));

    if (!this.enabled || this.score === 0) {
      this.hideAll();
      return;
    }

    // Xác định level
    const level = this.getIntensityLevel();
    const colorSet = this.colors[level];
    const intensity = this.score / 100;

    // Cập nhật Central Orb
    this.updateCentralOrb(intensity, colorSet);

    // Cập nhật Energy Rings
    this.updateEnergyRingsAppearance(intensity, colorSet);

    // Cập nhật Bát Quái (chỉ hiện khi 90+)
    this.updateBagua(level === 'legendary');

    // Cập nhật Arrows
    this.updateArrowsAppearance(intensity, colorSet);

    // Cập nhật Particles
    this.updateParticlesAppearance(intensity, colorSet);
  }

  /**
   * Lấy level theo điểm
   */
  getIntensityLevel() {
    if (this.score >= 90) return 'legendary';
    if (this.score >= 71) return 'high';
    if (this.score >= 51) return 'medium';
    if (this.score >= 31) return 'low';
    return 'veryLow';
  }

  /**
   * Cập nhật Central Orb
   */
  updateCentralOrb(intensity, colorSet) {
    if (!this.centralOrb) return;

    this.centralOrb.group.visible = this.enabled;

    // Scale theo điểm
    const scale = 0.5 + intensity * 1;
    this.centralOrb.group.scale.setScalar(scale);

    // Màu sắc
    this.centralOrb.innerGlowMat.color.copy(colorSet.primary);
    this.centralOrb.outerGlowMat.color.copy(colorSet.glow);
    this.centralOrb.light.color.copy(colorSet.primary);

    // Độ sáng
    this.centralOrb.innerGlowMat.opacity = 0.3 + intensity * 0.5;
    this.centralOrb.outerGlowMat.opacity = 0.1 + intensity * 0.3;
    this.centralOrb.light.intensity = 0.5 + intensity * 2;
  }

  /**
   * Cập nhật Energy Rings
   */
  updateEnergyRingsAppearance(intensity, colorSet) {
    const visibleRings = Math.ceil(intensity * 5);

    this.energyRings.forEach((ring, i) => {
      ring.mesh.visible = this.enabled && i < visibleRings;
      ring.material.color.copy(colorSet.primary);
      ring.material.opacity = ring.mesh.userData.baseOpacity * intensity;
    });
  }

  /**
   * Cập nhật Bát Quái
   */
  updateBagua(show) {
    if (!this.baguaSymbol) return;
    this.baguaSymbol.group.visible = this.enabled && show;
  }

  /**
   * Cập nhật Arrows
   */
  updateArrowsAppearance(intensity, colorSet) {
    const activeCount = Math.floor(intensity * this.arrows.length);

    this.arrows.forEach((arrow, i) => {
      if (i < activeCount) {
        arrow.material.color.copy(colorSet.primary);
        arrow.glowMat.color.copy(colorSet.glow);
        arrow.trails.forEach(t => t.material.color.copy(colorSet.particle));

        if (!arrow.active) {
          this.activateArrow(arrow, i);
        }
      } else {
        arrow.active = false;
        arrow.group.visible = false;
      }
    });
  }

  /**
   * Kích hoạt một mũi tên
   */
  activateArrow(arrow, index) {
    arrow.active = true;
    arrow.group.visible = this.enabled;
    arrow.progress = 0;
    arrow.angle = (index / this.arrows.length) * Math.PI * 2 + Math.random() * 0.5;
    arrow.speed = 0.8 + Math.random() * 0.6;
    arrow.startY = 3.5 + Math.random() * 1;
    arrow.delay = Math.random() * 2;
    arrow.scale = 0.5 + Math.random() * 0.5;
    arrow.trailPositions = [];
  }

  /**
   * Cập nhật particles appearance
   */
  updateParticlesAppearance(intensity, colorSet) {
    if (this.auraParticles) {
      this.auraParticles.visible = this.enabled && intensity > 0.3;
      this.auraParticles.material.opacity = 0.3 + intensity * 0.5;

      const colors = this.auraParticles.geometry.attributes.color.array;
      for (let i = 0; i < colors.length / 3; i++) {
        colors[i * 3] = colorSet.particle.r;
        colors[i * 3 + 1] = colorSet.particle.g;
        colors[i * 3 + 2] = colorSet.particle.b;
      }
      this.auraParticles.geometry.attributes.color.needsUpdate = true;
    }

    if (this.ascendingParticles) {
      this.ascendingParticles.visible = this.enabled && intensity > 0.5;
      this.ascendingParticles.material.opacity = 0.2 + intensity * 0.4;

      const colors = this.ascendingParticles.geometry.attributes.color.array;
      for (let i = 0; i < colors.length / 3; i++) {
        colors[i * 3] = colorSet.particle.r;
        colors[i * 3 + 1] = colorSet.particle.g;
        colors[i * 3 + 2] = colorSet.particle.b;
      }
      this.ascendingParticles.geometry.attributes.color.needsUpdate = true;
    }
  }

  /**
   * Cập nhật hướng (giữ tương thích)
   */
  updateDirections(goodDirs, badDirs, mainDir) {
    this.goodDirections = goodDirs || [];
    this.badDirections = badDirs || [];
    this.mainDirection = mainDir;
  }

  /**
   * Cập nhật floor plan và tính center
   */
  updateFloorPlan(floorPlan) {
    this.floorPlan = floorPlan;
    this.calculateHouseCenter();

    // Di chuyển particle group đến vị trí nhà
    this.particleGroup.position.copy(this.houseCenter);
  }

  /**
   * Tính tâm ngôi nhà
   */
  calculateHouseCenter() {
    if (!this.floorPlan) return;

    const offset = this.gridSize / 2;
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let count = 0;

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.floorPlan[row][col]) {
          const x = col - offset + 0.5;
          const z = row - offset + 0.5;

          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minZ = Math.min(minZ, z);
          maxZ = Math.max(maxZ, z);
          count++;
        }
      }
    }

    if (count > 0) {
      this.houseCenter.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
      this.houseBounds = { minX, maxX, minZ, maxZ };
    }
  }

  /**
   * Animation loop
   */
  update(deltaTime) {
    if (!this.enabled || this.score === 0) return;

    const time = this.clock.getElapsedTime();
    const intensity = this.score / 100;

    this.updateCentralOrbAnimation(time, intensity);
    this.updateEnergyRingsAnimation(time, intensity);
    this.updateBaguaAnimation(time);
    this.updateArrowsAnimation(time, deltaTime, intensity);
    this.updateAuraAnimation(time, intensity);
    this.updateAscendingAnimation(time, deltaTime, intensity);
  }

  /**
   * Animation Central Orb
   */
  updateCentralOrbAnimation(time, intensity) {
    if (!this.centralOrb || !this.centralOrb.group.visible) return;

    // Pulse
    const pulse = Math.sin(time * 3) * 0.5 + 0.5;
    const scale = (0.5 + intensity) * (0.9 + pulse * 0.2);
    this.centralOrb.group.scale.setScalar(scale);

    // Glow opacity pulse
    this.centralOrb.innerGlowMat.opacity = (0.3 + intensity * 0.5) * (0.8 + pulse * 0.2);
    this.centralOrb.outerGlowMat.opacity = (0.1 + intensity * 0.3) * (0.7 + pulse * 0.3);

    // Float up and down
    this.centralOrb.group.position.y = 4 + Math.sin(time * 0.5) * 0.3;
  }

  /**
   * Animation Energy Rings
   */
  updateEnergyRingsAnimation(time, intensity) {
    this.energyRings.forEach(ring => {
      if (!ring.mesh.visible) return;

      const { rotationSpeed, tiltSpeed, baseOpacity, index } = ring.mesh.userData;

      // Xoay
      ring.mesh.rotation.z += rotationSpeed * 0.02 * (1 + intensity);

      // Nghiêng
      ring.mesh.rotation.x = Math.sin(time * tiltSpeed + index) * 0.3;
      ring.mesh.rotation.y = Math.cos(time * tiltSpeed * 0.7 + index) * 0.2;

      // Pulse opacity
      const pulse = Math.sin(time * 2 + index * 0.5) * 0.5 + 0.5;
      ring.material.opacity = baseOpacity * intensity * (0.7 + pulse * 0.3);

      // Follow central orb
      ring.mesh.position.y = 4 + Math.sin(time * 0.5) * 0.3;
    });
  }

  /**
   * Animation Bát Quái
   */
  updateBaguaAnimation(time) {
    if (!this.baguaSymbol || !this.baguaSymbol.group.visible) return;

    // Xoay chậm
    this.baguaSymbol.group.rotation.z += 0.005;

    // Pulse halo
    const pulse = Math.sin(time * 2) * 0.5 + 0.5;
    this.baguaSymbol.haloMat.opacity = 0.15 + pulse * 0.15;

    // Float
    this.baguaSymbol.group.position.y = 4.5 + Math.sin(time * 0.5) * 0.3;
  }

  /**
   * Animation Arrows - tỏa ra xung quanh
   */
  updateArrowsAnimation(time, deltaTime, intensity) {
    const houseWidth = Math.max(2, this.houseBounds.maxX - this.houseBounds.minX);
    const houseDepth = Math.max(2, this.houseBounds.maxZ - this.houseBounds.minZ);
    const maxRadius = Math.max(houseWidth, houseDepth) * 0.8 + 3;

    this.arrows.forEach((arrow, index) => {
      if (!arrow.active || !arrow.group.visible) return;

      // Delay
      if (arrow.delay > 0) {
        arrow.delay -= deltaTime;
        return;
      }

      // Progress
      arrow.progress += deltaTime * arrow.speed * 0.25;

      if (arrow.progress >= 1) {
        // Reset
        arrow.progress = 0;
        arrow.delay = Math.random() * 1.5;
        arrow.angle = Math.random() * Math.PI * 2;
        arrow.speed = 0.8 + Math.random() * 0.6;
        arrow.startY = 3.5 + Math.random() * 1;
        arrow.scale = 0.5 + Math.random() * 0.5;
        arrow.trailPositions = [];
        return;
      }

      // Vị trí - bay ra ngoài theo hình tròn
      const radius = arrow.progress * maxRadius;
      const spiralAngle = arrow.angle + arrow.progress * Math.PI * 0.5;
      const heightCurve = Math.sin(arrow.progress * Math.PI) * 1.5;

      const pos = arrow.group.position;
      pos.x = Math.cos(spiralAngle) * radius;
      pos.y = arrow.startY + heightCurve - arrow.progress * 2;
      pos.z = Math.sin(spiralAngle) * radius;

      // Hướng mũi tên ra ngoài
      arrow.group.rotation.y = -spiralAngle - Math.PI / 2;

      // Fade out
      const fadeOut = 1 - Math.pow(arrow.progress, 1.5);
      arrow.material.opacity = 0.9 * fadeOut * intensity;
      arrow.glowMat.opacity = 0.3 * fadeOut * intensity;
      arrow.group.scale.setScalar(arrow.scale * (0.8 + fadeOut * 0.4));

      // Trail
      arrow.trailPositions.unshift(pos.clone());
      if (arrow.trailPositions.length > 6) arrow.trailPositions.pop();

      arrow.trails.forEach((trail, t) => {
        if (t < arrow.trailPositions.length) {
          trail.visible = true;
          const tp = arrow.trailPositions[t];
          trail.position.set(tp.x - pos.x, tp.y - pos.y, tp.z - pos.z);
          trail.material.opacity = (0.4 - t * 0.06) * fadeOut * intensity;
        } else {
          trail.visible = false;
        }
      });
    });
  }

  /**
   * Animation Aura particles
   */
  updateAuraAnimation(time, intensity) {
    if (!this.auraParticles || !this.auraParticles.visible) return;

    const positions = this.auraParticles.geometry.attributes.position.array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const angle = time * 0.3 * (1 + intensity) + (i / count) * Math.PI * 2;
      const radius = 0.5 + Math.sin(time * 0.5 + i) * 0.3 + (i % 10) * 0.1;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 4 + Math.sin(time + i * 0.1) * 0.5 + Math.sin(time * 0.5) * 0.3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    this.auraParticles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Animation Ascending particles
   */
  updateAscendingAnimation(time, deltaTime, intensity) {
    if (!this.ascendingParticles || !this.ascendingParticles.visible) return;

    const positions = this.ascendingParticles.geometry.attributes.position.array;
    const velocities = this.ascendingParticles.geometry.userData.velocities;
    const count = positions.length / 3;

    const houseWidth = Math.max(2, this.houseBounds.maxX - this.houseBounds.minX);
    const houseDepth = Math.max(2, this.houseBounds.maxZ - this.houseBounds.minZ);

    for (let i = 0; i < count; i++) {
      // Bay lên
      positions[i * 3 + 1] += velocities[i] * deltaTime * intensity * 2;

      // Xoáy nhẹ
      const angle = time * 0.2 + i * 0.1;
      positions[i * 3] += Math.sin(angle) * 0.01;
      positions[i * 3 + 2] += Math.cos(angle) * 0.01;

      // Reset nếu bay quá cao
      if (positions[i * 3 + 1] > 8) {
        positions[i * 3] = (Math.random() - 0.5) * houseWidth * 2;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (Math.random() - 0.5) * houseDepth * 2;
      }
    }

    this.ascendingParticles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Bật/tắt
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.hideAll();
    } else if (this.score > 0) {
      this.updateScore(this.score);
    }
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * Dispose
   */
  dispose() {
    // Dispose central orb
    if (this.centralOrb) {
      this.centralOrb.core.geometry.dispose();
      this.centralOrb.coreMat.dispose();
      this.centralOrb.innerGlow.geometry.dispose();
      this.centralOrb.innerGlowMat.dispose();
      this.centralOrb.outerGlow.geometry.dispose();
      this.centralOrb.outerGlowMat.dispose();
    }

    // Dispose rings
    this.energyRings.forEach(ring => {
      ring.mesh.geometry.dispose();
      ring.material.dispose();
    });

    // Dispose bagua
    if (this.baguaSymbol) {
      this.baguaSymbol.group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }

    // Dispose arrows
    this.arrows.forEach(arrow => {
      arrow.arrow.geometry.dispose();
      arrow.material.dispose();
      arrow.glowMat.dispose();
      arrow.trails.forEach(t => {
        t.geometry.dispose();
        t.material.dispose();
      });
    });

    // Dispose particles
    if (this.auraParticles) {
      this.auraParticles.geometry.dispose();
      this.auraParticles.material.dispose();
    }
    if (this.ascendingParticles) {
      this.ascendingParticles.geometry.dispose();
      this.ascendingParticles.material.dispose();
    }

    this.particleGroup.clear();
  }

  getGroup() {
    return this.particleGroup;
  }
}

export default FengShuiParticles;
