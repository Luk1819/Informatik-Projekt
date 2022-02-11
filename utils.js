exports.print = function (value) {
  process.stdout.write(value);
};

exports.println = function (value = "") {
  print(`${value}\n`);
};

exports.lines = function (str) {
  return str.split(/[\r\n]+/);
};
