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

    serveInstance.watch(appPath + '/index.html').on('change', serveInstance.reload);
});


gulp.task('build', () => {

});

gulp.task('watch', ['serve']);
gulp.task('default', ['serve']);