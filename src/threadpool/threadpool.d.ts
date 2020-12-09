/// <reference path="../global.d.ts" />

type UserWorkEvents = "done" | "error" | "timeout" | "cancel";

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
  event: import("./constants").EVENT_TYPES;
  work?: Work;
}