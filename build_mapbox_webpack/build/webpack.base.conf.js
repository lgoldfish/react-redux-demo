const utils = require('./utils');
const config = require('./config');

module.exports = {
    entry: {
        app: [utils.resolve('NGRMap/index.js')],
    },
    output: {
        filename: '[name].js',
    },
    externals: config.externals,
    module: {
        rules: [
            ...(config.useEslint ? [utils.createEslintRule()] : []),
            {
                test: /\.js/,
                loader: 'babel-loader',
                include: [utils.resolve('src')]
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: 'img/[name].[hash:7].[ext]'
                }
            }
        ]
    }
};
