import * as vscode from 'vscode';
import { auditData } from './storage';
import { listFilterNotes } from './filter';


export function generateReport(out: vscode.OutputChannel) {
    if (!auditData) {
        vscode.window.showErrorMessage("Extension not ready");
        return;
    }
    for (const [fileName, fileInfo] of Object.entries(listFilterNotes())) {
        if (Object.keys(fileInfo.notes).length === 0) {
            continue;
        }
        out.appendLine(`${fileName}`);
        for (const [lineNum, note] of Object.entries(fileInfo.notes)) {
            let afectedLines = note.length > 1 ? `${lineNum}:${parseInt(lineNum) + note.length - 1}` : lineNum;
            if (afectedLines.length < 4) { afectedLines += '\t'; }
            out.appendLine(`\t${afectedLines}\t- ${note.type}: ${note.state}\t=> ${note.message}`);
        }
    }
}
