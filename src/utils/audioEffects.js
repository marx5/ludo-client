// Quản lý và tổng hợp âm thanh bằng Web Audio API
// Giải pháp này độc lập, không cần tải file âm thanh mp3/wav từ server, chạy mượt mà offline.

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Kích hoạt lại nếu trình duyệt tạm dừng âm thanh để bảo mật
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Âm thanh lắc xúc xắc (Rolling Dice)
// Sử dụng tiếng ồn trắng (White noise) ngắt quãng để mô phỏng tiếng xúc xắc lăn trong hộp gỗ/nhựa
export function playRollSound() {
  try {
    const ctx = getAudioContext();
    const duration = 0.8;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Tạo tiếng ồn trắng ngẫu nhiên
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    // Bộ lọc tần số để tạo âm trầm gỗ va chạm
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400; // Tần số trung tâm
    filter.Q.value = 3;
    
    // Bộ tạo biên độ âm thanh ngắt quãng (envelope)
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    
    // Giả lập 4 lần xúc xắc nảy nhanh trong 0.8 giây
    const bounces = [0, 0.2, 0.4, 0.6];
    bounces.forEach(delay => {
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.12);
    });
    
    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    noiseNode.start();
    noiseNode.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn('Web Audio API not supported or user interaction required:', err);
  }
}

// 2. Âm thanh quân cờ di chuyển (Move Piece)
// Tiếng "Boop" ngắn, tần số tăng dần nhanh chóng từ 300Hz lên 600Hz
export function playMoveSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle'; // Âm thanh tam giác nghe mềm mại hơn hình vuông
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

// 3. Âm thanh đá quân đối thủ về chuồng (Hit Piece / Knockout)
// Tiếng nổ nhỏ hoặc giảm tần số cực nhanh từ cao xuống thấp tạo hiệu ứng "bị rơi rụng"
export function playHitSound() {
  try {
    const ctx = getAudioContext();
    
    // Sử dụng 2 sóng dao động kết hợp để tạo âm thanh dày và uy lực hơn
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.35);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(400, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.35);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    
    osc1.stop(ctx.currentTime + 0.38);
    osc2.stop(ctx.currentTime + 0.38);
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

// 4. Âm thanh về đích hoặc chiến thắng (Reached Home / Victory)
// Tiếng chuông reo hợp âm synth vui tai tăng dần tần số theo nốt nhạc đô-mi-sol-đố
export function playWinSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Danh sách nốt nhạc (C5, E5, G5, C6) tạo hợp âm trưởng tươi vui
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);
      
      // Mỗi nốt vang lên từ từ và nhỏ dần
      gainNode.gain.setValueAtTime(0, now + index * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.15, now + index * 0.1 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.4);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.4);
    });
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

// 5. Âm thanh nhảy 1 bước (Step Hop)
// Tiếng "pop" cực ngắn, tần số tăng nhanh từ 240Hz lên 480Hz trong 0.08s
export function playStepSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.08);
    
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

// 6. Âm thanh tấn công đá quân (Kick Attack)
// Tiếng xoẹt chém (Sword slash) mạnh mẽ quét tần số từ thấp lên cao cực nhanh
export function playKickAttackSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

// 7. Âm thanh quân bị đá bay về chuồng (Kicked Flee / Falling)
// Tiếng rơi rụng quét tần số từ cao xuống thấp chậm rãi kèm âm lượng nhỏ dần
export function playKickedFleeSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.22, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

// 8. Âm thanh nhảy vào ô an toàn (Safe Zone Sparkle)
// Hợp âm rải (arpeggio) các nốt cao thánh thót đô-mi-sol-đố giống tiếng lấp lánh phép thuật
export function playSafeZoneSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [1046.50, 1318.51, 1567.98, 2093.00]; // Đô6 - Mi6 - Sol6 - Đô7
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.04);
      
      gainNode.gain.setValueAtTime(0, now + index * 0.04);
      gainNode.gain.linearRampToValueAtTime(0.1, now + index * 0.04 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.04 + 0.2);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now + index * 0.04);
      osc.stop(now + index * 0.04 + 0.2);
    });
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

