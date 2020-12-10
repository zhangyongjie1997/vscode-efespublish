import * as path from "path";
import * as fs from "fs";
import Aigle from "aigle";
import { minify } from "terser";
// import postcss from "postcss";
// import * as postcssLess from "postcss-less";
// import * as precss from "precss";
// import * as Autoprefixer from "autoprefixer";
import * as CleanCss from "clean-css";
import * as less from "less";
import * as htmlMinify from "html-minifier";

import { warning, error } from "../utils/utils";
import { rCssFile, rJsFile, rLessFile, rMinFile } from "../utils/fileRegExps";

interface ConcatOptions {
  inputs: Array<PkgItem>
  output: string
  workDir: string
}


const browsersList = [
  "defaults",
  "not ie < 11",
  "last 2 versions",
  "> 1%",
  "iOS 7",
  "last 3 iOS versions"
];


export const concatFile = (options: ConcatOptions): Promise<string> => {
  return new Promise(resolve => {
    const wordDir = options.workDir;
    const output = options.output;
    const srcs = options.inputs.map(function(src) {
      let _root = wordDir;
      let _src = path.join(_root, src);
      if (src.match(/^!/)) { // 处理 minimatch 排除规则
        _src = "!" + path.join(_root, src.replace(/^!/, ''));
      }
  
      if (!src.match(/^!/)) {
        try {
          fs.accessSync(_src);
        } catch (e) {
          warning('文件或目录不存在：' + _src);
          return "";
        }
      }
      return _src;
    });
    if (rCssFile.test(output)){  // css文件
      let data = "";
      const iterator = Aigle.resolve(srcs).eachSeries((src) => {
        return new Promise(resolve => {
          if(!src){
            return resolve();
          }

          data += `\n\n\n/* SOURCE: ${src} */`;

          fs.readFile(src, {encoding: "utf8"}, async (err, fileString = "") => {
            if(err) {
              fileString = "/* 读取失败 */";
              error(`读取文件${src}失败`);
            }

            if(rLessFile.test(src)){
              const lessData = await less.render(fileString);
              fileString = lessData.css || fileString;
            }

            // const cssData = await postcss([precss, Autoprefixer({ "overrideBrowserslist": browsersList })]).process(fileString, {
            //   syntax: postcssLess,
            //   from: undefined,
            // });
            // fileString = cssData.css;


            fileString = new CleanCss({}).minify(fileString).styles;

            data += fileString || "";

            resolve(data);
          });

        });
      });
      iterator.then(() => {
        resolve(data);
      });
    }
    else if(rJsFile.test(output)){  //js文件
      let data = "";
      const iterator = Aigle.resolve(srcs).eachSeries((src) => {
        return new Promise(resolve => {
          if(!src) {
            return resolve();
          }
          data += `\n\n\n/* SOURCE: ${src} */`;
          // const readstream = fs.createReadStream(file, {encoding: "UTF8"});
          // readstream.on("data", (chunk) => {
          //   data += chunk;
          // });
          // readstream.on("end", () => {
          //   resolve(data);
          // });

          fs.readFile(src, {encoding: "utf8"}, async (err, fileString = "") => {
            if(err) {
              fileString = "/* 读取失败 */";
              error(`读取文件${src}失败`);
            }
            if(!rMinFile.test(path.dirname(src))){
              const minifyString = await minify(fileString);
              fileString = minifyString.code || "";
            }
            data += fileString;
            resolve(data);
          });
        });
      });
      iterator.then(() => {
        resolve(data);
      });
    }
  });
};

export const miniHtmlFile = (htmlFileSrc: string): Promise<any> => {
  const miniHtmlConfig = {
    removeComments: true,
    collapseWhitespace: true,
    minifyJS: true,
    minifyCSS: true,
  };
  return new Promise(resolve => {
    fs.readFile(htmlFileSrc, {encoding: "utf8"}, async (err, fileString = "") => {
      if(err) {
        fileString = "/* 读取失败 */";
        error(`读取文件${htmlFileSrc}失败`);
      }
      fileString = htmlMinify.minify(fileString, miniHtmlConfig);
      resolve(fileString);
    });
  });
};