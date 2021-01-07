/* eslint-disable @typescript-eslint/naming-convention */
const request = require("request");
const fs = require("fs");
const path = require("path");

const copy = async ({ src }) => {
  const data = fs.readFileSync(src);
};

const mini = async ({ src }): Promise<string>=> {

  const data = fs.readFileSync(src);

  if(!data){
    return "";
  } else {
    const res = await tinypng(data, src);
    return res;
  }
};

function tinypng(file: any, src): Promise<string> {
  return new Promise(resolve => {
    request({
      url: 'https://tinypng.com/web/shrink',
      method: "post",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Connection": "keep-alive",
        "Host": "tinypng.com",
        "DNT": 1,
        "Referer": "https://tinypng.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0"
      },
      body: file
    }, function (error, response, body) {
      let results: any, filename;
      if (!error) {
        filename = path.basename(src);
        results = JSON.parse(body);
        if (results.output && results.output.url) {
          request.get({ url: results.output.url, encoding: null }, function (err, res, body) {
            resolve(err ? file : Buffer.from(body));
          });
        } else {
          resolve(file);
        }
      } else {
        resolve(file);
      }
    });
  });
};

export {
  mini,
  copy
};