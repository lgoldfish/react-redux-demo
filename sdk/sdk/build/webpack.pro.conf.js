const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const merge = require('webpack-merge');

const baseWebpackConfig = require('./webpack.base.conf');
const utils = require('./utils');
const config = require('./config');

module.exports = merge(baseWebpackConfig, {
    module: {
        rules: utils.styleLoaders({
            sourceMap: config.build.cssSourceMap,
            useCssModules: true,
            extract: true,
            cssAssets: config.needTransform,
        }),
    },
    output: {
        publicPath: config.build.publicPath,
        path: utils.resolve('dist'),
        filename: config.build.isSplit ? '[name].[chunkhash].js' : config.build.customFileName,
        chunkFilename: config.build.isSplit ? '[id].[chunkhash].js' : config.build.customFileName,
    },
    mode: 'production',
    plugins: [
        new CleanWebpackPlugin(utils.resolve('dist'), { 
            root: utils.resolve('/'),
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: utils.resolve('public/index.html'),
            inject: true,
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeAttributeQuotes: true,
            },
            chunksSortMode: 'dependency',
        }),
        new CopyWebpackPlugin([
            {
                from: utils.resolve('public'),
                ignore: ['.*', 'index.html'],
            }
        ]),
        new ExtractTextPlugin({
            filename: config.build.customCssName || '[name].[chunkhash].css',
            allChunks: true,
        }),
    ],
    optimization: config.build.isSplit ? {
        runtimeChunk: {
            name: "manifest"
        },
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /node_modules/,
                    name: "vendor",
                },
            },
        },
    } : {},
});