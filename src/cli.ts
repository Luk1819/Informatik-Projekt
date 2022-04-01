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

export function start() {
    readline.setDefaultOptions({prompt: chalk.yellow("> ")});
}

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

export function ingame<T>(world: World, commandCallback: (InGameCommand) => (T & { cont: false }) | (any & { cont: true, didMove?: boolean, print?: boolean }), calcTurnCallback: () => (T & { cont: false }) | (any & { cont: true, didMove?: boolean, print?: boolean })): T {
    function printMap() {
        let size = world.maze.size;

        for (let x = 0; x < size[0]; x++) {
            for (let y = 0; y < size[1]; y++) {
                let tile = world.tileAt(x, y);
                let visited = world.isVisited(x, y);

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

    function printMaze() {
        let size = world.maze.size;
        let playerPos = [world.player.x, world.player.y];

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

        let lines: string[] = [];
        let offset = 0;

        let lineSize = windowSize[1] * 10 + 1;

        function printSep() {
            lines[offset] = "-".repeat(lineSize);
            offset += 1;
        }

        for (let x = boundsTopLeft[0]; x < boundsBottomRight[0]; x++) {
            printSep();

            lines[offset] = "";
            lines[offset + 1] = "";
            lines[offset + 2] = "";
            lines[offset + 3] = "";
            lines[offset + 4] = "";

            function printVerticalLine() {
                lines[offset] += "|";
                lines[offset + 1] += "|";
                lines[offset + 2] += "|";
                lines[offset + 3] += "|";
                lines[offset + 4] += "|";
            }

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

                function correctLength(str: string, newSize: number, oldLength?: number) {
                    let size = oldLength || str.length;
                    if (size > 9) {
                        return str.substring(0, newSize - 3) + "...";
                    } else {
                        return " ".repeat((newSize + 1 - size) >> 1) + str + " ".repeat((newSize - size) >> 1);
                    }
                }

                let cleanedTileName = tile.data.name.replace(/{[\w.(),]* ([a-zA-Z0-9 .-_]*)}/, "$1");
                let tileName = correctLength(tile.data.name, 9, cleanedTileName.length)
                let tileText = template(tileName);

                printVerticalLine();

                if (visited) {
                    if (world.maze.end.x == x && world.maze.end.y == y) {
                        lines[offset + 4] += chalk.yellow.bold(correctLength(cleanedTileName, 9));
                    } else {
                        lines[offset + 4] += tileText;
                    }
                } else {
                    lines[offset + 4] += chalk.white(" <_____> ");
                }

                if (visited && tile.data.wall) {
                    let fill = chalk.black.bold(" ####### ");
                    lines[offset] += fill;
                    lines[offset + 1] += fill;
                    lines[offset + 2] += fill;
                    lines[offset + 3] += fill;
                } else if (entity && visible && visited) {
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

                    lines[offset] += entityColor(entityName);
                    lines[offset + 1] += chalk.redBright.bold(" + : " + entity.props.health.toString().padEnd(3) + " ");
                    if (entity.props.damage) {
                        lines[offset + 2] += chalk.red(" I : " + entity.props.damage.toString().padEnd(3) + " ");
                    } else {
                        emptyLine(2);
                    }

                    if (!entity.props.speed || entity.props.speed == 1) {
                        emptyLine(3);
                    } else {
                        lines[offset + 3] += chalk.blue(" ->: " + entity.props.speed.toString().padEnd(3) + " ");
                    }
                } else {
                    emptyLine(0, 1, 2, 3);
                }
            }

            printVerticalLine();

            offset += 5;
        }

        printSep();

        let textToAdd: string[] = [];
        let textSize = 15;

        function noText() {
            textToAdd.push(" ".repeat(textSize));
        }

        function text(txt) {
            txt = " " + txt;
            if (txt.length > textSize) {
                textToAdd.push(txt.substring(0, textSize - 3) + "...");
            } else {
                textToAdd.push(txt.padEnd(textSize));
            }
        }

        noText();
        text("Kills: " + world.kills);
        text("Rounds: " + world.rounds);

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

        for (let idx in textToAdd) {
            if (lines[idx]) {
                lines[idx] += textToAdd[idx];
            } else {
                lines[idx] = " ".repeat(lineSize) + textToAdd;
            }
        }

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
        } else if (cont.map) {
            printMap();
        } else {
            printMaze();
        }

        const char = readline.keyIn("", {
            hideEchoBack: true,
            mask: "",
        });

        clear.exec(true);

        if (cont.help) {
            if (char == "h") {
                cont = {
                    cont: true,
                    help: false,
                };
            }
        } else if (cont.map) {
            if (char == "m") {
                cont = {
                    cont: true,
                    map: false,
                };
            }
        } else {
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

            if (!special && cont.didMove) {
                delete cont.didMove;
                cont = {...cont, ...calcTurnCallback()};
            }
        }
    } while (cont.cont)

    clear.exec();

    if (cont.print) {
        printMaze();
    }

    delete cont.cont;
    delete cont.didMove;
    delete cont.print;
    return cont;
}
