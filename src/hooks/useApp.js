import { useState, useEffect } from 'react';
import useOfflineGame from './useOfflineGame';
import useOnlineGame from './useOnlineGame';
import { getValidPiecesToMove } from '../utils/gameEngine';

export default function useApp() {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('ludo_player_name') || '');
  const [gameMode, setGameMode] = useState(null); // 'offline' | 'online'

  // Quản lý Custom Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    isConfirm: false,
    onConfirm: null,
    onCancel: null
  });

  const showModal = (config) => {
    setModalConfig({
      isOpen: true,
      title: config.title || 'Thông báo',
      message: config.message || '',
      isConfirm: !!config.isConfirm,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (config.onConfirm) config.onConfirm();
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (config.onCancel) config.onCancel();
      }
    });
  };

  // Lưu tên vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('ludo_player_name', playerName);
  }, [playerName]);

  // Khởi tạo các hooks game trực tuyến và ngoại tuyến
  const online = useOnlineGame(playerName, setGameMode, showModal);
  const offline = useOfflineGame(playerName, setGameMode, online.setRoomInfo, showModal);

  const isOnline = gameMode === 'online';
  const activeGame = isOnline ? online : offline;
  
  const gameState = activeGame.gameState;
  const isRolling = activeGame.isRolling;

  // Xử lý thoát game
  const handleQuitGame = () => {
    showModal({
      title: 'Thoát trận đấu',
      message: 'Bạn có chắc muốn thoát trận đấu và quay lại sảnh chính?',
      isConfirm: true,
      onConfirm: () => {
        window.location.reload();
      }
    });
  };

  // Lấy các quân cờ hợp lệ có thể đi của người chơi hiện tại (chỉ dùng cho hiển thị gợi ý)
  const getMovablePieceIds = () => {
    if (!gameState || !gameState.hasRolled || gameState.hasMoved) return [];
    
    if (isOnline) {
      const currentPlayer = gameState.players.find(p => p.id === online.socket?.id);
      if (!currentPlayer || currentPlayer.id !== online.socket?.id) return [];
    } else {
      const currentPlayer = gameState.players[gameState.turnIndex];
      if (currentPlayer.isBot) return [];
    }

    return getValidPiecesToMove(gameState.currentTurnColor, gameState.diceValue, gameState.pieces, gameState.mode).map(p => p.id);
  };

  // Xác định người chơi có quyền đổ xúc xắc ở client hiện tại hay không
  const canClientRollDice = () => {
    if (!gameState || gameState.hasRolled || isRolling || gameState.status !== 'playing') return false;

    if (isOnline) {
      const currentPlayer = gameState.players.find(p => p.color === gameState.currentTurnColor);
      return currentPlayer && currentPlayer.id === online.socket?.id;
    } else {
      const currentPlayer = gameState.players[gameState.turnIndex];
      return currentPlayer && !currentPlayer.isBot;
    }
  };

  // Xác định màu cờ góc nhìn của client hiện tại (để xoay bàn cờ)
  const getMyColor = () => {
    if (!gameState) return 'red';
    if (isOnline) {
      const me = gameState.players.find(p => p.id === online.socket?.id);
      return me ? me.color : gameState.players[0]?.color;
    }
    return gameState.players[0]?.color;
  };

  return {
    playerName,
    setPlayerName,
    gameMode,
    isOnline,
    online,
    offline,
    gameState,
    isRolling,
    getMovablePieceIds,
    canClientRollDice,
    getMyColor,
    handleQuitGame,
    modalConfig,
    showModal
  };
}
