import * as fs from "fs";
import * as path from "path";
import {mini as miniRequest} from "./imageMinifyWorker";
import { writeFile } from "./fsUtils";
import { defaultCpuThreadPool } from "../threadpool/index";

const workerPath = path.resolve(__dirname, "./imageMinifyWorker.js");

export const imageMinify = async (imagePaths: string[], outputPath: string) => {
  const workQueue: Promise<void>[] = [];
  imagePaths.forEach((item) => {
    workQueue.push(mini(item, outputPath));
  });
  return Promise.all.call(Promise, workQueue);
};

const mini = async (src: string, outputPath: string) => {
  const res = await miniRequest({src});
  await writeFile(path.join(outputPath, "/", path.basename(src)), res);
};

const copy = async (src: string, outputPath: string) => {
  const data = fs.readFileSync(src);
  await writeFile(path.join(outputPath, "/", path.basename(src)), data);
};

export const imageCopy = async (imagePaths: string[], outputPath: string) => {
  const workQueue: Promise<void>[] = [];
  imagePaths.forEach((item) => {
    workQueue.push(copy(item, outputPath));
  });
  return Promise.all.call(Promise, workQueue);
};
