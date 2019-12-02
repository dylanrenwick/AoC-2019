import { Token, TokenType } from "./Token";

export default class Parser {
    private static code: Array<number> = [];
    private static dataVars: Array<DataVar> = [];
    private static varReferences: Array<{var: DataVar, address: number}> = [];

    private static hasData: boolean = false;
    private static dataOffset: number = 0;

    private static operators: Array<string> = [
        null, "add", "mul"
    ];

    public static Parse(tokens: Array<Token>): Array<number> {
        this.code = [];
        this.dataVars = [];

        let dataIndex: number = this.findToken(tokens, TokenType.Section, ".data");
        this.hasData = dataIndex > -1;

        if (this.hasData) {
            this.parseDataSection(tokens, dataIndex);
        }

        this.parseCodeSection(tokens, this.hasData ? dataIndex : tokens.length);

        this.resolveDataSection();

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
        for (let i = 1; i < codeTokens.length; i += 4) {
            if (codeTokens[i].tokenType === TokenType.Keyword) {
                if (codeTokens[i].tokenValue === "exit") {
                    this.code.push(99);
                    i -= 3;
                }
            } else if (codeTokens[i].tokenType === TokenType.Operation) {
                let codePos = this.code.length;
                let operator = this.operators.indexOf(codeTokens[i].tokenValue);
                if (operator === -1) throw new Error("Invalid operator: '" + codeTokens[i].tokenValue + "'");
                let first = this.parseOperand(codeTokens[i+1]);
                let second = this.parseOperand(codeTokens[i+2]);
                let dest = this.parseOperand(codeTokens[i+3]);

                if (first instanceof DataVar) {
                    this.varReferences.push({var: first, address: codePos + 1});
                    first = 0;
                }
                if (second instanceof DataVar) {
                    this.varReferences.push({var: second, address: codePos + 2});
                    second = 0;
                }
                if (dest instanceof DataVar) {
                    this.varReferences.push({var: dest, address: codePos + 3});
                    dest = 0;
                }

                this.code.push(operator, first, second, dest);
            }
        }

        this.dataOffset = this.code.length;
    }

    private static parseOperand(token: Token): number | DataVar {
        if (token.tokenType === TokenType.HexValue) return parseInt(token.tokenValue);
        if (token.tokenType === TokenType.VarLabel) {
            let foundVar = this.dataVars.filter(dv => dv.name === token.tokenValue)[0];
            if (foundVar !== undefined) return foundVar;
            throw new Error("Undefined variable '" + foundVar + "' referenced");
        }
        throw new Error("Invalid operand: '" + token.tokenValue + "'");
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
