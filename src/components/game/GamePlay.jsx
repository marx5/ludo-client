import React, { useState, useEffect, useRef } from 'react';
import PhaserGame from '../../game/PhaserGame';
import { EventBus } from '../../game/EventBus';
import GameControls from './GameControls';
import RealtimeChat from './RealtimeChat';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './GamePlay.css';

import PlayerCard from './PlayerCard';

export default function GamePlay({
  gameState,
  isOnline,
  isRolling,
  getMovablePieceIds,
  canClientRollDice,
  getMyColor,
  online,
  offline,
  onRollDice,
  onMovePiece,
  isAutoPlay,
  setIsAutoPlay
}) {
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [activeToasts, setActiveToasts] = useState([]);
  const prevChatCount = useRef(0);

  useEffect(() => {
    if (!isOnline || !online?.chatMessages) return;
    if (online.chatMessages.length > prevChatCount.current) {
      const latestMessage = online.chatMessages[online.chatMessages.length - 1];
      
      const newToast = {
        id: Date.now() + Math.random(),
        sender: latestMessage.sender,
        text: latestMessage.text
      };
      
      setActiveToasts(prev => {
        const updated = [...prev, newToast];
        if (updated.length > 3) {
          updated.shift();
        }
        return updated;
      });
      
      setTimeout(() => {
        setActiveToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
    }
    prevChatCount.current = online.chatMessages.length;
  }, [online?.chatMessages, isOnline]);

  useEffect(() => {
    const payload = {
      state: gameState,
      myColor: getMyColor(),
      movablePieceIds: getMovablePieceIds()
    };
    EventBus.emit('update-game-state', payload);
    
    const onSceneReady = () => {
      EventBus.emit('set-player-color', getMyColor());
      EventBus.emit('update-game-state', payload);
    };
    EventBus.on('scene-ready', onSceneReady);
    
    return () => {
      EventBus.off('scene-ready', onSceneReady);
    };
  }, [gameState, getMyColor, getMovablePieceIds]);

  useEffect(() => {
    const handlePieceClick = ({ color, id }) => {
      onMovePiece(color, id);
    };
    
    EventBus.on('piece-clicked', handlePieceClick);
    return () => {
      EventBus.off('piece-clicked', handlePieceClick);
    };
  }, [onMovePiece]);

  const myColor = getMyColor() || 'blue';
  
  let topLeftColor = 'red';
  let topRightColor = 'green';
  let bottomRightColor = 'yellow';
  let bottomLeftColor = 'blue';

  if (myColor === 'red') {
    topLeftColor = 'green';
    topRightColor = 'yellow';
    bottomRightColor = 'blue';
    bottomLeftColor = 'red';
  } else if (myColor === 'green') {
    topLeftColor = 'yellow';
    topRightColor = 'blue';
    bottomRightColor = 'red';
    bottomLeftColor = 'green';
  } else if (myColor === 'yellow') {
    topLeftColor = 'blue';
    topRightColor = 'red';
    bottomRightColor = 'green';
    bottomLeftColor = 'yellow';
  }

  const getPlayerByColor = (color) => gameState?.players?.find(p => p.color === color) || null;

  return (
    <div className="game-layout">
      {/* Khu vực Bàn cờ & 4 thẻ người chơi góc */}
      <section className="main-board-panel flex flex-col justify-center items-center w-full relative">
        <div className="flex justify-between w-full max-w-3xl mx-auto mb-1 px-2">
          {getPlayerByColor(topLeftColor) ? (
            <PlayerCard 
              color={topLeftColor} 
              player={getPlayerByColor(topLeftColor)} 
              isTurn={gameState?.currentTurnColor === topLeftColor} 
              isRolling={isRolling}
              myColor={myColor}
              gameState={gameState} 
              position="top-left" 
            />
          ) : (
            <div className="w-36 invisible" />
          )}
          {getPlayerByColor(topRightColor) ? (
            <PlayerCard 
              color={topRightColor} 
              player={getPlayerByColor(topRightColor)} 
              isTurn={gameState?.currentTurnColor === topRightColor} 
              isRolling={isRolling}
              myColor={myColor}
              gameState={gameState} 
              position="top-right" 
            />
          ) : (
            <div className="w-36 invisible" />
          )}
        </div>

        <PhaserGame />

        <div className="flex justify-between items-center w-full max-w-3xl mx-auto mt-1 px-2 relative">
          {getPlayerByColor(bottomLeftColor) ? (
            <PlayerCard 
              color={bottomLeftColor} 
              player={getPlayerByColor(bottomLeftColor)} 
              isTurn={gameState?.currentTurnColor === bottomLeftColor} 
              isRolling={isRolling}
              myColor={myColor}
              gameState={gameState} 
              position="bottom-left" 
            />
          ) : (
            <div className="w-36 invisible" />
          )}

          {/* Xúc xắc chính ở giữa hai thẻ người chơi dưới */}
          <div className={`flex justify-center items-center ${gameState?.currentTurnColor === myColor || isAutoPlay ? '' : 'invisible pointer-events-none'}`}>
            <GameControls
              gameState={gameState}
              isRolling={isRolling}
              canClientRollDice={canClientRollDice()}
              onRollDice={onRollDice}
              isAutoPlay={isAutoPlay}
              setIsAutoPlay={setIsAutoPlay}
              myColor={myColor}
            />
          </div>

          {getPlayerByColor(bottomRightColor) ? (
            <PlayerCard 
              color={bottomRightColor} 
              player={getPlayerByColor(bottomRightColor)} 
              isTurn={gameState?.currentTurnColor === bottomRightColor} 
              isRolling={isRolling}
              myColor={myColor}
              gameState={gameState} 
              position="bottom-right" 
            />
          ) : (
            <div className="w-36 invisible" />
          )}
        </div>
      </section>

      {/* Floating 3 chat messages toasts */}
      {activeToasts.length > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-1.5 z-40 w-full max-w-[380px] px-4 pointer-events-none">
          {activeToasts.map(toast => (
            <div 
              key={toast.id} 
              className="bg-black/80 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg pointer-events-none"
            >
              <span className="font-bold text-blue-400 mr-1.5">{toast.sender}:</span>
              <span>{toast.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dưới bàn cờ: Xúc xắc + Chat (online) */}
      <section className="below-board-panel">

        {/* Chatbox dạng trượt mở rộng trên Mobile */}
        {isOnline && (
          <>
            <Button 
              variant="outline"
              className={`chat-toggle-button absolute z-50 rounded-full shadow-lg ${isChatExpanded ? 'expanded bg-white/20' : 'bg-black/50 backdrop-blur-md border-white/20'}`}
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              title={isChatExpanded ? 'Đóng hộp chat' : 'Mở hộp chat'}
            >
              {isChatExpanded ? <X size={18} className="mr-2" /> : <MessageSquare size={18} className="mr-2" />}
              <span className="chat-toggle-text">{isChatExpanded ? 'Đóng chat' : 'Trò chuyện'}</span>
            </Button>

            <RealtimeChat
              chatMessages={online.chatMessages}
              onSendMessage={online.handleSendChatMessage}
              title="Hộp chat"
              TitleIcon={MessageSquare}
              placeholder="Nhập tin nhắn..."
              emptyText="Gửi tin nhắn để chat cùng mọi người!"
              className={`below-board-chat mobile-sliding-chat glass-panel ${isChatExpanded ? 'expanded' : 'collapsed'}`}
              size="xs"
            />
          </>
        )}
      </section>
    </div>
  );
}
