
import * as vscode from 'vscode';
import postcss, { Message } from 'postcss';

import autoprefixerModule from 'autoprefixer';
import { showOutput } from '@utils/utils';


const browsersList = [
  '> 1%',
  'last 2 versions',
  'not ie <= 8',
  'ios >= 8',
  'android >= 4.0',
];

interface IConfiguration {
  browsers: string[];
  grid: 'autoplace' | 'no-autoplace';
}

interface IResult {
  css: string;
  warnings: boolean;
  range: vscode.Range;
}

/**
 * Get PostCSS options.
 *
 * @param {string} language
 * @returns {*}
 */
function getPostcssOptions(language: string): any {
  switch (language) {
    case 'less':
      return {
        syntax: require('postcss-less'),
      };
    case 'css':
      return {
        parser: require('postcss-safe-parser'),
      };
    default:
      return null;
  }
}

/**
 * Check syntax support.
 *
 * @param {any} ext
 * @returns {boolean}
 */
function isSupportedSyntax(document: vscode.TextDocument): boolean {
  return /(css|postcss|less)/.test(document.fileName);
}

/**
 * transform warning message.
 *
 * @param {postcss.ResultMessage} warn
 * @returns {string}
 */
function transformWarningMessage(warn: Message): string {
  return warn.toString().replace(/autoprefixer:\s<.*?>:(.*)?:\s(.*)/, '[$1] $2');
}


/**
 * Use Autoprefixer module.
 *
 * @param {vscode.TextDocument} document
 * @param {vscode.Selection} selection
 * @returns {Promise<IResult>}
 */
export async function useAutoprefixer(document: vscode.TextDocument, selection: vscode.Selection): Promise<IResult> {
  if (!isSupportedSyntax(document)) {
    console.error('Cannot execute Autoprefixer because there is not style files. Supported: LESS, SCSS, PostCSS and CSS.');
    return null;
  }

  const processOptions = getPostcssOptions(document.languageId);
  const autoprefixerOptions: IConfiguration = {
    browsers: browsersList,
    grid: 'autoplace',
  };

  let range: vscode.Range;
  let text: string;
  if (!selection || (selection && selection.isEmpty)) {
    const lastLine = document.lineAt(document.lineCount - 1);
    const start = new vscode.Position(0, 0);
    const end = new vscode.Position(document.lineCount - 1, lastLine.text.length);

    range = new vscode.Range(start, end);
    text = document.getText();
  } else {
    range = new vscode.Range(selection.start, selection.end);
    text = document.getText(range);
  }

  return postcss([autoprefixerModule(autoprefixerOptions)])
    .process(text, processOptions)
    .then((result) => {
      let warnings = '';
      result.warnings().forEach((warn) => {
        warnings += `\t${ transformWarningMessage(warn) }\n`;
      });

      if (warnings) {
        showOutput(`Warnings\n${ warnings}`);
      }

      return {
        css: result.css,
        warnings: Boolean(warnings),
        range,
      };
    });
}
