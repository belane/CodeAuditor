import * as vscode from 'vscode';
import { auditDataSave, auditData, projectRoot } from './storage';
import { updateDecorators } from './decorators';
import { fileState, Note, noteState, noteType } from './types';


export async function newNote(line?: string) {
    const context = getNoteContext();
    if (!context) {
        return;
    }
    const selLine = line && parseInt(line)? parseInt(line) : context.selLine;

    let fileData = auditData.files[context.sourceCodeFile];
    if (!fileData) {
        fileData = {
            lines: vscode.window.activeTextEditor?.document.lineCount || 0,
            state: fileState.Pending,
            notes: {}
        };
    }
    let note: Note = fileData.notes[selLine];
    if (!note) {
        const option = await vscode.window.showQuickPick(["$(bug)  Issue", "$(output)  Note"]);
        if (!option) {
            return;
        }
        const newType = option.toLowerCase().includes(noteType.Issue)? noteType.Issue : noteType.Note;
        note = { 
            length: context.selLength,
            type: newType,
            state: noteState.Open
        };
    }

    const inputBox = await promptInputBox(note.message);
    if (!inputBox) {
        return;
    }

    note.message = inputBox;
    fileData.notes[selLine] = note;
    auditData.files[context.sourceCodeFile] = fileData;
    auditDataSave();
    updateDecorators();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
}

export function removeNote(line?: string) {
    const context = getNoteContext();
    if (!context) {
        return;
    }
    let selLine = line && parseInt(line)? parseInt(line) : context.selLine;
    
    const fileData = auditData.files[context.sourceCodeFile];
    if (!fileData) {
        return;
    }
    selLine = searchNoteLine(context.sourceCodeFile, selLine);
    if (!fileData.notes[selLine]) {
        return;
    }

    delete fileData.notes[selLine];
    if (Object.keys(fileData.notes).length === 0) {
        updateDecorators();
        delete auditData.files[context.sourceCodeFile];
    }
    auditDataSave();
    updateDecorators();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
}

export function setNoteState(state: noteState, line?: string) {
    const context = getNoteContext();
    if (!context || !state) {
        return;
    }

    if (!Object.values(noteState).includes(state)) {
        return;
    }

    let selLine = line && parseInt(line)? parseInt(line) : context.selLine;
    
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
    updateDecorators();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
}

export function setNoteType(line?: string, newType?: noteType) {
    const context = getNoteContext();
    if (!context) {
        return;
    }
    let selLine = line && parseInt(line)? parseInt(line) : context.selLine;
    
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
        newType = fileData.notes[selLine].type == noteType.Note? noteType.Issue: noteType.Note;
    }
    
    fileData.notes[selLine].type = newType;
    auditDataSave();
    updateDecorators();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
}

type NoteContext = {
    sourceCodeFile: string;
    selLine: number;
    selLength: number;
    selStart: number;
    selEnd: number;
}

function getNoteContext(): NoteContext | undefined {
    if (!vscode.window.activeTextEditor || !auditData) {
        vscode.window.showErrorMessage("Extension not ready");
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

async function promptInputBox(msg?: string) {
    return await vscode.window.showInputBox({
        value: msg,
        placeHolder: 'write notes',
        ignoreFocusOut: true
    });
}
