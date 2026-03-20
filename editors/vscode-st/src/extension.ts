import * as path from 'path';
import {
  workspace,
  ExtensionContext,
  commands,
  window,
  StatusBarAlignment,
  StatusBarItem,
  TextDocument,
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

export async function activate(context: ExtensionContext): Promise<void> {
  const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));
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

  // ── Status Bar: perfil lógico activo ───────────────────────
  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  statusBarItem.command = 'st.showProfile';
  statusBarItem.tooltip = 'Perfil lógico activo en ST';
  context.subscriptions.push(statusBarItem);

  // Actualizar status bar al cambiar de archivo
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor(updateStatusBar),
    workspace.onDidChangeTextDocument((e) => {
      if (window.activeTextEditor && e.document === window.activeTextEditor.document) {
        updateStatusBar(window.activeTextEditor);
      }
    }),
  );
  updateStatusBar(window.activeTextEditor);

  // ── Command: Run ST File ───────────────────────────────────
  context.subscriptions.push(
    commands.registerCommand('st.runFile', async () => {
      const editor = window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'st') {
        window.showWarningMessage('Abre un archivo .st para ejecutarlo');
        return;
      }

      const source = editor.document.getText();
      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine('⏳ Ejecutando ST...\n');

      try {
        interface STRunResponse {
          result?: {
            output?: Array<{ type: string; content: string }>;
          };
          diagnostics?: Array<{ severity: string; line?: number; message: string }>;
        }
        const resp = await client.sendRequest('st/run', {
          source,
          file: editor.document.uri.toString(),
        });

        if (resp.result) {
          const output = resp.result;
          if (output.output && output.output.length > 0) {
            for (const item of output.output) {
              if (item.type === 'error') {
                outputChannel.appendLine(`❌ ${item.content}`);
              } else if (item.type === 'warning') {
                outputChannel.appendLine(`⚠️ ${item.content}`);
              } else {
                outputChannel.appendLine(item.content);
              }
            }
          } else {
            outputChannel.appendLine('✅ Ejecución completada sin salida.');
          }
        }

        if (resp.diagnostics && resp.diagnostics.length > 0) {
          outputChannel.appendLine('\n---\n**Diagnósticos:**');
          for (const d of resp.diagnostics) {
            const icon = d.severity === 'error' ? '❌' : d.severity === 'warning' ? '⚠️' : 'ℹ️';
            const loc = d.line ? ` (L${d.line})` : '';
            outputChannel.appendLine(`${icon}${loc} ${d.message}`);
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        outputChannel.appendLine(`❌ Error: ${msg}`);
      }
    }),
  );

  // ── Command: Run ST Selection ──────────────────────────────
  context.subscriptions.push(
    commands.registerCommand('st.runSelection', async () => {
      const editor = window.activeTextEditor;
      if (!editor) {
        window.showWarningMessage('No hay editor activo');
        return;
      }

      const selection = editor.selection;
      const source = selection.isEmpty
        ? editor.document.lineAt(selection.active.line).text
        : editor.document.getText(selection);

      outputChannel.clear();
      outputChannel.show(true);
      outputChannel.appendLine('⏳ Ejecutando selección ST...\n');

      try {
        interface STRunSelResponse {
          result?: {
            output?: Array<{ type: string; content: string }>;
          };
        }
        const resp = await client.sendRequest('st/run', {
          source,
          file: editor.document.uri.toString(),
        });

        if (resp.result) {
          const output = resp.result;
          if (output.output && output.output.length > 0) {
            for (const item of output.output) {
              outputChannel.appendLine(item.content || JSON.stringify(item));
            }
          } else {
            outputChannel.appendLine('✅ Ejecución completada sin salida.');
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        outputChannel.appendLine(`❌ Error: ${msg}`);
      }
    }),
  );

  // ── Command: Render ST to Markdown ─────────────────────────
  context.subscriptions.push(
    commands.registerCommand('st.render', async () => {
      const editor = window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'st') {
        window.showWarningMessage('Abre un archivo .st para renderizarlo');
        return;
      }

      const source = editor.document.getText();
      outputChannel.clear();
      outputChannel.show(true);

      try {
        interface STRenderResponse {
          result?: { rendered?: string };
        }
        const resp = await client.sendRequest('st/render', {
          source,
          file: editor.document.uri.toString(),
          format: 'markdown',
        });

        if (resp.result) {
          outputChannel.appendLine(resp.result.rendered || JSON.stringify(resp.result, null, 2));
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        outputChannel.appendLine(`❌ Error: ${msg}`);
      }
    }),
  );

  // ── Command: Show Profile ──────────────────────────────────
  context.subscriptions.push(
    commands.registerCommand('st.showProfile', () => {
      const profile = detectProfile(window.activeTextEditor?.document);
      if (profile) {
        window.showInformationMessage(`Perfil lógico activo: ${profile}`);
      } else {
        window.showInformationMessage(
          'No se detectó un perfil lógico (falta "logic ..." al inicio)',
        );
      }
    }),
  );
}

function updateStatusBar(editor: typeof window.activeTextEditor) {
  if (!editor || editor.document.languageId !== 'st') {
    statusBarItem.hide();
    return;
  }

  const profile = detectProfile(editor.document);
  if (profile) {
    statusBarItem.text = `$(symbol-misc) ST: ${profile}`;
    statusBarItem.show();
  } else {
    statusBarItem.text = '$(warning) ST: sin perfil';
    statusBarItem.show();
  }
}

function detectProfile(doc: TextDocument | undefined): string | null {
  if (!doc) return null;
  const text = doc.getText();
  // Buscar "logic <profile>" o "logica <profile>" en las primeras líneas
  const match = text.match(/^(?:logic|logica)\s+([a-zA-Z_.]+)/m);
  return match ? match[1] : null;
}

export function deactivate(): Thenable<void> | undefined {
  if (statusBarItem) statusBarItem.dispose();
  if (outputChannel) outputChannel.dispose();
  if (!client) {
    return undefined;
  }
  return client.stop();
}
