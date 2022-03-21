import {readDataFolder} from "./utils.js";

export type EnemyInstance = {
    type: number,
    health: number,
    damage: number,
    speed: number,
    name: string,
    loot: string | null
}

export class Enemy {
    type: number;
    health: number;
    damage: number;
    speed: number;
    loot: string | null;

    name: string;

    constructor(type: number, health: number, damage: number, speed: number, name: string, loot: string | null) {
        this.type = type;
        this.health = health;
        this.damage = damage;
        this.speed = speed;
        this.name = name;
        this.loot = loot;
    }

    createInstance() {
        return <EnemyInstance>{
            type: this.type,
            health: this.health,
            damage: this.damage,
            speed: this.speed,
            name: this.name,
            loot: this.loot,
        };
    }
}

export const enemies: { [id: number]: Enemy } = {};

export function create(type: number, health: number, damage: number, speed: number, name: string, loot: string | null) {
    const enemy = new Enemy(type, health, damage, speed, name, loot);
    enemies[type] = enemy;
    return enemy;
}

export function read(_id: any, data: string) {
    const json = JSON.parse(data);
    return create(json.type, json.health, json.damage, json.speed, json.name, json.loot || null);
}

export function discover() {
    readDataFolder("enemies", read);
}
