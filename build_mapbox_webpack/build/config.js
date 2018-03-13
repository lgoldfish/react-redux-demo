module.exports = {
    build: {
        publicPath: './',
        cssSourceMap: false,
        isSplit: false,
        customFileName: 'NGR.min.js'
    },
    dev: {
        publicPath: '/',
        port: 8080,
        host: '0.0.0.0',
        devtool: 'cheap-module-eval-source-map',
        cssSourceMap: false,
    },
    useCssModules: true,
    cssAssets: ['src', 'NGRMap'],
    externals: {
        'mapbox-gl': 'window.mapboxgl'
    },
    useEslint: false,
}