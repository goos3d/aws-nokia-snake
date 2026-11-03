'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  GRID_SIZE,
  createInitialState,
  queueDirection,
  advanceGame
} = require('../game-core.js');

const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

function runningState(overrides = {}) {
  return { ...createInitialState(), gameRunning: true, ...overrides };
}

test('moves the snake in all four directions', () => {
  for (const [name, direction] of Object.entries(directions)) {
    const state = runningState({
      snake: [
        { x: 8, y: 8 },
        { x: 8 - direction.x, y: 8 - direction.y },
        { x: 8 - direction.x * 2, y: 8 - direction.y * 2 }
      ],
      direction,
      queuedDirection: direction
    });
    const result = advanceGame(state);
    assert.deepEqual(result.snake[0], { x: 8 + direction.x, y: 8 + direction.y }, name);
  }
});

test('prevents an immediate 180-degree reversal', () => {
  const state = runningState();
  const result = queueDirection(state, directions.left);
  assert.deepEqual(result.queuedDirection, directions.right);
});

test('food consumption grows the snake and increments the score', () => {
  const state = runningState({ food: { x: 9, y: 8 } });
  const result = advanceGame(state, { createFood: () => ({ x: 0, y: 0 }) });
  assert.equal(result.snake.length, 4);
  assert.equal(result.score, 1);
  assert.deepEqual(result.food, { x: 0, y: 0 });
  assert.equal(result.ateFood, true);
});

test('ends the game when the snake hits a wall in wall mode', () => {
  const state = runningState({
    snake: [{ x: GRID_SIZE - 1, y: 4 }, { x: GRID_SIZE - 2, y: 4 }],
    direction: directions.right,
    queuedDirection: directions.right
  });
  const result = advanceGame(state, { wallsEnabled: true });
  assert.equal(result.gameRunning, false);
  assert.equal(result.gameOver, 'wall');
});

test('wraps at game boundaries when wall mode is disabled', () => {
  const state = runningState({
    snake: [{ x: GRID_SIZE - 1, y: 4 }, { x: GRID_SIZE - 2, y: 4 }],
    direction: directions.right,
    queuedDirection: directions.right
  });
  const result = advanceGame(state);
  assert.equal(result.gameRunning, true);
  assert.deepEqual(result.snake[0], { x: 0, y: 4 });
});

test('ends the game on self-collision', () => {
  const state = runningState({
    snake: [{ x: 3, y: 3 }, { x: 3, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 3 }],
    direction: directions.down,
    queuedDirection: directions.down
  });
  const result = advanceGame(state);
  assert.equal(result.gameRunning, false);
  assert.equal(result.gameOver, 'self');
});

test('creates a reset-ready initial game state', () => {
  const state = createInitialState({ x: 0, y: 0 });
  assert.deepEqual(state.snake, [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]);
  assert.deepEqual(state.direction, directions.right);
  assert.equal(state.score, 0);
  assert.equal(state.gameRunning, false);
  assert.deepEqual(state.food, { x: 0, y: 0 });
});
