import * as vscode from 'vscode';


export const noteNoteDecorator = vscode.window.createTextEditorDecorationType({
    borderWidth: '0px',
    borderStyle: 'solid',
    overviewRulerColor: '#8a8a8a20',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: { borderColor: '#7a91ff25', backgroundColor: '#7a91ff25' },
    dark: { borderColor: '#7a91ff25', backgroundColor: '#7a91ff25' }
});

export const issueNoteDecorator = vscode.window.createTextEditorDecorationType({
    borderWidth: '0px',
    borderStyle: 'solid',
    overviewRulerColor: 'red',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: { borderColor: '#FF000025', backgroundColor: '#FF000025' },
    dark: { borderColor: '#FF000025', backgroundColor: '#FF000025' }
});

export const openNoteDecorator = vscode.window.createTextEditorDecorationType({
    borderWidth: '0px',
    borderStyle: 'solid',
    overviewRulerColor: '#ffb433',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: { borderColor: '#ffb43335', backgroundColor: '#ffb43335' },
    dark: { borderColor: '#ffb43335', backgroundColor: '#ffb43335' }
});

export const discardNoteDecorator = vscode.window.createTextEditorDecorationType({
    borderWidth: '0px',
    borderStyle: 'solid',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: { borderColor: '#8a8a8a19', backgroundColor: '#8a8a8a20' },
    dark: { borderColor: '#8a8a8a19', backgroundColor: '#8a8a8a20' }
});
