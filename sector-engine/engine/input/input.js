/**
 * SECTOR ENGINE - Input Module
 * 
 * Unified input handling supporting:
 * - Keyboard
 * - Mouse (with pointer lock support)
 * - Touch (future)
 * - Gamepad (future)
 * 
 * Provides both raw input state and higher-level "actions" that
 * can be bound to different inputs.
 */

export class Input {
  constructor(config = {}) {
    // Raw input state
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      buttons: {},
      wheel: 0,
      locked: false
    };
    
    // Configuration
    this.mouseSensitivity = config.mouseSensitivity || 0.002;
    this.keyTurnSpeed = config.keyTurnSpeed || 2.2;
    this.invertY = config.invertY || false;
    
    // Action bindings
    this.actionBindings = new Map();
    this.actionStates = new Map();
    
    // Pointer lock target
    this.lockTarget = null;
    
    // Event callbacks
    this.listeners = {
      action: [],
      pointerLockChange: []
    };
    
    // Setup default bindings
    this._setupDefaultBindings();
  }
  
  /**
   * Initialize input handling on a target element
   * @param {HTMLElement} element - Element for mouse/touch events
   */
  init(element = document.body) {
    this.lockTarget = element;
    
    // Keyboard
    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._onKeyUp(e));
    
    // Mouse
    document.addEventListener('mousemove', (e) => this._onMouseMove(e));
    document.addEventListener('mousedown', (e) => this._onMouseDown(e));
    document.addEventListener('mouseup', (e) => this._onMouseUp(e));
    document.addEventListener('wheel', (e) => this._onWheel(e));
    
    // Pointer lock
    document.addEventListener('pointerlockchange', () => this._onPointerLockChange());
    
    // Click to lock
    element.addEventListener('click', () => {
      if (!this.mouse.locked) {
        this.requestPointerLock();
      }
    });
    
    return this;
  }
  
  /**
   * Setup default action bindings
   */
  _setupDefaultBindings() {
    // Movement
    this.bindAction('moveForward', ['KeyW', 'ArrowUp']);
    this.bindAction('moveBackward', ['KeyS', 'ArrowDown']);
    this.bindAction('strafeLeft', ['KeyA']);
    this.bindAction('strafeRight', ['KeyD']);
    this.bindAction('turnLeft', ['ArrowLeft']);
    this.bindAction('turnRight', ['ArrowRight']);
    this.bindAction('run', ['ShiftLeft', 'ShiftRight']);
    
    // Actions
    this.bindAction('use', ['KeyE', 'Space']);
    this.bindAction('fire', ['MouseLeft']);
    this.bindAction('altFire', ['MouseRight']);
    
    // UI
    this.bindAction('menu', ['Escape']);
    this.bindAction('map', ['Tab', 'KeyM']);
  }
  
  /**
   * Bind an action to input(s)
   * @param {string} action - Action name
   * @param {Array<string>} inputs - Array of input codes
   */
  bindAction(action, inputs) {
    this.actionBindings.set(action, inputs);
    this.actionStates.set(action, { pressed: false, justPressed: false, justReleased: false });
    return this;
  }
  
  /**
   * Check if an action is currently active
   * @param {string} action - Action name
   * @returns {boolean}
   */
  isActionActive(action) {
    for (const input of (this.actionBindings.get(action) || [])) {
      if (input.startsWith('Mouse')) {
        const button = input.replace('Mouse', '').toLowerCase();
        if (this.mouse.buttons[button]) return true;
      } else {
        if (this.keys[input]) return true;
      }
    }
    return false;
  }
  
  /**
   * Check if a key is currently pressed
   * @param {string} code - Key code (e.g., 'KeyW', 'Space')
   * @returns {boolean}
   */
  isKeyPressed(code) {
    return this.keys[code] === true;
  }
  
  /**
   * Check if a mouse button is pressed
   * @param {number|string} button - Button index or name ('left', 'right', 'middle')
   * @returns {boolean}
   */
  isMousePressed(button) {
    if (typeof button === 'string') {
      return this.mouse.buttons[button] === true;
    }
    const names = ['left', 'middle', 'right'];
    return this.mouse.buttons[names[button]] === true;
  }
  
  /**
   * Get and reset mouse delta
   * @returns {{ dx: number, dy: number }}
   */
  getMouseDelta() {
    const dx = this.mouse.dx;
    const dy = this.invertY ? -this.mouse.dy : this.mouse.dy;
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    return { dx, dy };
  }
  
  /**
   * Get and reset mouse wheel delta
   * @returns {number}
   */
  getWheelDelta() {
    const delta = this.mouse.wheel;
    this.mouse.wheel = 0;
    return delta;
  }
  
  /**
   * Request pointer lock on target element
   */
  requestPointerLock() {
    if (this.lockTarget && !this.mouse.locked) {
      this.lockTarget.requestPointerLock();
    }
  }
  
  /**
   * Exit pointer lock
   */
  exitPointerLock() {
    if (this.mouse.locked) {
      document.exitPointerLock();
    }
  }
  
  /**
   * Check if pointer is locked
   * @returns {boolean}
   */
  isPointerLocked() {
    return this.mouse.locked;
  }
  
  /**
   * Get movement vector from input state
   * @param {number} dt - Delta time
   * @param {number} baseSpeed - Base movement speed
   * @returns {{ forward: number, strafe: number, turn: number }}
   */
  getMovementInput(dt, baseSpeed = 1) {
    let forward = 0;
    let strafe = 0;
    let turn = 0;
    
    // Forward/backward
    if (this.isActionActive('moveForward')) forward += baseSpeed;
    if (this.isActionActive('moveBackward')) forward -= baseSpeed;
    
    // Strafe
    if (this.isActionActive('strafeLeft')) strafe -= baseSpeed;
    if (this.isActionActive('strafeRight')) strafe += baseSpeed;
    
    // Keyboard turning
    if (this.isActionActive('turnLeft')) turn -= this.keyTurnSpeed * dt;
    if (this.isActionActive('turnRight')) turn += this.keyTurnSpeed * dt;
    
    // Mouse turning (when locked)
    if (this.mouse.locked) {
      const { dx } = this.getMouseDelta();
      turn += dx * this.mouseSensitivity;
    }
    
    // Run modifier
    if (this.isActionActive('run')) {
      forward *= 1.7;
      strafe *= 1.7;
    }
    
    return { forward, strafe, turn };
  }
  
  // Event handlers
  _onKeyDown(e) {
    if (this.keys[e.code]) return; // Ignore repeats
    
    this.keys[e.code] = true;
    
    // Prevent default for game keys
    const gameKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'];
    if (gameKeys.includes(e.code)) {
      e.preventDefault();
    }
    
    this._emit('action', { type: 'keydown', code: e.code });
  }
  
  _onKeyUp(e) {
    this.keys[e.code] = false;
    this._emit('action', { type: 'keyup', code: e.code });
  }
  
  _onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    
    if (this.mouse.locked) {
      this.mouse.dx += e.movementX;
      this.mouse.dy += e.movementY;
    }
  }
  
  _onMouseDown(e) {
    const names = ['left', 'middle', 'right'];
    this.mouse.buttons[names[e.button]] = true;
    this._emit('action', { type: 'mousedown', button: names[e.button] });
  }
  
  _onMouseUp(e) {
    const names = ['left', 'middle', 'right'];
    this.mouse.buttons[names[e.button]] = false;
    this._emit('action', { type: 'mouseup', button: names[e.button] });
  }
  
  _onWheel(e) {
    this.mouse.wheel += Math.sign(e.deltaY);
  }
  
  _onPointerLockChange() {
    this.mouse.locked = document.pointerLockElement === this.lockTarget;
    this._emit('pointerLockChange', { locked: this.mouse.locked });
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
  
  /**
   * Serialize input bindings for settings
   * @returns {Object}
   */
  serializeBindings() {
    return Object.fromEntries(this.actionBindings);
  }
  
  /**
   * Load input bindings from settings
   * @param {Object} bindings
   */
  deserializeBindings(bindings) {
    for (const [action, inputs] of Object.entries(bindings)) {
      this.bindAction(action, inputs);
    }
  }
}

export default Input;
