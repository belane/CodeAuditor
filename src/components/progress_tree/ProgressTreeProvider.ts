import * as vscode from 'vscode';
import { join, sep } from 'path';
import { statSync, readdirSync } from 'fs';
import { auditData, projectRoot } from '../../core/auditStorage';
import { fileState, noteState, noteType } from '../../types/types';
import { currentFilter, isPathExcluded } from '../../core/filterProvider';
import { ProgressNode } from './progressNode';


export class ProgressTreeProvider implements vscode.TreeDataProvider<ProgressNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<ProgressNode | undefined> = new vscode.EventEmitter<ProgressNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ProgressNode | undefined> = this._onDidChangeTreeData.event;
    private items: { [key: string]: ProgressNode } = {};

    constructor() {
        vscode.commands.registerCommand('code-auditor.openFile', (file) => vscode.window.showTextDocument(file));
        vscode.commands.registerCommand('code-auditor.progressExplorer.refresh', () => this.refresh());
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    async revealNodeFromUri(tree: vscode.TreeView<ProgressNode>, uri: vscode.Uri) {
        if (!tree.visible) {
            return;
        }

        let node: ProgressNode = this.items[uri.fsPath];
        if (!node && uri.fsPath.startsWith(projectRoot)) {
            const paths = uri.fsPath.slice(projectRoot.length + 1).split(sep);
            let current_path = projectRoot;
            for (const p of paths) {
                current_path = vscode.Uri.parse(current_path + sep + p).toString(true);
                if (this.items[current_path] && this.items[current_path].type == vscode.FileType.Directory) {
                    await this.getChildren(this.items[current_path]);
                } else {
                    break;
                }
            }
            node = this.items[uri.fsPath];
        }
        if (node) {
            if (currentFilter.reviewed && node.state == fileState.Reviewed) {
                return;
            }
            if (currentFilter.outlined && node.num_issues < 1) {
                return;
            }
            tree.reveal(node, { select: true, focus: false });
        }
    }

    getTreeItem(element: ProgressNode): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ProgressNode): Promise<ProgressNode[]> {
        const path = element ? element.uri.fsPath : projectRoot;
        const nodes: ProgressNode[] = [];
        if (!path) {
            return [];
        }
        const children = await this.readDirectory(path);
        children.sort((a, b) => {
            if (a[3] === b[3]) { return a[0].localeCompare(b[0]); }
            return a[3] === vscode.FileType.Directory ? -1 : 1;
        });

        for (const [name, state, num_issues, type] of children) {
            const node = new ProgressNode(
                vscode.Uri.file(join(path, name)),
                state,
                num_issues,
                type,
                element
            );
            nodes.push(node);
            this.items[node.uri.fsPath] = node;
        }
        return nodes;
    }

    async getParent(element: ProgressNode): Promise<ProgressNode | undefined> {
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

            let num_issues = 0;
            if (getInfo && stat.isFile()) {
                if (auditData.files[file]?.notes) {
                    num_issues = Object.values(auditData.files[file].notes).filter(i => i.type == noteType.Issue && i.state != noteState.Discarded).length;
                }
                if (currentFilter.outlined) {
                    if (num_issues < 1) {
                        continue;
                    }
                }
            }
            result.push([child, state, num_issues, stat.isFile() ? vscode.FileType.File : stat.isDirectory() ? vscode.FileType.Directory : vscode.FileType.Unknown]);
        }
        return Promise.resolve(result);
    }
}
