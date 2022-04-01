import {List, Position} from "./utils.js";
import {World} from "./world.js";

function scanArc(storage: Storage, world: World, distance: number, min: number, max: number, rotate: (x: number, y: number) => [number, number]) {
    if (distance >= storage.sightRadius || min >= max) {
        return;
    }

    for (let i = Math.ceil(distance * min); i <= distance * max; i++) {
        let x = storage.center.x + rotate(distance, i)[0];
        let y = storage.center.y + rotate(distance, i)[1];

        if (world.blocksVision(x, y)) {
            scanArc(storage, world, distance + 1, min, (i - 0.5) / distance, rotate);
            min = (i + 0.5) / distance;
        }

        storage.set(x, y, true);
    }

    scanArc(storage, world, distance + 1, min, max, rotate);
}

export class Storage {
    size: [number, number];
    sightRadius: number;
    center: Position;
    data: boolean[][]

    constructor(size: [number, number], sightRadius: number, center: Position) {
        this.size = size;
        this.sightRadius = sightRadius;
        this.center = center;
        this.data = List(size[0], () => List(size[1], () => false));
    }

    get(x: number, y: number) {
        if (x < 0 || y < 0 || x >= this.size[0] || y >= this.size[1]) {
            return false;
        }
        return this.data[x][y];
    }

    set(x: number, y: number, val: boolean) {
        if (x < 0 || y < 0 || x >= this.size[0] || y >= this.size[1]) {
            return;
        }
        this.data[x][y] = val;
    }
}

export function createVisionMap(world: World, sight: number, center: Position) {
    let storage = new Storage(world.maze.size, sight + 1, center);

    scanArc(storage, world, 0, -1, 1, (x, y) => [x, y]);
    scanArc(storage, world, 0, -1, 1, (x, y) => [y, -x]);
    scanArc(storage, world, 0, -1, 1, (x, y) => [-x, -y]);
    scanArc(storage, world, 0, -1, 1, (x, y) => [-y, x]);

    return storage;
}
