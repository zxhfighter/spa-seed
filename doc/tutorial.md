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

biz1/index.js 内容如下，其中 jquery 后续会安装。

```js
import $ from 'jquery';

export function start() {
    console.log('biz1 start');

    $('#main').html('biz1 start');
}
```

biz2/index.js 内容如下：

```js
import $ from 'jquery';

export function start() {
    console.log('biz2 start');

    $('#main').html('biz2 start');
}
```

main.js 内容如下：

```js
import $ from 'jquery';

$('#menu a').click(e => {
    let path = $(e.target).attr('path');

    require.ensure([], function () {
        let file = require('./' + path + '.js');
        file.start && file.start();
    });
});
```

注意上边代码中的 path 路径是由用户点击动态获取的，之后交给 webpack 使用 require.ensure 去异步加载，因此 biz1/index.js 和 biz2/index.js 会打包成一个文件，并且用户点击其中的一个链接时才会按需加载。

如果改成下边的写法，是否 OK ?

```js
require.ensure(['./' + path + '.js'], function (file) {
    file.start && file.start();
});
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
$ npm i -D babel-loader eslint eslint-loader less less-loader css-loader style-loader file-loader url-loader html-withimg-loader
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

新建 webpack.config.babel.js，注意文件名中的 babel，这可以使配置文件使用 es2015 的语法（还有另外一种方法，使用 babel-node 和 webpack API）。

```js
/**
 * @file webpack config file
 */

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

let appPath = __dirname + '/app';
let distPath = __dirname + '/dist';

export default {
    devtool: 'sourcemap',

    entry: {
        app: appPath + '/src/main.js'
    },

    output: {
        path: distPath,
        filename: '[name]-[hash:6].bundle.js'
    },

    module: {
        loaders: [
            {test: /\.js$/, exclude: /node_modules/, loader: 'babel'},
            {test: /\.(htm|html)$/i, loader: 'html-withimg-loader'},
            {test: /\.less$/, loader: 'style!css!less'},
            {test: /\.css$/, loader: 'style!css'},
            {test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'}
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: appPath + '/index.html',
            inject: 'body',
            hash: true
        }),

        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: function (module) {
                return module.resource && module.resource.indexOf(appPath) === -1;
            }
        }),

        new webpack.ProvidePlugin({
            '$': 'jquery',
            'jQuery': 'jquery',
            'window.jQuery': 'jquery'
        }),

        new webpack.HotModuleReplacementPlugin()
    ]
}
```

使用 webpack 运行，dist 目录会生成如下文件：

```shell
1.1-xxxxxx.bundle.js
1.1-xxxxxx.bundle.js.map
app-xxxxxx.bundle.js
app-xxxxxx.bundle.js.map
vendor-xxxxxx.bundle.js
vendor-xxxxxx.bundle.js.map
```

其中 1.1-xxxxxx.bundle.js 为按需加载的业务代码文件，app-xxxxxx.bundle.js 为入口文件，vendor-xxxxxx.bundle.js 为 jquery 文件。xxxxxx 为随机生成的 hash 码的前6位。

打开 dist 目录下的 index.html，文件正常工作。

### gulp 配置

使用 gulp 来进行流程控制。

新建 gulp.babel.js，这里的 babel 和刚才 webpack.config.babel.js 中的 babel 作用一样，使 gulp 配置文件能够使用 es2015 的语法。

```js
/**
 * @file gulp config file
 */

import gulp from 'gulp';
import webpack from 'webpack';
import serve    from 'browser-sync';
import webpackDevMiddelware from 'webpack-dev-middleware';
import webpachHotMiddelware from 'webpack-hot-middleware';
let serveInstance = serve.create();

let appPath = __dirname + '/app';
let distPath = __dirname + '/dist';

gulp.task('serve', () => {
    const config = require('./webpack.config.babel').default;
    const entry = config.entry.app;
    config.entry.app = [
        'webpack-hot-middleware/client?reload=true',
        entry
    ];

    console.log(config);

    let compiler = webpack(config);

    serveInstance.init({
        port: process.env.PORT || 9981,
        open: true,
        server: {baseDir: appPath},
        middleware: [
            webpackDevMiddelware(compiler, {
                stats: {
                    chunks: false,
                    modules: false
                },
                publicPath: config.output.publicPath
            }),
            webpachHotMiddelware(compiler)
        ]
    });

    serveInstance.watch(appPath + '/**/*.html').on('change', serveInstance.reload);
});

gulp.task('build', () => {

});

gulp.task('watch', ['serve']);
gulp.task('default', ['serve']);
```

注意 webpack-hot-middleware 能够处理 js、less、html 的变更，实现 hot reload，因此还需要额外处理 外层html(不是通过 webpack loader 加载) 文件的自动刷新。

最早是使用的 gulp 的 watch 来实现的，不过比较奇怪的是，每次变更需要保存两次（刷新两次）后才生效。

```js
gulp.watch(appPath + '/**/*.html', function () {
    serveInstance.reload();
});
```

后来采用 broswer-sync 自带的 watch 来监控 html 文件的变更，效果比较理想，注意需要排除通过 loader 加载的 html 文件。

```js
serveInstance.watch(appPath + '/**/*.html').on('change', serveInstance.reload);
```

### eslint 配置


