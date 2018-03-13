module.exports = {
    build: {
        publicPath: './',
        cssSourceMap: false,
        isSplit: false,
        customFileName: 'NGR.min.js',
        customCssName: 'NGR.css',
    },
    dev: {
        publicPath: '/',
        port: 8080,
        host: '0.0.0.0',
        devtool: 'cheap-module-eval-source-map',
        cssSourceMap: false,
    },
    useCssModules: true,
    needTransform: ['src', 'NGRMap'],
    externals: {
        'mapbox-gl': 'window.mapboxgl',
        'wx': 'window.wx',
    },
    useEslint: false,
}