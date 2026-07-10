import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { LudoScene } from './scenes/LudoScene';
import { EventBus } from './EventBus';

export default function PhaserGame({ currentRef }) {
  const gameRef = useRef(null);

  useEffect(() => {
    if (!gameRef.current) {
      const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 800,
        parent: 'game-container',
        backgroundColor: '#1a1a2e',
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [BootScene, LudoScene]
      };

      gameRef.current = new Phaser.Game(config);

      if (currentRef) {
        currentRef.current = gameRef.current;
      }
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [currentRef]);

  return <div id="game-container" className="w-full aspect-square max-h-[56dvh] mx-auto flex items-center justify-center"></div>;
}
