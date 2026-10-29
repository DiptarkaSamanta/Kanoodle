# Kanoodle 3D 🧩

A premium, tactile, colorful 3D web puzzle game inspired by the classic **Kanoodle** brain teaser by Educational Insights.

![Kanoodle 3D Preview](./screenshot.png)

## ✨ Features

- **True 3D Glossy Pieces**: 12 unique polysphere pieces (A through L) modeled with Three.js physical materials (`MeshPhysicalMaterial`), featuring realistic clearcoat, candy lacquer shine, bridge connectors, and socket drop shadows.
- **2D Tray & 3D Pyramid Modes**:
  - **2D Flat Tray**: The classic 11×5 grid (55 holes) where all 12 pieces fit seamlessly.
  - **3D Pyramid Mode**: 5-tier pyramid puzzle board with interactive layer placement.
- **Smart Exact-Cover (Algorithm X) Solver**:
  - Built-in exact-cover solver executing in under 20ms.
  - **Hint (💡)**: Solves remaining pieces and places 1 piece to nudge you forward.
  - **Auto-Solve (⚡)**: Animates placing all remaining pieces step-by-step.
  - **Validate (🔍)**: Verifies whether your current arrangement has a valid solution.
- **Curated Challenges & Infinite Generator**:
  - 24 built-in levels spanning **Starter**, **Junior**, **Expert**, **Master**, and **Genius**.
  - **Random Challenge (🎲)**: Generates solvable puzzles on demand.
  - **Free Play**: Empty board to experiment with your own custom configurations.
- **Tactile Procedural Audio Engine**:
  - Zero external MP3 files! Built with Web Audio API for ultra-responsive sound:
    - Marble drop clack
    - Piece lift pop
    - Rotate swoosh
    - Victory fanfare
- **Interactive Controls**:
  - Left click pieces in tray to select.
  - **R** or **Mouse Wheel** to rotate 90°.
  - **F** to flip/mirror.
  - Left click on board to snap and place.
  - Click any placed piece on the board to pick it back up.
  - **Esc** or Right-click to cancel/deselect.
  - Right click + drag to orbit 3D camera; scroll to zoom.
  - Preset camera buttons (Isometric 3D, Top-Down, Front Angle).
- **Celebration & Stats**:
  - Confetti burst upon puzzle completion.
  - Star rating (3 stars for 0 hints, 2 stars for 1 hint, 1 star for 2+ hints).
  - Timer and move counter.

## 🚀 Running Locally

You can run Kanoodle with any static HTTP server. For example:

### Using Python:
```bash
python -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.

### Using Node.js:
```bash
npx serve .
```

## 🛠️ Tech Stack

- **Graphics**: [Three.js](https://threejs.org/) (WebGL 3D engine with soft shadow maps and physical materials)
- **Controls**: `OrbitControls.js`
- **Effects**: `canvas-confetti`
- **Audio**: Web Audio API procedural synthesizer
- **Styling**: Vanilla CSS with glassmorphism design system
- **Algorithms**: Knuth's Algorithm X (Exact Cover / DLX)
