import * as path from 'path';
import {
  workspace,
  ExtensionContext,
  commands,
  window,
  StatusBarAlignment,
  StatusBarItem,
  TextDocument,
  QuickPickItem,
} from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;
const outputChannel = window.createOutputChannel('ST Language', 'markdown');
let statusBarItem: StatusBarItem;

const PROFILES: QuickPickItem[] = [
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

export async function activate(context: ExtensionContext): Promise<void> {
  const serverModule = context.asAbsolutePath(path.join('out', 'server.js'));
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'st' }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/*.st'),
    },
  };

  client = new LanguageClient(
    'stLanguageServer',
    'ST Language Server',
    serverOptions,
    clientOptions,
  );
  await client.start();

  // ── Status bar: active logical profile ────────────────────
  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  statusBarItem.command = 'st.switchProfile';
  statusBarItem.tooltip = 'Active ST logical profile — click to switch';
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    window.onDidChangeActiveTextEditor(updateStatusBar),
    workspace.onDidChangeTextDocument((e) => {
      if (window.activeTextEditor && e.document === window.activeTextEditor.document) {
        updateStatusBar(window.activeTextEditor);
      }
    }),
  );
  updateStatusBar(window.activeTextEditor);

  // ── Command: st.check ─────────────────────────────────────
  context.subscriptions.push(
    commands.registerCommand('st.check', async () => {
      const editor = window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'st') {
        window.showWarningMessage('Open a .st file to check a formula');
        return;
      }

      const formula = await window.showInputBox({
        prompt: 'Formula to check (e.g. P -> P)',
        placeHolder: 'P -> Q',
        value: editor.selection.isEmpty
          ? ''
          : editor.document.getText(editor.selection),
      });
      if (!formula) return;

      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine(`Checking: ${formula}\n`);

      const source = editor.document.getText();
      const profileMatch = source.match(/^(?:logic|logica)\s+([a-zA-Z_.]+)/m);
      const profile = profileMatch ? profileMatch[1] : 'classical.propositional';

      try {
        interface CheckResp {
          result?: { valid?: boolean; satisfiable?: boolean; message?: string };
          diagnostics?: Array<{ severity: string; line?: number; message: string }>;
        }
        const resp = await client.sendRequest<CheckResp>('st/run', {
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
      } catch (e: unknown) {
        outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }),
  );

  // ── Command: st.derive ────────────────────────────────────
  context.subscriptions.push(
    commands.registerCommand('st.derive', async () => {
      const editor = window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'st') {
        window.showWarningMessage('Open a .st file to try a derivation');
        return;
      }

      const conclusion = await window.showInputBox({
        prompt: 'Conclusion to derive (e.g. Q)',
        placeHolder: 'Q',
      });
      if (!conclusion) return;

      const premises = await window.showInputBox({
        prompt: 'Premises (comma-separated names defined in the file)',
        placeHolder: 'ax1, ax2',
      });
      if (!premises) return;

      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine(`Deriving: ${conclusion} from {${premises}}\n`);

      const source = editor.document.getText();

      try {
        interface DeriveResp {
          result?: unknown;
          diagnostics?: Array<{ severity: string; message: string }>;
        }
        const resp = await client.sendRequest<DeriveResp>('st/run', {
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
      } catch (e: unknown) {
        outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }),
  );

  // ── Command: st.countermodel ──────────────────────────────
  context.subscriptions.push(
    commands.registerCommand('st.countermodel', async () => {
      const editor = window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'st') {
        window.showWarningMessage('Open a .st file to find a countermodel');
        return;
      }

      const formula = await window.showInputBox({
        prompt: 'Formula to find a countermodel for',
        placeHolder: 'P -> Q',
        value: editor.selection.isEmpty
          ? ''
          : editor.document.getText(editor.selection),
      });
      if (!formula) return;

      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine(`Countermodel for: ${formula}\n`);

      const source = editor.document.getText();
      const profileMatch = source.match(/^(?:logic|logica)\s+([a-zA-Z_.]+)/m);
      const profile = profileMatch ? profileMatch[1] : 'classical.propositional';

      try {
        interface CounterResp {
          result?: unknown;
          diagnostics?: Array<{ severity: string; message: string }>;
        }
        const resp = await client.sendRequest<CounterResp>('st/run', {
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
      } catch (e: unknown) {
        outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }),
  );

  // ── Command: st.switchProfile ─────────────────────────────
  context.subscriptions.push(
    commands.registerCommand('st.switchProfile', async () => {
      const editor = window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'st') {
        window.showWarningMessage('Open a .st file to switch the logical profile');
        return;
      }

      const current = detectProfile(editor.document);
      const pick = await window.showQuickPick(
        PROFILES.map((p) => ({
          ...p,
          picked: p.label === current,
        })),
        { placeHolder: current ? `Current: ${current}` : 'Select a logical profile' },
      );
      if (!pick) return;

      const newProfile = pick.label;
      const text = editor.document.getText();

      const edit = new (await import('vscode')).WorkspaceEdit();
      const docUri = editor.document.uri;

      const existingMatch = text.match(/^(?:logic|logica)\s+[a-zA-Z_.]+/m);
      if (existingMatch && existingMatch.index !== undefined) {
        const start = editor.document.positionAt(existingMatch.index);
        const end = editor.document.positionAt(existingMatch.index + existingMatch[0].length);
        edit.replace(docUri, new (await import('vscode')).Range(start, end), `logic ${newProfile}`);
      } else {
        const firstLine = editor.document.lineAt(0);
        const insertPos = firstLine.range.start;
        edit.insert(docUri, insertPos, `logic ${newProfile}\n\n`);
      }

      await workspace.applyEdit(edit);
      updateStatusBar(editor);
      window.showInformationMessage(`ST profile switched to: ${newProfile}`);
    }),
  );

  // ── Command: st.runFile ───────────────────────────────────
  context.subscriptions.push(
    commands.registerCommand('st.runFile', async () => {
      const editor = window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'st') {
        window.showWarningMessage('Open a .st file to run it');
        return;
      }

      const source = editor.document.getText();
      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine('Running ST...\n');

      try {
        interface RunResp {
          result?: { output?: Array<{ type: string; content: string }> };
          diagnostics?: Array<{ severity: string; line?: number; message: string }>;
        }
        const resp = await client.sendRequest<RunResp>('st/run', {
          source,
          file: editor.document.uri.toString(),
        });

        if (resp.result?.output && resp.result.output.length > 0) {
          for (const item of resp.result.output) {
            outputChannel.appendLine(item.content ?? JSON.stringify(item));
          }
        } else {
          outputChannel.appendLine('Run completed with no output.');
        }

        if (resp.diagnostics && resp.diagnostics.length > 0) {
          outputChannel.appendLine('\n--- Diagnostics ---');
          for (const d of resp.diagnostics) {
            if (d.severity === 'info') continue;
            const loc = d.line ? ` (L${d.line})` : '';
            outputChannel.appendLine(`[${d.severity.toUpperCase()}]${loc} ${d.message}`);
          }
        }
      } catch (e: unknown) {
        outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }),
  );

  // ── Command: st.runSelection ──────────────────────────────
  context.subscriptions.push(
    commands.registerCommand('st.runSelection', async () => {
      const editor = window.activeTextEditor;
      if (!editor) {
        window.showWarningMessage('No active editor');
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
        interface RunSelResp {
          result?: { output?: Array<{ type: string; content: string }> };
        }
        const resp = await client.sendRequest<RunSelResp>('st/run', {
          source,
          file: editor.document.uri.toString(),
        });

        if (resp.result?.output && resp.result.output.length > 0) {
          for (const item of resp.result.output) {
            outputChannel.appendLine(item.content ?? JSON.stringify(item));
          }
        } else {
          outputChannel.appendLine('Run completed with no output.');
        }
      } catch (e: unknown) {
        outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }),
  );

  // ── Command: st.render ────────────────────────────────────
  context.subscriptions.push(
    commands.registerCommand('st.render', async () => {
      const editor = window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'st') {
        window.showWarningMessage('Open a .st file to render it');
        return;
      }

      outputChannel.clear();
      outputChannel.show(true);

      try {
        interface RenderResp {
          result?: { rendered?: string };
        }
        const resp = await client.sendRequest<RenderResp>('st/render', {
          source: editor.document.getText(),
          file: editor.document.uri.toString(),
          format: 'markdown',
        });

        if (resp.result?.rendered) {
          outputChannel.appendLine(resp.result.rendered);
        } else {
          outputChannel.appendLine(JSON.stringify(resp.result, null, 2));
        }
      } catch (e: unknown) {
        outputChannel.appendLine(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }),
  );
}

function updateStatusBar(editor: typeof window.activeTextEditor): void {
  if (!editor || editor.document.languageId !== 'st') {
    statusBarItem.hide();
    return;
  }
  const profile = detectProfile(editor.document);
  statusBarItem.text = profile ? `$(symbol-misc) ST: ${profile}` : '$(warning) ST: no profile';
  statusBarItem.show();
}

function detectProfile(doc: TextDocument | undefined): string | null {
  if (!doc) return null;
  const match = doc.getText().match(/^(?:logic|logica)\s+([a-zA-Z_.]+)/m);
  return match ? (match[1] ?? null) : null;
}

export function deactivate(): Thenable<void> | undefined {
  statusBarItem?.dispose();
  outputChannel?.dispose();
  return client?.stop();
}
