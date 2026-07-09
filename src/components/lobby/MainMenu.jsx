import React from 'react';
import { Sparkles, Bot, Plus, Key } from 'lucide-react';

export default function MainMenu({
  playerName,
  setPlayerName,
  onNavigateToOffline,
  onCreateOnlineRoom,
  onNavigateToOnlineJoin
}) {
  return (
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
            onClick={onNavigateToOffline}
          >
            <Bot size={22} />
            Chơi Ngoại Tuyến (Offline)
          </button>

          <button 
            className="glass-button py-4 text-lg border-blue-500/30 hover:border-blue-500/50" 
            onClick={onCreateOnlineRoom}
          >
            <Plus size={22} />
            Tạo Phòng Chơi Online
          </button>

          <button 
            className="glass-button py-4 text-lg border-green-500/30 hover:border-green-500/50" 
            onClick={onNavigateToOnlineJoin}
          >
            <Key size={22} />
            Vào Phòng Qua Mã Code
          </button>
        </div>
      </div>
    </div>
  );
}
