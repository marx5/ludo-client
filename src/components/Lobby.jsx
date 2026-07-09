import React, { useState } from 'react';
import MainMenu from './lobby/MainMenu';
import OfflineSetup from './lobby/OfflineSetup';
import OnlineJoin from './lobby/OnlineJoin';
import OnlineLobby from './lobby/OnlineLobby';
import './Lobby.css';

export default function Lobby({
  socket,
  playerName,
  setPlayerName,
  roomInfo,
  onStartOfflineGame,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onSelectColor,
  onToggleReady,
  onStartOnlineGame,
  onChangeMode,
  chatMessages,
  onSendChatMessage
}) {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'offline_setup' | 'online_join'

  const handleGoBack = () => {
    setActiveTab('menu');
  };

  return (
    <div className="lobby-container">
      {roomInfo ? (
        <OnlineLobby
          socket={socket}
          roomInfo={roomInfo}
          onChangeMode={onChangeMode}
          onSelectColor={onSelectColor}
          onToggleReady={onToggleReady}
          onStartOnlineGame={onStartOnlineGame}
          chatMessages={chatMessages}
          onSendChatMessage={onSendChatMessage}
        />
      ) : (
        <>
          {activeTab === 'menu' && (
            <MainMenu
              playerName={playerName}
              setPlayerName={setPlayerName}
              onNavigateToOffline={() => setActiveTab('offline_setup')}
              onCreateOnlineRoom={onCreateOnlineRoom}
              onNavigateToOnlineJoin={() => setActiveTab('online_join')}
            />
          )}

          {activeTab === 'offline_setup' && (
            <OfflineSetup
              playerName={playerName}
              onGoBack={handleGoBack}
              onStartOfflineGame={onStartOfflineGame}
            />
          )}

          {activeTab === 'online_join' && (
            <OnlineJoin
              onGoBack={handleGoBack}
              onJoinOnlineRoom={onJoinOnlineRoom}
            />
          )}
        </>
      )}
    </div>
  );
}
