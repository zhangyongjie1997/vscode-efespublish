import { error } from '@utils/utils';

export const parseErrorMessage = (src: string) => {
  error(`读取文件${src}失败`);
  return `\n/* ${src}读取失败 */\n`;
};
