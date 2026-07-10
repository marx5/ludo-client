import React, { useState } from 'react';
import { ArrowRight, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflineSetup({ playerName, onGoBack, onStartOfflineGame }) {
  const [offlineMode, setOfflineMode] = useState('1vs1'); // '1vs1' | '2vs2'

  const handleStartSetup = () => {
    const playersList = [];
    
    if (offlineMode === '1vs1') {
      playersList.push({ id: 'player-red', name: playerName || 'Bạn', color: 'red', isBot: false });
      playersList.push({ id: 'bot-yellow', name: 'Máy', color: 'yellow', isBot: true });
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
      <h2 className="lobby-title text-2xl font-black text-center mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400">
        Cấu Hình Đấu Với Máy
      </h2>
      <p className="lobby-subtitle text-xs text-gray-400 text-center mb-6">Chọn chế độ chơi để bắt đầu</p>

      <div className="lobby-section text-left">
        {/* Cards Selection */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Card 1: Solo 1vs1 */}
          <div 
            onClick={() => setOfflineMode('1vs1')}
            className={`cursor-pointer flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 select-none ${
              offlineMode === '1vs1' 
                ? 'bg-blue-500/10 border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]' 
                : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10'
            }`}
          >
            <div className={`p-3 rounded-xl mb-3 transition-colors ${offlineMode === '1vs1' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
              <User size={24} />
            </div>
            <h3 className={`font-bold text-base ${offlineMode === '1vs1' ? 'text-blue-300' : 'text-gray-300'}`}>1vs1</h3>
          </div>

          {/* Card 2: Team 2vs2 */}
          <div 
            onClick={() => setOfflineMode('2vs2')}
            className={`cursor-pointer flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 select-none ${
              offlineMode === '2vs2' 
                ? 'bg-purple-500/10 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.15)] scale-[1.02]' 
                : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10'
            }`}
          >
            <div className={`p-3 rounded-xl mb-3 transition-colors ${offlineMode === '2vs2' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400'}`}>
              <Users size={24} />
            </div>
            <h3 className={`font-bold text-base ${offlineMode === '2vs2' ? 'text-purple-300' : 'text-gray-300'}`}>2vs2</h3>
          </div>
        </div>

        {/* Mode Descriptions */}
        <div className="bg-black/30 border border-white/5 p-4 rounded-xl min-h-[76px] flex items-center transition-all duration-300">
          {offlineMode === '1vs1' ? (
            <p className="text-xs text-gray-300 leading-relaxed">
              💡 <strong>1vs1:</strong> Bạn đấu trực tiếp với Máy. Lượt đi diễn ra cực nhanh, dồn dập và kịch tính.
            </p>
          ) : (
            <p className="text-xs text-gray-300 leading-relaxed">
              💡 <strong>2vs2:</strong> Bạn bắt cặp với Máy tạo thành một đội, hợp sức đấu lại hai Máy đối thủ.
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Button 
            variant="outline" 
            onClick={onGoBack}
            className="border-white/10 hover:bg-white/5 text-gray-300 font-medium"
          >
            Quay lại
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-500 border border-blue-500/50 text-white font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300" 
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
