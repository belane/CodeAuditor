import * as vscode from 'vscode';
import { existsSync } from 'fs';
import { parse, join } from 'path';
import { auditData, projectRoot } from '../../core/AuditStorage';
import { listFilterNotes, currentFilter } from '../../core/FilterProvider';
import { NoteNode } from './NoteNode';


export class NoteTreeProvider implements vscode.TreeDataProvider<NoteNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<NoteNode | undefined> = new vscode.EventEmitter<NoteNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<NoteNode | undefined> = this._onDidChangeTreeData.event;

    constructor() {
        vscode.commands.registerCommand('code-auditor.showNote', (file, line) => this.showNote(file, line));
        vscode.commands.registerCommand('code-auditor.noteExplorer.refresh', () => this.refresh());
        Object.entries(currentFilter).forEach(
            ([key, value]) => vscode.commands.executeCommand('setContext', 'code-auditor.filter.' + key, value)
        );
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: NoteNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: NoteNode): Thenable<NoteNode[]> {
        if (!auditData) {
            return Promise.resolve([]);
        }
        if (!element) {
            return Promise.resolve(this.getRootNodes());
        }

        if (!element.rootNode) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.getNotes(element.sourcePath));
        }
    }

    private getRootNodes(): NoteNode[] {
        const filteredNotes = listFilterNotes();
        const nodes: NoteNode[] = [];

        for (const [fileName, fileInfo] of Object.entries(filteredNotes)) {
            const label = parse(fileName).base;
            const desc = parse(fileName).dir;
            nodes.push(
                new NoteNode(
                    label,
                    'root',
                    fileName,
                    auditData.files[fileName].state,
                    desc,
                    true,
                    vscode.TreeItemCollapsibleState.Collapsed
                )
            );
        }
        nodes.sort((a, b) => { return a.sourcePath.localeCompare(b.sourcePath); });
        return nodes;
    }

    private getNotes(file: string): NoteNode[] {
        const filteredNotes = listFilterNotes();
        const nodes: NoteNode[] = [];
        for (const [lineNum, note] of Object.entries(filteredNotes[file].notes)) {
            const afectedLines = note.length > 1 ? `${lineNum} - ${parseInt(lineNum) + note.length - 1}` : lineNum;
            nodes.push(
                new NoteNode(
                    note.message || 'none',
                    note.type,
                    file,
                    afectedLines,
                    '',
                    false,
                    vscode.TreeItemCollapsibleState.None,
                    { command: 'code-auditor.showNote', title: "Open File", arguments: [file, lineNum] }
                )
            );
        }
        return nodes;
    }
    private showNote(filePath: string, line: string): void {
        const focusLine = parseInt(line) - 1;
        const fullPath = join(projectRoot, filePath);
        if (!existsSync(fullPath)) {
            vscode.window.showErrorMessage("File not found");
            return;
        }
        vscode.workspace.openTextDocument(vscode.Uri.file(fullPath)).then(
            document => {
                vscode.window.showTextDocument(document).then(
                    editor => {
                        const posLine: vscode.Position = document.lineAt(focusLine).range.end.with({ character: 0 });
                        const editorScroll = new vscode.Range(posLine, posLine);
                        if (!document.validateRange(editorScroll)) { return; }
                        editor.revealRange(editorScroll, vscode.TextEditorRevealType.InCenter);
                    }
                );
            }
        );
    }
}
