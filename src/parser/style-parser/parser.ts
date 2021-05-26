import Aigle from 'aigle';
import { readFile } from '@utils/fsUtils';
import { rLessFile, rMinFile } from '@utils/fileRegExps';
import { transformCss } from '@utils/cleancss';
import { parseErrorMessage } from '@parser/shared';
import less from 'less';

export const parse = async (src: string): Promise<string> => {
  const isMin = rMinFile.test(src);
  const isLess = rLessFile.test(src);
  let data = `\n/* SOURCE: ${src.split('src')[1]} */\n`;
  // eslint-disable-next-line prefer-const
  let [err, result = ''] = await readFile(src);
  if (err) {
    data += parseErrorMessage(src);
    return data;
  }

  if (isMin && !isLess) {
    data += result;
    return data;
  }

  try {
    if (isLess) {
      const lessData = await less.render(result, {
        compress: false,
        filename: src,
      });

      if (lessData.css) {
        result = lessData.css;
      }
    }

    // const cssData = await postcss([precss, Autoprefixer(
    //   { "overrideBrowserslist": browsersList }
    // )]).process(fileString, {
    //   syntax: postcssLess,
    //   from: undefined,
    // });
    // fileString = cssData.css;

    const transformResult = transformCss(result); // rebase false 不处理image路径
    data += transformResult;
  } catch (e) {
    console.log(e);
  }

  return data;
};

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
};
