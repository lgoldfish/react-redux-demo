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
            main: "./src/main.js"
        },
        output: {
            path: path.resolve( __dirname , "dist"),
            filename:  "[name].js",
            publicPath: './'
            // publicPath:"temp/"
        },
        devServer: {
           contentBase:path.resolve(__dirname),
           host:"10.0.10.13",
           compress:true,
           port:1719,
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
                test:/\.js$/,
                use:{
                    loader:'babel-loader',
                    options:{
                        presets:["es2015"]
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
       
        new webpack.BannerPlugin('aliLoaction'),
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
        new extractTextPlugin("css/[name].css"),
        // new PurifyCSSPlugin({
        //     // 消除未使用的css
        //     paths: glob.sync(path.join(__dirname, '/*.html')),
        //     }),
            //静态文件搬家
        new copyWebpackPlugin([{
            from:path.resolve( __dirname , "static"),
            to:'static'
        }]),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'common'
        }), 
        // new webpack.ProvidePlugin({ jQuery: "jquery", $: "jquery" }),
        //  new uglify()
        new OptimizeCssAssetsPlugin({
            cssProcessorOptions: {  // 引入cssnano后，可在此处配置css压缩规则
                mergeLonghand: false,
                discardComments: { removeAll: true }
            },
            canPrint: true,
        }),	
        new webpack.HotModuleReplacementPlugin()
    ]
};