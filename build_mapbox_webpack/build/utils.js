const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

function resolve(dir) {
    return path.resolve(__dirname, '..', dir);
}

function createEslintRule() {
    return {
        test: /\.js/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [resolve('src')]
    };
}

function cssLoaders(options = {}) {
    const cssLoader = {
        loader: 'css-loader',
        options: {
            sourceMap: options.sourceMap,
            modules: options.useCssModules,
            localIdentName: '[local]_[hash:base64:10]',
        },
    };

    const postcssLoader = {
        loader: 'postcss-loader',
        options: {
            sourceMap: options.sourceMap,
        },
    };

    function generateLoaders(loaderName, loaderOptions) {
        const loaders = [cssLoader, postcssLoader];

        if (loaderName) {
            loaders.push({
                loader: `${loaderName}-loader`,
                options: { ...loaderOptions, sourceMap: options.sourceMap },
            });
        }

        if (options.extract) {
            return ExtractTextPlugin.extract({
                use: loaders,
                fallback: 'style-loader',
            });
        } else {
            return ['style-loader', ...loaders];
        }
    }

    return {
        css: generateLoaders(),
        less: generateLoaders('less'),
        sass: generateLoaders('sass', { indentedSyntax: true }),
        scss: generateLoaders('sass'),
        stylus: generateLoaders('stylus'),
    };
}

function cssLoadersForNodeModules(options) {
    const loaders = ['css-loader', 'postcss-loader'];
    function generateLoadersForNodeModules(loaderName, loaderOptions) {
        if(loaderName) {
            loaders.push({
                loader: loaderName + '-loader',
                options: loaderOptions,
            });
        }
        if(options.extract) {
            return ExtractTextPlugin.extract({
                use: loaders,
                fallback: 'style-loader',
            });
        } else {
            return ['style-loader'].concat(loaders);
        }
    }

    return {
        css: generateLoadersForNodeModules(),
        less: generateLoadersForNodeModules('less'),
        sass: generateLoadersForNodeModules('sass', { indentedSyntax: true }),
        scss: generateLoadersForNodeModules('sass'),
        stylus: generateLoadersForNodeModules('stylus'),
    };
}

const defaultOptions = {
    useCssModules: true,
    sourceMap: true,
    extract: false,
    cssAssets: [],
};

function styleLoaders(options = defaultOptions) {
    
    const { cssAssets = [] } = options;
    const output = [];
    const projectCssAssets = [];
    const loaders = cssLoaders(options);
    for (let i = 0; i < cssAssets.length; i += 1) {
        projectCssAssets.push(resolve(cssAssets[i]));
    }
    for(let extension in loaders) {
        const loader = loaders[extension];
        output.push({
            test: new RegExp('\\.' + extension + '$'),
            use: loader,
            exclude: [resolve('node_modules')],
            include: projectCssAssets,
        });
    }
    
    const loadersForNodeModules = cssLoadersForNodeModules(options);

    for(let item in loadersForNodeModules) {
        const loader = loadersForNodeModules[item];
        output.push({
            test: new RegExp('\\.' + item + '$'),
            use: loader,
            exclude: projectCssAssets,
            include: [resolve('node_modules')]
        });
    }
    
    return output;
}

module.exports = {
    resolve,
    createEslintRule,
    styleLoaders,
};
