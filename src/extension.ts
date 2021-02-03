// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import 'module-alias/register'
import * as vscode from 'vscode';
import { tranformer } from './module/transformer';
import { Publisher } from './module/publisher';
import { Watcher, WatcherViewProvider } from './module/watcher';
import { info } from '@utils/utils';

export const activate = (context: vscode.ExtensionContext) => {
  console.log('Congratulations, your extension "vscode-efespublish" is now active!');

  const watcher = new Watcher();
  const publisher = new Publisher();
  const provider = new WatcherViewProvider(context.extensionUri, watcher);

  process.on('uncaughtException', (err) => {
    publisher.handleCancel();
    console.log(`Caught exception: ${ err}`);
  });


  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(WatcherViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  // 注册textEditor可以直接获取当前编辑器
  context.subscriptions.push(vscode.commands.registerCommand('efespublish.publish', () => {
    publisher.publish();
  }));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('efespublish.transformjs', tranformer));
  context.subscriptions.push(vscode.commands.registerCommand('efespublish.watch', async () => {
    if (provider.ready) {
      const newWatcher = await watcher.watch();
      if (newWatcher && newWatcher.path) {
        provider.addWatcher(newWatcher);
      }
    } else {
      info('watcher还没准备好！');
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('efespublish.stopWatch', () => {
    watcher.close();
  }));
};


// this method is called when your extension is deactivated
export function deactivate() { }
