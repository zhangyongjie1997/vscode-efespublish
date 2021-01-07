import {mini as miniRequest} from "./imageMinifyWorker";
import {writeFile} from "./fsUtils";
import {Base} from "./base";

class ImageMinier extends Base {
  async mini(src: string, outputPath: string) {
    const res = await miniRequest({src});
    await writeFile(this.path.join(outputPath, "/", this.path.basename(src)), res);
  };

  async imageMinify(imagePaths: string[], outputPath: string) {
    const workQueue: Promise<void>[] = [];
    imagePaths.forEach((item) => {
      workQueue.push(this.mini(item, outputPath));
    });
    return Promise.all.call(Promise, workQueue);
  }

  async copy (src: string, outputPath: string) {
    const data = this.fs.readFileSync(src);
    await writeFile(this.path.join(outputPath, "/", this.path.basename(src)), data);
  }

  async imageCopy (imagePaths: string[], outputPath: string) {
    const workQueue: Promise<void>[] = [];
    imagePaths.forEach((item) => {
      workQueue.push(this.copy(item, outputPath));
    });
    return Promise.all.call(Promise, workQueue);
  }
}

export {ImageMinier};
