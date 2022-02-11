exports.print = function (value) {
  process.stdout.write(value);
};

exports.println = function (value = "") {
  print(`${value}\n`);
};
