import path from 'path';
import { fileURLToPath } from 'url';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);


export function print(value) {
  process.stdout.write(value);
};

export function println(value = "") {
  print(`${value}\n`);
};

export function lines(str) {
  return str.split(/[\r\n]+/);
};
