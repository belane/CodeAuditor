import * as vscode from 'vscode';
import { existsSync, readFileSync } from 'fs';
import { join, normalize, basename } from 'path';
import { fileState, Note, noteState, noteType } from '../../types/types';
import { auditData, auditDataSave, projectRoot } from '../../core/auditStorage';
import { updateDecorations } from '../../components/decoration/decorator';
import { SemgrepData } from './semgrepData';
import { SlitherData } from './slitherData';


export const noteSeparator = " // ";

export async function importSlitherReport() {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }

    const options: vscode.OpenDialogOptions = {
        openLabel: "Import",
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: true,
        filters: { 'Slither': ['json'] }
    };
    const fileSelect = await vscode.window.showOpenDialog(options);
    if (!fileSelect) {
        return;
    }

    for (const importFile of fileSelect) {
        if (!existsSync(importFile.fsPath)) {
            continue;
        }

        let data: SlitherData;
        const fileContent = readFileSync(importFile.fsPath);
        const importFileName = basename(importFile.fsPath);
        try {
            data = JSON.parse(fileContent.toString('utf8'));
        }
        catch (err) {
            vscode.window.showErrorMessage(`Fail to import ${importFileName}`);
            continue;
        }

        if (!data || !data.success) {
            vscode.window.showErrorMessage(`Invalid slither format ${importFileName}`);
            continue;
        }

        let importCounter = 0;
        for (const detector of data.results.detectors) {
            const message = detector.description.split(':')[0]
                .replace('\n', '')
                .replace(/\s\(.*?\w\.sol.*?\)/g, '')
                .slice(0, 200)
                .trim();

            for (const finding of detector.elements) {

                const fileName = normalize(finding.source_mapping.filename_relative);
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
                    if (note.message?.includes(message)) {
                        continue;
                    }
                    note.message = message + noteSeparator + note.message;
                    note.state = noteState.Open;
                }
                fileData.notes[line] = note;
                auditData.files[fileName] = fileData;
                importCounter++;
            }
        }
        auditDataSave();
        updateDecorations();
        vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
        vscode.commands.executeCommand('code-auditor.progressExplorer.refresh');
        vscode.window.showInformationMessage(`Succesfully imported ${importCounter} issues from ${importFileName}`);
    }
}

export async function importSemgrepReport() {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }

    const options: vscode.OpenDialogOptions = {
        openLabel: "Import",
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: true,
        filters: { 'Semgrep': ['json'] }
    };
    const fileSelect = await vscode.window.showOpenDialog(options);
    if (!fileSelect) {
        return;
    }

    for (const importFile of fileSelect) {
        if (!existsSync(importFile.fsPath)) {
            continue;
        }

        let data: SemgrepData;
        const fileContent = readFileSync(importFile.fsPath);
        const importFileName = basename(importFile.fsPath);
        try {
            data = JSON.parse(fileContent.toString('utf8'));
        }
        catch (err) {
            vscode.window.showErrorMessage(`Fail to import ${importFileName}`);
            continue;
        }

        if (!data || !data.paths || !data.results) {
            vscode.window.showErrorMessage(`Invalid semgrep format ${importFileName}`);
            continue;
        }

        let importCounter = 0;
        for (const finding of data.results) {
            const check_id_split = finding.check_id.split('.');
            const name = check_id_split[check_id_split.length - 1].replace(/_|-/g, ' ').slice(0, 30).trim();
            const message = name + ": " + finding.extra.message.slice(0, 200).trim();
            const fileName = normalize(finding.path);
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
            const line = finding.start.line;

            let note: Note = fileData.notes[line];
            if (!note) {
                note = {
                    length: 1,
                    message: message,
                    type: noteType.Issue,
                    state: noteState.Open
                };
            } else {
                if (note.message?.includes(message)) {
                    continue;
                }
                note.message = message + noteSeparator + note.message;
                note.state = noteState.Open;
            }
            fileData.notes[line] = note;
            auditData.files[fileName] = fileData;
            importCounter++;
        }
        auditDataSave();
        updateDecorations();
        vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
        vscode.commands.executeCommand('code-auditor.progressExplorer.refresh');
        vscode.window.showInformationMessage(`Succesfully imported ${importCounter} issues from ${importFileName}`);
    }
}
