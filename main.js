import * as cli from "./cli.js";
import { println } from "./utils.js";
import * as maze from "./maze.js";
import * as world from "./world.js";
import * as enemies from "./enemies.js";

cli.start();

await enemies.discover();
var currMaze = maze.load("./mazes/maze1.json");
var currWorld = world.create(currMaze);

console.log(currWorld)

var res = await cli.menu(function (cmd) {
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
    println(`Loading file ${cmd.file}...`);
    currMaze = maze.load(`./mazes/${cmd.file}.json`);
    currWorld = world.create(currMaze);
    println(`Loaded file ${cmd.file}!`);
  }

  return {
    cont: true,
  };
});

console.log(res)

if (res.start) {
  await cli.ingame(function (cmd) {
    return {
      cont: true,
    };
  });
}
