import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OnlineJoin({ onGoBack, onJoinOnlineRoom }) {
  const [joinRoomId, setJoinRoomId] = useState('');

  return (
    <div className="lobby-box glass-panel">
      <h2 className="lobby-title text-2xl mb-2">Vào Phòng Chơi</h2>
      <p className="lobby-subtitle">Nhập mã Code phòng từ bạn bè</p>

      <div className="lobby-section">
        <Input 
          type="text" 
          className="text-center text-2xl tracking-widest font-mono font-bold" 
          placeholder="123456" 
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />

        <div className="grid grid-cols-2 gap-4 mt-8">
          <Button 
            variant="outline" 
            className="h-11 border-slate-300 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold"
            onClick={onGoBack}
          >
            Quay lại
          </Button>
          <Button 
            className="h-11 bg-blue-600 hover:bg-blue-500 dark:bg-blue-600/50 dark:hover:bg-blue-600/70 text-white border-blue-500/50 shadow-[0_0_15px_rgba(30,144,255,0.3)] font-bold" 
            onClick={() => onJoinOnlineRoom(joinRoomId)}
            disabled={joinRoomId.length < 6}
          >
            Vào phòng
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
