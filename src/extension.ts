// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	vscode.languages.registerDocumentFormattingEditProvider('foo-css', {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			let bracketDepth = 0;
			let edits: vscode.TextEdit[] = [];
			let previousLine = document.lineAt(0);
			let emptyLineCount = 0;
			for (let i = 0; i < document.lineCount; i++) {
				const line = document.lineAt(i);
				// console.log("Line: " + (i + 1));
				// console.log("text: \'" + line.text + "'");
				if (line.isEmptyOrWhitespace) {
					emptyLineCount++;
				} else {
					if (emptyLineCount > 0) {
						// Sets the last non empty line to the first empty line if the documents starts out with one or more empty lines
						let lastNonEmptyLine = (i - emptyLineCount - 1) > -1 ? (i - emptyLineCount - 1) : (i - emptyLineCount);

						if (document.lineAt(lastNonEmptyLine).text.trim() === "}") {
							previousLine = document.lineAt(i - emptyLineCount);
							edits.push(vscode.TextEdit.replace(new vscode.Range(document.lineAt(i - emptyLineCount).range.start, document.lineAt(i - emptyLineCount + 1).range.start), "\n"));
							edits.push(vscode.TextEdit.delete(new vscode.Range(document.lineAt(i - emptyLineCount + 1).range.start, line.range.start)));
						} else {
							edits.push(vscode.TextEdit.delete(new vscode.Range(document.lineAt(i - emptyLineCount).range.start, line.range.start)));
							previousLine = document.lineAt(lastNonEmptyLine);
						}
						emptyLineCount = 0;

					}

					let leadWhitespaceEnd = new vscode.Position(line.range.start.line, line.text.search(/\S|$/));
					let trailWhitespaceStart = new vscode.Position(line.range.start.line, line.text.search(/\s+$|$/));

					if (previousLine.text.trim() === "}") {
						edits.push(vscode.TextEdit.insert(line.range.start, '\n'));
					}

					if (line.text.trim() === "}") {
						edits.push(vscode.TextEdit.replace(new vscode.Range(line.range.start, leadWhitespaceEnd), "  ".repeat(bracketDepth - 1)));
					} else {
						edits.push(vscode.TextEdit.replace(new vscode.Range(line.range.start, leadWhitespaceEnd), "  ".repeat(bracketDepth)));
					}
					edits.push(vscode.TextEdit.replace(new vscode.Range(trailWhitespaceStart, line.range.end), ""));

					bracketDepth += depthAdjustment(line.text);
					previousLine = line;
				}
			}
			return edits;
		}
	});

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('andromeda-css is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('andromeda-css.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from andromeda-css!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }

function depthAdjustment(line: string) {
	let adjustment = 0;
	for (const c of line) {
		if (c === '{') adjustment++;
		if (c === '}') adjustment--;
	}
	return adjustment;
}