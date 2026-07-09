import React from 'react';
import Lobby from './components/Lobby';
import GamePlay from './components/game/GamePlay';
import Header from './components/layout/Header';
import ErrorModal from './components/game/ErrorModal';
import useApp from './hooks/useApp';

export default function App() {
  const {
    playerName,
    setPlayerName,
    gameMode,
    isOnline,
    online,
    offline,
    gameState,
    isRolling,
    getMovablePieceIds,
    canClientRollDice,
    getMyColor,
    handleQuitGame
  } = useApp();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* 1. HEADER LOGO */}
      <Header 
        gameMode={gameMode} 
        isConnected={isOnline ? online.isConnected : false} 
        gameState={gameState} 
        onQuitGame={handleQuitGame} 
      />

      {/* 2. NỘI DUNG CHÍNH (MAIN SCREEN) */}
      <main className="flex-grow flex items-center justify-center p-4">
        
        {/* A. NẾU CHƯA BẮT ĐẦU GAME -> HIỂN THỊ LOBBY */}
        {!gameState ? (
          <Lobby
            socket={online.socket}
            playerName={playerName}
            setPlayerName={setPlayerName}
            roomInfo={online.roomInfo}
            onStartOfflineGame={offline.handleStartOfflineGame}
            onCreateOnlineRoom={online.handleCreateOnlineRoom}
            onJoinOnlineRoom={online.handleJoinOnlineRoom}
            onSelectColor={online.handleSelectColorOnline}
            onToggleReady={online.handleToggleReadyOnline}
            onStartOnlineGame={online.handleStartOnlineGame}
            onChangeMode={online.handleChangeModeOnline}
            chatMessages={online.chatMessages}
            onSendChatMessage={online.handleSendChatMessage}
          />
        ) : (
          
          /* B. NẾU ĐÃ VÀO TRẬN ĐẤU -> HIỂN THỊ BÀN CỜ & ĐIỀU KHIỂN */
          <GamePlay
            gameState={gameState}
            isOnline={isOnline}
            isRolling={isRolling}
            getMovablePieceIds={getMovablePieceIds}
            canClientRollDice={canClientRollDice}
            getMyColor={getMyColor}
            online={online}
            offline={offline}
          />
        )}
      </main>


      {/* Báo lỗi modal */}
      <ErrorModal 
        errorMessage={isOnline ? online.errorMessage : ''} 
        onClose={() => online.setErrorMessage('')} 
      />

    </div>
  );
}
