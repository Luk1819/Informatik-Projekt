import { readDataFolder } from "./utils.js";

type LootItem = {
    health?: number,
    damage?: number
}

type LootEntry = {
    chance: number,
    item: LootItem
}

class Loot {
    content: LootEntry[];

    constructor(content: LootEntry[]) {
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

export const tables: { [id: string]: Loot } = {};

export function create(id: string, content: LootEntry[]) {
    const loot = new Loot(content);
    tables[id] = loot;
    return loot;
}

export function read(id: string, data: string) {
    const json = JSON.parse(data);
    return create(id, json.content);
}

export function discover() {
    readDataFolder("loot", read);
}
