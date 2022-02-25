import * as fs from "fs";
import { path } from "path";
import { __dirname } from "./utils.js"

class Maze {
  array;
  start;
  end;
  enemies;

  constructor(array, start, end, enemies) {
    this.array = array;
    this.start = start;
    this.end = end;
    this.enemies = enemies;
  }

  get(x, y) {
    return array[x][y];
  }

  set(x, y, value) {
    array[x][y] = value;
  }
}

export const types = {
  wall: 0,
  stone: 1,
};

export function create(x, y) {
  array = [];
  for (let i = 0; i < x; i++) {
    layer = [];
    for (let j = 0; j < y; j++) {
      layer.push(types.wall);
    }
    array.push(layer);
  }
  return new Maze(array, [0, 0], [x - 1, y - 1]);
}

export function read(data) {
  var json = JSON.parse(data);
  
  var start = json.start;
  var end = json.end;

  return new Maze(json.maze, start, end, json.enemies);
}

export function load(path) {
  var data = fs.readFileSync(path.join(__dirname, path), { encoding: 'utf8' });
  return read(data);
}
