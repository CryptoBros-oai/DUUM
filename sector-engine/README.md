# Sector Engine

A lightweight 2.5D engine for games, visualizations, and simulations.  
Designed for budget hardware with clever algorithms over brute force.

> *"They did that on a **what** with a **what**?"*

## Philosophy

Sector Engine takes inspiration from classic 2.5D games like Doom, but with modern sensibilities:

- **Compact Data** - Worlds are 2D grids with height information, not full 3D geometry
- **CPU-First Rendering** - Software raycasting that runs anywhere, GPU optional
- **Fog of War** - Real line-of-sight visibility, not just "have you been here"
- **Data-Driven** - Levels, entities, behaviors defined in JSON - engine doesn't know what a "monster" is
- **Pluggable Renderers** - Same world renders to Canvas2D, WebGL, ASCII, or audio

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                     │
│         (Games, Visualizers, Simulations, Tools)        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                     ENGINE CORE                          │
├─────────────┬─────────────┬─────────────┬───────────────┤
│   World     │  Renderer   │  Visibility │    Input      │
│  Manager    │  (Pluggable)│   System    │   Handler     │
├─────────────┼─────────────┼─────────────┼───────────────┤
│ • Sectors   │ • Canvas2D  │ • Raycaster │ • Keyboard    │
│ • Regions   │ • WebGL2    │ • Fog/War   │ • Mouse       │
│ • Entities  │ • ASCII     │ • LOS Cache │ • Touch       │
│ • Portals   │ • Audio     │ • Occlusion │ • Gamepad     │
└─────────────┴─────────────┴─────────────┴───────────────┘
```

## Modules

### Core

- **World** (`engine/core/world.js`) - Sector grid, regions, spatial queries
- **Visibility** (`engine/core/visibility.js`) - Raycasting, fog of war, line of sight
- **Movement** (`engine/core/movement.js`) - Collision detection, wall sliding
- **Entity** (`engine/core/entity.js`) - Things that exist in the world + spatial indexing

### Input

- **Input** (`engine/input/input.js`) - Unified keyboard, mouse, pointer lock

### Renderers

- **Canvas2DRenderer** (`engine/renderers/canvas2d.js`) - Software raycaster, works everywhere
- **MinimapRenderer** (`engine/renderers/minimap.js`) - Top-down tactical view

### Main

- **SectorEngine** (`engine/engine.js`) - Ties everything together, manages game loop

## Quick Start

```javascript
import SectorEngine from './engine/engine.js';

// Create engine
const engine = new SectorEngine({
  width: 32,
  height: 32,
  playerSpeed: 3.0
});

// Define sector types
engine.world.registerSectorTypes({
  floor: { walkable: true, wallColor: [100, 100, 100], ... },
  wall: { walkable: false, wallColor: [80, 80, 80], ... }
});

// Build level
engine.world.fillRect(0, 0, 31, 31, 'wall');
engine.world.fillRect(5, 5, 25, 25, 'floor');

// Initialize with canvas
engine.init(
  document.getElementById('game-canvas'),
  document.getElementById('minimap-canvas')
);

// Set player position
engine.setPlayerPosition(15, 15, 0);

// Start!
engine.start();
```

## Potential Applications

### Gaming
- Exploration games
- Dungeon crawlers / roguelikes  
- Horror games (fog of war = tension)
- Educational (explore historical sites)
- Tactical games

### Visualization
- Architectural walkthroughs
- Data center / facility mapping
- Warehouse inventory
- Network topology (rooms = nodes)

### Research / Simulation
- AI pathfinding testbed
- Visibility algorithm research
- Robotics sensor simulation
- Spatial cognition studies

### Accessibility
- Runs on potato hardware
- Zero GPU requirement
- Browser-based, no install
- Could add audio-spatial rendering

## Demos

### Installation Alpha
E1M1-inspired test level demonstrating all core features.

Open `demos/installation-alpha/index.html` in a browser.

Controls:
- WASD - Move
- Mouse / Arrow Keys - Look
- Shift - Run
- Click - Engage mouse look
- Escape - Release mouse

## Performance Notes

The engine is designed for budget hardware:

- 320 rays/frame is plenty for smooth visuals
- Visibility uses 180 rays for fog of war (separate from rendering)
- Fixed timestep (1/60s) with variable render means consistent physics at any framerate
- Spatial hash for entity queries is O(1) for nearby lookups

On a 2GB mobile GPU, this barely registers. The limiting factor is usually vsync, not computation.

## Future Development

- [ ] WebGL2 renderer (batch walls in single draw call)
- [ ] Procedural level generation
- [ ] Sprites (billboarded entities)
- [ ] Dynamic lighting
- [ ] Audio spatialization
- [ ] ASCII renderer
- [ ] Network multiplayer support
- [ ] Level editor

## License

MIT - Use it for whatever you want.

---

*Built with the Carmack spirit: clever > brute force*
