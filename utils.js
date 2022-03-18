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

export function rotate(value, min, max) {
    if (value < min) {
        return rotate(max + (value - min), min, max);
    } else if (value > max) {
        return rotate(min + (value - max), min, max);
    } else {
        return value;
    }
}
