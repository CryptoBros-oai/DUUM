/**
 * SECTOR ENGINE - Movement Module
 * 
 * Handles entity movement with collision detection.
 * Supports:
 * - Circular collision (for entities)
 * - Wall sliding
 * - Step-up (small height differences)
 * - Friction and momentum (optional)
 * 
 * This is physics-lite - no gravity, no complex dynamics.
 * Good enough for top-down or 2.5D movement.
 */

export class Movement {
  constructor(world, config = {}) {
    this.world = world;
    
    // Configuration
    this.defaultRadius = config.defaultRadius || 0.2;
    this.maxStepHeight = config.maxStepHeight || 0.3;
    this.collisionStep = config.collisionStep || 0.05;
    this.slideIterations = config.slideIterations || 3;
  }
  
  /**
   * Attempt to move an entity
   * @param {Object} entity - Entity with x, y, radius properties
   * @param {number} dx - Desired X movement
   * @param {number} dy - Desired Y movement
   * @returns {Object} Movement result { x, y, collided, slideX, slideY }
   */
  move(entity, dx, dy) {
    const radius = entity.radius || this.defaultRadius;
    const startX = entity.x;
    const startY = entity.y;
    
    // Try full movement first
    const newX = startX + dx;
    const newY = startY + dy;
    
    if (this.canOccupy(newX, newY, radius, entity.z)) {
      return {
        x: newX,
        y: newY,
        collided: false,
        slideX: 0,
        slideY: 0
      };
    }
    
    // Try sliding along walls
    let resultX = startX;
    let resultY = startY;
    let collided = true;
    
    // Try X movement only
    if (dx !== 0 && this.canOccupy(newX, startY, radius, entity.z)) {
      resultX = newX;
      collided = false;
    }
    
    // Try Y movement only
    if (dy !== 0 && this.canOccupy(resultX, newY, radius, entity.z)) {
      resultY = newY;
      collided = false;
    }
    
    // If still blocked, try smaller steps
    if (resultX === startX && resultY === startY && (dx !== 0 || dy !== 0)) {
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > this.collisionStep) {
        const steps = Math.ceil(len / this.collisionStep);
        const stepX = dx / steps;
        const stepY = dy / steps;
        
        let x = startX;
        let y = startY;
        
        for (let i = 0; i < steps; i++) {
          const nextX = x + stepX;
          const nextY = y + stepY;
          
          if (this.canOccupy(nextX, nextY, radius, entity.z)) {
            x = nextX;
            y = nextY;
          } else if (this.canOccupy(nextX, y, radius, entity.z)) {
            x = nextX;
          } else if (this.canOccupy(x, nextY, radius, entity.z)) {
            y = nextY;
          } else {
            break;
          }
        }
        
        resultX = x;
        resultY = y;
        collided = (resultX === startX && resultY === startY);
      }
    }
    
    return {
      x: resultX,
      y: resultY,
      collided,
      slideX: resultX - startX - dx,
      slideY: resultY - startY - dy
    };
  }
  
  /**
   * Check if a circular entity can occupy a position
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} radius - Entity radius
   * @param {number} z - Entity height (for step-up checks)
   * @returns {boolean}
   */
  canOccupy(x, y, radius = null, z = 0) {
    const r = radius || this.defaultRadius;
    
    // Check corners and center of bounding box
    const testPoints = [
      [x, y],           // center
      [x - r, y - r],   // corners
      [x + r, y - r],
      [x - r, y + r],
      [x + r, y + r],
      [x - r, y],       // edge midpoints
      [x + r, y],
      [x, y - r],
      [x, y + r]
    ];
    
    for (const [px, py] of testPoints) {
      const sector = this.world.getSector(px, py);
      
      if (!sector.walkable) {
        return false;
      }
      
      // Check step height if z is provided
      if (z !== undefined) {
        const floorDiff = sector.floor - z;
        if (floorDiff > this.maxStepHeight) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Check if moving from A to B is valid (line check)
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {number} radius - Entity radius
   * @returns {Object} { valid, blockedAt: {x, y} | null }
   */
  tracePath(x1, y1, x2, y2, radius = null) {
    const r = radius || this.defaultRadius;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 0.01) {
      return { valid: this.canOccupy(x1, y1, r), blockedAt: null };
    }
    
    const steps = Math.ceil(dist / this.collisionStep);
    const stepX = dx / steps;
    const stepY = dy / steps;
    
    let x = x1;
    let y = y1;
    
    for (let i = 0; i <= steps; i++) {
      if (!this.canOccupy(x, y, r)) {
        return { 
          valid: false, 
          blockedAt: { x, y },
          progress: i / steps
        };
      }
      x += stepX;
      y += stepY;
    }
    
    return { valid: true, blockedAt: null, progress: 1 };
  }
  
  /**
   * Find the closest valid position to a target
   * Useful for spawning entities or teleporting
   * @param {number} targetX - Desired X
   * @param {number} targetY - Desired Y
   * @param {number} radius - Entity radius
   * @param {number} searchRadius - How far to search
   * @returns {Object|null} { x, y } or null if no valid position found
   */
  findValidPosition(targetX, targetY, radius = null, searchRadius = 5) {
    const r = radius || this.defaultRadius;
    
    // Try target position first
    if (this.canOccupy(targetX, targetY, r)) {
      return { x: targetX, y: targetY };
    }
    
    // Spiral outward search
    for (let dist = 0.5; dist <= searchRadius; dist += 0.5) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x = targetX + Math.cos(angle) * dist;
        const y = targetY + Math.sin(angle) * dist;
        
        if (this.canOccupy(x, y, r)) {
          return { x, y };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get the floor height at a position
   * @param {number} x - World X
   * @param {number} y - World Y
   * @returns {number}
   */
  getFloorAt(x, y) {
    return this.world.getFloorHeight(x, y);
  }
  
  /**
   * Apply simple momentum/friction to velocity
   * @param {Object} velocity - { x, y } velocity vector
   * @param {number} friction - Friction coefficient (0-1, lower = more friction)
   * @param {number} dt - Delta time
   * @returns {Object} New velocity { x, y }
   */
  applyFriction(velocity, friction = 0.9, dt = 1/60) {
    const factor = Math.pow(friction, dt * 60);
    return {
      x: velocity.x * factor,
      y: velocity.y * factor
    };
  }
  
  /**
   * Calculate push direction when two entities overlap
   * @param {Object} entity1 - First entity { x, y, radius }
   * @param {Object} entity2 - Second entity { x, y, radius }
   * @returns {Object|null} Push vector { x, y } or null if no overlap
   */
  getOverlapPush(entity1, entity2) {
    const dx = entity2.x - entity1.x;
    const dy = entity2.y - entity1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const r1 = entity1.radius || this.defaultRadius;
    const r2 = entity2.radius || this.defaultRadius;
    const minDist = r1 + r2;
    
    if (dist >= minDist || dist < 0.001) {
      return null;
    }
    
    const overlap = minDist - dist;
    const pushX = (dx / dist) * overlap * 0.5;
    const pushY = (dy / dist) * overlap * 0.5;
    
    return { x: pushX, y: pushY };
  }
}

export default Movement;
