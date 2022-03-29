import { Direction } from "./world.js";
import {readDataFolder, arrayEquals, println} from "./utils.js";
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


export function filterModules(modules: Module[], directions: Direction[]) {
    return modules.filter(function (module: Module) {
        return arrayEquals(directions, module.directions);
    });
}

function checkDirection(missing: Direction[][], toCheck: Direction[]) {
    let available = filterModules(modules, toCheck);
    if (available.length == 0 && !missing.some(v => arrayEquals(toCheck, v))) {
        missing.push(toCheck);
    }
}

export function check() {
    let missing: Direction[][] = [];

    for (let dir1 of Direction.values) {
        checkDirection(missing, [dir1]);
        for (let dir2 of Direction.values) {
            if (dir2 != dir1) {
                checkDirection(missing, [dir1, dir2]);
                for (let dir3 of Direction.values) {
                    if (dir3 != dir2 && dir3 != dir1) {
                        checkDirection(missing, [dir1, dir2, dir3]);
                        for (let dir4 of Direction.values) {
                            if (dir4 != dir3 && dir4 != dir2 && dir4 != dir1) {
                                checkDirection(missing, [dir1, dir2, dir3, dir4]);
                            }
                        }
                    }
                }
            }
        }
    }

    if (missing.length > 0) {
        for (let failed of missing) {
            println("Failed to find module for directions: [" + failed.map(Direction.toString) + "].");
        }
        throw Error("Missing modules. See above for details.");
    }
}


export const size: [number, number] = [ 7, 7 ]


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
    return create(id, json.directions, json.maze, json.enemies, json.tiles || {}, json.goalPos || [Math.floor((size[0] - 1) / 2), Math.floor((size[1] - 1) / 2)]);
}

export function discover() {
    readDataFolder("modules", read);
}
