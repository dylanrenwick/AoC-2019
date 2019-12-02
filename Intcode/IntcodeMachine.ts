interface MachineStats {
    opsRun: number;
    startTime: Date | null;
    stopTime: Date | null;
}

export default class IntcodeMachine {
    public debug: boolean = false;

    private memory: Array<number> = [];
    private ops: { [i: number]: (i: number) => void } = {
        1: i => this.memory[this.memory[i+3]] = this.memory[this.memory[i+1]] + this.memory[this.memory[i+2]],
        2: i => this.memory[this.memory[i+3]] = this.memory[this.memory[i+1]] * this.memory[this.memory[i+2]],
        99: i => this.running = false
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
            this.executeOp(this.ip);
            this.ip += 4;
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

    private executeOp(position) {
        this.stats.opsRun++;
        if (this.debug) console.log(`Running opcode at position ${position}\nMemory dump:`);
        if (position < 0 || position >= this.memory.length) {
            this.error("Memory access violation: " + position + " is outside the bounds of valid memory");
            return;
        }
        if (this.ops[this.memory[position]] === undefined) {
            this.error("Invalid opcode: " + this.memory[position] + " at position " + position);
            return;
        }
        this.ops[this.memory[position]](position);
    }

    private parseState(val) {
        if (typeof(val) === "string") return val.split(",").map(s => parseInt(s));
        if (Array.isArray(val)) return val.concat([]); // force array copy
    }

    private memoryDump() {
        for (let i = 0; i < this.memory.length; i += 4) {
            console.log(`${i.toString()}: ${this.memory.slice(i, i + 4).join(", ")}`);
        }
    }

    private error(message) {
        this.stats.stopTime = new Date();
        this.running = false;
        console.log(`Error: ${message}\n\nMemory dump:`);
        this.memoryDump();
    }
}
