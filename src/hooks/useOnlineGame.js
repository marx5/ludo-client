import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import {
  playRollSound,
  playMoveSound,
  playHitSound,
  playWinSound
} from '../utils/audioEffects';
import { getValidPiecesToMove } from '../utils/gameEngine';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:4444' : '/';

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
      setRoomInfo({ roomId, creatorId: newSocket.id, players, status: 'waiting', mode: '1vs1' });
      setGameMode('online');
    });

    // 2. Nhận phòng gia nhập thành công
    newSocket.on('room_joined', ({ roomId, players }) => {
      setRoomInfo({ roomId, creatorId: '', players, status: 'waiting', mode: '1vs1' });
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
      initialState.lastLocalUpdate = Date.now();
      setGameState(initialState);
      setRoomInfo(prev => prev ? { ...prev, status: 'playing' } : null);
      setChatMessages([]);
    });

    // 6. Nhận cập nhật trạng thái bàn cờ từ server
    newSocket.on('game_state_updated', (updatedState) => {
      const oldState = gameStateRef.current;
      const isNewRoll = updatedState.hasRolled && (!oldState || !oldState.hasRolled);
      
      // Khắc phục lệch múi giờ (Clock Skew) giữa client và server
      if (oldState) {
        if (updatedState.currentTurnColor !== oldState.currentTurnColor) {
          // Bắt đầu lượt mới -> 20s đổ xúc xắc
          updatedState.timerEndAt = Date.now() + 20000;
        } else if (updatedState.hasRolled && !oldState.hasRolled) {
          // Vừa đổ xúc xắc xong -> 30s đi quân
          updatedState.timerEndAt = Date.now() + 30000;
        } else {
          // Giữ nguyên khoảng thời gian đếm ngược tương đối
          const elapsed = Date.now() - oldState.lastLocalUpdate;
          updatedState.timerEndAt = oldState.timerEndAt - elapsed;
        }
      } else {
        // Lần đầu tiên nhận state, ước lượng theo thời gian còn lại từ server
        // Nếu server truyền timerEndAt, tính khoảng lệch thời gian còn lại
        const serverTimeLeft = updatedState.timerEndAt - Date.now();
        updatedState.timerEndAt = Date.now() + (serverTimeLeft > 0 ? serverTimeLeft : 20000);
      }
      
      updatedState.lastLocalUpdate = Date.now();

      if (isNewRoll) {
        setIsRolling(true);
        playRollSound(); // Phát âm thanh lắc xúc xắc
        setGameState(updatedState); // Cập nhật state ngay lập tức để progress bar reset mượt mà
        setTimeout(() => {
          setIsRolling(false);
        }, 1000);
      } else {
        setGameState(updatedState);
      }
    });

    // 7. Nhận tin nhắn chat online
    newSocket.on('receive_chat', (messageObj) => {
      setChatMessages(prev => [...prev, messageObj]);
    });

    // 7.2. Bị chủ phòng kích
    newSocket.on('kicked_from_room', () => {
      alert('Bạn đã bị chủ phòng kích khỏi phòng chờ!');
      window.location.reload();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 7.1. Tự động gia nhập phòng qua link chia sẻ
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && socket && isConnected && playerName) {
      console.log(`Auto-joining room from link: ${roomParam}`);
      socket.emit('join_room', { roomId: roomParam, playerName });
      
      // Xóa tham số room khỏi URL để tránh auto-join lại khi F5
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [socket, isConnected, playerName]);

  const handleCreateOnlineRoom = () => {
    if (socket) {
      socket.emit('create_room', { playerName: playerName || 'Người chơi 1' });
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

  const handleAddBotOnline = (color = null) => {
    if (socket && roomInfo) {
      socket.emit('add_bot', { roomId: roomInfo.roomId, color });
    }
  };

  const handleRemoveBotOnline = (botId) => {
    if (socket && roomInfo) {
      socket.emit('remove_bot', { roomId: roomInfo.roomId, botId });
    }
  };

  const handleKickPlayerOnline = (playerId) => {
    if (socket && roomInfo) {
      socket.emit('kick_player', { roomId: roomInfo.roomId, playerId });
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
    handleAddBotOnline,
    handleRemoveBotOnline,
    handleKickPlayerOnline,
    handleRollOnlineDice,
    handleMoveOnlinePiece,
    handleSendChatMessage,
    handleQuitGame
  };
}
