export const directions = {
  west: 0,
  south: 1,
  east: 2,
  north: 3,
};

class World {
  maze;
  entities;

  constructor(maze) {
    this.maze = maze;
    this.entities = {};
  }

  get(x, y) {
    var line = entities[x];
    if (line) {
      return line[y];
    } else {
      return null;
    }
  }

  set(x, y, value) {
    var line = entities[x];
    if (line) {
      line[y] = value;
    } else {
      entities[x] = {};
      entities[x][y] = value;
    }
  }

  walk(dir) {
    if (dir == directions.west) {
    } else if (dir == directions.south) {
    } else if (dir == directions.east) {
    } else if (dir == directions.north) {
    }
  }
}
