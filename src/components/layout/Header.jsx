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
        {gameState && (
          <Button 
            variant="destructive"
            size="sm"
            onClick={onQuitGame}
            className="bg-red-600 hover:bg-red-500 text-white dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60 dark:border-red-900/50 font-bold"
          >
            <LogOut size={12} className="mr-1" />
            Thoát game
          </Button>
        )}
      </div>
    </header>
  );
}
