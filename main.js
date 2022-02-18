var cli = require("./cli.js");
import { println } from "./utils.js";
var maze = require(".maze.js")

cli.start();

function callback(cmd) {
  if (cmd.command == cli.commands.west) {
    println("Moving west!")
  } else if (cmd.command == cli.commands.south) {
    println("Moving south!")
  } else if (cmd.command == cli.commands.east) {
    println("Moving east!")
  } else if (cmd.command == cli.commands.north) {
    println("Moving north!")
  } else if (cmd.command == cli.commands.exit) {
    println("Exiting!")
    return
  } else if (cmd.command == cli.commands.load) {
    println(`Loading file ${cmd.file}!`)
  }

  cli.nextCommand(callback);
}

cli.nextCommand(callback);