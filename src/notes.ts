import * as vscode from 'vscode';
import { dataSourceSave, dataSource, projectRoot } from './storage';
import { updateDecorators } from './decorators';


export enum fileState {
    Pending = 'pending',
    Reviewed = 'reviewed',
    Excluded = 'excluded',
}
export enum noteState {
    Open  = 'open',
    Confirmed = 'confirmed',
    Discarded = 'discarded',
}
export enum noteType {
    Note = 'note',
    Issue = 'issue',
}

export async function newNote(line?: string) {
    let [noteContext, ready] = getNoteContext();
    if (!ready || !noteContext) {
        return;
    }
    let selLine = line && parseInt(line)? line : noteContext["selLine"];

    let fileData = dataSource['files'][noteContext["sourceCodeFile"]];
    if (!fileData) {
        fileData = {
            "lines": vscode.window.activeTextEditor?.document.lineCount,
            "state": "pending",
            "notes": {}
        }
    }
    let note = fileData.notes[selLine];
    if (!note) {
        let option = await vscode.window.showQuickPick(["$(bug)  Issue", "$(output)  Note"]);
        if (!option) {
            return;
        }
        var newType : string | undefined = option.toLowerCase().includes(noteType.Issue)? noteType.Issue : noteType.Note;
    }

    let msg = note ? note.message : '';
    let inputBox = await promptInputBox(msg);
    if (!inputBox) {
        return;
    }

    if (!note) {
        note = {
            "length": noteContext["selLength"],
            "type": newType,
            "state": "open"
        }
    }

    note.message = inputBox;
    fileData.notes[selLine] = note;
    dataSource['files'][noteContext["sourceCodeFile"]] = fileData;
    dataSourceSave();
    updateDecorators();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
}

export function removeNote(line?: string) {
    let [noteContext, ready] = getNoteContext();
    if (!ready || !noteContext) {
        return;
    }
    let selLine = line && parseInt(line)? line : noteContext["selLine"];
    
    let fileData = dataSource['files'][noteContext["sourceCodeFile"]];
    if (!fileData) {
        return;
    }
    selLine = searchNoteLine(noteContext["sourceCodeFile"], selLine);
    if (!fileData.notes[selLine]) {
        return;
    }

    delete fileData.notes[selLine];
    dataSourceSave();
    updateDecorators();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
}

export function setNoteState(state: noteState, line?: string) {
    let [noteContext, ready] = getNoteContext();
    if (!ready || !noteContext || !state) {
        return;
    }

    if (!Object.values(noteState).includes(state)) {
        return;
    }

    let selLine = line? line : noteContext["selLine"];
    
    let fileData = dataSource['files'][noteContext["sourceCodeFile"]];
    if (!fileData) {
        return;
    }
    if (!fileData.notes[selLine]) {
        return;
    }

    fileData.notes[selLine].state = state;
    dataSource['files'][noteContext["sourceCodeFile"]] = fileData;
    dataSourceSave();
    updateDecorators();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
}

export function setNoteType(line?: string, newType?: noteType) {
    let [noteContext, ready] = getNoteContext();
    if (!ready || !noteContext) {
        return;
    }
    let selLine = line && parseInt(line)? line : noteContext["selLine"];
    
    let fileData = dataSource['files'][noteContext["sourceCodeFile"]];
    if (!fileData) {
        return;
    }
    selLine = searchNoteLine(noteContext["sourceCodeFile"], selLine);
    if (!fileData.notes[selLine]) {
        return;
    }

    if (newType && !Object.values(noteType).includes(newType)) {
            return;
    } else {
        newType = fileData.notes[selLine].type == noteType.Note? noteType.Issue: noteType.Note;
    }
    
    fileData.notes[selLine].type = newType;
    dataSourceSave();
    updateDecorators();
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
}

function getNoteContext(): [any, boolean] {
    if (!vscode.window.activeTextEditor || !dataSource) {
        vscode.window.showErrorMessage("Extension not ready");
        return [{}, false];
    }

    let sourceCodeFile = vscode.window.activeTextEditor?.document.fileName.slice(projectRoot.length + 1);
    if (!sourceCodeFile) {
        vscode.window.showErrorMessage("File not found");
        return [{}, false];
    }

    let selection = vscode.window.activeTextEditor.selection;
    return [
        {
            "sourceCodeFile": sourceCodeFile,
            "selLine": selection.start.line + 1,
            "selLength": selection.end.line + 1 - selection.start.line,
            "selStart": selection.start.character,
            "selEnd": selection.end.character
        }, true];
}

function searchNoteLine(file: string, line: number): number {
    for (var i = line; i > 0; i--) {
        let candidate = dataSource['files'][file].notes[i];
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


/*
fileNotes =
{
"lines": 10,
"state": "pending/reviewed/excluded"
"notes":
{
    5:
    {
        "length": 2,
        "message":"Possible issue",
        "type":"note/issue",
        "state": "open/confirmed/discarded"
    }
}
};
*/