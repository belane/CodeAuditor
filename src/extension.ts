import * as vscode from 'vscode';
import { triggerUpdateDecorations } from './components/decoration/decorator';
import { ProgressTreeProvider } from './components/progress_tree/progressTreeProvider';
import { auditDataInit } from './core/auditStorage';
import { registerExtensionCommands } from './core/commands';
import { NoteTreeProvider } from './components/note_tree/noteTreeProvider';


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
            note_explorer.revealNodeFromUri(note_tree, editor.document.uri);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations(true);
        }
    }, null, context.subscriptions);
}
