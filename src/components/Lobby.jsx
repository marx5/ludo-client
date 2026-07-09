import React, { useState } from 'react';
import { Play, Users, Globe, Plus, Key, ArrowRight, Bot, Sparkles, Send, Check, X } from 'lucide-react';
import { COLORS } from '../utils/gameEngine';

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
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'offline_setup' | 'online_join' | 'online_lobby'
  const [offlineMode, setOfflineMode] = useState('classic'); // 'classic' | '1vs1' | '2vs2'
  const [offlinePlayersCount, setOfflinePlayersCount] = useState(2); // 2, 3, 4
  const [offlineBotsCount, setOfflineBotsCount] = useState(2); // Số bot điền vào cho đủ 4
  
  const [joinRoomId, setJoinRoomId] = useState('');
  const [chatInput, setChatInput] = useState('');

  // Xử lý nộp form chat
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendChatMessage(chatInput);
      setChatInput('');
    }
  };

  // Setup game Offline và bắt đầu chơi
  const handleStartOfflineSetup = () => {
    // Tạo cấu trúc danh sách người chơi offline
    const playersList = [];
    
    // Thêm người chơi thực tế
    if (offlineMode === '1vs1') {
      playersList.push({ id: 'player-red', name: playerName || 'Bạn (Đỏ)', color: 'red', isBot: false });
      playersList.push({ id: 'bot-yellow', name: 'Máy (Vàng)', color: 'yellow', isBot: true });
    } else if (offlineMode === '2vs2') {
      // Đội Red-Yellow vs Green-Blue
      playersList.push({ id: 'player-red', name: playerName || 'Bạn (Đỏ)', color: 'red', isBot: false });
      playersList.push({ id: 'bot-green', name: 'Đồng đội Máy (Xanh lá)', color: 'green', isBot: true });
      playersList.push({ id: 'bot-yellow', name: 'Đối thủ Máy (Vàng)', color: 'yellow', isBot: true });
      playersList.push({ id: 'bot-blue', name: 'Đối thủ Máy (Xanh dương)', color: 'blue', isBot: true });
    } else {
      // Chế độ classic: Căn cứ vào offlinePlayersCount để thêm người chơi local
      const colors = ['red', 'green', 'yellow', 'blue'];
      
      // Thêm người chơi thật
      for (let i = 0; i < offlinePlayersCount; i++) {
        playersList.push({
          id: `player-${colors[i]}`,
          name: i === 0 ? (playerName || 'Bạn (Đỏ)') : `Người chơi ${i + 1} (${colors[i].toUpperCase()})`,
          color: colors[i],
          isBot: false
        });
      }
      
      // Thêm Bot điền đầy cho đủ 4 vị trí
      for (let i = offlinePlayersCount; i < 4; i++) {
        playersList.push({
          id: `bot-${colors[i]}`,
          name: `Máy (${colors[i].toUpperCase()})`,
          color: colors[i],
          isBot: true
        });
      }
    }

    onStartOfflineGame(playersList, offlineMode);
  };

  // Trở lại menu chính
  const handleGoBack = () => {
    setActiveTab('menu');
  };

  return (
    <div className="lobby-container">
      {/* 1. MÀN HÌNH MENU CHÍNH */}
      {activeTab === 'menu' && (
        <div className="lobby-box glass-panel">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="text-yellow-400" size={28} />
            <h1 className="lobby-title">LUDO WORLD</h1>
          </div>
          <p className="lobby-subtitle">Cờ Cá Ngựa Trực Tuyến & Ngoại Tuyến Cao Cấp</p>
          
          <div className="lobby-section">
            <label className="text-left text-sm font-semibold text-gray-400 block mb-1">Tên của bạn:</label>
            <input 
              type="text" 
              className="glass-input text-center text-lg font-bold" 
              placeholder="Nhập tên..." 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={15}
            />

            <div className="grid grid-cols-1 gap-4 mt-6">
              <button 
                className="glass-button active py-4 text-lg" 
                onClick={() => setActiveTab('offline_setup')}
              >
                <Bot size={22} />
                Chơi Ngoại Tuyến (Offline)
              </button>

              <button 
                className="glass-button py-4 text-lg border-blue-500/30 hover:border-blue-500/50" 
                onClick={() => onCreateOnlineRoom()}
              >
                <Plus size={22} />
                Tạo Phòng Chơi Online
              </button>

              <button 
                className="glass-button py-4 text-lg border-green-500/30 hover:border-green-500/50" 
                onClick={() => setActiveTab('online_join')}
              >
                <Key size={22} />
                Vào Phòng Qua Mã Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. THIẾT LẬP CHƠI OFFLINE (vs Bot & Local) */}
      {activeTab === 'offline_setup' && (
        <div className="lobby-box glass-panel">
          <h2 className="lobby-title text-2xl mb-2">Cấu Hình Offline</h2>
          <p className="lobby-subtitle">Chọn chế độ chơi và số lượng người chơi</p>

          <div className="lobby-section text-left">
            {/* Chế độ chơi */}
            <div className="mb-4">
              <span className="block text-sm font-semibold text-gray-400 mb-2">Chế độ chơi:</span>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  className={`glass-button text-sm py-2 px-3 ${offlineMode === 'classic' ? 'active' : ''}`}
                  onClick={() => setOfflineMode('classic')}
                >
                  Cổ điển (4P)
                </button>
                <button 
                  className={`glass-button text-sm py-2 px-3 ${offlineMode === '1vs1' ? 'active' : ''}`}
                  onClick={() => setOfflineMode('1vs1')}
                >
                  Solo 1vs1
                </button>
                <button 
                  className={`glass-button text-sm py-2 px-3 ${offlineMode === '2vs2' ? 'active' : ''}`}
                  onClick={() => setOfflineMode('2vs2')}
                >
                  Đồng Đội 2vs2
                </button>
              </div>
            </div>

            {/* Số người chơi thật (chỉ hiển thị ở chế độ classic) */}
            {offlineMode === 'classic' && (
              <div className="mb-4">
                <span className="block text-sm font-semibold text-gray-400 mb-2">Số người chơi thật (Local Multiplayer):</span>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4].map(num => (
                    <button 
                      key={num}
                      className={`glass-button text-sm py-2 ${offlinePlayersCount === num ? 'active' : ''}`}
                      onClick={() => setOfflinePlayersCount(num)}
                    >
                      {num} người chơi
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Các vị trí còn lại sẽ tự động điền Bot AI cho đủ 4 người chơi.
                </p>
              </div>
            )}

            {offlineMode === '1vs1' && (
              <p className="text-sm text-gray-400 bg-black/20 p-3 rounded-lg">
                <strong>Solo 1vs1:</strong> Bạn (màu Đỏ) đấu trực tiếp với máy (màu Vàng). Lượt đi diễn ra nhanh và gay cấn hơn.
              </p>
            )}

            {offlineMode === '2vs2' && (
              <p className="text-sm text-gray-400 bg-black/20 p-3 rounded-lg">
                <strong>Đồng Đội 2vs2:</strong> Bạn (Đỏ) và Đồng đội máy (Xanh lá) đấu với đội máy (Vàng và Xanh dương).
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button className="glass-button" onClick={handleGoBack}>Quay lại</button>
              <button className="glass-button active" onClick={handleStartOfflineSetup}>
                Bắt đầu
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. NHẬP MÃ JOIN PHÒNG ONLINE */}
      {activeTab === 'online_join' && (
        <div className="lobby-box glass-panel">
          <h2 className="lobby-title text-2xl mb-2">Vào Phòng Chơi</h2>
          <p className="lobby-subtitle">Nhập mã Code phòng từ bạn bè</p>

          <div className="lobby-section">
            <input 
              type="text" 
              className="glass-input text-center text-2xl tracking-widest font-mono font-bold" 
              placeholder="123456" 
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button className="glass-button" onClick={handleGoBack}>Quay lại</button>
              <button 
                className="glass-button active" 
                onClick={() => onJoinOnlineRoom(joinRoomId)}
                disabled={joinRoomId.length < 6}
              >
                Vào phòng
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SẢNH PHÒNG CHỜ ONLINE (ONLINE ROOM LOBBY) */}
      {roomInfo && (
        <div className="lobby-box glass-panel max-w-4xl w-full p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          
          {/* Cột trái: Thông tin phòng và Chọn màu */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã Phòng Chơi</span>
                <h2 className="text-3xl font-black font-mono text-yellow-400 tracking-wider select-all">{roomInfo.roomId}</h2>
              </div>
              <button className="glass-button py-1 px-3 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300" onClick={() => window.location.reload()}>
                Rời phòng
              </button>
            </div>

            {/* Chế độ chơi (Chỉ chủ phòng chỉnh) */}
            <div className="mb-6 bg-black/15 p-4 rounded-xl border border-white/5">
              <span className="block text-sm font-semibold text-gray-400 mb-2">Chế độ chơi:</span>
              <div className="grid grid-cols-3 gap-2">
                {['classic', '1vs1', '2vs2'].map(m => {
                  const isCreator = socket && socket.id === roomInfo.creatorId;
                  const label = m === 'classic' ? 'Cổ điển' : m === '1vs1' ? '1 vs 1' : 'Đồng Đội';
                  return (
                    <button
                      key={m}
                      className={`glass-button text-xs py-2 px-1 ${roomInfo.mode === m ? 'active' : ''}`}
                      onClick={() => isCreator && onChangeMode(m)}
                      disabled={!isCreator}
                      style={{ cursor: isCreator ? 'pointer' : 'default' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Danh sách người chơi và Ready State */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Thành viên trong phòng:</h3>
              <div className="flex flex-col gap-2">
                {roomInfo.players.map(p => {
                  const isMe = socket && socket.id === p.id;
                  const isCreator = roomInfo.creatorId === p.id;
                  return (
                    <div key={p.id} className={`player-card ${isMe ? 'active' : ''} ${p.color}`}>
                      <div className={`player-avatar ${p.color}`}>
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="player-info">
                        <div className="player-name">
                          {p.name}
                          {isMe && <span className="player-status-tag bg-blue-500/20 text-blue-300">Bạn</span>}
                          {isCreator && <span className="player-status-tag bg-yellow-500/20 text-yellow-300">Chủ phòng</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Màu quân: {p.color.toUpperCase()}</div>
                      </div>
                      <div>
                        {p.isReady ? (
                          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 py-1 px-3 rounded-full border border-green-500/20">
                            <Check size={12} />
                            Sẵn sàng
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-500 bg-white/5 py-1 px-3 rounded-full border border-white/5">
                            <X size={12} />
                            Chờ...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chọn màu cờ */}
            <div className="mb-6">
              <span className="block text-sm font-semibold text-gray-400 mb-2">Đổi màu quân cờ của bạn:</span>
              <div className="color-picker-grid">
                {COLORS.map(color => {
                  const playerWithColor = roomInfo.players.find(p => p.color === color);
                  const isTaken = !!playerWithColor;
                  const isMyColor = playerWithColor && socket && playerWithColor.id === socket.id;
                  return (
                    <div
                      key={color}
                      className={`color-choice ${color} ${isMyColor ? 'selected' : ''} ${isTaken && !isMyColor ? 'taken' : ''}`}
                      onClick={() => !isTaken && onSelectColor(color)}
                      title={isTaken ? `Đã chọn bởi ${playerWithColor.name}` : `Chọn màu ${color}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Nút Action */}
            <div className="mt-8 flex gap-4">
              <button 
                className={`glass-button flex-grow py-3 text-md ${roomInfo.players.find(p => socket && p.id === socket.id)?.isReady ? 'bg-green-600/30 text-green-300 hover:bg-green-600/50' : 'active'}`}
                onClick={onToggleReady}
              >
                {roomInfo.players.find(p => socket && p.id === socket.id)?.isReady ? 'Hủy Sẵn Sàng' : 'Sẵn Sàng'}
              </button>

              {socket && socket.id === roomInfo.creatorId && (
                <button 
                  className="glass-button bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-bold border-yellow-500/40 flex-grow"
                  onClick={() => onStartOnlineGame(true)} // Tự động thêm bot nếu thiếu người
                >
                  Bắt Đầu Game
                </button>
              )}
            </div>
          </div>

          {/* Cột phải: Hộp Chatbox Realtime */}
          <div className="flex flex-col border-l border-white/5 pl-0 md:pl-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Users size={16} />
              Trò Chuyện Realtime
            </h3>

            <div className="chat-panel glass-panel flex-grow flex flex-col h-[350px]">
              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 my-auto">Chưa có tin nhắn nào. Chat cùng mọi người để chuẩn bị đấu!</div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className="chat-message">
                      <span className={`chat-message-sender ${msg.senderColor}`}>
                        {msg.senderName}:
                      </span>
                      <span className="text-gray-300">{msg.message}</span>
                      <span className="text-[10px] text-gray-500 float-right mt-1">{msg.time.split(' ')[0]}</span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="chat-input-container">
                <input 
                  type="text" 
                  className="glass-input py-2 text-sm flex-grow" 
                  placeholder="Gửi tin nhắn..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  maxLength={50}
                />
                <button type="submit" className="glass-button p-2" disabled={!chatInput.trim()}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
