import { Direction } from "./world.js";
import {readDataFolder} from "./utils.js";
import {readTiles, TileData, TileDefinition} from "./maze.js";

export class Module {
    directions: Direction[];
    maze: TileData[][];
    enemies: { pos: [number, number]; type: number }[];
    goalPos: [number, number];

    constructor(directions: (Direction | string)[], maze: (number | string)[][], enemies: { pos: [number, number], type: number }[], tiles: TileDefinition<any> = {}, goalPos: [number, number]) {
        this.directions = directions.map(function (dir: Direction | string) {
            if (typeof dir == "string") {
                return Direction.fromString(dir);
            } else {
                return dir;
            }
        });
        this.maze = readTiles(size, maze, tiles);
        this.enemies = enemies;
        this.goalPos = goalPos;
    }
}


export const size: [number, number] = [ 3, 3 ]


export const modules: Module[] = [];

export function create(id: string, directions: (Direction | string)[], maze: (number | string)[][], enemies: { pos: [number, number], type: number }[], tiles: TileDefinition<any> = {}, goalPos: [number, number]) {
    const module = new Module(directions, maze, enemies, tiles, goalPos);
    modules.push(module);
    return module;
}

export function read(id: string, data: string) {
    const json = JSON.parse(data);
    if (size[0] != json.maze.length || size[1] != json.maze[0].length) {
        throw Error("Illegal module size, got: " + json.maze.length + ", " + json.maze[0].length + " expected: " + size);
    }
    return create(id, json.directions, json.maze, json.enemies, json.tiles || {}, json.goalPos || [Math.floor((size[0] + 1) / 2), Math.floor((size[1] + 1) / 2)]);
}

export function discover() {
    readDataFolder("modules", read);
}
