import * as vscode from 'vscode';
import { dataSource } from './storage';
import { noteType, noteState } from './notes';


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
    if (currentFilter.hasOwnProperty(filter)) {
        currentFilter[filter] = !currentFilter[filter];
    }
    vscode.commands.executeCommand('setContext', 'code-auditor.filter.' + filter, currentFilter[filter]);
    vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
}

export function listFilterNotes() {
    if (!dataSource) {
        vscode.window.showErrorMessage("Extension not ready");
        return;
    }

    const nodes: any = [];
    for (const file in dataSource.files) {
        if (Object.keys(dataSource.files[file].notes).length === 0) {
            continue;
        }

        const notes: any = {};
        let note: any = {};
        let lineNum: string;

        for ([lineNum, note] of Object.entries(dataSource.files[file].notes)) {
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
        nodes[file] = notes;
    }
    return nodes;
}