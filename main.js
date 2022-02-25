import * as cli from "./cli.js";
import { println } from "./utils.js";
import * as maze from "./maze.js";
import * as world from "./world.js";
import * as enemies from "./enemies.js";

cli.start();

enemies.discover();
var maze = maze.load("./mazes/maze1.json");
var world = world.create(maze);

var res = cli.menu(function (cmd) {
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

if (res.start) {
  cli.ingame(function (cmd) {
    return {
      cont: true,
    };
  });
}
