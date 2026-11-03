(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.NokiaSnakeCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const GRID_COLUMNS = 20;
  const GRID_ROWS = 11;
  const INITIAL_SNAKE = [
    { x: 10, y: 5 },
    { x: 9, y: 5 },
    { x: 8, y: 5 }
  ];
  const INITIAL_DIRECTION = { x: 1, y: 0 };
  const EMERGENCY_SEQUENCE = '911';
  const EMERGENCY_MODES = ['normal', 'ambulance', 'fire-truck'];

  function createInitialState(food) {
    return {
      snake: INITIAL_SNAKE.map((segment) => ({ ...segment })),
      food,
      direction: { ...INITIAL_DIRECTION },
      queuedDirection: { ...INITIAL_DIRECTION },
      score: 0,
      gameRunning: false
    };
  }

  function isOutside(cell, gridColumns = GRID_COLUMNS, gridRows = GRID_ROWS) {
    return cell.x < 0 || cell.x >= gridColumns || cell.y < 0 || cell.y >= gridRows;
  }

  function queueDirection(state, nextDirection) {
    const isOpposite = nextDirection.x === -state.direction.x && nextDirection.y === -state.direction.y;
    return isOpposite ? state : { ...state, queuedDirection: { ...nextDirection } };
  }

  function advanceGame(state, { wallsEnabled = false, gridColumns = GRID_COLUMNS, gridRows = GRID_ROWS, createFood } = {}) {
    const direction = state.queuedDirection;
    const currentHead = state.snake[0];
    const nextHead = {
      x: currentHead.x + direction.x,
      y: currentHead.y + direction.y
    };

    if (wallsEnabled && isOutside(nextHead, gridColumns, gridRows)) {
      return { ...state, direction: { ...direction }, gameRunning: false, gameOver: 'wall' };
    }

    nextHead.x = (nextHead.x + gridColumns) % gridColumns;
    nextHead.y = (nextHead.y + gridRows) % gridRows;

    const ateFood = state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;
    const bodyToCheck = ateFood ? state.snake : state.snake.slice(0, -1);
    if (bodyToCheck.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)) {
      return { ...state, direction: { ...direction }, gameRunning: false, gameOver: 'self' };
    }

    const snake = [{ ...nextHead }, ...state.snake];
    const score = state.score + (ateFood ? 1 : 0);
    const food = ateFood ? (createFood ? createFood(snake) : null) : state.food;
    if (!ateFood) snake.pop();

    return {
      ...state,
      snake,
      food,
      direction: { ...direction },
      queuedDirection: { ...direction },
      score,
      gameRunning: state.gameRunning,
      gameOver: null,
      ateFood: Boolean(ateFood)
    };
  }

  function mapGridCellToPixels(cell, { originX = 0, originY = 0, cellSize = 1 } = {}) {
    return {
      x: originX + cell.x * cellSize,
      y: originY + cell.y * cellSize,
      width: cellSize,
      height: cellSize
    };
  }

  function gridDirection(from, to, gridColumns = GRID_COLUMNS, gridRows = GRID_ROWS) {
    let x = to.x - from.x;
    let y = to.y - from.y;
    if (x === gridColumns - 1) x = -1;
    if (x === -(gridColumns - 1)) x = 1;
    if (y === gridRows - 1) y = -1;
    if (y === -(gridRows - 1)) y = 1;
    return { x, y };
  }

  function getSegmentConnections(snake, index, gridColumns = GRID_COLUMNS, gridRows = GRID_ROWS) {
    const connections = [];
    if (index > 0) connections.push(gridDirection(snake[index], snake[index - 1], gridColumns, gridRows));
    if (index < snake.length - 1) connections.push(gridDirection(snake[index], snake[index + 1], gridColumns, gridRows));
    return connections;
  }

  function recordKeypadDigit(sequence, digit) {
    const candidate = `${sequence || ''}${digit}`;
    if (EMERGENCY_SEQUENCE.startsWith(candidate)) return candidate;
    return EMERGENCY_SEQUENCE.startsWith(String(digit)) ? String(digit) : '';
  }

  function isEmergencySequenceReady(sequence) {
    return sequence === EMERGENCY_SEQUENCE;
  }

  function nextEmergencyMode(mode) {
    const currentIndex = EMERGENCY_MODES.indexOf(mode);
    return EMERGENCY_MODES[(currentIndex + 1) % EMERGENCY_MODES.length];
  }

  function shouldHandleClick(lastPointerPress, currentTime, suppressionWindow = 700) {
    return currentTime - lastPointerPress >= suppressionWindow;
  }

  return {
    GRID_COLUMNS,
    GRID_ROWS,
    EMERGENCY_SEQUENCE,
    EMERGENCY_MODES,
    createInitialState,
    isOutside,
    mapGridCellToPixels,
    gridDirection,
    getSegmentConnections,
    queueDirection,
    advanceGame,
    recordKeypadDigit,
    isEmergencySequenceReady,
    nextEmergencyMode,
    shouldHandleClick
  };
});
