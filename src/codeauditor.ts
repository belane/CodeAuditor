import * as vscode from 'vscode';
import { triggerUpdateDecorations } from './decorators';
import { toggleFilter } from './filter';
import { noteProvider } from './noteexplorer';
import { fileState, noteState, noteType } from './types';
import { excludePath, newNote, removeNote, setFileState, setNoteState, setNoteType } from './notes';
import { progressProvider } from './progressexplorer';
import { generateReport } from './report';
import { auditDataInit } from './storage';
import { ImportSemgrepReport, ImportSlitherReport } from './importnotes';


export function activate(context: vscode.ExtensionContext) {
	console.log('Loading Code Auditor');
	auditDataInit();

	/** Explorer Views */
	const noteExplorer : noteProvider = new noteProvider();
	vscode.window.registerTreeDataProvider('code-auditor.noteExplorer', noteExplorer);

	const progressExplorer : progressProvider = new progressProvider();
	vscode.window.registerTreeDataProvider('code-auditor.progressExplorer', progressExplorer);

	/** Commands */
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.newNote', (line : string) => {
		newNote(line);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.removeNote', (line : string) => {
		removeNote(line);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.reopenNote', () => {
		setNoteState(noteState.Open);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.toggleType', () => {
		setNoteType();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.setNoteState', (args : string) => {
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
		const out = vscode.window.createOutputChannel("report");
		generateReport(out);
		out.show();
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

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);
	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);
}
