import * as enemies from "./enemies.js";
import * as mazes from "./maze.js";
import * as loot from "./loot.js";
import {List, Position} from "./utils.js";
import {Maze, Tile} from "./maze.js";
import {EnemyInstance} from "./enemies.js";
import { TilePortalData } from "./maze.js";

export enum Direction {
    west,
    south,
    east,
    north,
}

export enum EntityType {
    player,
    enemy,
    item,
}

export class World {
    maze: mazes.Maze;
    tiles: Tile[][];
    entities: { [x: number]: { [y: number]: { type: number, props: any } | null } };
    player: Position;
    visited: { [x: number]: { [y: number]: boolean } };

    kills = 0;
    rounds = 0;

    constructor(maze: Maze) {
        this.maze = maze;
        this.tiles = List(maze.size[0], function (x) {
            return List(maze.size[1], function (y) {
                let tile = maze.get(x, y);
                return new Tile([x, y], tile)
            });
        });
        this.entities = {};
        this.visited = {};
        let {x, y} = maze.start;
        this.player = new Position(x, y);
        this.set(x, y, {
            type: EntityType.player,
            props: {
                health: maze.player.hp,
                damage: maze.player.damage,
            },
        });

        this.visit();

        for (let enemy of maze.enemies) {
            let pos = new Position(enemy.pos)
            this.set(pos.x, pos.y, this.createEnemy(enemy.type));
        }
    }

    createEnemy(type: number) {
        return {
            type: EntityType.enemy,
            props: enemies.enemies[type].createInstance(),
        };
    }

    createDrop(enemy: { type: EntityType, props: EnemyInstance }) {
        let id = enemy.props.loot;
        if (!id) {
            return null;
        }

        let item = loot.tables[id].get();
        if (item) {
            return {
                type: EntityType.item,
                props: item,
            };
        } else {
            return null;
        }
    }


    isVisited(x: number, y: number) {
        const line = this.visited[x];
        if (line) {
            let res = line[y];

            return res ? res : false;
        } else {
            return false;
        }
    }

    setVisited(x: number, y: number) {
        const line = this.visited[x];
        if (line) {
            line[y] = true;
        } else {
            this.visited[x] = {};
            this.visited[x][y] = true;
        }
    }

    visit() {
        let {x, y} = this.player;

        for (let i = x - 2; i <= x + 2; i++) {
            for (let j = y - 2; j <= y + 2; j++) {
                if (this.isVisible(i, j)) {
                    this.setVisited(i, j);
                }
            }
        }
    }

    isVisible(x: number, y: number) {
        let px = this.player.x;
        let py = this.player.y;

        if (x == px && y == py) {
            return true;
        } else if (Math.abs(x - px) > 2 || Math.abs(y - py) > 2) {
            return false;
        } else if (Math.abs(x - px) < 2 && Math.abs(y - py) < 2) {
            return true;
        } else if (Math.abs(x - px) == 2) {
            if (Math.abs(y - py) < 1) {
                return !this.blocksVision((x + px) / 2, y);
            } else if (Math.abs(y - py) == 1) {
                return !this.blocksVision((x + px) / 2, py) && (!this.blocksVision((x + px) / 2, y) || !this.blocksVision(x, py));
            } else { // Math.abs(y - py) == 2
                return !this.blocksVision((x + px) / 2, (y + py) / 2);
            }
        } else { // Math.abs(y - py) == 2
            if (Math.abs(x - px) < 1) {
                return !this.blocksVision(x, (y + py) / 2);
            } else if (Math.abs(x - px) == 1) {
                return !this.blocksVision(px, (y + py) / 2) && (!this.blocksVision(x, (y + py) / 2) || !this.blocksVision(px, y));
            } else { // Math.abs(x - px) == 2 (Should never happen, as it fits the case above
                throw Error("Illegal state: This should never happen!");
            }
        }
    }

    get(x: number, y: number) {
        const line = this.entities[x];
        if (line) {
            let res = line[y];

            return res ? res : null;
        } else {
            return null;
        }
    }

    set(x: number, y: number, value: { type: EntityType, props: any } | null) {
        const line = this.entities[x];
        if (line) {
            line[y] = value;
        } else {
            this.entities[x] = {};
            this.entities[x][y] = value;
        }
    }

    tileAt(x: number, y: number) {
        return this.tiles[x][y];
    }

    isWall(x: number, y: number) {
        return x >= 0 && x < this.maze.size[0] && y >= 0 && y < this.maze.size[1] && this.tileAt(x, y).data.wall;
    }

    blocksVision(x: number, y: number) {
        return x >= 0 && x < this.maze.size[0] && y >= 0 && y < this.maze.size[1] && this.tileAt(x, y).data.blocksVision;
    }

    tick() {
        TilePortalData.teleported = false;
        this.tiles.forEach(row => row.forEach(tile => tile.tick(this)));
    }

    enemyMove() {
        let es: { enemy: { type: EntityType, props: EnemyInstance }, loc: [number, number] }[] = [];

        for (let x = 0; x < this.maze.size[0]; x++) {
            for (let y = 0; y < this.maze.size[1]; y++) {
                let enemy = this.get(x, y);

                if (enemy && enemy.type == EntityType.enemy && this.isVisible(x, y)) {
                    es.push({
                        enemy,
                        loc: [x, y]
                    });
                }
            }
        }

        for (const target of es) {
            let enemy = target.enemy;
            let [x, y] = target.loc;

            for (let i = 0; i < enemy.props.speed; i++) {
                let px = this.player.x;
                let py = this.player.y;
                let player = this.get(px, py)!;

                let newx: number | null = null;
                let newy: number | null = null;

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
                        throw Error("Illegal state: This should never happen!");
                    }
                }

                if (newx !== null && newy !== null && this.get(newx, newy) === null) {
                    this.set(x, y, null);
                    this.set(newx, newy, enemy);
                    x = newx;
                    y = newy;
                }
            }
        }
    }

    walk(dir: Direction) {
        let {x, y} = this.player;
        let player = this.get(x, y)!;

        let moveTo = (newx, newy) => {
            if (newx < 0 || newy < 0 || newx >= this.maze.size[0] || newy >= this.maze.size[1]) {
                return false;
            }

            let target = this.get(newx, newy);
            let targetTile = this.tileAt(newx, newy);

            if ((target === null || target.type == EntityType.item) && !targetTile.data.wall) {
                this.set(x, y, null);
                this.set(newx, newy, player);
                this.player = new Position(newx, newy);

                this.visit();

                if (target) {
                    player.props.health += target.props.health || 0;
                    player.props.damage += target.props.damage || 0;
                }

                this.rounds += 1;
                return true;
            } else if (target !== null) {
                target.props.health -= player.props.damage;

                if (target.props.health <= 0) {
                    this.set(newx, newy, this.createDrop(target));
                    this.kills += 1;
                }

                this.rounds += 1;
                return true;
            } else {
                return false;
            }
        };

        if (dir == Direction.west) {
            return moveTo(x, y - 1);
        } else if (dir == Direction.south) {
            return moveTo(x + 1, y);
        } else if (dir == Direction.east) {
            return moveTo(x, y + 1);
        } else if (dir == Direction.north) {
            return moveTo(x - 1, y);
        } else {
            throw Error("Illegal argument: '" + dir + "' is not a valid direction!");
        }
    }

    isFinished() {
        return (this.player.x == this.maze.end.x && this.player.y == this.maze.end.y) || !this.survived();
    }

    survived() {
        return this.get(this.player.x, this.player.y)!.props.health > 0;
    }
}

export function create(maze) {
    return new World(maze);
}
