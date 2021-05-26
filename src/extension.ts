// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

// this method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {

	vscode.languages.registerDocumentFormattingEditProvider('foo-css', {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			let bracketDepth = 0;
			let edits: vscode.TextEdit[] = [];
			for (let i = 0; i < document.lineCount; i++) {
				const line = document.lineAt(i);
				console.log("Line: " + (i + 1));
				console.log("text: \'" + line.text + "'");
				if (line.isEmptyOrWhitespace) {
					if (i < document.lineCount && i != 0) {
						edits.push(vscode.TextEdit.delete(
							new vscode.Range(document.lineAt(i).range.end, document.lineAt(i - 1).range.end)));
					}
				} else {
					edits = edits.concat(getBracketEdits(line, bracketDepth));
					edits = edits.concat(getIndentEdits(line, bracketDepth));
					bracketDepth += depthAdjustment(line.text);
					if (bracketDepth < 0) {
						bracketDepth = 0;
					}
				}
			}
			return edits;
		}
	});

	console.log('andromeda-css is now active!');

	// The command is defined in the package.json file
	let disposable = vscode.commands.registerCommand('andromeda-css.helloWorld', () => {

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from andromeda-css!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when the extension is deactivated
export function deactivate() { }


function depthAdjustment(line: string) {
	let adjustment = 0;
	for (const c of line) {
		if (c === '{') adjustment++;
		if (c === '}') adjustment--;
	}
	return adjustment;
}

function adjustBracketSpacing(text: string) {
	let extraSpacesIndex = text.search(/\s{2,}{\s*$/);
	if (extraSpacesIndex > -1) {
		return text.substr(0, extraSpacesIndex + 1) + "{"
	} else {
		let spaceNeededIndex = text.search(/\S{\s*$/);
		if (spaceNeededIndex > -1) {
			return text.substr(0, text.length - 1) + " {"
		}
	}
	return text;
}

function splitOnFirstBracket(text: string) {
	let lines: string[] = [];
	let splitIndex = text.search(/(?<=\S.*)}|(?<=\s*}).*|(?<=.*){/);
	if (splitIndex > -1) {
		splitIndex = text.charAt(splitIndex) === "{" ? splitIndex + 1 : splitIndex;
		lines.push(text.substr(0, splitIndex));
		let line2 = text.substr(splitIndex).trim();
		if (line2.length > 0) {
			lines.push(line2);
		}
	} else {
		lines.push(text);
	}
	return lines;

}

function getBracketEdits(line: vscode.TextLine, bracketDepth: number): vscode.TextEdit[] {
	let edits: vscode.TextEdit[] = [];

	let lineAdjustedDepth = bracketDepth;
	let lines = splitOnFirstBracket(line.text);
	let text = lines[0];
	let openBracketIndex = text.search(/{\s*$/);
	if (openBracketIndex > -1) {
		let spaceNeededIndex = text.search(/\S{\s*$/) + 1;
		if (spaceNeededIndex) {
			let newSpacePosition = new vscode.Position(line.range.start.line, openBracketIndex);
			edits.push(vscode.TextEdit.insert(newSpacePosition, " "));
		}
		let extraSpacesIndex = text.search(/\s{2,}{\s*$/) + 1;
		if (extraSpacesIndex) {
			let startDeletePositon = new vscode.Position(line.range.start.line, extraSpacesIndex);
			let endDeletePosition = new vscode.Position(line.range.start.line, openBracketIndex);
			edits.push(vscode.TextEdit.delete(new vscode.Range(startDeletePositon, endDeletePosition)));
		}
	}
	if (text.trim() === "}") {
		edits.push(vscode.TextEdit.insert(line.range.end, "\n"));
		lineAdjustedDepth = lineAdjustedDepth - 1 > 0 ? lineAdjustedDepth - 1 : 0;
	}
	if (lines.length > 1) {
		if (lines[0].trim().charAt(lines[0].length - 1) === "{") {
			lineAdjustedDepth++;
		}
		text = lines[1].trim();
		let endDeletePosition = new vscode.Position(line.range.start.line, line.text.search(/\s+$|$/));
		let startDeletePositon = new vscode.Position(line.range.start.line, lines[0].length);
		edits.push(vscode.TextEdit.delete(new vscode.Range(startDeletePositon, endDeletePosition)));

		while (text.length > 0) {
			if (text.charAt(0) === "}") {
				lineAdjustedDepth = lineAdjustedDepth - 1 > 0 ? lineAdjustedDepth - 1 : 0;
				edits.push(vscode.TextEdit.insert(line.range.end, "\n".concat("  ".repeat(lineAdjustedDepth), "}")));
				edits.push(vscode.TextEdit.insert(line.range.end, "\n"));
				text = text.substr(1).trim();
			} else { // '{.*'
				lines = splitOnFirstBracket(text);
				if (lines[0].includes('{')) {
					lineAdjustedDepth++;
				}
				let newLine = adjustBracketSpacing(lines[0]);
				edits.push(vscode.TextEdit.insert(line.range.end, "\n".concat("  ".repeat(lineAdjustedDepth), newLine)));
				text = lines.length > 1 ? lines[1].trim() : "";
			}
		}
	}
	return edits;
}

function getIndentEdits(line: vscode.TextLine, bracketDepth: number): vscode.TextEdit[] {
	let edits: vscode.TextEdit[] = [];
	let leadWhitespaceEnd = new vscode.Position(line.range.start.line, line.text.search(/\S|$/));
	let trailWhitespaceStart = new vscode.Position(line.range.start.line, line.text.search(/\s+$|$/));
	if (line.text.trim().charAt(0) === "}" && bracketDepth > 0) {
		edits.push(vscode.TextEdit.replace(new vscode.Range(line.range.start, leadWhitespaceEnd), "  ".repeat(bracketDepth - 1)));
	} else {
		edits.push(vscode.TextEdit.replace(new vscode.Range(line.range.start, leadWhitespaceEnd), "  ".repeat(bracketDepth)));
	}
	edits.push(vscode.TextEdit.replace(new vscode.Range(trailWhitespaceStart, line.range.end), ""));
	return edits;
}
