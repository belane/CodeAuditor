import * as vscode from 'vscode';
import { auditData } from './storage';
import { noteType, noteState, Note } from './types';


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

export function listFilterNotes() {
    if (!auditData) {
        vscode.window.showErrorMessage("Extension not ready");
        return;
    }

    const nodes: any = [];
    for (const sourceCodeFile in auditData.files) {
        if (Object.keys(auditData.files[sourceCodeFile].notes).length === 0) {
            continue;
        }

        const notes: any = {};
        let note: Note;
        let lineNum: string;

        for ([lineNum, note] of Object.entries(auditData.files[sourceCodeFile].notes)) {
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
            notes[lineNum] = note;
        }
        nodes[sourceCodeFile] = notes;
    }
    return nodes;
}
