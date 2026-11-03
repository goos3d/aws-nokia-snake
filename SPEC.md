## Snek Snake Game Specification

### Overview
A single-player implementation of the classic Snake game, styled to mimic the look and feel of the Nokia 3310.

### Technical Requirements
- **Framework**: Vanilla HTML, CSS, and JavaScript
- **Rendering**: HTML5 Canvas using an 84 × 48 logical LCD framebuffer and nearest-neighbor scaling; the playable area is a 20 × 11 landscape grid with 4 × 4 pixel cells.
- **Design**: Monochrome green-gray LCD appearance with bitmap text, discrete inactive-pixel texture, and chunky pixel graphics
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
6. **Emergency Snek Easter Egg**:
   - Enter `9`, `1`, `1` on the on-screen numeric keypad, then press **CALL / START**.
   - The page-session mode cycles Normal → Ambulance → Fire Truck → Normal.
   - Emergency appearances keep the existing game engine behavior while adding pixel-art vehicle colors and a flashing head beacon.
   - Activation uses a short synthesized siren only when sound is enabled; it has no telephone, external-asset, or network functionality.

### Acceptance Criteria
- The game should render a grid that mimics the Nokia 3310's green LCD appearance.
- The snake should move according to player input without passing through its own body.
- The game should increase in difficulty as the snake grows.
- All controls should be responsive and the game should be fully playable on both desktop and mobile browsers.
- The game should save and display the highest score achieved in a single session.
- The game should wrap the screen edges as per classic Nokia Snake behavior.
- The game should provide options to start, pause, restart, and mute sound effects.
- The LCD should remain legible at responsive sizes with crisp, non-antialiased pixels.
- Emergency Snek must activate only from the keypad `9 → 1 → 1` sequence followed by CALL / START, and must cycle its three appearances correctly.
