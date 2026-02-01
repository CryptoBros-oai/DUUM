/**
 * SECTOR ENGINE - Entity Module
 * 
 * Entities are things that exist in the world - players, NPCs, items, etc.
 * The engine doesn't know what a "player" or "monster" is - just entities
 * with positions, properties, and optional behaviors.
 * 
 * This keeps the engine generic and lets applications define their own
 * entity types through composition.
 */

/**
 * Base Entity class
 * Extend or compose with this for game-specific entities
 */
export class Entity {
  static nextId = 1;
  
  constructor(config = {}) {
    this.id = config.id || Entity.nextId++;
    this.type = config.type || 'entity';
    
    // Position
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.z = config.z || 0; // Height above floor
    this.angle = config.angle || 0;
    
    // Physics
    this.radius = config.radius || 0.2;
    this.height = config.height || 0.5;
    this.solid = config.solid !== false;
    
    // Movement (optional, for dynamic entities)
    this.vx = 0;
    this.vy = 0;
    this.speed = config.speed || 3.0;
    
    // Visibility
    this.visible = config.visible !== false;
    this.sprite = config.sprite || null;
    
    // Custom properties (game-specific)
    this.properties = config.properties || {};
    
    // State flags
    this.active = true;
    this.removed = false;
  }
  
  /**
   * Update entity (override in subclasses)
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Default: apply velocity
    if (this.vx !== 0 || this.vy !== 0) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
  }
  
  /**
   * Get distance to another entity or point
   * @param {Object} target - Entity or { x, y }
   * @returns {number}
   */
  distanceTo(target) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Get angle to another entity or point
   * @param {Object} target - Entity or { x, y }
   * @returns {number} Angle in radians
   */
  angleTo(target) {
    return Math.atan2(target.y - this.y, target.x - this.x);
  }
  
  /**
   * Check if this entity overlaps another
   * @param {Entity} other - Other entity
   * @returns {boolean}
   */
  overlaps(other) {
    const dist = this.distanceTo(other);
    return dist < (this.radius + other.radius);
  }
  
  /**
   * Mark entity for removal
   */
  remove() {
    this.removed = true;
    this.active = false;
  }
  
  /**
   * Serialize entity for saving
   * @returns {Object}
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      z: this.z,
      angle: this.angle,
      radius: this.radius,
      height: this.height,
      solid: this.solid,
      speed: this.speed,
      visible: this.visible,
      sprite: this.sprite,
      properties: { ...this.properties },
      active: this.active
    };
  }
  
  /**
   * Deserialize entity from saved data
   * @param {Object} data
   */
  deserialize(data) {
    Object.assign(this, data);
    this.removed = false;
    return this;
  }
}

/**
 * EntityManager - handles collections of entities
 */
export class EntityManager {
  constructor(world) {
    this.world = world;
    this.entities = new Map();
    this.byType = new Map();
    
    // Spatial hash for efficient queries
    this.spatialHash = new Map();
    this.cellSize = 4;
    
    // Event callbacks
    this.listeners = {
      entityAdded: [],
      entityRemoved: [],
      entityMoved: []
    };
  }
  
  /**
   * Add an entity to the manager
   * @param {Entity} entity
   * @returns {Entity}
   */
  add(entity) {
    this.entities.set(entity.id, entity);
    
    // Index by type
    if (!this.byType.has(entity.type)) {
      this.byType.set(entity.type, new Set());
    }
    this.byType.get(entity.type).add(entity);
    
    // Add to spatial hash
    this._addToSpatialHash(entity);
    
    this._emit('entityAdded', entity);
    return entity;
  }
  
  /**
   * Remove an entity
   * @param {Entity|number} entityOrId - Entity or entity ID
   */
  remove(entityOrId) {
    const id = typeof entityOrId === 'number' ? entityOrId : entityOrId.id;
    const entity = this.entities.get(id);
    
    if (!entity) return;
    
    entity.remove();
    this.entities.delete(id);
    
    // Remove from type index
    const typeSet = this.byType.get(entity.type);
    if (typeSet) typeSet.delete(entity);
    
    // Remove from spatial hash
    this._removeFromSpatialHash(entity);
    
    this._emit('entityRemoved', entity);
  }
  
  /**
   * Get entity by ID
   * @param {number} id
   * @returns {Entity|undefined}
   */
  get(id) {
    return this.entities.get(id);
  }
  
  /**
   * Get all entities of a type
   * @param {string} type
   * @returns {Array<Entity>}
   */
  getByType(type) {
    const set = this.byType.get(type);
    return set ? Array.from(set) : [];
  }
  
  /**
   * Get all entities
   * @returns {Array<Entity>}
   */
  getAll() {
    return Array.from(this.entities.values());
  }
  
  /**
   * Get entities near a point
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} radius - Search radius
   * @returns {Array<Entity>}
   */
  getNear(x, y, radius) {
    const results = [];
    const radiusSq = radius * radius;
    
    // Check relevant spatial hash cells
    const minCellX = Math.floor((x - radius) / this.cellSize);
    const maxCellX = Math.floor((x + radius) / this.cellSize);
    const minCellY = Math.floor((y - radius) / this.cellSize);
    const maxCellY = Math.floor((y + radius) / this.cellSize);
    
    const checked = new Set();
    
    for (let cy = minCellY; cy <= maxCellY; cy++) {
      for (let cx = minCellX; cx <= maxCellX; cx++) {
        const cell = this.spatialHash.get(`${cx},${cy}`);
        if (!cell) continue;
        
        for (const entity of cell) {
          if (checked.has(entity.id)) continue;
          checked.add(entity.id);
          
          const dx = entity.x - x;
          const dy = entity.y - y;
          if (dx * dx + dy * dy <= radiusSq) {
            results.push(entity);
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * Get entities in a sector
   * @param {number} gx - Grid X
   * @param {number} gy - Grid Y
   * @returns {Array<Entity>}
   */
  getInSector(gx, gy) {
    return this.getNear(gx + 0.5, gy + 0.5, 1).filter(e => 
      Math.floor(e.x) === gx && Math.floor(e.y) === gy
    );
  }
  
  /**
   * Update all entities
   * @param {number} dt - Delta time
   */
  update(dt) {
    for (const entity of this.entities.values()) {
      if (!entity.active) continue;
      
      const oldX = entity.x;
      const oldY = entity.y;
      
      entity.update(dt);
      
      // Update spatial hash if moved
      if (entity.x !== oldX || entity.y !== oldY) {
        this._updateSpatialHash(entity, oldX, oldY);
        this._emit('entityMoved', { entity, oldX, oldY });
      }
    }
    
    // Remove marked entities
    for (const entity of this.entities.values()) {
      if (entity.removed) {
        this.remove(entity);
      }
    }
  }
  
  /**
   * Find first entity matching a predicate
   * @param {Function} predicate - (entity) => boolean
   * @returns {Entity|undefined}
   */
  find(predicate) {
    for (const entity of this.entities.values()) {
      if (predicate(entity)) return entity;
    }
    return undefined;
  }
  
  /**
   * Filter entities by predicate
   * @param {Function} predicate - (entity) => boolean
   * @returns {Array<Entity>}
   */
  filter(predicate) {
    return Array.from(this.entities.values()).filter(predicate);
  }
  
  /**
   * Clear all entities
   */
  clear() {
    this.entities.clear();
    this.byType.clear();
    this.spatialHash.clear();
  }
  
  // Spatial hash helpers
  _getCellKey(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }
  
  _addToSpatialHash(entity) {
    const key = this._getCellKey(entity.x, entity.y);
    if (!this.spatialHash.has(key)) {
      this.spatialHash.set(key, new Set());
    }
    this.spatialHash.get(key).add(entity);
  }
  
  _removeFromSpatialHash(entity) {
    const key = this._getCellKey(entity.x, entity.y);
    const cell = this.spatialHash.get(key);
    if (cell) {
      cell.delete(entity);
      if (cell.size === 0) {
        this.spatialHash.delete(key);
      }
    }
  }
  
  _updateSpatialHash(entity, oldX, oldY) {
    const oldKey = this._getCellKey(oldX, oldY);
    const newKey = this._getCellKey(entity.x, entity.y);
    
    if (oldKey !== newKey) {
      // Remove from old cell
      const oldCell = this.spatialHash.get(oldKey);
      if (oldCell) {
        oldCell.delete(entity);
        if (oldCell.size === 0) {
          this.spatialHash.delete(oldKey);
        }
      }
      
      // Add to new cell
      this._addToSpatialHash(entity);
    }
  }
  
  /**
   * Serialize all entities
   * @returns {Array}
   */
  serialize() {
    return Array.from(this.entities.values()).map(e => e.serialize());
  }
  
  /**
   * Deserialize entities
   * @param {Array} data
   * @param {Function} factory - Optional factory function (type) => Entity
   */
  deserialize(data, factory = null) {
    this.clear();
    
    for (const entityData of data) {
      let entity;
      if (factory) {
        entity = factory(entityData.type);
      } else {
        entity = new Entity();
      }
      entity.deserialize(entityData);
      this.add(entity);
    }
  }
  
  // Event system
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

export default Entity;
