import * as cli from "./cli.js";
import {println, storage, containsAll, clear, randomize, print} from "./utils.js";
import * as maze from "./maze.js";
import * as world from "./world.js";
import * as enemies from "./enemies.js";
import * as loot from "./loot.js";
import * as module from "./module.js";
import * as generator from "./generator.js";
import chalk from "chalk";
import {MenuCommand} from "./cli.js";
import {Maze} from "./maze.js";

randomize();

cli.start();

loot.discover();
enemies.discover();
maze.discover();
module.discover();

let res = {
    start: true,
    freeplay: false
};

storage.load();

type LevelPrintDef = {
    name: string,
    done?: boolean,
    available?: boolean,
    order: string,
    id: string
}

while (res.start) {
    res = cli.menu(function (cmd: MenuCommand) {
        if (cmd == cli.MenuCommand.start) {
            return {
                cont: false,
                start: true,
            };
        } else if (cmd == cli.MenuCommand.exit) {
            return {
                cont: false,
                start: false,
            };
        } else if (cmd == cli.MenuCommand.select) {
            const completed = storage.get().completed;

            let levels: LevelPrintDef[] = [];
            let tutorials: LevelPrintDef[] = [];
            
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
            
            let sorter = function (a: LevelPrintDef, b: LevelPrintDef) {
                return a.order.localeCompare(b.order);
            };
            levels.sort(sorter);
            tutorials.sort(sorter);
            
            const freeplayCount = 1;
            const tutorialCount = tutorials.length;
            const levelCount = levels.length;
            const mazeCount = freeplayCount + tutorialCount + levelCount;
            
            let chosen = cli.selection(mazeCount, function (index: number) {
                let width = 40;
                println("-".repeat(width));
                println(chalk.yellow(" ".repeat((width - 20) / 2) + "   LEVEL SELECTION  " + " ".repeat((width - 20) / 2)));
                println();
                
                let idx = 1;
                
                function printArray(array: LevelPrintDef[]) {
                    for (let entry of array) {
                        let line = "";
                        let selected = entry.available && idx == index;
                        
                        if (entry.available) {
                            if (selected) {
                                line += " >> ";
                            } else {
                                line += "    ";
                            }
                            idx += 1;
                        } else {
                            line += "    ";
                        }
                        
                        let text;
                        if (entry.done) {
                            text = chalk.green(entry.name);
                        } else if (entry.available) {
                            text = chalk.blue(entry.name);
                        } else {
                            text = chalk.gray(entry.name);
                        }
                        
                        if (selected) {
                            text = chalk.bold(text);
                        }
                        line += text;
                        
                        println(line);
                    }
                }
                
                println(chalk.yellow("      Freeplay"));
                if (index == 0) {
                    print(" >> ");
                } else {
                    print("    ");
                }
                println(chalk.red("Freeplay"));
                println();
                println(chalk.yellow("      Tutorials"));
                printArray(tutorials);
                println();
                println(chalk.yellow("      Levels"));
                printArray(levels);
                
                println();
                println("-".repeat(width));
            });
            
            if (chosen != -1) {
                let entry;
                let idx = 1;
                if (chosen == 0) {
                    return {
                        cont: false,
                        freeplay: true,
                        start: true
                    };
                } else {
                    for (let index = 0; index < tutorialCount + levelCount; index++) {
                        if (index < tutorialCount) {
                            entry = tutorials[index];
                        } else {
                            entry = levels[index - tutorialCount];
                        }
                        if (entry.available) {
                            if (idx == chosen) {
                                break;
                            }
                            idx += 1;
                        }
                    }
                }
                
                
                storage.get().mazeId = entry.id;
            }
        }
        
        return {
            cont: true,
        };
    });
    
    let cont: { restart: boolean, survived?: boolean, exited?: boolean } = {
        restart: res.start,
    };

    let currMaze: Maze;
    if (res.freeplay) {
        currMaze = generator.createMaze(4, 4);
    } else {
        currMaze = maze.mazes[storage.get().mazeId];
    }
    
    while (cont.restart) {
        let currWorld = world.create(currMaze);

        if (res.freeplay) {
            for (let x = 0; x < currMaze.size[0]; x++) {
                for (let y = 0; y < currMaze.size[1]; y++) {
                    currWorld.setVisited(x, y)
                }
            }
        }
        
        cont = cli.ingame(currWorld, function (cmd) {
            let moved = false;
            
            if (cmd == cli.InGameCommand.exit) {
                return {
                    cont: false,
                    exited: true
                };
            } else if (cmd == cli.InGameCommand.restart) {
                currWorld = world.create(currMaze);
                return {
                    cont: false,
                    restart: true
                };
            } else if (cmd == cli.InGameCommand.up) {
                if (!currWorld.walk(world.Direction.north)) {
                    println("Illegal move!");
                } else {
                    moved = true;
                }
            } else if (cmd == cli.InGameCommand.left) {
                if (!currWorld.walk(world.Direction.west)) {
                    println("Illegal move!");
                } else {
                    moved = true;
                }
            } else if (cmd == cli.InGameCommand.down) {
                if (!currWorld.walk(world.Direction.south)) {
                    println("Illegal move!");
                } else {
                    moved = true;
                }
            } else if (cmd == cli.InGameCommand.right) {
                if (!currWorld.walk(world.Direction.east)) {
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
            currWorld.tick();
            
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
        println(chalk.gray("-".repeat(size)));
        println();
    }
    
    if (res.start && !cont.exited) {
        if (!cont.survived) {
            printSep(14);
            println(chalk.red.italic("YOU'RE DEAD..."));
            printSep(14);
        } else {
            printSep(8);
            println(chalk.green.bold("YOU WON!"));
            printSep(8);
            
            let completed = storage.get().completed;
            if (!completed.includes(storage.get().mazeId)) {
                completed.push(storage.get().mazeId);
            }
        }
    }
}

storage.save();

clear.exec();
