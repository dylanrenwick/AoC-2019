import * as readline from "readline";
import { loopWhile } from "deasync";

interface MachineStats {
    opsRun: number;
    startTime: Date | null;
    stopTime: Date | null;
}

interface Operation {
    opFunc: (m: OperationMode[], i: number) => void;
    parity: number
}

export default class IntcodeMachine {
    public debug: boolean = false;

    private memory: Array<number> = [];
    private ops: { [i: number]: Operation } = {
        // add(a, b, dest)
        1: {
            opFunc: (m, i) => this.setParam(i+3, this.getParam(m[0]||0, i+1) + this.getParam(m[1]||0, i+2)),
            parity: 4
        },
        // mul(a, b, dest)
        2: {
            opFunc: (m, i) => this.setParam(i+3, this.getParam(m[0]||0, i+1) * this.getParam(m[1]||0, i+2)),
            parity: 4
        },
        // input(dest)
        3: {
            opFunc: (m, i) => this.setParam(i+1, this.readInput()),
            parity: 2
        },
        // output(a)
        4: {
            opFunc: (m, i) => console.log(this.getParam(m[0]||0, i+1)),
            parity: 2
        },
        // jmpnz(a, b)
        5: {
            opFunc: (m, i) => this.ip = (this.getParam(m[0]||0, i+1)) ? this.getParam(m[1]||0, i+2) - 3 : this.ip,
            parity: 3
        },
        // jmpz(a, b)
        6: {
            opFunc: (m, i) => this.ip = (!this.getParam(m[0]||0, i+1)) ? this.getParam(m[1]||0, i+2) - 3 : this.ip,
            parity: 3
        },
        // le(a, b, dest)
        7: {
            opFunc: (m, i) => this.setParam(i+3, (this.getParam(m[0]||0, i+1) < this.getParam(m[1]||0, i+2)) ? 1 : 0),
            parity: 4
        },
        // eq(a, b, dest)
        8: {
            opFunc: (m, i) => this.setParam(i+3, (this.getParam(m[0]||0, i+1) === this.getParam(m[1]||0, i+2)) ? 1 : 0),
            parity: 4
        },
        // exit()
        99: {
            opFunc: (m, i) => this.running = false,
            parity: 1
        }
    };

    private running: boolean = false;

    private ip: number = 0;

    private stats: MachineStats = {
        opsRun: 0,
        startTime: null,
        stopTime: null
    };

    public run(program: Array<number> | string, inputs?: Array<number>) {
        this.memory = this.parseState(program);
        if (this.memory.length < 4) {
            this.error("Invalid memory state!");
            return;
        }

        if (inputs !== undefined) this.setInputs(this.parseState(inputs));

        this.running = true;
        this.stats.startTime = new Date();

        while (this.running) {
            let ipAdv = this.executeOp(this.ip);
            this.ip += ipAdv;
            if (this.ip >= this.memory.length) {
                this.stats.stopTime = new Date();
                this.running = false;
            }
        }

        if (this.stats.stopTime === null || this.stats.stopTime < this.stats.startTime) this.stats.stopTime = new Date();

        let result = {
            result: this.memory[0],
            opsRun: this.stats.opsRun,
            runTime: this.stats.stopTime.getTime() - this.stats.startTime.getTime()
        };

        this.resetState();

        return result;
    }

    public setInputs(inputs) {
        if (this.memory.length < 4) {
            this.error("Invalid memory state!");
            return;
        }
        this.memory[1] = inputs[0];
        this.memory[2] = inputs[1];
    }

    public resetState() {
        this.memory = [];
        this.running = false;
        this.ip = 0;
        this.stats = {
            opsRun: 0,
            startTime: null,
            stopTime: null
        };
    }

    private executeOp(position): number {
        this.stats.opsRun++;
        if (this.debug) { console.log(`Running opcode at position ${position}\nMemory dump:`); this.memoryDump(); }
        if (position < 0 || position >= this.memory.length) {
            this.error("Memory access violation: " + position + " is outside the bounds of valid memory");
            return -1;
        }

        let instructionCode = this.memory[position].toString().split("");
        let opCode = parseInt(instructionCode.slice(-2).join(""));
        let modes = instructionCode.slice(0, -2).reverse().map(d => parseInt(d) as OperationMode);

        let op: Operation = this.ops[opCode];

        if (op === undefined) {
            this.error("Invalid opcode: " + opCode + " at position " + position);
            return -1;
        }

        if (modes.length < op.parity) modes = modes.concat([...new Array(op.parity - modes.length)].map(_ => 0));

        if (this.debug) console.log(`${instructionCode.join("")}: OpCode is ${opCode} and modes are ${modes.join(",")}`);

        op.opFunc(modes, position);
        return op.parity;
    }

    private parseState(val) {
        if (typeof(val) === "string") return val.split(",").map(s => parseInt(s));
        if (Array.isArray(val)) return val.concat([]); // force array copy
    }

    private memoryDump() {
        for (let i = 0; i < this.memory.length; i += 4) {
            console.log(`0x${i.toString(16).padStart(2, '0')}: ${this.memory.slice(i, i + 4).join(", ")}`);
        }
        console.log(`IP: ${this.ip}`);
    }

    private error(message) {
        this.stats.stopTime = new Date();
        this.running = false;
        console.log(`Error: ${message}\n\nMemory dump:`);
        this.memoryDump();
    }

    private getParam(mode: OperationMode, index: number): number {
        if (this.debug) console.log(`Fetching param at index ${index} with mode ${mode}`);
        switch (mode) {
            case OperationMode.PositionMode:
                return this.memory[this.memory[index]];
            case OperationMode.ImmediateMode:
                return this.memory[index];
            default:
                return -1;
        }
    }

    private setParam(index: number, value: number): void {
        if (this.debug) console.log(`Setting param at index ${index} to ${value}`);
        this.memory[this.memory[index]] = value;
    }

    private readInput(): number {
        const rl = readline.createInterface(process.stdin);
        var done = false;
        var data: string;
        rl.question("", a => {
            data = a;
            done = true;
            rl.close();
        });
        loopWhile(() => !done);

        return parseInt(data.trim());
    }
}

enum OperationMode {
    PositionMode,
    ImmediateMode
}
