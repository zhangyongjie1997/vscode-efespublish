import * as fs from "fs";
import * as path from "path";
import { rHtmlFile, rImageFile } from "./fileRegExps";


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