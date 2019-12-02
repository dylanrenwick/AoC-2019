import { Token, TokenType } from "./Token";

export default class Tokenizer {
    private static sections: Array<string> = [
        ".code", ".data"
    ];
    private static operators: Array<string> = [
        "add", "mul"
    ];
    private static keywords: Array<string> = [
        "exit"
    ];

    public static Tokenize(code: string): Array<Token> {
        let tokens: Array<Token> = [];

        let curToken: string = "";

        let line = 1;
        let col = 1;

        let newline = false;

        for (let i = 0; i < code.length; i++) {
            let char = code[i];

            if (newline) {
                col = 1;
                line++;
                newline = false;
            }
            if (char === "\n" || char === " ") {
                if (!/^[ \t\n]*$/.test(curToken)) tokens.push(this.tokenFromString(curToken, col, line));
                curToken = "";
                newline = (char === "\n");
                col++;
                continue;
            }

            col++;
            curToken += char;
        }

        if (!/^[ \t\n]*$/.test(curToken)) tokens.push(this.tokenFromString(curToken, col, line));

        return tokens;
    }

    private static tokenFromString(str: string, col: number, row: number): Token {
        if (this.sections.includes(str)) return new Token(col, row, TokenType.Section, str);
        if (this.operators.includes(str)) return new Token(col, row, TokenType.Operation, str);
        if (this.keywords.includes(str)) return new Token(col, row, TokenType.Keyword, str);
        if (/(^0x[0-9a-f]+$|^[0-9]+$)/.test(str)) return new Token(col, row, TokenType.HexValue, str);
        if (/^[a-zA-Z_]+$/.test(str)) return new Token(col, row, TokenType.VarLabel, str);
        throw new Error("Invalid token: '" + str + "'");
    }
}