import * as vscode from 'vscode';
import { existsSync, readFileSync, createWriteStream } from 'fs';
import { join } from 'path';

const notesFile = '.auditnotes.json';

var auditFile: string;

export var dataSource: any;
export var projectRoot: string;


export function dataSourceInit() {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }
    projectRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    auditFile = join(projectRoot, notesFile);

    if (existsSync(auditFile)) {
        var fileContent = readFileSync(auditFile);
        try { dataSource = JSON.parse(fileContent.toString('utf8')); }
        catch (err) { vscode.window.showErrorMessage(`Fail to process ${notesFile}`); }
    }
    if (!dataSource) {
        dataSource = {};
    }
    if (!dataSource.files) {
        dataSource['files'] = {};
    }
    if (!dataSource.exclude) {
        dataSource['exclude'] = [notesFile, '.git', '.vscode', 'node_modules'];
    }
}

export function dataSourceSave() {
    if (!dataSource) {
        return;
    }
    var fileWriter = createWriteStream(auditFile);
    fileWriter.write(JSON.stringify(dataSource, null, 2));
    fileWriter.close();
}


/*
dataSource =
{
    "exclude": [ ".auditnotes.json" ]
    "files":
    {
        "main.go":
        {
            "lines": 10,
            "state": "reviewed/pending/excluded"
            "notes":
            {
                5:
                {
                    "length": 2,
                    "message":"Possible issue",
                    "type":"note/issue",
                    "state": "open/confirmed/discarded"
                },
                18:
                {
                    "length": 1,
                    "message":"Review",
                    "type":"note/issue",
                    "state": "open/confirmed/discarded"
                }
            }
        }
    }
};
*/