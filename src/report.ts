import * as vscode from 'vscode';
import { URL } from 'url';
import { auditData } from './storage';
import { listFilterNotes } from './filter';
import { noteSeparator } from './importnotes';


let baseURL: string;
let groupBy: number;

export function generateReport(out: vscode.OutputChannel) {
    if (!auditData) {
        vscode.window.showErrorMessage("Extension not ready");
        return;
    }

    const filteredNotes = listFilterNotes();
    for (const fileName of Object.keys(filteredNotes).sort()) {
        out.appendLine(`${fileName}`);
        for (const [lineNum, note] of Object.entries(filteredNotes[fileName].notes)) {
            if (!note.message) { continue; }
            let afectedLines = note.length > 1 ? `${lineNum}:${parseInt(lineNum) + note.length - 1}` : lineNum;
            if (afectedLines.length < 4) { afectedLines += '\t'; }
            for (const msg of note.message.split(noteSeparator)) {
                out.appendLine(`\t${afectedLines}\t- ${note.type}: ${note.state}\t=> ${msg.trim()}`);
            }
        }
    }
}

export async function generateReferences(out: vscode.OutputChannel) {
    if (!auditData) {
        vscode.window.showErrorMessage("Extension not ready");
        return;
    }

    const groupOption = await vscode.window.showQuickPick(
        ["No", "Yes"], {
        placeHolder: "Group notes by description?",
        ignoreFocusOut: true
    });
    if (!groupOption) {
        vscode.window.showErrorMessage("Operation cancelled");
        return;
    }

    if (groupOption.toLocaleLowerCase() === "yes") {
        const inputGroup = await vscode.window.showInputBox({
            value: isNaN(groupBy) || groupBy === 0 ? "3" : groupBy.toString(),
            prompt: "Group by first # words",
            placeHolder: "number between 1 and 10",
            ignoreFocusOut: true,
        });
        if (!inputGroup) {
            vscode.window.showErrorMessage("Operation cancelled");
            return;
        }
        groupBy = parseInt(inputGroup);
        if (isNaN(groupBy) || groupBy < 1 || groupBy > 10) { groupBy = 2; }
    } else {
        groupBy = 0;
    }

    let inputUrl = await vscode.window.showInputBox({
        value: baseURL,
        prompt: "Enter the base URL or leave empty",
        placeHolder: "optional base URL",
        ignoreFocusOut: true
    });
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

            for (const msg of note.message.split(noteSeparator)) {
                const key = groupBy ? msg.toLowerCase().split(' ').slice(0, groupBy).join(' ') : msg;
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
