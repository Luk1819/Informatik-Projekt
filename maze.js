import * as fs from "fs";

class Maze {
  array;
  start;
  end;

  constructor(array) {
    this.array = array;
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
  return Maze(array);
}

export function read(data) {
  var json = JSON.parse(data);
  var maze = Maze(json.maze);
  
  maze.start = json.start.split(" ").map(function (value) {
    return parseInt(value);
  });
  maze.end = json.end.split(" ").map(function (value) {
    return parseInt(value);
  });;
  return maze;
}

export function load(path, callback) {
  fs.readFile(path, "utf-8", function (err, data) {
    if (err) throw err;

    var maze = read(data);
    callback(maze);
  });
}
