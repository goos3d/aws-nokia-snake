## Nokia Snake Game Specification

### Overview
A single-player implementation of the classic Snake game, styled to mimic the look and feel of the Nokia 3310.

### Technical Requirements
- **Framework**: Vanilla HTML, CSS, and JavaScript
- **Rendering**: HTML5 Canvas
- **Design**: Monochrome green LCD appearance with chunky pixel graphics
- **Responsiveness**: Works on desktop and mobile browsers

### Gameplay Features
1. **Game Screen**:
   - Dark pixelated snake and food against a pale green background
   - Retro Nokia-style border and interface elements
2. **Movement**:
   - Grid-based movement with four directions (Up, Down, Left, Right)
   - Keyboard controls: Arrow keys or WASD
   - Optional mobile directional controls
3. **Game Mechanics**:
   - Food increases snake's length and score
   - Snake speeds up gradually as the score increases
   - Collision with snake's body or optional walls ends the game
   - Classic Nokia-style wall wrapping on the grid
4. **User Interface**:
   - Start, pause, restart options
   - High-score tracking
   - Optional sound effects with mute toggle
5. **Technical Requirements**:
   - No frameworks, backend, or external dependencies
   - Fully functional offline

### Acceptance Criteria
- The game should render a grid that mimics the Nokia 3310's green LCD appearance.
- The snake should move according to player input without passing through its own body.
- The game should increase in difficulty as the snake grows.
- All controls should be responsive and the game should be fully playable on both desktop and mobile browsers.
- The game should save and display the highest score achieved in a single session.
- The game should wrap the screen edges as per classic Nokia Snake behavior.
- The game should provide options to start, pause, restart, and mute sound effects.