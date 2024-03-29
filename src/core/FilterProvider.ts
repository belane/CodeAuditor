import * as vscode from 'vscode';
import { join } from 'path';
import { statSync } from 'fs';
import { auditData, CodeAuditorFile } from './auditStorage';
import { noteType, noteState, NoteCollection, FileCollection } from '../types/types';


type filerOptions = {
    [key: string]: boolean
}

export const currentFilter: filerOptions = {
    note: true,
    issue: true,
    open: true,
    confirmed: true,
    discarded: false,
    reviewed: false,
    outlined: false
};

export function toggleFilter(filter: string) {
    if (Object.prototype.hasOwnProperty.call(currentFilter, filter)) {
        currentFilter[filter] = !currentFilter[filter];
    }
    vscode.commands.executeCommand('setContext', 'code-auditor.filter.' + filter, currentFilter[filter]);
    if (filter == "reviewed" || filter == "outlined") {
        vscode.commands.executeCommand('code-auditor.progressExplorer.refresh');
    } else {
        vscode.commands.executeCommand('code-auditor.noteExplorer.refresh');
    }
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
        if (Object.keys(notes).length === 0) {
            continue;
        }
        nodes[fileName] = {
            lines: fileInfo.lines,
            state: fileInfo.state,
            notes: notes
        };
    }
    return nodes;
}

function patternCompare(text: string, pattern: string): boolean {
    const split = pattern.split('*');
    const cgroups = split.filter(i => i);

    if (split.length == 2 && cgroups.length == 1) {
        return pattern[0] == '*' ? text.endsWith(cgroups[0]) : text.startsWith(cgroups[0]);
    }

    let index_pointer = 0;
    for (const cgroup of cgroups) {
        const index = text.indexOf(cgroup, index_pointer);
        if (index === -1) { return false; }
        else { index_pointer = index; }
    }
    return true;
}

export function isPathExcluded(dirPath: string, name: string): boolean {
    if (name == CodeAuditorFile) {
        return true;
    }
    if (!auditData.exclude || Object.keys(auditData.exclude).length === 0) {
        return false;
    }

    const inclusions: Array<string> = [];
    for (const exclusion of auditData.exclude) {
        if (exclusion[0] === '!') {
            inclusions.push(exclusion.slice(1));
            continue;
        }
        if (name == exclusion) {
            return true;
        }
        if (exclusion.includes('*')) {
            if (patternCompare(name, exclusion)) {
                return true;
            }
        }
    }

    for (const inclusion of inclusions) {
        const stat = statSync(join(dirPath, name));
        if (stat.isDirectory()) {
            return false;
        }
        if (patternCompare(name, inclusion)) {
            return false;
        }
    }

    return inclusions.length > 0;
}
