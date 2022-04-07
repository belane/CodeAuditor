import * as vscode from 'vscode';
import { existsSync, readFileSync, createWriteStream } from 'fs';
import { join } from 'path';
import  { CodeAuditorData } from './types';


const notesFile = '.auditnotes.json';
let auditFile: string;

export let auditData: CodeAuditorData;
export let projectRoot: string;

export function auditDataInit() {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }
    projectRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    auditFile = join(projectRoot, notesFile);

    if (existsSync(auditFile)) {
        const fileContent = readFileSync(auditFile);
        try { auditData = JSON.parse(fileContent.toString('utf8')); }
        catch (err) { vscode.window.showErrorMessage(`Fail to process ${notesFile}`); }
    }
    if (!auditData) {
        auditData = {
            exclude: [notesFile, '.git', '.vscode', 'node_modules'],
            files: {}
        };
    }
    if (!auditData.files) {
        auditData.files = {};
    }
    if (!auditData.exclude) {
        auditData.exclude = [notesFile, '.git', '.vscode', 'node_modules'];
    }
}

export function auditDataSave() {
    if (!auditData) {
        return;
    }
    const fileWriter = createWriteStream(auditFile);
    fileWriter.write(JSON.stringify(auditData, null, 2));
    fileWriter.close();
}
