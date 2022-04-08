import {print, println, rotate, clear, clamp, storage} from "./utils.js";
import * as mazes from "./maze.js";
import chalk from "chalk";
import {template} from "chalk-template";
import * as readline from "readline-sync";
import * as worlds from "./world.js";
import {World} from "./world.js";

export enum MenuCommand {
    start,
    exit,
    select
}

// Initalizes the CLI
export function start() {
    readline.setDefaultOptions({prompt: chalk.yellow("> ")});
}

// Menu function:
// - Prints the menu
// - Calls the callbacck on user commands
// - Returns any data the callback returned
export function menu<T>(callback: (arg: MenuCommand) => (any & { cont: true }) | (T & { cont: false })): T {
    let cont: T & { cont: boolean };
    do {
        const selected = selection(3, function (index) {
            let width = 50;
            println("-".repeat(width));
            println(chalk.green(" ".repeat((width - 10) / 2) + " MAIN MENU" + " ".repeat((width - 10) / 2)));
            println()

            let idx = 0;

            function printCommand(cmd: string) {
                let line = "";
                let selected = idx == index;

                // Highlight the selected command
                if (selected) {
                    line += " >> ";
                } else {
                    line += "    ";
                }
                idx += 1;

                if (selected) {
                    line += chalk.white.bold(cmd);
                } else {
                    line += chalk.gray(cmd);
                }

                println(line);
            }

            let level = mazes.mazes[storage.get().mazeId];

            printCommand("Start the selected level");
            printCommand("Select a level (current: " + level.data.name + ")");
            printCommand("Exit the game")

            println()
            println("-".repeat(width));
        });

        if (selected == 0) {
            cont = callback(MenuCommand.start);
        } else if (selected == 1) {
            cont = callback(MenuCommand.select);
        } else if (selected == 2) {
            cont = callback(MenuCommand.exit);
        } else {
            throw Error("Illegal state!")
        }
    } while (cont.cont)

    return cont;
}

// Makes the user select one of a number of options
// Printing of the option is done by the callback
export function selection(length: number, printer: (index: number) => void) {
    let cont = {
        index: 0,
        selected: false,
        special: false,
    };

    while (!cont.selected) {
        clear.reset();

        printer(cont.index);

        const char = readline.keyIn("", {
            hideEchoBack: true,
            mask: "",
        });

        // If we got a special characterm, the next char has a different meaning
        if (cont.special) {
            // Arrow up is [A on Linux, not supported on Windows
            if (char == "A") {
                cont.index = rotate(cont.index - 1, 0, length - 1);
            // Arrow down is [B on Linux, not supported on Windows
            } else if (char == "B") {
                cont.index = rotate(cont.index + 1, 0, length - 1);
            }

            cont.special = false;
        } else {
            // On Linux, arrow keys are [X and not supported on Windows
            if (char == "[") {
                cont.special = true;
            } else if (char == "w") {
                cont.index = rotate(cont.index - 1, 0, length - 1);
            } else if (char == "s") {
                cont.index = rotate(cont.index + 1, 0, length - 1);
            } else if (char == " ") {
                cont.selected = true;
            }
        }

        clear.exec();
    }

    return cont.index;
}

export enum InGameCommand {
    up,
    left,
    down,
    right,
    exit,
    restart
}

// Ingame loop:
// - Prints map / minimap / help
// - Gets user input
// - Calls callback with the user's command
// - Between turns, if the player moved, call the turn callback
// - Return additional data provided by any of the  callbacks
export function ingame<T>(world: World, commandCallback: (InGameCommand) => (T & { cont: false }) | (any & { cont: true, didMove?: boolean, print?: boolean }), calcTurnCallback: () => (T & { cont: false }) | (any & { cont: true, didMove?: boolean, print?: boolean })): T {
    // Prints the minimap
    function printMap() {
        let size = world.maze.size;

        for (let x = 0; x < size[0]; x++) {
            for (let y = 0; y < size[1]; y++) {
                let tile = world.tileAt(x, y);
                let visited = world.isVisited(x, y);

                // Formats the name as specified for the tile
                let tileText = template(tile.data.mapName);

                if (visited) {
                    if (world.player.x == x && world.player.y == y) {
                        print(chalk.green.bold("$"));
                    } else if (world.maze.end[0] == x && world.maze.end[1] == y) {
                        print(chalk.yellow.bold("!"));
                    } else {
                        print(tileText);
                    }
                } else {
                    print(chalk.white("?"));
                }
            }

            println();
        }
    }

    // Print the actual maze, zoomed in, with entities
    function printMaze() {
        let size = world.maze.size;
        let playerPos = [world.player.x, world.player.y];

        // Width of the visible window left and right / above and below the center of the window
        let windowMargin = [4, 8];
        // The size of the visible window
        let windowSize = windowMargin.map(v => 2 * v + 1);

        // Compute the center of the window
        // Gets shifted away from the edge if the player is too close to it
        let center = playerPos.map((v, idx) => clamp(v, windowMargin[idx], size[idx] - windowMargin[idx] - 1));
        // If the maze is smaller than the window, we put the window in the center on that axis
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

        // Top left and bottom right corner coordinates
        let boundsTopLeft = center.map((v, idx) => (v - windowMargin[idx]));
        let boundsBottomRight = boundsTopLeft.map((v, idx) => (v + windowSize[idx]));

        // Collect all lines to print so we can modify them later (for tutorial text)
        let lines: string[] = [];
        // The current offset into the lines array
        let offset = 0;

        // The width of the seperators
        let lineSize = windowSize[1] * 10 + 1;

        // Prints the horizontal lines between rows of the maze
        function printSep() {
            lines[offset] = "-".repeat(lineSize);
            offset += 1;
        }

        for (let x = boundsTopLeft[0]; x < boundsBottomRight[0]; x++) {
            printSep();

            // Initialize all the lines needed for this row
            lines[offset] = "";
            lines[offset + 1] = "";
            lines[offset + 2] = "";
            lines[offset + 3] = "";
            lines[offset + 4] = "";

            // Prints a vertical line for the current row
            function printVerticalLine() {
                lines[offset] += "|";
                lines[offset + 1] += "|";
                lines[offset + 2] += "|";
                lines[offset + 3] += "|";
                lines[offset + 4] += "|";
            }

            // Prints empty spaces to the given offsets of the current row
            function emptyLine(...off) {
                for (let idx of off) {
                    lines[offset + idx] += "         ";
                }
            }

            for (let y = boundsTopLeft[1]; y < boundsBottomRight[1]; y++) {
                let tile = world.tileAt(x, y);
                let entity = world.get(x, y);
                let visible = world.isVisible(x, y);
                let visited = world.isVisited(x, y);

                // Patch a string to be the given length
                // If too short, add white spaces in front of the string and at the end so the string is centered as best as possible
                // If too long, truncate and add '...'
                function correctLength(str: string, newSize: number, oldLength?: number) {
                    let size = oldLength || str.length;
                    if (size > 9) {
                        return str.substring(0, newSize - 3) + "...";
                    } else {
                        return " ".repeat((newSize + 1 - size) >> 1) + str + " ".repeat((newSize - size) >> 1);
                    }
                }

                // Get the formatted entity name
                function collectEnemyString(entity) {
                    let entityName;
                    let entityColor;
                    if (entity.type == worlds.EntityType.player) {
                        entityName = "  Player ";
                        entityColor = chalk.green.bold
                    } else if (entity.type == worlds.EntityType.item) {
                        entityName = "   Item  ";
                        entityColor = chalk.cyan;
                    } else if (entity.type == worlds.EntityType.enemy) {
                        entityName = correctLength(entity.props.name, 9)
                        entityColor = chalk.red.italic
                    } else {
                        entityName = " Unknown ";
                        entityColor = chalk.magenta.bold.italic
                    }
    
                    return entityColor(entityName);
                }

                // The tile name without formatting
                let cleanedTileName = tile.data.name.replace(/{[\w.(),]* ([a-zA-Z0-9 .-_]*)}/, "$1");
                // The formatted tile name with a correct length. Only works correctly if tilename is too short.
                let tileName = correctLength(tile.data.name, 9, cleanedTileName.length)
                // The formatted tile name
                let tileText = template(tileName);

                printVerticalLine();

                // If we know the current tile, print it's name
                // Yellow if it is the goal
                if (visited) {
                    if (world.maze.end.x == x && world.maze.end.y == y) {
                        lines[offset + 4] += chalk.yellow.bold(correctLength(cleanedTileName, 9));
                    } else {
                        lines[offset + 4] += tileText;
                    }
                } else {
                    lines[offset + 4] += chalk.white(" <_____> ");
                }

                // If the tile should be filled, also try to print an entity that might be there, but only the name (should still be filled)
                if (visited && tile.data.fill) {
                    let fill = chalk.black.bold(" ####### ");
                    lines[offset] += fill;
                    lines[offset + 1] += fill;
                    lines[offset + 2] += fill;
                    if (entity && visible) {
                        lines[offset + 3] += collectEnemyString(entity);
                    } else {
                        lines[offset + 3] += fill;
                    }
                // If there is an entity, print it with it's stats
                } else if (entity && visible && visited) {
                    lines[offset] += collectEnemyString(entity);
                    lines[offset + 1] += chalk.redBright.bold(" + : " + entity.props.health.toString().padEnd(3) + " ");
                    if (entity.props.damage) {
                        lines[offset + 2] += chalk.red(" ! : " + entity.props.damage.toString().padEnd(3) + " ");
                    } else {
                        emptyLine(2);
                    }

                    if (!entity.props.speed || entity.props.speed == 1) {
                        emptyLine(3);
                    } else {
                        lines[offset + 3] += chalk.blue(" ->: " + entity.props.speed.toString().padEnd(3) + " ");
                    }
                    // Otherwise empty tile
                } else {
                    emptyLine(0, 1, 2, 3);
                }
            }

            printVerticalLine();

            // Move 'cursor' to the next row
            offset += 5;
        }

        printSep();

        // The tutorial text to add right of the maze
        let textToAdd: string[] = [];
        // The width of the tutorial text. Gets truncated / widened to this width
        let textSize = 15;

        // Adds an empty line to the tutorial text
        function noText() {
            textToAdd.push(" ".repeat(textSize));
        }

        // Adds the given line to the tutorial text
        function text(txt) {
            txt = " " + txt;
            if (txt.length > textSize) {
                textToAdd.push(txt.substring(0, textSize - 3) + "...");
            } else {
                textToAdd.push(txt.padEnd(textSize));
            }
        }

        // Add the stats
        noText();
        text("Kills: " + world.kills);
        text("Rounds: " + world.rounds);

        // Add the text of the level
        let tutorialText = world.maze.data.text;
        if (tutorialText.length > 0) {
            noText();
            text("-".repeat(textSize - 1));
            noText()
            for (let line of tutorialText) {
                text(line);
            }
            noText();
            text("-".repeat(textSize - 1));
            noText()
        }

        // Add the tutorial text to the right of the maze
        for (let idx in textToAdd) {
            if (lines[idx]) {
                lines[idx] += textToAdd[idx];
            } else {
                lines[idx] = " ".repeat(lineSize) + textToAdd;
            }
        }

        // Actually print the lines
        for (let line of lines) {
            println(line);
        }
    }

    let cont: (T & { cont?: boolean, didMove?: boolean, print?: boolean, help?: boolean, map?: boolean }) | { cont: true, didMove?: boolean, help?: boolean, map?: boolean } = {
        cont: true
    };
    let special = false;

    clear.reset();

    do {
        // If the user requested help, print nothing else
        if (cont.help) {
            println(chalk.green("----- HELP ------"));
            println(chalk.cyan("--- CONTROLS ---"));
            println(chalk.cyan("  WASD / Arrow keys   : move around"));
            println();
            println(chalk.cyan("  M                   : open the minimap"));
            println();
            println(chalk.cyan("  E                   : exit the level"));
            println(chalk.cyan("  R                   : restart this level"));
            println(chalk.cyan("  H                   : print this help"));
            println(chalk.green("----- HELP ------"));
        // If the user opened the minimap, don't print the maze
        } else if (cont.map) {
            printMap();
        // Otherwise, print the maze
        } else {
            printMaze();
        }

        const char = readline.keyIn("", {
            hideEchoBack: true,
            mask: "",
        });

        clear.exec(true);

        // If the help is currently open, only allow closing it
        if (cont.help) {
            if (char == "h") {
                cont = {
                    cont: true,
                    help: false,
                };
            }
        // If the minimap is open, only allow closing it
        } else if (cont.map) {
            if (char == "m") {
                cont = {
                    cont: true,
                    map: false,
                };
            }
        // Otherwise process all keys
        } else {
            // Special key on Linux (Arrow keys)
            if (special) {
                if (char == "A") {
                    cont = commandCallback(InGameCommand.up);
                } else if (char == "B") {
                    cont = commandCallback(InGameCommand.down);
                } else if (char == "C") {
                    cont = commandCallback(InGameCommand.right);
                } else if (char == "D") {
                    cont = commandCallback(InGameCommand.left);
                }

                special = false;
            } else {
                if (char == "h") {
                    cont = {
                        cont: true,
                        help: true,
                    };
                // Special keys on linux are printed like [X
                } else if (char == "[") {
                    special = true;
                } else if (char == "w") {
                    cont = commandCallback(InGameCommand.up);
                } else if (char == "s") {
                    cont = commandCallback(InGameCommand.down);
                } else if (char == "d") {
                    cont = commandCallback(InGameCommand.right);
                } else if (char == "a") {
                    cont = commandCallback(InGameCommand.left);
                } else if (char == "m") {
                    cont = {
                        cont: true,
                        map: true,
                    };
                } else if (char == "e") {
                    cont = commandCallback(InGameCommand.exit);
                } else if (char == "r") {
                    cont = commandCallback(InGameCommand.restart);
                }
            }

            // If we processed a normal key and the callback says the player has moved,
            if (!special && cont.didMove) {
                // Call the turn callback and merge it's result with old result
                delete cont.didMove;
                cont = {...cont, ...calcTurnCallback()};
            }
        }
    } while (cont.cont)

    clear.exec();

    // If the callback wants to print the maze again, do it
    if (cont.print) {
        printMaze();
    }

    // Remove our special keys and return the rest
    delete cont.cont;
    delete cont.didMove;
    delete cont.print;
    return cont;
}
