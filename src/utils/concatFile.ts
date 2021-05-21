import { Base } from '@utils/base';
import { warning } from '@utils/utils';
import { parseAll as parseStyle } from '@parser/style-parser';
import { parseAll as parseScript } from '@parser/script-parser';
import { parse as parseHtml } from '@parser/html-parser';
import { rCssFile, rJsFile } from '../utils/fileRegExps';



class ConcatFile extends Base {
  public async concatFile(options: ConcatOptions): Promise<string> {
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

    let data = ''
    switch (true) {
      case rCssFile.test(output):
        data = await parseStyle(srcs);
        break;
      case rJsFile.test(output):
        data = await parseScript(srcs);
        break;
    }
    return data;
  }
  public async miniHtmlFile(src: string, mini: boolean = false): Promise<string> {
    const result = await parseHtml(src, mini);
    return result;
  }
}

export { ConcatFile };
