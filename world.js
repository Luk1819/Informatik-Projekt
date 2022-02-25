export const directions = {
  west: 0,
  south: 1,
  east: 2,
  north: 3,
};

class World {
  maze;
  entities;
  player;

  constructor(maze) {
    this.maze = maze;
    this.entities = {};
    this.player = maze.start;
    set()
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
    var [x, y] = this.player;
    if (dir == directions.west) {
      if(this.get(x - 1, y)  != null && this.get(x - 1, y) == 1) {
        return true;
      }
      else {
        return false;
      }
    } else if (dir == directions.south) {
      if(this.get(x, y + 1)  != null && this.get(x, y + 1) == 1) {
        return true;
      }
      else {
        return false;
      }
    } else if (dir == directions.east) {
      if(this.get(x + 1, y)  != null && this.get(x + 1, y) == 1) {
        return true;
      }
      else {
        return false;
      }
    } else if (dir == directions.north) {
      if(this.get(x, y - 1)  != null && this.get(x, y - 1) == 1) {
        return true;
      }
      else {
        return false;
      }
    }
  }
}
