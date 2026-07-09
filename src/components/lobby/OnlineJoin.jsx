import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function OnlineJoin({ onGoBack, onJoinOnlineRoom }) {
  const [joinRoomId, setJoinRoomId] = useState('');

  return (
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
          <button className="glass-button" onClick={onGoBack}>Quay lại</button>
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
  );
}
