import * as vscode from 'vscode';
import { join, parse, sep } from 'path';
import { statSync, readdirSync } from 'fs';
import { auditData, projectRoot } from './storage';
import { fileState, noteState, noteType } from './types';
import { currentFilter, isPathExcluded } from './filter';


export class TreeProgressProvider implements vscode.TreeDataProvider<Node> {
    private _onDidChangeTreeData: vscode.EventEmitter<Node | undefined> = new vscode.EventEmitter<Node | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Node | undefined> = this._onDidChangeTreeData.event;
    private items: {[key: string]: Node} = {};

    constructor() {
        vscode.commands.registerCommand('code-auditor.openFile', (file) => vscode.window.showTextDocument(file));
        vscode.commands.registerCommand('code-auditor.progressExplorer.refresh', () => this.refresh());
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    async getNodeFromUri(uri: vscode.Uri) {
        if (this.items[uri.fsPath]) {
            return this.items[uri.fsPath];
        }

        if (uri.fsPath.startsWith(projectRoot)) {
            const paths = uri.fsPath.slice(projectRoot.length + 1).split(sep);
            let current_path = projectRoot;
            for (const p of paths) {
                current_path = vscode.Uri.parse(current_path + sep + p).toString(true);
                if (this.items[current_path] && this.items[current_path].type == vscode.FileType.Directory) {
                    await this.getChildren(this.items[current_path])
                } else {
                    break;
                }
            } 
            return this.items[uri.fsPath];
        }
    }

    getTreeItem(element: Node): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: Node): Promise<Node[]> {
        const path = element ? element.uri.fsPath : projectRoot;
        const nodes: Node[] = [];
        if (!path) {
            return [];
        }
        const children = await this.readDirectory(path);
        children.sort((a, b) => {
            if (a[3] === b[3]) { return a[0].localeCompare(b[0]); }
            return a[3] === vscode.FileType.Directory ? -1 : 1;
        });

        for (const [name, state, num_issues, type] of children) {
            const node = new Node(
                vscode.Uri.file(join(path, name)),
                state,
                num_issues,
                type,
                element
            )
            nodes.push(node);
            this.items[node.uri.fsPath] = node
        }
        return nodes;
    }

    async getParent(element: Node): Promise<Node | undefined> {
        return element.parent;
    }

    async readDirectory(dirPath: string, getInfo = true): Promise<[string, fileState, number, vscode.FileType][]> {
        const children = readdirSync(dirPath);
        const result: [string, fileState, number, vscode.FileType][] = [];
        for (const child of children) {
            if (isPathExcluded(dirPath, child)) {
                continue;
            }

            const fullPath = join(dirPath, child);
            const file = fullPath.slice(projectRoot.length + 1);

            let state = auditData.files[file]?.state;
            if (!Object.values(fileState).includes(state)) {
                state = fileState.Pending;
            }
            if (currentFilter.reviewed && state == fileState.Reviewed) {
                continue;
            }

            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
                const known_children = await this.readDirectory(fullPath, false);
                if (Object.keys(known_children).length === 0) {
                    continue;
                }
            }
            // else {
            //     // let hasNotes = auditData.files[file]?.notes != undefined;
            //     if (auditData.files[file]?.notes == undefined) {
            //         // continue;
            //     }
            // }

            let num_issues = 0;
            if (getInfo && auditData.files[file]?.notes) {
                num_issues = Object.values(auditData.files[file].notes).filter(i => i.type == noteType.Issue && i.state != noteState.Discarded).length;
                // if (num_issues < 1) { continue; }
            }
            result.push([child, state, num_issues, stat.isFile() ? vscode.FileType.File : stat.isDirectory() ? vscode.FileType.Directory : vscode.FileType.Unknown]);
        }
        return Promise.resolve(result);
    }
}


class Node extends vscode.TreeItem {
    constructor(
        public readonly uri: vscode.Uri,
        public readonly state: fileState,
        public readonly num_issues: number,
        public readonly type: vscode.FileType,
        public readonly parent?: Node
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
            // this.contextValue = "code-auditor.progressExplorer.folder";
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
