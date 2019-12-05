import { option, parse } from "args";
import { readFileSync, writeFileSync, readFile } from "fs";
import IntASM from "./IntASM";

option("input-file", "The source file from which to read code");
option("output-file", "The file to write compiled ASM to", "out.int");

const args = parse(process.argv);

const sourceFile = args.i;
const outFile = args.o;

const fileBuffer: Buffer = readFileSync(sourceFile);

const code: string = fileBuffer.toString("utf8");
const asm: string = IntASM.Compile(code);

writeFileSync(outFile, asm);
console.log("-===================================================-");
console.log("Compilation successful! Compiled intcode written to '" + outFile + "'");
