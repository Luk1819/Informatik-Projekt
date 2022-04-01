import * as enemies from "./enemies.js";
import * as mazes from "./maze.js";
import * as loot from "./loot.js";
import * as raytracing from "./raytracing.js";
import {List, Position} from "./utils.js";
import {Maze, Tile} from "./maze.js";
import {EnemyInstance} from "./enemies.js";
import {createVisionMap} from "./raytracing.js";

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

    playerVisibilityMap: raytracing.Storage | null;

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
        this.playerVisibilityMap = null;
        let {x, y} = maze.start;
        this.player = new Position(x, y);
        this.set(x, y, {
            type: EntityType.player,
            props: {
                health: maze.player.hp,
                damage: maze.player.damage,
                sight: 2,
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
        let range = this.get(this.player.x, this.player.y)!.props.sight + 2;

        for (let i = x - range; i <= x + range; i++) {
            for (let j = y - range; j <= y + range; j++) {
                if (this.isVisible(i, j)) {
                    this.setVisited(i, j);
                }
            }
        }
    }

    isVisible(x: number, y: number) {
        if (this.playerVisibilityMap == null) {
            this.playerVisibilityMap = createVisionMap(this, this.get(this.player.x, this.player.y)!.props.sight, this.player);
        }

        return this.playerVisibilityMap.get(x, y);
    }

    markVisibilityDirty() {
        this.playerVisibilityMap = null;
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
        this.tiles.forEach(row => row.forEach(tile => tile.tick()));
    }

    enemyMove() {
        let es: { enemy: { type: EntityType, props: EnemyInstance }, loc: [number, number] }[] = [];

        for (let x = 0; x < this.maze.size[0]; x++) {
            for (let y = 0; y < this.maze.size[1]; y++) {
                let enemy = this.get(x, y);

                if (enemy && enemy.type == EntityType.enemy) {
                    let sight = enemy.props.sight;
                    let visionMap = createVisionMap(this, sight, new Position(x, y));
                    if (visionMap.get(this.player.x, this.player.y)) {
                        es.push({
                            enemy,
                            loc: [x, y],
                        });
                    }
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
                } else if (Math.abs(y - py) < 2) {
                    newy = y;
                    newx = x + Math.sign(px - x);

                    if (this.isWall(newx, newy) || this.get(newx, newy) != null) {
                        newx = x;
                        newy = y + Math.sign(py - y);
                    }
                } else if (Math.abs(x - px) < 2) {
                    newx = x;
                    newy = y + Math.sign(py - y);

                    if (this.isWall(newx, newy) || this.get(newx, newy) != null) {
                        newy = y;
                        newx = x + Math.sign(px - x);
                    }
                } else {
                    newy = y;
                    newx = x + Math.sign(px - x);

                    if (this.isWall(newx, newy) || this.get(newx, newy) != null) {
                        newx = x;
                        newy = y + Math.sign(py - y);
                    }
                }

                if (newx !== null && newy !== null && this.get(newx, newy) == null && !this.isWall(newx, newy)) {
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

                this.markVisibilityDirty();
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
                    player.props.sight += target.props.sight || 0;
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

    get<T extends WorldDataSegment>(type: WorldDataType<T>): T | undefined {
        return this.segments.find(v => v instanceof type) as T;
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
