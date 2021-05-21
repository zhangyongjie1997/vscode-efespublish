import Aigle from 'aigle';
import { readFile } from '@utils/fsUtils';
import { rLessFile } from '@utils/fileRegExps';
import { transformCss } from '@utils/cleancss';
import { parseErrorMessage } from '@parser/shared';

export const parse = async (src: string): Promise<string> => {
  let data = `\n/* SOURCE: ${src.split('src')[1]} */\n`;
  
  let [err, result = ''] = await readFile(src);
  if (err) {
    result = parseErrorMessage(src);
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
  } catch (e) { }

  return data;
}

export const parseAll = async (srcs: string | string[]): Promise<string> => {
  let data = '';
  if (Array.isArray(srcs)) {
    const iterator = Aigle.resolve(srcs).eachSeries(async (src) => {
      if (!src) {
        return '';
      }
  
      const result = await parse(src);
      data += result;
    });
  
    await iterator;
  } else {
    data = await parse(srcs);
  }
  return data;
}