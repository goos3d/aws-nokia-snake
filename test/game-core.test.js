'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  GRID_COLUMNS,
  GRID_ROWS,
  createInitialState,
  queueDirection,
  advanceGame,
  recordKeypadDigit,
  isEmergencySequenceReady,
  nextEmergencyMode,
  mapGridCellToPixels,
  getSegmentConnections
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
  const state = runningState({ food: { x: 11, y: 5 } });
  const result = advanceGame(state, { createFood: () => ({ x: 0, y: 0 }) });
  assert.equal(result.snake.length, 4);
  assert.equal(result.score, 1);
  assert.deepEqual(result.food, { x: 0, y: 0 });
  assert.equal(result.ateFood, true);
});

test('ends the game when the snake hits a wall in wall mode', () => {
  const state = runningState({
    snake: [{ x: GRID_COLUMNS - 1, y: 4 }, { x: GRID_COLUMNS - 2, y: 4 }],
    direction: directions.right,
    queuedDirection: directions.right
  });
  const result = advanceGame(state, { wallsEnabled: true });
  assert.equal(result.gameRunning, false);
  assert.equal(result.gameOver, 'wall');
});

test('wraps at game boundaries when wall mode is disabled', () => {
  const state = runningState({
    snake: [{ x: GRID_COLUMNS - 1, y: 4 }, { x: GRID_COLUMNS - 2, y: 4 }],
    direction: directions.right,
    queuedDirection: directions.right
  });
  const result = advanceGame(state);
  assert.equal(result.gameRunning, true);
  assert.deepEqual(result.snake[0], { x: 0, y: 4 });
});

test('wraps at the top and bottom landscape boundaries', () => {
  const upState = runningState({
    snake: [{ x: 4, y: 0 }, { x: 4, y: 1 }],
    direction: directions.up,
    queuedDirection: directions.up
  });
  const downState = runningState({
    snake: [{ x: 4, y: GRID_ROWS - 1 }, { x: 4, y: GRID_ROWS - 2 }],
    direction: directions.down,
    queuedDirection: directions.down
  });
  assert.deepEqual(advanceGame(upState).snake[0], { x: 4, y: GRID_ROWS - 1 });
  assert.deepEqual(advanceGame(downState).snake[0], { x: 4, y: 0 });
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

test('creates a reset-ready landscape game state', () => {
  const state = createInitialState({ x: 0, y: 0 });
  assert.deepEqual(state.snake, [{ x: 10, y: 5 }, { x: 9, y: 5 }, { x: 8, y: 5 }]);
  assert.deepEqual(state.direction, directions.right);
  assert.equal(state.score, 0);
  assert.equal(state.gameRunning, false);
  assert.deepEqual(state.food, { x: 0, y: 0 });
});

test('recognizes the 9, 1, 1 emergency keypad sequence only in order', () => {
  let sequence = '';
  for (const digit of ['9', '1', '1']) sequence = recordKeypadDigit(sequence, digit);
  assert.equal(sequence, '911');
  assert.equal(isEmergencySequenceReady(sequence), true);
});

test('rejects incorrect emergency keypad sequences', () => {
  let sequence = '';
  for (const digit of ['1', '1', '9']) sequence = recordKeypadDigit(sequence, digit);
  assert.equal(isEmergencySequenceReady(sequence), false);

  sequence = '';
  for (const digit of ['9', '1', '9']) sequence = recordKeypadDigit(sequence, digit);
  assert.equal(isEmergencySequenceReady(sequence), false);
});

test('cycles emergency appearances from normal through ambulance and fire truck', () => {
  assert.equal(nextEmergencyMode('normal'), 'ambulance');
  assert.equal(nextEmergencyMode('ambulance'), 'fire-truck');
  assert.equal(nextEmergencyMode('fire-truck'), 'normal');
});

test('maps every 20 by 11 grid cell to a contiguous 80 by 44 playfield', () => {
  const mappedCells = [];
  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLUMNS; x += 1) {
      mappedCells.push(mapGridCellToPixels({ x, y }, { originX: 2, originY: 2, cellSize: 4 }));
    }
  }
  assert.deepEqual(mappedCells[0], { x: 2, y: 2, width: 4, height: 4 });
  assert.deepEqual(mappedCells.at(-1), { x: 78, y: 42, width: 4, height: 4 });
  assert.equal(mappedCells[0].x + mappedCells[0].width, mappedCells[1].x);
  assert.equal(mappedCells[0].y + mappedCells[0].height, mappedCells[GRID_COLUMNS].y);
  assert.equal(new Set(mappedCells.map((cell) => cell.x)).size, GRID_COLUMNS);
  assert.equal(new Set(mappedCells.map((cell) => cell.y)).size, GRID_ROWS);
});

test('maps edge food cells to the visible playfield edges', () => {
  const topLeftFood = mapGridCellToPixels({ x: 0, y: 0 }, { originX: 2, originY: 2, cellSize: 4 });
  const bottomRightFood = mapGridCellToPixels({ x: 19, y: 10 }, { originX: 2, originY: 2, cellSize: 4 });
  assert.deepEqual(topLeftFood, { x: 2, y: 2, width: 4, height: 4 });
  assert.deepEqual(bottomRightFood, { x: 78, y: 42, width: 4, height: 4 });
  assert.equal(bottomRightFood.x + bottomRightFood.width, 82);
  assert.equal(bottomRightFood.y + bottomRightFood.height, 46);
});

test('reports connected straight and corner sprite directions, including wrapped edges', () => {
  const straight = [{ x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 }];
  assert.deepEqual(getSegmentConnections(straight, 1), [{ x: 1, y: 0 }, { x: -1, y: 0 }]);

  const corner = [{ x: 5, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 5 }];
  assert.deepEqual(getSegmentConnections(corner, 1), [{ x: 1, y: 0 }, { x: 0, y: 1 }]);

  const wrapped = [{ x: 0, y: 4 }, { x: GRID_COLUMNS - 1, y: 4 }];
  assert.deepEqual(getSegmentConnections(wrapped, 0), [{ x: -1, y: 0 }]);
});
