const utils = require('./utils');
const config = require('./config');

const needTransForm = [];
for (let i = 0; i < config.needTransform.length; i += 1) {
    needTransForm.push(utils.resolve(config.needTransform[i]));
}

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
                include: needTransForm,
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
