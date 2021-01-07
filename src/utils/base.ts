import * as path from "path";
import * as fs from "fs";

class Base {
  get fs(){
    return fs;
  }
  get path(){
    return path;
  }
}

export {Base};