export function print(value) {
  process.stdout.write(value);
};

export function println(value = "") {
  print(`${value}\n`);
};

export function lines(str) {
  return str.split(/[\r\n]+/);
};
