/**
 * FLOOR PLAN EDITOR - Công cụ vẽ sơ đồ nhà 2D
 * Cho phép người dùng vẽ các phòng trên grid
 */

import { ROOM_TYPES } from '../utils/fengshui-rules.js';

export class FloorPlanEditor {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.gridSize = options.gridSize || 10;
    this.cellSize = options.cellSize || 28;
    this.currentTool = 'door';
    this.isDrawing = false;
    this.direction = null;

    // Khởi tạo grid data - mảng 2 chiều
    this.floorPlan = Array(this.gridSize).fill(null).map(() =>
      Array(this.gridSize).fill(null)
    );

    // Lịch sử để Undo (tối đa 20 bước)
    this.history = [];
    this.maxHistory = 20;

    // Callbacks
    this.onFloorPlanChange = options.onFloorPlanChange || (() => {});
    this.onDirectionChange = options.onDirectionChange || (() => {});

    this.init();
  }

  init() {
    this.createGrid();
    this.setupRoomTools();
    this.setupDirectionSelector();
    this.setupEventListeners();
  }

  createGrid() {
    this.container.innerHTML = '';

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        // Thêm event listeners cho mỗi ô
        cell.addEventListener('mousedown', (e) => this.handleCellMouseDown(e, row, col));
        cell.addEventListener('mouseenter', (e) => this.handleCellMouseEnter(e, row, col));
        cell.addEventListener('mouseup', () => this.handleMouseUp());

        // Touch support
        cell.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.handleCellMouseDown(e, row, col);
        });
        cell.addEventListener('touchmove', (e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          if (element && element.classList.contains('grid-cell')) {
            const r = parseInt(element.dataset.row);
            const c = parseInt(element.dataset.col);
            this.handleCellMouseEnter(e, r, c);
          }
        });
        cell.addEventListener('touchend', () => this.handleMouseUp());

        this.container.appendChild(cell);
      }
    }

    // Global mouse up listener
    document.addEventListener('mouseup', () => this.handleMouseUp());
  }

  handleCellMouseDown(e, row, col) {
    e.preventDefault();
    this.isDrawing = true;
    // Lưu trạng thái trước khi vẽ (cho Undo)
    this.saveToHistory();
    this.paintCell(row, col);
  }

  handleCellMouseEnter(e, row, col) {
    if (this.isDrawing) {
      this.paintCell(row, col);
    }
  }

  handleMouseUp() {
    this.isDrawing = false;
  }

  paintCell(row, col) {
    if (this.currentTool === 'eraser') {
      this.floorPlan[row][col] = null;
    } else {
      this.floorPlan[row][col] = this.currentTool;
    }

    this.updateCellDisplay(row, col);
    this.onFloorPlanChange(this.floorPlan);
  }

  updateCellDisplay(row, col) {
    const cell = this.container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;

    // Reset classes
    cell.className = 'grid-cell';

    const roomType = this.floorPlan[row][col];
    if (roomType && ROOM_TYPES[roomType]) {
      cell.classList.add(roomType);
      cell.innerHTML = ROOM_TYPES[roomType].icon;
    } else {
      cell.innerHTML = '';
    }
  }

  // Lưu trạng thái hiện tại vào lịch sử
  saveToHistory() {
    // Deep copy floorPlan
    const snapshot = this.floorPlan.map(row => [...row]);
    this.history.push(snapshot);

    // Giới hạn số bước lưu
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  // Hoàn tác về bước trước
  undo() {
    if (this.history.length === 0) {
      return false; // Không có gì để undo
    }

    // Lấy trạng thái trước đó
    this.floorPlan = this.history.pop();

    // Cập nhật hiển thị tất cả ô
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        this.updateCellDisplay(row, col);
      }
    }

    // Thông báo thay đổi
    this.onFloorPlanChange(this.floorPlan);
    return true;
  }

  setupRoomTools() {
    const roomButtons = document.querySelectorAll('.room-btn');

    roomButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const room = btn.dataset.room;

        // Nếu bấm nút "Xóa" (eraser) -> thực hiện Undo
        if (room === 'eraser') {
          const undone = this.undo();
          if (!undone) {
            // Không có gì để undo, có thể hiển thị thông báo
            console.log('Không có bước nào để hoàn tác');
          }
          return; // Không chuyển tool
        }

        // Remove active class from all buttons
        roomButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Set current tool
        this.currentTool = room;
      });
    });
  }

  setupDirectionSelector() {
    const dirButtons = document.querySelectorAll('.dir-btn');

    dirButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        dirButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Set direction
        this.direction = btn.dataset.direction;
        this.onDirectionChange(this.direction);
      });
    });
  }

  setupEventListeners() {
    // Reset button
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
  }

  reset() {
    // Clear floor plan data
    this.floorPlan = Array(this.gridSize).fill(null).map(() =>
      Array(this.gridSize).fill(null)
    );

    // Update all cells display
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        this.updateCellDisplay(row, col);
      }
    }

    // Reset direction
    this.direction = null;
    document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));

    // Reset current tool to door
    this.currentTool = 'door';
    document.querySelectorAll('.room-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.room-btn[data-room="door"]')?.classList.add('active');

    // Notify changes
    this.onFloorPlanChange(this.floorPlan);
    this.onDirectionChange(null);
  }

  getFloorPlan() {
    return this.floorPlan;
  }

  getDirection() {
    return this.direction;
  }

  // Load a pre-made floor plan
  loadFloorPlan(plan) {
    this.floorPlan = plan;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        this.updateCellDisplay(row, col);
      }
    }
    this.onFloorPlanChange(this.floorPlan);
  }

  // Set direction programmatically
  setDirection(direction) {
    this.direction = direction;
    document.querySelectorAll('.dir-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.direction === direction);
    });
    this.onDirectionChange(this.direction);
  }

  // Get statistics about rooms
  getRoomStats() {
    const stats = {};

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const roomType = this.floorPlan[row][col];
        if (roomType) {
          stats[roomType] = (stats[roomType] || 0) + 1;
        }
      }
    }

    return stats;
  }

  // Check if floor plan is empty
  isEmpty() {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.floorPlan[row][col]) {
          return false;
        }
      }
    }
    return true;
  }

  // Export floor plan as JSON
  exportJSON() {
    return {
      gridSize: this.gridSize,
      direction: this.direction,
      floorPlan: this.floorPlan,
      stats: this.getRoomStats()
    };
  }

  // Import floor plan from JSON
  importJSON(data) {
    if (data.floorPlan) {
      this.loadFloorPlan(data.floorPlan);
    }
    if (data.direction) {
      this.setDirection(data.direction);
    }
  }
}

export default FloorPlanEditor;
