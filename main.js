import * as cli from "./cli.js";
import { println, storage, containsAll, clear } from "./utils.js";
import * as maze from "./maze.js";
import * as world from "./world.js";
import * as enemies from "./enemies.js";
import * as loot from "./loot.js";
import colors from "@colors/colors/safe.js";

cli.start();

await loot.discover();
await enemies.discover();
await maze.discover();

let mazeId = "tutorial_move";

let res = {
    start: true,
};

storage.load();

while (res.start) {
    res = cli.menu(function (cmd) {
        if (cmd.command == cli.commands.start) {
            return {
                cont: false,
                start: true,
            };
        } else if (cmd.command == cli.commands.exit) {
            return {
                cont: false,
                start: false,
            };
        } else if (cmd.command == cli.commands.select) {
            const completed = storage.get().completed;
            let levels = [];
            let tutorials = [];
            
            let available = {
                levels: 0,
                tutorials: 0,
            };
            
            for (let id in maze.mazes) {
                let level = maze.mazes[id];
                
                let arr = levels;
                let av = "levels";
                if (level.data.tutorial) {
                    arr = tutorials;
                    av = "tutorials";
                }
                
                if (completed.includes(id)) {
                    arr.push({
                        name: level.data.name,
                        done: true,
                        available: true,
                        order: level.data.order,
                        id,
                    });
                    available[av] += 1;
                } else if (containsAll(level.data.dependencies, completed)) {
                    arr.push({
                        name: level.data.name,
                        available: true,
                        order: level.data.order,
                        id,
                    });
                    available[av] += 1;
                } else {
                    arr.push({
                        name: level.data.name,
                        order: level.data.order,
                        id,
                    });
                }
            }
            
            let sorter = function (a, b) {
                return a.order.localeCompare(b.order);
            }
            levels.sort(sorter);
            tutorials.sort(sorter);
            
            const tutorialCount = tutorials.length;
            const levelCount = levels.length;
            
            let chosen = cli.selection(available.tutorials + available.levels, function (index) {
                let idx = 0;
                
                function printArray(array) {
                    for (let entry of array) {
                        let line = "";
                        
                        if (entry.available) {
                            if (idx == index) {
                                line += " >> ";
                            } else {
                                line += "    ";
                            }
                            idx += 1;
                        } else {
                            line += "    ";
                        }
                        
                        if (entry.done) {
                            line += colors.green(entry.name);
                        } else if (entry.available) {
                            line += colors.blue(entry.name);
                        } else {
                            line += colors.gray(entry.name);
                        }
                        
                        println(line);
                    }
                }
                
                println("Tutorials:");
                printArray(tutorials);
                println("Levels:");
                printArray(levels);
            });
            
            let entry;
            let idx = 0;
            for (let index = 0; index < tutorialCount + levelCount; index++) {
                if (index < tutorialCount) {
                    entry = tutorials[index];
                } else {
                    entry = levels[index - tutorialCount];
                }
                if (entry.available) {
                    if (idx == chosen) {
                        break
                    }
                    idx += 1;
                }
            }
            
            mazeId = entry.id;
            println(`Loaded maze ${entry.name}!`);
        }
        
        return {
            cont: true,
        };
    });
    
    let cont = {
        restart: res.start,
    };
    
    let currMaze = maze.mazes[mazeId];
    
    while (cont.restart) {
        let currWorld = world.create(currMaze);
        
        cont.restart = false;
        
        cont = cli.ingame(currWorld, function (cmd) {
            let moved = false;
            
            if (cmd.command == cli.igcommands.exit) {
                return {
                    cont: false,
                    exited: true
                };
            } else if (cmd.command == cli.igcommands.restart) {
                currWorld = world.create(currMaze);
                return {
                    cont: false,
                    restart: true
                };
            } else if (cmd.command == cli.igcommands.up) {
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
        
        cont.survived = currWorld.survived();
    }
    
    function printSep(size) {
        println();
        println(colors.gray("-".repeat(size)));
        println();
    }
    
    if (res.start && !cont.exited) {
        if (!cont.survived) {
            printSep(14);
            println(colors.red(colors.italic("YOU'RE DEAD...")));
            printSep(14);
        } else {
            printSep(8);
            println(colors.green(colors.bold("YOU WON!")));
            printSep(8);
            
            let completed = storage.get().completed;
            if (!completed.includes(mazeId)) {
                completed.push(mazeId);
            }
        }
    }
}

storage.save();

clear.exec();
