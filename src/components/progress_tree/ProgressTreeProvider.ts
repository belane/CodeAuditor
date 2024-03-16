import * as vscode from 'vscode';
import { join, sep } from 'path';
import { readdirSync } from 'fs';
import { auditData, projectRoot } from '../../core/auditStorage';
import { fileState, noteState, noteType } from '../../types/types';
import { currentFilter, isPathExcluded } from '../../core/filterProvider';
import { ProgressNode } from './progressNode';


interface FileInfo {
    name: string;
    state: fileState;
    num_issues: number;
    type: vscode.FileType;
}

export class ProgressTreeProvider implements vscode.TreeDataProvider<ProgressNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<ProgressNode | undefined> = new vscode.EventEmitter<ProgressNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ProgressNode | undefined> = this._onDidChangeTreeData.event;
    private items: { [key: string]: ProgressNode } = {};

    constructor() {
        vscode.commands.registerCommand('code-auditor.openFile', (file) => vscode.window.showTextDocument(file));
        vscode.commands.registerCommand('code-auditor.progressExplorer.refresh', () => this.refresh());
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
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
                // TODO: Temp fix for new VSCode URI
                if(current_path.startsWith("file://")) {
                    current_path = current_path.slice(7);
                }
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
        const nodes: ProgressNode[] = [];
        const path = element ? element.uri.fsPath : projectRoot;
        const children = await this.readDirectory(path);
        children.sort((a, b) => {
            if (a.type === b.type) { return a.name.localeCompare(b.name); }
            return a.type === vscode.FileType.Directory ? -1 : 1;
        });

        for (const child of children) {
            const node = new ProgressNode(
                vscode.Uri.file(join(path, child.name)),
                child.state,
                child.num_issues,
                child.type,
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

    async readDirectory(dirPath: string, depth = 0): Promise<FileInfo[]> {
        const result: FileInfo[] = [];
        if (depth > 10_000) { return result; }
        const children = readdirSync(dirPath, { withFileTypes: true }).sort(
            (a, b) => { return a.isFile() ? -1 : 1; }
        );
        for (const child of children) {
            if (depth > 0 && result.length != 0) { break; }

            if (isPathExcluded(dirPath, child.name)) {
                continue;
            }

            const fullPath = join(dirPath, child.name);
            const file = fullPath.slice(projectRoot.length + 1);
            let state = auditData.files[file]?.state;
            let num_issues = 0;
            let type: vscode.FileType;

            if (!Object.values(fileState).includes(state)) {
                state = fileState.Pending;
            }
            if (currentFilter.reviewed && state == fileState.Reviewed) {
                continue;
            }
            if (child.isFile()) {
                type = vscode.FileType.File;
                if (auditData.files[file]?.notes) {
                    num_issues = Object.values(auditData.files[file].notes).filter(i => i.state != noteState.Discarded).length;
                }
                if (currentFilter.outlined && num_issues < 1) {
                    continue;
                }
            }
            else if (child.isDirectory()) {
                type = vscode.FileType.Directory;
                const known_children = await this.readDirectory(fullPath, depth + 1);
                if (Object.keys(known_children).length === 0) {
                    continue;
                }
            }
            else {
                continue;
            }

            result.push({
                name: child.name,
                state: state,
                num_issues: num_issues,
                type: type
            });
        }
        return Promise.resolve(result);
    }
}
