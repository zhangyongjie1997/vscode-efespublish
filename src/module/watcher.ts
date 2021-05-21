import * as vscode from 'vscode';
import * as path from 'path';
import { FSWatcher } from 'chokidar';
import { Base } from '@utils/base';
import { Publisher } from './publisher';
import { ConcatFile } from '@utils/concatFile';
import { ImageMinier } from '@utils/imageMinify';
import { error, info, warning } from '@utils/utils';
import { rCssFile, rHtmlFile, rImageFile, rJsFile, rLessFile } from '@utils/fileRegExps';
import { findConfigFile, getWorkDir, mkdir, writeFile, getWorkDirByFile, findPkgByFile } from '@utils/fsUtils';

interface IWatcherOptions {
  path: string;
  root: string;
  workDir: string;
  concatFileConfig: ConfigData;
  [key: string]: string | ConfigData;
}

const { window } = vscode;
const concatFile = new ConcatFile();

function updateInfo(target, property, descriptor) {
  const func: Function = descriptor.value;
  descriptor.value = async function (file) {
    try {
      await func.call(this, file);
      info(`更新「${path.basename(file)}」`);
    } catch (e) {
      warning(`更新「${path.basename(file)}」失败`);
    }
  };
}

class Watcher extends Base {
  private readonly _defaultWatchSrc = 'src';
  private readonly _pkgCatcher = new Map<string, ConcatOptions>();
  private _fsWatcher: FSWatcher = new FSWatcher();
  private _watchers = new Map<string, IWatcherOptions>();

  constructor() {
    super();
    this._fsWatcher.on('change', (file) => {
      this.handleFileChange(file);
    });
    this._fsWatcher.on('add', (file) => {
      this.handleFileCreate(file);
    });
  }

  close() {
    this._fsWatcher.close();
    this._watchers.clear();
    this._pkgCatcher.clear();
  }

  stop(filepath: string) {
    if (this._watchers.size === 0) {
      warning('watch未开始！');
      return;
    }
    if (this._watchers.has(filepath)) {
      this._fsWatcher.unwatch(filepath);
      this._watchers.delete(filepath);
    }
  }

  async watch(): Promise<IWatcherOptions | undefined> {
    const _workDir = getWorkDir(window.activeTextEditor?.document);

    const { config: concatFileConfig } = await findConfigFile(_workDir);

    if (!concatFileConfig) {
      warning('请检查配置文件是否正确！');
      return;
    }

    const _watchPath = this._getWatchPath(_workDir, concatFileConfig);

    if (this._watchers.has(_watchPath)) {
      error('当前目录已经添加');
      return;
    }
    this._fsWatcher.add(_watchPath);
    const newWatcher: IWatcherOptions = {
      path: _watchPath,
      root: concatFileConfig.src || this._defaultWatchSrc,
      workDir: _workDir,
      concatFileConfig,
    };
    this._watchers.set(_watchPath, newWatcher);
    return newWatcher;
  }

  private _getWatchPath(workDir: string, concatFileConfig: ConfigData): string {
    return this.path.resolve(workDir, concatFileConfig.src || this._defaultWatchSrc);
  }

  get watchers() {
    return this._watchers;
  }


  private handleFileChange(file: string) {
    switch (true) {
      case rJsFile.test(file):
        this.handleJsOrStyleFileChange(file);
        break;
      case rLessFile.test(file):
      case rCssFile.test(file):
        this.handleJsOrStyleFileChange(file);
        break;
      case rHtmlFile.test(file):
        this.handleHtmlFileChange(file);
        break;
      default: break;
    }
  }

  private async handleFileCreate(file: string) {
    switch (true) {
      case rHtmlFile.test(file):
        this.handleHtmlFileChange(file);
        break;
      case rImageFile.test(file):
        this.handleImageFile(file);
        break;
      default: break;
    }
  }

  @updateInfo
  private async handleImageFile(file: string) {
    const workDir = getWorkDirByFile(file)!;
    const imageMinier = new ImageMinier();
    const outputPath = this.path.join(workDir, '/images/');
    await mkdir(this.path.join(outputPath, '/__temp__.js'));
    await imageMinier.copy(file, outputPath);
  }

  @updateInfo
  private async handleHtmlFileChange(file: string) {
    const data = await concatFile.miniHtmlFile(file);
    const fileName = this.path.basename(file);
    const workDir = getWorkDirByFile(file)!;
    await writeFile(this.path.join(workDir, '/', fileName), data);
  }

  @updateInfo
  private async handleJsOrStyleFileChange(file: string) {
    let options = this._pkgCatcher.get(file)!;

    if (!options) {
      options = await findPkgByFile(file);
      this._pkgCatcher.set(file, options);
    }

    const data = await concatFile.concatFile(options);
    const outputPath = this.path.join(options.workDir, options.output);
    await mkdir(outputPath); // 检查发布目录是否存在
    await writeFile(outputPath, data);
  }


  // 找到文件所在的pkg
  private async findPkg(file: string): Promise<ConcatOptions> {
    let options = this._pkgCatcher.get(file)!;
    if (options) {
      return options;
    }

    options = {
      inputs: [],
      workDir: '',
      output: '',
    };

    const workDir = getWorkDirByFile(file)!;

    options.workDir = workDir;

    const { config } = await findConfigFile(workDir);

    Object.keys(config.pkg!).find((key) => {
      const value = config.pkg![key];

      return value.some((item) => {
        const fullPath = this.path.resolve(workDir, item);
        options = {
          output: key,
          inputs: value,
          workDir: '',
        };
        return fullPath === file;
      });
    });


    this._pkgCatcher.set(file, options);
    return options;
  }
}

class WatcherViewProvider extends Base implements vscode.WebviewViewProvider {
  static readonly viewType = 'efeswatcher.configWatcher';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _watcher: Watcher,
  ) {
    super();
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    // context: vscode.WebviewViewResolveContext,
    // _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri,
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case 'stopWatcher':
          this._watcher.stop(data.data);
          break;
        case 'publish':
          this._publish(data.data);
          break;
        default: break;
      }
    });
  }

  get ready() {
    return !!this._view;
  }

  addWatcher(newWatcher: IWatcherOptions) {
    newWatcher.name = this.path.parse(newWatcher.workDir).name;

    if (this._view) {
      this._view.show?.(true);
      this._view.webview.postMessage({
        type: 'addWatcher',
        data: newWatcher,
      });
    }
  }

  clearWatcher() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'clearWatcher' });
    }
  }

  private _publish(workDir) {
    const publisher = new Publisher();
    publisher.publish(workDir);
  }

  private _updateWatcher(watchers: IterableIterator<IWatcherOptions>) {
    const watcherArray = Array.from(watchers);
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateWatcher',
        data: watcherArray,
      });
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
        <ul id="watcher-list" class="watcher-list">
        </ul>
            <script nonce="${nonce}" src="${scriptUri}"></script>
         </body>
         </html>`;
  }
}

export { Watcher, WatcherViewProvider };
