/* eslint-disable @typescript-eslint/naming-convention */

/**
 * @description 事件类型
 */
export enum EVENT_TYPES {
  /**
   * 完成
   */
  DONE,
  /**
   * 出错
   */
  ERROR,
}

/**
 * 任务状态
 */
export enum WORK_STATE {
  /**
   * 挂起，等待
   */
  PENDDING,
  /**
   * 进行中
   */
  RUNNING,
  /**
   * 取消
   */
  CANCELED,
  /**
   * 结束
   */
  END
}

/**
 * @description 线程状态
 */
export enum THREAD_STATE {
  /**
   * 空闲
   */
  IDLE,
  /**
   * 忙碌
   */
  BUSY
}

/**
 * @description 丢弃策略
 */

export enum DISCARD_POLICY {
  /**
    * 报错
    */
  ABORT,
  /**
   * 在主线程里执行
   */
  RUN_IN_MASTER,
  /**
   * 丢弃最老的的任务
   */
  OLDEST_DISCARD,
  /**
   * 丢弃
   */
  DISCARD,
  /**
   * 不丢弃
   */
  NOT_DISCARD,
}