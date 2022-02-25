import * as fs from "fs";
import { globby } from "globby";

class Enemy {
  type;
  health;
  damage;
  speed;

  name;

  constructor(type, health, damage, speed, name) {
    this.type = type;
    this.health = health;
    this.damage = damage;
    this.speed = speed;
    this.name = name;
  }

  createInstance() {
    return {
      type: this.type,
      health: this.health,
      damage: this.damage,
      speed: this.speed,
      name: this.name
    };
  }
}

export const types = {};

export const enemiesByType = {};

export function create(type, health, damage, speed, name) {
  var enemy = new Enemy(type, health, damage, speed, name);
  types[name] = enemy;
  enemiesByType[type] = enemy;
  return enemy;
}

export function read(data) {
  var json = JSON.parse(data);
  return create(json.type, json.health, json.damage, json.speed, json.name);
}

export async function load(path) {
  var data = await fs.readFile(path, "utf-8");
  return read(data);
}

export async function discover(path) {
  var entries = await globby("enemies/*.json");
  for (let file in entries) {
    load(file);
  }
}
