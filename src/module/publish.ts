import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import Aigle from "aigle";
import { concatFile, miniHtmlFile } from "../utils/concatFile";
import findConfigFile from "../utils/findConfigFile";
import { mkdir, findHtmlFiles, writeFile, findImageFiles } from "../utils/fsUtils";
import { warning, error } from "../utils/utils";
import { imageMinify } from "../utils/imageMinify";

const window = vscode.window;
let workDir = "", totalFileLength = 2; // 项目根目录&配置文件所在目录
let publishing = false;

process.on('uncaughtException', function(err) {
  publishing = false;
  console.log('Caught exception: ' + err);
});

export const publisher = async () => {
  const document = vscode.window.activeTextEditor?.document;
  if(!document){
    error("请打开配置文件后执行命令！");
    return publishing = false;
  }
  workDir = path.parse(document.fileName).dir;
  if(publishing) {
    warning("当前有任务正在进行！");
    return;
  }
  publishing = true;
  //进度条
  window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "publishing!",
    cancellable: true
  }, handleProgress);
};


const handleProgress = async (progress: vscode.Progress<ProgressMessage>, cancellation: vscode.CancellationToken) => {
  cancellation.onCancellationRequested(handleCancel);
  let currentProgress = 0;  // html, image
  incrementProgress(progress, 0, "正在查找配置文件。。。");
  
  return new Promise(async resolve => {

    const { config } = await findConfigFile(workDir);

    if(!config?.pkg){
      error("请检查配置文件是否正确！");
      publishing = false;
      return resolve();
    }

    incrementProgress(progress, 0, "发现配置文件，开始打包。。。");

    const pkg = config.pkg;
    console.log(totalFileLength);
    totalFileLength += Object.keys(pkg).length;
    const iterator = Aigle.resolve(pkg).forEachSeries((inputs, output) => {
      return new Promise(async resolve => {
        const data = await concatFile({
          inputs: inputs,
          output: output,
          workDir: workDir,
        });

        const outputPath = path.join(workDir, output);

        await mkdir(outputPath);  // 检查发布目录是否存在

        await writeFile(outputPath, data);

        incrementProgress(progress, (1/totalFileLength) * 100, `发布${path.basename(output)}`);
        resolve();

        // const buf = Buffer.from(data);
        // fs.writeFile(outputPath, buf, { encoding: "utf8" }, () => {
        //   resolve();
        // });
      });
    });
    iterator.then(() => {  //开始处理html, images
      incrementProgress(progress, 0, "开始处理html, 图片文件。。。");
      handleHtmlFiles(progress);
    });
  });
};

const handleHtmlFiles = (progress: vscode.Progress<ProgressMessage>) => {
  const htmlFileSrcs = findHtmlFiles(path.join(workDir, "/src"));
  const iterator = Aigle.resolve(htmlFileSrcs).eachSeries(async src => {
    const fileName = path.basename(src);
    const miniHtml = await miniHtmlFile(src);
    await writeFile(path.join(workDir, "/", fileName), miniHtml);
    incrementProgress(progress, (1/totalFileLength) * 100, `发布${fileName}`);
    return;
  });
  iterator.then(() => {
    incrementProgress(progress, 0, `开始压缩图片`);
    handleImageFiles(progress);
  });
};

const handleImageFiles = (progress: vscode.Progress<ProgressMessage>) => {
  const imageFileSrcs = findImageFiles(path.join(workDir, "/src/images"));
  imageMinify(imageFileSrcs);
};


const incrementProgress = (process: vscode.Progress<ProgressMessage>, step: number = 0, message: string = "") => {
  process.report({
    increment: step,
    message: message
  });
};

const handleCancel = () => {
  warning("publish canceled!");
};