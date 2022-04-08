import {JsonInitialized, Position, List, readDataFolder} from "./utils.js";
import { WorldDataSegment, World, WorldDataType } from "./world.js";

export type TileDefinition<T> = { [id: (number | string)]: T };

// A maze / template
export class Maze {
    array: TileData[][];
    start: Position;
    end: Position;
    enemies: {
        pos: [number, number],
        type: number
    }[];
    size: [number, number];
    player: {
        hp: number,
        damage: number
    }

    data: MazeData;

    constructor(array: (number | string)[][], start: [number, number], end: [number, number], enemies: { pos: [number, number], type: number }[], size: [number, number], player: { damage: number; hp: number }, tiles: TileDefinition<any> = {}, data: MazeData = {
        name: "",
        dependencies: [],
        tutorial: false,
        order: "custom",
        text: []
    }) {
        // Parse the tiles
        this.array = readTiles(size, array, tiles);
        this.start = new Position(start);
        this.end = new Position(end);
        this.enemies = enemies;
        this.size = size;
        this.player = player;
        this.data = data;
    }

    // Returns the tile at the given position
    get(x: number, y: number) {
        return this.array[x][y];
    }

    // Sets the tile at the given position
    set(x: number, y: number, value: TileData) {
        this.array[x][y] = value;
    }
}

type MazeData = {
    dependencies: string[],
    name: string,
    tutorial: boolean,
    order: string,
    text: string[]
}

// An actual tile
export class Tile {
    data: TileDataInstance;
    pos: Position;
    world: World;

    constructor(pos: [number, number] | Position, world: World, data: TileData) {
        this.pos = new Position(pos);
        this.world = world;
        this.data = data.create(this.pos, this.world);
    }

    // Ticks this tile's data
    tick() {
        this.data.tick();
    }
}

// The template for a tile
export class TileData extends JsonInitialized {
    // Creator for the spawner data
    spawner!: (pos: Position, world: World) => TileSpawnerData;
    // Creator for the portal data
    portal!: (pos: Position, world: World) => TilePortalData;
    // This tile blocks entities from entering it
    wall!: boolean;
    // One cannot see through this tile
    blocksVision!: boolean;
    // This tile looks like a wall
    fill!: boolean;
    // The template for this tile's name
    name!: string;
    // The template for this tile's minimap symbol
    mapName!: string;

    constructor(data: any = {}) {
        super();
        this.loadData(data, {
            spawner: {
                default: null,
                creator: v => ((pos: Position, world: World) => new TileSpawnerData(v, world, pos)),
            },
            portal: {
                default: null,
                creator: v => ((pos: Position, world: World) => new TilePortalData(v, world, pos)),
            },
            wall: {
                default: false,
            },
            blocksVision: {
                default: false,
            },
            fill: {
                default: false,
            },
            name: {
                default: "{bold.italic.rgb(255,100,0) unknown}"
            },
            mapName: {
                default: "{bold.italic.rgb(255,100,0) %}"
            }
        });
    }

    // Create an instance of this tile
    create(pos: Position, world: World) {
        return new TileDataInstance(this, pos, world);
    }
}

// Tile behavoiur, e.g. a portal or spawner
interface TileBehaviourData {
    tick(tileData: TileDataInstance);
}

// The instance of a tile (with actual spawner data)
class TileDataInstance {
    spawner: TileSpawnerData;
    portal: TilePortalData;
    wall: boolean;
    blocksVision: boolean;
    fill: boolean;
    name: string;
    mapName: string;
    pos: Position;
    world: World;

    constructor(data: TileData, pos: Position, world: World) {
        this.spawner = data.spawner(pos, world);
        this.portal = data.portal(pos, world);
        this.wall = data.wall;
        this.blocksVision = data.blocksVision;
        this.fill = data.fill || data.wall;
        this.name = data.name;
        this.mapName = data.mapName;
        this.pos = pos;
        this.world = world;
    }

    // Tick this tile's behaviours
    tick() {
        this.spawner.tick(this);
        this.portal.tick(this);
    }
}

// The spawner component of a tile
class TileSpawnerData extends JsonInitialized implements TileBehaviourData {
    // The enemy type to spawn
    enemy!: number;
    // The cooldown after an enemy was spawned
    cooldown!: number;
    // The cooldown curently left
    cooldownLeft: number
    pos: Position;
    world: World;

    constructor(data: any | null, world: World, pos: Position) {
        super();
        this.loadData(data, {
            enemy: {
                default: -1,
            },
            cooldown: {
                default: 4,
            }
        });
        this.cooldownLeft = this.cooldown;
        this.pos = pos;
        this.world = world;
    }

    // Ticks this spawner
    tick(tileData: TileDataInstance) {
        // If on a wall, we cannot spawn anything
        if (tileData.wall) {
            return;
        }

        // Only spawn if there is something to spawn
        if (this.enemy != -1) {
            if (this.cooldownLeft <= 0 && this.world.get(this.pos.x, this.pos.y) == null) {
                this.world.set(this.pos.x, this.pos.y, this.world.createEnemy(this.enemy));
                this.cooldownLeft = this.cooldown;
            } else {
                this.cooldownLeft -= 1;
            }
        }
    }
}

// The data stored per world for the portal component
class WorldPortalData implements WorldDataSegment {
    world: World;
    // The portals registered per id (frequency)
    portals: { [id: string]: Position[] } = {};
    // Whether the player was teleported this turn
    teleported: boolean = false;

    constructor(world: World) {
        this.world = world;
    }

    // Allow the player to teleport again
    newTurn() {
        this.teleported = false;
    }

    // Registers a portal
    registerPortal(portal: TilePortalData) {
        let all = this.portals[portal.id];
        if (all) {
            all.push(portal.pos);
        } else {
            all = [portal.pos];
            this.portals[portal.id] = all;
        }
    }

    // Returns the portal to teleport to
    getTarget(portal: TilePortalData) {
        let all = this.portals[portal.id].filter(v => !Position.equals(v, portal.pos));
        if (all.length == 0) {
            return null;
        }
        return all[Math.floor(Math.random() * all.length)];
    }
}

const WorldPortalDataType: WorldDataType<WorldPortalData> = WorldPortalData;

// The portal component of a tile
export class TilePortalData extends JsonInitialized implements TileBehaviourData {
    // The id (frequency) of this portal
    id!: string | -1;
    // Whether this portal can be  teleported  to
    isTarget!: boolean;
    // Whether the player can teleport away from this portal
    isSource!: boolean;
    pos: Position;
    world: World;

    constructor(data: any | null, world: World, pos: Position) {
        super();
        this.loadData(data, {
            id: {
                default: -1,
            },
            isTarget: {
                default: true,
            },
            isSource: {
                default: true,
            }
        });
        this.pos = pos;
        this.world = world;

        // Create the world data if it doesn't exist yet
        if (!this.world.data.get(WorldPortalDataType)) {
            this.world.data.register(WorldPortalDataType);
        }

        // Only register if we allow the player to telelport here
        if (this.isTarget) {
            this.world.data.get(WorldPortalDataType)!.registerPortal(this);
        }
    }

    // Ticks this portal
    tick(tileData: TileDataInstance) {
        // Only teleport if allowed and the player is on this  tile
        if (this.isSource && this.id != -1 && !this.world.data.get(WorldPortalDataType)!.teleported && Position.equals(this.world.player, this.pos)) {
            let target = this.world.data.get(WorldPortalDataType)!.getTarget(this)
            // Also check there is nothing on the target tile
            if (target != null && this.world.get(target.x, target.y) == null) {
                let {x, y} = this.world.player;
                let player = this.world.get(x, y);
                this.world.set(x, y, null);
                this.world.set(target.x, target.y, player);
                this.world.player = target;

                this.world.markVisibilityDirty();
				this.world.visit();

                this.world.data.get(WorldPortalDataType)!.teleported = true;
            }
        }
    }
}

// Parse the tile definitions into the TileData array
export function readTiles(size: [number, number], array: (number | string)[][], tiles: TileDefinition<any>) {
    return List(size[0], function (x) {
        return List(size[1], function (y) {
            let tile = array[x][y];
            if (tile in defaultTiles) {
                return defaultTiles[tile]
            } else {
                return new TileData(tiles[tile]);
            }
        });
    });
}

// Create an empty maze of the given size
export function create(x: number, y: number) {
    let array: (number | string)[][] = [];
    for (let i = 0; i < x; i++) {
        let layer: number[] = [];
        for (let j = 0; j < y; j++) {
            layer.push(0);
        }
        array.push(layer);
    }
    return new Maze(array, [0, 0], [x - 1, y - 1], [], [x, y], {hp: 100, damage: 24});
}

// The default tile types (wall and stone)
const defaultTiles: TileDefinition<TileData> = {
    0: new TileData({
        wall: true,
        blocksVision: true,
        name: "{black.italic.bold Wall}",
        mapName: "{black.italic.bold #}"
    }),
    1: new TileData({
        name: "{gray Stone}",
        mapName: "{gray _}"
    })
}

// The loaded mazes
export const mazes: { [id: string]: Maze } = {};

// Loads a maze and registers it
export function read(id: string, data: string) {
    const json = JSON.parse(data);

    let maze = new Maze(json.maze, json.start, json.end, json.enemies, [json.maze.length, json.maze[0].length], json.player, json.tiles || {}, {
        dependencies: json.dependencies,
        name: json.name,
        tutorial: json.tutorial || false,
        order: json.order,
        text: json.text || []
    });
    mazes[id] = maze;
    return maze;
}

// Loads mazes in the ./mazes/ folder
export function discover() {
    readDataFolder("mazes", read);
}