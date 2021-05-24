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
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
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
