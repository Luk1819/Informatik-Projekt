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

export namespace Direction {
    export function toString(dir: Direction): string {
        return Direction[dir];
    }

    export function fromString(dir: string): Direction {
        return (Direction as any)[dir];
    }

    export const values: Direction[] = [Direction.west, Direction.south, Direction.east, Direction.north];
}

export enum EntityType {
    player,
    enemy,
    item,
}

export class World {
    maze: mazes.Maze;
    data: WorldData;
    tiles: Tile[][];
    entities: { [x: number]: { [y: number]: { type: number, props: any } | null } };
    player: Position;
    visited: { [x: number]: { [y: number]: boolean } };

    kills = 0;
    rounds = 0;

    constructor(maze: Maze) {
        this.maze = maze;
        this.data = new WorldData(this);
        let world = this;
        this.tiles = List(maze.size[0], function (x) {
            return List(maze.size[1], function (y) {
                let tile = maze.get(x, y);
                return new Tile([x, y], world, tile)
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

    rayCast(start: Position, end: Position) {
        if (Position.equals(start, end)) {
            return false;
        }

        let dir = new Position(end.x - start.x, end.y - start.y);
        let t = 0;
        let curr = new Position(start);
        let tile = new Position(Math.floor(curr.x) + 1, Math.floor(curr.y) + 1);
        let tileOffset = new Position(dir.x > 0 ? 1 : 0, dir.y > 0 ? 1 : 0);

        let dirSign = [dir.x > 0 ? 1 : -1, dir.y > 0 ? 1 : -1];

        if (dir.x * dir.x + dir.y * dir.y > 0) {
            while (tile.x > 0 && tile.x < this.maze.size[0] && tile.y > 0 && tile.y < this.maze.size[1]) {
                if (this.blocksVision(tile.x, tile.y) && !Position.equals(tile, end)) {
                    return true;
                }

                let delta = [(tile.x + dirSign[0] - curr.x) / dir.x, (tile.y + dirSign[1] - curr.y) / dir.y];
                if (delta[0] < delta[1]) {
                    t += delta[0] + 0.001;
                    tile.x += dirSign[0];
                } else {
                    t += delta[1] + 0.001;
                    tile.y += dirSign[1];
                }

                curr.x = start.x + dir.x * t;
                curr.y = start.y + dir.y * t;
            }
        } else {
            return this.blocksVision(tile.x, tile.y) && !Position.equals(tile, end);
        }

        return false;
    }

    isVisible(x: number, y: number) {
        let px = this.player.x;
        let py = this.player.y;

        let offset = [0.3, 0.7];
        let targetOffset = [0, 1];

        for (let ofsX of offset) {
            for (let ofsY of offset) {
                for (let tOfsX of targetOffset) {
                    for (let tOfsY of targetOffset) {
                        if (px > x) {
                            tOfsX *= -1;
                        }
                        if (py > y) {
                            tOfsY *= -1;
                        }
                        if (!this.rayCast(new Position(px + ofsX, py + ofsY), new Position(x + tOfsX, y + tOfsY))) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
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
        this.data.callNewTurn();
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
                    let max = target.props.maxHealth;
                    if (max) {
                        if (player.props.health < max) {
                            player.props.health = Math.min(player.props.health + target.props.health, max);
                        }
                    } else {
                        player.props.health += target.props.health;
                    }
                    
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

export class WorldData {
    segments: WorldDataSegment[] = [];
    world: World;

    constructor(world: World) {
        this.world = world;
    }


    callNewTurn() {
        this.segments.forEach(v => v.newTurn());
    }


    register<T extends WorldDataSegment>(type: WorldDataType<T>): T {
        let segment = new type(this.world);
        this.segments.push(segment);
        return segment;
    }

    get<T>(type: WorldDataType<T>): T | undefined {
        return this.segments.find<T>(v => v instanceof type);
    }
}

export interface WorldDataType<T extends WorldDataSegment> {
    new(world: World): T;
}

export interface WorldDataSegment {
    newTurn();
}

export function create(maze) {
    return new World(maze);
}
