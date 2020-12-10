import * as fs from "fs";
import * as path from "path";
import { rHtmlFile, rImageFile } from "./fileRegExps";


export const mkdir = (url: string) => {
  const pathData = path.parse(url);
  if(!fs.existsSync(pathData.dir)){
    fs.mkdirSync(pathData.dir);
  }
  return;
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
  return new Promise(resolve => {
    const writestream = fs.createWriteStream(path);
    writestream.write(data, () => {
      resolve();
    });
  });
};