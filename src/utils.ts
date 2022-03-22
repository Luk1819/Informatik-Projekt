import path from "path";
import ansiEscapes from "ansi-escapes";
import * as fs from "fs";
import {globbySync} from "globby";

export function dataFolder(folder: string) {
    return globbySync(`${folder}/**/*.json`, { cwd: process.cwd() });
}

export function readDataFolder(folder: string, read: (id: string, data: any) => void) {
    const entries = dataFolder(folder);
    for (let file of entries) {
        const data = fs.readFileSync(file, {encoding: "utf8"});
        const id = new RegExp(`${folder}/(.*)\\.json`).exec(file)![1]
        read(id, data);
    }
}

export function print(value: any) {
    process.stdout.write(value);
}

export function println(value: any = "") {
    print(`${value}\n`);
    clear.inc();
}

export function List<T>(size: number, initializer: (index: number) => T) {
    return Array.apply<null, any, any[]>(null, {length: size}).map((_, index) => initializer(index));
}

export function randomize() {
    for (let i = 0; i < (new Date().getTime() % 150); i++) {
        Math.random();
    }
}

export class Clear {
    printed = [1];

    exec(reset = false) {
        print(ansiEscapes.eraseLines(this.printed.pop()!));
        if (reset) {
            clear.reset();
        }
    }

    reset() {
        this.printed.push(1);
    }

    inc(amount = 1) {
        this.printed[this.printed.length - 1] += amount;
    }
}

export const clear = new Clear();

export function rotate(value, min, max) {
    if (value < min) {
        return max + (value - min + 1);
    } else if (value > max) {
        return min + (value - max - 1);
    } else {
        return value;
    }
}

export function clamp(value, min, max) {
    return Math.min(max, Math.max(value, min));
}

export function containsAll(source, target) {
    return source.every(v => target.includes(v));
}

export class Position {
    x: number;
    y: number;

    constructor(values: Position | [number, number] | { x: number, y: number });
    constructor(x: number, y: number);
    constructor(value, y?: number) {
        if (value instanceof Position) {
            this.x = value.x;
            this.y = value.y;
        } else if (value instanceof Array) {
            this.x = value[0];
            this.y = value[1];
        } else if (typeof (value) == "object") {
            this.x = value.x;
            this.y = value.y;
        } else if (y !== undefined) {
            this.x = value;
            this.y = y;
        } else {
            throw Error("Illegal arguments: value=" + value + ",y=" + y);
        }
    }

    static equals(pos1: Position, pos2: Position) {
        return pos1.x == pos2.x && pos1.y == pos2.y;
    }
}

export class JsonInitialized {
    loadData(data: any | null, properties: { [property: string]: { default: any, creator?(arg: any): any } }) {
        for (let prop in properties) {
            this.loadKey(data, prop, properties[prop]);
        }
    }

    loadKey(data: any | null, key: string, options: { default: any, creator?(arg: any): any }) {
        let creator = options.creator || (v => v);
        if (data && data[key]) {
            this[key] = creator(data[key]);
        } else {
            this[key] = creator(options.default);
        }
    }
}

export class Storage extends JsonInitialized {
    completed!: string[];
    mazeId!: string;

    constructor(data = null) {
        super();
        this.loadData(data, {
            "completed": {
                default: [],
            },
            "mazeId": {
                default: "tutorial_move",
            },
        });
    }
}

export const storage: { ensureFolder(): void; path: string; folder: string; data: Storage | null; load(): (Storage); get(): Storage; save(): void } = {
    path: path.join(process.cwd(), "data/storage.json"),
    folder: path.join(process.cwd(), "data/"),
    data: null,
    ensureFolder() {
        if (!fs.existsSync(storage.folder)) {
            fs.mkdirSync(storage.folder)
        }
    },
    load() {
        storage.ensureFolder()
        if (!fs.existsSync(storage.path)) {
            storage.data = new Storage();
            storage.save()
            return storage.data;
        }
        const data = fs.readFileSync(storage.path, {encoding: "utf8"});
        storage.data = new Storage(JSON.parse(data));
        return storage.data;
    },
    get() {
        return storage.data || storage.load();
    },
    save() {
        storage.ensureFolder()
        fs.writeFileSync(storage.path, JSON.stringify(storage.data), {encoding: "utf8"});
    }
}
