import * as fs from "fs";

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
  return Maze(array, [0, 0], [x - 1, y - 1]);
}

export function read(data) {
  var json = JSON.parse(data);
  
  var start = json.start.split(" ").map(function (value) {
    return parseInt(value);
  });
  var end = json.end.split(" ").map(function (value) {
    return parseInt(value);
  });

  return Maze(json.maze, start, end, json.enemies);
}

export async function load(path) {
  var data = await fs.readFile(path, "utf-8");
  return read(data);
}
