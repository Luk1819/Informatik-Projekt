import { Direction } from "./world";

export class Module {
    directions: Direction[];

    constructor(directions: Direction[] | string[]) {
        this.directions = directions.map(function (dir: Direction | string) {
            if (typeof dir == "string") {
                return Direction.fromString(dir);
            } else {
                return dir;
            }
        })
    }
}


export const modules: { [id: string]: Module } = {};

export function create(id: string) {
    const loot = new Module();
    modules[id] = loot;
    return loot;
}

export function read(id: string, data: string) {
    const json = JSON.parse(data);
    return create(id);
}

export function discover() {
    readDataFolder("modules", read);
}
