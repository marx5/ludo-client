import React from 'react';
import { Check, X, Users } from 'lucide-react';
import { COLORS } from '../../utils/gameEngine';
import RealtimeChat from '../game/RealtimeChat';

export default function OnlineLobby({
  socket,
  roomInfo,
  onChangeMode,
  onSelectColor,
  onToggleReady,
  onStartOnlineGame,
  chatMessages,
  onSendChatMessage
}) {
  const isCreator = socket && socket.id === roomInfo.creatorId;

  return (
    <div className="lobby-box glass-panel max-w-4xl w-full p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
      
      {/* Cột trái: Thông tin phòng và Chọn màu */}
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã Phòng Chơi</span>
            <h2 className="text-3xl font-black font-mono text-yellow-400 tracking-wider select-all">{roomInfo.roomId}</h2>
          </div>
          <button 
            className="glass-button py-1 px-3 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300" 
            onClick={() => window.location.reload()}
          >
            Rời phòng
          </button>
        </div>

        {/* Chế độ chơi (Chỉ chủ phòng chỉnh) */}
        <div className="mb-6 bg-black/15 p-4 rounded-xl border border-white/5">
          <span className="block text-sm font-semibold text-gray-400 mb-2">Chế độ chơi:</span>
          <div className="grid grid-cols-3 gap-2">
            {['classic', '1vs1', '2vs2'].map(m => {
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
              const isPlayerCreator = roomInfo.creatorId === p.id;
              return (
                <div key={p.id} className={`player-card ${isMe ? 'active' : ''} ${p.color}`}>
                  <div className={`player-avatar ${p.color}`}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="player-info">
                    <div className="player-name">
                      {p.name}
                      {isMe && <span className="player-status-tag bg-blue-500/20 text-blue-300">Bạn</span>}
                      {isPlayerCreator && <span className="player-status-tag bg-yellow-500/20 text-yellow-300">Chủ phòng</span>}
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

          {isCreator && (
            <button 
              className="glass-button bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-bold border-yellow-500/40 flex-grow"
              onClick={() => onStartOnlineGame(true)}
            >
              Bắt Đầu Game
            </button>
          )}
        </div>
      </div>

      {/* Cột phải: Hộp Chatbox Realtime */}
      <div className="flex flex-col border-l border-white/5 pl-0 md:pl-6">
        <RealtimeChat 
          chatMessages={chatMessages}
          onSendMessage={onSendChatMessage}
          title="Trò Chuyện Realtime"
          TitleIcon={Users}
          placeholder="Gửi tin nhắn..."
          emptyText="Chưa có tin nhắn nào. Chat cùng mọi người để chuẩn bị đấu!"
        />
      </div>

    </div>
  );
}
