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
        filename: '[name]-[hash:6].bundle.js',
        publicPath: '/'
    },

    module: {
        loaders: [
            {test: /\.js$/, exclude: /node_modules/, loader: 'babel'},
            {test: /\.(htm|html)$/i, loader: 'html-withimg-loader'},
            {test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192'},
            {test: /\.less$/, loader: 'style!css!less'},
            {test: /\.css$/, loader: 'style!css'}
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
