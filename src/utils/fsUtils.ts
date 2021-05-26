import * as fs from 'fs';
import * as path from 'path';
import { TextDocument } from 'vscode';
import { error } from './utils';
import output from '@utils/output';
import { rHtmlFile, rImageFile } from './fileRegExps';


const CONFIG_FILE_NAME = 'concatfile.json';

export type ReadFileResult = [object | Error | null, string];

export const mkdir = async (url: string) => {
  const pathData = path.parse(url);
  // console.info(`mkdir:${ pathData.dir}`);
  if (!fs.existsSync(pathData.dir)) {
    await fs.promises.mkdir(pathData.dir);
  }
};

export const findHtmlFiles = (sourcePath: string): string[] => {
  const dir = fs.readdirSync(sourcePath);
  const htmlFilePaths: string[] = [];
  dir.forEach((item) => {
    if (rHtmlFile.test(item)) {
      htmlFilePaths.push(path.join(sourcePath, '/', item));
    }
  });
  return htmlFilePaths;
};

export const findImageFiles = (sourcePath: string): string[] => {
  if (!fs.existsSync(sourcePath)) {
    return [];
  }
  const dir = fs.readdirSync(sourcePath);
  const imageFilePaths: string[] = [];
  dir.forEach((item) => {
    if (rImageFile.test(item)) {
      imageFilePaths.push(path.resolve(sourcePath, item));
    }
  });
  return imageFilePaths;
};

export const writeFile = (filepath: string, data: any): Promise<void> => {
  // console.log(`Writing file: ${filepath}`);
  return new Promise((resolve) => {
    const writestream = fs.createWriteStream(filepath);
    writestream.write(data, () => {
      resolve();
    });
  });
};

const find = (baseUrl: string): {
  config: ConfigData;
  configFilePath: string;
} => {
  const filePath = path.join(baseUrl, '/', CONFIG_FILE_NAME);
  const exits = fs.existsSync(filePath);

  if (exits) {
    const fileData = fs.readFileSync(filePath, 'utf8');
    let configData: AnyObject = {};
    if (fileData) {
      try {
        configData = JSON.parse(fileData);
      } catch (e) {
        configData = {};
      }
    }
    return { config: configData, configFilePath: filePath };
  }

  return {
    config: {},
    configFilePath: '',
  };
};

/**
 * @param {string} basePath 开始查找的目录
 */
export const findConfigFile = async (basePath: string): Promise<{
  config: ConfigData;
  configFilePath: string;
}> => {
  return find(basePath);
};


export const getWorkDir = (document?: TextDocument): string => {
  if (document) {
    return path.parse(document.fileName).dir;
  }
  error('请打开配置文件后执行命令！');
  return '';
};

/**
 * @description 逐层向上查找直到找到concatFile.json
 * @param {string} file
 */
export const getWorkDirByFile = (file) => {
  let { dir } = path.parse(file);
  let lastDir = '';
  let deep = 0;

  const maxDeep = 5;
  const concatConfigFileName = 'concatfile.json';

  while (dir !== lastDir) {
    lastDir = dir;

    if (deep > maxDeep) {
      break;
    }

    const dirInfo = fs.readdirSync(dir);

    // eslint-disable-next-line no-loop-func
    const found = dirInfo.find((item) => {
      if (
        item === concatConfigFileName &&
        fs.statSync(path.join(dir, item)).isFile()
      ) {
        return true;
      }
      return false;
    });

    if (found) {
      return dir;
    }

    deep++;
    dir = path.resolve(dir, '..');
  }
};

export const findPkgByFile = async (file: string): Promise<ConcatOptions> => {
  let options = {
    inputs: [],
    workDir: '',
    output: '',
  };

  const workDir = getWorkDirByFile(file)!;

  const { config } = await findConfigFile(workDir);

  Object.keys(config.pkg!).find((key) => {
    const value = config.pkg![key];

    return value.some((item) => {
      const fullPath = path.resolve(workDir, item);
      options = {
        output: key,
        inputs: value,
        workDir,
      };
      return fullPath === file;
    });
  });

  return options;
};

export const readFile = (file): Promise<ReadFileResult> => {
  return new Promise((resolve) => {
    // eslint-disable-next-line node/prefer-promises/fs
    fs.readFile(file, { encoding: 'utf8' }, async (err, fileString = '') => {
      if (err) {
        output.errorLine(`读取文件：${file}`);
      }
      resolve([err, fileString]);
    });
  });
};
