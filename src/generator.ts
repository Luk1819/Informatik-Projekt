import * as mazes from "./maze.js";
import * as modules from "./module.js";
import { Maze } from "./maze.js";
import { Direction } from "./world.js";
import { Module } from "./module.js";

type Cell = {
    x: number,
    y: number
}

function generateNodes(width: number, height: number) {
    function locate(cell: Cell) {
        return cell.y * width + cell.x;
    }

    function choose(array: Cell[]) {
        return array[Math.floor(Math.random() * array.length)];
    }

    function adjacent(first: Cell, second: Cell) {
        return abs(b.x - a.x) + abs(b.y - a.y) == 1;
    }

    let nodes = Array<Cell>(width * height);
    for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			var cell = { x, y };
			nodes[locate(cell)] = cell;
		}
	}

	var node = choose(nodes);
	var stack = [node];
	var maze = new Map<Cell, Array<Cell>>();

	for (var node of nodes) {
		maze.set(node, []);
	}

	while (node) {
		var neighbors = nodes.filter(other => !maze.get(other).length && adjacent(node, other));
		if (neighbors.length) {
			var neighbor = choose(neighbors);
			maze.get(node).push(neighbor);
			maze.get(neighbor).push(node);
			stack.unshift(neighbor);
			node = neighbor;
		} else {
			stack.shift();
			node = stack[0];
		}
	}

	return maze;
}

function createMaze(width: number, height: number) {
    let maze: Maze = mazes.create(height, width);
    let nodes = generateNodes(width, height);

    for (var [node, neighbors] of nodes) {
        let directions: Direction[] = [];
		for (var neighbor of neighbors) {
            if (neighbor.x == node.x + 1) {
                directions.push(Direction.south);
            }
            if (neighbor.x == node.x - 1) {
                directions.push(Direction.north);
            }
            if (neighbor.y == node.y + 1) {
                directions.push(Direction.west);
            }
            if (neighbor.y == node.y + 1) {
                directions.push(Direction.east);
            }
		}
		createModule(maze, node, directions);
	}
}

function filterModules(modules: Module[], directions: Direction[]) {
    return modules.filter(function (module: Module) {
        return directions == modules.directions;
    });
}

function createModule(maze: Maze, node: Cell, directions: Direction[]) {
    let all = modules.modules;
}
