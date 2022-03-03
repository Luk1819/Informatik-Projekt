import * as fs from "fs";
import * as path from "path";
import { __dirname } from "./utils.js";

//maze with array start end enemies

class Maze {
    array;
    start;
    end;
    enemies;
    size;
    
    constructor(array, start, end, enemies, size) {
        this.array = array;
        this.start = start;
        this.end = end;
        this.enemies = enemies;
        this.size = size;
    }
    
    get(x, y) {
        return this.array[x][y];
    }
    
    set(x, y, value) {
        this.array[x][y] = value;
    }
    
    isWall(x, y) {
        return x >= 0 && x < this.size[0] && y >= 0 && y <= this.size[1] && this.get(x, y) == types.wall;
    }
}

export const types = {
    wall: 0,
    stone: 1,
};

export function create(x, y) {
    let array = [];
    for (let i = 0; i < x; i++) {
        let layer = [];
        for (let j = 0; j < y; j++) {
            layer.push(types.wall);
        }
        array.push(layer);
    }
    return new Maze(array, [0, 0], [x - 1, y - 1], [x, y]);
}

export function read(data) {
    const json = JSON.parse(data);
    
    const start = json.start;
    const end = json.end;
    
    return new Maze(json.maze, start, end, json.enemies, [json.maze[0].length, json.maze.length]);
}

export function load(path1) {
    const data = fs.readFileSync(path.join(__dirname, path1), {encoding: "utf8"});
    return read(data);
}
