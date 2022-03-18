import * as enemies from "./enemies.js";
import * as mazes from "./maze.js";
import * as loot from "./loot.js";

export const directions = {
    west: 0,
    south: 1,
    east: 2,
    north: 3,
};

const entityTypes = {
    player: 0,
    enemy: 1,
    item: 2,
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
            type: entityTypes.player,
            props: {
                health: maze.player.hp,
                damage: maze.player.damage,
            },
        });
        
        this.visit();
        
        x = 0;
        for (let row of maze.enemies) {
            y = 0;
            
            for (let e of row) {
                if (e != -1) {
                    this.set(x, y, this.createEnemy(e));
                }
                
                y++;
            }
            
            x++;
        }
    }

    createEnemy(type) {
        return {
            type: entityTypes.enemy,
            props: enemies.enemiesByType[type].createInstance(),
        };
    }

    createDrop(enemy) {
        let id = enemy.props.loot;
        if (!id) {
            return null;
        }

        let item = loot.tables[id].get();
        return {
            type: entityTypes.item,
            props: item,
        };
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
            return true;
        } else if (Math.abs(x - px) > 2 || Math.abs(y - py) > 2) {
            return false;
        } else if (Math.abs(x - px) < 2 && Math.abs(y - py) < 2) {
            return true;
        } else if (Math.abs(x - px) == 2) {
            if (Math.abs(y - py) < 1) {
                return !this.maze.isWall((x + px) / 2, y);
            } else if (Math.abs(y - py) == 1) {
                return !this.maze.isWall((x + px) / 2, py) && (!this.maze.isWall((x + px) / 2, y) || !this.maze.isWall(x, py));
            } else { // Math.abs(y - py) == 2
                return !this.maze.isWall((x + px) / 2, (y + py) / 2);
            }
        } else { // Math.abs(y - py) == 2
            if (Math.abs(x - px) < 1) {
                return !this.maze.isWall(x, (y + py) / 2);
            } else if (Math.abs(x - px) == 1) {
                return !this.maze.isWall(px, (y + py) / 2) && (!this.maze.isWall(x, (y + py) / 2) || !this.maze.isWall(px, y));
            } else { // Math.abs(x - px) == 2 (Should never happen, as it fits the case above
                throw "Illegal state: This should never happen!";
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
    
    enemyMove() {
        let es = [];
        
        for (let x = 0; x < this.maze.size[0]; x++) {
            for (let y = 0; y < this.maze.size[1]; y++) {
                let enemy = this.get(x, y);
                
                if (enemy && enemy.type == entityTypes.enemy && this.isVisible(x, y)) {
                    es.push({
                        e: enemy,
                        loc: [x, y]
                    });
                }
            }
        }
        
        for (const target of es) {
            let enemy = target.e;
            let [x, y] = target.loc;
            
            for (let i = 0; i < enemy.props.speed; i++) {
                let [px, py] = this.player;
                let player = this.get(px, py).props;
                
                let newx = null;
                let newy = null;
                
                if (Math.abs(x - px) < 2 && Math.abs(y - py) < 2) {
                    player.props.health -= enemy.props.damage;
                } else if (Math.abs(x - px) == 2) {
                    if (Math.abs(y - py) < 1) {
                        newx = (x + px) / 2;
                        newy = y;
                    } else if (Math.abs(y - py) == 1) {
                        newx = (x + px) / 2;
                        newy = py;
                    } else { // Math.abs(y - py) == 2
                        newx = (x + px) / 2;
                        newy = (y + py) / 2;
                    }
                } else { // Math.abs(y - py) == 2
                    if (Math.abs(x - px) < 1) {
                        newx = x;
                        newy = (y + py) / 2;
                    } else if (Math.abs(x - px) == 1) {
                        newx = px;
                        newy = (y + py) / 2;
                    } else { // Math.abs(x - px) == 2 (Should never happen, as it fits the case above
                        throw "Illegal state: This should never happen!";
                    }
                }
                
                if (newx !== null && newy !== null && this.get(newx, newy) !== null) {
                    this.set(x, y, null);
                    this.set(newx, newy, enemy);
                    x = newx;
                    y = newy;
                }
            }
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
            
            if ((target == null || target.type == entityTypes.item) && targetTile != mazes.types.wall) {
                this.set(x, y, null);
                this.set(newx, newy, player);
                this.player = [newx, newy];
                
                this.visit();

                if (target) {
                    player.props.health += target.props.health || 0;
                    player.props.damage += target.props.damage || 0;
                }
                
                return true;
            } else if (target !== null) {
                target.props.health -= player.props.damage;
                
                if (target.props.health <= 0) {
                    this.set(newx, newy, this.createDrop(target));
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
        return (this.player[0] == this.maze.end[0] && this.player[1] == this.maze.end[1]) || !this.survived();
    }
    
    survived() {
        return this.get(this.player[0], this.player[1]).props.health > 0;
    }
}

export function create(maze) {
    return new World(maze);
}
