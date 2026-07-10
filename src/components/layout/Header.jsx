import React from 'react';
import { Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './Header.css';

export default function Header({ gameMode, isConnected, gameState, onQuitGame }) {
  return (
    <header className="game-header glass-panel rounded-none border-t-0 border-x-0">
      <div className="flex items-center gap-2">
        <Sparkles className="text-yellow-400" size={20} />
        <span className="game-title-logo">Ludo Z</span>
      </div>
      
      <div className="flex items-center gap-4">
        {gameMode === 'online' && (
          <span className={`flex items-center gap-1.5 text-xs py-1 px-3 rounded-full border ${
            isConnected 
              ? 'text-green-400 bg-green-500/10 border-green-500/20' 
              : 'text-red-400 bg-red-500/10 border-red-500/20'
          }`}>
            <span 
              className={`rounded-full ${isConnected ? 'bg-green-500 animate-ping' : 'bg-red-500'}`} 
              style={{ width: '8px', height: '8px' }}
            ></span>
            {isConnected ? 'Máy chủ: Đang kết nối' : 'Máy chủ: Mất kết nối'}
          </span>
        )}
        
        {gameState && (
          <Button 
            variant="destructive"
            size="sm"
            onClick={onQuitGame}
          >
            <LogOut size={12} className="mr-1" />
            Thoát game
          </Button>
        )}
      </div>
    </header>
  );
}
