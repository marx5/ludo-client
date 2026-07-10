import React from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Dice3D from '../Dice3D';

export default function GameControls({
  gameState,
  isRolling,
  canClientRollDice,
  onRollDice,
  isAutoPlay,
  setIsAutoPlay,
  myColor
}) {
  if (!gameState) return null;

  const { status } = gameState;
  const isMyTurn = gameState.currentTurnColor === myColor;

  return (
    <div className="controls-panel flex-grow">
      {status === 'playing' ? (
        <>
          {isMyTurn && (
            <Dice3D
              value={gameState.diceValue}
              isRolling={isRolling}
              onRoll={onRollDice}
              disabled={!canClientRollDice}
            />
          )}
          {isAutoPlay && (
            <div className="flex items-center gap-1.5 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-3.5 py-1.5 rounded-full shadow-md animate-pulse z-30">
              <input 
                type="checkbox" 
                id="auto-play-checkbox" 
                checked={isAutoPlay}
                onChange={(e) => setIsAutoPlay(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="auto-play-checkbox" className="text-xs font-extrabold text-slate-700 dark:text-gray-300 cursor-pointer select-none">
                Tự động chơi
              </label>
            </div>
          )}
        </>
      ) : (
        <div className="py-6 text-center">
          <Trophy className="text-yellow-400 mx-auto mb-2 animate-bounce" size={42} />
          <h3 className="font-bold text-lg text-yellow-400">CHIẾN THẮNG!</h3>
          <p className="text-sm text-gray-300 mt-1 font-semibold">{gameState.winner?.name}</p>
          <Button 
            variant="default"
            size="sm"
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Về sảnh chờ
          </Button>
        </div>
      )}
    </div>
  );
}
