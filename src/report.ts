import * as vscode from 'vscode';
import { dataSource } from './storage';
import { listFilterNotes } from './filter';


export function generateReport(out: vscode.OutputChannel) {
    if (!dataSource) {
        vscode.window.showErrorMessage("Extension not ready");
        return;
    }
    let fileName: string;
    let fileNotes: any = {};
    for ([fileName, fileNotes] of Object.entries(listFilterNotes())) {
        out.appendLine(`${fileName}`);
        let note: any = {};
        let lineNum: string;
        for ([lineNum, note] of Object.entries(fileNotes)) {
            let afectedLines = note.length > 1 ? `${lineNum}:${parseInt(lineNum) + note.length - 1}` : lineNum;
            if (afectedLines.length < 4) { afectedLines += '\t'; }
            out.appendLine(`\t${afectedLines}\t- ${note.type}: ${note.state}\t=> ${note.message}`);
        }
    }
}
