import * as vscode from 'vscode';
import { URL } from 'url';
import { auditData } from './storage';
import { listFilterNotes } from './filter';
import { noteSeparator } from './importnotes';


export function generateReport(out: vscode.OutputChannel) {
    if (!auditData) {
        vscode.window.showErrorMessage("Extension not ready");
        return;
    }

    const filteredNotes = listFilterNotes();
    for (const fileName of Object.keys(filteredNotes).sort()) {
        out.appendLine(`${fileName}`);
        for (const [lineNum, note] of Object.entries(filteredNotes[fileName].notes)) {
            let afectedLines = note.length > 1 ? `${lineNum}:${parseInt(lineNum) + note.length - 1}` : lineNum;
            if (afectedLines.length < 4) { afectedLines += '\t'; }
            out.appendLine(`\t${afectedLines}\t- ${note.type}: ${note.state}\t=> ${note.message}`);
        }
    }
}

export async function generateReferences(out: vscode.OutputChannel) {
    if (!auditData) {
        vscode.window.showErrorMessage("Extension not ready");
        return;
    }

    const inputSort = await vscode.window.showInputBox({
        value: "3",
        prompt: "Sort by the first # words",
        placeHolder: "number between 1 and 10",
        ignoreFocusOut: true,
    });
    if (!inputSort) {
        vscode.window.showErrorMessage("Operation cancelled");
        return;
    }
    let sortBy = parseInt(inputSort);
    if (!sortBy || sortBy < 1 || sortBy > 10) { sortBy = 2; }

    let inputUrl = await vscode.window.showInputBox({
        prompt: "Enter the base URL or leave empty",
        placeHolder: "optional base URL",
        ignoreFocusOut: true
    });
    let baseURL;
    if (inputUrl) {
        inputUrl = inputUrl.trim();
        if (!inputUrl.endsWith('/')) {
            inputUrl += '/';
        }
        try {
            const tryURL = new URL(inputUrl);
            baseURL = inputUrl;
        } catch (error) {
            vscode.window.showInformationMessage("Invalid base URL");
            baseURL = "";
        }
    }

    const noterefs: { [key: string]: string[]; } = {};
    const filteredNotes = listFilterNotes();
    for (const fileName of Object.keys(filteredNotes).sort()) {
        for (const [lineNum, note] of Object.entries(filteredNotes[fileName].notes)) {
            if (!note.message) { continue; }
            const lineInd = baseURL ? 'L' : '';
            const afectedLines = note.length > 1 ? `${lineInd}${lineNum}-${lineInd}${parseInt(lineNum) + note.length - 1}` : lineInd + lineNum;

            for (const x of note.message.split(noteSeparator)) {
                const key = x.toLowerCase().split(' ').slice(0, sortBy).join(' ');
                const ref = `${fileName}#${afectedLines}`;

                if (noterefs[key]) {
                    if (!noterefs[key].includes(ref)) {
                        noterefs[key].push(ref);
                    }
                } else {
                    noterefs[key] = [ref];
                }
            }
        }
    }

    for (const desc of Object.keys(noterefs).sort()) {
        out.appendLine(`${desc}`);
        for (const ref of Object.values(noterefs[desc])) {
            if (baseURL) {
                out.appendLine(`\t ${new URL(baseURL + ref)}`);
            } else {
                out.appendLine(`\t- ${ref}`);
            }
        }
    }
}
