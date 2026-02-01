/**
 * SECTOR ENGINE - Canvas2D Renderer
 * 
 * Software raycaster using Canvas2D.
 * This is the "it just works" renderer - no GPU requirements,
 * runs everywhere, pixel-perfect control.
 * 
 * Implements the Renderer interface so it can be swapped with
 * WebGL or other renderers.
 */

export class Canvas2DRenderer {
  constructor(config = {}) {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    
    // Rendering config
    this.rayCount = config.rayCount || 320;
    this.maxRayDepth = config.maxRayDepth || 20;
    this.fov = config.fov || Math.PI * 0.6;
    
    // Lighting config
    this.ambientLight = config.ambientLight || 0.35;
    this.distanceShade = config.distanceShade || 0.06;
    this.fogStart = config.fogStart || 8;
    this.fogEnd = config.fogEnd || 18;
    this.fogColor = config.fogColor || [25, 28, 35];
    
    // Sky/floor colors
    this.skyColorTop = config.skyColorTop || '#1a1d28';
    this.skyColorBottom = config.skyColorBottom || '#2d323f';
    this.floorColorTop = config.floorColorTop || '#3a3d45';
    this.floorColorBottom = config.floorColorBottom || '#1a1c22';
    
    // References (set by engine)
    this.world = null;
    this.visibility = null;
    
    // Stats
    this.stats = {
      raysCast: 0,
      wallsDrawn: 0,
      frameTime: 0
    };
  }
  
  /**
   * Initialize renderer with a canvas element
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
   * Handle canvas resize
   */
  resize() {
    const container = this.canvas.parentElement;
    if (container) {
      this.width = container.clientWidth;
      this.height = container.clientHeight;
    } else {
      this.width = this.canvas.clientWidth;
      this.height = this.canvas.clientHeight;
    }
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  
  /**
   * Render frame from a viewpoint
   * @param {number} viewX - Viewer X position
   * @param {number} viewY - Viewer Y position
   * @param {number} viewAngle - Viewer facing angle
   */
  render(viewX, viewY, viewAngle) {
    const startTime = performance.now();
    
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    this.stats.raysCast = 0;
    this.stats.wallsDrawn = 0;
    
    // Draw sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h/2);
    skyGrad.addColorStop(0, this.skyColorTop);
    skyGrad.addColorStop(1, this.skyColorBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h/2);
    
    // Draw floor gradient
    const floorGrad = ctx.createLinearGradient(0, h/2, 0, h);
    floorGrad.addColorStop(0, this.floorColorTop);
    floorGrad.addColorStop(1, this.floorColorBottom);
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, h/2, w, h/2);
    
    // Cast rays and draw walls
    const columnWidth = Math.ceil(w / this.rayCount);
    
    for (let i = 0; i < this.rayCount; i++) {
      const rayOffset = (i / this.rayCount) - 0.5;
      const rayAngle = viewAngle + rayOffset * this.fov;
      this._castAndDrawRay(viewX, viewY, viewAngle, rayAngle, i, columnWidth, w, h);
    }
    
    // Vignette effect
    const vignetteGrad = ctx.createRadialGradient(w/2, h/2, h*0.3, w/2, h/2, h*0.85);
    vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, w, h);
    
    this.stats.frameTime = performance.now() - startTime;
  }
  
  /**
   * Cast a ray and draw the resulting wall column
   */
  _castAndDrawRay(viewX, viewY, viewAngle, rayAngle, column, columnWidth, screenW, screenH) {
    const step = 0.02;
    let x = viewX;
    let y = viewY;
    let dist = 0;
    
    const dx = Math.cos(rayAngle) * step;
    const dy = Math.sin(rayAngle) * step;
    
    this.stats.raysCast++;
    
    while (dist < this.maxRayDepth) {
      x += dx;
      y += dy;
      dist += step;
      
      const gx = Math.floor(x);
      const gy = Math.floor(y);
      const sector = this.world.getSector(x, y);
      
      if (!sector.walkable) {
        // Check visibility
        const visible = this.visibility ? this.visibility.isVisible(gx, gy) : true;
        const discovered = this.visibility ? this.visibility.isDiscovered(gx, gy) : true;
        
        if (!visible && !discovered) return;
        
        // Fish-eye correction
        const correctedDist = dist * Math.cos(rayAngle - viewAngle);
        
        // Wall height
        const wallHeight = Math.min(screenH * 2, (screenH * 0.85) / correctedDist);
        const wallTop = (screenH - wallHeight) / 2;
        
        // Get wall color
        let [r, g, b] = sector.wallColor;
        
        // Side shading (N/S vs E/W walls)
        const fractX = x - gx;
        const fractY = y - gy;
        const isNS = (fractX < 0.05 || fractX > 0.95);
        
        if (isNS) {
          r *= 0.8;
          g *= 0.8;
          b *= 0.8;
        }
        
        // Distance shading
        const shade = Math.max(this.ambientLight, 1.0 - correctedDist * this.distanceShade);
        r *= shade;
        g *= shade;
        b *= shade;
        
        // Fog
        const fogAmount = Math.max(0, Math.min(1, 
          (correctedDist - this.fogStart) / (this.fogEnd - this.fogStart)
        ));
        const [fogR, fogG, fogB] = this.fogColor;
        r = r * (1 - fogAmount) + fogR * fogAmount;
        g = g * (1 - fogAmount) + fogG * fogAmount;
        b = b * (1 - fogAmount) + fogB * fogAmount;
        
        // Desaturate if discovered but not visible
        if (!visible && discovered) {
          const lum = (r + g + b) / 3;
          r = lum * 0.6;
          g = lum * 0.6;
          b = lum * 0.65;
        }
        
        // Draw wall column
        const ctx = this.ctx;
        ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
        ctx.fillRect(column * columnWidth, wallTop, columnWidth + 1, wallHeight);
        
        // Edge highlight for depth
        if (visible && isNS && columnWidth > 1) {
          ctx.fillStyle = `rgba(255,255,255,${0.08 * shade})`;
          ctx.fillRect(column * columnWidth, wallTop, 1, wallHeight);
        }
        
        this.stats.wallsDrawn++;
        return;
      }
    }
  }
  
  /**
   * Draw crosshair overlay
   */
  drawCrosshair(color = 'rgba(51, 255, 51, 0.7)') {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 5, cy);
    ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + 12, cy);
    ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 5);
    ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + 12);
    ctx.stroke();
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * Draw a message on screen
   * @param {string} text - Message text
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Style options
   */
  drawText(text, x, y, options = {}) {
    const ctx = this.ctx;
    ctx.font = options.font || '14px monospace';
    ctx.fillStyle = options.color || '#33ff33';
    ctx.textAlign = options.align || 'left';
    ctx.textBaseline = options.baseline || 'top';
    ctx.fillText(text, x, y);
  }
  
  /**
   * Get rendering stats
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }
  
  /**
   * Update configuration
   * @param {Object} config
   */
  configure(config) {
    Object.assign(this, config);
    return this;
  }
}

export default Canvas2DRenderer;
