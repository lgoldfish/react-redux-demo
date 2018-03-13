const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const utils = require('./utils');
const config = require('./config');
const baseWebpackConfig = require('./webpack.base.conf');

baseWebpackConfig.entry.app.unshift('webpack/hot/dev-server');

module.exports = merge(baseWebpackConfig, {
    module: {
        rules: utils.styleLoaders({
            sourceMap: config.dev.cssSourceMap,
            extract: false,
            useCssModules: config.useCssModules,
            cssAssets: config.cssAssets,
        }),
    },
    output: {
        publicPath: config.dev.publicPath,
    },
    mode: 'development',
    devtool: config.dev.devtool,
    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),        
        new webpack.HotModuleReplacementPlugin(),
        // HMR shows correct file names in console on update
        new webpack.NamedModulesPlugin(),
        new HtmlWebpackPlugin({
            template: utils.resolve('public/index.html'),
            inject: true,
            filename: 'index.html',
        }),
        // for static assets
        new CopyWebpackPlugin([
            {
                from: utils.resolve('public'),
                ignore: ['.*', 'index.html']
            }
        ]),
    ]
});
