# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sector Engine is a lightweight 2.5D game engine inspired by classic games like Doom. It uses software raycasting and is designed to run on low-end hardware without GPU requirements. The codebase is pure JavaScript with ES modules, running directly in browsers without a build step.

## Running the Demo

Open `sector-engine/demos/installation-alpha/index.html` in a browser. No build process or server required.

For the standalone demo files in the root directory (e.g., `sector-engine-lighting-audio.html`, `sector-engine-sprites.html`), open them directly in a browser.

## Architecture

The engine follows a modular design with clear separation of concerns:

```
sector-engine/engine/
├── engine.js           # Main SectorEngine class - ties everything together, game loop
├── core/
│   ├── world.js        # 2D grid of sectors, sector types, regions
│   ├── visibility.js   # Raycasting, fog of war, line of sight
│   ├── movement.js     # Collision detection, wall sliding
│   └── entity.js       # Entity class + EntityManager with spatial hash
├── input/
│   └── input.js        # Keyboard, mouse, pointer lock handling
└── renderers/
    ├── canvas2d.js     # Software raycaster using Canvas2D
    └── minimap.js      # Top-down tactical view
```

### Key Design Patterns

**Sector-based world**: The world is a 2D grid where each cell contains a sector type key (string). Sector type definitions (floor height, ceiling height, colors, walkability) are stored separately in a Map, allowing memory-efficient levels.

**Pluggable renderers**: Renderers implement a common interface (`init`, `setWorld`, `render`). The engine doesn't depend on specific rendering technology.

**Data-driven entities**: The engine doesn't know what a "player" or "monster" is. Entities are generic objects with positions, properties, and optional behaviors. Applications define entity types through composition.

**Fog of war**: True line-of-sight visibility, not just "have you been here". The `Visibility` system maintains both current visibility (per-frame) and discovery state (persistent).

**Fixed timestep game loop**: Physics runs at a fixed rate (1/60s by default) with variable render. This ensures consistent gameplay regardless of framerate.

### Module Relationships

- `SectorEngine` creates and coordinates all systems
- `World` is the source of truth for level geometry
- `Visibility` queries `World` for walkability during raycasting
- `Movement` queries `World` for collision detection
- `EntityManager` uses a spatial hash for O(1) nearby entity queries
- Renderers receive `World` and `Visibility` references to determine what to draw

## Code Conventions

- All modules use ES6 class syntax with JSDoc comments
- Event emitter pattern (`on`, `off`, `_emit`) for decoupled communication
- Serialize/deserialize methods for save game support
- Configuration objects with sensible defaults in constructors
- Colors are [R, G, B] arrays (0-255)

## Important Files

- `sector-engine/demos/installation-alpha/index.html` - Standalone demo with inlined engine code (useful reference for seeing complete integration)
- `sector-engine/demos/installation-alpha/level.js` - Example level definition with sector types and regions
- Root directory contains experimental versions (`sector-engine-lighting-audio.html`, `sector-engine-sprites.html`) that are monolithic HTML files with all code inlined
