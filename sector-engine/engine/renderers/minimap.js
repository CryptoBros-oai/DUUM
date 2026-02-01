/**
 * SECTOR ENGINE - Minimap Renderer
 * 
 * Renders a top-down tactical view of the world.
 * Shows discovered/visible areas, player position, and optional extras.
 */

export class MinimapRenderer {
  constructor(config = {}) {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    
    // Colors
    this.colors = {
      background: config.backgroundColor || '#030305',
      undiscovered: config.undiscoveredColor || '#06060a',
      discoveredWall: config.discoveredWallColor || '#1a1a22',
      visibleWall: config.visibleWallColor || '#3a3a42',
      discoveredFloor: config.discoveredFloorColor || '#18181e',
      player: config.playerColor || '#33ff33',
      fovCone: config.fovConeColor || 'rgba(51, 255, 51, 0.12)',
      ...config.colors
    };
    
    // Display options
    this.showFovCone = config.showFovCone !== false;
    this.showGrid = config.showGrid || false;
    this.showEntities = config.showEntities !== false;
    this.playerSize = config.playerSize || 3.5;
    this.fov = config.fov || Math.PI * 0.6;
    this.viewDistance = config.viewDistance || 14;
    
    // References
    this.world = null;
    this.visibility = null;
  }
  
  /**
   * Initialize minimap with a canvas
   * @param {HTMLCanvasElement} canvas
   */
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    
    window.addEventListener('resize', () => this.resize());
    
    return this;
  }
  
  /**
   * Set world and visibility references
   * @param {World} world
   * @param {Visibility} visibility
   */
  setWorld(world, visibility) {
    this.world = world;
    this.visibility = visibility;
    return this;
  }
  
  /**
   * Handle resize
   */
  resize() {
    const container = this.canvas.parentElement;
    if (container) {
      const size = Math.min(container.clientWidth - 24, container.clientHeight - 40);
      this.width = size;
      this.height = size;
    }
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  
  /**
   * Render minimap
   * @param {number} playerX - Player X position
   * @param {number} playerY - Player Y position
   * @param {number} playerAngle - Player facing angle
   * @param {Array} entities - Optional array of entities to show
   */
  render(playerX, playerY, playerAngle, entities = []) {
    if (!this.world) return;
    
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    const cellW = w / this.world.width;
    const cellH = h / this.world.height;
    
    // Clear
    ctx.fillStyle = this.colors.background;
    ctx.fillRect(0, 0, w, h);
    
    // Draw sectors
    for (let gy = 0; gy < this.world.height; gy++) {
      for (let gx = 0; gx < this.world.width; gx++) {
        const sector = this.world.getSector(gx, gy);
        const visible = this.visibility ? this.visibility.isVisible(gx, gy) : true;
        const discovered = this.visibility ? this.visibility.isDiscovered(gx, gy) : true;
        
        let color;
        
        if (!discovered && !visible) {
          color = this.colors.undiscovered;
        } else if (!sector.walkable) {
          color = visible ? this.colors.visibleWall : this.colors.discoveredWall;
        } else {
          if (visible) {
            // Use sector's floor color, scaled
            const c = sector.floorColor;
            color = `rgb(${Math.floor(c[0]*0.8)},${Math.floor(c[1]*0.8)},${Math.floor(c[2]*0.8)})`;
          } else {
            color = this.colors.discoveredFloor;
          }
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(gx * cellW, gy * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
    
    // Draw grid
    if (this.showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 0.5;
      
      for (let x = 0; x <= this.world.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellW, 0);
        ctx.lineTo(x * cellW, h);
        ctx.stroke();
      }
      
      for (let y = 0; y <= this.world.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellH);
        ctx.lineTo(w, y * cellH);
        ctx.stroke();
      }
    }
    
    // Player position in pixels
    const px = playerX * cellW;
    const py = playerY * cellH;
    
    // Draw FOV cone
    if (this.showFovCone) {
      const coneLen = this.viewDistance * cellW;
      const halfFov = this.fov / 2;
      
      ctx.fillStyle = this.colors.fovCone;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(
        px + Math.cos(playerAngle - halfFov) * coneLen,
        py + Math.sin(playerAngle - halfFov) * coneLen
      );
      ctx.arc(px, py, coneLen, playerAngle - halfFov, playerAngle + halfFov);
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw entities
    if (this.showEntities && entities.length > 0) {
      for (const entity of entities) {
        if (!entity.visible) continue;
        
        const ex = entity.x * cellW;
        const ey = entity.y * cellH;
        
        // Simple dot for now
        ctx.fillStyle = entity.mapColor || '#ffff00';
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw player
    ctx.fillStyle = this.colors.player;
    ctx.shadowColor = this.colors.player;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(px, py, this.playerSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Player direction line
    ctx.strokeStyle = this.colors.player;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(
      px + Math.cos(playerAngle) * 10,
      py + Math.sin(playerAngle) * 10
    );
    ctx.stroke();
  }
  
  /**
   * Update configuration
   * @param {Object} config
   */
  configure(config) {
    if (config.colors) {
      Object.assign(this.colors, config.colors);
    }
    
    if (config.showFovCone !== undefined) this.showFovCone = config.showFovCone;
    if (config.showGrid !== undefined) this.showGrid = config.showGrid;
    if (config.showEntities !== undefined) this.showEntities = config.showEntities;
    if (config.playerSize !== undefined) this.playerSize = config.playerSize;
    if (config.fov !== undefined) this.fov = config.fov;
    if (config.viewDistance !== undefined) this.viewDistance = config.viewDistance;
    
    return this;
  }
}

export default MinimapRenderer;
