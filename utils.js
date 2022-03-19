import path from "path";
import { fileURLToPath } from "url";
import { stdout } from "node:process";
import ansiEscapes from "ansi-escapes";
import * as fs from "fs";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);


let printed = [1];

export function print(value) {
    stdout.write(value);
}

export function println(value = "") {
    print(`${value}\n`);
    clear.inc();
}

export const clear = {
    exec(reset=false) {
        print(ansiEscapes.eraseLines(printed.pop()));
        if (reset) {
            clear.reset();
        }
    },
    reset() {
        printed.push(1);
    },
    inc(amount=1) {
        printed[printed.length - 1] += amount;
    }
}

export function lines(str) {
    return str.split(/[\r\n]+/);
}

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
    x;
    y;
    
    constructor(value, y=null) {
        if (y !== null) {
            this.x = value;
            this.y = y;
        } else if (typeof(value) == "object") {
            if (value.x) {
                this.x = value.x;
                this.y = value.y;
            } else {
                this.x = value[0];
                this.y = value[1];
            }
        }
    }
}

class Storage {
    completed;
    
    constructor(data=null) {
        if (data) {
            this.completed = data.completed;
        } else {
            this.completed = [];
        }
    }
}

export const storage = {
    path: path.join(__dirname, "data/storage.json"),
    folder: path.join(__dirname, "data/"),
    data: new Storage(),
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
        return storage.data;
    },
    save() {
        storage.ensureFolder()
        fs.writeFileSync(storage.path, JSON.stringify(storage.data), {encoding: "utf8"});
    }
}
