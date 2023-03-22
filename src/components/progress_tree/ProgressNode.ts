import * as vscode from 'vscode';
import { fileState } from '../../types/types';
import { join } from 'path';


export class ProgressNode extends vscode.TreeItem {
    constructor(
        public readonly uri: vscode.Uri,
        public readonly state: fileState,
        public readonly num_issues: number,
        public readonly type: vscode.FileType,
        public readonly parent?: ProgressNode
    ) {
        super(
            uri,
            type == vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );
        this.uri = uri;
        this.state = state;
        this.num_issues = num_issues;
        this.type = type;
        this.parent = parent;

        if (this.type === vscode.FileType.Directory) {
            this.contextValue = "code-auditor.progressExplorer.folder";
        }

        if (this.type === vscode.FileType.File) {
            this.command = { command: 'code-auditor.openFile', title: "Open File", arguments: [uri], };
            this.contextValue = state;
            this.tooltip = `${num_issues.toString()} issues`;
            // this.contextValue = "code-auditor.progressExplorer.file";

            if (this.state == fileState.Reviewed) {
                if (this.num_issues) {
                    this.iconPath = {
                        light: join(__filename, '..', '..', 'resources/light/circle-alert.svg'),
                        dark: join(__filename, '..', '..', 'resources/dark/circle-alert.svg')
                    };
                } else {
                    this.iconPath = {
                        light: join(__filename, '..', '..', 'resources/light/pass.svg'),
                        dark: join(__filename, '..', '..', 'resources/dark/pass.svg')
                    };
                }
            } else {
                if (this.num_issues) {
                    this.iconPath = {
                        light: join(__filename, '..', '..', 'resources/light/info-grey.svg'),
                        dark: join(__filename, '..', '..', 'resources/dark/info-grey.svg')
                    };
                } else {
                    this.iconPath = {
                        light: join(__filename, '..', '..', 'resources/light/circle-large-outline.svg'),
                        dark: join(__filename, '..', '..', 'resources/dark/circle-large-outline.svg')
                    };
                }
            }
        }
    }
}
