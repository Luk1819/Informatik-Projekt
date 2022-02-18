const utils = require("./utils.js");
const fs = require("fs");

var types = (exports.types = {
  wall: 0,
  stone: 1,
});

var create = (exports.create = function (x, y) {
  array = [];
  for (let i = 0; i < x; i++) {
    layer = [];
    for (let j = 0; j < y; j++) {
      layer.push(types.wall);
    }
    array.push(layer);
  }
});

var read = (exports.read = function (data) {
  var lines = utils.lines(data);
  var result = [];
  for (line in lines) {
    var chars = line.split(" ");
    var layer = [];
    for (c in chars) {
      layer.push(parseInt(c));
    }
    result.push(layer);
  }
});

var load = (exports.load = function (path, callback) {
  fs.readFile(path, "utf-8", function (err, data) {
    if (err) throw err;

    var maze = read(data);
    callback(maze);
  });
});
