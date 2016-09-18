# 搭建基于 webpack 的快速开发环境

[TOC]

## 初始化

首先起一个酷炫点的名字，就叫 spa-seed 吧，单页应用种子生成器，可以快速生成各种 SPA 框架的脚手架。

```shell
$ mkdir spa-seed && cd spa-seed
```

初始化一个 package.json 文件。

```shell
$ npm init -y
```

初始化 git 仓库。

```shell
$ git init
```

初始化 .gitignore、.babelrc、.eslintrc、README.md 等配置和帮助文件。

```shell
$ touch .gitignore .babelrc .eslintrc README.md
```

初始化文件夹结构如下。

```shell
app
  - src
    - biz1
      - index.js
    - biz2
      - index.js
    main.js
  - index.html
doc
dist
.babelrc
.eslintrc
.gitignore
README.md
```

index.html 内容如下：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SPA</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="http://libs.baidu.com/fontawesome/4.0.3/css/font-awesome.min.css" rel="stylesheet">
</head>
<body>
    <ul id="menu">
        <li><a href="javascript:;" path="biz1/index">a</a></li>
        <li><a href="javascript:;" path="biz2/index">b</a></li>
    </ul>

    <div id="main">
    </div>
</body>
</html>
```

biz1/index.js 内容如下：

```js
let a = 1;
export default a;
```

biz2/index.js 内容如下：

```js
let b = 2;
export default b;
```

## 安装依赖

### base 依赖

```shell
$ npm i -S jquery lodash normalize.less
```

### babel 依赖

```shell
$ npm i -D babel-core babel-preset-es2015 babel-preset-stage-0 babel-plugin-transform-runtime
```

### webpack 依赖

```shell
$ npm i -D webpack html-webpack-plugin webpack-dev-middleware webpack-hot-middleware
```

### webpack loader 依赖

```shell
$ npm i -D babel-loader eslint eslint-loader less less-loader css-loader style-loader file-loader url-loader
```

### gulp 和 server 依赖

```shell
$ npm i -D gulp gulp-rename gulp-util browser-sync http-proxy-middleware
```

## 配置文件

### babel 配置

修改 .babelrc 配置如下：

```js
{
  "plugins": ["transform-runtime"],
  "presets": ["es2015", "stage-0"]
}
```

### webapck 配置

新建 webpack.config.babel.js，注意文件名中的 babel，这可以使配置文件使用 es2015 的语法（还有另外一种方法，使用 babel-node 和 webpack 语法）。

```js

```

### gulp 配置

### eslint 配置


