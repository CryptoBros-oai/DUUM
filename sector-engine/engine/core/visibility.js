/**
 * SECTOR ENGINE - Visibility Module
 * 
 * Handles all visibility calculations:
 * - Raycasting for rendering
 * - Fog of war (discovery state)
 * - Line of sight queries
 * - Visibility caching for performance
 * 
 * The visibility system is separate from rendering - it calculates
 * what CAN be seen, renderers decide HOW to show it.
 */

export class Visibility {
  constructor(world, config = {}) {
    this.world = world;
    
    // Configuration
    this.viewDistance = config.viewDistance || 14;
    this.rayStep = config.rayStep || 0.4;
    this.fovRayCount = config.fovRayCount || 180;
    
    // Discovery state (persistent)
    this.discovered = new Set();
    
    // Current visibility (per-frame)
    this.currentlyVisible = new Set();
    
    // Cache for expensive LOS calculations
    this.losCache = new Map();
    this.losCacheTimeout = config.losCacheTimeout || 100; // ms
    
    // Stats
    this.totalWalkable = 0;
    this.lastUpdateTime = 0;
    
    // Event callbacks
    this.listeners = {
      discovered: [],
      visibilityChanged: []
    };
    
    this._countWalkable();
  }
  
  _countWalkable() {
    this.totalWalkable = this.world.countWalkable();
  }
  
  /**
   * Update visibility from a viewpoint
   * Call this each frame for the player/camera position
   * @param {number} x - Viewer X position
   * @param {number} y - Viewer Y position
   * @param {number} angle - Viewer facing angle (optional, for directional FOV)
   * @param {number} fov - Field of view in radians (optional, default 360°)
   */
  update(x, y, angle = 0, fov = Math.PI * 2) {
    const previousVisible = this.currentlyVisible;
    this.currentlyVisible = new Set();
    
    const startAngle = angle - fov / 2;
    const endAngle = angle + fov / 2;
    const rayCount = Math.ceil(this.fovRayCount * (fov / (Math.PI * 2)));
    
    for (let i = 0; i < rayCount; i++) {
      const rayAngle = startAngle + (i / rayCount) * fov;
      this._castVisibilityRay(x, y, rayAngle);
    }
    
    // Check for newly discovered sectors
    const newlyDiscovered = [];
    for (const key of this.currentlyVisible) {
      if (!previousVisible.has(key)) {
        const [gx, gy] = key.split(',').map(Number);
        if (this.world.isWalkable(gx, gy) && !this.discovered.has(key)) {
          this.discovered.add(key);
          newlyDiscovered.push({ x: gx, y: gy });
        }
      }
    }
    
    if (newlyDiscovered.length > 0) {
      this._emit('discovered', { sectors: newlyDiscovered });
    }
    
    this.lastUpdateTime = performance.now();
  }
  
  _castVisibilityRay(startX, startY, angle) {
    let x = startX;
    let y = startY;
    const dx = Math.cos(angle) * this.rayStep;
    const dy = Math.sin(angle) * this.rayStep;
    
    for (let d = 0; d < this.viewDistance; d += this.rayStep) {
      x += dx;
      y += dy;
      
      const gx = Math.floor(x);
      const gy = Math.floor(y);
      const key = `${gx},${gy}`;
      
      this.currentlyVisible.add(key);
      
      // Stop at walls
      if (!this.world.isWalkable(x, y)) {
        break;
      }
    }
  }
  
  /**
   * Cast a single ray for rendering purposes
   * Returns detailed hit information
   * @param {number} startX - Ray origin X
   * @param {number} startY - Ray origin Y
   * @param {number} angle - Ray angle in radians
   * @param {number} maxDist - Maximum ray distance
   * @returns {Object|null} Hit information or null if no hit
   */
  castRay(startX, startY, angle, maxDist = null) {
    const max = maxDist || this.viewDistance * 1.5;
    const step = 0.02; // Finer step for rendering accuracy
    
    let x = startX;
    let y = startY;
    let dist = 0;
    
    const dx = Math.cos(angle) * step;
    const dy = Math.sin(angle) * step;
    
    while (dist < max) {
      x += dx;
      y += dy;
      dist += step;
      
      const gx = Math.floor(x);
      const gy = Math.floor(y);
      const sector = this.world.getSector(x, y);
      
      if (!sector.walkable) {
        // Determine which face was hit
        const fractX = x - gx;
        const fractY = y - gy;
        const isNorthSouth = (fractX < 0.05 || fractX > 0.95);
        
        return {
          hit: true,
          x,
          y,
          gridX: gx,
          gridY: gy,
          distance: dist,
          sector,
          sectorKey: this.world.getSectorKey(gx, gy),
          face: isNorthSouth ? 'ns' : 'ew',
          visible: this.isVisible(gx, gy),
          discovered: this.isDiscovered(gx, gy)
        };
      }
    }
    
    return {
      hit: false,
      distance: max,
      x,
      y
    };
  }
  
  /**
   * Cast multiple rays for rendering (batch operation)
   * @param {number} startX - Origin X
   * @param {number} startY - Origin Y
   * @param {number} angle - Center angle
   * @param {number} fov - Field of view
   * @param {number} rayCount - Number of rays
   * @returns {Array} Array of ray hit results
   */
  castRays(startX, startY, angle, fov, rayCount) {
    const results = [];
    const halfFov = fov / 2;
    
    for (let i = 0; i < rayCount; i++) {
      const rayOffset = (i / rayCount) - 0.5;
      const rayAngle = angle + rayOffset * fov;
      const hit = this.castRay(startX, startY, rayAngle);
      
      if (hit) {
        // Add fish-eye correction factor
        hit.correctedDistance = hit.distance * Math.cos(rayAngle - angle);
        hit.column = i;
        results.push(hit);
      }
    }
    
    return results;
  }
  
  /**
   * Check if a grid cell is currently visible
   * @param {number} gx - Grid X
   * @param {number} gy - Grid Y
   * @returns {boolean}
   */
  isVisible(gx, gy) {
    return this.currentlyVisible.has(`${gx},${gy}`);
  }
  
  /**
   * Check if a grid cell has ever been discovered
   * @param {number} gx - Grid X
   * @param {number} gy - Grid Y
   * @returns {boolean}
   */
  isDiscovered(gx, gy) {
    return this.discovered.has(`${gx},${gy}`);
  }
  
  /**
   * Check line of sight between two points
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @returns {boolean} True if clear line of sight
   */
  hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 0.1) return true;
    
    const steps = Math.ceil(dist / 0.2);
    const stepX = dx / steps;
    const stepY = dy / steps;
    
    let x = x1;
    let y = y1;
    
    for (let i = 0; i < steps; i++) {
      x += stepX;
      y += stepY;
      
      if (!this.world.isWalkable(x, y)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get all visible sectors as array of {x, y} objects
   * @returns {Array}
   */
  getVisibleSectors() {
    return Array.from(this.currentlyVisible).map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });
  }
  
  /**
   * Get discovery percentage
   * @returns {number} 0-100
   */
  getDiscoveryPercent() {
    if (this.totalWalkable === 0) return 100;
    
    let discoveredWalkable = 0;
    for (const key of this.discovered) {
      const [x, y] = key.split(',').map(Number);
      if (this.world.isWalkable(x, y)) {
        discoveredWalkable++;
      }
    }
    
    return Math.round((discoveredWalkable / this.totalWalkable) * 100);
  }
  
  /**
   * Get discovery count
   * @returns {Object} { discovered, total }
   */
  getDiscoveryCount() {
    let discoveredWalkable = 0;
    for (const key of this.discovered) {
      const [x, y] = key.split(',').map(Number);
      if (this.world.isWalkable(x, y)) {
        discoveredWalkable++;
      }
    }
    
    return {
      discovered: discoveredWalkable,
      total: this.totalWalkable
    };
  }
  
  /**
   * Mark a sector as discovered (cheat/debug)
   * @param {number} gx - Grid X
   * @param {number} gy - Grid Y
   */
  discover(gx, gy) {
    this.discovered.add(`${gx},${gy}`);
  }
  
  /**
   * Discover all sectors (cheat/debug)
   */
  discoverAll() {
    for (let y = 0; y < this.world.height; y++) {
      for (let x = 0; x < this.world.width; x++) {
        if (this.world.isWalkable(x, y)) {
          this.discovered.add(`${x},${y}`);
        }
      }
    }
  }
  
  /**
   * Reset discovery state
   */
  resetDiscovery() {
    this.discovered.clear();
    this.currentlyVisible.clear();
  }
  
  /**
   * Export discovery state for save games
   * @returns {Array} Array of discovered sector keys
   */
  serializeDiscovery() {
    return Array.from(this.discovered);
  }
  
  /**
   * Import discovery state from save game
   * @param {Array} data - Array of discovered sector keys
   */
  deserializeDiscovery(data) {
    this.discovered = new Set(data);
  }
  
  /**
   * Subscribe to visibility events
   * @param {string} event - Event name ('discovered', 'visibilityChanged')
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return this;
  }
  
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }
  
  _emit(event, data) {
    if (this.listeners[event]) {
      for (const callback of this.listeners[event]) {
        callback(data);
      }
    }
  }
}

export default Visibility;
