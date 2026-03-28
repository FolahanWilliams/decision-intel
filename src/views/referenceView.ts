import * as vscode from 'vscode';
import * as path from 'path';

export class ReferenceView {
    constructor(private context: vscode.ExtensionContext) {}

    public register() {
        try {
            const provider = new (class implements vscode.WebviewViewProvider {
                private _view?: vscode.WebviewView;

                constructor(private extensionUri: vscode.Uri) {}

                resolveWebviewView(
                    webviewView: vscode.WebviewView,
                    context: vscode.WebviewViewResolveContext,
                    _token: vscode.CancellationToken,
                ) {
                    this._view = webviewView;

                    webviewView.webview.options = { 
                        enableScripts: true,
                        localResourceRoots: [this.extensionUri]
                    };

                    const scriptUri = webviewView.webview.asWebviewUri(
                        vscode.Uri.joinPath(this.extensionUri, 'resources', 'reference.js')
                    );
                    const cssUri = webviewView.webview.asWebviewUri(
                        vscode.Uri.joinPath(this.extensionUri, 'resources', 'style.css')
                    );

                    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, scriptUri, cssUri);

                    // Listen for messages from the webview
                    webviewView.webview.onDidReceiveMessage(message => {
                        switch (message.type) {
                            case 'jump':
                                this._jumpToLine(message.line);
                                break;
                        }
                    });

                    // Update contents
                    this._updateContent();

                    // Register listeners for updates
                    vscode.window.onDidChangeActiveTextEditor(() => this._updateContent());
                    vscode.workspace.onDidChangeTextDocument(e => {
                        if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
                            this._updateContent();
                        }
                    });
                    vscode.window.onDidChangeTextEditorSelection(event => {
                        if (event.textEditor.document.fileName.endsWith('.fll')) {
                            const line = event.selections[0].active.line + 1;
                            this._view?.webview.postMessage({ type: 'sync', line });
                        }
                    });
                }

                private _getHtmlForWebview(webview: vscode.Webview, scriptUri: vscode.Uri, cssUri: vscode.Uri) {
                    return `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <link rel="stylesheet" href="${cssUri}">
                        </head>
                        <body>
                            <div class="search-container">
                                <input type="text" id="refSearch" placeholder="Search reference...">
                            </div>
                            <div id="referenceList">Loading...</div>
                            <script src="${scriptUri}"></script>
                        </body>
                        </html>
                    `;
                }

                private async _updateContent() {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor || !editor.document.fileName.endsWith('.fll')) {
                        this._view?.webview.postMessage({ type: 'update', data: [], filename: 'N/A' });
                        return;
                    }

                    // Get symbols from the document
                    const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                        'vscode.executeDocumentSymbolProvider',
                        editor.document.uri
                    );

                    if (!symbols) {
                        this._view?.webview.postMessage({ type: 'update', data: [], filename: path.basename(editor.document.fileName) });
                        return;
                    }

                    const refs = symbols.map(s => ({
                        name: s.name,
                        line: s.location.range.start.line + 1,
                        kind: this._getSymbolKindName(s.kind),
                        container: s.containerName
                    }));

                    this._view?.webview.postMessage({ 
                        type: 'update', 
                        data: refs,
                        filename: path.basename(editor.document.fileName)
                    });
                }

                private _getSymbolKindName(kind: vscode.SymbolKind): string {
                    switch (kind) {
                        case vscode.SymbolKind.Variable: return 'Variable';
                        case vscode.SymbolKind.Function: return 'Action';
                        case vscode.SymbolKind.Event: return 'Event';
                        case vscode.SymbolKind.Constant: return 'Constant';
                        default: return 'Symbol';
                    }
                }

                private _jumpToLine(line: number) {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        const range = new vscode.Range(line - 1, 0, line - 1, 0);
                        editor.selection = new vscode.Selection(range.start, range.start);
                        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                    }
                }
            })(this.context.extensionUri);

            this.context.subscriptions.push(
                vscode.window.registerWebviewViewProvider('fllReferenceExplorer', provider)
            );
        } catch (error) {
            console.error('Error in registerReferenceExplorer:', error);
            vscode.window.showErrorMessage('Error initializing Reference Explorer: ' + error);
        }
    }
}
