import { lines } from  "./utils.js";
import * as fs from "fs";

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
};

export function read(data) {
  var lines = lines(data);
  var result = [];
  for (line in lines) {
    var chars = line.split(" ");
    var layer = [];
    for (c in chars) {
      layer.push(parseInt(c));
    }
    result.push(layer);
  }
};

export function load(path, callback) {
  fs.readFile(path, "utf-8", function (err, data) {
    if (err) throw err;

    var maze = read(data);
    callback(maze);
  });
};
