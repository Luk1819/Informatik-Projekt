import * as cli from "./cli.js";
import { println } from "./utils.js";
import * as maze from "./maze.js";

cli.start();

cli.nextCommand(function (cmd) {
  if (cmd.command == cli.commands.west) {
    println("Moving west!");
  } else if (cmd.command == cli.commands.south) {
    println("Moving south!");
  } else if (cmd.command == cli.commands.east) {
    println("Moving east!");
  } else if (cmd.command == cli.commands.north) {
    println("Moving north!");
  } else if (cmd.command == cli.commands.exit) {
    println("Exiting!");
    return false;
  } else if (cmd.command == cli.commands.load) {
    println(`Loading file ${cmd.file}!`);
  }

  return true;
});
