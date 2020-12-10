import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { writeFile } from "./fsUtils";
import { defaultThreadPool } from "../threadpool/index";

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
    defaultThreadPool.submit(workerPath, { src }).then((worker) => {
      worker.on("done", async (res) => {
        await writeFile(path.join(outputPath, "/", path.basename(src)), res);
        resolve(res);
      });
      worker.on("error", async () => {
        await writeFile(path.join(outputPath, "/", path.basename(src)), fs.readFileSync(src));
        resolve(null);
      });
    });
  });
};

// const files = [
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/bg.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/emoji_none.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/icon_download.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/icon_fuzhi.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/icon_share.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/loading.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/login_default_photo.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/logo_s.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/me_jian.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/mission_hongbao.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/poster.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/share_quan.png",
//   "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/share_wx.png",
// ];

// const out = "/Users/zhangyongjie/Desktop/work/project/cookies/images";

// imageMinify(files, out);
