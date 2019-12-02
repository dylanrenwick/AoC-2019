import Parser from "./Parser";
import { Token } from "./Token";
import Tokenizer from "./Tokenizer";

export default class IntASM {
    public static Compile(code: string): string {
        const tokens: Array<Token> = Tokenizer.Tokenize(code);
        return Parser.Parse(tokens).join(",");
    }
}