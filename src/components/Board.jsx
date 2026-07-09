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

export default function Board({ pieces, currentTurnColor, validPiecesToMove = [], onPieceClick, players, myColor, timerEndAt }) {
  const isPieceMovable = (piece) =>
    piece.color === currentTurnColor && validPiecesToMove.includes(piece.id);

  // Góc xoay để đưa sân nhà của myColor về góc dưới-trái (BL)
  // red(TL)->BL: 270, green(TR)->BL: 180, yellow(BR)->BL: 90, blue(BL)->BL: 0
  const ROTATION = { red: 270, green: 180, yellow: 90, blue: 0 };
  const rotation = myColor && ROTATION[myColor] !== undefined ? ROTATION[myColor] : 0;

  // displayStep: bước đang hiển thị trên màn hình cho mỗi quân (để animate từng ô)
  const [display, setDisplay] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  // Cập nhật bộ đếm ngược thời gian thực cho các ô Yard
  useEffect(() => {
    if (!timerEndAt) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, timerEndAt - Date.now());
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);

    return () => clearInterval(interval);
  }, [timerEndAt]);

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
        // có di chuyển: đi từng ô một (tiến hoặc lùi)
        const from = prevStep < 0 ? 0 : prevStep;
        const to = target < 0 ? 0 : target;
        const step = from;
        if (step !== to) {
          const isForward = from < to;
          const delay = isForward ? 240 : 60; // đi lùi nhanh 60ms cho sinh động (nhanh x4 lần)
          
          let startDelay = delay;
          if (!isForward) {
            // Tìm quân cờ đang đi tiến trong lượt di chuyển này để tính thời gian chờ
            const forwardPiece = pieces.find(p => {
              const pKey = `${p.color}-${p.id}`;
              const pPrev = prev[pKey];
              return pPrev !== undefined && p.stepCount > pPrev;
            });
            if (forwardPiece) {
              const pKey = `${forwardPiece.color}-${forwardPiece.id}`;
              const pPrev = prev[pKey];
              const stepsForward = (pPrev === 0 && forwardPiece.position !== -1) ? 1 : (forwardPiece.stepCount - pPrev);
              startDelay = stepsForward * 240 + 200; // Đợi quân đi tiến tới nơi + 200ms dừng chân rồi mới đá!
            }
          }

          let cur = step;
          const tick = () => {
            cur = isForward ? cur + 1 : cur - 1;
            if (isForward ? cur > to : cur < to) return;
            setDisplay((d) => ({ ...d, [key]: cur }));
            const t = setTimeout(tick, delay);
            timers.current.push(t);
          };
          const t0 = setTimeout(tick, startDelay);
          timers.current.push(t0);
        }
        nextDisplay[key] = from; // bắt đầu từ vị trí cũ, effect timer sẽ đẩy lên hoặc lùi xuống
      } else {
        nextDisplay[key] = target;
      }
    });

    setDisplay(nextDisplay);
    prevRef.current = newPrev;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Gom các quân cùng 1 ô để xếp chồng (phân bổ góc trực quan)
  // Chỉ gom nhóm và tính offset nếu quân cờ đã đứng yên tại ô đích (step === piece.stepCount)
  const slotOffsets = (() => {
    const groups = {};
    
    // Bước 1: Chỉ gom nhóm các quân cờ ĐANG ĐỨNG YÊN (display step đã đạt target stepCount)
    Object.entries(display).forEach(([key, step]) => {
      const piece = pieces.find((p) => `${p.color}-${p.id}` === key);
      if (!piece || step === 58) return; // Không tính quân về đích vì đã hiển thị riêng ở home-center
      
      const isMoving = step !== piece.stepCount;
      if (isMoving) return; // Nếu quân cờ đang di chuyển (lướt qua), không tính vào nhóm xếp chồng

      const pct = piecePercentAtStep(piece.color, piece.id, step < 0 ? 0 : step);
      const gkey = `${Math.round(pct.top)}-${Math.round(pct.left)}`;
      if (!groups[gkey]) groups[gkey] = [];
      groups[gkey].push(key);
    });

    const map = {};
    Object.values(groups).forEach((arr) => {
      const n = arr.length;
      arr.forEach((key, idx) => {
        let dx = 0;
        let dy = 0;
        if (n === 2) {
          dx = idx === 0 ? -4.5 : 4.5;
          dy = idx === 0 ? -4.5 : 4.5;
        } else if (n === 3) {
          if (idx === 0) { dx = 0; dy = -5; }
          else if (idx === 1) { dx = -4.5; dy = 4; }
          else if (idx === 2) { dx = 4.5; dy = 4; }
        } else if (n >= 4) {
          const posIndex = idx % 4;
          if (posIndex === 0) { dx = -4.5; dy = -4.5; }
          else if (posIndex === 1) { dx = 4.5; dy = -4.5; }
          else if (posIndex === 2) { dx = -4.5; dy = 4.5; }
          else if (posIndex === 3) { dx = 4.5; dy = 4.5; }
        }
        map[key] = {
          dx,
          dy,
          z: 10 + idx,
          isStacked: n > 1
        };
      });
    });

    // Bước 2: Với các quân cờ đang lướt đi lò cò, cho chúng đi qua chính tâm của ô cờ (offset = 0) và không stacked
    Object.keys(display).forEach((key) => {
      if (map[key]) return; // Đã được xử lý ở bước 1 (quân đứng yên)

      const piece = pieces.find((p) => `${p.color}-${p.id}` === key);
      if (!piece) return;

      map[key] = {
        dx: 0,
        dy: 0,
        z: 30, // Cho quân đang lướt bay hiển thị nổi lên trên cùng các quân đứng yên
        isStacked: false
      };
    });

    return map;
  })();

  const renderFinishedPieces = (color) => {
    const finished = pieces.filter((p) => p.color === color && p.stepCount === 58);
    const off = {
      red: { dx: -18, dy: 0, sx: -3, sy: 0 },
      green: { dx: 0, dy: -18, sx: 0, sy: -3 },
      yellow: { dx: 18, dy: 0, sx: 3, sy: 0 },
      blue: { dx: 0, dy: 18, sx: 0, sy: 3 },
    }[color];
    return finished.map((piece, index) => {
      const px = off.dx + index * off.sx;
      const py = off.dy + index * off.sy;
      return (
        <div
          key={`piece-finished-${color}-${piece.id}`}
          className={`piece finished-piece ${color}`}
          style={{
            position: 'absolute',
            left: `calc(50% + ${px}px)`,
            top: `calc(50% + ${py}px)`,
            zIndex: 15 + index,
          }}
          title={`Quân ${color.toUpperCase()} #${piece.id + 1} đã về đích!`}
        />
      );
    });
  };

  // Vẽ dải viền tiến trình đếm ngược SVG bao quanh ô Yard
  const renderYardTimer = (color) => {
    if (currentTurnColor !== color || !timerEndAt || timeLeft <= 0) return null;

    const maxLimit = 30;
    const progressPercent = Math.min(100, (timeLeft / (maxLimit * 1000)) * 100);
    const strokeDashoffset = 100 - progressPercent;

    const secondsLeft = Math.ceil(timeLeft / 1000);
    const getTimerColorClass = () => {
      if (secondsLeft <= 5) return 'timer-danger';
      if (secondsLeft <= 15) return 'timer-warning';
      return 'timer-safe';
    };

    return (
      <svg className={`yard-timer-svg ${getTimerColorClass()}`} viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect
          x="1"
          y="1"
          width="98"
          height="98"
          rx="6"
          fill="none"
          strokeWidth="2.5"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
    );
  };

  // Xác định màu sân cho từng góc màn hình cố định dựa trên góc xoay
  const getColorsForScreenCorners = () => {
    // Mặc định cho rotation = 0 (Blue ở Bottom-Left)
    let tl = 'red', tr = 'green', br = 'yellow', bl = 'blue';
    
    if (rotation === 90) {
      tl = 'blue'; tr = 'red'; br = 'green'; bl = 'yellow';
    } else if (rotation === 180) {
      tl = 'yellow'; tr = 'blue'; br = 'red'; bl = 'green';
    } else if (rotation === 270) {
      tl = 'green'; tr = 'yellow'; br = 'blue'; bl = 'red';
    }
    
    return { tl, tr, br, bl };
  };

  // Vẽ 4 avatar người chơi lơ lửng ở các góc cố định ngoài viền bàn cờ
  const renderCornerAvatar = (color, cornerClass) => {
    const player = players?.find(p => p.color === color) || { 
      name: color === 'red' ? 'Đỏ' : color === 'green' ? 'Xanh Lá' : color === 'yellow' ? 'Vàng' : 'Xanh Dương', 
      isBot: true 
    };
    const isActive = currentTurnColor === color;

    return (
      <div className={`yard-avatar-container ${color} ${cornerClass}`}>
        <div className={`yard-avatar ${isActive ? 'active-turn' : ''}`}>
          <span className="avatar-icon">{player.isBot ? '🤖' : '👤'}</span>
        </div>
        <div className="yard-avatar-name" title={player.name}>
          {player.name}
        </div>
      </div>
    );
  };

  // Render quân cờ vào trong mỗi pocket của sân nhà -> luôn trùng khít tâm ô
  const renderYardPiece = (color, pieceId) => {
    const piece = pieces.find((p) => p.color === color && p.id === pieceId && p.position === -1 && p.stepCount <= 0);
    if (!piece) return null;

    // Nếu quân cờ này đang chạy lò cò lùi về chuồng (step > 0), chưa hiển thị trong Yard
    const key = `${color}-${pieceId}`;
    const step = display[key] !== undefined ? display[key] : piece.stepCount;
    if (step > 0) return null;

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
          const isActive = currentTurnColor === 'red';
          cells.push(
            <div key="yard-red" className={`yard red ${isActive ? 'active-turn' : ''}`} style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              {renderYardTimer('red')}
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
          const isActive = currentTurnColor === 'green';
          cells.push(
            <div key="yard-green" className={`yard green ${isActive ? 'active-turn' : ''}`} style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              {renderYardTimer('green')}
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
          const isActive = currentTurnColor === 'blue';
          cells.push(
            <div key="yard-blue" className={`yard blue ${isActive ? 'active-turn' : ''}`} style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              {renderYardTimer('blue')}
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
          const isActive = currentTurnColor === 'yellow';
          cells.push(
            <div key="yard-yellow" className={`yard yellow ${isActive ? 'active-turn' : ''}`} style={{ gridColumn: 'span 6', gridRow: 'span 6' }}>
              {renderYardTimer('yellow')}
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

        const isRedEntrance = r === 7 && c === 0;
        const isGreenEntrance = r === 0 && c === 7;
        const isYellowEntrance = r === 7 && c === 14;
        const isBlueEntrance = r === 14 && c === 7;

        let cellContent = null;
        if (isRedEntrance) {
          cellContent = (
            <div className="entrance-arrow arrow-right arrow-red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
          );
        } else if (isGreenEntrance) {
          cellContent = (
            <div className="entrance-arrow arrow-down arrow-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
          );
        } else if (isYellowEntrance) {
          cellContent = (
            <div className="entrance-arrow arrow-left arrow-yellow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
          );
        } else if (isBlueEntrance) {
          cellContent = (
            <div className="entrance-arrow arrow-up arrow-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
          );
        }

        cells.push(
          <div
            key={`cell-${r}-${c}`}
            className={getCellClasses(r, c)}
            style={{ gridRowStart: r + 1, gridColumnStart: c + 1 }}
          >
            {cellContent}
          </div>
        );
      }
    }
    return cells;
  };

  const corners = getColorsForScreenCorners();

  return (
    <div className="ludo-board-container">
      {/* Render 4 Avatar lơ lửng ở 4 góc màn hình cố định */}
      {renderCornerAvatar(corners.tl, 'top-left-corner')}
      {renderCornerAvatar(corners.tr, 'top-right-corner')}
      {renderCornerAvatar(corners.br, 'bottom-right-corner')}
      {renderCornerAvatar(corners.bl, 'bottom-left-corner')}

      <div className="board-rotator" style={{ transform: `rotate(${rotation}deg)` }}>
        <div className="ludo-board">
          {renderLudoGrid()}

          {/* Lớp overlay chứa quân cờ, animate từng ô */}
          <div className="pieces-overlay">
            {pieces.map((piece) => {
              const key = `${piece.color}-${piece.id}`;
              const step = display[key] !== undefined ? display[key] : piece.stepCount;

              // Chỉ ẩn khỏi overlay nếu thực sự đã về đích (step === 58)
              if (piece.stepCount === 58 && step === 58) return null;

              // Chỉ ẩn khỏi overlay nếu đã về chuồng hẳn (step <= 0)
              const isInYardOverlay = piece.position === -1 && step <= 0;
              if (isInYardOverlay) return null;

              const pct = piecePercentAtStep(piece.color, piece.id, step < 0 ? 0 : step);
              const off = slotOffsets[key] || { dx: 0, dy: 0, z: 10, isStacked: false };
              const movable = isPieceMovable(piece);
              return (
                <div
                  key={`piece-${key}`}
                  className={`piece ${piece.color} ${movable ? 'movable' : ''} ${off.isStacked ? 'stacked' : ''} ${piece.position === -1 ? 'in-yard' : ''}`}
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
