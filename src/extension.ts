// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { tranformer } from "./module/transform";
import { publisher } from "./module/publish";


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export const activate = (context: vscode.ExtensionContext) => {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "autotransformjs" is now active!');

	// 注册textEditor可以直接获取当前编辑器
	context.subscriptions.push(vscode.commands.registerCommand('efespublish.publish', publisher));
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('efespublish.transformjs', tranformer));
};


// this method is called when your extension is deactivated
export function deactivate() {}
