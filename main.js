import * as cli from "./cli.js";
import { println } from "./utils.js";
import * as maze from "./maze.js";
import * as world from "./world.js";
import * as enemies from "./enemies.js";

cli.start();

await enemies.discover();
let currMaze = maze.load("./mazes/maze1.json");
let currWorld = world.create(currMaze);

const res = await cli.menu(function (cmd) {
    if (cmd.command == cli.commands.start) {
        println("Starting!");
        return {
            cont: false,
            start: true,
        };
    } else if (cmd.command == cli.commands.exit) {
        println("Exiting!");
        return {
            cont: false,
            start: false,
        };
    } else if (cmd.command == cli.commands.load) {
        println(`Loading file ${cmd.file}...`);
        currMaze = maze.load(`./mazes/${cmd.file}.json`);
        currWorld = world.create(currMaze);
        println(`Loaded file ${cmd.file}!`);
    }
    
    return {
        cont: true,
    };
});

console.log(res);

if (res.start) {
    await cli.ingame(currWorld, function (cmd) {
        if (cmd.command == cli.igcommands.exit) {
            println("Exiting!");
            return {
                cont: false,
            };
        } else if (cmd.command == cli.igcommands.up) {
            if (!currWorld.walk(world.directions.north)) {
                println("Illegal move!");
            }
        } else if (cmd.command == cli.igcommands.left) {
            if (!currWorld.walk(world.directions.west)) {
                println("Illegal move!");
            }
        } else if (cmd.command == cli.igcommands.down) {
            if (!currWorld.walk(world.directions.south)) {
                println("Illegal move!");
            }
        } else if (cmd.command == cli.igcommands.right) {
            if (!currWorld.walk(world.directions.east)) {
                println("Illegal move!");
            }
        }
        
        if (currWorld.isFinished()) {
            println("Finished!");
            return {
                cont: false,
                print: true
            };
        }
        
        return {
            cont: true,
        };
    });
}
