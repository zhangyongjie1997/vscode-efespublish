import * as fs from "fs";
import * as path from "path";
import { TextDocument } from "vscode";
import { rHtmlFile, rImageFile } from "./fileRegExps";
import { error } from "./utils";


export const mkdir = async (url: string) => {
  return new Promise(resolve => {
    const pathData = path.parse(url);
    console.info("mkdir:" + pathData.dir);
    if(!fs.existsSync(pathData.dir)){
      fs.mkdir(pathData.dir, () => {
        resolve(1);
      });
    }
    resolve(1);
  });
};

export const findHtmlFiles = (sourcePath: string): string[] => {
  const dir = fs.readdirSync(sourcePath);
  const htmlFilePaths: string[] = [];
  dir.forEach(item => {
    if(rHtmlFile.test(item)){
      htmlFilePaths.push(path.join(sourcePath, "/", item));
    }
  });
  return htmlFilePaths;
};

export const findImageFiles = (sourcePath: string): string[] => {
  if(!fs.existsSync(sourcePath)) {
    return null;
  }
  const dir = fs.readdirSync(sourcePath);
  const imageFilePaths: string[] = [];
  dir.forEach(item => {
    if(rImageFile.test(item)){
      imageFilePaths.push(path.resolve(sourcePath, item));
    }
  });
  return imageFilePaths;
};

export const writeFile = (path: string, data: any): Promise<void> => {
  console.log("Writing file:" + path);
  return new Promise(resolve => {
    const writestream = fs.createWriteStream(path);
    writestream.write(data, () => {
      resolve();
    });
  });
};

const CONFIG_FILE_NAME = "concatfile.json";
const find = (baseUrl: string): {
  config?: ConfigData,
  configFilePath?: string
} => {
  const filePath = path.join(baseUrl, "/", CONFIG_FILE_NAME);
  const exits = fs.existsSync(filePath);
  if(exits){
    let fileData = fs.readFileSync(filePath, "utf8"), configData: AnyObject = {};
    if(fileData){
      try {
        configData = JSON.parse(fileData);
      } catch (error) { configData = {}; }
    }
    return {config: configData, configFilePath: filePath};
  }
  return {};
};

/**
 * 
 * @param basePath 开始查找的目录
 * @TODO 从当前目录开始逐层向上查找
 */
export const findConfigFile = async (basePath: string): Promise<{
  config?: ConfigData,
  configFilePath?: string
}>  => {
  return find(basePath);
};


export const getWorkDir = (document?: TextDocument): string => {
  if(document){
    return path.parse(document.fileName).dir;
  }else{
    error("请打开配置文件后执行命令！");
    return "";
  }
};