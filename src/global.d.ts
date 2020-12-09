interface AnyObject {
  [key: string]: any
}

interface AnyFunc {
  (...args: any): any
}

type PkgItem = string;

interface PkgData {
  [key: string]: Array<PkgItem>
}

interface ConfigData {
  pkg?: PkgData
  [key: string]: any
}

interface ProgressMessage {
  increment: number;
  message: string;
}