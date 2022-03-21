import {JsonInitialized, Position, List, readDataFolder} from "./utils.js";
import {World} from "./world.js"
import {enemies, Enemy} from "./enemies";

export class Maze {
    array: Tile[][];
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

    constructor(array: number[][], start: [number, number], end: [number, number], enemies: { pos: [number, number], type: number }[], size: [number, number], player: { damage: number; hp: number }, tiles: { [id: string]: any } = {}, data: MazeData = {
        name: "",
        dependencies: [],
        tutorial: false,
        order: "custom",
        text: []
    }) {
        this.array = List(size[0], function (x) {
            return List(size[1], function (y) {
                let tile = array[x][y];
                if (tile == Type.wall) {
                    return new Tile(Type.wall, [x, y])
                } else if (tile == Type.stone) {
                    return new Tile(Type.stone, [x, y])
                } else {
                    return new Tile(Type.custom, [x, y], tiles[tile])
                }
            });
        });
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

    set(x: number, y: number, value: Tile) {
        this.array[x][y] = value;
    }

    isWall(x: number, y: number) {
        return x >= 0 && x < this.size[0] && y >= 0 && y < this.size[1] && this.get(x, y).type == Type.wall;
    }

    tick(world: World) {
        this.array.forEach(row => row.forEach(tile => tile.tick(world)));
    }
}

type MazeData = {
    dependencies: string[],
    name: string,
    tutorial: boolean,
    order: string,
    text: string[]
}

class Tile {
    type: Type;
    data?: TileData;
    pos: Position;

    constructor(type: Type, pos: [number, number] | Position, data: any | null = null) {
        this.type = type;
        this.pos = new Position(pos);
        if (type == Type.custom) {
            this.data = new TileData(data, this.pos);
        }
    }

    tick(world: World) {
        if (this.type == Type.custom) {
            this.data!.tick(world);
        }
    }
}

class TileData extends JsonInitialized {
    spawner!: TileSpawnerData;

    constructor(data: any | null, pos: Position) {
        super();
        this.loadData(data, {
            spawner: {
                default: null,
                creator: v => new TileSpawnerData(v, pos),
            },
        });
    }

    tick(world: World) {
        this.spawner.tick(world);
    }
}

class TileSpawnerData extends JsonInitialized {
    enemy!: number;
    cooldown!: number;
    cooldownLeft: number
    pos: Position;

    constructor(data: any | null, pos: Position) {
        super();
        this.loadData(data, {
            entity: {
                default: -1,
            },
            cooldown: {
                default: 4,
            }
        });
        this.cooldownLeft = this.cooldown;
        this.pos = pos;
    }

    tick(world: World) {
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

export enum Type {
    wall,
    stone,
    custom
}

export function create(x: number, y: number) {
    let array: number[][] = [];
    for (let i = 0; i < x; i++) {
        let layer: number[] = [];
        for (let j = 0; j < y; j++) {
            layer.push(Type.wall);
        }
        array.push(layer);
    }
    return new Maze(array, [0, 0], [x - 1, y - 1], [], [x, y], {hp: 100, damage: 24});
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