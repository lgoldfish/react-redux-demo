process.env.NODE_ENV = 'development';
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const portFinder = require('portfinder');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');

const config = require('./config');
const webpackConfig = require('./webpack.dev.conf');

portFinder.getPort(config.dev.port, (err, port) => {
    if (err) throw err;
    const uri = `http://${config.dev.host}:${port}`;
    // for auto load
    webpackConfig.entry.app.push(`webpack-dev-server/client?${uri}`);

    webpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
            messages: [`Your application running on: ${uri}`],
        },
        onErrors: (err) => console.log(err),
    }));
    const complier = webpack(webpackConfig);
    const server = new WebpackDevServer(complier, {
        inline: true,
        quiet: true,
    });
    server.listen(port, config.dev.host, (err) => {
        if (err) {
            throw err;
        }
    });
});
