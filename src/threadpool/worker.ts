// 子线程处理任务逻辑，主线程通过下面的代码来创建子线程

// 监听主线程分派过来的任务，然后执行任务，执行完之后通知主线程。
// 任务支持js文件和字符串代码的形式。
// 需要返回一个Promise或者async函数。用于用于通知主线程任务已经完成

import { parentPort } from "worker_threads";
import * as vm from "vm";
import { isFunction, isJSFile } from "./utils";
import { EVENT_TYPES } from "./constants";

parentPort?.on("message", async (work: Work) => {
  try{
    const {fileName, options} = work;
    let aFunction: any;
    if(isJSFile(fileName)){  // fileName可以是一段js代码或者js脚本的文件名
      aFunction = require(fileName);
    } else {
      aFunction = vm.runInThisContext(`(${fileName})`);
    }
    if(!isFunction(aFunction)){
      throw new TypeError(`work type error: expect js file or string, got ${typeof aFunction}`);
    }
    work.data = await aFunction(options);
    parentPort?.postMessage({event: EVENT_TYPES.DONE});
  }catch(error){
    work.error = error.toString();
    parentPort?.postMessage({event: EVENT_TYPES.ERROR, work});
  }
});

process.on('uncaughtException', (...rest) => {
  console.error(...rest);
});

process.on('unhandledRejection', (...rest) => {
  console.error(...rest);
});