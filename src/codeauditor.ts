import * as vscode from 'vscode';
import { triggerUpdateDecorations } from './decorators';
import { toggleFilter } from './filter';
import { noteProvider } from './noteexplorer';
import { fileState, noteState, noteType } from './types';
import { excludePath, newNote, removeNote, setFileState, setNoteState, setNoteType } from './notes';
import { TreeProgressProvider } from './progressexplorer';
import { generateReferences, generateReport } from './report';
import { auditDataInit } from './storage';
import { ImportSemgrepReport, ImportSlitherReport } from './importnotes';


let outReport: vscode.OutputChannel;
let outRefs: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    console.log('Loading CodeAuditor extension');
    auditDataInit();

    /** Explorer Views */
    const noteExplorer: noteProvider = new noteProvider();
    vscode.window.registerTreeDataProvider('code-auditor.noteExplorer', noteExplorer);

    const progressExplorer: TreeProgressProvider = new TreeProgressProvider();
    const progressTreeView = vscode.window.createTreeView('code-auditor.progressExplorer', { treeDataProvider: progressExplorer });

    /** Commands */
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.newNote', (line: string) => {
        newNote(line);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.removeNote', (line: string) => {
        removeNote(line);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.reopenNote', () => {
        setNoteState(noteState.Open);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.toggleType', () => {
        setNoteType();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.setNoteState', (args: string) => {
        if (!args) { return; }
        const [state, line] = args.split('-');
        setNoteState(<any>state, line);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.fileStateReview', (item) => {
        if (item) { setFileState(fileState.Reviewed, item.uri); }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.fileStateReOpen', (item) => {
        if (item) { setFileState(fileState.Pending, item.uri); }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.excludePath', (item) => {
        if (item) { excludePath(item.uri); }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.generateReport', () => {
        if (!outReport) {
            outReport = vscode.window.createOutputChannel("Audit Report");
        } else {
            outReport.clear();
        }
        generateReport(outReport);
        outReport.show();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.generateReferences', () => {
        if (!outRefs) {
            outRefs = vscode.window.createOutputChannel("Audit References");
        } else {
            outRefs.clear();
        }
        generateReferences(outRefs);
        outRefs.show();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.importSlither', () => {
        ImportSlitherReport();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.importSemgrep', () => {
        ImportSemgrepReport();
    }));

    /** Filters */
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.notesOn', () => {
        toggleFilter(noteType.Note);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.notesOff', () => {
        toggleFilter(noteType.Note);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.issueOn', () => {
        toggleFilter(noteType.Issue);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.issueOff', () => {
        toggleFilter(noteType.Issue);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.openOn', () => {
        toggleFilter(noteState.Open);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.openOff', () => {
        toggleFilter(noteState.Open);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.confirmedOn', () => {
        toggleFilter(noteState.Confirmed);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.confirmedOff', () => {
        toggleFilter(noteState.Confirmed);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.discardedOn', () => {
        toggleFilter(noteState.Discarded);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.discardedOff', () => {
        toggleFilter(noteState.Discarded);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.progressOn', () => {
        toggleFilter(fileState.Reviewed);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.progressOff', () => {
        toggleFilter(fileState.Reviewed);
    }));

    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        triggerUpdateDecorations();
    }

    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        activeEditor = editor;
        if (editor) {
            triggerUpdateDecorations();
            const current_node = await progressExplorer.getNodeFromUri(editor.document.uri);
            if (current_node) {
                progressTreeView.reveal(current_node, { select: true });
            }
        }
    }, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations(true);
        }
    }, null, context.subscriptions);
}
