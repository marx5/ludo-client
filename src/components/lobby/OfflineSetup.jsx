import React, { useState } from 'react';
import { ArrowRight, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflineSetup({ playerName, onGoBack, onStartOfflineGame }) {
  const [offlineMode, setOfflineMode] = useState('1vs1'); // '1vs1' | '2vs2' | '1vs3'

  const handleStartSetup = () => {
    const playersList = [];
    
    if (offlineMode === '1vs1') {
      playersList.push({ id: 'player-red', name: playerName || 'Bạn', color: 'red', isBot: false });
      playersList.push({ id: 'bot-yellow', name: 'Máy', color: 'yellow', isBot: true });
    } else if (offlineMode === '1vs3') {
      playersList.push({ id: 'player-red', name: playerName || 'Bạn', color: 'red', isBot: false });
      playersList.push({ id: 'bot-green', name: 'Máy (Xanh)', color: 'green', isBot: true });
      playersList.push({ id: 'bot-yellow', name: 'Máy (Vàng)', color: 'yellow', isBot: true });
      playersList.push({ id: 'bot-blue', name: 'Máy (Lam)', color: 'blue', isBot: true });
    } else {
      playersList.push({ id: 'player-red', name: playerName || 'Bạn', color: 'red', isBot: false });
      playersList.push({ id: 'bot-green', name: 'Máy', color: 'green', isBot: true });
      playersList.push({ id: 'bot-yellow', name: 'Máy', color: 'yellow', isBot: true });
      playersList.push({ id: 'bot-blue', name: 'Máy', color: 'blue', isBot: true });
    }

    onStartOfflineGame(playersList, offlineMode);
  };

  return (
    <div className="lobby-box glass-panel max-w-md mx-auto">
      <h2 className="lobby-title text-2xl text-center mb-6">
        Cấu Hình Đấu Với Máy
      </h2>

      <div className="lobby-section text-left">
        {/* Cards Selection */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {/* Card 1: Solo 1vs1 */}
          <div 
            onClick={() => setOfflineMode('1vs1')}
            className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 select-none ${
              offlineMode === '1vs1' 
                ? 'bg-blue-500/10 border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]' 
                : 'bg-slate-100/50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 hover:bg-slate-200/50 hover:border-slate-300 dark:hover:bg-white/[0.03] dark:hover:border-white/10'
            }`}
          >
            <div className={`p-2 rounded-xl mb-2 transition-colors ${offlineMode === '1vs1' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-gray-400'}`}>
              <User size={20} />
            </div>
            <h3 className={`font-bold text-sm ${offlineMode === '1vs1' ? 'text-blue-600 dark:text-blue-300' : 'text-slate-600 dark:text-gray-300'}`}>1vs1</h3>
          </div>

          {/* Card 2: Team 2vs2 */}
          <div 
            onClick={() => setOfflineMode('2vs2')}
            className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 select-none ${
              offlineMode === '2vs2' 
                ? 'bg-purple-500/10 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.15)] scale-[1.02]' 
                : 'bg-slate-100/50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 hover:bg-slate-200/50 hover:border-slate-300 dark:hover:bg-white/[0.03] dark:hover:border-white/10'
            }`}
          >
            <div className={`p-2 rounded-xl mb-2 transition-colors ${offlineMode === '2vs2' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-gray-400'}`}>
              <Users size={20} />
            </div>
            <h3 className={`font-bold text-sm ${offlineMode === '2vs2' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-gray-300'}`}>2vs2</h3>
          </div>

          {/* Card 3: Solo 1vs3 */}
          <div 
            onClick={() => setOfflineMode('1vs3')}
            className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 select-none ${
              offlineMode === '1vs3' 
                ? 'bg-rose-500/10 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.15)] scale-[1.02]' 
                : 'bg-slate-100/50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 hover:bg-slate-200/50 hover:border-slate-300 dark:hover:bg-white/[0.03] dark:hover:border-white/10'
            }`}
          >
            <div className={`p-2 rounded-xl mb-2 transition-colors ${offlineMode === '1vs3' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-gray-400'}`}>
              <Users size={20} />
            </div>
            <h3 className={`font-bold text-sm ${offlineMode === '1vs3' ? 'text-rose-600 dark:text-rose-300' : 'text-slate-600 dark:text-gray-300'}`}>1vs3</h3>
          </div>
        </div>


        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Button 
            variant="outline" 
            onClick={onGoBack}
            className="h-11 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300 font-semibold"
          >
            Quay lại
          </Button>
          <Button 
            className="h-11 bg-blue-600 hover:bg-blue-500 border border-blue-500/50 text-white font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300" 
            onClick={handleStartSetup}
          >
            Bắt đầu
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
