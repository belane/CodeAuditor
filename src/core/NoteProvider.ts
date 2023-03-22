import * as vscode from 'vscode';
import { basename } from 'path';
import { auditDataSave, auditData, projectRoot } from './AuditStorage';
import { updateDecorations } from '../components/decoration/Decorator';
import { fileState, Note, noteState, noteType } from '../types/types';


export async function newNote(line?: string) {
    const context = getNoteContext();
    if (!context) {
        return;
    }
    const selLine = line && parseInt(line) ? parseInt(line) : context.selLine;

    let fileData = auditData.files[context.sourceCodeFile];
    if (!fileData) {
        fileData = {
            lines: vscode.window.activeTextEditor?.document.lineCount || 0,
            state: fileState.Pending,
            notes: {}
        };
    } else if (fileData.lines == 0) {
        fileData.lines = vscode.window.activeTextEditor?.document.lineCount || 0;
    }

    let note: Note = fileData.notes[selLine];
    if (!note) {
        const option = await vscode.window.showQuickPick(["$(bug)  Issue", "$(output)  Note"]);
        if (!option) {
            return;
        }
        const newType = option.toLowerCase().includes(noteType.Issue) ? noteType.Issue : noteType.Note;
        note = {
            length: context.selLength,
            type: newType,
            state: noteState.Open
        };
    }

    const inputBox = await promptInputBox(note.message, 'describe note');
    if (!inputBox) {
        return;
    }

    note.message = inputBox;
    fileData.notes[selLine] = note;
    auditData.files[context.sourceCodeFile] = fileData;
    auditDataSave();
    updateDecorations();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
    vscode.commands.executeCommand('code-auditor.progressExplorer.refresh');
}

export function removeNote(line?: string) {
    const context = getNoteContext();
    if (!context) {
        return;
    }
    let selLine = line && parseInt(line) ? parseInt(line) : context.selLine;

    const fileData = auditData.files[context.sourceCodeFile];
    if (!fileData) {
        return;
    }
    selLine = searchNoteLine(context.sourceCodeFile, selLine);
    if (!fileData.notes[selLine]) {
        return;
    }

    delete fileData.notes[selLine];
    if (fileData.state == fileState.Pending && Object.keys(fileData.notes).length === 0) {
        updateDecorations();
        delete auditData.files[context.sourceCodeFile];
    }
    auditDataSave();
    updateDecorations();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
    vscode.commands.executeCommand('code-auditor.progressExplorer.refresh');
}

export function setNoteState(state: noteState, line?: string) {
    const context = getNoteContext();
    if (!context || !state) {
        return;
    }

    if (!Object.values(noteState).includes(state)) {
        return;
    }

    let selLine = line && parseInt(line) ? parseInt(line) : context.selLine;

    const fileData = auditData.files[context.sourceCodeFile];
    if (!fileData) {
        return;
    }
    selLine = searchNoteLine(context.sourceCodeFile, selLine);
    if (!fileData.notes[selLine]) {
        return;
    }

    fileData.notes[selLine].state = state;
    auditData.files[context.sourceCodeFile] = fileData;
    auditDataSave();
    updateDecorations();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
    vscode.commands.executeCommand('code-auditor.progressExplorer.refresh');
}

export function setNoteType(line?: string, newType?: noteType) {
    const context = getNoteContext();
    if (!context) {
        return;
    }
    let selLine = line && parseInt(line) ? parseInt(line) : context.selLine;

    const fileData = auditData.files[context.sourceCodeFile];
    if (!fileData) {
        return;
    }
    selLine = searchNoteLine(context.sourceCodeFile, selLine);
    if (!fileData.notes[selLine]) {
        return;
    }

    if (newType && !Object.values(noteType).includes(newType)) {
        return;
    } else {
        newType = fileData.notes[selLine].type == noteType.Note ? noteType.Issue : noteType.Note;
    }

    fileData.notes[selLine].type = newType;
    auditDataSave();
    updateDecorations();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
    vscode.commands.executeCommand('code-auditor.progressExplorer.refresh');
}

export function setFileState(state: fileState, file: vscode.Uri) {
    if (!auditData) {
        vscode.window.showErrorMessage("Extension not ready");
        return;
    }

    if (!Object.values(fileState).includes(state)) {
        return;
    }

    const sourceCodeFile = file.fsPath.slice(projectRoot.length + 1);
    let fileData = auditData.files[sourceCodeFile];
    if (!fileData) {
        fileData = { lines: 0, state: state, notes: {} };
    } else {
        fileData.state = state;
    }

    if (fileData.state == fileState.Pending && Object.keys(fileData.notes).length === 0) {
        delete auditData.files[sourceCodeFile];
    } else {
        auditData.files[sourceCodeFile] = fileData;
    }

    auditDataSave();
    vscode.commands.executeCommand('code-auditor.progressExplorer.refresh');
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
}

export async function excludePath(str_path: vscode.Uri) {
    let exclusion = basename(str_path.fsPath);
    const options: vscode.MessageOptions = {
        modal: true
    };
    const accept = await vscode.window.showInformationMessage(`Add '${exclusion}' to exclusion list?`, options, "Add", "Customize");
    if (!accept) { return; }
    if (accept == "Customize") {
        const inputBox = await promptInputBox(exclusion, 'write exclusion');
        if (!inputBox) { return; }
        exclusion = inputBox.trim();
    }

    auditData.exclude.push(exclusion);
    auditDataSave();
    vscode.commands.executeCommand('code-auditor.progressExplorer.refresh');
    vscode.window.showInformationMessage(`Added exclusion: "${exclusion}"`);
}

type NoteContext = {
    sourceCodeFile: string;
    selLine: number;
    selLength: number;
    selStart: number;
    selEnd: number;
}

function getNoteContext(): NoteContext | undefined {
    if (!auditData) {
        vscode.window.showErrorMessage("Extension not ready");
        return;
    }
    if (!vscode.window.activeTextEditor) {
        vscode.window.showInformationMessage("No file selected");
        return;
    }
    const sourceCodeFile = vscode.window.activeTextEditor?.document.fileName.slice(projectRoot.length + 1);
    if (!sourceCodeFile) {
        vscode.window.showErrorMessage("File not found");
        return;
    }

    const selection = vscode.window.activeTextEditor.selection;
    return {
        sourceCodeFile: sourceCodeFile,
        selLine: selection.start.line + 1,
        selLength: selection.end.line + 1 - selection.start.line,
        selStart: selection.start.character,
        selEnd: selection.end.character
    };
}

function searchNoteLine(sourceCodeFile: string, line: number): number {
    for (let i = line; i > 0; i--) {
        const candidate = auditData.files[sourceCodeFile].notes[i];
        if (candidate && i + candidate.length > line) {
            return i;
        }
    }
    return 0;
}

async function promptInputBox(msg?: string, place_holder?: string) {
    return await vscode.window.showInputBox({
        value: msg,
        placeHolder: place_holder,
        ignoreFocusOut: true
    });
}
