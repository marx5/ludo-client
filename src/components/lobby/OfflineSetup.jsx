import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function OfflineSetup({ playerName, onGoBack, onStartOfflineGame }) {
  const [offlineMode, setOfflineMode] = useState('classic'); // 'classic' | '1vs1' | '2vs2'
  const [offlinePlayersCount, setOfflinePlayersCount] = useState(2); // 1, 2, 3, 4

  const handleStartSetup = () => {
    const playersList = [];
    
    if (offlineMode === '1vs1') {
      playersList.push({ id: 'player-red', name: playerName || 'Bạn (Đỏ)', color: 'red', isBot: false });
      playersList.push({ id: 'bot-yellow', name: 'Máy (Vàng)', color: 'yellow', isBot: true });
    } else if (offlineMode === '2vs2') {
      playersList.push({ id: 'player-red', name: playerName || 'Bạn (Đỏ)', color: 'red', isBot: false });
      playersList.push({ id: 'bot-green', name: 'Đồng đội Máy (Xanh lá)', color: 'green', isBot: true });
      playersList.push({ id: 'bot-yellow', name: 'Đối thủ Máy (Vàng)', color: 'yellow', isBot: true });
      playersList.push({ id: 'bot-blue', name: 'Đối thủ Máy (Xanh dương)', color: 'blue', isBot: true });
    } else {
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

  return (
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
          <button className="glass-button" onClick={onGoBack}>Quay lại</button>
          <button className="glass-button active" onClick={handleStartSetup}>
            Bắt đầu
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
