/* eslint-disable @typescript-eslint/naming-convention */
import request from 'request';
import fs from 'fs';

// const copy = async ({ src }) => {
//   const data = fs.readFileSync(src);
// };

const mini = async ({ src }): Promise<string> => {
  const data = fs.readFileSync(src);

  if (!data) {
    return '';
  } else {
    const res = await tinypng(data);
    return res;
  }
};

function tinypng(file: any): Promise<string> {
  return new Promise((resolve) => {
    request({
      url: 'https://tinypng.com/web/shrink',
      method: 'post',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Connection: 'keep-alive',
        Host: 'tinypng.com',
        DNT: 1,
        Referer: 'https://tinypng.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0',
      },
      body: file,
    }, (error, response, body) => {
      let results: any;
      if (!error) {
        results = JSON.parse(body);
        if (results.output && results.output.url) {
          request.get({ url: results.output.url, encoding: null }, (err, res, rsp) => {
            resolve(err ? file : Buffer.from(rsp));
          });
        } else {
          resolve(file);
        }
      } else {
        resolve(file);
      }
    });
  });
}

export {
  mini,
  // copy,
};
