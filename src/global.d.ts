interface AnyObject {
  [key: string]: any;
}

interface AnyFunc {
  (...args: any): any;
}

type PkgItem = string;

interface PkgData {
  [key: string]: PkgItem[];
}

interface ConfigData {
  pkg?: PkgData;
  [key: string]: any;
}

interface ConcatOptions {
  inputs: PkgItem[];
  output: string;
  workDir: string;
}

interface ProgressMessage {
  increment: number;
  message: string;
}

type UserWorkEvents = 'done' | 'error' | 'timeout' | 'cancel';

type WorkId = number;

/**
 * 传递给子线程的任务
 */
interface Work {
  workId: number;
  fileName: string;
  data: any;
  error: string;
  options: AnyObject;
}

/**
 * 线程池的配置
 */
interface ThreadPoolOptions {
  coreThreads?: number;
  expansion?: boolean;
  discardPolicy?: number;
  preCreate?: boolean;
  maxIdleTime?: number;
  maxWork?: number;
  timeout?: number;
}

/**
 * 子线程抛出的消息
 */
interface WorkerMessage {
  event: import('./threadpool/constants').EVENT_TYPES;
  work?: Work;
}
