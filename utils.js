import path from "path";
import { fileURLToPath } from "url";
import { stdout } from "process";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);


export function print(value) {
    stdout.write(value);
}

export function println(value = "") {
    print(`${value}\n`);
}

export function lines(str) {
    return str.split(/[\r\n]+/);
}
