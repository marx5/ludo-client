import { useState, useRef, useEffect } from 'react';
import {
  initializeGameState,
  movePieceInState,
  switchToNextTurn,
  makeBotDecision,
  getValidPiecesToMove,
  rollDiceForPlayer
} from '../utils/gameEngine';
import {
  playRollSound,
  playMoveSound,
  playHitSound,
  playWinSound
} from '../utils/audioEffects';

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

export default function useOfflineGame(playerName, setGameMode, setRoomInfo) {
  const [gameState, setGameState] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

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
      
      const nextState = { ...gameStateRef.current };
      const currentPlayer = nextState.players[nextState.turnIndex];
      const { value: diceVal, pityActivated } = rollDiceForPlayer(currentPlayer, nextState.pieces);
      
      nextState.diceValue = diceVal;
      nextState.hasRolled = true;
      nextState.lastActionTime = Date.now();
      nextState.timerEndAt = Date.now() + 60000; // Đặt hạn chót đi cờ (60s)

      if (pityActivated) {
        nextState.history.unshift({
          time: new Date().toLocaleTimeString(),
          message: `[Hệ thống] Hỗ trợ may mắn: Cưỡng bức xúc xắc ra 6 điểm cho ${currentPlayer.name}!`
        });
      }

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
        const { value: diceVal, pityActivated } = rollDiceForPlayer(currentPlayer, rolledState.pieces);
        
        rolledState.diceValue = diceVal;
        rolledState.hasRolled = true;
        rolledState.history.unshift({
          time: new Date().toLocaleTimeString(),
          message: `Bot ${currentPlayer.name} (${currentTurnColor}) đã đổ được ${diceVal} điểm.`
        });

        if (pityActivated) {
          rolledState.history.unshift({
            time: new Date().toLocaleTimeString(),
            message: `[Hệ thống] Hỗ trợ may mắn: Cưỡng bức xúc xắc ra 6 điểm cho Bot ${currentPlayer.name}!`
          });
        }

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

  // 5. Tự động đi cờ khi chỉ có một nước đi hợp lý/độc nhất
  useEffect(() => {
    if (!gameState || !gameState.hasRolled || gameState.hasMoved || gameState.status !== 'playing') return;
    
    const currentPlayer = gameState.players[gameState.turnIndex];
    if (!currentPlayer || currentPlayer.isBot) return;

    const validPieces = getValidPiecesToMove(gameState.currentTurnColor, gameState.diceValue, gameState.pieces);
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
        handleMoveOfflinePiece(activeState.currentTurnColor, firstPiece.id);
      }, 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // 6. Quản lý đếm ngược (Turn Timeout) cho chơi Offline
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;

    const currentPlayer = gameState.players[gameState.turnIndex];
    if (!currentPlayer || currentPlayer.isBot) return;

    const timeLeft = gameState.timerEndAt - Date.now();
    if (timeLeft <= 0) return;

    if (!gameState.hasRolled) {
      const timer = setTimeout(() => {
        const activeState = gameStateRef.current;
        if (activeState && !activeState.hasRolled && activeState.status === 'playing') {
          activeState.history.unshift({
            time: new Date().toLocaleTimeString(),
            message: `[Hệ thống] Hết thời gian 30s! Tự động đổ xúc xắc cho ${currentPlayer.name}.`
          });
          handleRollOfflineDice();
        }
      }, timeLeft);
      return () => clearTimeout(timer);
    } else if (!gameState.hasMoved) {
      const timer = setTimeout(() => {
        const activeState = gameStateRef.current;
        if (activeState && activeState.hasRolled && !activeState.hasMoved && activeState.status === 'playing') {
          const validPieces = getValidPiecesToMove(activeState.currentTurnColor, activeState.diceValue, activeState.pieces);
          if (validPieces.length > 0) {
            const chosenPiece = validPieces[0];
            activeState.history.unshift({
              time: new Date().toLocaleTimeString(),
              message: `[Hệ thống] Hết thời gian 60s! Tự động đi quân #${chosenPiece.id + 1} cho ${currentPlayer.name}.`
            });
            handleMoveOfflinePiece(activeState.currentTurnColor, chosenPiece.id);
          }
        }
      }, timeLeft);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  return {
    gameState,
    isRolling,
    handleStartOfflineGame,
    handleRollOfflineDice,
    handleMoveOfflinePiece
  };
}
