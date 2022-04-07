import * as vscode from 'vscode';
import { auditData } from './storage';
import { noteType, noteState, NoteCollection, FileCollection } from './types';


type filerOptions = {
    [key: string]: boolean
}

export const currentFilter: filerOptions = {
    note: true,
    issue: true,
    open: true,
    confirmed: true,
    discarded: false
};

export function toggleFilter(filter: string) {
    if(Object.prototype.hasOwnProperty.call(currentFilter, filter)) {
        currentFilter[filter] = !currentFilter[filter];
    }
    vscode.commands.executeCommand('setContext', 'code-auditor.filter.' + filter, currentFilter[filter]);
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
}

export function listFilterNotes(): FileCollection {
    const nodes: FileCollection = {};
    if (!auditData) {
        vscode.window.showErrorMessage("Extension not ready");
        return nodes;
    }

    for (const [fileName, fileInfo] of Object.entries(auditData.files)) {

        if (Object.keys(fileInfo.notes).length === 0) {
            continue;
        }

        const notes: NoteCollection = {};
        for (const [lineNum, note] of Object.entries(fileInfo.notes)) {
            if (!currentFilter.note && note.type == noteType.Note) {
                continue;
            }
            if (!currentFilter.issue && note.type == noteType.Issue) {
                continue;
            }
            if (!currentFilter.open && note.state == noteState.Open) {
                continue;
            }
            if (!currentFilter.confirmed && note.state == noteState.Confirmed) {
                continue;
            }
            if (!currentFilter.discarded && note.state == noteState.Discarded) {
                continue;
            }
            notes[parseInt(lineNum)] = note;
        }
        nodes[fileName] = {
            lines: fileInfo.lines,
            state: fileInfo.state,
            notes: notes
        };
    }
    return nodes;
}
