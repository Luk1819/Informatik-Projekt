import * as enemies from "./enemies.js";
import * as mazes from "./maze.js";

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
        let [x, y] = maze.start;
        this.player = [x, y];
        this.set(x, y, {
            type: 0,
            health: 100
        });
        
        x = 0;
        for (let row of maze.enemies) {
            y = 0;
            
            for (let e of row) {
                if (e != -1) {
                    this.set(x, y, enemies.enemiesByType[e].createInstance());
                }
                
                y++;
            }
            
            x++;
        }
    }
    
    get(x, y) {
        const line = this.entities[x];
        if (line) {
            let res = line[y];
            
            return res ? res : null;
        } else {
            return null;
        }
    }
    
    set(x, y, value) {
        const line = this.entities[x];
        if (line) {
            line[y] = value;
        } else {
            this.entities[x] = {};
            this.entities[x][y] = value;
        }
    }
    
    walk(dir) {
        let [x, y] = this.player;
        let player = this.get(x, y);
        
        let moveTo = (newx, newy) => {
            if (newx < 0 || newy < 0 || newx >= this.maze.size[0] || newy >= this.maze.size[1]) {
                return false;
            }
            
            let target = this.get(newx, newy);
            let targetTile = this.maze.get(newx, newy);
            
            if (target == null && targetTile !== mazes.types.wall) {
                this.set(x, y, null);
                this.set(newx, newy, player);
                this.player = [newx, newy];
                
                return true;
            } else if (target != null) {
                target.health -= 24;
                
                if (target.health <= 0) {
                    this.set(newx, newy, null);
                }
                
                return true;
            } else {
                return false;
            }
        };
        
        if (dir == directions.west) {
            return moveTo(x, y - 1);
        } else if (dir == directions.south) {
            return moveTo(x + 1, y);
        } else if (dir == directions.east) {
            return moveTo(x, y + 1);
        } else if (dir == directions.north) {
            return moveTo(x - 1, y);
        }
    }
}

export function create(maze) {
    return new World(maze);
}
