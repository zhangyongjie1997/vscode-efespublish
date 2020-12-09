/* eslint-disable @typescript-eslint/naming-convention */
// import request from "request";
// import * as path from "path";

// interface TinypngResult {
  
// }

// export default function tinypng(file: any, callback: AnyFunc) {
//   return new Promise(resolve => {
//     request({
//       url: 'https://tinypng.com/web/shrink',
//       method: "post",
//       headers: {
//         "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
//         "Accept-Encoding": "gzip, deflate",
//         "Accept-Language": "zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3",
//         "Cache-Control": "no-cache",
//         "Pragma": "no-cache",
//         "Connection": "keep-alive",
//         "Host": "tinypng.com",
//         "DNT": 1,
//         "Referer": "https://tinypng.com/",
//         "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0"
//       },
//       body: file.contents
//     }, function (error, response, body) {
//       let results: any, filename;

//       if (!error) {
//         filename = path.basename(file.path);
//         results = JSON.parse(body);

//         if (results.output && results.output.url) {
//           request.get({ url: results.output.url, encoding: null }, function (err, res, body) {
//             if (!err) {
//               var output = results.output;
//             }
//             callback(err ? null : new Buffer(body));
//           });
//         } else {
//           callback(null);
//         }
//       } else {
//         callback(null);
//       }
//     });
//   });
// };