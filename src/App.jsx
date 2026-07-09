import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Lobby from './components/Lobby';
import Board from './components/Board';
import Dice3D from './components/Dice3D';
import { Sparkles, Trophy, LogOut, MessageSquare, Shield, Clock } from 'lucide-react';
import {
  initializeGameState,
  movePieceInState,
  switchToNextTurn,
  makeBotDecision,
  getValidPiecesToMove,
  rollDiceValue
} from './utils/gameEngine';
import { playRollSound, playMoveSound, playHitSound, playWinSound } from './utils/audioEffects';

// Kết nối tới server Express (Chỉ dùng cho chế độ chơi Online)
const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('ludo_player_name') || '');
  
  // Trạng thái phòng chơi online
  const [roomInfo, setRoomInfo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  
  // Game State trung tâm (cho cả Online và Offline)
  const [gameState, setGameState] = useState(null);
  const [gameMode, setGameMode] = useState(null); // 'offline' | 'online'
  
  // Giao diện và các hiệu ứng
  const [isRolling, setIsRolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [onlineChatInput, setOnlineChatInput] = useState('');

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
  
  // Ref lưu socket để sử dụng trong các hàm callback offline/online
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Lưu tên vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('ludo_player_name', playerName);
  }, [playerName]);

  // ----------------------------------------------------
  // I. THIẾT LẬP KẾT NỐI SOCKET.IO KHI MỞ APP
  // ----------------------------------------------------
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
  }, []);

  // ----------------------------------------------------
  // II. XỬ LÝ GAMEPLAY OFFLINE (Local vs Bot / Local Multiplayer)
  // ----------------------------------------------------

  // 1. Khởi chạy game Offline
  const handleStartOfflineGame = (playersList, mode) => {
    const initialState = initializeGameState(playersList, mode);
    setGameState(initialState);
    setGameMode('offline');
    setRoomInfo(null);
  };

  // 2. Đổ xúc xắc Offline
  const handleRollOfflineDice = () => {
    if (!gameState || gameState.hasRolled || isRolling) return;

    setIsRolling(true);
    playRollSound(); // Phát âm thanh lắc xúc xắc Offline
    
    // Giả lập thời gian lắc xúc xắc 1.0 giây
    setTimeout(() => {
      setIsRolling(false);
      
      const diceVal = rollDiceValue();
      const nextState = { ...gameStateRef.current };
      
      nextState.diceValue = diceVal;
      nextState.hasRolled = true;
      nextState.lastActionTime = Date.now();

      const currentPlayer = nextState.players[nextState.turnIndex];

      nextState.history.unshift({
        time: new Date().toLocaleTimeString(),
        message: `${currentPlayer.name} (${nextState.currentTurnColor}) đã đổ được ${diceVal} điểm.`
      });

      // Kiểm tra xem có quân nào di chuyển được không
      const validPieces = getValidPiecesToMove(nextState.currentTurnColor, diceVal, nextState.pieces);
      
      if (validPieces.length === 0) {
        // Không đi được quân nào -> Tự động chuyển lượt sau 1.5 giây
        nextState.history.unshift({
          time: new Date().toLocaleTimeString(),
          message: `${currentPlayer.name} không có nước đi hợp lệ.`
        });
        setGameState(nextState);

        setTimeout(() => {
          const stateAfterSkip = switchToNextTurn(gameStateRef.current);
          setGameState(stateAfterSkip);
          
          // Kích hoạt lượt của Bot tiếp theo (nếu có)
          triggerOfflineBotTurn(stateAfterSkip);
        }, 1500);
      } else {
        // Có nước đi hợp lệ -> Chờ người chơi chọn quân cờ
        setGameState(nextState);
      }
    }, 1000);
  };

  // 3. Di chuyển quân cờ Offline
  const handleMoveOfflinePiece = (color, pieceId) => {
    const state = gameStateRef.current;
    if (!state || state.currentTurnColor !== color || !state.hasRolled || state.hasMoved) return;

    const afterMoveState = movePieceInState(state, color, pieceId, state.diceValue);
    
    if (afterMoveState === state) return; // Nước đi không hợp lệ

    // Phát âm thanh di chuyển cờ (Offline)
    playAudioForPiecesTransition(state.pieces, afterMoveState.pieces);

    let finalState = afterMoveState;
    if (afterMoveState.status === 'playing') {
      finalState = switchToNextTurn(afterMoveState);
    }

    setGameState(finalState);

    // Kích hoạt Bot đi tiếp theo
    if (finalState.status === 'playing') {
      triggerOfflineBotTurn(finalState);
    }
  };

  // 4. Kích hoạt lượt Bot Offline (Đệ quy)
  const triggerOfflineBotTurn = (state) => {
    if (state.status !== 'playing') return;

    const currentTurnColor = state.currentTurnColor;
    const currentPlayer = state.players[state.turnIndex];

    if (!currentPlayer || !currentPlayer.isBot) return; // Không phải lượt Bot

    // Bước 1: Bot "suy nghĩ" rồi đổ xúc xắc
    setTimeout(() => {
      const activeState = gameStateRef.current;
      if (!activeState || activeState.status !== 'playing' || activeState.currentTurnColor !== currentTurnColor) return;

      setIsRolling(true);
      playRollSound(); // Phát âm thanh lắc xúc xắc Bot Offline

      setTimeout(() => {
        setIsRolling(false);
        const rolledState = { ...gameStateRef.current };
        const diceVal = rollDiceValue();
        
        rolledState.diceValue = diceVal;
        rolledState.hasRolled = true;
        rolledState.history.unshift({
          time: new Date().toLocaleTimeString(),
          message: `Bot ${currentPlayer.name} (${currentTurnColor}) đã đổ được ${diceVal} điểm.`
        });

        setGameState(rolledState);

        // Bước 2: Bot "suy nghĩ" rồi di chuyển quân cờ
        setTimeout(() => {
          const stateBeforeMove = gameStateRef.current;
          if (!stateBeforeMove || stateBeforeMove.status !== 'playing') return;

          const validPieces = getValidPiecesToMove(currentTurnColor, diceVal, stateBeforeMove.pieces);

          if (validPieces.length === 0) {
            stateBeforeMove.history.unshift({
              time: new Date().toLocaleTimeString(),
              message: `Bot ${currentPlayer.name} không có nước đi hợp lệ.`
            });
            const stateAfterSkip = switchToNextTurn(stateBeforeMove);
            setGameState(stateAfterSkip);
            
            // Tiếp tục đệ quy nếu lượt kế tiếp vẫn là Bot
            triggerOfflineBotTurn(stateAfterSkip);
            return;
          }

          // Chọn quân tốt nhất bằng AI
          const chosenPieceId = makeBotDecision(currentTurnColor, diceVal, stateBeforeMove.pieces, stateBeforeMove.mode);
          
          if (chosenPieceId !== null) {
            const afterMoveState = movePieceInState(stateBeforeMove, currentTurnColor, chosenPieceId, diceVal);
            
            // Phát âm thanh di chuyển cho Bot Offline
            playAudioForPiecesTransition(stateBeforeMove.pieces, afterMoveState.pieces);
            
            let finalState = afterMoveState;
            
            if (afterMoveState.status === 'playing') {
              finalState = switchToNextTurn(afterMoveState);
            }

            setGameState(finalState);

            // Tiếp tục đệ quy nếu lượt kế tiếp vẫn là Bot
            triggerOfflineBotTurn(finalState);
          }
        }, 1500);

      }, 1000); // Animation lắc xúc xắc của bot 1 giây

    }, 1200); // Chờ 1.2s trước khi bot đổ xúc xắc
  };

  // ----------------------------------------------------
  // III. XỬ LÝ GAMEPLAY ONLINE (Gửi sự kiện qua Socket)
  // ----------------------------------------------------

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

  // Lấy các quân cờ hợp lệ có thể đi của người chơi hiện tại (chỉ dùng cho hiển thị gợi ý)
  const getMovablePieceIds = () => {
    if (!gameState || !gameState.hasRolled || gameState.hasMoved) return [];
    
    // Nếu chơi online, kiểm tra xem socket có đúng là lượt cờ màu hiện tại không
    if (gameMode === 'online') {
      const currentPlayer = gameState.players.find(p => p.color === gameState.currentTurnColor);
      if (!currentPlayer || currentPlayer.id !== socket?.id) return [];
    } else {
      // Nếu chơi offline, kiểm tra xem lượt hiện tại có phải là Bot không (nếu là bot thì người chơi không bấm được)
      const currentPlayer = gameState.players[gameState.turnIndex];
      if (currentPlayer.isBot) return [];
    }

    return getValidPiecesToMove(gameState.currentTurnColor, gameState.diceValue, gameState.pieces).map(p => p.id);
  };

  // Xác định người chơi có quyền đổ xúc xắc ở client hiện tại hay không
  const canClientRollDice = () => {
    if (!gameState || gameState.hasRolled || isRolling || gameState.status !== 'playing') return false;

    if (gameMode === 'online') {
      const currentPlayer = gameState.players.find(p => p.color === gameState.currentTurnColor);
      return currentPlayer && currentPlayer.id === socket?.id;
    } else {
      const currentPlayer = gameState.players[gameState.turnIndex];
      return currentPlayer && !currentPlayer.isBot;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* 1. HEADER LOGO */}
      <header className="game-header glass-panel rounded-none border-t-0 border-x-0">
        <div className="flex items-center gap-2">
          <Sparkles className="text-yellow-400" size={20} />
          <span className="game-title-logo">Ludo World</span>
          <span className="text-[10px] bg-white/10 text-gray-400 py-1 px-2 rounded font-mono uppercase tracking-wider">v1.2 Premium</span>
        </div>
        
        <div className="flex items-center gap-4">
          {gameMode === 'online' && (
            <span className={`flex items-center gap-1.5 text-xs py-1 px-3 rounded-full border ${isConnected ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
              <span className={`w-2 height-2 rounded-full ${isConnected ? 'bg-green-500 animate-ping' : 'bg-red-500'}`} style={{ width: '8px', height: '8px' }}></span>
              {isConnected ? 'Máy chủ: Đang kết nối' : 'Máy chủ: Mất kết nối'}
            </span>
          )}
          
          {gameState && (
            <button className="glass-button py-1.5 px-3 text-xs bg-red-500/10 hover:bg-red-500/25 border-red-500/20 text-red-300" onClick={handleQuitGame}>
              <LogOut size={12} />
              Thoát game
            </button>
          )}
        </div>
      </header>

      {/* 2. NỘI DUNG CHÍNH (MAIN SCREEN) */}
      <main className="flex-grow flex items-center justify-center p-4">
        
        {/* A. NẾU CHƯA BẮT ĐẦU GAME -> HIỂN THỊ LOBBY */}
        {!gameState ? (
          <Lobby
            socket={socket}
            playerName={playerName}
            setPlayerName={setPlayerName}
            roomInfo={roomInfo}
            onStartOfflineGame={handleStartOfflineGame}
            onCreateOnlineRoom={handleCreateOnlineRoom}
            onJoinOnlineRoom={handleJoinOnlineRoom}
            onSelectColor={handleSelectColorOnline}
            onToggleReady={handleToggleReadyOnline}
            onStartOnlineGame={handleStartOnlineGame}
            onChangeMode={handleChangeModeOnline}
            chatMessages={chatMessages}
            onSendChatMessage={handleSendChatMessage}
          />
        ) : (
          
          /* B. NẾU ĐÃ VÀO TRẬN ĐẤU -> HIỂN THỊ BÀN CỜ & ĐIỀU KHIỂN */
          <div className="game-layout">

            {/* Cột giữa: Bàn cờ Ludo 15x15 */}
            <section className="main-board-panel">
              {(() => {
                // Bàn cờ CỐ ĐỊNH theo client: yard của người dùng luôn ở góc dưới-trái.
                // Không xoay theo lượt, không đổi theo người khác.
                let myColor;
                if (gameMode === 'online') {
                  const me = gameState.players.find(p => p.id === socket?.id);
                  myColor = me ? me.color : gameState.players[0]?.color;
                } else {
                  // Offline: cố định người cầm máy = player đầu tiên (red)
                  myColor = gameState.players[0]?.color;
                }
                return (
                  <Board
                    pieces={gameState.pieces}
                    currentTurnColor={gameState.currentTurnColor}
                    validPiecesToMove={getMovablePieceIds()}
                    onPieceClick={gameMode === 'online' ? handleMoveOnlinePiece : handleMoveOfflinePiece}
                    players={gameState.players}
                    myColor={myColor}
                  />
                );
              })()}
            </section>

            {/* Dưới bàn cờ: Xúc xắc + Chat (online) */}
            <section className="below-board-panel">
              {/* Bảng xúc xắc (Dice controls) */}
              <div className="glass-panel controls-panel flex-grow">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  {gameState.status === 'playing' ? `Lượt đi: ${gameState.currentTurnColor.toUpperCase()}` : 'Trận đấu kết thúc'}
                </span>

                {gameState.status === 'playing' ? (
                  <>
                    <Dice3D
                      value={gameState.diceValue}
                      isRolling={isRolling}
                      onRoll={gameMode === 'online' ? handleRollOnlineDice : handleRollOfflineDice}
                      disabled={!canClientRollDice()}
                    />

                    <div className="text-center">
                      {canClientRollDice() ? (
                        <p className="text-sm text-green-400 font-medium animate-pulse">Đến lượt bạn! Click vào xúc xắc để đổ</p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {gameState.players[gameState.turnIndex]?.isBot
                            ? 'Máy đang suy nghĩ...'
                            : `Đang đợi ${gameState.players[gameState.turnIndex]?.name}...`}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center">
                    <Trophy className="text-yellow-400 mx-auto mb-2 animate-bounce" size={42} />
                    <h3 className="font-bold text-lg text-yellow-400">CHIẾN THẮNG!</h3>
                    <p className="text-sm text-gray-300 mt-1 font-semibold">{gameState.winner?.name}</p>
                    <button className="glass-button active mt-4 text-xs py-2 px-4" onClick={() => window.location.reload()}>
                      Về sảnh chờ
                    </button>
                  </div>
                )}
              </div>

              {/* Chatbox (chỉ có khi chơi Online) */}
              {gameMode === 'online' && (
                <div className="glass-panel chat-panel below-board-chat">
                  <h3 className="text-sm font-bold text-gray-400 p-4 border-b border-white/5 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Hộp chat
                  </h3>
                  <div className="chat-messages">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-[11px] text-gray-500 my-auto">Gửi tin nhắn để chat cùng mọi người!</div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className="chat-message">
                          <span className={`chat-message-sender ${msg.senderColor}`}>
                            {msg.senderName}:
                          </span>
                          <span className="text-gray-300">{msg.message}</span>
                          <span className="text-[9px] text-gray-500 float-right mt-1">{msg.time.split(' ')[0]}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (onlineChatInput.trim()) {
                        handleSendChatMessage(onlineChatInput);
                        setOnlineChatInput('');
                      }
                    }}
                    className="chat-input-container"
                  >
                    <input
                      type="text"
                      className="glass-input py-2 text-xs flex-grow"
                      placeholder="Nhập tin nhắn..."
                      value={onlineChatInput}
                      onChange={(e) => setOnlineChatInput(e.target.value)}
                      maxLength={50}
                    />
                    <button type="submit" className="glass-button p-2" disabled={!onlineChatInput.trim()}>
                      Gửi
                    </button>
                  </form>
                </div>
              )}
            </section>

          </div>
        )}
      </main>

      {/* 3. FOOTER */}
      <footer className="py-4 text-center text-xs text-gray-600 border-t border-white/5 bg-black/10">
        <p>© 2026 Ludo World Premium. Phát triển bởi AI Pair Programming.</p>
      </footer>

      {/* Báo lỗi modal */}
      {errorMessage && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 className="text-lg font-bold text-red-400 mb-2">Đã xảy ra lỗi</h3>
            <p className="text-gray-300 text-sm mb-6">{errorMessage}</p>
            <button className="glass-button active py-2 px-6" onClick={() => setErrorMessage('')}>
              Đóng
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
