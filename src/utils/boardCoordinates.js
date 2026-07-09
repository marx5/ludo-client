// Bản đồ tọa độ hàng (row) và cột (col) của 52 ô trên đường chạy chung (0 đến 51)
// Bắt đầu từ ô 0 (xuất phát của Red tại hàng 6, cột 1) và chạy theo chiều kim đồng hồ
export const COMMON_TRACK_COORDS = [
  { row: 6, col: 1 },   // 0 (Red Start)
  { row: 6, col: 2 },   // 1
  { row: 6, col: 3 },   // 2
  { row: 6, col: 4 },   // 3
  { row: 6, col: 5 },   // 4
  { row: 5, col: 6 },   // 5
  { row: 4, col: 6 },   // 6
  { row: 3, col: 6 },   // 7
  { row: 2, col: 6 },   // 8 (Safe Zone)
  { row: 1, col: 6 },   // 9
  { row: 0, col: 6 },   // 10
  { row: 0, col: 7 },   // 11 (Top Turn)
  { row: 0, col: 8 },   // 12
  { row: 1, col: 8 },   // 13 (Green Start)
  { row: 2, col: 8 },   // 14
  { row: 3, col: 8 },   // 15
  { row: 4, col: 8 },   // 16
  { row: 5, col: 8 },   // 17
  { row: 6, col: 9 },   // 18
  { row: 6, col: 10 },  // 19
  { row: 6, col: 11 },  // 20
  { row: 6, col: 12 },  // 21 (Safe Zone)
  { row: 6, col: 13 },  // 22
  { row: 6, col: 14 },  // 23
  { row: 7, col: 14 },  // 24 (Right Turn)
  { row: 8, col: 14 },  // 25
  { row: 8, col: 13 },  // 26 (Yellow Start)
  { row: 8, col: 12 },  // 27
  { row: 8, col: 11 },  // 28
  { row: 8, col: 10 },  // 29
  { row: 8, col: 9 },   // 30
  { row: 9, col: 8 },   // 31
  { row: 10, col: 8 },  // 32
  { row: 11, col: 8 },  // 33
  { row: 12, col: 8 },  // 34 (Safe Zone)
  { row: 13, col: 8 },  // 35
  { row: 14, col: 8 },  // 36
  { row: 14, col: 7 },  // 37 (Bottom Turn)
  { row: 14, col: 6 },  // 38
  { row: 13, col: 6 },  // 39 (Blue Start)
  { row: 12, col: 6 },  // 40
  { row: 11, col: 6 },  // 41
  { row: 10, col: 6 },  // 42
  { row: 9, col: 6 },   // 43
  { row: 8, col: 5 },   // 44
  { row: 8, col: 4 },   // 45
  { row: 8, col: 3 },   // 46
  { row: 8, col: 2 },   // 47 (Safe Zone)
  { row: 8, col: 1 },   // 48
  { row: 8, col: 0 },   // 49
  { row: 7, col: 0 },   // 50 (Left Turn)
  { row: 6, col: 0 }    // 51
];

// Đường lên chuồng của mỗi màu (Home Stretch), stepCount từ 52 đến 57
export const HOME_STRETCH_COORDS = {
  red: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
    { row: 7, col: 6 }
  ],
  green: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
    { row: 6, col: 7 }
  ],
  yellow: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
    { row: 7, col: 8 }
  ],
  blue: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
    { row: 8, col: 7 }
  ]
};

// Sân nhà của mỗi màu (Yard), nơi quân cờ đứng khi ở vị trí -1
// Mỗi màu có 4 vị trí cho 4 quân cờ
export const YARD_COORDS = {
  red: [
    { row: 2, col: 2 },
    { row: 2, col: 3 },
    { row: 3, col: 2 },
    { row: 3, col: 3 }
  ],
  green: [
    { row: 2, col: 11 },
    { row: 2, col: 12 },
    { row: 3, col: 11 },
    { row: 3, col: 12 }
  ],
  yellow: [
    { row: 11, col: 11 },
    { row: 11, col: 12 },
    { row: 12, col: 11 },
    { row: 12, col: 12 }
  ],
  blue: [
    { row: 11, col: 2 },
    { row: 11, col: 3 },
    { row: 12, col: 2 },
    { row: 12, col: 3 }
  ]
};

// Vị trí ô Đích của mỗi màu (Tâm bàn cờ row 7, col 7)
// Trong UI ta có thể render ô trung tâm và định vị quân cờ lệch một chút theo hướng của màu đó
export const HOME_COORDS = {
  red: { row: 7, col: 7, offsetClass: 'home-offset-red' },
  green: { row: 7, col: 7, offsetClass: 'home-offset-green' },
  yellow: { row: 7, col: 7, offsetClass: 'home-offset-yellow' },
  blue: { row: 7, col: 7, offsetClass: 'home-offset-blue' }
};

// Trả về tọa độ hàng và cột vật lý để đặt quân cờ trên lưới CSS Grid 15x15
export function getPieceGridCoords(color, pieceId, position, stepCount) {
  if (position === -1) {
    // Quân ở trong sân nhà
    return YARD_COORDS[color][pieceId];
  }
  
  if (stepCount === 58) {
    // Quân đã về đích
    return HOME_COORDS[color];
  }
  
  if (stepCount <= 51) {
    // Trên vòng chạy chung
    return COMMON_TRACK_COORDS[position];
  }
  
  // Trên đường lên chuồng
  const index = stepCount - 52;
  return HOME_STRETCH_COORDS[color][index];
}
