import { Worker } from 'worker_threads';
import * as os from 'os';
import * as path from 'path';
import { WORK_STATE, THREAD_STATE, DISCARD_POLICY, EVENT_TYPES } from './constants';
import config from './config';
import { Work } from './work';
import { isFunction, isJSFile, splice } from './utils';
import { EventEmitter } from 'events';
import * as vm from 'vm';

/**
 * worker的代码目录
 */
const workerPath = path.resolve(__dirname, 'worker.js');

/**
 * cpu支持的线程数
 */
const cores = os.cpus().length;

// 线程池和业务的通信

// 业务提交一个任务给线程池的时候，线程池会返回一个UserWork类，业务侧通过UserWork类和线程池通信。
class UserWork extends EventEmitter {
  private timer: NodeJS.Timeout | null = null;
  workId: WorkId;
  state: WORK_STATE;
  terminate: AnyFunc = () => { };
  constructor(workId: WorkId) {
    super();
    this.workId = workId; // 任务Id
    this.timer = null; // 超时取消任务
    this.state = WORK_STATE.PENDDING; // 任务状态
  }

  emit(event: UserWorkEvents, data?, ...args): boolean {
    return super.emit(event, data);
  }

  // 设置任务的超时时间，超时取消任务
  setTimeout(timeout: number) {
    this.timer = setTimeout(() => {
      this.timer && this.cancel() && this.emit('timeout');
    }, ~~timeout);
  }

  clearTimeout() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // 直接取消任务，如果任务执行完就不能取消了， this.terminate是动态设置的
  cancel() {
    if (this.state === WORK_STATE.END || this.state === WORK_STATE.CANCELED) {
      return false;
    } else {
      this.terminate();
      return true;
    }
  }

  setState(state: number) {
    this.state = state;
  }
}

/**
 * 管理子线程的数据结构，需要放到线程池的工作线程队列里workerQueue
 * @param worker `Worker`实例
 */
class Thread {
  worker: Worker;
  state: number;
  lastWorkTime: number;
  constructor(worker: Worker) {
    // nodejs的Worker对象，nodejs的worker_threads模块的Worker
    this.worker = worker;
    // 线程状态
    this.state = THREAD_STATE.IDLE;
    // 上次工作的时间
    this.lastWorkTime = Date.now();
  }

  // 修改线程状态
  setState(state: number) {
    this.state = state;
  }

  // 修改线程最后工作时间
  setLastWorkTime(time: number) {
    this.lastWorkTime = time;
  }
}


const defaultThreadPoolOptions = {
  coreThreads: config.CORE_THREADS,
  expansion: false,
  discardPolicy: DISCARD_POLICY.RUN_IN_MASTER,
  maxIdleTime: config.MAX_IDLE_TIME,
  maxWork: config.MAX_WORK,
  preCreate: false,
  timeout: config.TIMEOUT,
};


class ThreadPool {
  private options: AnyObject;
  /**
   * 子线程队列，保存所有已经创建的线程
   */
  private threadQueue: Thread[] = [];
  /**
   * 默认核心线程数
   */
  private coreThreads: number;
  /**
   * 线程池最大线程数，如果不支持动态扩容则最大线程数等于核心线程数
   */
  private maxThreads: number;
  /**
   * 超过任务队列长度时的处理策略
   */
  private discardPolicy: DISCARD_POLICY;
  /**
   * 是否预创建子线程
   */
  private preCreate: boolean;
  /**
   * 线程最大空闲时间，达到后自动退出
   */
  private maxIdleTime: number;
  /**
   * 保存线程池中任务对应的UserWork
   */
  private userWorkPool: Map<WorkId, UserWork>;
  /**
   * 线程池中当前可用的任务id，每次有新任务时自增1
   */
  private workId: WorkId;
  /**
   * 线程池中的任务队列
   */
  private workQueue: Work[];
  /**
   * 线程池总任务数
   */
  private totalWork: number;
  /**
   * 支持的最大任务数
   */
  private maxWork: number;
  /**
   * 处理任务的超时时间，全局配置
   */
  private timeout: number;

  constructor(options: ThreadPoolOptions = defaultThreadPoolOptions) {
    this.options = options;

    this.threadQueue = [];

    this.coreThreads = ~~(options.coreThreads!) || config.CORE_THREADS;

    this.maxThreads = options.expansion !== false ? Math.max(this.coreThreads, config.MAX_THREADS) : this.coreThreads;

    this.discardPolicy = options.discardPolicy ? options.discardPolicy : DISCARD_POLICY.NOT_DISCARD;

    this.preCreate = options.preCreate === true;

    this.maxIdleTime = ~~(options.maxIdleTime!) || config.MAX_IDLE_TIME;

    this.preCreate && this.preCreateThreads();

    this.userWorkPool = new Map();

    this.workId = 0;

    this.workQueue = [];

    this.totalWork = 0;

    this.maxWork = ~~(options.maxWork!) || config.MAX_WORK;

    this.timeout = ~~(options.timeout!);

    this.pollIdle();
  }

  /**
   * @method 创建线程
   */
  newThread(): Thread {
    const worker = new Worker(workerPath);
    const thread = new Thread(worker);
    // 添加到工作线程队列
    this.threadQueue.push(thread);
    const { threadId } = worker;
    worker.on('exit', () => {
      // 找到该线程对应的数据结构，然后删除该线程的数据结构
      const position = this.threadQueue.findIndex(({ worker }) => {
        return worker.threadId === threadId;
      });
      const exitedThread = splice(this.threadQueue, position);
      if (exitedThread) {
        // 退出时状态是BUSY说明还在处理任务（非正常退出）
        this.totalWork -= (exitedThread.state === THREAD_STATE.BUSY ? 1 : 0);
      }
    });
    worker.on('message', async (result: WorkerMessage) => {
      const { work, event } = result;
      const { data, error, workId } = work as Work;
      // 通过workId拿到对应的userWork
      const userWork = this.userWorkPool.get(workId);
      // 不存在说明任务被取消了
      if (!userWork) {
        return;
      }
      // 修改线程池数据结构
      this.endWork(userWork);

      // 修改线程数据结构
      thread.setLastWorkTime(Date.now());

      // 还有任务则通知子线程处理，否则修改子线程状态为空闲
      if (this.workQueue.length) {
        console.log('还有任务要处理');
        const nextwork = this.workQueue.shift();
        // 从任务队列拿到一个任务交给子线程
        nextwork && this.submitWorkToThread(thread, userWork, nextwork);
      } else {
        thread.setState(THREAD_STATE.IDLE);
      }

      switch (event) {
        case EVENT_TYPES.DONE:
          console.info(`userWork[${userWork.workId}] 完成任务`);
          // 通知用户，任务完成
          userWork.emit('done', data);
          break;
        case EVENT_TYPES.ERROR:
          // 通知用户，任务出错
          try {
            if (EventEmitter.listenerCount(userWork, 'error')) { // 如果存在error事件的监听者
              userWork.emit('error', error);
            }
          } catch (e) {
            console.log(e);
          }
          break;
        default: break;
      }
    });
    worker.on('error', (...args: any[]) => {
      console.error(...args);
    });

    return thread;
  }

  /**
   * 找出空闲线程吧任务交给他
   * 当用户给线程池提交一个任务时，线程池会选择一个空闲的线程处理该任务。
   * 如果没有可用线程则任务插入待处理队列等待处理。
   */
  selectThead(): Thread {
    for (let i = 0; i < this.threadQueue.length; i++) {
      if (this.threadQueue[i].state === THREAD_STATE.IDLE) {
        return this.threadQueue[i];
      }
    }
    // 没有空闲的就随机找一个
    return this.threadQueue[~~(Math.random() * this.threadQueue.length)];
  }

  /**
   * 给线程池提交一个任务
   * 提交任务是线程池暴露给用户侧的接口，
   * 主要处理的逻辑包括，根据当前的策略判断是否需要新建线程、选择线程处理任务、排队任务等，
   * 如果任务数得到阈值，则根据丢弃策略处理该任务。
   */
  async submit(fileName: string, options = {}): Promise<UserWork> {
    let thread: Thread;
    // 当前如果有线程
    if (this.threadQueue.length) {
      thread = this.selectThead();
      // 如果当前线程忙碌
      if (thread.state === THREAD_STATE.BUSY) {
        // console.log("选择的线程忙碌");
        // 子线程数量没有超过默认核心线程数，就继续创建
        if (this.threadQueue.length < this.coreThreads) {
          // console.log("子线程数量没有超过默认核心线程数，就继续创建");
          thread = this.newThread();
        } else if (this.totalWork + 1 > this.maxWork) {
          // console.log("总任务数已达到阈值，还没有达到线程数阈值，则创建");
          // 总任务数已达到阈值，还没有达到线程数阈值，则创建
          if (this.threadQueue.length < this.maxThreads) {
            thread = this.newThread();
          } else {
            // 处理溢出的任务
            switch (this.discardPolicy) {
              case DISCARD_POLICY.ABORT:
                throw new Error('任务队列已满/workQueue overflow');
              case DISCARD_POLICY.RUN_IN_MASTER:
                // 把任务交给主线程处理
                const workId = this.generateWorkId();
                const userWork = new UserWork(workId);
                userWork.terminate = () => {
                  userWork.setState(WORK_STATE.CANCELED);
                };
                userWork.setTimeout(this.timeout); // 设置任务的超时时间
                try {
                  let aFunction;
                  if (isJSFile(fileName)) {
                    aFunction = await import(fileName);
                  } else {
                    aFunction = vm.runInThisContext(`(${fileName})`);
                  }
                  if (!isFunction(aFunction)) {
                    throw new TypeError(`work type error: expect js file or string, got ${typeof aFunction}`);
                  }
                  const result = await aFunction();
                  setImmediate(() => { // 下一次事件循环时执行
                    if (userWork.state !== WORK_STATE.CANCELED) {
                      userWork.setState(WORK_STATE.END);
                      userWork.emit('done', result);
                    }
                  });
                } catch (error) {
                  setImmediate(() => {
                    if (userWork.state !== WORK_STATE.CANCELED) {
                      userWork.setState(WORK_STATE.END);
                      userWork.emit('error', error.toString());
                    }
                  });
                }
                return userWork;
              case DISCARD_POLICY.OLDEST_DISCARD:
                const work = this.workQueue.shift(); // 取出最先进入队列的任务
                // maxWork为1时， work会为空
                if (work && this.userWorkPool.get(work.workId)) { // 如果当前任务在执行
                  this.cancelWork(this.userWorkPool.get(work.workId)!);
                } else {
                  throw new Error('no work can be discarded');
                }
                break;
              case DISCARD_POLICY.DISCARD:
                throw new Error('discard!');
              case DISCARD_POLICY.NOT_DISCARD:
                break;
              default:
                break;
            }
          }
        }
        // console.log("这里干了蛇么");
      }
    } else {
      thread = this.newThread();
    }
    // 生成一个任务id
    const workId = this.generateWorkId();

    // 新建一个userWork
    const userWork = new UserWork(workId);
    this.timeout && userWork.setTimeout(this.timeout);

    // 新建一个work
    const work = new Work({ workId, fileName, options });

    // 修改线程池结构把userWork和work关联起来
    this.addWork(userWork);

    // 如果选中的线程正忙，先放到任务队列等待执行
    if (thread.state === THREAD_STATE.BUSY) {
      this.workQueue.push(work);
      userWork.terminate = () => {
        this.cancelWork(userWork);
        this.workQueue = this.workQueue.filter((node) => node.workId !== work.workId);
      };
    } else {
      this.submitWorkToThread(thread, userWork, work);
    }
    return userWork;
  }

  /**
   * 把任务交给子线程处理
   * @param thread 要处理任务的线程
   * @param work 任务
   */
  submitWorkToThread(thread: Thread, userWork: UserWork, work: Work): void {
    console.log(`提交任务[${work.workId}]给线程`);
    userWork.setState(WORK_STATE.RUNNING);
    thread.setState(THREAD_STATE.BUSY);
    thread.worker.postMessage(work);
    userWork.terminate = () => {
      this.cancelWork(userWork);
      thread.setState(THREAD_STATE.IDLE);
      /**
       * Stop all JavaScript execution in the worker thread as soon as possible.
       * Returns a Promise for the exit code that is fulfilled when the `exit` event is emitted.
       */
      thread.worker.terminate();
    };
  }

  /**
   * @param userWork 将userWork保存到userWorkPool，并通过workId与work关联
   */
  addWork(userWork: UserWork): void {
    userWork.setState(WORK_STATE.PENDDING);
    this.userWorkPool.set(userWork.workId, userWork);
    this.totalWork++;
  }

  endWork(userWork: UserWork) {
    this.userWorkPool.delete(userWork.workId);
    this.totalWork--;
    userWork.setState(WORK_STATE.END);
    userWork.clearTimeout();
  }


  /**
   * 取消userWork
   * @param userWork
   */
  cancelWork(userWork: UserWork): void {
    this.userWorkPool.delete(userWork.workId);
    this.totalWork--;
    userWork.setState(WORK_STATE.CANCELED);
    userWork.emit('cancel');
  }

  /**
   * 空闲处理
   */
  pollIdle() {
    setTimeout(() => {
      // console.log(`当前线程数量${this.threadQueue.length}`);
      let i = 0;
      while (i < this.threadQueue.length) {
        const thread = this.threadQueue[i];
        if (thread.state === THREAD_STATE.IDLE && ((Date.now() - thread.lastWorkTime) > this.maxIdleTime)) {
          // console.log(`杀死空闲线程`);
          thread.worker.terminate();
          splice(this.threadQueue, i);
        } else {
          i++;
        }
      }
      this.pollIdle();
    }, 1000);
  }

  /**
   * 生成任务id
   */
  generateWorkId(): WorkId {
    return ++this.workId % Number.MAX_SAFE_INTEGER;
  }

  /**
   * 预创建线程，数量默认=默认线程数
   */
  preCreateThreads(): void {
    let { coreThreads } = this;
    while (coreThreads--) {
      this.newThread();
    }
  }
}

/**
 * 线程数量等于cpu线程数
 */
class CPUThreadPool extends ThreadPool {
  constructor(options = defaultThreadPoolOptions) {
    super({
      ...options,
      // coreThreads: Math.floor(cores/2),
      coreThreads: 1,
      expansion: false,
    });
  }
}

/**
 * 单线程
 */
class SingleThreadPool extends ThreadPool {
  constructor(options = defaultThreadPoolOptions) {
    super({ ...options, coreThreads: 1, expansion: false });
  }
}

/**
 * 线程无法动态扩展
 */
class FixedThreadPool extends ThreadPool {
  constructor(options = defaultThreadPoolOptions) {
    super({ ...options, expansion: false });
  }
}

// const defaultThreadPool = new ThreadPool();
const defaultCpuThreadPool = new CPUThreadPool();
// const defaultFixedThreadPool = new FixedThreadPool();
// const defaultSingleThreadPool = new SingleThreadPool();
export {
  ThreadPool,
  CPUThreadPool,
  FixedThreadPool,
  SingleThreadPool,
  // defaultThreadPool,
  defaultCpuThreadPool,
  // defaultFixedThreadPool,
  // defaultSingleThreadPool,
};
