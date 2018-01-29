// 一个常见的`webpack`配置文件
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const uglify = require("uglifyjs-webpack-plugin")
const path = require("path")
const glob = require('glob');	
const PurifyCSSPlugin = require("purifycss-webpack");	
const copyWebpackPlugin= require("copy-webpack-plugin");
const extractTextPlugin = require("extract-text-webpack-plugin");
// 压缩css
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
module.exports = {
        entry:{
            main: "./src/main.js",
            "ngr.min":"./static/js/ngr.min.js"
        },
        output: {
            path: path.resolve( __dirname , "dist"),
            filename:  "[name].js",
            publicPath: '/'
            // publicPath:"temp/"
        },
        devServer: {
           contentBase:path.resolve(__dirname),
           host:"10.0.10.13",
           compress:true,
           port:1717,
           publicPath: '/'
        },


    resolve: {
        alias: {
            libs: path.resolve(__dirname, 'static', 'js'),
        }
    },   
    module:{
        rules: [
            {      
            test: /\.css$/,
            use: extractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                    { loader: 'css-loader', options: { importLoaders: 1 } },
                    'postcss-loader'
                ]
            })
          },{
               test:/\.(png|jpg|gif)/ ,
               use:[{
                   loader:'url-loader',
                   options:{
                       limit:500000
                   }
               }]
            },
            {
                test:/\.(jsx|js)$/,
                use:{
                    loader:'babel-loader',
                    options:{
                        presets:[
                            "es2015","react"
                        ]
                    }
                },
                exclude:/node_modules/
            },
            {
            test: /\.(htm|html)$/i,
                use:[ 'html-withimg-loader'] 
            }
          ]
    },

    externals: {
        $: 'jQuery',
        NGR: 'NGR',
        vConsole : "vConsole"
    },

    plugins: [
        new uglify(),
        new webpack.BannerPlugin('alipay'),
        new HtmlWebpackPlugin({
            minify:{
                removeAttributeQuotes:true,
                removeComments: true,
                collapseWhitespace: true,
            },
            // hash:true,
            inject: 'body',
            template:"./index.html"
        }),
        new webpack.ProvidePlugin({
            $:"jquery"
        }),
        new PurifyCSSPlugin({
            // 消除未使用的css
            paths: glob.sync(path.join(__dirname, 'src/*.html')),
            })
            ,
            //静态文件搬家
        new copyWebpackPlugin([{
            from:path.resolve( __dirname , "static"),
            to:'static'
        },{
            from:path.resolve( __dirname , "src/css"),
            to:'css'
        }]),
        new extractTextPlugin("css/[main].css"),
        // new webpack.optimize.CommonsChunkPlugin({
        //     name: 'common'
        // }), 
        new OptimizeCssAssetsPlugin({
            cssProcessorOptions: {  // 引入cssnano后，可在此处配置css压缩规则
                mergeLonghand: false,
                discardComments: { removeAll: true }
            },
            canPrint: true,
        }),	
        // new webpack.ProvidePlugin({ jQuery: "jquery", $: "jquery" })
    ]
};