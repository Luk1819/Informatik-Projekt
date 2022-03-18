import * as fs from "fs";
import { globby } from "globby";
import * as path from "path";
import { __dirname } from "./utils.js";

//enemy with health etc

class Enemy {
    type;
    health;
    damage;
    speed;
    loot;
    
    name;
    
    constructor(type, health, damage, speed, name, loot) {
        this.type = type;
        this.health = health;
        this.damage = damage;
        this.speed = speed;
        this.name = name;
        this.loot = loot;
    }
    
    createInstance() {
        return {
            type: this.type,
            health: this.health,
            damage: this.damage,
            speed: this.speed,
            name: this.name,
            loot: this.loot,
        };
    }
}

export const types = {};

export const enemiesByType = {};

export function create(type, health, damage, speed, name, loot=null) {
    const enemy = new Enemy(type, health, damage, speed, name, loot);
    types[name] = enemy;
    enemiesByType[type] = enemy;
    return enemy;
}

export function read(data) {
    const json = JSON.parse(data);
    return create(json.type, json.health, json.damage, json.speed, json.name, json.loot || null);
}

export function load(path1) {
    const data = fs.readFileSync(path.join(__dirname, path1), {encoding: "utf8"});
    return read(data);
}

export async function discover() {
    const entries = await globby("enemies/*.json");
    for (let file of entries) {
        load(file);
    }
}
