import * as vscode from 'vscode';
import { triggerUpdateDecorations } from './decorators';
import { toggleFilter } from './filter';
import { noteProvider } from './noteexplorer';
import { noteState, noteType } from './types';
import { newNote, removeNote, setNoteState, setNoteType } from './notes';
import { generateReport } from './report';
import { auditDataInit } from './storage';
import { ImportSemgrepReport, ImportSlitherReport } from './importnotes';


export function activate(context: vscode.ExtensionContext) {
	console.log('Loading Code Auditor');
	auditDataInit();

	const noteExplorer : noteProvider = new noteProvider();
	vscode.window.registerTreeDataProvider('code-auditor.noteExplorer', noteExplorer);

	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.newNote', (line : string) => {
		newNote(line);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.removeNote', (line : string) => {
		removeNote(line);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.notesOn', (line : string) => {
		toggleFilter(noteType.Note);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.notesOff', (line : string) => {
		toggleFilter(noteType.Note);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.issueOn', (line : string) => {
		toggleFilter(noteType.Issue);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.issueOff', (line : string) => {
		toggleFilter(noteType.Issue);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.openOn', (line : string) => {
		toggleFilter(noteState.Open);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.openOff', (line : string) => {
		toggleFilter(noteState.Open);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.confirmedOn', (line : string) => {
		toggleFilter(noteState.Confirmed);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.confirmedOff', (line : string) => {
		toggleFilter(noteState.Confirmed);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.discardedOn', (line : string) => {
		toggleFilter(noteState.Discarded);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.discardedOff', (line : string) => {
		toggleFilter(noteState.Discarded);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.setNoteState', (args : string) => {
		if (!args) { return; }
		const [state, line] = args.split('-');
		setNoteState(<any>state, line);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.reopenNote', () => {
		setNoteState(noteState.Open);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.toggleType', () => {
		setNoteType();
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
