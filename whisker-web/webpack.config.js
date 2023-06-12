const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = [

    /* CSS + HTML */
    {
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        target: 'web',
        entry: {
            'whisker-gui': [
                require.resolve('codemirror/lib/codemirror.css'),
                require.resolve('bootstrap/dist/css/bootstrap.css'),
                require.resolve('bootstrap/dist/css/bootstrap-grid.css'),
                require.resolve('bootstrap-slider/dist/css/bootstrap-slider.css'),
                require.resolve('datatables.net-bs4/css/dataTables.bootstrap4.css'),
                path.resolve(__dirname, 'src/index.css')
            ]
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader'
                    ]
                },
                {
                    test: /\.(gif|png|jpe?g|svg)$/i,
                    use: [
                        'file-loader',
                        {
                            loader: 'image-webpack-loader',
                            options: {
                                bypassOnDebug: true, // webpack@1.x
                                disable: true, // webpack@2.x and newer
                            },
                        },
                    ],
                }
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: '[name].css'
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'src/index.html',
                    },
                    {
                        from: 'src/html',
                        to: 'html'
                    },
                    {
                        from: 'src/assets',
                        to: 'assets'
                    },
                    {
                        from: 'src/locales',
                        to: 'locales'
                    },
                    {
                        from: 'src/examples',
                        to: 'examples'
                    },
                    {
                        from: 'src/includes',
                        to: 'includes'
                    }
                ]
            })
        ],
        optimization: {
            minimizer: [
                new OptimizeCssAssetsPlugin()
            ]
        },
        stats: 'errors-warnings',
    },

    /* JS */
    {
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        target: 'web',
        entry: {
            'whisker-gui': path.resolve(__dirname, 'src/index.js')
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    include: path.resolve(__dirname, 'src')
                },
                {
                    test: require.resolve('datatables.net'),
                    loader: 'imports-loader',
                    options: {
                        additionalCode: 'const define = false;'
                    }
                },
                {
                    test: /\.ts$/,
                    loader: 'ts-loader'
                    // TODO: Include only 'src' once whisker-main isn't included through '../../whisker-main' anymore.
                    // include: path.resolve(__dirname, 'src')
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js'],

            // Polyfills for Node.JS core modules
            // https://webpack.js.org/blog/2020-10-10-webpack-5-release/#automatic-nodejs-polyfills-removed
            fallback: {
                url: require.resolve("url/"),
                stream: require.resolve("stream-browserify"),
            }
        },
        plugins: [
            // Required because 'process' and 'Buffer' are no longer poly-filled automatically.
            // See https://stackoverflow.com/a/65018686 and https://stackoverflow.com/a/68723223
            new webpack.ProvidePlugin({
                process: 'process/browser',
            }),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
        ],
        devtool: 'source-map',
        stats: 'errors-warnings',
    }
];
