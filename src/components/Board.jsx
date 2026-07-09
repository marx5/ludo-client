import React, { useState, useEffect, useRef } from 'react';
import { COMMON_TRACK_COORDS, HOME_STRETCH_COORDS, YARD_COORDS, HOME_COORDS } from '../utils/boardCoordinates';
import './Board.css';

const GRID_SIZE = 15;
const START_POSITIONS = { red: 0, green: 13, yellow: 26, blue: 39 };

// Tọa độ % (tâm quân cờ) của một ô grid (row, col)
function cellPercentCoords(row, col) {
  const cell = 100 / GRID_SIZE;
  return { left: (col + 0.5) * cell, top: (row + 0.5) * cell };
}

// Lấy tọa độ grid (row, col) của một quân cờ tại một stepCount cụ thể
function pieceGridAtStep(color, pieceId, stepCount) {
  if (stepCount <= 0) return YARD_COORDS[color][pieceId];   // ở yard
  if (stepCount === 58) return HOME_COORDS[color];            // về đích
  if (stepCount <= 51) {
    const pos = (START_POSITIONS[color] + stepCount - 1) % 52;
    return COMMON_TRACK_COORDS[pos];
  }
  return HOME_STRETCH_COORDS[color][stepCount - 52];
}

function piecePercentAtStep(color, pieceId, stepCount) {
  const g = pieceGridAtStep(color, pieceId, stepCount);
  return cellPercentCoords(g.row, g.col);
}

export default function Board({ pieces, currentTurnColor, validPiecesToMove = [], onPieceClick, players, myColor }) {
  const isPieceMovable = (piece) =>
    piece.color === currentTurnColor && validPiecesToMove.includes(piece.id);

  // Góc xoay để đưa sân nhà của myColor về góc dưới-trái (BL)
  // red(TL)->BL: 270, green(TR)->BL: 180, yellow(BR)->BL: 90, blue(BL)->BL: 0
  const ROTATION = { red: 270, green: 180, yellow: 90, blue: 0 };
  const rotation = myColor && ROTATION[myColor] !== undefined ? ROTATION[myColor] : 0;

  // displayStep: bước đang hiển thị trên màn hình cho mỗi quân (để animate từng ô)
  const [display, setDisplay] = useState({});
  const prevRef = useRef({});
  const timers = useRef([]);

  useEffect(() => {
    // dọn timer cũ
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const prev = prevRef.current;
    const nextDisplay = { ...display };
    const newPrev = {};

    pieces.forEach((piece) => {
      const key = `${piece.color}-${piece.id}`;
      const target = piece.stepCount;
      const prevStep = prev[key] !== undefined ? prev[key] : (piece.position === -1 ? 0 : target);
      newPrev[key] = target;

      if (prev[key] === undefined) {
        // lần đầu: đặt thẳng (không animate)
        nextDisplay[key] = target;
      } else if (target !== prevStep) {
        // có di chuyển: đi từng ô một
        const from = prevStep < 0 ? 0 : prevStep;
        const to = target < 0 ? 0 : target;
        const step = from;
        if (step !== to) {
          // animate tăng dần mỗi 180ms
          let cur = step;
          const tick = () => {
            cur += 1;
            if (cur > to) return;
            setDisplay((d) => ({ ...d, [key]: cur }));
            const t = setTimeout(tick, 240);
            timers.current.push(t);
          };
          const t0 = setTimeout(tick, 240);
          timers.current.push(t0);
        }
        nextDisplay[key] = from; // bắt đầu từ vị trí cũ, effect timer sẽ đẩy lên
      } else {
        nextDisplay[key] = target;
      }
    });

    setDisplay(nextDisplay);
    prevRef.current = newPrev;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Gom các quân cùng 1 ô để xếp chồng (visual offset nhỏ)
  const slotOffsets = (() => {
    const groups = {};
    Object.entries(display).forEach(([key, step]) => {
      const piece = pieces.find((p) => `${p.color}-${p.id}` === key);
      if (!piece || step === 58) return;
      const pct = piecePercentAtStep(piece.color, piece.id, step < 0 ? 0 : step);
      const gkey = `${Math.round(pct.top)}-${Math.round(pct.left)}`;
      if (!groups[gkey]) groups[gkey] = [];
      groups[gkey].push({ key, piece });
    });
    const map = {};
    Object.values(groups).forEach((arr) => {
      arr.forEach((item, idx) => {
        const n = arr.length;
        map[item.key] = {
          dx: n > 1 ? (idx - (n - 1) / 2) * 4 : 0,
          dy: n > 1 ? (idx - (n - 1) / 2) * -2.5 : 0,
          z: n > 1 ? 10 + idx : 10,
        };
      });
    });
    return map;
  })();

  const renderFinishedPieces = (color) => {
    const finished = pieces.filter((p) => p.color === color && p.stepCount === 58);
    const off = {
      red: { dx: -20, dy: 0 },
      green: { dx: 0, dy: -20 },
      yellow: { dx: 20, dy: 0 },
      blue: { dx: 0, dy: 20 },
    }[color];
    return finished.map((piece) => (
      <div
        key={`piece-finished-${color}-${piece.id}`}
        className={`piece ${color}`}
        style={{
          position: 'absolute',
          left: `calc(50% + ${off.dx}px)`,
          top: `calc(50% + ${off.dy}px)`,
          zIndex: 15,
        }}
        title={`Quân ${color.toUpperCase()} #${piece.id + 1} đã về đích!`}
      />
    ));
  };

  // Render quân cờ vào trong mỗi pocket của sân nhà -> luôn trùng khít tâm ô
  const renderYardPiece = (color, pieceId) => {
    const piece = pieces.find((p) => p.color === color && p.id === pieceId && p.position === -1 && p.stepCount <= 0);
    if (!piece) return null;
    const movable = isPieceMovable(piece);
    return (
      <div
        key={`yard-piece-${color}-${pieceId}`}
        className={`piece ${color} ${movable ? 'movable' : ''} in-yard`}
        style={{ position: 'absolute', left: '50%', top: '50%', zIndex: movable ? 25 : 12 }}
        onClick={(e) => {
          e.stopPropagation();
          if (movable) onPieceClick(piece.color, piece.id);
        }}
        title={`Quân ${color.toUpperCase()} #${piece.id + 1} (Sân nhà)`}
      />
    );
  };

  const getCellClasses = (row, col) => {
    const classes = ['cell'];
    const commonIndex = COMMON_TRACK_COORDS.findIndex((c) => c.row === row && c.col === col);
    const isSafeIndex = [0, 8, 13, 21, 26, 34, 39, 47].includes(commonIndex);
    if (commonIndex !== -1 && isSafeIndex) classes.push('safe-zone-cell');

    if (row === 6 && col === 1) classes.push('red-start');
    if (row === 1 && col === 8) classes.push('green-start');
    if (row === 8 && col === 13) classes.push('yellow-start');
    if (row === 13 && col === 6) classes.push('blue-start');

    if (commonIndex !== -1) {
      if (commonIndex >= 0 && commonIndex <= 5) classes.push('red-path');
      else if (commonIndex >= 12 && commonIndex <= 17) classes.push('green-path');
      else if (commonIndex >= 25 && commonIndex <= 30) classes.push('yellow-path');
      else if (commonIndex >= 38 && commonIndex <= 43) classes.push('blue-path');
    }

    Object.keys(HOME_STRETCH_COORDS).forEach((color) => {
      const idx = HOME_STRETCH_COORDS[color].findIndex((c) => c.row === row && c.col === col);
      if (idx !== -1) classes.push(`${color}-home-stretch`);
    });

    return classes.join(' ');
  };

  const renderLudoGrid = () => {
    const cells = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (r === 0 && c === 0) {
          cells.push(
            <div key="yard-red" className="yard red" style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              <div className="yard-inner">
                {[0, 1, 2, 3].map((pieceId) => (
                  <div key={`pocket-red-${pieceId}`} className="yard-pocket">
                    {renderYardPiece('red', pieceId)}
                  </div>
                ))}
              </div>
            </div>
          );
          c += 5; continue;
        }
        if (r === 0 && c === 9) {
          cells.push(
            <div key="yard-green" className="yard green" style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              <div className="yard-inner">
                {[0, 1, 2, 3].map((pieceId) => (
                  <div key={`pocket-green-${pieceId}`} className="yard-pocket">
                    {renderYardPiece('green', pieceId)}
                  </div>
                ))}
              </div>
            </div>
          );
          c += 5; continue;
        }
        if (r === 9 && c === 0) {
          cells.push(
            <div key="yard-blue" className="yard blue" style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              <div className="yard-inner">
                {[0, 1, 2, 3].map((pieceId) => (
                  <div key={`pocket-blue-${pieceId}`} className="yard-pocket">
                    {renderYardPiece('blue', pieceId)}
                  </div>
                ))}
              </div>
            </div>
          );
          c += 5; continue;
        }
        if (r === 9 && c === 9) {
          cells.push(
            <div key="yard-yellow" className="yard yellow" style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              <div className="yard-inner">
                {[0, 1, 2, 3].map((pieceId) => (
                  <div key={`pocket-yellow-${pieceId}`} className="yard-pocket">
                    {renderYardPiece('yellow', pieceId)}
                  </div>
                ))}
              </div>
            </div>
          );
          c += 5; continue;
        }

        if (r === 6 && c === 6) {
          cells.push(
            <div key="home-center" className="home-center">
              <div className="home-triangle red">{renderFinishedPieces('red')}</div>
              <div className="home-triangle green">{renderFinishedPieces('green')}</div>
              <div className="home-triangle yellow">{renderFinishedPieces('yellow')}</div>
              <div className="home-triangle blue">{renderFinishedPieces('blue')}</div>
            </div>
          );
          c += 2; continue;
        }

        if (r < 6 && c < 6) continue;
        if (r < 6 && c > 8) continue;
        if (r > 8 && c < 6) continue;
        if (r > 8 && c > 8) continue;
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue;

        cells.push(
          <div
            key={`cell-${r}-${c}`}
            className={getCellClasses(r, c)}
            style={{ gridRowStart: r + 1, gridColumnStart: c + 1 }}
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className="ludo-board-container">
      <div className="board-rotator" style={{ transform: `rotate(${rotation}deg)` }}>
        <div className="ludo-board">
          {renderLudoGrid()}

          {/* Lớp overlay chứa quân cờ, animate từng ô */}
          <div className="pieces-overlay">
            {pieces.map((piece) => {
              const key = `${piece.color}-${piece.id}`;
              if (piece.stepCount === 58) return null; // về đích vẽ riêng ở home-center
              if (piece.position === -1) return null;  // quân yard vẽ riêng trong yard-inner
              const step = display[key] !== undefined ? display[key] : piece.stepCount;
              const pct = piecePercentAtStep(piece.color, piece.id, step < 0 ? 0 : step);
              const off = slotOffsets[key] || { dx: 0, dy: 0, z: 10 };
              const movable = isPieceMovable(piece);
              return (
                <div
                  key={`piece-${key}`}
                  className={`piece ${piece.color} ${movable ? 'movable' : ''} ${piece.position === -1 ? 'in-yard' : ''}`}
                  style={{
                    left: `calc(${pct.left}% + ${off.dx}px)`,
                    top: `calc(${pct.top}% + ${off.dy}px)`,
                    zIndex: movable ? 25 : off.z,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (movable) onPieceClick(piece.color, piece.id);
                  }}
                  title={`Quân ${piece.color.toUpperCase()} #${piece.id + 1} (Bước: ${piece.stepCount})`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
