/* eslint-disable @typescript-eslint/naming-convention */
import {Base} from "./base";
import {FSWatcher} from "chokidar";

type Listeners = Array<Function>;

const fsWatcher = new FSWatcher();

enum EVENT_TYPES {
  CHANGE = "change",
  ADD = "add"
}

class FileWatcher extends Base {
  private watchers = new Map<string, Listeners>();
  private srcs: string[] = [];
  private events: Map<EVENT_TYPES, Function> = new Map<EVENT_TYPES, Function>();

  constructor(src = ""){
    super();
    if(src){
      this.srcs.push(src);
      this.watch(src);
    }
  }

  on(event: EVENT_TYPES, listener: Function){
    this.events.set(event, listener);
  }

  add(src: string) {
    this.watch(src);
  }

  close() {
    this.srcs.forEach(src => {
      this.fs.unwatchFile(src);
    });
    this.srcs = [];
    this.events.clear();
  }
  
  private watch(src: string): Function{
    if(!this.fs.existsSync(src)){
      return;
    }
    let listeners: Listeners = [];
    if(this.watchers.has(src)){
      listeners = this.watchers.get(src);
    }
    this.fs.watch(src, (event: string, filename: string) => {
      this.onchange(event, filename);
    });
    this.watchers.set(src, listeners);
  }
  onchange(event: string, filename: string){
    console.log(event, filename);
  }
}

function Watch(src): FileWatcher {
  return new FileWatcher(src);
}

export {Watch};