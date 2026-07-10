import React from 'react';
import './Dice3D.css';

export default function Dice3D({ value, isRolling, onRoll, disabled }) {
  // Trả về class tương ứng để hiển thị đúng mặt xúc xắc 3D
  const getShowClass = () => {
    if (isRolling) {
      return `rolling roll-to-${value || 1}`;
    }
    switch (value) {
      case 1: return 'show-1';
      case 2: return 'show-2';
      case 3: return 'show-3';
      case 4: return 'show-4';
      case 5: return 'show-5';
      case 6: return 'show-6';
      default: return 'show-1'; // Mặc định hiển thị mặt 1
    }
  };

  const handleDiceClick = () => {
    if (!disabled && !isRolling && onRoll) {
      onRoll();
    }
  };

  const canRoll = !disabled && !isRolling;

  return (
    <div 
      className={`dice-container ${disabled ? 'disabled' : ''} ${canRoll ? 'prompt-pulse' : ''}`} 
      onClick={handleDiceClick}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className={`cube ${getShowClass()}`}>
        {/* Mặt 1 */}
        <div className="cube-face front face-1">
          <div className="dot"></div>
        </div>
        {/* Mặt 2 */}
        <div className="cube-face back face-2">
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        {/* Mặt 3 */}
        <div className="cube-face right face-3">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        {/* Mặt 4 */}
        <div className="cube-face left face-4">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        {/* Mặt 5 */}
        <div className="cube-face top face-5">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        {/* Mặt 6 */}
        <div className="cube-face bottom face-6">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
}
