import path from "path";
import ansiEscapes from "ansi-escapes";
import * as fs from "fs";
import {globbySync} from "globby";

// Get all .json files in a given folder
export function dataFolder(folder: string) {
    return globbySync(`${folder}/**/*.json`, { cwd: process.cwd() });
}

// Read all .json files in the given folder
export function readDataFolder(folder: string, read: (id: string, data: any) => void) {
    const entries = dataFolder(folder);
    for (let file of entries) {
        const data = fs.readFileSync(file, {encoding: "utf8"});
        const id = new RegExp(`${folder}/(.*)\\.json`).exec(file)![1]
        read(id, data);
    }
}

// Prints the given value to stdout
export function print(value: any) {
    process.stdout.write(value);
}

// Prints the given value and a newline at the end
// Also increases the counter for clearing
export function println(value: any = "") {
    print(`${value}\n`);
    clear.inc();
}

// Creates an array of a given size and initalized using the given function
export function List<T>(size: number, initializer: (index: number) => T) {
    return Array.apply<null, any, any[]>(null, {length: size}).map((_, index) => initializer(index));
}

// Randomize the Math.random function
export function randomize() {
    for (let i = 0; i < (new Date().getTime() % 150); i++) {
        Math.random();
    }
}

// Returns a random element from the given array
export function randomElement<T>(array: Array<T>) {
    return array[Math.floor(Math.random() * array.length)];
}

export class Clear {
    printed = [1];

    // Clears the current frame
    // Also pushes a new frame if reset is true
    exec(reset = false) {
        print(ansiEscapes.eraseLines(this.printed.pop()!));
        if (reset) {
            clear.reset();
        }
    }

    // Pushes a frame
    reset() {
        this.printed.push(1);
    }

    // Increases the current frame's counter
    inc(amount = 1) {
        this.printed[this.printed.length - 1] += amount;
    }
}

// Use to clear stuff you printed
export const clear = new Clear();

// Rotate a cursor between the given min and max values
export function rotate(value, min, max) {
    if (value < min) {
        return max + (value - min + 1);
    } else if (value > max) {
        return min + (value - max - 1);
    } else {
        return value;
    }
}

// Clamp a value between the given min and max values
export function clamp(value, min, max) {
    return Math.min(max, Math.max(value, min));
}

// Checks whether target contains every element from source
export function containsAll(source, target) {
    return source.every(v => target.includes(v));
}

// Checks whether two array's contents are equal
export function arrayEquals(source, target) {
    return containsAll(source, target) && containsAll(target, source);
}

// Storage for a x and y value
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

    toString() {
        return "Pos(x=" + this.x + ",y=" + this.y + ")";
    }

    // Checks whether two positions are equal
    static equals(pos1: Position, pos2: Position) {
        return pos1.x == pos2.x && pos1.y == pos2.y;
    }
}

// Allows to load data from json objects in an easy way
export class JsonInitialized {
    // Loads the given properties from the given data
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

// The storage that will be saved even when restarting the game
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
    // Loads the storage
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
    // Returns the storage and loads it if neccessary
    get() {
        return storage.data || storage.load();
    },
    // Saves the storage
    save() {
        storage.ensureFolder()
        fs.writeFileSync(storage.path, JSON.stringify(storage.data), {encoding: "utf8"});
    }
}
