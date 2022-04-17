import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { auditData, projectRoot } from './storage';
import { fileState, noteState, noteType } from './types';
import { currentFilter, isPathExcluded } from './filter';

interface Entry {
	uri: vscode.Uri;
	state: string;
	num_issues: number;
	type: vscode.FileType;
}

export class progressProvider implements vscode.TreeDataProvider<Entry> {
	private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined> = new vscode.EventEmitter<Entry | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Entry | undefined> = this._onDidChangeTreeData.event;

	constructor() {
		vscode.commands.registerCommand('code-auditor.openFile', (file) => vscode.window.showTextDocument(file));
		vscode.commands.registerCommand('code-auditor.progressExplorer.refresh', () => this.refresh());
	}

	public refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Entry): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(element.uri, element.type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
		if (element.type === vscode.FileType.File) {
			treeItem.command = { command: 'code-auditor.openFile', title: "Open File", arguments: [element.uri], };
			treeItem.contextValue = element.state;
			treeItem.tooltip = `${element.num_issues.toString()} issues`;

			if (element.state == fileState.Reviewed) {
				if (element.num_issues) {
					treeItem.iconPath = {
						light: path.join(__filename, '..', '..', 'resources/light/circle-alert.svg'),
						dark: path.join(__filename, '..', '..', 'resources/dark/circle-alert.svg')
					};
				} else {
					treeItem.iconPath = {
						light: path.join(__filename, '..', '..', 'resources/light/pass.svg'),
						dark: path.join(__filename, '..', '..', 'resources/dark/pass.svg')
					};
				}
			} else {
				if (element.num_issues) {
					treeItem.iconPath = {
						light: path.join(__filename, '..', '..', 'resources/light/info-grey.svg'),
						dark: path.join(__filename, '..', '..', 'resources/dark/info-grey.svg')
					};
				} else {
					treeItem.iconPath = {
						light: path.join(__filename, '..', '..', 'resources/light/circle-large-outline.svg'),
						dark: path.join(__filename, '..', '..', 'resources/dark/circle-large-outline.svg')
					};
				}
			}
		}
		return treeItem;
	}

	async getChildren(element?: Entry): Promise<Entry[]> {
		if (element) {
			const children = await this.readDirectory(element.uri.fsPath);
			return children.map(([name, state, num_issues, type]) => ({ uri: vscode.Uri.file(path.join(element.uri.fsPath, name)), state: state, num_issues: num_issues, type: type }));
		}

		if (projectRoot) {
			const children = await this.readDirectory(projectRoot);
			children.sort((a, b) => {
				if (a[3] === b[3]) {
					return a[0].localeCompare(b[0]);
				}
				return a[3] === vscode.FileType.Directory ? -1 : 1;
			});
			return children.map(([name, state, num_issues, type]) => ({ uri: vscode.Uri.file(path.join(projectRoot, name)), state: state, num_issues: num_issues, type: type }));
		}
		return [];
	}

	async readDirectory(dirPath: string, getInfo = true): Promise<[string, string, number, vscode.FileType][]> {
		const children = fs.readdirSync(dirPath);
		const result: [string, string, number, vscode.FileType][] = [];
		for (const child of children) {
			if (isPathExcluded(child)) {
				continue;
			}

			const fullPath = path.join(dirPath, child);
			const file = fullPath.slice(projectRoot.length + 1);
			let state = auditData.files[file]?.state;
			if (!Object.values(fileState).includes(state)) {
				state = fileState.Pending;
			}

			if (currentFilter.reviewed && state == fileState.Reviewed) {
				continue;
			}

			const stat = fs.statSync(fullPath);
			if (currentFilter.reviewed && stat.isDirectory()) {
				const known_children = await this.readDirectory(fullPath, false);
				if (Object.keys(known_children).length === 0) {
					continue;
				}
			}

			let num_issues = 0;
			if (getInfo && auditData.files[file]?.notes) {
				num_issues = Object.values(auditData.files[file].notes).filter(i => i.type == noteType.Issue && i.state != noteState.Discarded).length;
			}
			result.push([child, state, num_issues, stat.isFile() ? vscode.FileType.File : stat.isDirectory() ? vscode.FileType.Directory : vscode.FileType.Unknown]);
		}
		return Promise.resolve(result);
	}
}
