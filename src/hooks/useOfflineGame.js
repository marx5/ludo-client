import { useState, useRef, useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
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
import { 
  delay, calculateMoveDelay, 
  BOT_THINK_BEFORE_ROLL_MS, BOT_ROLL_ANIMATION_MS, BOT_THINK_BEFORE_MOVE_MS, TURN_SWITCH_DELAY_MS, MOVE_TIMEOUT_MS 
} from '../utils/constants';

const playAudioForPiecesTransition = (piecesBefore, piecesAfter) => {
  if (!piecesBefore || !piecesAfter) return;
  const win = piecesAfter.some((p, idx) => p.stepCount === 58 && (!piecesBefore[idx] || piecesBefore[idx].stepCount !== 58));
  if (win) {
    playWinSound();
    return;
  }
  const hit = piecesAfter.some((p, idx) => p.position === -1 && (!piecesBefore[idx] || piecesBefore[idx].position !== -1));
  if (hit) {
    playHitSound();
    return;
  }
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

  const handleStartOfflineGame = (playersList, mode) => {
    const initialState = initializeGameState(playersList, mode);
    setGameState(initialState);
    setGameMode('offline');
    setRoomInfo(null);
  };

  const triggerOfflineBotTurn = async () => {
    const state = gameStateRef.current;
    if (!state || state.status !== 'playing') return;

    const currentTurnColor = state.currentTurnColor;
    const currentPlayer = state.players.find(p => p.color === currentTurnColor);
    if (!currentPlayer || !currentPlayer.isBot) return;

    // Bước 1: Suy nghĩ đổ xúc xắc
    await delay(BOT_THINK_BEFORE_ROLL_MS);
    const activeState = gameStateRef.current;
    if (!activeState || activeState.status !== 'playing' || activeState.currentTurnColor !== currentTurnColor) return;

    // Sinh xúc xắc ngay lập tức cho Bot và cập nhật diceValue
    const { value: diceVal, pityActivated } = rollDiceForPlayer(currentPlayer, activeState.pieces);
    const rolledState = { ...activeState };
    rolledState.diceValue = diceVal;
    rolledState.hasRolled = false;
    setGameState(rolledState);

    setIsRolling(true);
    playRollSound();

    await delay(BOT_ROLL_ANIMATION_MS);

    // Hoàn tất lượt quay xúc xắc cho Bot
    const afterRollState = { ...gameStateRef.current };
    afterRollState.hasRolled = true;
    afterRollState.history.unshift({
      time: new Date().toLocaleTimeString(),
      message: `Bot ${currentPlayer.name} (${currentTurnColor}) đã đổ được ${diceVal} điểm.`
    });

    if (pityActivated) {
      afterRollState.history.unshift({
        time: new Date().toLocaleTimeString(),
        message: `[Hệ thống] Hỗ trợ may mắn: Cưỡng bức xúc xắc ra 6 điểm cho Bot ${currentPlayer.name}!`
      });
    }

    unstable_batchedUpdates(() => {
      setIsRolling(false);
      setGameState(afterRollState);
    });

    // Bước 2: Suy nghĩ đi cờ
    await delay(BOT_THINK_BEFORE_MOVE_MS);
    const stateBeforeMove = gameStateRef.current;
    if (!stateBeforeMove || stateBeforeMove.status !== 'playing') return;

    const validPieces = getValidPiecesToMove(currentTurnColor, diceVal, stateBeforeMove.pieces, stateBeforeMove.mode);

    if (validPieces.length === 0) {
      stateBeforeMove.history.unshift({
        time: new Date().toLocaleTimeString(),
        message: `Bot ${currentPlayer.name} không có nước đi hợp lệ.`
      });
      const stateAfterSkip = switchToNextTurn(stateBeforeMove);
      setGameState(stateAfterSkip);
      return;
    }

    let chosenPieceId = makeBotDecision(currentTurnColor, diceVal, stateBeforeMove.pieces, stateBeforeMove.mode);
    if (chosenPieceId === null && validPieces.length > 0) {
      chosenPieceId = validPieces[0].id;
    }

    if (chosenPieceId !== null) {
      const oldPiece = stateBeforeMove.pieces.find(p => p.color === currentTurnColor && p.id === chosenPieceId);
      const afterMoveState = movePieceInState(stateBeforeMove, currentTurnColor, chosenPieceId, diceVal);
      
      setGameState(afterMoveState);

      const kickedPiece = stateBeforeMove.pieces.find(p => p.position !== -1 && afterMoveState.pieces.find(ap => ap.color === p.color && ap.id === p.id).position === -1);
      const waitTime = calculateMoveDelay(oldPiece, diceVal, kickedPiece);

      await delay(waitTime);

      const activeState2 = gameStateRef.current;
      if (activeState2 && activeState2.status === 'playing') {
        let finalState = afterMoveState;
        if (afterMoveState.status === 'playing') {
          finalState = switchToNextTurn(afterMoveState);
        }
        setGameState(finalState);
      }
    }
  };

  const handleRollOfflineDice = async () => {
    const state = gameStateRef.current;
    if (!state || state.hasRolled || isRolling) return;

    // Sinh xúc xắc ngay lập tức cho người chơi và cập nhật diceValue
    const currentPlayer = state.players.find(p => p.color === state.currentTurnColor);
    const { value: diceVal, pityActivated } = rollDiceForPlayer(currentPlayer, state.pieces);
    const nextState = { ...state };
    nextState.diceValue = diceVal;
    nextState.hasRolled = false;
    setGameState(nextState);

    setIsRolling(true);
    playRollSound();
    
    await delay(1000); // 1s animation
    
    // Hoàn tất lượt quay xúc xắc cho người chơi
    const activeState = { ...gameStateRef.current };
    activeState.hasRolled = true;
    activeState.lastActionTime = Date.now();
    activeState.timerEndAt = Date.now() + MOVE_TIMEOUT_MS;

    if (pityActivated) {
      activeState.history.unshift({
        time: new Date().toLocaleTimeString(),
        message: `[Hệ thống] Hỗ trợ may mắn: Cưỡng bức xúc xắc ra 6 điểm cho ${currentPlayer.name}!`
      });
    }

    activeState.history.unshift({
      time: new Date().toLocaleTimeString(),
      message: `${currentPlayer.name} (${activeState.currentTurnColor}) đã đổ được ${diceVal} điểm.`
    });

    const validPieces = getValidPiecesToMove(activeState.currentTurnColor, diceVal, activeState.pieces, activeState.mode);
    
    if (validPieces.length === 0) {
      activeState.history.unshift({
        time: new Date().toLocaleTimeString(),
        message: `${currentPlayer.name} không có nước đi hợp lệ.`
      });
      
      unstable_batchedUpdates(() => {
        setIsRolling(false);
        setGameState(activeState);
      });

      await delay(TURN_SWITCH_DELAY_MS);
      
      const stateAfterSkip = switchToNextTurn(gameStateRef.current);
      setGameState(stateAfterSkip);
    } else {
      unstable_batchedUpdates(() => {
        setIsRolling(false);
        setGameState(activeState);
      });
    }
  };

  const handleMoveOfflinePiece = async (color, pieceId) => {
    const state = gameStateRef.current;
    if (!state || state.currentTurnColor !== color || !state.hasRolled || state.hasMoved) return;

    const afterMoveState = movePieceInState(state, color, pieceId, state.diceValue);
    if (afterMoveState === state) return;

    setGameState(afterMoveState);

    const oldPiece = state.pieces.find(p => p.color === color && p.id === pieceId);
    const kickedPiece = state.pieces.find(p => p.position !== -1 && afterMoveState.pieces.find(ap => ap.color === p.color && ap.id === p.id).position === -1);
    
    const waitTime = calculateMoveDelay(oldPiece, state.diceValue, kickedPiece);

    await delay(waitTime);

    const activeState = gameStateRef.current;
    if (activeState && activeState.status === 'playing') {
      const finalState = switchToNextTurn(afterMoveState);
      setGameState(finalState);
    }
  };

  // Tự động đi cờ
  useEffect(() => {
    if (!gameState || !gameState.hasRolled || gameState.hasMoved || gameState.status !== 'playing') return;
    
    const currentPlayer = gameState.players.find(p => p.color === gameState.currentTurnColor);
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

  // Tự động kích hoạt lượt chơi của Bot khi chuyển lượt (hoặc khi được lượt đổ thưởng)
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;

    const currentPlayer = gameState.players.find(p => p.color === gameState.currentTurnColor);
    if (currentPlayer && currentPlayer.isBot && !gameState.hasRolled) {
      triggerOfflineBotTurn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentTurnColor, gameState?.status, gameState?.hasRolled]);

  // Quản lý đếm ngược (Turn Timeout)
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;

    const currentPlayer = gameState.players.find(p => p.color === gameState.currentTurnColor);
    if (!currentPlayer || currentPlayer.isBot) return;

    const timeLeft = gameState.timerEndAt - Date.now();
    if (timeLeft <= 0) return;

    if (!gameState.hasRolled) {
      const timer = setTimeout(() => {
        const activeState = gameStateRef.current;
        if (activeState && !activeState.hasRolled && activeState.status === 'playing') {
          activeState.history.unshift({
            time: new Date().toLocaleTimeString(),
            message: `[Hệ thống] Hết thời gian 20s! Tự động đổ xúc xắc cho ${currentPlayer.name}.`
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
              message: `[Hệ thống] Hết thời gian 30s! Tự động đi quân #${chosenPiece.id + 1} cho ${currentPlayer.name}.`
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
