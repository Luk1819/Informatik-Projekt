import * as cli from "./cli.js";
import { println } from "./utils.js";
import * as maze from "./maze.js";
import * as world from "./world.js";
import * as enemies from "./enemies.js";
import colors from "@colors/colors/safe.js";

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

let cont = {
    restart: res.start,
};

while (cont.restart) {
    cont.restart = false;

    cont = await cli.ingame(currWorld, function (cmd) {
        let moved = false;
        
        if (cmd.command == cli.igcommands.exit) {
            println("Exiting!");
            return {
                cont: false,
                exited: true
            };
        } else if (cmd.command == cli.igcommands.restart) {
            println("Restarting!");
            currWorld = world.create(currMaze);
            return {
                cont: false,
                restart: true
            }
        }  else if (cmd.command == cli.igcommands.up) {
            if (!currWorld.walk(world.directions.north)) {
                println("Illegal move!");
            } else {
                moved = true;
            }
        } else if (cmd.command == cli.igcommands.left) {
            if (!currWorld.walk(world.directions.west)) {
                println("Illegal move!");
            } else {
                moved = true;
            }
        } else if (cmd.command == cli.igcommands.down) {
            if (!currWorld.walk(world.directions.south)) {
                println("Illegal move!");
            } else {
                moved = true;
            }
        } else if (cmd.command == cli.igcommands.right) {
            if (!currWorld.walk(world.directions.east)) {
                println("Illegal move!");
            } else {
                moved = true;
            }
        }
        
        if (currWorld.isFinished()) {
            return {
                cont: false,
                print: true
            };
        }
        
        return {
            cont: true,
            didMove: moved
        };
    }, function () {
        currWorld.enemyMove();
        
        if (currWorld.isFinished()) {
            return {
                cont: false,
                print: true
            };
        }
        
        return {
            cont: true
        };
    });
}

function printSep(size) {
    println();
    println(colors.gray("-".repeat(size)));
    println();
}

if (!cont.exited) {
    if (!currWorld.survived()) {
        printSep(14)
        println(colors.red(colors.italic("YOU'RE DEAD...")));
        printSep(14)
    } else {
        printSep(8)
        println(colors.green(colors.bold("YOU WON!")));
        printSep(8)
    }
}
