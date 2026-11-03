(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const context = canvas.getContext('2d');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const highScoreDisplay = document.getElementById('highScoreDisplay');
  const statusDisplay = document.getElementById('statusDisplay');
  const startButton = document.getElementById('startButton');
  const pauseButton = document.getElementById('pauseButton');
  const restartButton = document.getElementById('restartButton');
  const wallsButton = document.getElementById('wallsButton');
  const muteButton = document.getElementById('muteButton');
  const directionalButtons = document.querySelectorAll('[data-direction]');

  const { GRID_SIZE, createInitialState, isOutside, queueDirection, advanceGame } = window.NokiaSnakeCore;
  const TILE_SIZE = 18;
  const CANVAS_SIZE = GRID_SIZE * TILE_SIZE;
  const STORAGE_KEY = 'nokia-snake-high-score';
  const COLORS = {
    background: '#b8c995',
    grid: '#a9bb88',
    ink: '#263b29',
    food: '#496047'
  };

  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

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
  let timerId = null;

  function readHighScore() {
    try {
      return Number.parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore() {
    try {
      localStorage.setItem(STORAGE_KEY, String(highScore));
    } catch {
      // The game remains usable if browser storage is unavailable.
    }
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
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        if (!currentSnake.some((segment) => segment.x === x && segment.y === y)) {
          openCells.push({ x, y });
        }
      }
    }
    return openCells[Math.floor(Math.random() * openCells.length)] || null;
  }

  function tickDelay() {
    return Math.max(70, 185 - Math.floor(score / 4) * 14);
  }

  function scheduleTick() {
    window.clearTimeout(timerId);
    if (gameRunning && !gamePaused) {
      timerId = window.setTimeout(tick, tickDelay());
    }
  }

  function tick() {
    const nextState = advanceGame({
      snake,
      food,
      direction,
      queuedDirection,
      score,
      gameRunning
    }, {
      wallsEnabled,
      createFood
    });

    snake = nextState.snake;
    food = nextState.food;
    direction = nextState.direction;
    queuedDirection = nextState.queuedDirection;
    score = nextState.score;

    if (!nextState.gameRunning) {
      endGame();
      return;
    }

    if (nextState.ateFood) {
      if (score > highScore) {
        highScore = score;
        saveHighScore();
      }
      beep(620, 0.05);
    }

    render();
    scheduleTick();
  }

  function render() {
    context.fillStyle = COLORS.background;
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    context.fillStyle = COLORS.grid;
    for (let line = TILE_SIZE; line < CANVAS_SIZE; line += TILE_SIZE) {
      context.fillRect(line, 0, 1, CANVAS_SIZE);
      context.fillRect(0, line, CANVAS_SIZE, 1);
    }

    if (food) {
      context.fillStyle = COLORS.food;
      context.fillRect(food.x * TILE_SIZE + 4, food.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    }

    snake.forEach((segment, index) => {
      context.fillStyle = COLORS.ink;
      const inset = index === 0 ? 2 : 3;
      context.fillRect(
        segment.x * TILE_SIZE + inset,
        segment.y * TILE_SIZE + inset,
        TILE_SIZE - inset * 2,
        TILE_SIZE - inset * 2
      );
    });

    scoreDisplay.textContent = `SCORE ${String(score).padStart(3, '0')}`;
    highScoreDisplay.textContent = `HI ${String(highScore).padStart(3, '0')}`;
  }

  function startGame() {
    if (gameRunning) return;
    newGame();
    gameRunning = true;
    gamePaused = false;
    startButton.hidden = true;
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
    startButton.textContent = 'PLAY AGAIN';
    pauseButton.disabled = true;
    beep(150, 0.13);
    render();
  }

  function setDirection(nextDirection) {
    const nextState = queueDirection({ direction, queuedDirection }, nextDirection);
    queuedDirection = nextState.queuedDirection;
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
  }

  document.addEventListener('keydown', (event) => {
    const directions = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 }, '2': { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 }, '8': { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 }, '4': { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 }, '6': { x: 1, y: 0 }
    };
    if (directions[event.key]) {
      event.preventDefault();
      setDirection(directions[event.key]);
    }
    if (event.key === ' ') {
      event.preventDefault();
      pauseGame();
    }
  });

  directionalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const directions = {
        up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
      };
      setDirection(directions[button.dataset.direction]);
    });
  });

  startButton.addEventListener('click', startGame);
  pauseButton.addEventListener('click', pauseGame);
  restartButton.addEventListener('click', restartGame);
  wallsButton.addEventListener('click', () => {
    wallsEnabled = !wallsEnabled;
    wallsButton.textContent = wallsEnabled ? 'WALLS: ON' : 'WALLS: OFF';
    statusDisplay.textContent = wallsEnabled ? 'WALLS ON' : 'WRAP MODE';
  });
  muteButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    muteButton.textContent = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
    if (soundEnabled) beep(440, 0.04);
  });

  newGame();
  render();
})();
