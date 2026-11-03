(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.NokiaSnakeCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const GRID_SIZE = 16;
  const INITIAL_SNAKE = [
    { x: 8, y: 8 },
    { x: 7, y: 8 },
    { x: 6, y: 8 }
  ];
  const INITIAL_DIRECTION = { x: 1, y: 0 };

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

  function isOutside(cell, gridSize = GRID_SIZE) {
    return cell.x < 0 || cell.x >= gridSize || cell.y < 0 || cell.y >= gridSize;
  }

  function queueDirection(state, nextDirection) {
    const isOpposite = nextDirection.x === -state.direction.x && nextDirection.y === -state.direction.y;
    return isOpposite ? state : { ...state, queuedDirection: { ...nextDirection } };
  }

  function advanceGame(state, { wallsEnabled = false, gridSize = GRID_SIZE, createFood } = {}) {
    const direction = state.queuedDirection;
    const currentHead = state.snake[0];
    const nextHead = {
      x: currentHead.x + direction.x,
      y: currentHead.y + direction.y
    };

    if (wallsEnabled && isOutside(nextHead, gridSize)) {
      return { ...state, direction: { ...direction }, gameRunning: false, gameOver: 'wall' };
    }

    nextHead.x = (nextHead.x + gridSize) % gridSize;
    nextHead.y = (nextHead.y + gridSize) % gridSize;

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

  return { GRID_SIZE, createInitialState, isOutside, queueDirection, advanceGame };
});
