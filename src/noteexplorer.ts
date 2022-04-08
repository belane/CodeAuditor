import * as vscode from 'vscode';
import * as path from 'path';
import { existsSync } from 'fs';
import { auditData, projectRoot } from './storage';
import { noteType } from './types';
import { listFilterNotes, currentFilter } from './filter';


export class noteProvider implements vscode.TreeDataProvider<noteNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<noteNode | undefined> = new vscode.EventEmitter<noteNode | undefined>();
	readonly onDidChangeTreeData: vscode.Event<noteNode | undefined> = this._onDidChangeTreeData.event;

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

    getTreeItem(element: noteNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: noteNode): Thenable<noteNode[]> {
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

    private getRootNodes(): noteNode[] {
        const filteredNotes = listFilterNotes();
        const nodes: noteNode[] = [];
        let fileName: string;
        let fileNotes: any = {};

        for ([fileName, fileNotes] of Object.entries(filteredNotes)) {
            if (Object.keys(fileNotes).length === 0) {
                continue;
            }
            const label = path.parse(fileName).base;
            const desc = path.parse(fileName).dir;
            nodes.push(
                new noteNode(
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
        return nodes;
    }

    private getNotes(file: string): noteNode[] {
        const filteredNotes = listFilterNotes();
        const nodes: noteNode[] = [];
        let note: any = {};
        let lineNum: string;
        for ([lineNum, note] of Object.entries(filteredNotes[file])) {
            const afectedLines = note.length > 1 ? `${lineNum} - ${parseInt(lineNum) + note.length - 1}` : lineNum;
            nodes.push(
                new noteNode(
                    note.message,
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
        const fullPath = path.join(projectRoot, filePath);
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

class noteNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: string,
        public readonly sourcePath: string,
        public readonly tooltip: string,
        public readonly description: string,
        public readonly rootNode: boolean,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.sourcePath = sourcePath;
        this.tooltip = tooltip;
        this.description = description;
        this.rootNode = rootNode;
        this.contextValue = "code-auditor.noteExplorer.node";
        if (!rootNode) {
            if (type == noteType.Issue) {
                this.iconPath = {
                    light: path.join(__filename, '..', '..', 'resources/light/bug.svg'),
                    dark: path.join(__filename, '..', '..', 'resources/dark/bug.svg')
                };
            } else {
                this.iconPath = {
                    light: path.join(__filename, '..', '..', 'resources/light/output.svg'),
                    dark: path.join(__filename, '..', '..', 'resources/dark/output.svg')
                };
            }
        }
    }
}
