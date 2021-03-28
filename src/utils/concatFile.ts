import Aigle from 'aigle';
import { minify } from 'terser';
import less from 'less';
import { minify as htmlMinify } from 'html-minifier';
import { Base } from '@utils/base';
import { transformCss } from './cleancss'
import { warning, error } from '@utils/utils';
import { rCssFile, rJsFile, rLessFile, rMinFile } from '../utils/fileRegExps';



class ConcatFile extends Base {
  concatFile(options: ConcatOptions): Promise<string> {
    return new Promise((resolve) => {
      const wordDir = options.workDir;

      const { output } = options;

      const srcs = options.inputs.map((src) => {
        const _root = wordDir;

        let _src = this.path.join(_root, src);

        if (src.match(/^!/)) { // 处理 minimatch 排除规则
          _src = `!${this.path.join(_root, src.replace(/^!/, ''))}`;
        }

        if (!src.match(/^!/)) {
          try {
            this.fs.accessSync(_src);
          } catch (e) {
            warning(`文件或目录不存在：${_src}`);
            return '';
          }
        }

        return _src;
      });

      if (rCssFile.test(output)) { // css文件
        let data = '';

        const iterator = Aigle.resolve(srcs).eachSeries((src) => {
          return new Promise((resolve2, reject) => {
            if (!src) {
              return resolve2(1);
            }

            data += `\n/* SOURCE: ${src} */\n`;

            this.fs.readFile(src, { encoding: 'utf8' }, async (err, fileString = '') => {
              let result = fileString;
              if (err) {
                result = '/* 读取失败 */';
                error(`读取文件${src}失败`);
              }

              try {
                if (rLessFile.test(src)) {
                  const lessData = await less.render(result, {
                    compress: false,
                    filename: src,
                  });

                  if (lessData.css) {
                    result = lessData.css;
                  }
                }

                // const cssData = await postcss([precss, Autoprefixer({ "overrideBrowserslist": browsersList })]).process(fileString, {
                //   syntax: postcssLess,
                //   from: undefined,
                // });
                // fileString = cssData.css;


                result = transformCss(result).styles || ''; // rebase false 不处理image路径
              } catch (e) {
                return reject(e);
              }

              data += result || '';

              resolve(data);
            });
          });
        });

        iterator.then(() => {
          resolve(data);
        });
      } else if (rJsFile.test(output)) { // js文件
        let data = '';

        const iterator = Aigle.resolve(srcs).eachSeries((src) => {
          return new Promise((resolve2) => {
            if (!src) {
              return resolve2(1);
            }
            data += `\n/* SOURCE: ${src} */\n`;
            // const readstream = fs.createReadStream(file, {encoding: "UTF8"});
            // readstream.on("data", (chunk) => {
            //   data += chunk;
            // });
            // readstream.on("end", () => {
            //   resolve(data);
            // });

            this.fs.readFile(src, { encoding: 'utf8' }, async (err, fileString = '') => {
              let result = fileString;
              if (err) {
                result = '/* 读取失败 */';
                error(`读取文件${src}失败`);
              }
              if (!rMinFile.test(this.path.dirname(src))) {
                const minifyString = await minify(result);
                result = minifyString.code || '';
              }
              data += result;
              resolve2(data);
            });
          });
        });
        iterator.then(() => {
          resolve(data);
        });
      }
    });
  }
  miniHtmlFile(htmlFileSrc: string): Promise<string> {
    const miniHtmlConfig = {
      removeComments: true,
      collapseWhitespace: true,
      minifyJS: true,
      minifyCSS: true,
    };
    return new Promise((resolve) => {
      this.fs.readFile(htmlFileSrc, { encoding: 'utf8' }, async (err, fileString = '') => {
        let resultString = fileString;
        if (err) {
          resultString = '/* 读取失败 */';
          error(`读取文件${htmlFileSrc}失败`);
        }
        resultString = htmlMinify(resultString, miniHtmlConfig);
        resolve(resultString);
      });
    });
  }
}

export { ConcatFile };
