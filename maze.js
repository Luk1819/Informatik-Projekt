const utils = require("./utils.js")


const types = {
  wall: 0,
  stone: 1
}


exports.types = types

exports.create = function (x, y) {
  array = [];
  for (let i = 0; i < x; i++) {
    layer = []
    for (let j = 0; j < y; j++) {
      layer.push(types.wall)
    }
    array.push(layer)
  }
};


exports.read = function (data) {
  var lines = utils.lines(data)
  var result = []
  for (line in lines) {
    var chars = line.split(" ")
    var layer = []
    for (c in chars) {
      layer.push(parseInt(c))
    }
    result.push(layer)
  }
}

exports.load = function (path) {
  // TODO: load file as maze
}
