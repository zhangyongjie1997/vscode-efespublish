import * as path from "path";
import * as fs from "fs";

const configFileName = "concatfile.json";
/**
 * 
 * @param basePath 开始查找的目录
 * @TODO 从这个目录开始逐层向上查找
 */
export default async function(basePath: string): Promise<{
  config?: ConfigData,
  configFilePath?: string
}> {
  return find(basePath);
}

const find = (baseUrl: string): {
  config?: ConfigData,
  configFilePath?: string
} => {
  const filePath = path.join(baseUrl, "/", configFileName);
  const exits = fs.existsSync(filePath);
  if(exits){
    let fileData = fs.readFileSync(filePath, "utf8"), configData: AnyObject = {};
    if(fileData){
      try {
        configData = JSON.parse(fileData);
      } catch (error) { configData = {}; }
    }
    return {config: configData, configFilePath: filePath};
  }
  return {};
};