"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = __importStar(require("path"));
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
const outputChannel = vscode_1.window.createOutputChannel('ST Language', 'markdown');
let statusBarItem;
const PROFILES = [
    { label: 'classical.propositional', description: 'Classical propositional logic' },
    { label: 'classical.first_order', description: 'Classical first-order logic (FOL)' },
    { label: 'modal.k', description: 'Modal logic K' },
    { label: 'modal.s4', description: 'Modal logic S4' },
    { label: 'modal.s5', description: 'Modal logic S5' },
    { label: 'intuitionistic.propositional', description: 'Intuitionistic propositional logic' },
    { label: 'paraconsistent.belnap', description: 'Belnap 4-valued paraconsistent logic' },
    { label: 'deontic.standard', description: 'Deontic standard logic' },
    { label: 'epistemic.s5', description: 'Epistemic logic S5' },
    { label: 'temporal.ltl', description: 'Linear temporal logic (LTL)' },
    { label: 'arithmetic', description: 'Arithmetic' },
];
async function activate(context) {
    const serverModule = context.asAbsolutePath(path.join('out', 'server.js'));
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
            options: debugOptions,
        },
    };
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'st' }],
        synchronize: {
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/*.st'),
        },
    };
    client = new node_1.LanguageClient('stLanguageServer', 'ST Language Server', serverOptions, clientOptions);
    await client.start();
    // ── Status bar: active logical profile ────────────────────
    statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'st.switchProfile';
    statusBarItem.tooltip = 'Active ST logical profile — click to switch';
    context.subscriptions.push(statusBarItem);
    context.subscriptions.push(vscode_1.window.onDidChangeActiveTextEditor(updateStatusBar), vscode_1.workspace.onDidChangeTextDocument((e) => {
        if (vscode_1.window.activeTextEditor && e.document === vscode_1.window.activeTextEditor.document) {
            updateStatusBar(vscode_1.window.activeTextEditor);
        }
    }));
    updateStatusBar(vscode_1.window.activeTextEditor);
    // ── Command: st.check ─────────────────────────────────────
    context.subscriptions.push(vscode_1.commands.registerCommand('st.check', async () => {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'st') {
            vscode_1.window.showWarningMessage('Open a .st file to check a formula');
            return;
        }
        const formula = await vscode_1.window.showInputBox({
            prompt: 'Formula to check (e.g. P -> P)',
            placeHolder: 'P -> Q',
            value: editor.selection.isEmpty
                ? ''
                : editor.document.getText(editor.selection),
        });
        if (!formula)
            return;
        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine(`Checking: ${formula}\n`);
        const source = editor.document.getText();
        const profileMatch = source.match(/^(?:logic|logica)\s+([a-zA-Z_.]+)/m);
        const profile = profileMatch ? profileMatch[1] : 'classical.propositional';
        try {
            const resp = await client.sendRequest('st/run', {
                source: `logic ${profile}\n\ncheck valid ${formula}`,
                file: editor.document.uri.toString(),
            });
            if (resp.result) {
                outputChannel.appendLine(JSON.stringify(resp.result, null, 2));
            }
            if (resp.diagnostics && resp.diagnostics.length > 0) {
                outputChannel.appendLine('\n--- Diagnostics ---');
                for (const d of resp.diagnostics) {
                    const icon = d.severity === 'error' ? 'ERR' : d.severity === 'warning' ? 'WARN' : 'INFO';
                    outputChannel.appendLine(`[${icon}] ${d.message}`);
                }
            }
        }
        catch (e) {
            outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
    }));
    // ── Command: st.derive ────────────────────────────────────
    context.subscriptions.push(vscode_1.commands.registerCommand('st.derive', async () => {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'st') {
            vscode_1.window.showWarningMessage('Open a .st file to try a derivation');
            return;
        }
        const conclusion = await vscode_1.window.showInputBox({
            prompt: 'Conclusion to derive (e.g. Q)',
            placeHolder: 'Q',
        });
        if (!conclusion)
            return;
        const premises = await vscode_1.window.showInputBox({
            prompt: 'Premises (comma-separated names defined in the file)',
            placeHolder: 'ax1, ax2',
        });
        if (!premises)
            return;
        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine(`Deriving: ${conclusion} from {${premises}}\n`);
        const source = editor.document.getText();
        try {
            const resp = await client.sendRequest('st/run', {
                source: `${source}\n\nderive ${conclusion} from {${premises}}`,
                file: editor.document.uri.toString(),
            });
            if (resp.result) {
                outputChannel.appendLine(JSON.stringify(resp.result, null, 2));
            }
            if (resp.diagnostics && resp.diagnostics.length > 0) {
                outputChannel.appendLine('\n--- Diagnostics ---');
                for (const d of resp.diagnostics) {
                    outputChannel.appendLine(`[${d.severity.toUpperCase()}] ${d.message}`);
                }
            }
        }
        catch (e) {
            outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
    }));
    // ── Command: st.countermodel ──────────────────────────────
    context.subscriptions.push(vscode_1.commands.registerCommand('st.countermodel', async () => {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'st') {
            vscode_1.window.showWarningMessage('Open a .st file to find a countermodel');
            return;
        }
        const formula = await vscode_1.window.showInputBox({
            prompt: 'Formula to find a countermodel for',
            placeHolder: 'P -> Q',
            value: editor.selection.isEmpty
                ? ''
                : editor.document.getText(editor.selection),
        });
        if (!formula)
            return;
        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine(`Countermodel for: ${formula}\n`);
        const source = editor.document.getText();
        const profileMatch = source.match(/^(?:logic|logica)\s+([a-zA-Z_.]+)/m);
        const profile = profileMatch ? profileMatch[1] : 'classical.propositional';
        try {
            const resp = await client.sendRequest('st/run', {
                source: `logic ${profile}\n\ncountermodel ${formula}`,
                file: editor.document.uri.toString(),
            });
            if (resp.result) {
                outputChannel.appendLine(JSON.stringify(resp.result, null, 2));
            }
            if (resp.diagnostics && resp.diagnostics.length > 0) {
                outputChannel.appendLine('\n--- Diagnostics ---');
                for (const d of resp.diagnostics) {
                    outputChannel.appendLine(`[${d.severity.toUpperCase()}] ${d.message}`);
                }
            }
        }
        catch (e) {
            outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
    }));
    // ── Command: st.switchProfile ─────────────────────────────
    context.subscriptions.push(vscode_1.commands.registerCommand('st.switchProfile', async () => {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'st') {
            vscode_1.window.showWarningMessage('Open a .st file to switch the logical profile');
            return;
        }
        const current = detectProfile(editor.document);
        const pick = await vscode_1.window.showQuickPick(PROFILES.map((p) => ({
            ...p,
            picked: p.label === current,
        })), { placeHolder: current ? `Current: ${current}` : 'Select a logical profile' });
        if (!pick)
            return;
        const newProfile = pick.label;
        const text = editor.document.getText();
        const edit = new (await import('vscode')).WorkspaceEdit();
        const docUri = editor.document.uri;
        const existingMatch = text.match(/^(?:logic|logica)\s+[a-zA-Z_.]+/m);
        if (existingMatch && existingMatch.index !== undefined) {
            const start = editor.document.positionAt(existingMatch.index);
            const end = editor.document.positionAt(existingMatch.index + existingMatch[0].length);
            edit.replace(docUri, new (await import('vscode')).Range(start, end), `logic ${newProfile}`);
        }
        else {
            const firstLine = editor.document.lineAt(0);
            const insertPos = firstLine.range.start;
            edit.insert(docUri, insertPos, `logic ${newProfile}\n\n`);
        }
        await vscode_1.workspace.applyEdit(edit);
        updateStatusBar(editor);
        vscode_1.window.showInformationMessage(`ST profile switched to: ${newProfile}`);
    }));
    // ── Command: st.runFile ───────────────────────────────────
    context.subscriptions.push(vscode_1.commands.registerCommand('st.runFile', async () => {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'st') {
            vscode_1.window.showWarningMessage('Open a .st file to run it');
            return;
        }
        const source = editor.document.getText();
        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine('Running ST...\n');
        try {
            const resp = await client.sendRequest('st/run', {
                source,
                file: editor.document.uri.toString(),
            });
            if (resp.result?.output && resp.result.output.length > 0) {
                for (const item of resp.result.output) {
                    outputChannel.appendLine(item.content ?? JSON.stringify(item));
                }
            }
            else {
                outputChannel.appendLine('Run completed with no output.');
            }
            if (resp.diagnostics && resp.diagnostics.length > 0) {
                outputChannel.appendLine('\n--- Diagnostics ---');
                for (const d of resp.diagnostics) {
                    if (d.severity === 'info')
                        continue;
                    const loc = d.line ? ` (L${d.line})` : '';
                    outputChannel.appendLine(`[${d.severity.toUpperCase()}]${loc} ${d.message}`);
                }
            }
        }
        catch (e) {
            outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
    }));
    // ── Command: st.runSelection ──────────────────────────────
    context.subscriptions.push(vscode_1.commands.registerCommand('st.runSelection', async () => {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            vscode_1.window.showWarningMessage('No active editor');
            return;
        }
        const selection = editor.selection;
        const source = selection.isEmpty
            ? editor.document.lineAt(selection.active.line).text
            : editor.document.getText(selection);
        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine('Running ST selection...\n');
        try {
            const resp = await client.sendRequest('st/run', {
                source,
                file: editor.document.uri.toString(),
            });
            if (resp.result?.output && resp.result.output.length > 0) {
                for (const item of resp.result.output) {
                    outputChannel.appendLine(item.content ?? JSON.stringify(item));
                }
            }
            else {
                outputChannel.appendLine('Run completed with no output.');
            }
        }
        catch (e) {
            outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
    }));
    // ── Command: st.render ────────────────────────────────────
    context.subscriptions.push(vscode_1.commands.registerCommand('st.render', async () => {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'st') {
            vscode_1.window.showWarningMessage('Open a .st file to render it');
            return;
        }
        outputChannel.clear();
        outputChannel.show(true);
        try {
            const resp = await client.sendRequest('st/render', {
                source: editor.document.getText(),
                file: editor.document.uri.toString(),
                format: 'markdown',
            });
            if (resp.result?.rendered) {
                outputChannel.appendLine(resp.result.rendered);
            }
            else {
                outputChannel.appendLine(JSON.stringify(resp.result, null, 2));
            }
        }
        catch (e) {
            outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
    }));
}
function updateStatusBar(editor) {
    if (!editor || editor.document.languageId !== 'st') {
        statusBarItem.hide();
        return;
    }
    const profile = detectProfile(editor.document);
    statusBarItem.text = profile ? `$(symbol-misc) ST: ${profile}` : '$(warning) ST: no profile';
    statusBarItem.show();
}
function detectProfile(doc) {
    if (!doc)
        return null;
    const match = doc.getText().match(/^(?:logic|logica)\s+([a-zA-Z_.]+)/m);
    return match ? (match[1] ?? null) : null;
}
function deactivate() {
    statusBarItem?.dispose();
    outputChannel?.dispose();
    return client?.stop();
}
//# sourceMappingURL=extension.js.map