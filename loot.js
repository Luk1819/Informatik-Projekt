import * as fs from "fs";
import { globby } from "globby";
import * as path from "path";
import { __dirname } from "./utils.js";

class Loot {
    content;

    constructor(content) {
        this.content = content;
    }

    get() {
        let rand = Math.random();

        for (let entry of this.content) {
            if (rand < entry.chance) {
                return entry.item;
            } else {
                rand -= entry.chance;
            }
        }

        return null;
    }
}

export const tables = {};

export function create(id, content) {
    const loot = new Loot(content);
    tables[id] = loot;
    return loot;
}

export function read(id, data) {
    const json = JSON.parse(data);
    return create(id, json.content);
}

export function load(path1) {
    const data = fs.readFileSync(path.join(__dirname, path1), {encoding: "utf8"});
    const id = /loot\/(.*)\.json/.exec(path1)[1]
    return read(id, data);
}

export async function discover() {
    const entries = await globby("loot/*.json");
    for (let file of entries) {
        load(file);
    }
}
