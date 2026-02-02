/**
 * GIGAMECH - Procedural Structure Generation
 * Indoor environments: hangars, factories, bases, bunkers
 */

// Structure types
export const STRUCTURE_TYPE = {
  HANGAR: 'hangar',
  FACTORY: 'factory',
  BUNKER: 'bunker',
  BASE: 'military_base',
  LAB: 'research_lab',
  WAREHOUSE: 'warehouse',
  REACTOR: 'reactor_facility',
};

// Room types for BSP
const ROOM_TYPE = {
  CORRIDOR: { minSize: 2, maxSize: 3, canSpawn: false },
  SMALL: { minSize: 4, maxSize: 6, canSpawn: true },
  MEDIUM: { minSize: 6, maxSize: 10, canSpawn: true },
  LARGE: { minSize: 10, maxSize: 16, canSpawn: true },
  HUGE: { minSize: 16, maxSize: 24, canSpawn: true },
};

/**
 * BSP Node for space partitioning
 */
class BSPNode {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.left = null;
    this.right = null;
    this.room = null;
    this.splitHorizontal = null;
  }

  split(minSize) {
    if (this.left || this.right) return false;

    // Determine split direction
    if (this.width > this.height && this.width / this.height >= 1.25) {
      this.splitHorizontal = false;
    } else if (this.height > this.width && this.height / this.width >= 1.25) {
      this.splitHorizontal = true;
    } else {
      this.splitHorizontal = Math.random() > 0.5;
    }

    const maxSize = (this.splitHorizontal ? this.height : this.width) - minSize;
    if (maxSize <= minSize) return false;

    const splitPos = minSize + Math.floor(Math.random() * (maxSize - minSize));

    if (this.splitHorizontal) {
      this.left = new BSPNode(this.x, this.y, this.width, splitPos);
      this.right = new BSPNode(this.x, this.y + splitPos, this.width, this.height - splitPos);
    } else {
      this.left = new BSPNode(this.x, this.y, splitPos, this.height);
      this.right = new BSPNode(this.x + splitPos, this.y, this.width - splitPos, this.height);
    }

    return true;
  }

  getLeaves() {
    if (!this.left && !this.right) return [this];
    const leaves = [];
    if (this.left) leaves.push(...this.left.getLeaves());
    if (this.right) leaves.push(...this.right.getLeaves());
    return leaves;
  }

  getRoom() {
    if (this.room) return this.room;
    if (this.left) {
      const leftRoom = this.left.getRoom();
      if (leftRoom) return leftRoom;
    }
    if (this.right) {
      const rightRoom = this.right.getRoom();
      if (rightRoom) return rightRoom;
    }
    return null;
  }
}

/**
 * Structure Generator using BSP
 */
export class StructureGenerator {
  constructor(config = {}) {
    this.width = config.width || 48;
    this.height = config.height || 48;
    this.seed = config.seed || Date.now();
    this.minRoomSize = config.minRoomSize || 6;
    this.maxDepth = config.maxDepth || 5;
  }

  /**
   * Generate a structure of the given type
   */
  generate(structureType, options = {}) {
    const grid = this._initGrid();
    const root = new BSPNode(1, 1, this.width - 2, this.height - 2);

    // BSP split
    this._splitBSP(root, 0);

    // Create rooms in leaves
    const leaves = root.getLeaves();
    const rooms = [];

    for (const leaf of leaves) {
      const room = this._createRoom(leaf, structureType);
      if (room) {
        rooms.push(room);
        this._carveRoom(grid, room);
      }
    }

    // Connect rooms with corridors
    this._connectRooms(grid, root);

    // Add structure-specific features
    this._addStructureFeatures(grid, structureType, rooms, options);

    // Place objectives
    const objectives = this._placeObjectives(grid, rooms, options);

    // Place enemies
    const enemySpawns = this._placeEnemies(grid, rooms, options);

    return {
      grid,
      rooms,
      objectives,
      enemySpawns,
      spawnPoint: this._findSpawnPoint(rooms),
      exitPoint: this._findExitPoint(rooms),
    };
  }

  _initGrid() {
    const grid = [];
    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = { type: 'wall', walkable: false };
      }
    }
    return grid;
  }

  _splitBSP(node, depth) {
    if (depth >= this.maxDepth) return;
    if (node.width < this.minRoomSize * 2 || node.height < this.minRoomSize * 2) return;

    if (node.split(this.minRoomSize)) {
      this._splitBSP(node.left, depth + 1);
      this._splitBSP(node.right, depth + 1);
    }
  }

  _createRoom(leaf, structureType) {
    // Inset room from leaf bounds
    const roomPadding = 1;
    const width = leaf.width - roomPadding * 2;
    const height = leaf.height - roomPadding * 2;

    if (width < 3 || height < 3) return null;

    const room = {
      x: leaf.x + roomPadding,
      y: leaf.y + roomPadding,
      width: width,
      height: height,
      center: {
        x: leaf.x + roomPadding + Math.floor(width / 2),
        y: leaf.y + roomPadding + Math.floor(height / 2),
      },
      type: this._determineRoomType(width, height, structureType),
    };

    leaf.room = room;
    return room;
  }

  _determineRoomType(width, height, structureType) {
    const area = width * height;

    // Structure-specific room types
    const roomTypes = {
      [STRUCTURE_TYPE.HANGAR]: ['hangar_bay', 'storage', 'control', 'repair'],
      [STRUCTURE_TYPE.FACTORY]: ['assembly', 'storage', 'control', 'loading'],
      [STRUCTURE_TYPE.BUNKER]: ['barracks', 'armory', 'command', 'generator'],
      [STRUCTURE_TYPE.BASE]: ['barracks', 'armory', 'command', 'mess_hall', 'motor_pool'],
      [STRUCTURE_TYPE.LAB]: ['lab', 'storage', 'office', 'containment'],
      [STRUCTURE_TYPE.WAREHOUSE]: ['storage', 'loading', 'office', 'maintenance'],
      [STRUCTURE_TYPE.REACTOR]: ['reactor', 'control', 'cooling', 'storage'],
    };

    const options = roomTypes[structureType] || ['room'];

    if (area > 150) return options[0]; // Main room type for large rooms
    if (area > 80) return options[Math.floor(Math.random() * 2)];
    return options[Math.floor(Math.random() * options.length)];
  }

  _carveRoom(grid, room) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
          grid[y][x] = {
            type: 'floor',
            walkable: true,
            roomType: room.type,
          };
        }
      }
    }
  }

  _connectRooms(grid, node) {
    if (!node.left || !node.right) return;

    const leftRoom = node.left.getRoom();
    const rightRoom = node.right.getRoom();

    if (leftRoom && rightRoom) {
      this._createCorridor(grid, leftRoom.center, rightRoom.center);
    }

    this._connectRooms(grid, node.left);
    this._connectRooms(grid, node.right);
  }

  _createCorridor(grid, start, end) {
    let x = start.x;
    let y = start.y;

    // L-shaped corridor
    while (x !== end.x) {
      if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
        grid[y][x] = { type: 'corridor', walkable: true };
        // Widen corridor
        if (y > 0) grid[y - 1][x] = { type: 'corridor', walkable: true };
        if (y < this.height - 1) grid[y + 1][x] = { type: 'corridor', walkable: true };
      }
      x += x < end.x ? 1 : -1;
    }

    while (y !== end.y) {
      if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
        grid[y][x] = { type: 'corridor', walkable: true };
        // Widen corridor
        if (x > 0) grid[y][x - 1] = { type: 'corridor', walkable: true };
        if (x < this.width - 1) grid[y][x + 1] = { type: 'corridor', walkable: true };
      }
      y += y < end.y ? 1 : -1;
    }
  }

  _addStructureFeatures(grid, structureType, rooms, options) {
    // Add pillars to large rooms
    for (const room of rooms) {
      if (room.width >= 8 && room.height >= 8) {
        this._addPillars(grid, room);
      }
    }

    // Add cover objects
    this._addCover(grid, rooms);

    // Structure-specific features
    switch (structureType) {
      case STRUCTURE_TYPE.HANGAR:
        this._addHangarFeatures(grid, rooms);
        break;
      case STRUCTURE_TYPE.FACTORY:
        this._addFactoryFeatures(grid, rooms);
        break;
      case STRUCTURE_TYPE.REACTOR:
        this._addReactorFeatures(grid, rooms);
        break;
    }
  }

  _addPillars(grid, room) {
    const spacing = 4;
    for (let y = room.y + 2; y < room.y + room.height - 2; y += spacing) {
      for (let x = room.x + 2; x < room.x + room.width - 2; x += spacing) {
        grid[y][x] = { type: 'pillar', walkable: false };
      }
    }
  }

  _addCover(grid, rooms) {
    for (const room of rooms) {
      // Add crates/cover along walls
      const coverCount = Math.floor((room.width + room.height) / 8);

      for (let i = 0; i < coverCount; i++) {
        const edge = Math.floor(Math.random() * 4);
        let x, y;

        switch (edge) {
          case 0: x = room.x + 1; y = room.y + 1 + Math.floor(Math.random() * (room.height - 2)); break;
          case 1: x = room.x + room.width - 2; y = room.y + 1 + Math.floor(Math.random() * (room.height - 2)); break;
          case 2: x = room.x + 1 + Math.floor(Math.random() * (room.width - 2)); y = room.y + 1; break;
          case 3: x = room.x + 1 + Math.floor(Math.random() * (room.width - 2)); y = room.y + room.height - 2; break;
        }

        if (grid[y][x].type === 'floor') {
          grid[y][x] = { type: 'crate', walkable: false, destructible: true };
        }
      }
    }
  }

  _addHangarFeatures(grid, rooms) {
    // Find largest room for mech bays
    const largestRoom = rooms.reduce((a, b) => (a.width * a.height > b.width * b.height) ? a : b);

    // Add mech bay markers
    const baySpacing = 5;
    for (let x = largestRoom.x + 3; x < largestRoom.x + largestRoom.width - 3; x += baySpacing) {
      const y = largestRoom.y + 2;
      grid[y][x] = { type: 'mech_bay', walkable: true, interactive: true };
    }
  }

  _addFactoryFeatures(grid, rooms) {
    // Add conveyor belts and machinery
    for (const room of rooms) {
      if (room.type === 'assembly' && room.width >= 6) {
        // Conveyor line
        const y = room.center.y;
        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
          if (grid[y][x].walkable) {
            grid[y][x] = { type: 'conveyor', walkable: true, hazard: false };
          }
        }
      }
    }
  }

  _addReactorFeatures(grid, rooms) {
    // Find reactor room
    const reactorRoom = rooms.find(r => r.type === 'reactor');
    if (reactorRoom) {
      // Central reactor core
      const cx = reactorRoom.center.x;
      const cy = reactorRoom.center.y;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          grid[cy + dy][cx + dx] = {
            type: 'reactor_core',
            walkable: false,
            objective: true,
            destructible: true,
          };
        }
      }
    }
  }

  _placeObjectives(grid, rooms, options) {
    const objectives = [];
    const objectiveCount = options.objectiveCount || 1;

    // Prioritize special rooms for objectives
    const priorityRooms = rooms.filter(r =>
      ['control', 'reactor', 'command', 'containment'].includes(r.type)
    );

    const targetRooms = priorityRooms.length > 0 ? priorityRooms : rooms;

    for (let i = 0; i < objectiveCount && i < targetRooms.length; i++) {
      const room = targetRooms[i];
      objectives.push({
        x: room.center.x,
        y: room.center.y,
        type: options.objectiveType || 'destroy',
        room: room,
      });
    }

    return objectives;
  }

  _placeEnemies(grid, rooms, options) {
    const spawns = [];
    const enemyCount = options.enemyCount || 3;

    // Distribute enemies across rooms
    const spawnableRooms = rooms.filter(r => r.width * r.height >= 30);

    for (let i = 0; i < enemyCount; i++) {
      const room = spawnableRooms[i % spawnableRooms.length];

      // Random position in room
      const x = room.x + 2 + Math.floor(Math.random() * (room.width - 4));
      const y = room.y + 2 + Math.floor(Math.random() * (room.height - 4));

      if (grid[y][x].walkable) {
        spawns.push({ x, y, room });
      }
    }

    return spawns;
  }

  _findSpawnPoint(rooms) {
    // Spawn in first/smallest room
    const spawnRoom = rooms.reduce((a, b) => (a.width * a.height < b.width * b.height) ? a : b);
    return { x: spawnRoom.center.x, y: spawnRoom.center.y };
  }

  _findExitPoint(rooms) {
    // Exit in last/largest room
    const exitRoom = rooms.reduce((a, b) => (a.width * a.height > b.width * b.height) ? a : b);
    return { x: exitRoom.center.x, y: exitRoom.center.y };
  }
}

export default StructureGenerator;
