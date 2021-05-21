import Aigle from 'aigle';
import * as path from 'path';
import { minify } from 'terser';
import { readFile } from '@utils/fsUtils';
import { rMinFile } from '@utils/fileRegExps';
import { parseErrorMessage } from '@parser/shared';
import { error } from '@utils/utils';

export const parse = async (src): Promise<string> => {
  let data = `\n/* SOURCE: ${src.split('src')[1]} */\n`;
  try {
    let [err, result = ''] = await readFile(src);
    if (err) {
      result = parseErrorMessage(src);
    }
    if (!rMinFile.test(path.dirname(src))) {
      const minifyString = await minify(result);
      result = minifyString.code || '';
    }
    data += result;
  } catch (e) {
    error(e)
  }
  return data;
}

export const parseAll = async (srcs: string | string[]): Promise<string> => {
  let data = '';
  try {
    if (Array.isArray(srcs)) {
      const iterator = Aigle.resolve(srcs).eachSeries(async (src) => {
        if (!src) {
          return;
        }
        const result = await parse(src);
        data += result;
      });
      await iterator;
    } else {
      data = await parse(srcs);
    }
  } catch (e) {
    error(e)
  }
  return data;
}