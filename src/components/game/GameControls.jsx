import React from 'react';
import { Trophy } from 'lucide-react';
import Dice3D from '../Dice3D';

export default function GameControls({
  gameState,
  isRolling,
  canClientRollDice,
  onRollDice
}) {
  if (!gameState) return null;

  const { status } = gameState;

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
