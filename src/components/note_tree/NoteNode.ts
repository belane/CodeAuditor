import * as vscode from 'vscode';
import { noteType } from '../../types/types';
import { join } from 'path';


export class NoteNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: string,
        public readonly sourcePath: string,
        public readonly tooltip: string,
        public readonly description: string,
        public readonly parent?: NoteNode,
        public readonly command?: vscode.Command
    ) {
        super(label, parent ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        this.contextValue = "code-auditor.noteExplorer.node";
        if (parent) {
            if (type == noteType.Issue) {
                this.iconPath = {
                    light: join(__filename, '..', '..', 'resources/light/bug.svg'),
                    dark: join(__filename, '..', '..', 'resources/dark/bug.svg')
                };
            } else {
                this.iconPath = {
                    light: join(__filename, '..', '..', 'resources/light/output.svg'),
                    dark: join(__filename, '..', '..', 'resources/dark/output.svg')
                };
            }
        }
    }
}
