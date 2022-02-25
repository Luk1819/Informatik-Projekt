import * as fs from "fs";
import { globby } from "globby";
import * as path from "path";
import { __dirname } from "./utils.js"

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

export async function load(path1) {
  var data = fs.readFileSync(path.join(__dirname, path1), { encoding: 'utf8' });
  return read(data);
}

export async function discover() {
  var entries = await globby("enemies/*.json");
  console.log("Entries: " + entries)
  console.log("Type: " + typeof(entries))
  for (let file in entries) {
    console.log("File: " + file)
    load(file);
  }
}
