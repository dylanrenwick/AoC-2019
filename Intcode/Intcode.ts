import IntcodeMachine from "./IntcodeMachine";
import { readFileSync } from "fs";

const cpu = new IntcodeMachine();

// read program
if (process.argv[2] === undefined) throw new Error("No file specified");
let code: Array<number> = readFileSync(process.argv[2]).toString("utf8").split(",").map(s => parseInt(s.trim()));

// non-inputs
let inputs: Array<number> = [code[1], code[2]];
// actual inputs if provided
if (process.argv[3] !== undefined && process.argv[4] !== undefined) {
    inputs = [parseInt(process.argv[3]), parseInt(process.argv[4])];
}

// execute and print result
console.log(cpu.run(code, inputs));
