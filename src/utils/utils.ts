import { window, OutputChannel } from 'vscode';

const PRE_STRING = 'vscode-efespublisher：';
let output: OutputChannel;

export const warning = (s: string) => {
  window.showWarningMessage(PRE_STRING + s);
};

export const error = (s: string) => {
  window.showErrorMessage(PRE_STRING + s);
};

export const info = (s: string) => {
  window.showInformationMessage(PRE_STRING + s);
};

export const hasKey = <T extends Object>(obj: T, key: keyof any): key is keyof T => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * Show message in iutput channel.
 *
 * @param {string} msg
 */
export function showOutput(msg: string): void {
  if (!output) {
    output = window.createOutputChannel('efes-publish');
  }

  output.clear();
  output.appendLine('[efes-publish]\n');
  output.append(msg);
  output.show();
}

// 类型谓词的类型不可赋给其参数的类型。
//   不能将类型“keyof T”分配给类型“K”。
//     "keyof T" 可赋给 "K" 类型的约束，但可以使用约束 "string | number | symbol" 的其他子类型实例化 "K"。
//       不能将类型“string | number | symbol”分配给类型“K”。
//         "string | number | symbol" 可赋给 "K" 类型的约束，但可以使用约束 "string | number | symbol" 的其他子类型实例化 "K"。
//           不能将类型“string”分配给类型“K”。
//             "string" 可赋给 "K" 类型的约束，但可以使用约束 "string | number | symbol" 的其他子类型实例化 "K"。ts(2677)

export const getSecond = (m: number): string => {
  return (m / 1000).toFixed(2).toString();
};
