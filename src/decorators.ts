import * as vscode from 'vscode';
import { noteState, noteType } from './notes';
import { dataSource, projectRoot } from './storage';


let timeout: NodeJS.Timer | undefined = undefined;

const noteNoteDecorator = vscode.window.createTextEditorDecorationType({
    borderWidth: '0px',
    borderStyle: 'solid',
    overviewRulerColor: '#8a8a8a20',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: { borderColor: '#7a91ff25', backgroundColor: '#7a91ff25' },
    dark: { borderColor: '#7a91ff25', backgroundColor: '#7a91ff25' }
});

const issueNoteDecorator = vscode.window.createTextEditorDecorationType({
    borderWidth: '0px',
    borderStyle: 'solid',
    overviewRulerColor: 'red',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: { borderColor: '#FF000025', backgroundColor: '#FF000025' },
    dark: { borderColor: '#FF000025', backgroundColor: '#FF000025' }
});

const openNoteDecorator = vscode.window.createTextEditorDecorationType({
    borderWidth: '0px',
    borderStyle: 'solid',
    overviewRulerColor: '#ffb433',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: { borderColor: '#ffb43335', backgroundColor: '#ffb43335' },
    dark: { borderColor: '#ffb43335', backgroundColor: '#ffb43335' }
});

const discardNoteDecorator = vscode.window.createTextEditorDecorationType({
    borderWidth: '0px',
    borderStyle: 'solid',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: { borderColor: '#8a8a8a19', backgroundColor: '#8a8a8a20' },
    dark: { borderColor: '#8a8a8a19', backgroundColor: '#8a8a8a20' }
});

export function updateDecorators() {
    if (!vscode.window.activeTextEditor || !dataSource) {
        return;
    }

    const sourceCodeFile = vscode.window.activeTextEditor?.document.fileName.slice(projectRoot.length + 1);
    if (!sourceCodeFile) {
        return;
    }

    const fileData = dataSource['files'][sourceCodeFile];
    if (!fileData) {
        return;
    }

    const noteNotes = [], issueNotes = [], openNotes = [], discardedNotes = [];
    let note: any = {};
    let lineNum: string;
    const currentDoc = vscode.window.activeTextEditor.document;

    for ([lineNum, note] of Object.entries(fileData.notes)) {
        let startSel = parseInt(lineNum) - 1;
        let endSel = parseInt(lineNum) + note.length - 1;
        if (endSel >= dataSource['files'][sourceCodeFile].lines) {
            endSel = dataSource['files'][sourceCodeFile].lines - 1;
        }
        let noteSel = new vscode.Range(startSel, 0, endSel, 0);
        if (!currentDoc.validateRange(noteSel)) { continue; }

        let icon: string;
        if (note.type === 'note') { icon = "📘"; }
        else if (note.state === 'confirmed') { icon = "📕"; }
        else if (note.state === 'discarded') { icon = "📘"; }
        else { icon = "📙"; }

        let title = `**${note.type.charAt(0).toUpperCase() + note.type.slice(1)}** *(${note.state})*`;
        let stateButtons = `- [Confirm](command:code-auditor.setNoteState?"confirmed-${lineNum}") · [Discard](command:code-auditor.setNoteState?"discarded-${lineNum}")`;
        let msg = `  \`\`\`${note.message}\`\`\``;
        let editButtons = `[Edit](command:code-auditor.newNote?${lineNum}) · [Remove](command:code-auditor.removeNote?${lineNum})`;

        let panelHeader = new vscode.MarkdownString([icon, title, stateButtons].join(' '));
        panelHeader.isTrusted = true;

        let panelBody = new vscode.MarkdownString(msg);
        panelBody.isTrusted = true;

        let panelFooter = new vscode.MarkdownString(editButtons);
        panelFooter.isTrusted = true;

        let decoration = {
            range: noteSel,
            hoverMessage: [panelHeader, panelBody, panelFooter],
        };

        if (note.state === noteState.Discarded) {
            discardedNotes.push(decoration);
            continue;
        }
        if (note.state === noteState.Open) {
            openNotes.push(decoration);
            continue;
        }
        if (note.type === noteType.Issue) {
            issueNotes.push(decoration);
            continue;
        }
        if (note.type === noteType.Note) {
            noteNotes.push(decoration);
            continue;
        }
    }

    vscode.window.activeTextEditor.setDecorations(noteNoteDecorator, noteNotes);
    vscode.window.activeTextEditor.setDecorations(issueNoteDecorator, issueNotes);
    vscode.window.activeTextEditor.setDecorations(openNoteDecorator, openNotes);
    vscode.window.activeTextEditor.setDecorations(discardNoteDecorator, discardedNotes);
}

export function triggerUpdateDecorations(throttle: boolean = false) {
    if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
    }
    if (throttle) {
        timeout = setTimeout(updateDecorators, 500);
    } else {
        updateDecorators();
    }
}
