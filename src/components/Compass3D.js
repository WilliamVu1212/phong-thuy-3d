/**
 * COMPASS 3D - La bàn phong thủy 3D
 * Hiển thị hướng và highlight hướng tốt/xấu
 */

import * as THREE from 'three';
import { HUONG } from '../utils/bagua-calculator.js';

export class Compass3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    // Lấy kích thước từ container thực tế
    const containerSize = Math.min(this.container.offsetWidth, this.container.offsetHeight);
    this.size = containerSize > 0 ? containerSize : (options.size || 150);

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.compassGroup = null;
    this.needleGroup = null;

    // State
    this.rotation = 0;
    this.goodDirections = [];
    this.badDirections = [];
    this.currentDirection = null;

    // Animation
    this.animationId = null;

    this.init();

    // Listen for resize
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  handleResize() {
    const containerSize = Math.min(this.container.offsetWidth, this.container.offsetHeight);
    if (containerSize > 0 && containerSize !== this.size) {
      this.size = containerSize;
      this.renderer.setSize(this.size, this.size);
    }
  }

  init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupLighting();
    this.createCompass();
    this.animate();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent background
  }

  setupCamera() {
    this.camera = new THREE.OrthographicCamera(
      -2, 2, 2, -2, 0.1, 100
    );
    this.camera.position.set(0, 5, 0);
    this.camera.lookAt(0, 0, 0);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.size, this.size);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.container.appendChild(this.renderer.domElement);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 5, 2);
    this.scene.add(directionalLight);
  }

  createCompass() {
    this.compassGroup = new THREE.Group();

    // Base circle (outer ring)
    this.createOuterRing();

    // Direction markers
    this.createDirectionMarkers();

    // Inner bagua pattern
    this.createBaguaPattern();

    // Center yin-yang
    this.createYinYang();

    // Needle
    this.createNeedle();

    this.scene.add(this.compassGroup);
  }

  createOuterRing() {
    // Main ring
    const ringGeometry = new THREE.RingGeometry(1.4, 1.6, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.8,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    this.compassGroup.add(ring);

    // Inner ring
    const innerRingGeometry = new THREE.RingGeometry(1.2, 1.4, 64);
    const innerRingMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B0000,
      metalness: 0.5,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.01;
    this.compassGroup.add(innerRing);

    // Background circle
    const bgGeometry = new THREE.CircleGeometry(1.2, 64);
    const bgMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    bg.rotation.x = -Math.PI / 2;
    bg.position.y = 0.005;
    this.compassGroup.add(bg);
  }

  createDirectionMarkers() {
    const directions = [
      { key: 'N', label: '北', angle: 0, isMain: true },
      { key: 'NE', label: '東北', angle: 45, isMain: false },
      { key: 'E', label: '東', angle: 90, isMain: true },
      { key: 'SE', label: '東南', angle: 135, isMain: false },
      { key: 'S', label: '南', angle: 180, isMain: true },
      { key: 'SW', label: '西南', angle: 225, isMain: false },
      { key: 'W', label: '西', angle: 270, isMain: true },
      { key: 'NW', label: '西北', angle: 315, isMain: false }
    ];

    this.directionMarkers = {};

    directions.forEach(dir => {
      const radians = (dir.angle - 90) * Math.PI / 180;
      const radius = 1.5;
      const x = Math.cos(radians) * radius;
      const z = Math.sin(radians) * radius;

      // Direction indicator (small triangle)
      const markerSize = dir.isMain ? 0.15 : 0.1;
      const markerGeometry = new THREE.ConeGeometry(markerSize, markerSize * 2, 4);
      const markerMaterial = new THREE.MeshStandardMaterial({
        color: dir.key === 'N' ? 0xFF0000 : 0xFFD700,
        metalness: 0.6,
        roughness: 0.3
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x * 0.85, 0.1, z * 0.85);
      marker.rotation.x = Math.PI;
      marker.rotation.y = -radians - Math.PI / 2;

      this.directionMarkers[dir.key] = marker;
      this.compassGroup.add(marker);

      // Tick mark
      const tickGeometry = new THREE.BoxGeometry(dir.isMain ? 0.08 : 0.04, 0.02, 0.15);
      const tickMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.7,
        roughness: 0.2
      });
      const tick = new THREE.Mesh(tickGeometry, tickMaterial);
      tick.position.set(x * 1.1, 0.02, z * 1.1);
      tick.rotation.y = -radians;
      this.compassGroup.add(tick);
    });
  }

  createBaguaPattern() {
    // Create 8 segments with trigram patterns
    const segmentAngle = Math.PI / 4;

    for (let i = 0; i < 8; i++) {
      const startAngle = i * segmentAngle - Math.PI / 8;
      const endAngle = startAngle + segmentAngle;

      // Segment background
      const segmentGeometry = new THREE.RingGeometry(0.5, 1.0, 16, 1, startAngle, segmentAngle);
      const segmentMaterial = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x2a2a4e : 0x1a1a3e,
        metalness: 0.1,
        roughness: 0.8,
        side: THREE.DoubleSide
      });
      const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
      segment.rotation.x = -Math.PI / 2;
      segment.position.y = 0.015;
      this.compassGroup.add(segment);
    }
  }

  createYinYang() {
    // Yin-Yang symbol in the center
    const yinYangGroup = new THREE.Group();

    // Main circle (white half)
    const mainGeometry = new THREE.CircleGeometry(0.4, 64);
    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      metalness: 0.1,
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    const whiteHalf = new THREE.Mesh(mainGeometry, whiteMaterial);
    whiteHalf.rotation.x = -Math.PI / 2;
    whiteHalf.position.y = 0.02;
    yinYangGroup.add(whiteHalf);

    // Black half
    const blackGeometry = new THREE.CircleGeometry(0.4, 64, 0, Math.PI);
    const blackMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.1,
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    const blackHalf = new THREE.Mesh(blackGeometry, blackMaterial);
    blackHalf.rotation.x = -Math.PI / 2;
    blackHalf.position.y = 0.025;
    yinYangGroup.add(blackHalf);

    // Small circles
    const smallWhiteGeometry = new THREE.CircleGeometry(0.12, 32);
    const smallWhite = new THREE.Mesh(smallWhiteGeometry, whiteMaterial);
    smallWhite.rotation.x = -Math.PI / 2;
    smallWhite.position.set(0, 0.03, 0.2);
    yinYangGroup.add(smallWhite);

    const smallBlackGeometry = new THREE.CircleGeometry(0.12, 32);
    const smallBlack = new THREE.Mesh(smallBlackGeometry, blackMaterial);
    smallBlack.rotation.x = -Math.PI / 2;
    smallBlack.position.set(0, 0.03, -0.2);
    yinYangGroup.add(smallBlack);

    // Wave curve
    const curveWhite = new THREE.CircleGeometry(0.2, 32, Math.PI, Math.PI);
    const curveWhiteMesh = new THREE.Mesh(curveWhite, whiteMaterial);
    curveWhiteMesh.rotation.x = -Math.PI / 2;
    curveWhiteMesh.position.set(0, 0.026, -0.2);
    yinYangGroup.add(curveWhiteMesh);

    const curveBlack = new THREE.CircleGeometry(0.2, 32, 0, Math.PI);
    const curveBlackMesh = new THREE.Mesh(curveBlack, blackMaterial);
    curveBlackMesh.rotation.x = -Math.PI / 2;
    curveBlackMesh.position.set(0, 0.026, 0.2);
    yinYangGroup.add(curveBlackMesh);

    this.compassGroup.add(yinYangGroup);
  }

  createNeedle() {
    this.needleGroup = new THREE.Group();

    // North pointer (red)
    const northGeometry = new THREE.ConeGeometry(0.08, 0.6, 4);
    const northMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0xFF0000,
      emissiveIntensity: 0.3
    });
    const northPointer = new THREE.Mesh(northGeometry, northMaterial);
    northPointer.position.set(0, 0.15, -0.25);
    northPointer.rotation.x = Math.PI / 2;
    this.needleGroup.add(northPointer);

    // South pointer (white)
    const southGeometry = new THREE.ConeGeometry(0.08, 0.6, 4);
    const southMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      metalness: 0.7,
      roughness: 0.2
    });
    const southPointer = new THREE.Mesh(southGeometry, southMaterial);
    southPointer.position.set(0, 0.15, 0.25);
    southPointer.rotation.x = -Math.PI / 2;
    this.needleGroup.add(southPointer);

    // Center pivot
    const pivotGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const pivotMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.8,
      roughness: 0.2
    });
    const pivot = new THREE.Mesh(pivotGeometry, pivotMaterial);
    pivot.position.y = 0.15;
    this.needleGroup.add(pivot);

    this.compassGroup.add(this.needleGroup);
  }

  setRotation(angle) {
    this.rotation = angle;
    // Rotate the compass base (not the needle, needle always points north)
    this.compassGroup.rotation.y = angle;
  }

  setDirection(direction) {
    this.currentDirection = direction;
    if (direction && HUONG[direction]) {
      const angle = HUONG[direction].angle * Math.PI / 180;
      this.setRotation(angle);
    }
  }

  setGoodBadDirections(goodDirs, badDirs) {
    this.goodDirections = goodDirs || [];
    this.badDirections = badDirs || [];
    this.updateDirectionColors();
  }

  updateDirectionColors() {
    // Reset all markers
    Object.entries(this.directionMarkers).forEach(([key, marker]) => {
      let color = key === 'N' ? 0xFF0000 : 0xFFD700;

      // Check if it's a good direction
      if (this.goodDirections.some(d => d.huong === key)) {
        color = 0x00FF00; // Green for good
        marker.material.emissive = new THREE.Color(0x00FF00);
        marker.material.emissiveIntensity = 0.5;
      }
      // Check if it's a bad direction
      else if (this.badDirections.some(d => d.huong === key)) {
        color = 0xFF4444; // Red for bad
        marker.material.emissive = new THREE.Color(0xFF0000);
        marker.material.emissiveIntensity = 0.5;
      } else {
        marker.material.emissive = new THREE.Color(0x000000);
        marker.material.emissiveIntensity = 0;
      }

      marker.material.color.setHex(color);
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Gentle rotation animation for yin-yang
    // Already handled by compass group rotation

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('resize', this.handleResize);

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

    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

export default Compass3D;
