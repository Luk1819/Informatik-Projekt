import * as fs from "fs";
import { globby } from "globby";
import * as path from "path";
import { __dirname } from "./utils.js";

class Maze {
    array;
    start;
    end;
    enemies;
    size;
    player;
    
    data;
    
    constructor(array, start, end, enemies, size, player, data={name: "", dependencies: [], tutorial: false, order: "custom"}) {
        this.array = array;
        this.start = start;
        this.end = end;
        this.enemies = enemies;
        this.size = size;
        this.player = player;
        this.data = data;
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
    return new Maze(array, [0, 0], [x - 1, y - 1], [x, y], { hp: 100, damage: 24 });
}

export const mazes = {};

export function read(id, data) {
    const json = JSON.parse(data);

    let maze = new Maze(json.maze, json.start, json.end, json.enemies, [json.maze.length, json.maze[0].length], json.player, {dependencies: json.dependencies, name: json.name, tutorial: json.tutorial || false, order: json.order});
    mazes[id] = maze;
    return maze;
}

export function load(path1) {
    const data = fs.readFileSync(path.join(__dirname, path1), {encoding: "utf8"});
    const id = /mazes\/(.*)\.json/.exec(path1)[1]
    return read(id, data);
}

export async function discover() {
    const entries = await globby("mazes/*.json");
    for (let file of entries) {
        load(file);
    }
}