import process from "process";
import { println } from "./utils.js";
import prompt from "prompt";
import colors from "@colors/colors/safe.js";
import * as readline from "readline-sync";

const commandQuery = [
  {
    name: "command",
    description: colors.yellow(" > "),
    validator: /^(exit|help|load [^\s]*|start)$/,
    warning:
      "Allowed commands are: 'west', 'south', 'north', 'east', 'exit', 'help', 'load'",
  },
];

function printHelp() {
  println(colors.green("----- HELP ------"));
  println(colors.cyan("--- CONTROLS ---"));
  println(colors.cyan("  load <file> : load a maze from a file"));
  println(colors.cyan("  start       : starts the game"));
  println();
  println(colors.cyan("  exit        : move south"));
  println(colors.cyan("  help        : move south"));
  println(colors.green("----- HELP ------"));
}

export const commands = {
  start: 0,
  load: 1,
  exit: 2,
};

export function start(onErr) {
  prompt.start();

  prompt.message = "";
  prompt.delimiter = "";

  printHelp();
}

function onErr(err) {
  println(`ERROR: ${err}`);
}

export function nextCommand(callback) {
  var cont = true;
  while (cont) {
    try {
      var result = await prompt.get(commandQuery);
      var cmd = result.command;

      println("Command-line input received:");
      println("  Command: " + cmd);

      if (cmd == "start") {
        cont = callback({
          command: commands.start,
        });
      } else if (cmd == "exit") {
        cont = callback({
          command: commands.help,
        });
      } else if (cmd == "help") {
        printHelp();
        nextCommand();
      } else if (cmd.startsWith("load ")) {
        var file = cmd.split(" ")[1];
        cont = callback({
          command: commands.load,
          file: file,
        });
      }
    } catch (err) {
      onErr(err);
    }
  }
}
