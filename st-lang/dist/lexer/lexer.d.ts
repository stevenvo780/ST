import { Token } from './tokens';
import { Diagnostic } from '../types';
export declare class Lexer {
    private source;
    private tokens;
    private pos;
    private line;
    private column;
    private file;
    diagnostics: Diagnostic[];
    constructor(source: string, file?: string);
    tokenize(): Token[];
    private addToken;
    private advance;
    private peek;
    private skipWhitespace;
    private isDigit;
    private isAlpha;
    private isAlphaNum;
    private readLineComment;
    private readString;
    private readNumber;
    private readIdentifier;
}
//# sourceMappingURL=lexer.d.ts.map