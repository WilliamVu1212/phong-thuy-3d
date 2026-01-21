/**
 * FENG SHUI RULES - Các quy tắc phong thủy nhà ở
 * Phân tích vị trí các phòng và đánh giá điểm
 */

import { HUONG, layHuongTotXau } from './bagua-calculator.js';

// Định nghĩa các loại phòng
export const ROOM_TYPES = {
  door: { name: 'Cửa Chính', icon: '🚪', color: 0xFFD700, weight: 25 },
  living: { name: 'Phòng Khách', icon: '🛋️', color: 0x4CAF50, weight: 15 },
  bedroom: { name: 'Phòng Ngủ', icon: '🛏️', color: 0x9C27B0, weight: 20 },
  kitchen: { name: 'Bếp', icon: '🍳', color: 0xFF5722, weight: 20 },
  bathroom: { name: 'Nhà Vệ Sinh', icon: '🚿', color: 0x2196F3, weight: 10 },
  altar: { name: 'Ban Thờ', icon: '🙏', color: 0xE91E63, weight: 10 }
};

// Các quy tắc phong thủy
export const RULES = {
  // Rule 1: Bếp không đối diện cửa chính
  kitchenNotFacingDoor: {
    id: 'kitchenNotFacingDoor',
    name: 'Bếp không đối diện cửa chính',
    description: 'Bếp đặt đối diện cửa chính sẽ làm tài lộc hao tán, tiền vào lại ra nhanh.',
    weight: 20,
    check: (floorPlan, direction) => {
      const kitchen = findRoomCells(floorPlan, 'kitchen');
      const door = findRoomCells(floorPlan, 'door');

      if (kitchen.length === 0 || door.length === 0) {
        return { pass: null, message: 'Chưa có đủ thông tin' };
      }

      // Kiểm tra xem bếp có nằm trên cùng hàng/cột với cửa không
      const doorCenter = getCenterPosition(door);
      const kitchenCenter = getCenterPosition(kitchen);

      const isSameRow = Math.abs(doorCenter.row - kitchenCenter.row) <= 1;
      const isSameCol = Math.abs(doorCenter.col - kitchenCenter.col) <= 1;
      const isOpposite = (isSameRow || isSameCol) && getDistance(doorCenter, kitchenCenter) > 3;

      if (isOpposite) {
        return {
          pass: false,
          message: 'Bếp đang đối diện cửa chính - Tiền tài dễ hao tán',
          suggestion: 'Nên đặt vách ngăn hoặc bình phong giữa cửa và bếp'
        };
      }

      return {
        pass: true,
        message: 'Bếp không đối diện cửa chính ✓'
      };
    }
  },

  // Rule 2: Nhà vệ sinh không ở trung tâm nhà
  bathroomNotCenter: {
    id: 'bathroomNotCenter',
    name: 'Nhà vệ sinh không ở trung tâm',
    description: 'Nhà vệ sinh ở trung tâm nhà sẽ ảnh hưởng xấu đến sức khỏe và vận khí.',
    weight: 20,
    check: (floorPlan, direction) => {
      const bathroom = findRoomCells(floorPlan, 'bathroom');

      if (bathroom.length === 0) {
        return { pass: null, message: 'Chưa có nhà vệ sinh' };
      }

      const gridSize = floorPlan.length;
      const center = { row: gridSize / 2, col: gridSize / 2 };
      const bathroomCenter = getCenterPosition(bathroom);

      // Tính khoảng cách từ bathroom đến tâm
      const distance = getDistance(bathroomCenter, center);
      const isCenter = distance < gridSize * 0.25; // Trong 25% tâm

      if (isCenter) {
        return {
          pass: false,
          message: 'Nhà vệ sinh đang ở vị trí trung tâm - Ảnh hưởng sức khỏe',
          suggestion: 'Nên di chuyển nhà vệ sinh ra vị trí biên của nhà'
        };
      }

      return {
        pass: true,
        message: 'Nhà vệ sinh không ở trung tâm ✓'
      };
    }
  },

  // Rule 3: Phòng ngủ ở hướng tốt theo mệnh
  bedroomGoodDirection: {
    id: 'bedroomGoodDirection',
    name: 'Phòng ngủ ở hướng tốt',
    description: 'Phòng ngủ nên đặt ở các hướng tốt theo cung mệnh để có giấc ngủ ngon và sức khỏe tốt.',
    weight: 15,
    check: (floorPlan, direction, cungMenh) => {
      const bedroom = findRoomCells(floorPlan, 'bedroom');

      if (bedroom.length === 0) {
        return { pass: null, message: 'Chưa có phòng ngủ' };
      }

      if (!cungMenh) {
        return { pass: null, message: 'Chưa có thông tin cung mệnh' };
      }

      const huongInfo = layHuongTotXau(cungMenh);
      const bedroomDirection = getRoomDirection(floorPlan, bedroom);
      const isGoodDirection = huongInfo.tot.some(h => h.huong === bedroomDirection);

      if (!isGoodDirection) {
        return {
          pass: false,
          message: `Phòng ngủ ở hướng ${HUONG[bedroomDirection]?.name || bedroomDirection} - Không hợp mệnh`,
          suggestion: `Nên đặt phòng ngủ ở hướng: ${huongInfo.tot.map(h => h.ten).join(', ')}`
        };
      }

      return {
        pass: true,
        message: `Phòng ngủ ở hướng tốt (${HUONG[bedroomDirection]?.name}) ✓`
      };
    }
  },

  // Rule 4: Ban thờ đặt đúng vị trí
  altarCorrectPosition: {
    id: 'altarCorrectPosition',
    name: 'Ban thờ đặt đúng vị trí',
    description: 'Ban thờ nên đặt ở vị trí trang trọng, cao ráo, thoáng mát, không đối diện nhà vệ sinh.',
    weight: 15,
    check: (floorPlan, direction) => {
      const altar = findRoomCells(floorPlan, 'altar');
      const bathroom = findRoomCells(floorPlan, 'bathroom');

      if (altar.length === 0) {
        return { pass: null, message: 'Chưa có ban thờ' };
      }

      const altarCenter = getCenterPosition(altar);
      const gridSize = floorPlan.length;

      // Kiểm tra ban thờ có ở phía trên (1/3 trên của nhà)
      const isHighPosition = altarCenter.row < gridSize / 3;

      // Kiểm tra không gần nhà vệ sinh
      let nearBathroom = false;
      if (bathroom.length > 0) {
        const bathroomCenter = getCenterPosition(bathroom);
        nearBathroom = getDistance(altarCenter, bathroomCenter) < 2;
      }

      if (nearBathroom) {
        return {
          pass: false,
          message: 'Ban thờ đang ở gần nhà vệ sinh - Bất kính',
          suggestion: 'Nên di chuyển ban thờ ra xa nhà vệ sinh'
        };
      }

      if (!isHighPosition) {
        return {
          pass: false,
          message: 'Ban thờ nên đặt ở vị trí cao, trang trọng',
          suggestion: 'Nên đặt ban thờ ở phía trong, vị trí cao nhất của nhà'
        };
      }

      return {
        pass: true,
        message: 'Ban thờ đặt đúng vị trí ✓'
      };
    }
  },

  // Rule 5: Cửa chính hướng tốt theo mệnh
  doorGoodDirection: {
    id: 'doorGoodDirection',
    name: 'Cửa chính hướng tốt',
    description: 'Cửa chính nên quay về hướng tốt theo cung mệnh gia chủ.',
    weight: 20,
    check: (floorPlan, direction, cungMenh) => {
      if (!direction) {
        return { pass: null, message: 'Chưa chọn hướng cửa' };
      }

      if (!cungMenh) {
        return { pass: null, message: 'Chưa có thông tin cung mệnh' };
      }

      const huongInfo = layHuongTotXau(cungMenh);
      const isGoodDirection = huongInfo.tot.some(h => h.huong === direction);

      if (!isGoodDirection) {
        const huongName = HUONG[direction]?.name || direction;
        return {
          pass: false,
          message: `Cửa chính hướng ${huongName} - Không hợp mệnh ${cungMenh.name}`,
          suggestion: `Hướng tốt cho mệnh ${cungMenh.name}: ${huongInfo.tot.map(h => h.ten).join(', ')}`
        };
      }

      return {
        pass: true,
        message: `Cửa chính hướng tốt (${HUONG[direction]?.name}) ✓`
      };
    }
  },

  // Rule 6: Phòng khách ở vị trí đón khách
  livingRoomPosition: {
    id: 'livingRoomPosition',
    name: 'Phòng khách gần cửa chính',
    description: 'Phòng khách nên ở gần cửa chính để đón tiếp khách.',
    weight: 10,
    check: (floorPlan, direction) => {
      const living = findRoomCells(floorPlan, 'living');
      const door = findRoomCells(floorPlan, 'door');

      if (living.length === 0 || door.length === 0) {
        return { pass: null, message: 'Chưa có đủ thông tin' };
      }

      const livingCenter = getCenterPosition(living);
      const doorCenter = getCenterPosition(door);
      const distance = getDistance(livingCenter, doorCenter);

      if (distance > 4) {
        return {
          pass: false,
          message: 'Phòng khách quá xa cửa chính',
          suggestion: 'Nên đặt phòng khách gần cửa chính để tiện đón khách'
        };
      }

      return {
        pass: true,
        message: 'Phòng khách ở vị trí tốt ✓'
      };
    }
  }
};

// ============== HELPER FUNCTIONS ==============

/**
 * Tìm các ô thuộc một loại phòng
 */
export function findRoomCells(floorPlan, roomType) {
  const cells = [];
  for (let row = 0; row < floorPlan.length; row++) {
    for (let col = 0; col < floorPlan[row].length; col++) {
      if (floorPlan[row][col] === roomType) {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

/**
 * Tính vị trí trung tâm của một nhóm ô
 */
export function getCenterPosition(cells) {
  if (cells.length === 0) return { row: 0, col: 0 };

  const sum = cells.reduce(
    (acc, cell) => ({ row: acc.row + cell.row, col: acc.col + cell.col }),
    { row: 0, col: 0 }
  );

  return {
    row: sum.row / cells.length,
    col: sum.col / cells.length
  };
}

/**
 * Tính khoảng cách giữa hai điểm
 */
export function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p1.row - p2.row, 2) + Math.pow(p1.col - p2.col, 2));
}

/**
 * Xác định hướng của phòng dựa trên vị trí trong grid
 */
export function getRoomDirection(floorPlan, cells) {
  const gridSize = floorPlan.length;
  const center = getCenterPosition(cells);

  // Xác định vùng 8 hướng
  const rowRatio = center.row / gridSize;
  const colRatio = center.col / gridSize;

  // Top (Bắc)
  if (rowRatio < 0.33) {
    if (colRatio < 0.33) return 'NW';
    if (colRatio > 0.66) return 'NE';
    return 'N';
  }
  // Bottom (Nam)
  if (rowRatio > 0.66) {
    if (colRatio < 0.33) return 'SW';
    if (colRatio > 0.66) return 'SE';
    return 'S';
  }
  // Middle
  if (colRatio < 0.33) return 'W';
  if (colRatio > 0.66) return 'E';
  return 'CENTER';
}

/**
 * Phân tích phong thủy tổng thể
 */
export function analyzeFloorPlan(floorPlan, direction, cungMenh) {
  const results = [];
  let totalScore = 0;
  let maxScore = 0;
  const suggestions = [];

  Object.values(RULES).forEach(rule => {
    const result = rule.check(floorPlan, direction, cungMenh);
    maxScore += rule.weight;

    results.push({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      ...result,
      weight: rule.weight
    });

    if (result.pass === true) {
      totalScore += rule.weight;
    } else if (result.pass === false && result.suggestion) {
      suggestions.push({
        rule: rule.name,
        suggestion: result.suggestion
      });
    }
  });

  // Tính điểm theo thang 100
  const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Đánh giá mức độ
  let rating;
  if (score >= 80) rating = { text: 'Rất tốt', color: '#4CAF50' };
  else if (score >= 60) rating = { text: 'Tốt', color: '#8BC34A' };
  else if (score >= 40) rating = { text: 'Trung bình', color: '#FFC107' };
  else if (score >= 20) rating = { text: 'Cần cải thiện', color: '#FF9800' };
  else rating = { text: 'Không tốt', color: '#F44336' };

  return {
    results,
    score,
    rating,
    suggestions,
    summary: {
      passed: results.filter(r => r.pass === true).length,
      failed: results.filter(r => r.pass === false).length,
      pending: results.filter(r => r.pass === null).length
    }
  };
}

/**
 * Tạo báo cáo phong thủy dạng HTML
 */
export function generateReport(analysis, cungMenh, direction, namSinh) {
  const huongInfo = cungMenh ? layHuongTotXau(cungMenh) : null;
  const huongName = direction ? (HUONG[direction]?.name || direction) : 'Chưa chọn';

  return `
    <div class="report-section">
      <h3>📋 Thông Tin Cơ Bản</h3>
      <div class="report-grid">
        <div class="report-item">
          <span class="report-label">Năm sinh:</span>
          <span class="report-value">${namSinh || 'Chưa nhập'}</span>
        </div>
        <div class="report-item">
          <span class="report-label">Cung mệnh:</span>
          <span class="report-value">${cungMenh ? `${cungMenh.name} (${cungMenh.symbol})` : 'Chưa tính'}</span>
        </div>
        <div class="report-item">
          <span class="report-label">Ngũ hành:</span>
          <span class="report-value">${cungMenh?.nguHanh?.name || 'Chưa tính'}</span>
        </div>
        <div class="report-item">
          <span class="report-label">Hướng cửa:</span>
          <span class="report-value">${huongName}</span>
        </div>
      </div>
    </div>

    ${huongInfo ? `
    <div class="report-section">
      <h3>🧭 Hướng Tốt - Xấu (${huongInfo.nhomMenh})</h3>
      <div class="report-grid">
        <div class="report-item" style="flex-direction: column; align-items: flex-start;">
          <span class="report-label">✅ Hướng tốt:</span>
          <span class="report-value">${huongInfo.tot.map(h => `${h.ten} (${h.yNghia})`).join('<br>')}</span>
        </div>
        <div class="report-item" style="flex-direction: column; align-items: flex-start;">
          <span class="report-label">❌ Hướng xấu:</span>
          <span class="report-value">${huongInfo.xau.map(h => `${h.ten} (${h.yNghia})`).join('<br>')}</span>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="report-section">
      <h3>📊 Kết Quả Phân Tích</h3>
      <div style="text-align: center; margin: 20px 0;">
        <div style="font-size: 3rem; font-weight: bold; color: ${analysis.rating.color};">
          ${analysis.score}/100
        </div>
        <div style="font-size: 1.2rem; color: ${analysis.rating.color};">
          ${analysis.rating.text}
        </div>
      </div>
      <div class="report-grid">
        ${analysis.results.map(r => `
          <div class="report-item">
            <span class="report-label">${r.pass === true ? '✅' : r.pass === false ? '❌' : '⏳'} ${r.name}</span>
            <span class="report-value">${r.message}</span>
          </div>
        `).join('')}
      </div>
    </div>

    ${analysis.suggestions.length > 0 ? `
    <div class="report-section">
      <h3>💡 Gợi Ý Cải Thiện</h3>
      <ul style="padding-left: 20px;">
        ${analysis.suggestions.map(s => `
          <li style="margin-bottom: 10px;">
            <strong>${s.rule}:</strong> ${s.suggestion}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="report-section" style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc;">
      <p style="font-size: 0.8rem; color: #888;">
        Báo cáo được tạo bởi Phong Thủy Nhà Ở 3D<br>
        Ngày: ${new Date().toLocaleDateString('vi-VN')}
      </p>
    </div>
  `;
}

export default {
  ROOM_TYPES,
  RULES,
  findRoomCells,
  getCenterPosition,
  getDistance,
  getRoomDirection,
  analyzeFloorPlan,
  generateReport
};
