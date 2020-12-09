import { window } from "vscode";

const prestr = "vscode-efespublisher：";

export const warning = (s: string) => {
  window.showWarningMessage(prestr + s);
};

export const error = (s: string) => {
  window.showErrorMessage(prestr + s);
};

export const info = (s: string) => {
  window.showInformationMessage(prestr + s);
};

