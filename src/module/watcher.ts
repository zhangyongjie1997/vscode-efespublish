import * as vscode from "vscode";
import { FSWatcher } from "chokidar";
import { Base } from "../utils/base";
import { findConfigFile, getWorkDir, mkdir, writeFile } from "../utils/fsUtils";
import { error, info, warning } from "../utils/utils";
import { rCssFile, rJsFile, rLessFile } from "../utils/fileRegExps";
import { ConcatFile } from "../utils/concatFile";
import { ENGINE_METHOD_DIGESTS } from "constants";

interface IWatcherOptions {
  path: string;
  root: string;
}

const window = vscode.window;
const concatFile = new ConcatFile();

class Watcher extends Base {
  private _workDir: string = "";
  private _concatFileConfig: ConfigData = {};
  private readonly _defaultWatchSrc = "src";
  private _fsWatcher: FSWatcher = new FSWatcher();
  private output: vscode.OutputChannel = window.createOutputChannel("efesWatcher");
  private _watchers = new Map<string, IWatcherOptions>();

  constructor() {
    super();
    this._fsWatcher.on("change", (file) => {
      this.handleFileChange(file);
    });
    this._fsWatcher.on("add", (file) => {
      this.handleFileCreate(file);
    });
  }

  async watch(): Promise<IWatcherOptions> {
    this._workDir = getWorkDir(window.activeTextEditor?.document);
    const { config } = await findConfigFile(this._workDir);
    this._concatFileConfig = config;
    if (!config) {
      warning("请检查配置文件是否正确！");
      return {} as IWatcherOptions;
    }
    const _watchPath = this.path.resolve(this._workDir, this._concatFileConfig.src || this._defaultWatchSrc);
    if (this._watchers.has(_watchPath)) {
      error("当前目录已经添加");
      return {} as IWatcherOptions;
    }
    this._fsWatcher.add(_watchPath);
    const newWatcher: IWatcherOptions = {
      path: _watchPath,
      root: this._concatFileConfig.src || this._defaultWatchSrc
    };
    this._watchers.set(_watchPath, newWatcher);
    return newWatcher;
  }

  public get watchers() {
    return this._watchers;
  }

  private handleFileCreate(file: string) {

  }

  private handleFileChange(file: string) {
    switch (true) {
      case rJsFile.test(file):
        this.handleJsFileChange(file);
        break;
      case rLessFile.test(file):
      case rCssFile.test(file):
        this.handleStyleFileChange(file);
        break;
    }
  }

  private async handleJsFileChange(file: string) {
    const options = this.findPkg(file);
    const data = await concatFile.concatFile(options);
    const outputPath = this.path.join(this._workDir, options.output);
    await mkdir(outputPath);  // 检查发布目录是否存在
    await writeFile(outputPath, data);
    info(`更新「${options.output}」`);
  }

  private async handleStyleFileChange(file: string) {
    const options = this.findPkg(file);
    const data = await concatFile.concatFile(options);
    const outputPath = this.path.join(this._workDir, options.output);
    await mkdir(outputPath);  // 检查发布目录是否存在
    await writeFile(outputPath, data);
    info(`更新「${options.output}」`);
  }

  private findPkg(file: string): ConcatOptions {
    let options;
    Object.keys(this._concatFileConfig.pkg).find(key => {
      const value = this._concatFileConfig.pkg[key];
      return value.some(item => {
        const fullPath = this.path.resolve(this._workDir, item);
        options = {
          output: key,
          inputs: value
        };
        return fullPath === file;
      });
    });
    options._workDir = this._workDir;
    return options;
  }

  public stop() {
    if (this._watchers.size === 0) {
      warning("watch未开始！");
      return;
    }
    this._fsWatcher.close();
  }
}

class WatcherViewProvider implements vscode.WebviewViewProvider {

  public static readonly viewType = 'efeswatcher.configWatcher';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        this._extensionUri
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(data => {
      info("1");
      switch (data.type) {
        case 'stopWatcher':
          {
            info("stopwa");
            break;
          }
      }
    });
  }

  public addWatcher(newWatcher: IWatcherOptions){
    if(this._view){
      this._view.show?.(true);
      this._view.webview.postMessage({
        type: "addWatcher",
        data: JSON.stringify(newWatcher)
      });
    }
  }

  public updateWatcher(watchers: IterableIterator<IWatcherOptions>){
    const watcherArray = Array.from(watchers);
    if(this._view){
      this._view.webview.postMessage({
        type: "updateWatcher",
        data: watcherArray
      });
    }
  }

  public clearWatcher() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'clearWatcher' });
    }
  }

  private _getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

    // Use a nonce to only allow a specific script to be run.
    const nonce = this._getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>Watcher</title>
			</head>
      <body>
        <div id="message" class="watcher-path"></div>
        <ul class="watcher-list">
          <li class="watcher-entry">
            <span class="watcher-input" alt="/Users/zhangyongjie/Desktop/work/project/">
              cookies
            </span>
            <button id="btn" class="watcher-btn" alt="click to stop watching">stop</button>
          </li>
        </ul>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

export { Watcher, WatcherViewProvider };