import * as mazes from "./maze.js";
import * as modules from "./module.js";
import {Maze} from "./maze.js";
import { Direction } from "./world.js";
import { Module } from "./module.js";
import {arrayEquals, Position, println, randomElement} from "./utils.js";

type Cell = {
    x: number,
    y: number
}

function generateNodes(width: number, height: number) {
    function locate(cell: Cell) {
        return cell.y * width + cell.x;
    }

    function adjacent(first: Cell, second: Cell) {
        return Math.abs(first.x - second.x) + Math.abs(first.y - second.y) == 1;
    }

    let nodes = Array<Cell>(width * height);
    for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let cell = { x, y };
			nodes[locate(cell)] = cell;
		}
	}

	let node = randomElement(nodes);
	let stack = [node];
	let maze = new Map<Cell, Array<Cell>>();

	for (let node of nodes) {
		maze.set(node, []);
	}

	while (node) {
		let neighbors = nodes.filter(other => !maze.get(other)!.length && adjacent(node, other));
		if (neighbors.length) {
			let neighbor = randomElement(neighbors);
			maze.get(node)!.push(neighbor);
			maze.get(neighbor)!.push(node);
			stack.unshift(neighbor);
			node = neighbor;
		} else {
			stack.shift();
			node = stack[0];
		}
	}

	return maze;
}

export function createMaze(width: number, height: number) {
    let maze = mazes.create(modules.size[0] * height, modules.size[1] * width);
    let nodes = generateNodes(width, height);

    for (let [node, neighbors] of nodes) {
        let directions: Direction[] = [];
		for (let neighbor of neighbors) {
            if (neighbor.x == node.x + 1) {
                directions.push(Direction.south);
            }
            if (neighbor.x == node.x - 1) {
                directions.push(Direction.north);
            }
            if (neighbor.y == node.y - 1) {
                directions.push(Direction.west);
            }
            if (neighbor.y == node.y + 1) {
                directions.push(Direction.east);
            }
		}
		createModule(maze, node, directions, node.x == 0 && node.y == 0, node.x == height - 1 && node.y == width - 1);
	}

    return maze;
}

function createModule(maze: Maze, node: Cell, directions: Direction[], isStart: boolean, isEnd: boolean) {
    let possible = modules.filterModules(modules.modules, directions);
    if (possible.length == 0) {
        println("Failed to find module for directions [" + directions.map(Direction.toString) + "]");
    }
    let module = randomElement(possible);

    let offset = [node.x * modules.size[0], node.y * modules.size[1]];
    for (let x = 0; x < modules.size[0]; x++) {
        for (let y = 0; y < modules.size[1]; y++) {
            maze.set(offset[0] + x, offset[1] + y, module.maze[x][y]);
        }
    }

    for (let entry of module.enemies) {
        maze.enemies.push({
            pos: [offset[0] + entry.pos[0], offset[1] + entry.pos[1]],
            type: entry.type
        });
    }

    let goalPos = new Position(offset[0] + module.goalPos[0], offset[1] + module.goalPos[1]);
    if (isStart) {
        maze.start = goalPos;
    }
    if (isEnd) {
        maze.end = goalPos;
    }
}
