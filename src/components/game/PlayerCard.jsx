import React, { useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { ROLL_TIMEOUT_MS, MOVE_TIMEOUT_MS } from '../../utils/constants';
import Dice3D from '../Dice3D';

const getColorTheme = (color) => {
  switch (color) {
    case 'red': return { bg: 'bg-red-900/40', border: 'border-red-500/50', stroke: '#ef4444', icon: 'text-red-500' };
    case 'green': return { bg: 'bg-green-900/40', border: 'border-green-500/50', stroke: '#22c55e', icon: 'text-green-500' };
    case 'yellow': return { bg: 'bg-yellow-900/40', border: 'border-yellow-500/50', stroke: '#eab308', icon: 'text-yellow-500' };
    case 'blue': return { bg: 'bg-blue-900/40', border: 'border-blue-500/50', stroke: '#3b82f6', icon: 'text-blue-500' };
    default: return { bg: 'bg-gray-900/40', border: 'border-gray-500/50', stroke: '#9ca3af', icon: 'text-gray-500' };
  }
};

export default function PlayerCard({ player, color, isTurn, gameState, position, isRolling, myColor }) {
  const requestRef = useRef();
  const circleRef = useRef(null);

  // Đếm số quân cờ đã về đích
  const finishedPieces = gameState?.pieces?.filter(p => p.color === color && p.stepCount === 58)?.length || 0;
  
  const theme = getColorTheme(color);
  const isActive = isTurn && gameState?.status === 'playing';

  // SVG parameters
  const circleRadius = 14;
  const circleCircumference = 2 * Math.PI * circleRadius;

  useEffect(() => {
    if (!isActive || !gameState?.timerEndAt) {
      cancelAnimationFrame(requestRef.current);
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = '0';
      }
      return;
    }

    const totalTime = gameState.hasRolled ? MOVE_TIMEOUT_MS : ROLL_TIMEOUT_MS;

    const updateProgress = () => {
      const timeLeft = gameState.timerEndAt - Date.now();
      let newOffset;
      if (timeLeft <= 0) {
        newOffset = circleCircumference;
      } else {
        const percent = (timeLeft / totalTime);
        newOffset = circleCircumference - (percent * circleCircumference);
      }
      
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = newOffset;
      }
      
      if (timeLeft > 0) {
        requestRef.current = requestAnimationFrame(updateProgress);
      }
    };

    requestRef.current = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(requestRef.current);
  }, [isActive, gameState?.timerEndAt, gameState?.hasRolled, circleCircumference]);

  const isRightSide = position === 'top-right' || position === 'bottom-right';

  return (
    <div 
      className={`player-card player-card-${position} relative flex-shrink-0 flex items-center gap-1.5 h-9 py-1 px-1.5 rounded-none backdrop-blur-md border ${theme.bg} ${theme.border} ${isActive ? 'shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-105' : 'opacity-70'} transition-all duration-300 w-36 ${isRightSide ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ overflow: 'visible', borderRadius: '0px' }}
    >
      {/* Floating mini 3D dice for bots / other players */}
      {isActive && color !== myColor && (
        <div 
          className={`absolute ${isRightSide ? 'right-full mr-1.5' : 'left-full ml-1.5'} top-1/2 z-20`}
          style={{ transform: 'translateY(-50%) scale(0.55)', transformOrigin: isRightSide ? 'right center' : 'left center' }}
        >
          <Dice3D value={gameState?.diceValue} isRolling={isRolling} disabled={true} />
        </div>
      )}

      {/* Avatar Container with SVG Progress Ring */}
      <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
        {isActive && (
          <svg className="absolute top-0 left-0 w-full h-full -rotate-90" width="32" height="32">
            <circle
              cx="16"
              cy="16"
              r={circleRadius}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="2"
              fill="none"
            />
            <circle
              ref={circleRef}
              cx="16"
              cy="16"
              r={circleRadius}
              stroke={theme.stroke}
              strokeWidth="2"
              fill="none"
              strokeDasharray={circleCircumference}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
          </svg>
        )}
        <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center overflow-hidden">
          {player?.avatar ? (
            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <User className="text-gray-300 w-3.5 h-3.5" />
          )}
        </div>
      </div>

      {/* Info */}
      <div className={`flex flex-col flex-grow min-w-0 ${isRightSide ? 'items-end text-right' : 'items-start text-left'}`}>
        <span className={`text-[10px] font-bold text-white truncate w-full ${isRightSide ? 'text-right' : 'text-left'}`} title={player?.name || 'Đang đợi...'}>
          {player?.name || 'Trống'}
        </span>
        <div className={`flex items-center gap-1 mt-0.5 ${isRightSide ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`w-2 h-2 rounded-full ${theme.icon.replace('text-', 'bg-')} border border-white/50 shadow-inner`}></div>
          <span className="text-[9px] text-gray-300">{finishedPieces} / 4</span>
        </div>
      </div>
    </div>
  );
}
