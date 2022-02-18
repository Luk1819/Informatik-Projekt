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
});

exports.start = function (onErr) {
  prompt.start();

  printHelp();
};

exports.nextCommand = function (callback) {
  prompt.get(commandQuery, function (err, result) {
    if (err) {
      callback(onErr(err));
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
      exports.nextCommand(callback);
    } else if (cmd.startsWith("load ")) {
      var file = cmd.split(" ")[1];
      callback({
        command: commands.load,
        file: file,
      });
    }
  });
};
