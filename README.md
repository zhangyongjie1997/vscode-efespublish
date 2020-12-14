# vscode-efespublish README

## 介绍

efes publish功能的vscode插件版本，移植并做了优化

### 主要功能

css/less、js、html文件合并、压缩，图片压缩

> 功能简陋，暂不支持编译ES6及以上的代码

#### 使用方法

在编辑中打开`concatfile.json`, `Command + Shift + P`或`F1` => `efes-publish:publish`

concatfile.json示例
```json
{
  "pkg": {
    "css/vender.css": [
      "src/css/a.less",
      "src/css/b.min.css"
    ],
    "js/vender.js": [
      "src/js/a.js",
      "src/js/b.min.js"
    ]
  }
}
```

> 代码压缩会跳过.min.xx命名的文件

打包前目录结构
```
项目根目录
├── package.json
├── src
│   ├── images
│   │   └── a.png
│   ├── js
│   │   ├── a.js
│   │   └── b.min.js
│   ├── css
│   │   ├── a.css
│   │   └── b.min.css
│   ├── index.html
```

打包后目录结构
```
├── package.json
├── js
│   └── vender.js
├── css
│   └── vender.css
├── images
│   └── a.png
├── src
│   ├── js
│   │   ├── a.js
│   │   └── b.min.js
│   ├── css
│   │   ├── a.css
│   │   └── b.min.css
│   ├── index.html
├── index.html
```

> threadpool 参考(https://github.com/theanarkh/nodejs-threadpool)