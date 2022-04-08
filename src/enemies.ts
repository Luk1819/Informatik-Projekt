import {readDataFolder} from "./utils.js";

export type EnemyInstance = {
    type: number,
    health: number,
    damage: number,
    speed: number,
    name: string,
    loot: string | null,
    sight: number,
    range: number
}

export class Enemy {
    type: number;
    health: number;
    damage: number;
    speed: number;
    loot: string | null;
    sight: number;
    range: number;

    name: string;

    constructor(type: number, health: number, damage: number, speed: number, name: string, sight: number, range: number, loot: string | null) {
        this.type = type;
        this.health = health;
        this.damage = damage;
        this.speed = speed;
        this.name = name;
        this.sight = sight;
        this.range = range;
        this.loot = loot;
    }

    // Creates a modifiable instance of this enemy type
    createInstance() {
        return <EnemyInstance>{
            type: this.type,
            health: this.health,
            damage: this.damage,
            speed: this.speed,
            name: this.name,
            loot: this.loot,
            sight: this.sight,
            range: this.range,
        };
    }
}

// The registered enemy types
export const enemies: { [id: number]: Enemy } = {};

// Creates a new enemy type and registers it
export function create(type: number, health: number, damage: number, speed: number, name: string, sight: number, range: number, loot: string | null) {
    const enemy = new Enemy(type, health, damage, speed, name, sight, range, loot);
    enemies[type] = enemy;
    return enemy;
}

export function read(_id: any, data: string) {
    const json = JSON.parse(data);
    return create(json.type, json.health, json.damage, json.speed, json.name, json.sight || 2, json.range || 1, json.loot || null);
}

// Loads all enemies from the ./enemies/ folder
export function discover() {
    readDataFolder("enemies", read);
}
