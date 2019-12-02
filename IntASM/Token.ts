export class Token {
    public tokenType: TokenType;
    public tokenValue: string;

    public column: number;
    public row: number;

    public constructor(col: number, row: number, type: TokenType, value: string) {
        this.column = col;
        this.row = row;
        this.tokenType = type;
        this.tokenValue = value;
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
    Keyword
}