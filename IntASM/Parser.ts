import { Token, TokenType } from "./Token";
import { threadId } from "worker_threads";

export default class Parser {
    private static code: Array<number> = [];
    private static dataVars: Array<DataVar> = [];
    private static varReferences: Array<{var: DataVar, address: number}> = [];

    private static hasData: boolean = false;
    private static dataOffset: number = 0;

    private static operators: Array<string> = [
        null, "add", "mul", "inp", "prnt", "jmpnz", "jmpz", "le", "eq"
    ];
    private static opParity: Array<number> = [
        0, 3, 3, 1, 1, 2, 2, 3, 3
    ];
    private static macros: Array<string> = [
        "sub"
    ];
    private static macroParity: Array<number> = [
        3
    ];
    private static realOperator: Array<number> = [
        1
    ];
    private static macroFuncs: Array<(params: {val: number, mode: number}[], modeOp: number) => number[]> = [
        (params, modeOp) => {
            modeOp = parseInt(modeOp + "1".padStart(2, "0"));
            let intcode = [modeOp];
            if (params[0].mode === 1) params[0].val = -params[0].val;
            else if (params[1].mode === 1) params[1].val = -params[1].val;
            else {
                return [102,-1,params[0].val,params[0].val,modeOp].concat(params.map(p => p.val)).concat([102,-1,params[0].val,params[0].val]);
            }

            return intcode.concat(params.map(p => p.val));
        }
    ];

    private static currentOperator: string;

    public static Parse(tokens: Array<Token>): Array<number> {
        this.code = [];
        this.dataVars = [];

        let dataIndex: number = this.findToken(tokens, TokenType.Section, ".data");
        this.hasData = dataIndex > -1;

        if (this.hasData) {
            this.parseDataSection(tokens, dataIndex);
        }

        this.parseCodeSection(tokens, this.hasData ? dataIndex : tokens.length);

        if (this.hasData) {
            this.resolveDataSection();
        }

        return this.code;
    }

    private static findToken(tokens: Array<Token>, type: TokenType, val: string, start: number = 0): number {
        for (let i = start; i < tokens.length; i++) {
            if (tokens[i].tokenType === type && tokens[i].tokenValue === val) return i;
        }
        return -1;
    }

    private static parseCodeSection(tokens: Array<Token>, endIndex: number) {
        let codeTokens = tokens.slice(0, endIndex);
        for (let tokenIndex = 1; tokenIndex < codeTokens.length;) {
            if (codeTokens[tokenIndex].tokenType === TokenType.Keyword) {
                if (codeTokens[tokenIndex].tokenValue === "exit") {
                    this.code.push(99);
                    tokenIndex += 1;
                }
            } else if (codeTokens[tokenIndex].tokenType === TokenType.Operation) {
                let codePos = this.code.length;
                let operator = this.operators.indexOf(codeTokens[tokenIndex].tokenValue);
                console.log(`${codeTokens[tokenIndex].tokenValue} (${operator}: ${this.opParity[operator]})`);
                this.currentOperator = codeTokens[tokenIndex].tokenValue;
                if (operator === -1) throw new Error("Invalid operator: '" + codeTokens[tokenIndex].tokenValue + "'");
                let parity = this.opParity[operator];
                let operands = [...new Array(parity)]
                    .map((_, ix) => {
                        let o = this.parseOperand(codeTokens[tokenIndex+ix+1]);
                        if (o instanceof DataVar) {
                            this.varReferences.push({var: o, address: codePos + ix + 1});
                            return { val: 0, mode: 0}
                        }
                        return o;
                    });

                if (operands.filter(o => o.mode !== 0).length > 0) {
                    let modes = operands.map(o => o.mode).reverse().join("");
                    operator = parseInt(modes + operator.toString().padStart(2, "0"));
                }

                this.code.push(...[operator].concat(operands.map(o => o.val)));

                tokenIndex += parity + 1;
            } else if (codeTokens[tokenIndex].tokenType === TokenType.Macro) {
                let codePos = this.code.length;
                let operator = this.macros.indexOf(codeTokens[tokenIndex].tokenValue);
                console.log(`${codeTokens[tokenIndex].tokenValue} (${operator}: ${this.macroParity[operator]})`);
                this.currentOperator = codeTokens[tokenIndex].tokenValue;
                if (operator === -1) throw new Error("Invalid operator: '" + codeTokens[tokenIndex].tokenValue + "'");
                let parity = this.macroParity[operator];
                let operands = [...new Array(parity)]
                    .map((_, ix) => {
                        let o = this.parseOperand(codeTokens[tokenIndex+ix+1]);
                        if (o instanceof DataVar) {
                            this.varReferences.push({var: o, address: codePos + ix + 1});
                            return { val: 0, mode: 0}
                        }
                        return o;
                    });

                let macroFunc = this.macroFuncs[operator];

                if (operands.filter(o => o.mode !== 0).length > 0) {
                    let modes = operands.map(o => o.mode).reverse().join("");
                    operator = parseInt(modes);
                }

                let macroCode = macroFunc(operands, operator);
                this.code.push(...macroCode);
                
                tokenIndex += macroCode.length;
            } else {
                throw new Error("Expected operator but got " + codeTokens[tokenIndex].tokenType);
            }
        }

        this.dataOffset = this.code.length;
    }

    private static parseOperand(token: Token): { val: number, mode: number } | DataVar {
        if (token.tokenType === TokenType.HexValue) {
            return {
                val: parseInt(token.tokenValue),
                mode: token.mode
            };
        }
        if (token.tokenType === TokenType.VarLabel) {
            let foundVar = this.dataVars.filter(dv => dv.name === token.tokenValue)[0];
            if (foundVar !== undefined) return foundVar;
            throw new Error("Undefined variable '" + foundVar + "' referenced");
        }
        throw new Error("Invalid operand: '" + token.tokenValue + "' at {row: " + token.row + ", col: " + token.column + "} while parsing operator " + this.currentOperator);
    }

    private static parseDataSection(tokens: Array<Token>, dataIndex: number) {
        let dataTokens = tokens.slice(dataIndex);
        for (let i = 1; i < dataTokens.length; i += 2) {
            this.dataVars.push(this.parseDataVar(dataTokens, i));
        }
    }

    private static parseDataVar(tokens: Array<Token>, index: number): DataVar {
        let label: Token = tokens[index];
        let value: Token = tokens[index + 1];

        if (label.tokenType !== TokenType.VarLabel) throw new Error("Expected VarLabel but found: '" + label.tokenValue + "'");
        if (value.tokenType !== TokenType.HexValue) throw new Error("Expected HexValue but found: '" + value.tokenValue + "'");

        return new DataVar(label.tokenValue, parseInt(value.tokenValue), this.dataVars.length);
    }

    private static resolveDataSection() {
        for (let i = 0; i < this.varReferences.length; i++) {
            let ref = this.varReferences[i];
            let address = ref.var.address + this.dataOffset;
            console.log(`Resolving ${ref.var.name} at ${ref.address}. Var address is ${address}. Replacing ${this.code[ref.address]}`);
            this.code[ref.address] = address;
        }

        for (let i = 0; i < this.dataVars.length; i++) {
            let ref = this.dataVars[i];
            this.code[ref.address + this.dataOffset] = ref.value;
        }
    }
}

class DataVar {
    public name: string;
    public value: number;
    public address: number;

    public constructor(name: string, value: number, address: number | string) {
        if (typeof(address) === "string") address = parseInt(address);
        this.name = name;
        this.value = value;
        this.address = address;
    }
}
