// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { tranformer } from "./module/transformer";
import { Publisher } from "./module/publisher";
import { Watcher, WatcherViewProvider } from "./module/watcher";



export const activate = (context: vscode.ExtensionContext) => {
	console.log('Congratulations, your extension "autotransformjs" is now active!');

	const watcher = new Watcher();
	const publisher = new Publisher();
	const provider = new WatcherViewProvider(context.extensionUri);

	process.on('uncaughtException', function (err) {
		publisher.handleCancel();
		console.log('Caught exception: ' + err);
	});


	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(WatcherViewProvider.viewType, provider));

	// 注册textEditor可以直接获取当前编辑器
	context.subscriptions.push(vscode.commands.registerCommand('efespublish.publish', () => {
		publisher.publish();
	}));
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('efespublish.transformjs', tranformer));
	context.subscriptions.push(vscode.commands.registerCommand('efespublish.watch', async () => {
		const newWatcher = await watcher.watch();
		if(newWatcher.path){
			provider.addWatcher(newWatcher);
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('efespublish.stopWatch', () => {
		watcher.stop();
	}));
};


// this method is called when your extension is deactivated
export function deactivate() { }
