import * as vscode from "vscode";
import * as path from "path";
import Aigle from "aigle";
import { ConcatFile } from "../utils/concatFile";
import { mkdir, findHtmlFiles, writeFile, findImageFiles, findConfigFile, getWorkDir } from "../utils/fsUtils";
import { warning, error, info, getSecond } from "../utils/utils";
import { ImageMinier } from "../utils/imageMinify";

const window = vscode.window;
const concatFile = new ConcatFile();

// process.on('uncaughtException', function(err) {
//   publishing = false;
//   console.log('Caught exception: ' + err);
// });

class Publisher{
  private workDir: string = "";
  private totalFileLength: number = 2;
  private startTime: number = 0;
  private publishing: boolean = false;
  private concatFileConfig: AnyObject = null;
  private topResolve: Function = null;

  public publish(workDir?: string){
    this.startTime = Date.now();
    this.totalFileLength = 2;
    this.workDir = workDir || getWorkDir(vscode.window.activeTextEditor?.document);
    if(!this.workDir){
      return this.publishing = false;
    }
    if(this.publishing) {
      warning("当前有任务正在进行！");
      return;
    }
    this.publishing = true;
    //进度条
    window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "publishing",
      cancellable: true
    }, this.handleProgress.bind(this));
  }

  private handleProgress (progress: vscode.Progress<ProgressMessage>, cancellation: vscode.CancellationToken){
    cancellation.onCancellationRequested(this.handleCancel);
    this.incrementProgress(progress, 0, "正在查找配置文件。。。");
    
    return new Promise(async topResolve => {

      this.topResolve = topResolve;
  
      const { config } = await findConfigFile(this.workDir);
  
      this.concatFileConfig = config;
  
      if(!config?.pkg){
        error("请检查配置文件是否正确！");
        this.publishing = false;
        return this.topResolve(null);
      }
  
      this.incrementProgress(progress, 0, "发现配置文件，开始打包。。。");
  
      const pkg = config.pkg;
      this.totalFileLength += Object.keys(pkg).length;
      const iterator = Aigle.resolve(pkg).forEachSeries(async (inputs, output) => {
        const data = await concatFile.concatFile({
          inputs: inputs,
          output: output,
          workDir: this.workDir,
        });
  
        const outputPath = path.join(this.workDir, output);
  
        await mkdir(outputPath);  // 检查发布目录是否存在
  
        await writeFile(outputPath, data);
  
        this.incrementProgress(progress, (1/this.totalFileLength) * 100, `发布${path.basename(output)}`);
        return null;
  
        // const buf = Buffer.from(data);
        // fs.writeFile(outputPath, buf, { encoding: "utf8" }, () => {
        //   resolve();
        // });
      });
      iterator.then(() => {  //开始处理html, images
        this.incrementProgress(progress, 0, "开始处理html, 图片文件。。。");
        this.handleHtmlFiles(progress);
      }).catch(e => {
        console.error(e);
      });
    });
  }

  private handleHtmlFiles(progress: vscode.Progress<ProgressMessage>) {
    const htmlFileSrcs = findHtmlFiles(path.join(this.workDir, "/src"));
    const iterator = Aigle.resolve(htmlFileSrcs).eachSeries(async src => {
      const fileName = path.basename(src);
      const miniHtml = await concatFile.miniHtmlFile(src);
      await writeFile(path.join(this.workDir, "/", fileName), miniHtml);
      this.incrementProgress(progress, (1/this.totalFileLength) * 100, `发布${fileName}`);
      return;
    });
    iterator.then(async () => {
      this.incrementProgress(progress, 0, `开始压缩图片`);
      await this.handleImageFiles(progress);
      this.incrementProgress(progress, 100, "");
      info(`publish 完成，耗时${getSecond(Date.now() - this.startTime)}s!`);
      this.publishing = false;
    });
  };

  private async handleImageFiles (progress: vscode.Progress<ProgressMessage>) {
    const imageFileSrcs = findImageFiles(path.join(this.workDir, "/src/images"));
    if(!imageFileSrcs) {
      return this.topResolve(1);
    }

    const imageMinier = new ImageMinier(), 
      outputPath = path.join(this.workDir, "/images/");
    await mkdir(path.join(outputPath, "/temp.js"));  // 检查发布目录是否存在
    if(typeof this.concatFileConfig.imgMin !== "undefined" && !this.concatFileConfig.img){  // 不压缩图片
      await imageMinier.imageCopy(imageFileSrcs, outputPath);
      this.topResolve(1);
      return 1;
    }
    await imageMinier.imageMinify(imageFileSrcs, outputPath);
    this.topResolve(1);
    return 1;
  }

  public handleCancel() {
    this.publishing = false;
    warning("publish canceled!");
  }

  private incrementProgress(process: vscode.Progress<ProgressMessage>, step: number = 0, message: string = "") {
    process.report({
      increment: step,
      message: message
    });
  }
}

export {Publisher};
