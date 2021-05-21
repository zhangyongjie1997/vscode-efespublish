import { minify } from 'html-minifier';
import { readFile } from '@utils/fsUtils';
import { parseErrorMessage } from '@parser/shared';


export const parse = async (src: string, mini: boolean = false): Promise<string> => {
  const miniHtmlConfig = {
    removeComments: true,
    collapseWhitespace: true,
    minifyJS: true,
    minifyCSS: true,
  };
  const [err, fileString = ''] = await readFile(src);
  let resultString = fileString;
  if (err) {
    resultString = parseErrorMessage(src);
  }
  if (mini) resultString = minify(resultString, miniHtmlConfig);
  return resultString;
}