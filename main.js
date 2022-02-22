import * as cli from "./cli.js";
import { println } from "./utils.js";
import * as maze from "./maze.js";

cli.start();

cli.nextCommand(function (cmd) {
  if (cmd.command == cli.commands.start) {
    println("Starting!");
    return {
      cont: false,
      start: true,
    };
  } else if (cmd.command == cli.commands.exit) {
    println("Exiting!");
    return {
      cont: false,
      start: false,
    };
  } else if (cmd.command == cli.commands.load) {
    println(`Loading file ${cmd.file}!`);
  }

  return {
    cont: true,
  };
});
