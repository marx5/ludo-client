import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import {
  playRollSound
} from '../utils/audioEffects';
import { getValidPiecesToMove } from '../utils/gameEngine';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:4444' : '/';

export default function useOnlineGame(playerName, setGameMode, showModal) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const sessionIdRef = useRef(null);
  if (!sessionIdRef.current) {
    let sid = localStorage.getItem('ludo_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('ludo_session_id', sid);
    }
    sessionIdRef.current = sid;
  }
  const sessionId = sessionIdRef.current;

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      query: {
        sessionId,
        playerName: playerName || ''
      }
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
      if (initialState.serverTime) {
        const timeDiff = Date.now() - initialState.serverTime;
        initialState.timerEndAt = initialState.timerEndAt + timeDiff;
      }
      initialState.lastLocalUpdate = Date.now();

      const applyGameStates = () => {
        setGameState(initialState);
        setRoomInfo({
          roomId: initialState.roomId,
          creatorId: initialState.players[0]?.id || '',
          players: initialState.players,
          status: 'playing',
          mode: initialState.mode
        });
        setGameMode('online');
        sessionStorage.setItem('ludo_in_game', 'true');
      };

      const isInGameSession = sessionStorage.getItem('ludo_in_game') === 'true';
      if (isInGameSession) {
        applyGameStates();
      } else {
        showModal({
          title: 'Khôi phục trận đấu',
          message: 'Bạn có một trận đấu đang diễn ra. Bạn có muốn quay lại chơi tiếp không?',
          isConfirm: true,
          onConfirm: () => {
            applyGameStates();
          },
          onCancel: () => {
            newSocket.emit('forfeit_rejoin');
            sessionStorage.removeItem('ludo_in_game');
          }
        });
      }
      setChatMessages([]);
    });

    // 6. Nhận cập nhật trạng thái bàn cờ từ server
    newSocket.on('game_state_updated', (updatedState) => {
      const oldState = gameStateRef.current;
      const isNewRoll = updatedState.hasRolled && (!oldState || !oldState.hasRolled);
      
      // Khắc phục lệch múi giờ (Clock Skew) bằng serverTime
      if (updatedState.serverTime) {
        const timeDiff = Date.now() - updatedState.serverTime;
        updatedState.timerEndAt = updatedState.timerEndAt + timeDiff;
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

      // Nếu trận đấu đã kết thúc, xóa trạng thái lưu sessionStorage
      if (updatedState.status === 'finished') {
        sessionStorage.removeItem('ludo_in_game');
      }
    });

    // 7. Nhận tin nhắn chat online
    newSocket.on('receive_chat', (messageObj) => {
      setChatMessages(prev => [...prev, messageObj]);
    });

    // 7.2. Bị chủ phòng kích
    newSocket.on('kicked_from_room', () => {
      showModal({
        title: 'Bị kích khỏi phòng',
        message: 'Bạn đã bị chủ phòng kích khỏi phòng chờ!',
        onConfirm: () => window.location.reload()
      });
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
    showModal({
      title: 'Thoát trận đấu',
      message: 'Bạn có chắc muốn thoát trận đấu và quay lại sảnh chính?',
      isConfirm: true,
      onConfirm: () => {
        sessionStorage.removeItem('ludo_in_game');
        window.location.reload();
      }
    });
  };

  const handleKickPlayerWithConfirm = (playerId, name, isBot) => {
    showModal({
      title: 'Xác nhận kích',
      message: `Bạn có chắc chắn muốn kích ${isBot ? 'Máy' : name} ra khỏi phòng chơi?`,
      isConfirm: true,
      onConfirm: () => {
        if (isBot) {
          handleRemoveBotOnline(playerId);
        } else {
          handleKickPlayerOnline(playerId);
        }
      }
    });
  };

  const handleLeaveRoomWithConfirm = () => {
    showModal({
      title: 'Rời phòng chờ',
      message: 'Bạn có chắc chắn muốn rời khỏi phòng chờ và quay lại sảnh chính?',
      isConfirm: true,
      onConfirm: () => {
        window.location.reload();
      }
    });
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
    handleQuitGame,
    handleKickPlayerWithConfirm,
    handleLeaveRoomWithConfirm
  };
}
