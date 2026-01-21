/**
 * PHONG THỦY NHÀ Ở 3D - Main Application
 * Ứng dụng phong thủy 3D với Three.js
 */

import { FloorPlanEditor } from './components/FloorPlanEditor.js';
import { House3D } from './components/House3D.js';
import { Compass3D } from './components/Compass3D.js';
import { FengShuiAnalyzer } from './components/FengShuiAnalyzer.js';

class PhongThuyApp {
  constructor() {
    // Components
    this.floorPlanEditor = null;
    this.house3D = null;
    this.compass3D = null;
    this.analyzer = null;

    // State
    this.floorPlan = null;
    this.direction = null;
    this.cungMenh = null;
    this.huongInfo = null;

    this.init();
  }

  init() {
    console.log('🏠 Khởi tạo Phong Thủy Nhà Ở 3D...');

    // Initialize components
    this.initFloorPlanEditor();
    this.initHouse3D();
    this.initCompass3D();
    this.initAnalyzer();

    // Setup reset button
    this.setupResetButton();

    // Load demo data (optional)
    // this.loadDemoData();

    console.log('✅ Khởi tạo hoàn tất!');
  }

  initFloorPlanEditor() {
    this.floorPlanEditor = new FloorPlanEditor('floor-plan-grid', {
      gridSize: 10,
      onFloorPlanChange: (floorPlan) => this.onFloorPlanChange(floorPlan),
      onDirectionChange: (direction) => this.onDirectionChange(direction)
    });
  }

  initHouse3D() {
    this.house3D = new House3D('three-container', {
      gridSize: 10
    });
  }

  initCompass3D() {
    this.compass3D = new Compass3D('compass-container', {
      size: 150
    });
  }

  initAnalyzer() {
    this.analyzer = new FengShuiAnalyzer({
      onAnalysisComplete: (data) => this.onAnalysisComplete(data)
    });
  }

  onFloorPlanChange(floorPlan) {
    this.floorPlan = floorPlan;

    // Update 3D view
    this.house3D.updateHouse(floorPlan, this.direction);

    // Update analysis
    this.analyzer.updateFloorPlan(floorPlan, this.direction);
  }

  onDirectionChange(direction) {
    this.direction = direction;

    // Update 3D view
    if (this.floorPlan) {
      this.house3D.updateHouse(this.floorPlan, direction);
    }

    // Update compass
    this.compass3D.setDirection(direction);

    // Update analysis
    this.analyzer.updateFloorPlan(this.floorPlan, direction);
  }

  onAnalysisComplete(data) {
    this.cungMenh = data.cungMenh;
    this.huongInfo = data.huongInfo;

    // Update compass with good/bad directions
    if (this.huongInfo) {
      this.compass3D.setGoodBadDirections(
        this.huongInfo.tot,
        this.huongInfo.xau
      );
    }
  }

  setupResetButton() {
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
  }

  reset() {
    // Reset floor plan editor
    this.floorPlanEditor.reset();

    // Reset analyzer
    this.analyzer.reset();

    // Reset compass
    this.compass3D.setGoodBadDirections([], []);
    this.compass3D.setDirection(null);

    // Reset state
    this.floorPlan = null;
    this.direction = null;
    this.cungMenh = null;
    this.huongInfo = null;

    // Clear 3D house
    this.house3D.updateHouse(
      Array(10).fill(null).map(() => Array(10).fill(null)),
      null
    );

    console.log('🔄 Đã làm mới ứng dụng');
  }

  // Load demo data for testing
  loadDemoData() {
    // Sample floor plan
    const demoFloorPlan = [
      [null, null, null, null, null, null, null, null, null, null],
      [null, 'living', 'living', 'living', 'living', null, 'bedroom', 'bedroom', 'bedroom', null],
      [null, 'living', 'living', 'living', 'living', null, 'bedroom', 'bedroom', 'bedroom', null],
      [null, 'living', 'living', 'living', 'living', null, 'bedroom', 'bedroom', 'bedroom', null],
      [null, null, null, 'door', null, null, null, null, null, null],
      [null, 'kitchen', 'kitchen', 'kitchen', null, null, 'bathroom', 'bathroom', null, null],
      [null, 'kitchen', 'kitchen', 'kitchen', null, null, 'bathroom', 'bathroom', null, null],
      [null, null, null, null, null, null, null, null, null, null],
      [null, null, 'altar', null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null]
    ];

    // Load floor plan
    this.floorPlanEditor.loadFloorPlan(demoFloorPlan);

    // Set direction
    this.floorPlanEditor.setDirection('S');

    // Set birth year
    const birthYearInput = document.getElementById('birth-year');
    if (birthYearInput) {
      birthYearInput.value = '1990';
    }
  }

  // Export current state
  exportState() {
    return {
      floorPlan: this.floorPlanEditor.exportJSON(),
      analyzer: this.analyzer.getState(),
      timestamp: new Date().toISOString()
    };
  }

  // Import state
  importState(state) {
    if (state.floorPlan) {
      this.floorPlanEditor.importJSON(state.floorPlan);
    }
    if (state.analyzer) {
      this.analyzer.loadState(state.analyzer);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.phongThuyApp = new PhongThuyApp();
});

// Export for use in console
export { PhongThuyApp };
