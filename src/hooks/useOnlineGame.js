import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import {
  playRollSound,
  playMoveSound,
  playHitSound,
  playWinSound
} from '../utils/audioEffects';
import { getValidPiecesToMove } from '../utils/gameEngine';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/';

// Hàm phát âm thanh khi di chuyển quân cờ dựa trên sự thay đổi trạng thái quân cờ
const playAudioForPiecesTransition = (piecesBefore, piecesAfter) => {
  if (!piecesBefore || !piecesAfter) return;
  // 1. Kiểm tra xem có quân nào về đích không (đạt stepCount 58)
  const win = piecesAfter.some((p, idx) => p.stepCount === 58 && (!piecesBefore[idx] || piecesBefore[idx].stepCount !== 58));
  if (win) {
    playWinSound();
    return;
  }
  // 2. Kiểm tra xem có quân nào bị đá không (quay về position -1)
  const hit = piecesAfter.some((p, idx) => p.position === -1 && (!piecesBefore[idx] || piecesBefore[idx].position !== -1));
  if (hit) {
    playHitSound();
    return;
  }
  // 3. Kiểm tra xem có bất kỳ quân nào di chuyển không
  const moved = piecesAfter.some((p, idx) => !piecesBefore[idx] || p.position !== piecesBefore[idx].position || p.stepCount !== piecesBefore[idx].stepCount);
  if (moved) {
    playMoveSound();
  }
};

export default function useOnlineGame(playerName, setGameMode) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket server');
    });

    // 1. Nhận phòng được tạo
    newSocket.on('room_created', ({ roomId, players }) => {
      setRoomInfo({ roomId, creatorId: newSocket.id, players, status: 'waiting', mode: 'classic' });
      setGameMode('online');
    });

    // 2. Nhận phòng gia nhập thành công
    newSocket.on('room_joined', ({ roomId, players }) => {
      setRoomInfo({ roomId, creatorId: '', players, status: 'waiting', mode: 'classic' });
      setGameMode('online');
    });

    // 3. Cập nhật phòng chờ
    newSocket.on('room_updated', (updatedRoom) => {
      setRoomInfo(updatedRoom);
    });

    // 4. Lỗi từ server
    newSocket.on('error_message', ({ message }) => {
      setErrorMessage(message);
    });

    // 5. Game online bắt đầu
    newSocket.on('game_started', (initialState) => {
      setGameState(initialState);
      setRoomInfo(prev => prev ? { ...prev, status: 'playing' } : null);
      setChatMessages([]);
    });

    // 6. Nhận cập nhật trạng thái bàn cờ từ server
    newSocket.on('game_state_updated', (updatedState) => {
      // Chạy animation xúc xắc nếu xúc xắc vừa được đổ
      const oldState = gameStateRef.current;
      const isNewRoll = updatedState.hasRolled && (!oldState || !oldState.hasRolled);
      
      if (isNewRoll) {
        setIsRolling(true);
        playRollSound(); // Phát âm thanh lắc xúc xắc
        setTimeout(() => {
          setIsRolling(false);
          setGameState(updatedState);
        }, 1000);
      } else {
        // Đồng bộ âm thanh di chuyển, đá quân, về chuồng cho Online
        if (oldState && oldState.pieces && updatedState.pieces) {
          playAudioForPiecesTransition(oldState.pieces, updatedState.pieces);
        }
        setGameState(updatedState);
      }
    });

    // 7. Nhận tin nhắn chat online
    newSocket.on('receive_chat', (messageObj) => {
      setChatMessages(prev => [...prev, messageObj]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateOnlineRoom = () => {
    if (socket) {
      socket.emit('create_room', { playerName: playerName || 'Chủ phòng' });
    }
  };

  const handleJoinOnlineRoom = (roomId) => {
    if (socket && roomId.length === 6) {
      socket.emit('join_room', { roomId, playerName: playerName || 'Bạn chơi' });
    }
  };

  const handleSelectColorOnline = (color) => {
    if (socket && roomInfo) {
      socket.emit('select_color', { roomId: roomInfo.roomId, color });
    }
  };

  const handleToggleReadyOnline = () => {
    if (socket && roomInfo) {
      socket.emit('toggle_ready', { roomId: roomInfo.roomId });
    }
  };

  const handleChangeModeOnline = (mode) => {
    if (socket && roomInfo) {
      socket.emit('change_mode', { roomId: roomInfo.roomId, mode });
    }
  };

  const handleStartOnlineGame = (includeBots = true) => {
    if (socket && roomInfo) {
      socket.emit('start_game', { roomId: roomInfo.roomId, includeBots });
    }
  };

  const handleRollOnlineDice = () => {
    if (socket && roomInfo) {
      socket.emit('roll_dice', { roomId: roomInfo.roomId });
    }
  };

  const handleMoveOnlinePiece = (color, pieceId) => {
    if (socket && roomInfo) {
      socket.emit('move_piece', { roomId: roomInfo.roomId, pieceId });
    }
  };

  const handleSendChatMessage = (message) => {
    if (socket && roomInfo) {
      socket.emit('send_chat', { roomId: roomInfo.roomId, message });
    }
  };

  const handleQuitGame = () => {
    if (window.confirm('Bạn có chắc muốn thoát trận đấu và quay lại sảnh chính?')) {
      window.location.reload();
    }
  };

  // 8. Tự động đi cờ trực tuyến khi chỉ có một nước đi hợp lý/độc nhất
  useEffect(() => {
    if (!gameState || !gameState.hasRolled || gameState.hasMoved || gameState.status !== 'playing' || !socket) return;

    const currentTurnColor = gameState.currentTurnColor;
    const currentPlayer = gameState.players.find(p => p.color === currentTurnColor);
    if (!currentPlayer || currentPlayer.id !== socket.id) return;

    const validPieces = getValidPiecesToMove(currentTurnColor, gameState.diceValue, gameState.pieces);
    if (validPieces.length === 0) return;

    const firstPiece = validPieces[0];
    const allSamePosition = validPieces.every(
      p => p.position === firstPiece.position && p.stepCount === firstPiece.stepCount
    );

    const isPieceInYard = firstPiece.position === -1;

    if (allSamePosition && !isPieceInYard) {
      const timer = setTimeout(() => {
        const activeState = gameStateRef.current;
        if (!activeState || !activeState.hasRolled || activeState.hasMoved || activeState.status !== 'playing') return;
        handleMoveOnlinePiece(currentTurnColor, firstPiece.id);
      }, 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, socket]);

  return {
    socket,
    isConnected,
    roomInfo,
    setRoomInfo,
    chatMessages,
    gameState,
    isRolling,
    errorMessage,
    setErrorMessage,
    handleCreateOnlineRoom,
    handleJoinOnlineRoom,
    handleSelectColorOnline,
    handleToggleReadyOnline,
    handleChangeModeOnline,
    handleStartOnlineGame,
    handleRollOnlineDice,
    handleMoveOnlinePiece,
    handleSendChatMessage,
    handleQuitGame
  };
}
