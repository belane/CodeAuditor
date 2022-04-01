import * as vscode from 'vscode';
import { triggerUpdateDecorations } from './decorators';
import { toggleFilter } from './filter';
import { noteProvider } from './noteexplorer';
import { newNote, noteState, noteType, removeNote, setNoteState, setNoteType } from './notes';
import { generateReport } from './report';
import { dataSourceInit } from './storage';


export function activate(context: vscode.ExtensionContext) {
	console.log('Loading Code Auditor');
	dataSourceInit();

	const noteExplorer : noteProvider = new noteProvider();
	vscode.window.registerTreeDataProvider('code-auditor.noteExplorer', noteExplorer);

	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.newNote', (line : string) => {
		newNote(line);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.removeNote', (line : string) => {
		removeNote(line);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.toggleNote', (line : string) => {
		toggleFilter(noteType.Note);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.toggleIssue', (line : string) => {
		toggleFilter(noteType.Issue);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.toggleOpen', (line : string) => {
		toggleFilter(noteState.Open);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.toggleConfirmed', (line : string) => {
		toggleFilter(noteState.Confirmed);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.filter.toggleDiscarded', (line : string) => {
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
