/**
 * BAGUA CALCULATOR - Tính Cung Mệnh theo Bát Quái
 * Dựa trên công thức phong thủy Đông Tứ Mệnh và Tây Tứ Mệnh
 */

// Bát Quái - 8 Cung
export const CUNG = {
  CAN: { name: 'Càn', symbol: '☰', element: 'Kim', group: 'Tây', number: 6 },
  KHON: { name: 'Khôn', symbol: '☷', element: 'Thổ', group: 'Tây', number: 2 },
  CHAN: { name: 'Chấn', symbol: '☳', element: 'Mộc', group: 'Đông', number: 3 },
  TON: { name: 'Tốn', symbol: '☴', element: 'Mộc', group: 'Đông', number: 4 },
  KHAM: { name: 'Khảm', symbol: '☵', element: 'Thủy', group: 'Đông', number: 1 },
  LY: { name: 'Ly', symbol: '☲', element: 'Hỏa', group: 'Đông', number: 9 },
  CAN_SON: { name: 'Cấn', symbol: '☶', element: 'Thổ', group: 'Tây', number: 8 },
  DOAI: { name: 'Đoài', symbol: '☱', element: 'Kim', group: 'Tây', number: 7 }
};

// Ngũ Hành
export const NGU_HANH = {
  KIM: { name: 'Kim', color: '#FFFFFF', colorName: 'Trắng/Vàng kim' },
  MOC: { name: 'Mộc', color: '#228B22', colorName: 'Xanh lá' },
  THUY: { name: 'Thủy', color: '#1E90FF', colorName: 'Xanh dương/Đen' },
  HOA: { name: 'Hỏa', color: '#DC143C', colorName: 'Đỏ/Cam' },
  THO: { name: 'Thổ', color: '#DAA520', colorName: 'Vàng/Nâu' }
};

// 8 Hướng
export const HUONG = {
  N: { name: 'Bắc', angle: 0, cung: 'KHAM' },
  NE: { name: 'Đông Bắc', angle: 45, cung: 'CAN_SON' },
  E: { name: 'Đông', angle: 90, cung: 'CHAN' },
  SE: { name: 'Đông Nam', angle: 135, cung: 'TON' },
  S: { name: 'Nam', angle: 180, cung: 'LY' },
  SW: { name: 'Tây Nam', angle: 225, cung: 'KHON' },
  W: { name: 'Tây', angle: 270, cung: 'DOAI' },
  NW: { name: 'Tây Bắc', angle: 315, cung: 'CAN' }
};

// Bảng tra cung mệnh theo số
const CUNG_MAP = {
  1: 'KHAM',
  2: 'KHON',
  3: 'CHAN',
  4: 'TON',
  5: null, // Số 5 đặc biệt - Nam: Khôn, Nữ: Cấn
  6: 'CAN',
  7: 'DOAI',
  8: 'CAN_SON',
  9: 'LY'
};

/**
 * Tính số Cung Mệnh theo năm sinh và giới tính
 * Công thức Bát Trạch Minh Cảnh:
 * - Trước 2000: Nam = 10 - (2 số cuối), Nữ = 5 + (2 số cuối)
 * - Từ 2000: Nam = 9 - (2 số cuối), Nữ = 6 + (2 số cuối)
 * - Nếu kết quả = 5: Nam -> Khôn (2), Nữ -> Cấn (8)
 */
export function tinhSoCungMenh(namSinh, gioiTinh) {
  let so;

  // Lấy 2 số cuối của năm sinh
  const haiSoCuoi = namSinh % 100;

  // Cộng 2 số cuối lại, nếu >= 10 thì tiếp tục cộng cho đến khi còn 1 chữ số
  let tong = haiSoCuoi;
  while (tong >= 10) {
    tong = Math.floor(tong / 10) + (tong % 10);
  }

  if (namSinh < 2000) {
    // Công thức cho năm 1900-1999
    if (gioiTinh === 'male') {
      so = 10 - tong;
      if (so === 10) so = 1; // Nếu tong = 0, thì 10 - 0 = 10 -> 1
    } else {
      so = 5 + tong;
      if (so > 9) so = so - 9;
    }
  } else {
    // Công thức cho năm 2000 trở đi
    if (gioiTinh === 'male') {
      so = 9 - tong;
      if (so <= 0) so = so + 9;
    } else {
      so = 6 + tong;
      if (so > 9) so = so - 9;
    }
  }

  // Xử lý số 5 đặc biệt (Trung cung - không có quái)
  if (so === 5) {
    return gioiTinh === 'male' ? 2 : 8; // Nam: Khôn (2), Nữ: Cấn (8)
  }

  return so;
}

/**
 * Lấy thông tin Cung Mệnh đầy đủ
 */
export function layCungMenh(namSinh, gioiTinh) {
  const soCung = tinhSoCungMenh(namSinh, gioiTinh);
  const cungKey = CUNG_MAP[soCung];

  if (!cungKey) {
    return null;
  }

  const cung = CUNG[cungKey];
  // Map element name to NGU_HANH key
  const elementMap = {
    'Kim': 'KIM',
    'Mộc': 'MOC',
    'Thủy': 'THUY',
    'Hỏa': 'HOA',
    'Thổ': 'THO'
  };
  const nguHanh = NGU_HANH[elementMap[cung.element]];

  return {
    ...cung,
    key: cungKey,
    nguHanh: nguHanh,
    soCung: soCung
  };
}

/**
 * Lấy các hướng tốt/xấu theo Đông Tây Tứ Mệnh
 */
export function layHuongTotXau(cungMenh) {
  if (!cungMenh) return { tot: [], xau: [] };

  const isDongTu = cungMenh.group === 'Đông';

  // Đông Tứ Mệnh: Khảm, Ly, Chấn, Tốn -> Hướng tốt: Bắc, Nam, Đông, ĐN
  // Tây Tứ Mệnh: Càn, Khôn, Cấn, Đoài -> Hướng tốt: Tây, TB, TN, ĐB

  const huongTotDong = ['N', 'S', 'E', 'SE'];
  const huongTotTay = ['W', 'NW', 'SW', 'NE'];

  const huongTot = isDongTu ? huongTotDong : huongTotTay;
  const huongXau = isDongTu ? huongTotTay : huongTotDong;

  // Chi tiết các hướng tốt với ý nghĩa
  const chiTietHuongTot = {
    // Đông Tứ Mệnh
    N: { ten: 'Bắc', yNghia: 'Phục Vị - Ổn định' },
    S: { ten: 'Nam', yNghia: 'Diên Niên - Trường thọ' },
    E: { ten: 'Đông', yNghia: 'Thiên Y - Sức khỏe' },
    SE: { ten: 'Đông Nam', yNghia: 'Sinh Khí - Phát tài' },
    // Tây Tứ Mệnh
    W: { ten: 'Tây', yNghia: 'Phục Vị - Ổn định' },
    NW: { ten: 'Tây Bắc', yNghia: 'Diên Niên - Trường thọ' },
    SW: { ten: 'Tây Nam', yNghia: 'Thiên Y - Sức khỏe' },
    NE: { ten: 'Đông Bắc', yNghia: 'Sinh Khí - Phát tài' }
  };

  const chiTietHuongXau = {
    // Đông Tứ Mệnh bị xấu các hướng Tây
    W: { ten: 'Tây', yNghia: 'Tuyệt Mệnh - Rất xấu' },
    NW: { ten: 'Tây Bắc', yNghia: 'Ngũ Quỷ - Xấu' },
    SW: { ten: 'Tây Nam', yNghia: 'Lục Sát - Xấu' },
    NE: { ten: 'Đông Bắc', yNghia: 'Họa Hại - Xấu' },
    // Tây Tứ Mệnh bị xấu các hướng Đông
    N: { ten: 'Bắc', yNghia: 'Tuyệt Mệnh - Rất xấu' },
    S: { ten: 'Nam', yNghia: 'Ngũ Quỷ - Xấu' },
    E: { ten: 'Đông', yNghia: 'Lục Sát - Xấu' },
    SE: { ten: 'Đông Nam', yNghia: 'Họa Hại - Xấu' }
  };

  return {
    tot: huongTot.map(h => ({
      huong: h,
      ...chiTietHuongTot[h]
    })),
    xau: huongXau.map(h => ({
      huong: h,
      ...chiTietHuongXau[h]
    })),
    nhomMenh: isDongTu ? 'Đông Tứ Mệnh' : 'Tây Tứ Mệnh'
  };
}

/**
 * Kiểm tra tương sinh tương khắc Ngũ Hành
 */
export function kiemTraNguHanh(hanh1, hanh2) {
  // Tương sinh: Mộc -> Hỏa -> Thổ -> Kim -> Thủy -> Mộc
  const tuongSinh = {
    MOC: 'HOA',
    HOA: 'THO',
    THO: 'KIM',
    KIM: 'THUY',
    THUY: 'MOC'
  };

  // Tương khắc: Mộc -> Thổ -> Thủy -> Hỏa -> Kim -> Mộc
  const tuongKhac = {
    MOC: 'THO',
    THO: 'THUY',
    THUY: 'HOA',
    HOA: 'KIM',
    KIM: 'MOC'
  };

  if (hanh1 === hanh2) {
    return { quanHe: 'binhHoa', moTa: 'Bình hòa (cùng hành)' };
  }

  if (tuongSinh[hanh1] === hanh2) {
    return { quanHe: 'tuongSinh', moTa: `${NGU_HANH[hanh1].name} sinh ${NGU_HANH[hanh2].name}` };
  }

  if (tuongSinh[hanh2] === hanh1) {
    return { quanHe: 'duocSinh', moTa: `Được ${NGU_HANH[hanh2].name} sinh` };
  }

  if (tuongKhac[hanh1] === hanh2) {
    return { quanHe: 'tuongKhac', moTa: `${NGU_HANH[hanh1].name} khắc ${NGU_HANH[hanh2].name}` };
  }

  if (tuongKhac[hanh2] === hanh1) {
    return { quanHe: 'biKhac', moTa: `Bị ${NGU_HANH[hanh2].name} khắc` };
  }

  return { quanHe: 'khong', moTa: 'Không có quan hệ trực tiếp' };
}

/**
 * Tính Can Chi năm sinh
 */
export function tinhCanChi(namSinh) {
  const thienCan = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'];
  const diaChi = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];

  const canIndex = namSinh % 10;
  const chiIndex = namSinh % 12;

  return {
    can: thienCan[canIndex],
    chi: diaChi[chiIndex],
    full: `${thienCan[canIndex]} ${diaChi[chiIndex]}`
  };
}

/**
 * Lấy màu Ngũ Hành cho 3D rendering
 */
export function layMauNguHanh(hanh) {
  const colors = {
    KIM: 0xFFFFFF,
    MOC: 0x228B22,
    THUY: 0x1E90FF,
    HOA: 0xDC143C,
    THO: 0xDAA520
  };
  return colors[hanh] || 0x888888;
}

/**
 * Export tất cả để dễ sử dụng
 */
export default {
  CUNG,
  NGU_HANH,
  HUONG,
  tinhSoCungMenh,
  layCungMenh,
  layHuongTotXau,
  kiemTraNguHanh,
  tinhCanChi,
  layMauNguHanh
};
