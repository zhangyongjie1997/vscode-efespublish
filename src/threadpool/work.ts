// 主线程和子线程通信时传递的类

// 主线程给子线程分派一个任务的时候，就给子线程发送一个Work对象。
// 在nodejs中线程间通信需要经过序列化和反序列化，所以通信的数据结构包括的信息不能过多。

interface WorkArgs {
  workId: WorkId;
  fileName: string;
  options: AnyObject;
  data?: any;
  error?: string;
}

/**
 * @class 任务类 一个任务对应一个id
 */
export class Work implements Work {
  public workId: WorkId;
  public fileName: string = "";
  public data = null;
  public error = "";
  public options: AnyObject = {};
  constructor({workId, fileName, options}: WorkArgs){
    this.workId = workId;
    this.fileName = fileName; // 任务逻辑，js文件路径
    this.data = null; // 任务返回的数据
    this.error = ""; // 任务返回的错误
    this.options = options;
  }
}