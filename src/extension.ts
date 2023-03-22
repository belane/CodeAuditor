import * as vscode from 'vscode';
import { triggerUpdateDecorations } from './components/decoration/Decorator';
import { ProgressTreeProvider } from './components/progress_tree/ProgressTreeProvider';
import { auditDataInit } from './core/AuditStorage';
import { registerExtensionCommands } from './core/Commands';
import { NoteTreeProvider } from './components/note_tree/NoteTreeProvider';


export function activate(context: vscode.ExtensionContext) {
    console.log('Loading CodeAuditor extension');
    auditDataInit();

    const note_explorer: NoteTreeProvider = new NoteTreeProvider();
    const note_tree = vscode.window.createTreeView('code-auditor.noteExplorer', { treeDataProvider: note_explorer });

    const progress_explorer: ProgressTreeProvider = new ProgressTreeProvider();
    const progress_tree = vscode.window.createTreeView('code-auditor.progressExplorer', { treeDataProvider: progress_explorer });

    registerExtensionCommands(context);

    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        triggerUpdateDecorations();
    }

    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        activeEditor = editor;
        if (editor) {
            triggerUpdateDecorations();
            progress_explorer.revealNodeFromUri(progress_tree, editor.document.uri);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations(true);
        }
    }, null, context.subscriptions);
}
