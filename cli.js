import process from "process";
import { println } from "./utils.js";
import colors from "@colors/colors/safe.js";
import * as readline from "readline-sync";

export const commands = {
  start: 0,
  load: 1,
  exit: 2,
};

export function start(onErr) {
  readline.setDefaultOptions({ prompt: colors.yellow("> ") });

  printHelp();
}

function onErr(err) {
  println(`ERROR: ${err}`);
}

export async function menu(callback) {
  var cont = {
    cont: true,
  };

  while (cont.cont) {
    try {
      var args = readline.promptCL();
      var cmd = args[0];

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
        println(colors.cyan("  exit        : move south"));
        println(colors.cyan("  help        : move south"));
        println(colors.green("----- HELP ------"));
      } else if (cmd.startsWith("load ")) {
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

export async function ingame(callback) {
  var cont = {
    cont: true,
  };

  while (cont.cont) {
    try {
      var char = readline.keyIn();

      println("Key pressed: " + char);

      if (char == "h") {
        println("THERE IS NO HELP FOR YOU!");
      } else if ((char = "w" || char == "")) {
        cont = callback({
          command: igcommands.up,
        });
      }
    } catch (err) {
      onErr(err);
    }
  }
}
