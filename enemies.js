import * as fs from "fs";

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
}

export const types = {
};

export function create(type, health, damage, speed, name) {
  var enemy = Enemy(type, health, damage, speed, name);
  types[type] = enemy;
  return enemy;
};

export function read(data) {
  var json = JSON.parse(data);
  return create(json.type, json.health, json.damage, json.speed, json.name)
}

export function load(path) {
  var data = await fs.readFile(path, "utf-8");
  return read(data);
}
