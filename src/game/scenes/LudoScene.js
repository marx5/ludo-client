import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { 
  playStepSound, 
  playSafeZoneSound, 
  playKickAttackSound, 
  playKickedFleeSound, 
  playWinSound 
} from '../../utils/audioEffects';

const PATH_COORDS = [
  {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5},
  {r: 5, c: 6}, {r: 4, c: 6}, {r: 3, c: 6}, {r: 2, c: 6}, {r: 1, c: 6}, {r: 0, c: 6},
  {r: 0, c: 7}, {r: 0, c: 8},
  {r: 1, c: 8}, {r: 2, c: 8}, {r: 3, c: 8}, {r: 4, c: 8}, {r: 5, c: 8},
  {r: 6, c: 9}, {r: 6, c: 10}, {r: 6, c: 11}, {r: 6, c: 12}, {r: 6, c: 13}, {r: 6, c: 14},
  {r: 7, c: 14}, {r: 8, c: 14},
  {r: 8, c: 13}, {r: 8, c: 12}, {r: 8, c: 11}, {r: 8, c: 10}, {r: 8, c: 9},
  {r: 9, c: 8}, {r: 10, c: 8}, {r: 11, c: 8}, {r: 12, c: 8}, {r: 13, c: 8}, {r: 14, c: 8},
  {r: 14, c: 7}, {r: 14, c: 6},
  {r: 13, c: 6}, {r: 12, c: 6}, {r: 11, c: 6}, {r: 10, c: 6}, {r: 9, c: 6},
  {r: 8, c: 5}, {r: 8, c: 4}, {r: 8, c: 3}, {r: 8, c: 2}, {r: 8, c: 1}, {r: 8, c: 0},
  {r: 7, c: 0}, {r: 6, c: 0}
];

const HOME_COORDS = {
  red: [ {r: 7, c: 1}, {r: 7, c: 2}, {r: 7, c: 3}, {r: 7, c: 4}, {r: 7, c: 5} ],
  green: [ {r: 1, c: 7}, {r: 2, c: 7}, {r: 3, c: 7}, {r: 4, c: 7}, {r: 5, c: 7} ],
  yellow: [ {r: 7, c: 13}, {r: 7, c: 12}, {r: 7, c: 11}, {r: 7, c: 10}, {r: 7, c: 9} ],
  blue: [ {r: 13, c: 7}, {r: 12, c: 7}, {r: 11, c: 7}, {r: 10, c: 7}, {r: 9, c: 7} ]
};

const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

export class LudoScene extends Scene {
  constructor() {
    super('LudoScene');
    this.gameState = null;
    this.boardSize = 600;
    this.cellSize = 600 / 15;
    this.tokens = {};
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    
    const minDim = Math.min(this.cameras.main.width, this.cameras.main.height);
    this.boardSize = minDim * 0.95;
    this.cellSize = this.boardSize / 15;
    
    this.generatePawnTextures();
    this.drawBoard();
    
    EventBus.on('set-player-color', (color) => {
      let angle = 0;
      if (color === 'red') angle = -Math.PI / 2;
      else if (color === 'green') angle = Math.PI;
      else if (color === 'yellow') angle = Math.PI / 2;
      else if (color === 'blue') angle = 0;
      
      this.cameras.main.setRotation(angle);
    });

    EventBus.on('update-game-state', (payload) => {
      let state = payload;
      let myColor = null;
      let movablePieceIds = [];
      
      if (payload && payload.state) {
        state = payload.state;
        myColor = payload.myColor;
        movablePieceIds = payload.movablePieceIds || [];
      }

      this.gameState = state;
      this.updateBoard(state, myColor, movablePieceIds);
    });

    EventBus.emit('scene-ready');
  }

  generatePawnTextures() {
    const colors = {
      red: 0xef4444,
      green: 0x22c55e,
      yellow: 0xeab308,
      blue: 0x3b82f6
    };

    const size = 64;
    Object.keys(colors).forEach(colorKey => {
      const textureKey = `pawn_${colorKey}`;
      if (this.textures.exists(textureKey)) return;

      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      const colorVal = colors[colorKey];

      // 1. Đổ bóng (drop shadow) chân quân tốt
      graphics.fillStyle(0x000000, 0.35);
      graphics.fillEllipse(32, 53, 21, 8);

      // 2. Viền sticker phát sáng màu trắng để làm nổi bật quân cờ khỏi nền
      graphics.fillStyle(0xffffff, 1.0);
      graphics.fillEllipse(32, 43, 20, 13);
      graphics.fillCircle(32, 22, 14);

      // 3. Thân quân tốt (ellipse ở dưới)
      graphics.fillStyle(colorVal);
      graphics.lineStyle(2.5, 0x111111, 1);
      graphics.fillEllipse(32, 43, 17, 10);
      graphics.strokeEllipse(32, 43, 17, 10);

      // 4. Đầu quân tốt (circle ở trên)
      graphics.fillCircle(32, 22, 11);
      graphics.strokeCircle(32, 22, 11);

      // 5. Highlight phản chiếu ánh sáng (màu trắng mờ)
      graphics.fillStyle(0xffffff, 0.55);
      graphics.fillCircle(28, 18, 3.5);

      graphics.generateTexture(textureKey, size, size);
    });
  }

  getHexColor(color) {
    switch (color) {
      case 'red': return 0xef4444;
      case 'green': return 0x22c55e;
      case 'yellow': return 0xeab308;
      case 'blue': return 0x3b82f6;
      default: return 0x9ca3af;
    }
  }

  drawBoard() {
    const graphics = this.add.graphics();
    const startX = (this.cameras.main.width - this.boardSize) / 2;
    const startY = (this.cameras.main.height - this.boardSize) / 2;

    this.boardStartX = startX;
    this.boardStartY = startY;

    graphics.fillStyle(0x0f172a, 1);
    graphics.fillRect(startX, startY, this.boardSize, this.boardSize);
    graphics.lineStyle(4, 0xffffff, 0.2);
    graphics.strokeRect(startX, startY, this.boardSize, this.boardSize);

    PATH_COORDS.forEach((coord, index) => {
      const x = startX + coord.c * this.cellSize;
      const y = startY + coord.r * this.cellSize;
      
      graphics.fillStyle(0x334155, 1);
      
      if (SAFE_POSITIONS.includes(index)) {
        if (index === 0) graphics.fillStyle(0xef4444, 0.8);
        else if (index === 13) graphics.fillStyle(0x22c55e, 0.8);
        else if (index === 26) graphics.fillStyle(0xeab308, 0.8);
        else if (index === 39) graphics.fillStyle(0x3b82f6, 0.8);
        else graphics.fillStyle(0x475569, 1);
      }
      
      graphics.fillRect(x, y, this.cellSize, this.cellSize);
      graphics.lineStyle(1, 0xffffff, 0.2);
      graphics.strokeRect(x, y, this.cellSize, this.cellSize);

      if (SAFE_POSITIONS.includes(index)) {
        this.drawStar(graphics, x + this.cellSize / 2, y + this.cellSize / 2, 5, this.cellSize * 0.35, this.cellSize * 0.15, 0xffffff, 0.8);
      }
    });

    const homeColors = { red: 0xef4444, green: 0x22c55e, yellow: 0xeab308, blue: 0x3b82f6 };
    Object.keys(HOME_COORDS).forEach(color => {
      HOME_COORDS[color].forEach(coord => {
        const x = startX + coord.c * this.cellSize;
        const y = startY + coord.r * this.cellSize;
        graphics.fillStyle(homeColors[color], 0.7);
        graphics.fillRect(x, y, this.cellSize, this.cellSize);
        graphics.lineStyle(1, 0xffffff, 0.2);
        graphics.strokeRect(x, y, this.cellSize, this.cellSize);
      });
    });

    const cx = startX + 7.5 * this.cellSize;
    const cy = startY + 7.5 * this.cellSize;
    graphics.lineStyle(2, 0xffffff, 0.5);

    graphics.fillStyle(0xef4444, 0.9);
    graphics.beginPath();
    graphics.moveTo(startX + 6 * this.cellSize, startY + 6 * this.cellSize);
    graphics.lineTo(startX + 6 * this.cellSize, startY + 9 * this.cellSize);
    graphics.lineTo(cx, cy);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    graphics.fillStyle(0x22c55e, 0.9);
    graphics.beginPath();
    graphics.moveTo(startX + 6 * this.cellSize, startY + 6 * this.cellSize);
    graphics.lineTo(startX + 9 * this.cellSize, startY + 6 * this.cellSize);
    graphics.lineTo(cx, cy);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    graphics.fillStyle(0xeab308, 0.9);
    graphics.beginPath();
    graphics.moveTo(startX + 9 * this.cellSize, startY + 6 * this.cellSize);
    graphics.lineTo(startX + 9 * this.cellSize, startY + 9 * this.cellSize);
    graphics.lineTo(cx, cy);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    graphics.fillStyle(0x3b82f6, 0.9);
    graphics.beginPath();
    graphics.moveTo(startX + 6 * this.cellSize, startY + 9 * this.cellSize);
    graphics.lineTo(startX + 9 * this.cellSize, startY + 9 * this.cellSize);
    graphics.lineTo(cx, cy);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    this.drawYard(graphics, startX, startY, 0xef4444);
    this.drawYard(graphics, startX + this.cellSize * 9, startY, 0x22c55e);
    this.drawYard(graphics, startX + this.cellSize * 9, startY + this.cellSize * 9, 0xeab308);
    this.drawYard(graphics, startX, startY + this.cellSize * 9, 0x3b82f6);
  }

  drawYard(graphics, x, y, color) {
    graphics.fillStyle(color, 0.85);
    graphics.fillRect(x, y, this.cellSize * 6, this.cellSize * 6);
    graphics.lineStyle(3, 0xffffff, 0.4);
    graphics.strokeRect(x, y, this.cellSize * 6, this.cellSize * 6);
    
    graphics.fillStyle(0xffffff, 0.15);
    graphics.fillRect(x + this.cellSize, y + this.cellSize, this.cellSize * 4, this.cellSize * 4);

    const offset = this.cellSize * 1.5;
    const size = this.cellSize * 1.5;
    const positions = [
      { x: x + offset, y: y + offset },
      { x: x + this.cellSize * 4.5 - size, y: y + offset },
      { x: x + offset, y: y + this.cellSize * 4.5 - size },
      { x: x + this.cellSize * 4.5 - size, y: y + this.cellSize * 4.5 - size },
    ];

    positions.forEach(pos => {
      graphics.fillStyle(0x0f172a, 0.7);
      graphics.fillCircle(pos.x + size / 2, pos.y + size / 2, size / 2 * 0.8);
      graphics.lineStyle(2, 0xffffff, 0.3);
      graphics.strokeCircle(pos.x + size / 2, pos.y + size / 2, size / 2 * 0.8);
    });
  }

  drawStar(graphics, x, y, points, outerRadius, innerRadius, color, alpha) {
    graphics.fillStyle(color, alpha);
    graphics.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) graphics.moveTo(px, py);
      else graphics.lineTo(px, py);
    }
    graphics.closePath();
    graphics.fillPath();
  }

  getPieceCoords(color, position, id, stepCount, occupantsCount = 1, occupantIndex = 0) {
    const startX = this.boardStartX;
    const startY = this.boardStartY;

    if (position === -1) {
      // Yard
      let yX, yY;
      if (color === 'red') { yX = startX; yY = startY; }
      else if (color === 'green') { yX = startX + this.cellSize * 9; yY = startY; }
      else if (color === 'yellow') { yX = startX + this.cellSize * 9; yY = startY + this.cellSize * 9; }
      else if (color === 'blue') { yX = startX; yY = startY + this.cellSize * 9; }

      const offset = this.cellSize * 1.5;
      const size = this.cellSize * 1.5;
      const offsets = [
        { x: offset, y: offset },
        { x: this.cellSize * 4.5 - size, y: offset },
        { x: offset, y: this.cellSize * 4.5 - size },
        { x: this.cellSize * 4.5 - size, y: this.cellSize * 4.5 - size }
      ];
      return {
        x: yX + offsets[id].x + size / 2,
        y: yY + offsets[id].y + size / 2
      };
    }
    
    if (position === 999 || position === 100 || stepCount === 58) {
      // Xếp cố định xung quanh tâm dựa trên màu và id để tránh dùng Math.random() gây rung lắc
      let offsetX = 0;
      let offsetY = 0;
      if (color === 'red') { offsetX = -this.cellSize * 0.25; offsetY = -this.cellSize * 0.25; }
      else if (color === 'green') { offsetX = this.cellSize * 0.25; offsetY = -this.cellSize * 0.25; }
      else if (color === 'yellow') { offsetX = this.cellSize * 0.25; offsetY = this.cellSize * 0.25; }
      else if (color === 'blue') { offsetX = -this.cellSize * 0.25; offsetY = this.cellSize * 0.25; }
      
      const idOffset = (id - 1.5) * (this.cellSize * 0.08);
      
      return {
        x: startX + 7.5 * this.cellSize + offsetX + idOffset,
        y: startY + 7.5 * this.cellSize + offsetY + idOffset
      };
    }

    let r, c;
    if (stepCount >= 53) {
      // Home stretch
      const homeIdx = stepCount - 53;
      const coord = HOME_COORDS[color][homeIdx];
      if (coord) { r = coord.r; c = coord.c; }
    } else {
      // Common track
      const coord = PATH_COORDS[position];
      if (coord) { r = coord.r; c = coord.c; }
    }

    if (r !== undefined && c !== undefined) {
      let screenDX = 0;
      let screenDY = 0;
      
      const N = occupantsCount;
      const i = occupantIndex;
      
      if (N === 2) {
        const offsets = [
          { x: -this.cellSize * 0.22, y: 0 },
          { x: this.cellSize * 0.22, y: 0 }
        ];
        screenDX = offsets[i].x;
        screenDY = offsets[i].y;
      } else if (N === 3) {
        const offsets = [
          { x: -this.cellSize * 0.22, y: this.cellSize * 0.15 },
          { x: this.cellSize * 0.22, y: this.cellSize * 0.15 },
          { x: 0, y: -this.cellSize * 0.22 }
        ];
        screenDX = offsets[i].x;
        screenDY = offsets[i].y;
      } else if (N >= 4) {
        const idx = i % 4;
        const offsets = [
          { x: -this.cellSize * 0.22, y: -this.cellSize * 0.22 },
          { x: this.cellSize * 0.22, y: -this.cellSize * 0.22 },
          { x: -this.cellSize * 0.22, y: this.cellSize * 0.22 },
          { x: this.cellSize * 0.22, y: this.cellSize * 0.22 }
        ];
        screenDX = offsets[idx].x;
        screenDY = offsets[idx].y;
      }

      // Đảo góc xoay của camera để các quân cờ luôn phân tán song song theo chiều ngang màn hình
      const angle = this.cameras.main.rotation;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const offsetX = screenDX * cos + screenDY * sin;
      const offsetY = -screenDX * sin + screenDY * cos;

      return {
        x: startX + c * this.cellSize + this.cellSize / 2 + offsetX,
        y: startY + r * this.cellSize + this.cellSize / 2 + offsetY
      };
    }

    return { x: startX, y: startY };
  }

  getIntermediateState(color, stepCount) {
    if (stepCount === 0) return { position: -1, stepCount };
    if (stepCount === 58) return { position: 999, stepCount };
    
    if (stepCount >= 53) {
       return { position: -2, stepCount };
    }
    
    const startPos = { red: 0, green: 13, yellow: 26, blue: 39 }[color];
    const position = (startPos + stepCount - 1) % 52;
    return { position, stepCount };
  }

  animatePieceSteps(token, steps, currentIdx, isSafeAtEnd, isWinAtEnd) {
    if (currentIdx >= steps.length) {
      if (isWinAtEnd) {
        playWinSound();
        this.triggerConfetti(token.x, token.y);
      } else if (isSafeAtEnd) {
        playSafeZoneSound();
      }
      return;
    }

    const step = steps[currentIdx];
    playStepSound();

    this.tweens.add({
      targets: token,
      x: step.x,
      y: step.y,
      duration: 180,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.animatePieceSteps(token, steps, currentIdx + 1, isSafeAtEnd, isWinAtEnd);
      }
    });
  }

  animatePieceBackward(token, fromStepCount, color, finalX, finalY) {
    const steps = [];
    for (let i = fromStepCount - 1; i >= 1; i--) {
      const tempState = this.getIntermediateState(color, i);
      const coords = this.getPieceCoords(color, tempState.position, token.pieceId, tempState.stepCount);
      steps.push(coords);
    }
    steps.push({ x: finalX, y: finalY });

    this.animatePieceStepsBackward(token, steps, 0);
  }

  animatePieceStepsBackward(token, steps, currentIdx) {
    if (currentIdx >= steps.length) {
      return;
    }

    const step = steps[currentIdx];
    playStepSound();

    this.tweens.add({
      targets: token,
      x: step.x,
      y: step.y,
      duration: 50,
      ease: 'Linear',
      onComplete: () => {
        this.animatePieceStepsBackward(token, steps, currentIdx + 1);
      }
    });
  }

  triggerConfetti(x, y) {
    if (!this.textures.exists('particle_dot')) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xffffff);
      graphics.fillRect(0, 0, 8, 8);
      graphics.generateTexture('particle_dot', 8, 8);
    }

    const colors = [0xef4444, 0x22c55e, 0xeab308, 0x3b82f6, 0xec4899, 0xa855f7];
    const emitter = this.add.particles(x, y, 'particle_dot', {
      lifespan: 1200,
      speed: { min: 100, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: 200,
      quantity: 35,
      color: colors,
      blendMode: 'ADD'
    });

    emitter.explode(35, 0, 0);

    this.time.delayedCall(1500, () => {
      emitter.destroy();
    });
  }

  updateBoard(state, myColor = null, movablePieceIds = []) {
    if (!state || !state.pieces) return;

    // Group active track pieces by cell key
    const cellOccupants = {};
    state.pieces.forEach(p => {
      if (p.position === -1 || p.position === 999) return;
      
      let key;
      if (p.stepCount >= 52) {
        key = `home-${p.color}-${p.stepCount}`;
      } else {
        key = `track-${p.position}`;
      }
      
      if (!cellOccupants[key]) {
        cellOccupants[key] = [];
      }
      cellOccupants[key].push(p);
    });

    // Lập bản đồ thông tin của các quân bị đá trước khi bất kỳ token.currentStepCount nào bị sửa đổi
    const kickedPiecesInfo = {};
    state.pieces.forEach(piece => {
      const pieceKey = `${piece.color}-${piece.id}`;
      const token = this.tokens[pieceKey];
      if (token && piece.stepCount === 0 && token.currentStepCount > 0) {
        const oldStepCount = token.currentStepCount;
        const oldPosition = token.currentPosition;
        
        // Tìm kẻ tấn công trong state.pieces
        const attacker = state.pieces.find(p => p.color !== piece.color && p.position === oldPosition && p.stepCount > 0);
        let delay = 0;
        
        if (attacker) {
          const attackerKey = `${attacker.color}-${attacker.id}`;
          const attackerToken = this.tokens[attackerKey];
          if (attackerToken) {
            const stepsToTake = attacker.stepCount - attackerToken.currentStepCount;
            if (stepsToTake > 0) {
              delay = stepsToTake * 180;
            }
          }
        }
        
        kickedPiecesInfo[pieceKey] = {
          oldStepCount,
          oldPosition,
          delay
        };
      }
    });

    state.pieces.forEach(piece => {
      const pieceKey = `${piece.color}-${piece.id}`;
      
      // Calculate dynamic stack parameters
      let occupantsCount = 1;
      let occupantIndex = 0;
      if (piece.position !== -1 && piece.position !== 999) {
        let key = piece.stepCount >= 52 ? `home-${piece.color}-${piece.stepCount}` : `track-${piece.position}`;
        const occupants = cellOccupants[key] || [];
        occupantsCount = occupants.length;
        occupantIndex = occupants.findIndex(o => o.color === piece.color && o.id === piece.id);
        if (occupantIndex === -1) occupantIndex = 0;
      }

      const finalCoords = this.getPieceCoords(piece.color, piece.position, piece.id, piece.stepCount, occupantsCount, occupantIndex);
      
      // Determine size: standard size (1.4/1.6) if alone, compact size (0.95/1.25) if multiple pieces are on the same cell!
      const wScale = occupantsCount > 1 ? 0.95 : 1.4;
      const hScale = occupantsCount > 1 ? 1.25 : 1.6;
      
      if (!this.tokens[pieceKey]) {
        const token = this.add.image(finalCoords.x, finalCoords.y, `pawn_${piece.color}`);
        token.setDisplaySize(this.cellSize * wScale, this.cellSize * hScale);
        token.setRotation(-this.cameras.main.rotation);
        token.setInteractive({ useHandCursor: true });
        
        token.on('pointerdown', () => {
          EventBus.emit('piece-clicked', { color: piece.color, id: piece.id });
        });

        token.pieceId = piece.id;
        token.currentStepCount = piece.stepCount;
        token.currentPosition = piece.position;
        this.tokens[pieceKey] = token;
      } else {
        const token = this.tokens[pieceKey];
        token.setDisplaySize(this.cellSize * wScale, this.cellSize * hScale);
        token.setRotation(-this.cameras.main.rotation);

        if (piece.stepCount === 0 && token.currentStepCount > 0) {
            const info = kickedPiecesInfo[pieceKey];
            const oldStepCount = info ? info.oldStepCount : token.currentStepCount;
            const delay = info ? info.delay : 0;
            
            token.currentStepCount = piece.stepCount;
            token.currentPosition = piece.position;

            if (delay > 0) {
              this.time.delayedCall(delay, () => {
                playKickAttackSound();
                playKickedFleeSound();
                this.animatePieceBackward(token, oldStepCount, piece.color, finalCoords.x, finalCoords.y);
              });
            } else {
              playKickAttackSound();
              playKickedFleeSound();
              this.animatePieceBackward(token, oldStepCount, piece.color, finalCoords.x, finalCoords.y);
            }
        } 
        else if (piece.stepCount > token.currentStepCount) {
            const steps = [];
            const startStep = token.currentStepCount;
            const stepsToTake = piece.stepCount - startStep;
            
            for (let i = 1; i <= stepsToTake; i++) {
                const tempStepCount = startStep + i;
                const tempState = this.getIntermediateState(piece.color, tempStepCount);
                const coords = this.getPieceCoords(piece.color, tempState.position, piece.id, tempState.stepCount);
                steps.push(coords);
            }
            
            token.currentStepCount = piece.stepCount;
            token.currentPosition = piece.position;

            const isSafeAtEnd = SAFE_POSITIONS.includes(piece.position);
            const isWinAtEnd = piece.stepCount === 58;

            this.animatePieceSteps(token, steps, 0, isSafeAtEnd, isWinAtEnd);
        } 
        else {
            this.tweens.add({
              targets: token,
              x: finalCoords.x,
              y: finalCoords.y,
              duration: 300,
              ease: 'Power2'
            });
        }
      }

      // Áp dụng nhấp nháy phát sáng nếu là quân cờ đi được của bản thân
      const token = this.tokens[pieceKey];
      const isMovable = (piece.color === myColor && movablePieceIds.includes(piece.id));
      if (isMovable) {
        if (!token.pulseTween) {
          token.pulseTween = this.tweens.add({
            targets: token,
            alpha: 0.45,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      } else {
        if (token.pulseTween) {
          token.pulseTween.stop();
          token.pulseTween = null;
          token.setAlpha(1.0);
        }
      }
    });
  }
}
