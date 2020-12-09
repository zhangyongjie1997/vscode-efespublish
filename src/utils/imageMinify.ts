import * as worker from "worker_threads";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ThreadPool } from "../threadpool/index";

const threadpool = new ThreadPool({
  coreThreads: 4,
});

export const imageMinify = async (imagePaths) => {
  console.log(imagePaths);
};


