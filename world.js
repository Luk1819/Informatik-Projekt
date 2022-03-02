import * as enemies from "./enemies.js";
import * as mazes from "./maze.js";
import { println } from "./utils.js";

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
    visited;
    
    constructor(maze) {
        this.maze = maze;
        this.entities = {};
        this.visited = {};
        let [x, y] = maze.start;
        this.player = [x, y];
        this.set(x, y, {
            type: 0,
            health: 100
        });
        
        this.visit();
        
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
    
    isVisited(x, y) {
        const line = this.visited[x];
        if (line) {
            let res = line[y];
            
            return res ? res : false;
        } else {
            return false;
        }
    }
    
    setVisited(x, y) {
        const line = this.visited[x];
        if (line) {
            line[y] = true;
        } else {
            this.visited[x] = {};
            this.visited[x][y] = true;
        }
    }
    
    visit() {
        let [x, y] = this.player;
        
        for (let i = x - 2; i <= x + 2; i++) {
            for (let j = y - 2; j <= y + 2; j++) {
                if (this.isVisible(i, j)) {
                    this.setVisited(i, j);
                }
            }
        }
    }
    
    isVisible(x, y) {
        let [px, py] = this.player;
        
        if (x == px && y == py) {
            //println(`${px},${py} to ${x},${y}: Equal`)
            return true;
        } else if (Math.abs(x - px) > 2 || Math.abs(y - py) > 2) {
            //println(`${px},${py} to ${x},${y}: Too far`)
            return false;
        } else if (Math.abs(x - px) < 2 && Math.abs(y - py) < 2) {
            //println(`${px},${py} to ${x},${y}: Directly besides`)
            return true;
        } else if (Math.abs(x - px) == 2) {
            if (Math.abs(y - py) < 1) {
                //println(`${px},${py} to ${x},${y}: 2 left/right`)
                return this.maze.isWall((x + px) / 2, y);
            } else if (Math.abs(y - py) == 1) {
                //println(`${px},${py} to ${x},${y}: 2 left/right, 1 up/down`)
                return this.maze.isWall((x + px) / 2, py) && (this.maze.isWall((x + px) / 2, py) || this.maze.isWall(x, py));
            } else { // Math.abs(y - py) == 2
                //println(`${px},${py} to ${x},${y}: 2 left/right, 2 up/down`)
                return this.maze.isWall((x + px) / 2, (y + py) / 2);
            }
        } else { // Math.abs(y - py) == 2
            if (Math.abs(x - px) < 1) {
                //println(`${px},${py} to ${x},${y}: 2 up/down`)
                return this.maze.isWall(x, (y + py) / 2);
            } else if (Math.abs(x - px) == 1) {
                //println(`${px},${py} to ${x},${y}: 2 up/down, 1 left/right`)
                return this.maze.isWall(px, (y + py) / 2) && (this.maze.isWall(px, (y + py) / 2) || this.maze.isWall(px, y));
            } else { // Math.abs(x - px) == 2 (Should never happen, as it fits the case above
                throw "Illegal state: This should never happen!"
            }
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
                
                this.visit();
                
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
    
    isFinished() {
        return this.player[0] == this.maze.end[0] && this.player[1] == this.maze.end[1];
    }
}

export function create(maze) {
    return new World(maze);
}
