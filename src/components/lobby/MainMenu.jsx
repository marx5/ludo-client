import React, { useState } from 'react';
import { Sparkles, Plus, Key, HelpCircle, Bot } from 'lucide-react';
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
    <div className="lobby-box glass-panel w-full">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Sparkles className="text-yellow-400" size={28} />
        <h1 className="lobby-title">Ludo Z</h1>
      </div>
      
      <div className="lobby-section">
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-1">Xin chào,</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{playerName || 'Khách'}</p>
        </div>

        <div className="flex flex-col items-center gap-4 mt-6">
          <Button 
            className="w-full h-auto py-6 text-base bg-blue-600 hover:bg-blue-500 dark:bg-blue-600/50 dark:hover:bg-blue-600/70 text-white border-blue-500/50 shadow-[0_0_15px_rgba(30,144,255,0.3)]"
            onClick={onNavigateToOffline}
          >
            <Bot size={20} className="mr-2" />
            Đấu với máy
          </Button>

          <Button 
            className="w-full h-auto py-6 text-base bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-500/40 dark:hover:bg-yellow-500/60 text-yellow-950 dark:text-yellow-100 font-bold border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
            onClick={onCreateOnlineRoom}
          >
            <Plus size={20} className="mr-2" />
            Tạo phòng
          </Button>

          <Button 
            className="w-full h-auto py-6 text-base border-green-500/30 hover:border-green-500/50 bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-300 font-semibold"
            variant="outline"
            size="lg"
            onClick={onNavigateToOnlineJoin}
          >
            <Key size={20} className="mr-2" />
            Vào phòng
          </Button>

          <Button 
            className="w-full h-auto py-6 text-base border-gray-500/30 hover:border-gray-500/50 bg-gray-500/10 hover:bg-gray-500/20 text-slate-700 dark:text-gray-300 font-semibold"
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
