import process from 'process';
import { println } from './utils.js';
const prompt = require('prompt');
const utils = require('./utils.js')


const commandQuery = [
    {
      name: 'command',
      validator: /^(w(est)?|s(outh)?|n(orth)?|e(ast)?|exit|help)$/,
      warning: "Allowed commands are: 'west', 'south', 'north', 'east', 'exit', 'help'"
    }
  ];

function printHelp() {
  utils.println("----- HELP ------")
  utils.println()
  utils.println("--- CONTROLS ---")
  utils.println("  west    : move west")
  utils.println("  south   : move south")
  utils.println("  east   : move south")
  utils.println("  north   : move south")
  utils.println()
  utils.println("  exit   : move south")
  utils.println("  help   : move south")
  utils.println()
  utils.println("----- HELP ------")
}

exports.start = function (onErr) {
  prompt.start();

  printHelp()
}

exports.nextCommand = function () {
  prompt.get(commandQuery, function (err, result) {
    if (err) {
      return onErr(err);
    }

    utils.println('Command-line input received:');
    utils.println('  Command: ' + result.command);
  });
}
