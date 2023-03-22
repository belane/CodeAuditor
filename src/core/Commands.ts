import * as vscode from 'vscode';
import { excludePath, newNote, removeNote, setFileState, setNoteState, setNoteType } from './noteProvider';
import { importSlitherReport, importSemgrepReport } from '../modules/import/imports';
import { generateReport, generateReferences } from '../modules/report/reports';
import { noteState, fileState, noteType } from '../types/types';
import { toggleFilter } from './filterProvider';

let outReport: vscode.OutputChannel;
let outRefs: vscode.OutputChannel;

export function registerExtensionCommands(context: vscode.ExtensionContext) {
	/** Functions */
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
		importSlitherReport();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('code-auditor.importSemgrep', () => {
		importSemgrepReport();
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
}