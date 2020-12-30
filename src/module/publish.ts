import * as vscode from "vscode";
import * as path from "path";
import Aigle from "aigle";
import { concatFile, miniHtmlFile } from "../utils/concatFile";
import findConfigFile from "../utils/findConfigFile";
import { mkdir, findHtmlFiles, writeFile, findImageFiles } from "../utils/fsUtils";
import { warning, error, info } from "../utils/utils";
import { imageMinify, imageCopy } from "../utils/imageMinify";

const window = vscode.window;
let workDir = "", totalFileLength = 2, startTime: number = 0; // 项目根目录&配置文件所在目录
let publishing = false, concatFileConfig = null;

process.on('uncaughtException', function(err) {
  publishing = false;
  console.log('Caught exception: ' + err);
});

export const publisher = async () => {
  startTime = Date.now();
  totalFileLength = 2;
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


const handleProgress = (progress: vscode.Progress<ProgressMessage>, cancellation: vscode.CancellationToken) => {
  cancellation.onCancellationRequested(handleCancel);
  let currentProgress = 0;  // html, image
  incrementProgress(progress, 0, "正在查找配置文件。。。");
  
  return new Promise(async topResolve => {

    const { config } = await findConfigFile(workDir);

    concatFileConfig = config;

    if(!config?.pkg){
      error("请检查配置文件是否正确！");
      publishing = false;
      return topResolve(null);
    }

    incrementProgress(progress, 0, "发现配置文件，开始打包。。。");

    const pkg = config.pkg;
    totalFileLength += Object.keys(pkg).length;
    const iterator = Aigle.resolve(pkg).forEachSeries(async (inputs, output) => {
      const data = await concatFile({
        inputs: inputs,
        output: output,
        workDir: workDir,
      });

      const outputPath = path.join(workDir, output);

      await mkdir(outputPath);  // 检查发布目录是否存在

      await writeFile(outputPath, data);

      incrementProgress(progress, (1/totalFileLength) * 100, `发布${path.basename(output)}`);
      return null;

      // const buf = Buffer.from(data);
      // fs.writeFile(outputPath, buf, { encoding: "utf8" }, () => {
      //   resolve();
      // });
    });
    iterator.then(() => {  //开始处理html, images
      incrementProgress(progress, 0, "开始处理html, 图片文件。。。");
      handleHtmlFiles(progress, topResolve);
    });
  });
};

const handleHtmlFiles = (progress: vscode.Progress<ProgressMessage>, topResolve) => {
  const htmlFileSrcs = findHtmlFiles(path.join(workDir, "/src"));
  const iterator = Aigle.resolve(htmlFileSrcs).eachSeries(async src => {
    const fileName = path.basename(src);
    const miniHtml = await miniHtmlFile(src);
    await writeFile(path.join(workDir, "/", fileName), miniHtml);
    incrementProgress(progress, (1/totalFileLength) * 100, `发布${fileName}`);
    return;
  });
  iterator.then(async () => {
    incrementProgress(progress, 0, `开始压缩图片`);
    await handleImageFiles(progress, topResolve);
    incrementProgress(progress, 100, "");
    info(`publish 完成，耗时${getSecond(Date.now() - startTime)}s!`);
    publishing = false;
  });
};

const getSecond = (m: number): string => {
  console.log(m);
  return (m/1000).toFixed(2).toString();
};

const handleImageFiles = async (progress: vscode.Progress<ProgressMessage>, topResolve) => {
  const imageFileSrcs = findImageFiles(path.join(workDir, "/src/images"));
  if(!imageFileSrcs) {
    return topResolve(1);
  }
  const outputPath = path.join(workDir, "/images/");
  await mkdir(path.join(outputPath, "/temp.js"));  // 检查发布目录是否存在
  if(typeof concatFileConfig.imgMin !== "undefined" && !concatFileConfig.img){  // 不压缩图片
    await imageCopy(imageFileSrcs, outputPath);
    topResolve(1);
    return 1;
  }
  await imageMinify(imageFileSrcs, outputPath);
  topResolve(1);
  return 1;
};


const incrementProgress = (process: vscode.Progress<ProgressMessage>, step: number = 0, message: string = "") => {
  process.report({
    increment: step,
    message: message
  });
};

const handleCancel = () => {
  publishing = false;
  warning("publish canceled!");
};