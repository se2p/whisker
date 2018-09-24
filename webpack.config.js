const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const path = require('path');

module.exports = [

    /* Web Page */
    {
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        target: 'web',
        entry: {
            'whisker-gui': [
                path.resolve(__dirname, 'src/index.js'),
                path.resolve(__dirname, 'src/index.css'),
                require.resolve('codemirror/lib/codemirror.css'),
                require.resolve('bootstrap/dist/css/bootstrap.css'),
                require.resolve('bootstrap/dist/css/bootstrap-grid.css'),
                require.resolve('datatables.net-bs4/css/dataTables.bootstrap4.css')
            ]
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js'
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
                    loader: 'imports-loader?define=>false'
                },
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader'
                    ]
                }
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: 'whisker-gui.css'
            }),
            new CopyWebpackPlugin([{
                from: path.resolve('src', 'index.html')
            }])
        ],
        optimization: {
            minimizer: [
                new UglifyJsPlugin({}),
                new OptimizeCssAssetsPlugin({})
            ]
        }
    }
];
