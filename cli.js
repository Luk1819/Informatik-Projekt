import process from "process";
import { println } from "./utils.js";
const prompt = require("prompt");

const commandQuery = [
  {
    name: "command",
    validator: /^(w(est)?|s(outh)?|n(orth)?|e(ast)?|exit|help)$/,
    warning:
      "Allowed commands are: 'west', 'south', 'north', 'east', 'exit', 'help'",
  },
];

function printHelp() {
  println("----- HELP ------");
  println();
  println("--- CONTROLS ---");
  println("  west    : move west");
  println("  south   : move south");
  println("  east   : move south");
  println("  north   : move south");
  println();
  println("  exit   : move south");
  println("  help   : move south");
  println();
  println("----- HELP ------");
}

exports.start = function (onErr) {
  prompt.start();

  printHelp();
};

exports.nextCommand = function () {
  prompt.get(commandQuery, function (err, result) {
    if (err) {
      return onErr(err);
    }

    println("Command-line input received:");
    println("  Command: " + result.command);
  });
};
