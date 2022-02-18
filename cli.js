import process from "process";
import { println } from "./utils.js";
const prompt = require("prompt");

const commandQuery = [
  {
    name: "command",
    validator: /^(w(est)?|s(outh)?|n(orth)?|e(ast)?|exit|help|load [^\s]*)$/,
    warning:
      "Allowed commands are: 'west', 'south', 'north', 'east', 'exit', 'help', 'load'",
  },
];

function printHelp() {
  println("----- HELP ------");
  println();
  println("--- CONTROLS ---");
  println("  west        : move west");
  println("  south       : move south");
  println("  east        : move south");
  println("  north       : move south");
  println();
  println("  load <file> : load a maze from a file");
  println();
  println("  exit        : move south");
  println("  help        : move south");
  println();
  println("----- HELP ------");
}

var commands = (exports.commands = {
  west: 0,
  south: 1,
  east: 2,
  north: 3,
  load: 4,
  exit: 5,
  help: 6,
});

exports.start = function (onErr) {
  prompt.start();

  printHelp();
};

exports.nextCommand = function () {
  prompt.get(commandQuery, function (err, result) {
    if (err) {
      return onErr(err);
    }

    var cmd = result.command;

    println("Command-line input received:");
    println("  Command: " + cmd);

    if (cmd == "w" || cmd == "west") {
      return {
        command: commands.west,
      };
    } else if (cmd == "s" || cmd == "south") {
      return {
        command: commands.south,
      };
    } else if (cmd == "e" || cmd == "east") {
      return {
        command: commands.east,
      };
    } else if (cmd == "n" || cmd == "north") {
      return {
        command: commands.north,
      };
    } else if (cmd == "exit") {
      return {
        command: commands.help,
      };
      return commands.exit;
    } else if (cmd == "help") {
      return {
        command: commands.help,
      };
    } else if (cmd.startsWith("load ")) {
      var file = cmd.split(" ")[1];
      return {
        command: commands.load,
        file: file,
      };
    }
  });
};
