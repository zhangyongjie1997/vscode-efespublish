import * as vscode from 'vscode';
import * as babel from "@babel/core";
import * as env from "@babel/preset-env";

type TextBlock = {
	languageId: string;
	content: string;
	range: vscode.Range;
	warnings: string[];
	changed: boolean;
};

export const tranformer = (textEditor: vscode.TextEditor) => {
  const document = textEditor.document;
  const selection = textEditor.selection;

  const visibleTextEditors = vscode.window.visibleTextEditors;
  const currentEditor = visibleTextEditors.find((editor) => editor.document.fileName === document.fileName);

  const block = getTextBlock(document, selection);

  const codeToApply = babel.transform(block.content, {
    presets: [env]
  });

  block.content = String(codeToApply?.code);
  

  Promise.resolve().then(async () => {
    if (currentEditor === undefined) {
      vscode.TextEdit.replace(block.range, block.content);
    } else {
      await applyTextBlockToEditor(block, currentEditor);
    }

  });

  vscode.window.showInformationMessage('autoTransformJs!');
};


async function applyTextBlockToEditor(block: TextBlock, editor: vscode.TextEditor): Promise<boolean> {
	return editor.edit((builder) => {
		builder.replace(block.range, block.content);
	});
}

function getTextBlock(document: vscode.TextDocument, selection?: vscode.Selection): TextBlock {
	let range: vscode.Range;
	let content: string;

	if (selection === undefined || selection.isEmpty) {
		const lastLine = document.lineAt(document.lineCount - 1);
		const start = new vscode.Position(0, 0);
		const end = new vscode.Position(document.lineCount - 1, lastLine.text.length);

		range = new vscode.Range(start, end);
		content = document.getText();
	} else {
		range = new vscode.Range(selection.start, selection.end);
		content = document.getText(range);
	}

	return {
		range,
		content,
		languageId: document.languageId,
		warnings: [],
		changed: false
	};
}