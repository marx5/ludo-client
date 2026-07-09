import React, { useState } from 'react';
import Board from '../Board';
import GameControls from './GameControls';
import RealtimeChat from './RealtimeChat';
import { MessageSquare, X } from 'lucide-react';
import './GamePlay.css';

export default function GamePlay({
  gameState,
  isOnline,
  isRolling,
  getMovablePieceIds,
  canClientRollDice,
  getMyColor,
  online,
  offline
}) {
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  return (
    <div className="game-layout">
      {/* Cột giữa: Bàn cờ Ludo 15x15 */}
      <section className="main-board-panel">
        <Board
          pieces={gameState.pieces}
          currentTurnColor={gameState.currentTurnColor}
          validPiecesToMove={getMovablePieceIds()}
          onPieceClick={isOnline ? online.handleMoveOnlinePiece : offline.handleMoveOfflinePiece}
          players={gameState.players}
          myColor={getMyColor()}
        />
      </section>

      {/* Dưới bàn cờ: Xúc xắc + Chat (online) */}
      <section className="below-board-panel">
        {/* Bảng xúc xắc (Dice controls) */}
        <GameControls
          gameState={gameState}
          isRolling={isRolling}
          canClientRollDice={canClientRollDice()}
          onRollDice={isOnline ? online.handleRollOnlineDice : offline.handleRollOfflineDice}
        />

        {/* Chatbox dạng trượt mở rộng trên Mobile */}
        {isOnline && (
          <>
            <button 
              className={`chat-toggle-button glass-button ${isChatExpanded ? 'expanded' : ''}`}
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              title={isChatExpanded ? 'Đóng hộp chat' : 'Mở hộp chat'}
            >
              {isChatExpanded ? <X size={18} /> : <MessageSquare size={18} />}
              <span className="chat-toggle-text">{isChatExpanded ? 'Đóng chat' : 'Trò chuyện'}</span>
            </button>

            <RealtimeChat
              chatMessages={online.chatMessages}
              onSendMessage={online.handleSendChatMessage}
              title="Hộp chat"
              TitleIcon={MessageSquare}
              placeholder="Nhập tin nhắn..."
              emptyText="Gửi tin nhắn để chat cùng mọi người!"
              className={`below-board-chat mobile-sliding-chat ${isChatExpanded ? 'expanded' : 'collapsed'}`}
              size="xs"
            />
          </>
        )}
      </section>
    </div>
  );
}
