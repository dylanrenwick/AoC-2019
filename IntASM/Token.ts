export class Token {
    public tokenType: TokenType;
    public tokenValue: string;

    public column: number;
    public row: number;
    public mode: number = -1;

    public constructor(col: number, row: number, type: TokenType, value: string) {
        this.column = col;
        this.row = row;
        this.tokenType = type;
        if (type === TokenType.HexValue) {
            if (value.startsWith("*")) {
                this.tokenValue = value.substring(1);
                this.mode = 0;
            } else {
                this.tokenValue = value;
                this.mode = 1;
            }
        } else {
            this.tokenValue = value;
        }
    }

    public toString(): string {
        return this.tokenValue;
    }
}

export enum TokenType {
    Section,
    Operation,
    HexValue,
    VarLabel,
    Keyword,
    Macro
}