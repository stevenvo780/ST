import { ProtocolRequest, ProtocolResponse } from '../types';
export declare class ProtocolHandler {
    private interpreter;
    constructor();
    handle(request: ProtocolRequest): ProtocolResponse;
    private handleParse;
    private handleCheck;
    private handleRun;
    private handleHover;
    private handleSymbols;
    private handleGotoDefinition;
    private handleCompletion;
    private handleRender;
    private getStatementHoverInfo;
    private renderOutput;
}
//# sourceMappingURL=handler.d.ts.map