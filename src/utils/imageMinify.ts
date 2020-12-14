import * as fs from "fs";
import * as path from "path";
import miniRequest from "./imageMinifyWorker";
import { writeFile } from "./fsUtils";
import { defaultCpuThreadPool } from "../threadpool/index";

const workerPath = path.resolve(__dirname, "./imageMinifyWorker.js");

export const imageMinify = async (imagePaths: string[], outputPath: string) => {
  const workQueue: Promise<any>[] = [];
  imagePaths.forEach((item) => {
    workQueue.push(mini(item, outputPath));
  });
  return Promise.all.call(Promise, workQueue);
};

const mini = (src: string, outputPath: string) => {
  return new Promise((resolve) => {
    miniRequest({src}).then(async res => {
      await writeFile(path.join(outputPath, "/", path.basename(src)), res);
      resolve(1);
    });
    // defaultCpuThreadPool.submit(workerPath, { src }).then((worker) => {
    //   worker.on("done", async (res) => {
    //     await writeFile(path.join(outputPath, "/", path.basename(src)), res);
    //     worker.terminate();
    //     resolve(res);
    //   });
    //   worker.on("error", async () => {
    //     await writeFile(path.join(outputPath, "/", path.basename(src)), fs.readFileSync(src));
    //     worker.terminate();
    //     resolve(null);
    //   });
    // });
  });
};
