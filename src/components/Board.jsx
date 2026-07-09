import React from 'react';
import { getPieceGridCoords, COMMON_TRACK_COORDS, HOME_STRETCH_COORDS, YARD_COORDS } from '../utils/boardCoordinates';

export default function Board({ pieces, currentTurnColor, validPiecesToMove = [], onPieceClick, players }) {
  
  // Kiểm tra xem quân cờ cụ thể có thể di chuyển ở lượt này hay không
  const isPieceMovable = (piece) => {
    return piece.color === currentTurnColor && validPiecesToMove.includes(piece.id);
  };

  // Gom nhóm các quân cờ theo tọa độ hàng (row) và cột (col) trên bàn cờ
  // để xử lý trường hợp nhiều quân cờ đứng chung một ô.
  const getStackedPiecesMap = () => {
    const map = {};
    pieces.forEach(piece => {
      // Bỏ qua quân cờ đã về đích để vẽ riêng ở ô đích trung tâm
      if (piece.stepCount === 58) return;

      const coords = getPieceGridCoords(piece.color, piece.id, piece.position, piece.stepCount);
      const key = `${coords.row}-${coords.col}`;
      if (!map[key]) map[key] = [];
      map[key].push(piece);
    });
    return map;
  };

  const stackedPiecesMap = getStackedPiecesMap();

  // Hàm render các quân cờ tại một ô Grid cụ thể
  const renderPiecesInCell = (row, col) => {
    const key = `${row}-${col}`;
    const cellPieces = stackedPiecesMap[key] || [];
    if (cellPieces.length === 0) return null;

    if (cellPieces.length === 1) {
      const piece = cellPieces[0];
      const movable = isPieceMovable(piece);
      return (
        <div
          key={`piece-${piece.color}-${piece.id}`}
          className={`piece ${piece.color} ${movable ? 'movable' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (movable) onPieceClick(piece.color, piece.id);
          }}
          title={`Quân ${piece.color.toUpperCase()} #${piece.id + 1} (Bước: ${piece.stepCount})`}
        />
      );
    }

    // Nhiều quân cờ đứng chung ô -> Vẽ container xếp chồng
    return (
      <div className="pieces-stack-container" key={`stack-${key}`}>
        {cellPieces.map((piece, idx) => {
          const movable = isPieceMovable(piece);
          return (
            <div
              key={`piece-${piece.color}-${piece.id}`}
              className={`piece stacked ${piece.color} ${movable ? 'movable' : ''}`}
              style={{
                zIndex: movable ? 25 : 10 + idx,
                transform: `scale(0.85) translate(${(idx - (cellPieces.length - 1) / 2) * 8}px, ${(idx - (cellPieces.length - 1) / 2) * -4}px)`
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (movable) onPieceClick(piece.color, piece.id);
              }}
              title={`Quân ${piece.color.toUpperCase()} #${piece.id + 1}`}
            />
          );
        })}
      </div>
    );
  };

  // Render các quân cờ đã về đích trong ô Đích (Home center)
  const renderFinishedPieces = (color) => {
    const finished = pieces.filter(p => p.color === color && p.stepCount === 58);
    return finished.map((piece) => {
      return (
        <div
          key={`piece-finished-${color}-${piece.id}`}
          className={`piece ${color} home-offset-${color}`}
          style={{
            position: 'absolute',
            zIndex: 15,
            transform: 'scale(0.8)'
          }}
          title={`Quân ${color.toUpperCase()} #${piece.id + 1} đã về đích!`}
        />
      );
    });
  };

  // Tạo cấu trúc 15x15 ô bàn cờ
  const boardCells = [];
  
  // Xác định loại class CSS cho từng ô dựa trên toạ độ (row, col)
  const getCellClasses = (row, col) => {
    const classes = ['cell'];

    // 1. Kiểm tra xem ô có phải là ô an toàn (Safe Zone) không
    const commonIndex = COMMON_TRACK_COORDS.findIndex(c => c.row === row && c.col === col);
    const isSafeIndex = [0, 8, 13, 21, 26, 34, 39, 47].includes(commonIndex);
    if (commonIndex !== -1 && isSafeIndex) {
      classes.push('safe-zone-cell');
    }

    // 2. Ô bắt đầu (Starting point)
    if (row === 6 && col === 1) classes.push('red-start');
    if (row === 1 && col === 8) classes.push('green-start');
    if (row === 8 && col === 13) classes.push('yellow-start');
    if (row === 13 && col === 6) classes.push('blue-start');

    // 3. Đường chạy chung (Common path) - tô màu nhạt ở các đoạn tương ứng
    if (commonIndex !== -1) {
      if (commonIndex >= 0 && commonIndex <= 5) classes.push('red-path');
      else if (commonIndex >= 12 && commonIndex <= 17) classes.push('green-path');
      else if (commonIndex >= 25 && commonIndex <= 30) classes.push('yellow-path');
      else if (commonIndex >= 38 && commonIndex <= 43) classes.push('blue-path');
    }

    // 4. Đường lên chuồng (Home Stretch)
    Object.keys(HOME_STRETCH_COORDS).forEach(color => {
      const idx = HOME_STRETCH_COORDS[color].findIndex(c => c.row === row && c.col === col);
      if (idx !== -1) {
        classes.push(`${color}-home-stretch`);
      }
    });

    return classes.join(' ');
  };

  // Render bàn cờ Ludo 15x15 ô vuông
  const renderLudoGrid = () => {
    const cells = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        // A. Góc 6x6 Sân nhà (Yard)
        // Yard trên trái - Red
        if (r === 0 && c === 0) {
          cells.push(
            <div key="yard-red" className="yard red" style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              <div className="yard-inner">
                {[0, 1, 2, 3].map(pieceId => (
                  <div key={`pocket-red-${pieceId}`} className="yard-pocket">
                    {renderPiecesInCell(YARD_COORDS.red[pieceId].row, YARD_COORDS.red[pieceId].col)}
                  </div>
                ))}
              </div>
            </div>
          );
          c += 5; // Bỏ qua 5 cột tiếp theo
          continue;
        }
        // Yard trên phải - Green
        if (r === 0 && c === 9) {
          cells.push(
            <div key="yard-green" className="yard green" style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              <div className="yard-inner">
                {[0, 1, 2, 3].map(pieceId => (
                  <div key={`pocket-green-${pieceId}`} className="yard-pocket">
                    {renderPiecesInCell(YARD_COORDS.green[pieceId].row, YARD_COORDS.green[pieceId].col)}
                  </div>
                ))}
              </div>
            </div>
          );
          c += 5;
          continue;
        }
        // Yard dưới trái - Blue
        if (r === 9 && c === 0) {
          cells.push(
            <div key="yard-blue" className="yard blue" style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              <div className="yard-inner">
                {[0, 1, 2, 3].map(pieceId => (
                  <div key={`pocket-blue-${pieceId}`} className="yard-pocket">
                    {renderPiecesInCell(YARD_COORDS.blue[pieceId].row, YARD_COORDS.blue[pieceId].col)}
                  </div>
                ))}
              </div>
            </div>
          );
          c += 5;
          continue;
        }
        // Yard dưới phải - Yellow
        if (r === 9 && c === 9) {
          cells.push(
            <div key="yard-yellow" className="yard yellow" style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              <div className="yard-inner">
                {[0, 1, 2, 3].map(pieceId => (
                  <div key={`pocket-yellow-${pieceId}`} className="yard-pocket">
                    {renderPiecesInCell(YARD_COORDS.yellow[pieceId].row, YARD_COORDS.yellow[pieceId].col)}
                  </div>
                ))}
              </div>
            </div>
          );
          c += 5;
          continue;
        }

        // B. Ô đích trung tâm 3x3 (Home Center)
        if (r === 6 && c === 6) {
          cells.push(
            <div key="home-center" className="home-center">
              <div className="home-triangle red">{renderFinishedPieces('red')}</div>
              <div className="home-triangle green">{renderFinishedPieces('green')}</div>
              <div className="home-triangle yellow">{renderFinishedPieces('yellow')}</div>
              <div className="home-triangle blue">{renderFinishedPieces('blue')}</div>
            </div>
          );
          c += 2; // Bỏ qua 2 cột tiếp theo
          continue;
        }

        // Bỏ qua các hàng/cột nằm trong Yard và Home Center đã vẽ span
        if (r < 6 && c < 6) continue;
        if (r < 6 && c > 8) continue;
        if (r > 8 && c < 6) continue;
        if (r > 8 && c > 8) continue;
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue;

        // C. Các ô bình thường (Common path + Home stretch)
        cells.push(
          <div
            key={`cell-${r}-${c}`}
            className={getCellClasses(r, c)}
            style={{ gridRowStart: r + 1, gridColumnStart: c + 1 }}
          >
            {renderPiecesInCell(r, c)}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="ludo-board-container">
      <div className="ludo-board">
        {renderLudoGrid()}
      </div>
    </div>
  );
}
