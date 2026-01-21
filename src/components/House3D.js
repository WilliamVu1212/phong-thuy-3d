/**
 * HOUSE 3D - Render ngôi nhà 3D từ sơ đồ mặt bằng
 * Sử dụng Three.js để hiển thị mô hình 3D
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ROOM_TYPES } from '../utils/fengshui-rules.js';
import { HUONG } from '../utils/bagua-calculator.js';
import { FengShuiParticles } from './FengShuiParticles.js';

export class House3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.gridSize = options.gridSize || 10;

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // House components
    this.houseGroup = null;
    this.floorPlan = null;
    this.direction = null;

    // Settings
    this.cellSize3D = 1; // Kích thước mỗi ô trong không gian 3D
    this.wallHeight = 1.5;
    this.wallThickness = 0.1;

    // Animation
    this.animationId = null;
    this.clock = new THREE.Clock();

    // Feng Shui Particles
    this.particles = null;

    this.init();
  }

  init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupLighting();
    this.createFloor();
    this.setupViewButtons();
    this.setupParticles();
    this.animate();

    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);

    // Add fog for depth
    this.scene.fog = new THREE.Fog(0x0a0a1a, 10, 50);
  }

  setupCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(8, 12, 8);
    this.camera.lookAt(0, 0, 0);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    this.container.appendChild(this.renderer.domElement);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    this.controls.target.set(0, 0, 0);
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    this.scene.add(sunLight);

    // Secondary light for fill
    const fillLight = new THREE.DirectionalLight(0xFFD700, 0.3);
    fillLight.position.set(-5, 10, -5);
    this.scene.add(fillLight);

    // Point light for warm interior feel
    const pointLight = new THREE.PointLight(0xFFAA00, 0.5, 20);
    pointLight.position.set(0, 3, 0);
    this.scene.add(pointLight);
  }

  createFloor() {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(this.gridSize, this.gridSize, 0x444444, 0x222222);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  setupViewButtons() {
    // Top view button
    const topViewBtn = document.getElementById('btn-top-view');
    if (topViewBtn) {
      topViewBtn.addEventListener('click', () => this.setTopView());
    }

    // Perspective view button
    const perspectiveBtn = document.getElementById('btn-perspective');
    if (perspectiveBtn) {
      perspectiveBtn.addEventListener('click', () => this.setPerspectiveView());
    }

    // Zoom buttons
    const zoomInBtn = document.getElementById('btn-zoom-in');
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => this.zoomIn());
    }

    const zoomOutBtn = document.getElementById('btn-zoom-out');
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => this.zoomOut());
    }
  }

  setupParticles() {
    this.particles = new FengShuiParticles({
      particleCount: 500,
      gridSize: this.gridSize
    });
    const particleGroup = this.particles.init();
    this.scene.add(particleGroup);
  }

  updateHouse(floorPlan, direction) {
    this.floorPlan = floorPlan;
    this.direction = direction;

    // Remove old house
    if (this.houseGroup) {
      this.scene.remove(this.houseGroup);
      this.disposeGroup(this.houseGroup);
    }

    // Create new house group
    this.houseGroup = new THREE.Group();

    // Calculate center offset
    const offset = this.gridSize / 2;

    // Create rooms
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const roomType = floorPlan[row][col];
        if (roomType && ROOM_TYPES[roomType]) {
          this.createRoom(row, col, roomType, offset);
        }
      }
    }

    // Create outer walls
    this.createOuterWalls(floorPlan, offset);

    // Rotate house based on direction
    if (direction) {
      const angle = this.getDirectionAngle(direction);
      this.houseGroup.rotation.y = angle;
    }

    this.scene.add(this.houseGroup);

    // Update particles with floor plan
    if (this.particles) {
      this.particles.updateFloorPlan(floorPlan);
    }
  }

  /**
   * Cập nhật particles với thông tin hướng tốt/xấu từ analysis
   */
  updateParticles(goodDirs, badDirs, score = 0) {
    if (this.particles) {
      this.particles.updateDirections(goodDirs, badDirs, this.direction);
      this.particles.updateScore(score);
    }
  }

  /**
   * Bật/tắt hiệu ứng particles
   */
  toggleParticles() {
    if (this.particles) {
      return this.particles.toggle();
    }
    return false;
  }

  /**
   * Set particles enabled/disabled
   */
  setParticlesEnabled(enabled) {
    if (this.particles) {
      this.particles.setEnabled(enabled);
    }
  }

  createRoom(row, col, roomType, offset) {
    const roomInfo = ROOM_TYPES[roomType];
    const x = col - offset + 0.5;
    const z = row - offset + 0.5;

    // Room floor
    const floorGeometry = new THREE.BoxGeometry(
      this.cellSize3D * 0.95,
      0.1,
      this.cellSize3D * 0.95
    );
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: roomInfo.color,
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(x, 0.05, z);
    floor.receiveShadow = true;
    floor.castShadow = true;
    this.houseGroup.add(floor);

    // Room walls (only internal separations)
    this.createRoomWalls(row, col, roomType, offset);

    // Room icon/label (floating above)
    this.createRoomLabel(x, z, roomInfo);
  }

  createRoomWalls(row, col, roomType, offset) {
    const x = col - offset + 0.5;
    const z = row - offset + 0.5;

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Màu gỗ cho tường nội thất
      roughness: 0.7,
      metalness: 0.1
    });

    // Check each neighbor and create wall if different room type
    const neighbors = [
      { dr: -1, dc: 0, pos: [x, this.wallHeight / 2, z - 0.5], rot: 0 }, // North
      { dr: 1, dc: 0, pos: [x, this.wallHeight / 2, z + 0.5], rot: 0 },  // South
      { dr: 0, dc: -1, pos: [x - 0.5, this.wallHeight / 2, z], rot: Math.PI / 2 }, // West
      { dr: 0, dc: 1, pos: [x + 0.5, this.wallHeight / 2, z], rot: Math.PI / 2 }   // East
    ];

    neighbors.forEach(({ dr, dc, pos, rot }) => {
      const newRow = row + dr;
      const newCol = col + dc;

      // Only create internal walls between different room types
      if (newRow >= 0 && newRow < this.gridSize &&
          newCol >= 0 && newCol < this.gridSize) {
        const neighborType = this.floorPlan[newRow][newCol];
        if (neighborType && neighborType !== roomType) {
          // Create low internal wall
          const wallGeometry = new THREE.BoxGeometry(
            this.cellSize3D,
            this.wallHeight * 0.3,
            this.wallThickness
          );
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(...pos);
          wall.position.y = this.wallHeight * 0.15;
          wall.rotation.y = rot;
          wall.castShadow = true;
          wall.receiveShadow = true;
          this.houseGroup.add(wall);
        }
      }
    });
  }

  createRoomLabel(x, z, roomInfo) {
    // Create a simple floating marker
    const markerGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: roomInfo.color,
      emissive: roomInfo.color,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.5
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(x, this.wallHeight + 0.3, z);
    this.houseGroup.add(marker);

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: roomInfo.color,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(marker.position);
    this.houseGroup.add(glow);
  }

  createOuterWalls(floorPlan, offset) {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4A574, // Màu tường ngoài
      roughness: 0.6,
      metalness: 0.1
    });

    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700, // Màu vàng cho cửa
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0xFFD700,
      emissiveIntensity: 0.2
    });

    // Find the boundary cells
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const roomType = floorPlan[row][col];
        if (!roomType) continue;

        const x = col - offset + 0.5;
        const z = row - offset + 0.5;

        // Check each direction for empty neighbor (boundary)
        const directions = [
          { dr: -1, dc: 0, pos: [x, this.wallHeight / 2, z - 0.5], rot: 0 },     // North
          { dr: 1, dc: 0, pos: [x, this.wallHeight / 2, z + 0.5], rot: 0 },      // South
          { dr: 0, dc: -1, pos: [x - 0.5, this.wallHeight / 2, z], rot: Math.PI / 2 }, // West
          { dr: 0, dc: 1, pos: [x + 0.5, this.wallHeight / 2, z], rot: Math.PI / 2 }   // East
        ];

        directions.forEach(({ dr, dc, pos, rot }) => {
          const newRow = row + dr;
          const newCol = col + dc;

          // Check if this is a boundary (neighbor is empty or out of bounds)
          const isOutOfBounds = newRow < 0 || newRow >= this.gridSize ||
                               newCol < 0 || newCol >= this.gridSize;
          const isEmpty = !isOutOfBounds && !floorPlan[newRow][newCol];

          if (isOutOfBounds || isEmpty) {
            // This is a boundary - create wall
            const isDoor = roomType === 'door';

            const wallGeometry = new THREE.BoxGeometry(
              this.cellSize3D,
              isDoor ? this.wallHeight * 0.3 : this.wallHeight,
              this.wallThickness
            );

            const material = isDoor ? doorMaterial : wallMaterial;
            const wall = new THREE.Mesh(wallGeometry, material);
            wall.position.set(pos[0], isDoor ? this.wallHeight * 0.85 : pos[1], pos[2]);
            wall.rotation.y = rot;
            wall.castShadow = true;
            wall.receiveShadow = true;
            this.houseGroup.add(wall);

            // Add door frame if it's a door
            if (isDoor) {
              this.createDoorFrame(pos, rot);
            }
          }
        });
      }
    }
  }

  createDoorFrame(pos, rot) {
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.5,
      metalness: 0.2
    });

    // Left frame
    const leftFrameGeometry = new THREE.BoxGeometry(0.08, this.wallHeight, 0.15);
    const leftFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial);
    leftFrame.position.set(pos[0] - 0.45, this.wallHeight / 2, pos[2]);
    leftFrame.rotation.y = rot;
    this.houseGroup.add(leftFrame);

    // Right frame
    const rightFrame = leftFrame.clone();
    rightFrame.position.set(pos[0] + 0.45, this.wallHeight / 2, pos[2]);
    rightFrame.rotation.y = rot;
    this.houseGroup.add(rightFrame);

    // Top frame
    const topFrameGeometry = new THREE.BoxGeometry(1, 0.08, 0.15);
    const topFrame = new THREE.Mesh(topFrameGeometry, frameMaterial);
    topFrame.position.set(pos[0], this.wallHeight * 0.7, pos[2]);
    topFrame.rotation.y = rot;
    this.houseGroup.add(topFrame);
  }

  getDirectionAngle(direction) {
    const angles = {
      'N': 0,
      'NE': -Math.PI / 4,
      'E': -Math.PI / 2,
      'SE': -Math.PI * 3 / 4,
      'S': Math.PI,
      'SW': Math.PI * 3 / 4,
      'W': Math.PI / 2,
      'NW': Math.PI / 4
    };
    return angles[direction] || 0;
  }

  setTopView() {
    // Animate to top view
    this.animateCamera(
      { x: 0, y: 15, z: 0.1 },
      { x: 0, y: 0, z: 0 }
    );

    // Update button states
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-top-view')?.classList.add('active');
  }

  setPerspectiveView() {
    // Animate to perspective view
    this.animateCamera(
      { x: 8, y: 12, z: 8 },
      { x: 0, y: 0, z: 0 }
    );

    // Update button states
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-perspective')?.classList.add('active');
  }

  zoomIn() {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    this.camera.position.addScaledVector(direction, 2);
  }

  zoomOut() {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    this.camera.position.addScaledVector(direction, -2);
  }

  animateCamera(targetPosition, targetLookAt) {
    const startPosition = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPosition, new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z), eased);
      this.controls.target.lerpVectors(startTarget, new THREE.Vector3(targetLookAt.x, targetLookAt.y, targetLookAt.z), eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    // Update controls
    this.controls.update();

    // Update particles
    if (this.particles) {
      this.particles.update(deltaTime);
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  disposeGroup(group) {
    group.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Dispose particles
    if (this.particles) {
      this.particles.dispose();
    }

    // Dispose all meshes
    this.scene.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    // Dispose renderer
    this.renderer.dispose();

    // Remove canvas
    this.container.removeChild(this.renderer.domElement);
  }

  // Get current rotation for compass sync
  getRotation() {
    return this.houseGroup ? this.houseGroup.rotation.y : 0;
  }
}

export default House3D;
