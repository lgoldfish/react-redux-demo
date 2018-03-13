process.env.NODE_ENV = 'production';
const webpack = require('webpack');
const webpackConfig = require('./webpack.pro.conf');

webpack(webpackConfig, (err, stats) => {
    if (err) throw err;

    process.stdout.write(stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
    }) + '\n\n');

    if (stats.hasErrors()) {
        console.log(' Build failed with errors');
        process.exit(1);
    }

    console.log(' Build complete');
});