import { println } from "./utils.js";
import * as mazes from "./maze.js";
import colors from "@colors/colors/safe.js";
import * as readline from "readline-sync";

export const commands = {
    start: 0,
    load: 1,
    exit: 2,
};

export function start() {
    readline.setDefaultOptions({prompt: colors.yellow("> ")});
}

function onErr(err) {
    println(`ERROR: ${err}`);
}

export async function menu(callback) {
    let cont = {
        cont: true,
    };
    
    while (cont.cont) {
        try {
            const args = readline.promptCL();
            const cmd = args[0];
            
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
                println(colors.cyan("  load <file> : load a maze from a file"));
                println(colors.cyan("  start       : starts the game"));
                println();
                println(colors.cyan("  exit        : exit the game"));
                println(colors.cyan("  help        : print this help"));
                println(colors.green("----- HELP ------"));
            } else if (cmd == "load") {
                cont = callback({
                    command: commands.load,
                    file: args[1],
                });
            }
        } catch (err) {
            onErr(err);
        }
    }
    
    delete cont.cont;
    return cont;
}

export const igcommands = {
    up: 0,
    left: 1,
    down: 2,
    right: 3,
    exit: 4,
};

export async function ingame(world, callback) {
    let cont = {
        cont: true,
    };
    let special = false;
    
    while (cont.cont) {
        try {
            let size = world.maze.size;
            
            function printSep() {
                println("-".repeat(size[1] * 10 + 1));
            }
            
            for (let x = 0; x < size[0]; x++) {
                printSep();
                
                let lines = ["", "", "", "", "", ""];
                
                for (let y = 0; y < size[1]; y++) {
                    let tile = world.maze.get(x, y);
                    let entity = world.get(x, y);
                    
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
                    lines[5] += "|" + tileColor(tileName);
                    
                    if (entity) {
                        let entityName;
                        let entityColor;
                        if (entity.type === 0) {
                            entityName = "  Player ";
                            entityColor = function (str) {
                                return colors.green(colors.bold(str));
                            };
                        } else {
                            let name = entity.name;
                            let size = name.length;
                            if (size > 9) {
                                entityName = name.substring(0, 7) + ".";
                            } else {
                                entityName = " ".repeat((10 - size) >> 1) + name + " ".repeat((9 - size) >> 1);
                            }
                            entityColor = function (str) {
                                return colors.red(colors.italic(str));
                            };
                        }
                        
                        lines[0] += entityColor(entityName);
                        lines[1] += colors.cyan(" H: " + entity.health.toString().padEnd(4) + " ");
                        
                        if (entity.type === 0) {
                            lines[2] += "         ";
                            lines[3] += "         ";
                        } else {
                            lines[2] += colors.magenta(" D: " + entity.damage.toString().padEnd(4) + " ");
                            lines[3] += colors.blue(" S: " + entity.speed.toString().padEnd(4) + " ");
                        }
                    } else {
                        lines[0] += "         ";
                        lines[1] += "         ";
                        lines[2] += "         ";
                        lines[3] += "         ";
                    }
                    
                    if (world.maze.end[0] == x && world.maze.end[1] == y) {
                        lines[4] += colors.yellow(colors.bold("   End   "));
                    } else {
                        lines[4] += "         ";
                    }
                }
                
                for (const line of lines) {
                    println(line + "|");
                }
            }
            printSep();
            
            const char = readline.keyIn("", {
                hideEchoBack: true,
                mask: "",
            });
            
            if (special) {
                if (char == "A") {
                    cont = callback({
                        command: igcommands.up,
                    });
                } else if (char == "B") {
                    cont = callback({
                        command: igcommands.down,
                    });
                } else if (char == "C") {
                    cont = callback({
                        command: igcommands.right,
                    });
                } else if (char == "D") {
                    cont = callback({
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
                    cont = callback({
                        command: igcommands.up,
                    });
                } else if (char == "s") {
                    cont = callback({
                        command: igcommands.down,
                    });
                } else if (char == "d") {
                    cont = callback({
                        command: igcommands.right,
                    });
                } else if (char == "a") {
                    cont = callback({
                        command: igcommands.left,
                    });
                } else if (char == "e") {
                    cont = callback({
                        command: igcommands.exit,
                    });
                }
            }
        } catch (err) {
            onErr(err);
        }
    }
}
