import * as vscode from 'vscode';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileState, Note, noteState, noteType } from './types';
import { auditData, auditDataSave, projectRoot } from './storage';
import { updateDecorators } from './decorators';


interface slitherData {
    success: boolean;
    results: {
        detectors: {
            check: string;
            description: string;
            elements: {
                name: string;
                type: string;
                source_mapping: {
                    filename_relative: string;
                    lines: number[];
                }
            }[];
        }[];
    };
}

export async function ImportSlitherReport() {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }

    const options: vscode.OpenDialogOptions = {
        openLabel: "Import",
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { 'Slither': ['json'] }
    };
    const fileSelect = await vscode.window.showOpenDialog(options);
    if (!fileSelect) {
        return;
    }

    const importFile = fileSelect[0].fsPath;
    if (!existsSync(importFile)) {
        return;
    }

    let data: slitherData;
    const fileContent = readFileSync(importFile);
    try {
        data = JSON.parse(fileContent.toString('utf8'));
    }
    catch (err) {
        vscode.window.showErrorMessage(`Fail to import ${importFile}`);
        return;
    }

    if (!data || !data.success) {
        vscode.window.showErrorMessage(`Invalid format ${importFile}`);
        return;
    }

    let importCounter = 0;
    for (const detector of data.results.detectors) {
        const message = detector.description.split(':')[0].replace('\n', '');

        for (const finding of detector.elements) {

            const fileName = finding.source_mapping.filename_relative;
            const absFileName = join(projectRoot, fileName);

            if (!existsSync(absFileName)) {
                continue;
            }

            let fileData = auditData.files[fileName];
            if (!fileData) {
                fileData = {
                    lines: readFileSync(absFileName, 'utf-8').split('\n').length,
                    state: fileState.Pending,
                    notes: {}
                };
            } else {
                fileData.state = fileState.Pending;
            }
            const line = finding.source_mapping.lines[0];

            let note: Note = fileData.notes[line];
            if (!note) {
                note = {
                    length: 1,
                    message: message,
                    type: noteType.Issue,
                    state: noteState.Open
                };
            } else {
                note.message = message + "  //  " + note.message;
                note.state = noteState.Open;
            }
            fileData.notes[line] = note;
            importCounter++;
            auditData.files[fileName] = fileData;
        }
    }
    auditDataSave();
    updateDecorators();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
    vscode.window.showInformationMessage(`Succesfully imported ${importCounter} issues from ${importFile}`);
}
