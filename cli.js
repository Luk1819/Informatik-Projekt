import { print, println, rotate, clear, clamp } from "./utils.js";
import * as mazes from "./maze.js";
import colors from "@colors/colors/safe.js";
import * as readline from "readline-sync";
import * as worlds from "./world.js";

export const commands = {
    start: 0,
    exit: 1,
    select: 2,
};

export function start() {
    readline.setDefaultOptions({prompt: colors.yellow("> ")});
}

function onErr(err) {
    println(`ERROR: ${err}`);
}

export function menu(callback) {
    let cont = {
        cont: true,
    };
    
    while (cont.cont) {
        try {
            const args = readline.promptCL();
            const cmd = args[0];
            clear.inc(2);
            
            if (cmd == "start") {
                cont = callback({
                    command: commands.start,
                });
            } else if (cmd == "exit") {
                cont = callback({
                    command: commands.exit,
                });
            } else if (cmd == "help") {
                println(colors.green("----- HELP ------"));
                println(colors.cyan("--- CONTROLS ---"));
                println(colors.cyan("  start       : starts the game"));
                println();
                println(colors.cyan("  select      : select a level to play"));
                println();
                println(colors.cyan("  exit        : exit the game"));
                println(colors.cyan("  help        : print this help"));
                println(colors.green("----- HELP ------"));
            } else if (cmd == "select") {
                cont = callback({
                    command: commands.select,
                });
            } else {
                println("Unknown command: " + args);
            }
        } catch (err) {
            onErr(err);
        }
    }
    
    delete cont.cont;
    return cont;
}

export function selection(length, printer) {
    let cont = {
        index: 0,
        selected: false,
        special: false,
    };

    while (!cont.selected) {
        try {
            clear.reset()
            
            printer(cont.index)
            
            const char = readline.keyIn("", {
                hideEchoBack: true,
                mask: "",
            });
            
            if (cont.special) {
                if (char == "A") {
                    cont.index = rotate(cont.index - 1, 0, length - 1);
                } else if (char == "B") {
                    cont.index = rotate(cont.index + 1, 0, length - 1);
                }
                
                cont.special = false;
            } else {
                if (char == "[") {
                    cont.special = true;
                } else if (char == " ") {
                    cont.selected = true;
                }
            }
    
            clear.exec()
        } catch (err) {
            onErr(err);
        }
    }

    return cont.index;
}

export const igcommands = {
    up: 0,
    left: 1,
    down: 2,
    right: 3,
    map: 4,
    exit: 5,
    restart: 6,
};

export function ingame(world, commandCallback, calcTurnCallback) {
    let cont = {
        cont: true,
        didMove: false
    };
    let special = false;
    
    function printMap() {
        let size = world.maze.size;
        
        for (let x = 0; x < size[0]; x++) {
            for (let y = 0; y < size[1]; y++) {
                let tile = world.maze.get(x, y);
                let visited = world.isVisited(x, y);
            
                let tileChar;
                let tileColor;
                if (tile == mazes.types.stone) {
                    tileChar = "_";
                    tileColor = colors.gray;
                } else if (tile == mazes.types.wall) {
                    tileChar = "#";
                    tileColor = function (str) {
                        return colors.black(colors.italic(colors.bold(str)));
                    };
                }
                
                if (visited) {
                    if (world.player[0] == x && world.player[1] == y) {
                        print(colors.green(colors.bold("$")))
                    } else if (world.maze.end[0] == x && world.maze.end[1] == y) {
                        print(colors.yellow(colors.bold("!")));
                    } else {
                        print(tileColor(tileChar));
                    }
                } else {
                    print(colors.white("?"));
                }
            }
            
            println();
        }
    }
    
    function printMaze() {
        let size = world.maze.size;
        let playerPos = world.player;
        
        let windowMargin = [4, 8];
        let windowSize = windowMargin.map(v => 2 * v + 1);
        
        let center = playerPos.map((v, idx) => clamp(v, windowMargin[idx], size[idx] - windowMargin[idx] - 1));
        if (windowSize[0] > size[0]) {
            windowSize[0] = size[0];
            windowMargin[0] = Math.trunc(size[0] / 2);
            center[0] = windowMargin[0];
        }
        if (windowSize[1] > size[1]) {
            windowSize[1] = size[1];
            windowMargin[1] = Math.trunc(size[1] / 2);
            center[1] = windowMargin[1];
        }
        
        let boundsTopLeft = center.map((v, idx) => (v - windowMargin[idx]));
        let boundsBottomRight = boundsTopLeft.map((v, idx) => (v + windowSize[idx]));
        
        function printSep() {
            println("-".repeat(windowSize[1] * 10 + 1));
        }
        
        for (let x = boundsTopLeft[0]; x < boundsBottomRight[0]; x++) {
            printSep();
            
            let lines = ["", "", "", "", ""];
            
            for (let y = boundsTopLeft[1]; y < boundsBottomRight[1]; y++) {
                let tile = world.maze.get(x, y);
                let entity = world.get(x, y);
                let visible = world.isVisible(x, y);
                let visited = world.isVisited(x, y);
                
                let tileName;
                let tileColor;
                if (tile == mazes.types.stone) {
                    tileName = "  Stone  ";
                    tileColor = colors.gray;
                } else if (tile == mazes.types.wall) {
                    tileName = "   Wall  ";
                    tileColor = function (str) {
                        return colors.black(colors.italic(colors.bold(str)));
                    };
                }
                
                lines[0] += "|";
                lines[1] += "|";
                lines[2] += "|";
                lines[3] += "|";
                lines[4] += "|";
                if (visited) {
                    if (world.maze.end[0] == x && world.maze.end[1] == y) {
                        lines[4] += colors.yellow(colors.bold(tileName));
                    } else {
                        lines[4] += tileColor(tileName);
                    }
                } else {
                    lines[4] += colors.white(" <_____> ");
                }
                
                if (visited && tile == mazes.types.wall) {
                    let fill = colors.black(colors.bold(" ####### "));
                    lines[0] += fill;
                    lines[1] += fill;
                    lines[2] += fill;
                    lines[3] += fill;
                } else if (entity && visible && visited) {
                    let entityName;
                    let entityColor;
                    if (entity.type == worlds.entityTypes.player) {
                        entityName = "  Player ";
                        entityColor = function (str) {
                            return colors.green(colors.bold(str));
                        };
                    } else if (entity.type == worlds.entityTypes.item) {
                        entityName = "   Item  ";
                        entityColor = colors.cyan;
                    } else if (entity.type == worlds.entityTypes.enemy) {
                        let name = entity.props.name;
                        let size = name.length;
                        if (size > 9) {
                            entityName = name.substring(0, 8) + ".";
                        } else {
                            entityName = " ".repeat((10 - size) >> 1) + name + " ".repeat((9 - size) >> 1);
                        }
                        entityColor = function (str) {
                            return colors.red(colors.italic(str));
                        };
                    } else {
                        entityName = " Unknown "
                        entityColor = function (str) {
                            return colors.magenta(colors.bold(colors.italic(str)));
                        };
                    }
                    
                    lines[0] += entityColor(entityName);
                    lines[1] += colors.magenta(" H: " + entity.props.health.toString().padEnd(4) + " ");
                    lines[2] += colors.red(" D: " + entity.props.damage.toString().padEnd(4) + " ");
                    
                    if (!entity.props.speed || entity.props.speed == 1) {
                        lines[3] += "         ";
                    } else {
                        lines[3] += colors.blue(" S: " + entity.props.speed.toString().padEnd(4) + " ");
                    }
                } else {
                    lines[0] += "         ";
                    lines[1] += "         ";
                    lines[2] += "         ";
                    lines[3] += "         ";
                }
            }
            
            for (const line of lines) {
                println(line + "|");
            }
        }
        printSep();
    }
    
    clear.reset();
    
    while (cont.cont) {
        try {
            if (cont.map) {
                printMap();
            } else {
                printMaze();
            }
            
            const char = readline.keyIn("", {
                hideEchoBack: true,
                mask: "",
            });
            
            clear.exec(true);
            
            if (cont.map) {
                if (char == "m") {
                    cont = commandCallback({
                        command: igcommands.map,
                        map: cont.map,
                    });
                }
            } else {
                if (special) {
                    if (char == "A") {
                        cont = commandCallback({
                            command: igcommands.up,
                        });
                    } else if (char == "B") {
                        cont = commandCallback({
                            command: igcommands.down,
                        });
                    } else if (char == "C") {
                        cont = commandCallback({
                            command: igcommands.right,
                        });
                    } else if (char == "D") {
                        cont = commandCallback({
                            command: igcommands.left,
                        });
                    }
        
                    special = false;
                } else {
                    if (char == "h") {
                        println("THERE IS NO HELP FOR YOU!");
                    } else if (char == "[") {
                        special = true;
                    } else if (char == "w") {
                        cont = commandCallback({
                            command: igcommands.up,
                        });
                    } else if (char == "s") {
                        cont = commandCallback({
                            command: igcommands.down,
                        });
                    } else if (char == "d") {
                        cont = commandCallback({
                            command: igcommands.right,
                        });
                    } else if (char == "a") {
                        cont = commandCallback({
                            command: igcommands.left,
                        });
                    } else if (char == "m") {
                        cont = commandCallback({
                            command: igcommands.map,
                        });
                    } else if (char == "e") {
                        cont = commandCallback({
                            command: igcommands.exit,
                        });
                    } else if (char == "r") {
                        cont = commandCallback({
                            command: igcommands.restart,
                        });
                    }
                }
            }
            
            if (cont.didMove) {
                cont = {...cont, ...calcTurnCallback()};
            }
        } catch (err) {
            onErr(err);
        }
    }
    
    clear.exec();
    
    if (cont.print) {
        printMaze();
    }
    
    delete cont.cont;
    delete cont.didMove;
    delete cont.print;
    return cont;
}
