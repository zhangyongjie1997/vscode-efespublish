import * as vscode from "vscode";
import { Base } from "../utils/base";
import { findConfigFile, getWorkDir, mkdir, writeFile } from "../utils/fsUtils";
import { info, warning } from "../utils/utils";
import {FSWatcher} from "chokidar";
import { rCssFile, rJsFile, rLessFile } from "../utils/fileRegExps";
import {ConcatFile} from "../utils/concatFile";

const window = vscode.window;

class Watcher extends Base{
  private watching: vscode.Disposable = null;
  private workDir: string = "";
  private concatFileConfig: ConfigData = {};
  private defaultWatchSrc = "src";
  private watchPath = "";
  private fsWatcher: FSWatcher = new FSWatcher();
  private output: vscode.OutputChannel = window.createOutputChannel("efesWatcher");
  private concatFile: ConcatFile = new ConcatFile();
  async watch() {
    if(this.watching) {
      warning("watch 正在运行！");
      return;
    }
    this.watching = window.setStatusBarMessage("efes watching");
    this.workDir = getWorkDir(window.activeTextEditor?.document);
    const { config } = await findConfigFile(this.workDir);
    this.concatFileConfig = config;
    if(!config) {
      this.watching = null;
      return warning("请检查配置文件是否正确！");
    }
    this.watchPath = this.path.resolve(this.workDir, this.concatFileConfig.src || this.defaultWatchSrc);
    this.fsWatcher.add(this.watchPath);
    this.fsWatcher.on("change", (file) => {
      this.handleFileChange(file);
    });
    this.fsWatcher.on("add", (file) => {
      this.handleFileCreate(file);
    });
  }
  private handleFileCreate(file: string){
    
  }
  private handleFileChange(file: string){
    switch(true){
      case rJsFile.test(file):
        this.handleJsFileChange(file);
        break;
      case rLessFile.test(file):
      case rCssFile.test(file):
        this.handleStyleFileChange(file);
        break;
    }
  }
  private async handleJsFileChange(file: string){
    const options = this.findPkg(file);
    const data = await this.concatFile.concatFile(options);
    const outputPath = this.path.join(this.workDir, options.output);
    await mkdir(outputPath);  // 检查发布目录是否存在
    await writeFile(outputPath, data);
    info(`更新「${options.output}」`);
  }
  private async handleStyleFileChange(file: string){
    const options = this.findPkg(file);
    const data = await this.concatFile.concatFile(options);
    const outputPath = this.path.join(this.workDir, options.output);
    await mkdir(outputPath);  // 检查发布目录是否存在
    await writeFile(outputPath, data);
    info(`更新「${options.output}」`);
  }
  private findPkg(file: string): ConcatOptions {
    let options;
    Object.keys(this.concatFileConfig.pkg).find(key => {
      const value = this.concatFileConfig.pkg[key];
      return value.some(item => {
        const fullPath = this.path.resolve(this.workDir, item);
        options = {
          output: key,
          inputs: value
        };
        return fullPath === file;
      });
    });
    options.workDir = this.workDir;
    return options;
  }
  stop() {
    if(!this.watching) {
      warning("watch未开始！");
      return;
    }
    this.watching.dispose();
    this.watching = null;
    this.fsWatcher.close();
  }
}

export {Watcher};