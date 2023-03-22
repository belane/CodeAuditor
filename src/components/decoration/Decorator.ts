import * as vscode from 'vscode';
import { noteState, noteType } from '../../types/types';
import { auditData, projectRoot } from '../../core/auditStorage';
import { noteSeparator } from '../../modules/import/imports';
import { noteNoteDecorator, issueNoteDecorator, openNoteDecorator, discardNoteDecorator } from './decorationTypes';


let timeout: NodeJS.Timer | undefined = undefined;

export function updateDecorations() {
    if (!vscode.window.activeTextEditor || !auditData) {
        return;
    }

    const sourceCodeFile = vscode.window.activeTextEditor?.document.fileName.slice(projectRoot.length + 1);
    if (!sourceCodeFile) {
        return;
    }

    const fileData = auditData.files[sourceCodeFile];
    if (!fileData) {
        return;
    }

    const noteNotes = [], issueNotes = [], openNotes = [], discardedNotes = [];
    const currentDoc = vscode.window.activeTextEditor.document;

    for (const [lineNum, note] of Object.entries(fileData.notes)) {
        const startSel = parseInt(lineNum) - 1;
        let endSel = startSel + note.length;
        if (endSel >= fileData.lines) {
            endSel = fileData.lines - 1;
        }
        const noteSel = new vscode.Range(startSel, 0, endSel, 0);
        if (!currentDoc.validateRange(noteSel)) { continue; }
        if (!note.message) { continue; }

        let icon: string;
        if (note.type == noteType.Note) { icon = "📘"; }
        else if (note.state == noteState.Confirmed) { icon = "📕"; }
        else if (note.state == noteState.Discarded) { icon = "📘"; }
        else { icon = "📙"; }

        const title = `**${note.type.charAt(0).toUpperCase() + note.type.slice(1)}** *(${note.state})*`;
        const stateButtons = `- [Confirm](command:code-auditor.setNoteState?"confirmed-${lineNum}") · [Discard](command:code-auditor.setNoteState?"discarded-${lineNum}")`;
        const editButtons = `[Edit](command:code-auditor.newNote?${lineNum}) · [Remove](command:code-auditor.removeNote?${lineNum})`;

        const panelHeader = new vscode.MarkdownString([icon, title, stateButtons].join(' '));
        panelHeader.isTrusted = true;

        const panelBody = note.message.split(noteSeparator).map(item => new vscode.MarkdownString(`\`\`\`${item.trim()}\`\`\``));

        const panelFooter = new vscode.MarkdownString(editButtons);
        panelFooter.isTrusted = true;

        const decoration = {
            range: noteSel,
            hoverMessage: [panelHeader, ...panelBody, panelFooter],
        };

        if (note.state === noteState.Discarded) {
            discardedNotes.push(decoration);
        }
        else if (note.state === noteState.Open) {
            openNotes.push(decoration);
        }
        else if (note.type === noteType.Issue) {
            issueNotes.push(decoration);
        }
        else if (note.type === noteType.Note) {
            noteNotes.push(decoration);
        }
    }

    vscode.window.activeTextEditor.setDecorations(noteNoteDecorator, noteNotes);
    vscode.window.activeTextEditor.setDecorations(issueNoteDecorator, issueNotes);
    vscode.window.activeTextEditor.setDecorations(openNoteDecorator, openNotes);
    vscode.window.activeTextEditor.setDecorations(discardNoteDecorator, discardedNotes);
}

export function triggerUpdateDecorations(throttle?: boolean) {
    if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
    }
    if (throttle) {
        timeout = setTimeout(updateDecorations, 500);
    } else {
        updateDecorations();
    }
}
