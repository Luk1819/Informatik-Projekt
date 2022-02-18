import process from "process";
import { println } from "./utils.js";
import prompt from "prompt";
import colors from "@colors/colors/safe";

const commandQuery = [
  {
    name: "command",
    description: colors.yellow("Command: "),
    validator: /^(w(est)?|s(outh)?|n(orth)?|e(ast)?|exit|help|load [^\s]*)$/,
    warning:
      "Allowed commands are: 'west', 'south', 'north', 'east', 'exit', 'help', 'load'",
  },
];

function printHelp() {
  println(colors.green("----- HELP ------"));
  println(colors.cyan("--- CONTROLS ---"));
  println(colors.cyan("  west        : move west"));
  println(colors.cyan("  south       : move south"));
  println(colors.cyan("  east        : move south"));
  println(colors.cyan("  north       : move south"));
  println();
  println(colors.cyan("  load <file> : load a maze from a file"));
  println();
  println(colors.cyan("  exit        : move south"));
  println(colors.cyan("  help        : move south"));
  println(colors.green("----- HELP ------"));
}

export const commands = {
  west: 0,
  south: 1,
  east: 2,
  north: 3,
  load: 4,
  exit: 5,
};

export function start(onErr) {
  prompt.start();

  prompt.message = "";
  prompt.delimiter = "";

  printHelp();
};

function onErr(err) {
  println("ERROR: " + err)
}

export function nextCommand(callback) {
  prompt.get(commandQuery, function (err, result) {
    if (err) {
      onErr(err);
    }

    var cmd = result.command;

    println("Command-line input received:");
    println("  Command: " + cmd);

    if (cmd == "w" || cmd == "west") {
      callback({
        command: commands.west,
      });
    } else if (cmd == "s" || cmd == "south") {
      callback({
        command: commands.south,
      });
    } else if (cmd == "e" || cmd == "east") {
      callback({
        command: commands.east,
      });
    } else if (cmd == "n" || cmd == "north") {
      callback({
        command: commands.north,
      });
    } else if (cmd == "exit") {
      callback({
        command: commands.help,
      });
    } else if (cmd == "help") {
      printHelp();
      nextCommand(callback);
    } else if (cmd.startsWith("load ")) {
      var file = cmd.split(" ")[1];
      callback({
        command: commands.load,
        file: file,
      });
    }
  });
};
