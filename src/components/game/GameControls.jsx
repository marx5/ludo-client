import React, { useState, useEffect } from 'react';
import { Trophy, Clock } from 'lucide-react';
import Dice3D from '../Dice3D';
import './GameControls.css';

export default function GameControls({
  gameState,
  isRolling,
  canClientRollDice,
  onRollDice
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const timerEndAt = gameState?.timerEndAt;
  const status = gameState?.status;

  // Cập nhật bộ đếm ngược thời gian thực dựa trên timerEndAt của server/offline engine
  useEffect(() => {
    if (!timerEndAt || status !== 'playing') {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, timerEndAt - Date.now());
      setTimeLeft(remaining);
    };

    updateTimer(); // Chạy ngay lập tức để tránh delay 200ms ban đầu
    const interval = setInterval(updateTimer, 200);

    return () => clearInterval(interval);
  }, [timerEndAt, status]);

  if (!gameState) return null;

  const currentTurnPlayer = gameState.players[gameState.turnIndex];
  const { hasRolled } = gameState;

  const secondsLeft = Math.ceil(timeLeft / 1000);
  const maxLimit = hasRolled ? 60 : 30;
  const progressPercent = Math.min(100, (timeLeft / (maxLimit * 1000)) * 100);

  // Xác định class màu sắc của đồng hồ đếm ngược
  const getTimerColorClass = () => {
    if (secondsLeft <= 5) return 'timer-danger';
    if (secondsLeft <= 15) return 'timer-warning';
    return 'timer-safe';
  };

  // Chỉ hiển thị đếm ngược nếu lượt đi là của con người (Human)
  const shouldShowTimer = status === 'playing' && currentTurnPlayer && !currentTurnPlayer.isBot;

  return (
    <div className="glass-panel controls-panel flex-grow">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
        {status === 'playing' 
          ? `Lượt đi: ${gameState.currentTurnColor.toUpperCase()}` 
          : 'Trận đấu kết thúc'}
      </span>

      {status === 'playing' ? (
        <>
          <Dice3D
            value={gameState.diceValue}
            isRolling={isRolling}
            onRoll={onRollDice}
            disabled={!canClientRollDice}
          />

          {shouldShowTimer && (
            <div className={`timer-section ${getTimerColorClass()}`}>
              <div className="timer-header flex items-center justify-center gap-1.5 mb-1.5">
                <Clock size={14} className="timer-icon" />
                <span className="timer-text font-bold font-mono text-sm">
                  {secondsLeft}s còn lại để {hasRolled ? 'đi cờ' : 'đổ xúc xắc'}
                </span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="text-center mt-2">
            {canClientRollDice ? (
              <p className="text-sm text-green-400 font-medium animate-pulse">
                Đến lượt bạn! Click vào xúc xắc để đổ
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                {currentTurnPlayer?.isBot
                  ? 'Máy đang suy nghĩ...'
                  : `Đang đợi ${currentTurnPlayer?.name || 'người chơi'}...`}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="py-6 text-center">
          <Trophy className="text-yellow-400 mx-auto mb-2 animate-bounce" size={42} />
          <h3 className="font-bold text-lg text-yellow-400">CHIẾN THẮNG!</h3>
          <p className="text-sm text-gray-300 mt-1 font-semibold">{gameState.winner?.name}</p>
          <button 
            className="glass-button active mt-4 text-xs py-2 px-4" 
            onClick={() => window.location.reload()}
          >
            Về sảnh chờ
          </button>
        </div>
      )}
    </div>
  );
}
