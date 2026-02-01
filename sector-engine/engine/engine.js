/**
 * SECTOR ENGINE
 * 
 * A lightweight 2.5D engine for games, visualizations, and simulations.
 * Designed for budget hardware with clever algorithms over brute force.
 * 
 * Core features:
 * - Sector-based world representation
 * - Fog of war with line-of-sight
 * - Pluggable renderers (Canvas2D, WebGL, ASCII)
 * - Entity system
 * - Fixed timestep game loop
 * 
 * Usage:
 *   const engine = new SectorEngine({ width: 32, height: 32 });
 *   engine.world.registerSectorTypes({ ... });
 *   engine.init(document.getElementById('game-canvas'));
 *   engine.start();
 */

import { World } from './core/world.js';
import { Visibility } from './core/visibility.js';
import { Movement } from './core/movement.js';
import { Entity, EntityManager } from './core/entity.js';
import { Input } from './input/input.js';
import { Canvas2DRenderer } from './renderers/canvas2d.js';
import { MinimapRenderer } from './renderers/minimap.js';

export class SectorEngine {
  constructor(config = {}) {
    // World configuration
    this.config = {
      worldWidth: config.width || config.worldWidth || 32,
      worldHeight: config.height || config.worldHeight || 32,
      
      // Timing
      fixedTimestep: config.fixedTimestep || 1/60,
      maxFrameTime: config.maxFrameTime || 0.25,
      
      // Rendering
      fov: config.fov || Math.PI * 0.6,
      viewDistance: config.viewDistance || 14,
      rayCount: config.rayCount || 320,
      
      // Player defaults
      playerSpeed: config.playerSpeed || 3.0,
      playerRadius: config.playerRadius || 0.2,
      
      ...config
    };
    
    // Core systems
    this.world = new World({
      width: this.config.worldWidth,
      height: this.config.worldHeight
    });
    
    this.visibility = new Visibility(this.world, {
      viewDistance: this.config.viewDistance
    });
    
    this.movement = new Movement(this.world);
    
    this.entities = new EntityManager(this.world);
    
    this.input = new Input({
      mouseSensitivity: config.mouseSensitivity || 0.002
    });
    
    // Renderers (set up in init)
    this.renderer = null;
    this.minimapRenderer = null;
    
    // Player entity
    this.player = null;
    
    // Game loop state
    this.running = false;
    this.accumulator = 0;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fpsTime = 0;
    this.currentFPS = 0;
    
    // Callbacks
    this.onUpdate = null;  // (dt) => void - called each fixed update
    this.onRender = null;  // () => void - called each render frame
    this.onInit = null;    // () => void - called after init
    
    // Event listeners
    this.listeners = {
      update: [],
      render: [],
      start: [],
      stop: []
    };
  }
  
  /**
   * Initialize the engine with canvas elements
   * @param {HTMLCanvasElement} mainCanvas - Main game view canvas
   * @param {HTMLCanvasElement} minimapCanvas - Optional minimap canvas
   * @param {Object} options - Additional options
   */
  init(mainCanvas, minimapCanvas = null, options = {}) {
    // Set up renderer
    const RendererClass = options.renderer || Canvas2DRenderer;
    this.renderer = new RendererClass({
      rayCount: this.config.rayCount,
      fov: this.config.fov,
      ...options.rendererConfig
    });
    this.renderer.init(mainCanvas);
    this.renderer.setWorld(this.world, this.visibility);
    
    // Set up minimap if canvas provided
    if (minimapCanvas) {
      this.minimapRenderer = new MinimapRenderer({
        fov: this.config.fov,
        viewDistance: this.config.viewDistance,
        ...options.minimapConfig
      });
      this.minimapRenderer.init(minimapCanvas);
      this.minimapRenderer.setWorld(this.world, this.visibility);
    }
    
    // Set up input
    const inputTarget = options.inputTarget || mainCanvas.parentElement || mainCanvas;
    this.input.init(inputTarget);
    
    // Create player entity
    this.player = new Entity({
      type: 'player',
      x: this.config.playerStartX || this.config.worldWidth / 2,
      y: this.config.playerStartY || this.config.worldHeight / 2,
      angle: this.config.playerStartAngle || 0,
      radius: this.config.playerRadius,
      speed: this.config.playerSpeed
    });
    this.entities.add(this.player);
    
    // Initial visibility update
    this.visibility.update(this.player.x, this.player.y);
    
    // Call init callback
    if (this.onInit) this.onInit();
    
    return this;
  }
  
  /**
   * Start the game loop
   */
  start() {
    if (this.running) return this;
    
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    
    this._emit('start');
    
    requestAnimationFrame((t) => this._loop(t));
    
    return this;
  }
  
  /**
   * Stop the game loop
   */
  stop() {
    this.running = false;
    this._emit('stop');
    return this;
  }
  
  /**
   * Main game loop
   */
  _loop(time) {
    if (!this.running) return;
    
    // Calculate delta time
    let dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    
    // Clamp to prevent spiral of death
    if (dt > this.config.maxFrameTime) {
      dt = this.config.maxFrameTime;
    }
    
    // FPS calculation
    this.frameCount++;
    this.fpsTime += dt;
    if (this.fpsTime >= 0.5) {
      this.currentFPS = Math.round(this.frameCount / this.fpsTime);
      this.frameCount = 0;
      this.fpsTime = 0;
    }
    
    // Fixed timestep updates
    this.accumulator += dt;
    while (this.accumulator >= this.config.fixedTimestep) {
      this._fixedUpdate(this.config.fixedTimestep);
      this.accumulator -= this.config.fixedTimestep;
    }
    
    // Render
    this._render();
    
    requestAnimationFrame((t) => this._loop(t));
  }
  
  /**
   * Fixed timestep update (physics, game logic)
   */
  _fixedUpdate(dt) {
    // Handle player input
    const moveInput = this.input.getMovementInput(dt, this.player.speed * dt);
    
    // Apply turning
    this.player.angle += moveInput.turn;
    
    // Normalize angle
    while (this.player.angle < 0) this.player.angle += Math.PI * 2;
    while (this.player.angle >= Math.PI * 2) this.player.angle -= Math.PI * 2;
    
    // Calculate movement vector
    const fx = Math.cos(this.player.angle);
    const fy = Math.sin(this.player.angle);
    const sx = Math.cos(this.player.angle + Math.PI/2);
    const sy = Math.sin(this.player.angle + Math.PI/2);
    
    const dx = fx * moveInput.forward + sx * moveInput.strafe;
    const dy = fy * moveInput.forward + sy * moveInput.strafe;
    
    // Move with collision
    if (dx !== 0 || dy !== 0) {
      const result = this.movement.move(this.player, dx, dy);
      this.player.x = result.x;
      this.player.y = result.y;
    }
    
    // Update visibility
    this.visibility.update(this.player.x, this.player.y, this.player.angle, this.config.fov);
    
    // Update other entities
    this.entities.update(dt);
    
    // Call update callbacks
    if (this.onUpdate) this.onUpdate(dt);
    this._emit('update', { dt });
  }
  
  /**
   * Render frame
   */
  _render() {
    // Main view
    if (this.renderer) {
      this.renderer.render(this.player.x, this.player.y, this.player.angle);
      this.renderer.drawCrosshair();
    }
    
    // Minimap
    if (this.minimapRenderer) {
      const otherEntities = this.entities.filter(e => e !== this.player && e.visible);
      this.minimapRenderer.render(this.player.x, this.player.y, this.player.angle, otherEntities);
    }
    
    // Call render callbacks
    if (this.onRender) this.onRender();
    this._emit('render');
  }
  
  /**
   * Get current FPS
   * @returns {number}
   */
  getFPS() {
    return this.currentFPS;
  }
  
  /**
   * Get visibility stats
   * @returns {Object}
   */
  getVisibilityStats() {
    return {
      discoveryPercent: this.visibility.getDiscoveryPercent(),
      ...this.visibility.getDiscoveryCount()
    };
  }
  
  /**
   * Get current sector info
   * @returns {Object}
   */
  getCurrentSector() {
    return this.world.getSector(this.player.x, this.player.y);
  }
  
  /**
   * Set player position
   * @param {number} x
   * @param {number} y
   * @param {number} angle - Optional
   */
  setPlayerPosition(x, y, angle = null) {
    this.player.x = x;
    this.player.y = y;
    if (angle !== null) this.player.angle = angle;
    this.visibility.update(x, y);
    return this;
  }
  
  /**
   * Subscribe to engine events
   * @param {string} event - Event name
   * @param {Function} callback
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return this;
  }
  
  /**
   * Unsubscribe from engine events
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }
  
  _emit(event, data = {}) {
    if (this.listeners[event]) {
      for (const callback of this.listeners[event]) {
        callback(data);
      }
    }
  }
  
  /**
   * Serialize engine state for saving
   * @returns {Object}
   */
  serialize() {
    return {
      world: this.world.serialize(),
      visibility: this.visibility.serializeDiscovery(),
      player: {
        x: this.player.x,
        y: this.player.y,
        angle: this.player.angle
      },
      entities: this.entities.serialize()
    };
  }
  
  /**
   * Deserialize engine state from save
   * @param {Object} data
   */
  deserialize(data) {
    if (data.world) {
      this.world.deserialize(data.world);
    }
    
    if (data.visibility) {
      this.visibility.deserializeDiscovery(data.visibility);
    }
    
    if (data.player) {
      this.player.x = data.player.x;
      this.player.y = data.player.y;
      this.player.angle = data.player.angle;
    }
    
    if (data.entities) {
      this.entities.deserialize(data.entities);
    }
    
    return this;
  }
}

// Export everything for modular use
export { World } from './core/world.js';
export { Visibility } from './core/visibility.js';
export { Movement } from './core/movement.js';
export { Entity, EntityManager } from './core/entity.js';
export { Input } from './input/input.js';
export { Canvas2DRenderer } from './renderers/canvas2d.js';
export { MinimapRenderer } from './renderers/minimap.js';

export default SectorEngine;
