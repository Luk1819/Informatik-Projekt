function print(value) {
  process.stdout.write(value);
};

function println(value = "") {
  print(`${value}\n`);
};

function lines(str) {
  return str.split(/[\r\n]+/);
};


export { print, println, lines }
