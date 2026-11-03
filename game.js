(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const context = canvas.getContext('2d', { alpha: false });
  const scoreDisplay = document.getElementById('scoreDisplay');
  const highScoreDisplay = document.getElementById('highScoreDisplay');
  const statusDisplay = document.getElementById('statusDisplay');
  const startButton = document.getElementById('startButton');
  const pauseButton = document.getElementById('pauseButton');
  const restartButton = document.getElementById('restartButton');
  const wallsButton = document.getElementById('wallsButton');
  const muteButton = document.getElementById('muteButton');
  const directionalButtons = document.querySelectorAll('[data-direction]');
  const keypadButtons = document.querySelectorAll('[data-keypad-digit]');

  const {
    GRID_COLUMNS, GRID_ROWS, createInitialState, queueDirection, advanceGame,
    recordKeypadDigit, isEmergencySequenceReady, nextEmergencyMode,
    mapGridCellToPixels, getSegmentConnections
  } = window.NokiaSnakeCore;
  const LCD_WIDTH = 84;
  const LCD_HEIGHT = 48;
  const BOARD_X = 2;
  const BOARD_Y = 2;
  const TILE_SIZE = 4;
  const STORAGE_KEY = 'nokia-snake-high-score';
  const COLORS = {
    lcd: '#a7b88b', texture: '#9fad80', shade: '#89986e', ink: '#263b27', dimInk: '#516044',
    ambulance: '#ecebd6', ambulanceRed: '#b63532', fire: '#b83427', fireGold: '#d7ad31'
  };
  const GLYPHS = {
    A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'],
    C: ['011', '100', '100', '100', '011'], D: ['110', '101', '101', '101', '110'],
    E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
    G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'],
    I: ['111', '010', '010', '010', '111'], K: ['101', '101', '110', '101', '101'],
    L: ['100', '100', '100', '100', '111'], M: ['101', '111', '111', '101', '101'],
    N: ['101', '111', '111', '111', '101'], O: ['010', '101', '101', '101', '010'],
    P: ['110', '101', '110', '100', '100'], R: ['110', '101', '110', '101', '101'],
    S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'],
    U: ['101', '101', '101', '101', '111'], V: ['101', '101', '101', '101', '010'],
    W: ['101', '101', '111', '111', '101'], Y: ['101', '101', '010', '010', '010'],
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['110', '001', '010', '100', '111'], '3': ['110', '001', '010', '001', '110'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '110', '001', '110'],
    '6': ['011', '100', '110', '101', '010'], '7': ['111', '001', '010', '010', '010'],
    '8': ['010', '101', '010', '101', '010'], '9': ['010', '101', '011', '001', '110'],
    '!': ['010', '010', '010', '000', '010'], '-': ['000', '000', '111', '000', '000'], ' ': ['000', '000', '000', '000', '000']
  };

  canvas.width = LCD_WIDTH;
  canvas.height = LCD_HEIGHT;
  context.imageSmoothingEnabled = false;

  let snake;
  let food;
  let direction;
  let queuedDirection;
  let score;
  let highScore = readHighScore();
  let gameRunning = false;
  let gamePaused = false;
  let wallsEnabled = false;
  let soundEnabled = false;
  let emergencyMode = 'normal';
  let keypadSequence = '';
  let emergencyMessageUntil = 0;
  let timerId = null;

  function readHighScore() {
    try { return Number.parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0; } catch { return 0; }
  }

  function saveHighScore() {
    try { localStorage.setItem(STORAGE_KEY, String(highScore)); } catch { /* Storage is optional. */ }
  }

  function newGame() {
    const state = createInitialState();
    snake = state.snake;
    direction = state.direction;
    queuedDirection = state.queuedDirection;
    score = state.score;
    food = createFood(snake);
  }

  function createFood(currentSnake = snake) {
    const openCells = [];
    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLUMNS; x += 1) {
        if (!currentSnake.some((segment) => segment.x === x && segment.y === y)) openCells.push({ x, y });
      }
    }
    return openCells[Math.floor(Math.random() * openCells.length)] || null;
  }

  function tickDelay() { return Math.max(70, 185 - Math.floor(score / 4) * 14); }

  function scheduleTick() {
    window.clearTimeout(timerId);
    if (gameRunning && !gamePaused) timerId = window.setTimeout(tick, tickDelay());
  }

  function tick() {
    const nextState = advanceGame({ snake, food, direction, queuedDirection, score, gameRunning }, { wallsEnabled, createFood });
    snake = nextState.snake;
    food = nextState.food;
    direction = nextState.direction;
    queuedDirection = nextState.queuedDirection;
    score = nextState.score;
    if (!nextState.gameRunning) return endGame();
    if (nextState.ateFood) {
      if (score > highScore) { highScore = score; saveHighScore(); }
      beep(620, 0.05);
    }
    render();
    scheduleTick();
  }

  function drawText(text, x, y, color = COLORS.ink) {
    context.fillStyle = color;
    for (let index = 0; index < text.length; index += 1) {
      const glyph = GLYPHS[text[index]] || GLYPHS[' '];
      glyph.forEach((row, rowIndex) => {
        [...row].forEach((pixel, columnIndex) => {
          if (pixel === '1') context.fillRect(x + index * 4 + columnIndex, y + rowIndex, 1, 1);
        });
      });
    }
  }

  function drawLcdBackground() {
    context.fillStyle = COLORS.lcd;
    context.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
    context.fillStyle = COLORS.texture;
    for (let y = 1; y < LCD_HEIGHT; y += 4) {
      for (let x = (y / 4) % 2; x < LCD_WIDTH; x += 7) context.fillRect(x, y, 1, 1);
    }
  }

  function drawFood() {
    if (!food) return;
    const { x, y } = mapGridCellToPixels(food, {
      originX: BOARD_X,
      originY: BOARD_Y,
      cellSize: TILE_SIZE
    });
    context.fillStyle = COLORS.ink;
    context.fillRect(x + 1, y, 1, 3);
    context.fillRect(x, y + 1, 3, 1);
  }

  function drawOverlay(text, x, y) {
    context.fillStyle = COLORS.lcd;
    context.fillRect(x - 1, y - 2, text.length * 4 + 2, 9);
    drawText(text, x, y);
  }

  function drawSnakeSegment(segment, index, segments) {
    const { x, y } = mapGridCellToPixels(segment, {
      originX: BOARD_X,
      originY: BOARD_Y,
      cellSize: TILE_SIZE
    });
    const isHead = index === 0;
    const isTail = index === segments.length - 1;
    let body = COLORS.ink;
    let marking = '#1d2d20';
    if (emergencyMode === 'ambulance') { body = COLORS.ambulance; marking = COLORS.ambulanceRed; }
    if (emergencyMode === 'fire-truck') { body = COLORS.fire; marking = COLORS.fireGold; }
    const connections = getSegmentConnections(segments, index);
    context.fillStyle = body;
    context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    if (!isHead && !isTail) {
      context.fillStyle = marking;
      context.fillRect(x + 1, y + 1, 2, 1);
    }
    if (isHead) {
      context.fillStyle = emergencyMode === 'normal' ? COLORS.lcd : COLORS.ink;
      if (direction.x !== 0) {
        context.fillRect(direction.x > 0 ? x + 3 : x, y + 1, 1, 1);
        context.fillRect(direction.x > 0 ? x + 3 : x, y + 2, 1, 1);
      } else {
        context.fillRect(x + 1, direction.y > 0 ? y + 3 : y, 1, 1);
        context.fillRect(x + 2, direction.y > 0 ? y + 3 : y, 1, 1);
      }
      if (emergencyMode !== 'normal' && Math.floor(Date.now() / 250) % 2 === 0) {
        context.fillStyle = emergencyMode === 'ambulance' ? COLORS.ambulanceRed : COLORS.fireGold;
        context.fillRect(x + 1, y, 2, 1);
      }
    } else if (isTail) {
      const connection = connections[0];
      const freeEnd = { x: -connection.x, y: -connection.y };
      context.fillStyle = COLORS.lcd;
      if (freeEnd.x !== 0) {
        context.fillRect(freeEnd.x > 0 ? x + 3 : x, y, 1, 1);
        context.fillRect(freeEnd.x > 0 ? x + 3 : x, y + 3, 1, 1);
      } else {
        context.fillRect(x, freeEnd.y > 0 ? y + 3 : y, 1, 1);
        context.fillRect(x + 3, freeEnd.y > 0 ? y + 3 : y, 1, 1);
      }
    }
  }

  function render() {
    drawLcdBackground();
    if (wallsEnabled) {
      context.fillStyle = COLORS.ink;
      context.fillRect(BOARD_X - 1, BOARD_Y - 1, 82, 1);
      context.fillRect(BOARD_X - 1, BOARD_Y + 44, 82, 1);
      context.fillRect(BOARD_X - 1, BOARD_Y - 1, 1, 46);
      context.fillRect(BOARD_X + 80, BOARD_Y - 1, 1, 46);
    }
    drawFood();
    snake.forEach(drawSnakeSegment);
    const messageActive = emergencyMessageUntil > Date.now();
    if (messageActive) {
      context.fillStyle = COLORS.lcd;
      context.fillRect(19, 17, 46, 14);
      drawText('EMERGENCY!', 24, 19);
      drawText(`SNEK ${emergencyMode === 'fire-truck' ? 'FIRE' : 'AMB'}`, 24, 25);
      window.requestAnimationFrame(render);
    } else if (gamePaused) drawOverlay('PAUSED', 30, 22);
    else if (!gameRunning && statusDisplay.textContent === 'GAME OVER') drawOverlay('GAME OVER', 25, 22);
    else if (!gameRunning) drawOverlay('PRESS START', 20, 22);
    scoreDisplay.textContent = `SCORE ${String(score).padStart(3, '0')}`;
    highScoreDisplay.textContent = `HI ${String(highScore).padStart(3, '0')}`;
  }

  function startGame() {
    if (gameRunning) return;
    newGame();
    gameRunning = true;
    gamePaused = false;
    startButton.hidden = false;
    startButton.textContent = 'CALL';
    pauseButton.disabled = false;
    pauseButton.textContent = 'PAUSE';
    statusDisplay.textContent = wallsEnabled ? 'WALLS ON' : 'WRAP MODE';
    render();
    scheduleTick();
  }

  function pauseGame() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    pauseButton.textContent = gamePaused ? 'RESUME' : 'PAUSE';
    statusDisplay.textContent = gamePaused ? 'PAUSED' : (wallsEnabled ? 'WALLS ON' : 'WRAP MODE');
    render();
    if (!gamePaused) scheduleTick();
  }

  function restartGame() {
    window.clearTimeout(timerId);
    gameRunning = false;
    startGame();
  }

  function endGame() {
    gameRunning = false;
    window.clearTimeout(timerId);
    statusDisplay.textContent = 'GAME OVER';
    startButton.hidden = false;
    startButton.textContent = 'CALL / PLAY';
    pauseButton.disabled = true;
    beep(150, 0.13);
    render();
  }

  function setDirection(nextDirection) {
    queuedDirection = queueDirection({ direction, queuedDirection }, nextDirection).queuedDirection;
  }

  function beep(frequency, duration) {
    if (!soundEnabled || !window.AudioContext) return;
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.04, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
    oscillator.addEventListener('ended', () => audio.close());
  }

  function playSiren() {
    if (!soundEnabled || !window.AudioContext) return;
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'square';
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    oscillator.frequency.setValueAtTime(660, audio.currentTime);
    oscillator.frequency.setValueAtTime(880, audio.currentTime + 0.12);
    oscillator.frequency.setValueAtTime(660, audio.currentTime + 0.24);
    oscillator.frequency.setValueAtTime(880, audio.currentTime + 0.36);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.48);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.48);
    oscillator.addEventListener('ended', () => audio.close());
  }

  function activateEmergencyIfReady() {
    if (!isEmergencySequenceReady(keypadSequence)) return false;
    keypadSequence = '';
    emergencyMode = nextEmergencyMode(emergencyMode);
    emergencyMessageUntil = Date.now() + 1300;
    statusDisplay.textContent = 'EMERGENCY SNEK ACTIVATED!';
    playSiren();
    render();
    return true;
  }

  document.addEventListener('keydown', (event) => {
    const directions = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 }, '2': { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 }, '8': { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 }, '4': { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 }, '6': { x: 1, y: 0 }
    };
    if (directions[event.key]) { event.preventDefault(); setDirection(directions[event.key]); }
    if (event.key === ' ') { event.preventDefault(); pauseGame(); }
  });

  directionalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const directions = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
      setDirection(directions[button.dataset.direction]);
    });
  });
  keypadButtons.forEach((button) => button.addEventListener('click', () => {
    keypadSequence = recordKeypadDigit(keypadSequence, button.dataset.keypadDigit);
  }));
  startButton.addEventListener('click', () => {
    const activated = activateEmergencyIfReady();
    if (!gameRunning) startGame();
    if (!activated && gameRunning) render();
  });
  pauseButton.addEventListener('click', pauseGame);
  restartButton.addEventListener('click', restartGame);
  wallsButton.addEventListener('click', () => {
    wallsEnabled = !wallsEnabled;
    wallsButton.textContent = wallsEnabled ? 'WALLS: ON' : 'WALLS: OFF';
    statusDisplay.textContent = wallsEnabled ? 'WALLS ON' : 'WRAP MODE';
    render();
  });
  muteButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    muteButton.textContent = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
    if (soundEnabled) beep(440, 0.04);
  });

  newGame();
  render();
})();
