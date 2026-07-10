import React, { useState } from 'react';
import { Sparkles, Plus, Key, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameRulesModal from './GameRulesModal';

export default function MainMenu({
  playerName,
  setPlayerName,
  onNavigateToOffline,
  onCreateOnlineRoom,
  onNavigateToOnlineJoin
}) {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="lobby-box glass-panel w-full sm:min-w-[400px]">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Sparkles className="text-yellow-400" size={28} />
        <h1 className="lobby-title">Ludo Z</h1>
      </div>
      
      <div className="lobby-section">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-400 mb-1">Xin chào,</p>
          <p className="text-2xl font-bold text-white">{playerName || 'Khách'}</p>
        </div>

        <div className="flex flex-col items-center gap-4 mt-6">
          <Button 
            className="w-full sm:w-64 py-6 text-base bg-blue-600/50 hover:bg-blue-600/70 border-blue-500/50 shadow-[0_0_15px_rgba(30,144,255,0.3)]"
            onClick={onNavigateToOffline}
          >
            Đấu với máy
          </Button>

          <Button 
            className="w-full sm:w-64 py-6 text-base bg-yellow-500/40 hover:bg-yellow-500/60 text-yellow-100 font-bold border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
            onClick={onCreateOnlineRoom}
          >
            <Plus size={20} className="mr-2" />
            Tạo phòng
          </Button>

          <Button 
            className="w-full sm:w-64 py-6 text-base border-green-500/30 hover:border-green-500/50 bg-green-500/10 hover:bg-green-500/20 text-green-300"
            variant="outline"
            size="lg"
            onClick={onNavigateToOnlineJoin}
          >
            <Key size={20} className="mr-2" />
            Vào phòng
          </Button>

          <Button 
            className="w-full sm:w-64 py-6 text-base border-gray-500/30 hover:border-gray-500/50 bg-gray-500/10 hover:bg-gray-500/20 text-gray-300"
            variant="outline"
            size="lg"
            onClick={() => setShowRules(true)}
          >
            <HelpCircle size={20} className="mr-2" />
            Luật chơi
          </Button>
        </div>
      </div>

      {showRules && <GameRulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
