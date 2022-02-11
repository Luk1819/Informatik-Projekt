
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
