// node
const fs = require('fs');
const path = require('path');
const { defaultCpuThreadPool } = require('../out/threadpool/index');

const workerPath = path.resolve(__dirname, '../out/utils/imageMinifyWorker.js');


const writeFile = (path, data) => {
  console.log('Writing file:' + path);
  return new Promise(resolve => {
    const writestream = fs.createWriteStream(path);
    writestream.write(data, () => {
      resolve();
    });
  });
};
const files = [
  '/Users/zhangyongjie/Desktop/work/project/cookies/src/images/bg.png',
  '/Users/zhangyongjie/Desktop/work/project/cookies/src/images/emoji_none.png',
  // "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/icon_download.png",
  // "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/icon_fuzhi.png",
  // "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/icon_share.png",
  // "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/loading.png",
  // "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/login_default_photo.png",
  // "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/logo_s.png",
  // "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/me_jian.png",
  // "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/mission_hongbao.png",
  // "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/poster.png",
  // "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/share_quan.png",
  // "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/share_wx.png",
];
const outputPath = '/Users/zhangyongjie/Desktop/work/project/cookies/images/';
const mini = (src, output) => {
  return new Promise((resolve) => {
    defaultCpuThreadPool.submit(workerPath, { src }).then((worker) => {
      worker.on('done', async (res) => {
        await writeFile(path.join(outputPath, '/', path.basename(src)), res);
        worker.terminate();
        resolve(res);
      });
      worker.on('error', async () => {
        await writeFile(path.join(outputPath, '/', path.basename(src)), fs.readFileSync(src));
        worker.terminate();
        resolve(null);
      });
    });
  });
};

defaultCpuThreadPool.submit(workerPath, { src: files[0] });
defaultCpuThreadPool.submit(workerPath, { src: files[1] });


const ps = [];
files.forEach(item => {
  ps.push(mini(item, outputPath));
});
// Promise.all(ps).then(() => {
//   console.log("okokokokokokokoko");
// });
// setTimeout(function(){
//   defaultCpuThreadPool.submit(workerPath, {src: "/Users/zhangyongjie/Desktop/work/project/cookies/src/images/share_quan.png"});
// }, 10000);
