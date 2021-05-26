/* eslint-disable no-empty */
import fs from 'fs';
import Aigle from 'aigle';
import * as path from 'path';
import * as vscode from 'vscode';
import outputer from '@utils/output';
import { ConcatFile } from '@utils/concatFile';
import { ImageMinier } from '@utils/imageMinify';
import { warning, error, info, getSecond } from '@utils/utils';
import { mkdir, findHtmlFiles, writeFile, findImageFiles, findConfigFile, getWorkDir } from '@utils/fsUtils';


const { window } = vscode;


const concatFile = new ConcatFile();

class Publisher {
  private workDir = '';
  private totalFileLength = 2;
  private startTime = 0;
  private publishing = false;
  private concatFileConfig: ConfigData | undefined;

  publish(workDir: string = getWorkDir(vscode.window.activeTextEditor?.document)) {
    this.startTime = Date.now();
    this.totalFileLength = 2;
    this.workDir = workDir;
    if (!this.workDir) {
      this.publishing = false;
      return;
    }
    if (this.publishing) {
      warning('当前有任务正在进行！');
      return;
    }
    this.publishing = true;
    // 进度条
    window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'publishing',
      cancellable: true,
    }, this.handleProgress.bind(this));
  }

  handleCancel() {
    this.publishing = false;
    warning('publish canceled!');
  }

  private async handleProgress(
    progress: vscode.Progress<ProgressMessage>,
    cancellation: vscode.CancellationToken
  ) {
    cancellation.onCancellationRequested(this.handleCancel);
    this.incrementProgress(progress, 0, '正在查找配置文件。。。');

    const config = await this.initConcatFileConfig();

    if (!config?.pkg) {
      error('请检查配置文件是否正确！');
      this.publishing = false;
      return;
    }

    this.incrementProgress(progress, 0, '发现配置文件，开始打包。。。');

    outputer.messageLine('concatFile.json文件内容：');
    outputer.message(JSON.stringify(config));

    const { pkg } = config;
    this.totalFileLength += Object.keys(pkg).length;

    const iterator = Aigle.resolve(pkg).forEachSeries(async (inputs, output) => {
      const data = await concatFile.concatFile({
        inputs,
        output,
        workDir: this.workDir,
      });

      const outputPath = path.join(this.workDir, output);

      await mkdir(outputPath); // 检查发布目录是否存在

      await writeFile(outputPath, data);

      this.incrementProgress(progress, (1 / this.totalFileLength) * 100, `发布${path.basename(output)}`);
      return null;
    });

    await iterator;

    this.incrementProgress(progress, 0, '开始处理html, 图片文件。。。');
    await this.handleHtmlFiles(progress);

    this.incrementProgress(progress, 100, '');
    info(`publish 完成，耗时${getSecond(Date.now() - this.startTime)}s!`);
    this.publishing = false;
    // });
  }

  private async initConcatFileConfig(): Promise<ConfigData> {
    const activeFile = vscode.window.activeTextEditor?.document.fileName;
    if (activeFile) {
      const exits = fs.existsSync(activeFile);

      if (exits) {
        const fileString = fs.readFileSync(activeFile, 'utf8');
        let configData: ConfigData = {};
        if (fileString) {
          try {
            configData = JSON.parse(fileString);
            if (configData.pkg) {
              this.concatFileConfig = configData;
              return configData;
            }
          } catch (e) {}
        }
      }
    }
    this.concatFileConfig = await (await findConfigFile(this.workDir)).config;
    return this.concatFileConfig;
  }

  private async handleHtmlFiles(progress: vscode.Progress<ProgressMessage>) {
    const htmlFileSrcs = findHtmlFiles(path.join(this.workDir, '/src'));

    const iterator = Aigle.resolve(htmlFileSrcs).eachSeries(async (src) => {
      const fileName = path.basename(src);
      const miniHtml = await concatFile.miniHtmlFile(src, this.concatFileConfig.htmlMin);
      await writeFile(path.join(this.workDir, '/', fileName), miniHtml);
      this.incrementProgress(progress, (1 / this.totalFileLength) * 100, `发布${fileName}`);
    });

    await iterator;
    this.incrementProgress(progress, 0, '开始压缩图片');
    await this.handleImageFiles();
  }

  private async handleImageFiles() {
    const imageFileSrcs = findImageFiles(path.join(this.workDir, '/src/images'));
    if (!imageFileSrcs || !this.concatFileConfig.imgMin) {
      return 1;
    }

    const imageMinier = new ImageMinier();
    const outputPath = path.join(this.workDir, '/images/');
    await mkdir(path.join(outputPath, '/__temp__.js')); // 检查发布目录是否存在
    if (typeof this.concatFileConfig!.imgMin !== 'undefined' && !this.concatFileConfig!.img) { // 不压缩图片
      await imageMinier.imageCopy(imageFileSrcs, outputPath);
      return 1;
    }
    await imageMinier.imageMinify(imageFileSrcs, outputPath);
    return 1;
  }


  private incrementProgress(process: vscode.Progress<ProgressMessage>, step = 0, message = '') {
    process.report({
      increment: step,
      message,
    });
  }
}

export { Publisher };
