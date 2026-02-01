/**
 * SECTOR ENGINE - World Module
 * 
 * Manages the 2.5D world grid: sectors, regions, and spatial queries.
 * The world is a 2D grid where each cell contains sector data including
 * floor/ceiling heights, material properties, and walkability.
 * 
 * This is the "truth" of the world - renderers interpret this data
 * for display, but all game logic operates on this representation.
 */

export class World {
  constructor(config = {}) {
    this.width = config.width || 32;
    this.height = config.height || 32;
    this.defaultSector = config.defaultSector || 'void';
    
    // The grid stores sector type keys, not full sector data
    // This keeps memory compact and allows sector types to be shared
    this.grid = null;
    
    // Sector type definitions - materials, heights, properties
    this.sectorTypes = new Map();
    
    // Registered regions for named area queries
    this.regions = new Map();
    
    // Entity spatial index (populated by EntityManager)
    this.entityIndex = null;
    
    // Event callbacks
    this.listeners = {
      sectorChanged: [],
      regionEntered: [],
      regionExited: []
    };
    
    this._init();
  }
  
  _init() {
    // Initialize grid with default sector
    this.grid = Array(this.height).fill(null).map(() => 
      Array(this.width).fill(this.defaultSector)
    );
    
    // Register the void sector type (always exists)
    this.registerSectorType('void', {
      floor: -10,
      ceiling: -10,
      walkable: false,
      floorColor: [20, 20, 25],
      wallColor: [40, 40, 50],
      ceilingColor: [15, 15, 20],
      name: 'VOID',
      solid: true
    });
  }
  
  /**
   * Register a sector type definition
   * @param {string} key - Unique identifier for this sector type
   * @param {Object} definition - Sector properties
   */
  registerSectorType(key, definition) {
    const defaults = {
      floor: 0,
      ceiling: 1.0,
      walkable: true,
      floorColor: [128, 128, 128],
      wallColor: [160, 160, 160],
      ceilingColor: [100, 100, 100],
      name: key.toUpperCase(),
      solid: false,
      friction: 1.0,
      damage: 0,
      light: 1.0,
      properties: {}
    };
    
    this.sectorTypes.set(key, { ...defaults, ...definition });
    return this;
  }
  
  /**
   * Register multiple sector types at once
   * @param {Object} types - Map of key -> definition
   */
  registerSectorTypes(types) {
    for (const [key, def] of Object.entries(types)) {
      this.registerSectorType(key, def);
    }
    return this;
  }
  
  /**
   * Get sector data at world coordinates
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {Object} Sector type definition
   */
  getSector(x, y) {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) {
      return this.sectorTypes.get(this.defaultSector);
    }
    
    const key = this.grid[gy][gx];
    return this.sectorTypes.get(key) || this.sectorTypes.get(this.defaultSector);
  }
  
  /**
   * Get sector type key at grid coordinates
   * @param {number} gx - Grid X coordinate
   * @param {number} gy - Grid Y coordinate
   * @returns {string} Sector type key
   */
  getSectorKey(gx, gy) {
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) {
      return this.defaultSector;
    }
    return this.grid[gy][gx];
  }
  
  /**
   * Set sector type at grid coordinates
   * @param {number} gx - Grid X coordinate
   * @param {number} gy - Grid Y coordinate
   * @param {string} sectorKey - Sector type key
   */
  setSector(gx, gy, sectorKey) {
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) {
      return false;
    }
    
    const oldKey = this.grid[gy][gx];
    if (oldKey === sectorKey) return false;
    
    this.grid[gy][gx] = sectorKey;
    this._emit('sectorChanged', { x: gx, y: gy, oldKey, newKey: sectorKey });
    return true;
  }
  
  /**
   * Fill a rectangular region with a sector type
   * @param {number} x1 - Start X (inclusive)
   * @param {number} y1 - Start Y (inclusive)
   * @param {number} x2 - End X (inclusive)
   * @param {number} y2 - End Y (inclusive)
   * @param {string} sectorKey - Sector type key
   */
  fillRect(x1, y1, x2, y2, sectorKey) {
    const minX = Math.max(0, Math.min(x1, x2));
    const maxX = Math.min(this.width - 1, Math.max(x1, x2));
    const minY = Math.max(0, Math.min(y1, y2));
    const maxY = Math.min(this.height - 1, Math.max(y1, y2));
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        this.grid[y][x] = sectorKey;
      }
    }
    
    return this;
  }
  
  /**
   * Define a named region for area queries
   * @param {string} name - Region identifier
   * @param {Object} bounds - { x1, y1, x2, y2 }
   * @param {Object} properties - Custom region properties
   */
  defineRegion(name, bounds, properties = {}) {
    this.regions.set(name, {
      name,
      bounds: {
        x1: Math.min(bounds.x1, bounds.x2),
        y1: Math.min(bounds.y1, bounds.y2),
        x2: Math.max(bounds.x1, bounds.x2),
        y2: Math.max(bounds.y1, bounds.y2)
      },
      properties
    });
    return this;
  }
  
  /**
   * Get all regions containing a point
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {Array} Array of region objects
   */
  getRegionsAt(x, y) {
    const results = [];
    for (const region of this.regions.values()) {
      const b = region.bounds;
      if (x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2) {
        results.push(region);
      }
    }
    return results;
  }
  
  /**
   * Check if a position is walkable
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {boolean}
   */
  isWalkable(x, y) {
    return this.getSector(x, y).walkable;
  }
  
  /**
   * Get floor height at position
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {number}
   */
  getFloorHeight(x, y) {
    return this.getSector(x, y).floor;
  }
  
  /**
   * Get ceiling height at position
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {number}
   */
  getCeilingHeight(x, y) {
    return this.getSector(x, y).ceiling;
  }
  
  /**
   * Iterate over all sectors in a rectangular area
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {Function} callback - Called with (x, y, sector, key)
   */
  forEachInRect(x1, y1, x2, y2, callback) {
    const minX = Math.max(0, Math.floor(Math.min(x1, x2)));
    const maxX = Math.min(this.width - 1, Math.floor(Math.max(x1, x2)));
    const minY = Math.max(0, Math.floor(Math.min(y1, y2)));
    const maxY = Math.min(this.height - 1, Math.floor(Math.max(y1, y2)));
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = this.grid[y][x];
        const sector = this.sectorTypes.get(key);
        callback(x, y, sector, key);
      }
    }
  }
  
  /**
   * Count walkable sectors (useful for fog of war percentage)
   * @returns {number}
   */
  countWalkable() {
    let count = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.getSector(x, y).walkable) count++;
      }
    }
    return count;
  }
  
  /**
   * Export world to serializable format
   * @returns {Object}
   */
  serialize() {
    return {
      width: this.width,
      height: this.height,
      defaultSector: this.defaultSector,
      sectorTypes: Object.fromEntries(this.sectorTypes),
      grid: this.grid.map(row => [...row]),
      regions: Object.fromEntries(this.regions)
    };
  }
  
  /**
   * Import world from serialized format
   * @param {Object} data
   */
  deserialize(data) {
    this.width = data.width;
    this.height = data.height;
    this.defaultSector = data.defaultSector;
    
    this.sectorTypes.clear();
    for (const [key, def] of Object.entries(data.sectorTypes)) {
      this.sectorTypes.set(key, def);
    }
    
    this.grid = data.grid.map(row => [...row]);
    
    this.regions.clear();
    for (const [key, region] of Object.entries(data.regions)) {
      this.regions.set(key, region);
    }
    
    return this;
  }
  
  /**
   * Subscribe to world events
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return this;
  }
  
  /**
   * Unsubscribe from world events
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
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

export default World;
