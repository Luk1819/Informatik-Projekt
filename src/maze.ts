import {JsonInitialized, Position, List, readDataFolder} from "./utils.js";
import { WorldDataSegment, World, WorldDataType } from "./world.js";

export type TileDefinition<T> = { [id: (number | string)]: T };

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
        this.array = readTiles(size, array, tiles);
        this.start = new Position(start);
        this.end = new Position(end);
        this.enemies = enemies;
        this.size = size;
        this.player = player;
        this.data = data;
    }

    get(x: number, y: number) {
        return this.array[x][y];
    }

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

export class Tile {
    data: TileDataInstance;
    pos: Position;
    world: World;

    constructor(pos: [number, number] | Position, world: World, data: TileData) {
        this.pos = new Position(pos);
        this.world = world;
        this.data = data.create(this.pos, this.world);
    }

    tick() {
        this.data.tick();
    }
}

export class TileData extends JsonInitialized {
    spawner!: (pos: Position, world: World) => TileSpawnerData;
    portal!: (pos: Position, world: World) => TilePortalData;
    wall!: boolean;
    blocksVision!: boolean;
    name!: string;
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
            name: {
                default: "{bold.italic.rgb(255,100,0) unknown}"
            },
            mapName: {
                default: "{bold.italic.rgb(255,100,0) %}"
            }
        });
    }

    create(pos: Position, world: World) {
        return new TileDataInstance(this, pos, world);
    }
}

class TileDataInstance {
    spawner: TileSpawnerData;
    portal: TilePortalData;
    wall: boolean;
    blocksVision: boolean;
    name: string;
    mapName: string;
    pos: Position;

    constructor(data: TileData, pos: Position) {
        this.spawner = data.spawner(pos);
        this.portal = data.portal(pos);
        this.wall = data.wall;
        this.blocksVision = data.blocksVision;
        this.name = data.name;
        this.mapName = data.mapName;
        this.pos = pos;
    }

    tick() {
        this.spawner.tick(this);
        this.portal.tick(this);
    }
}

class TileSpawnerData extends JsonInitialized {
    enemy!: number;
    cooldown!: number;
    cooldownLeft: number
    pos: Position;

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
    }

    tick(tileData: TileDataInstance) {
        if (tileData.wall) {
            return;
        }

        if (this.enemy != -1) {
            if (this.cooldownLeft <= 0 && world.get(this.pos.x, this.pos.y) == null) {
                world.set(this.pos.x, this.pos.y, world.createEnemy(this.enemy));
                this.cooldownLeft = this.cooldown;
            } else {
                this.cooldownLeft -= 1;
            }
        }
    }
}

const WorldPortalDataType: WorldDataType<WorldPortalData> = WorldPortalData;

class WorldPortalData implements WorldDataSegment {
    world: World;
    portals: { [id: string]: Position[] } = {};
    teleported: boolean = false;

    constructor(world: World) {
        this.world = world;
    }

    newTurn() {
        this.teleported = false;
    }

    registerPortal(portal: TilePortalData) {
        let all = TilePortalData.portals[portal.id];
        if (all) {
            all.push(portal.pos);
        } else {
            all = [portal.pos];
            TilePortalData.portals[portal.id] = all;
        }
    }

    getTarget(portal: TilePortalData) {
        let all = TilePortalData.portals[portal.id].filter(v => !Position.equals(v, portal.pos));
        if (all.length == 0) {
            return null;
        }
        return all[Math.floor(Math.random() * all.length)];
    }
}

export class TilePortalData extends JsonInitialized {
    id!: string | -1;
    isTarget!: boolean;
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

        if (!world.data.get(WorldPortalDataType)) {
            world.data.register(WorldPortalDataType);
        }

        if (this.isTarget) {
            this.world.data.get(WorldPortalDataType).registerPortal(this);
        }
    }

    tick(tileData: TileDataInstance) {
        if (this.isSource && this.id != -1 && !this.world.data.get(WorldPortalDataType).teleported && Position.equals(world.player, this.pos)) {
            let target = this.world.data.get(WorldPortalDataType).getTarget(this)
            if (target != null && this.world.get(target.x, target.y) == null) {
                let {x, y} = this.world.player;
                let player = this.world.get(x, y);
                this.world.set(x, y, null);
                this.world.set(target.x, target.y, player);
                this.world.player = target;
				
				this.world.visit();

                this.world.data.get(WorldPortalDataType).teleported = true;
            }
        }
    }
}

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

export const mazes: { [id: string]: Maze } = {};

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

export function discover() {
    readDataFolder("mazes", read);
}