/* eslint-disable @typescript-eslint/naming-convention */
import * as fs from "fs";
const jsFileRegexp = /\.js$/;

export const isFunction = (func: any): boolean => {
  return typeof func === 'function';
};

export const isJSFile = (file: string): boolean => {
  return jsFileRegexp.test(file);
};

/**
 * @param arr 数组
 * @param index 要删除的元素的索引
 * 性能优于 Array.prototype.splice，但是会改变元素的顺序。
 */
export const splice = <T = any>(arr: T[], index: number): T | undefined | null => {
  const len = arr.length;
  const maxIndex = len - 1;
  if(index > maxIndex || index < 0){
    return null;
  }
  if(index === maxIndex){
    return arr.pop();
  }
  if(index === 0){
    return arr.shift();
  }
  arr[index] = arr[maxIndex];
  return arr.pop();
};

// export const importModule = (modulePath: string) => {
//   const Module = module.constructor;
//   const code = fs.readFileSync(modulePath, {encoding: "utf8"});
  
// };