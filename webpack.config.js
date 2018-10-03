const path = require('path');

module.exports = [

    /* Web */
    {
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        target: 'web',
        entry: {
            whisker: path.resolve('src', 'index.js')
        },
        output: {
            library: 'Whisker',
            filename: '[name].js',
            libraryTarget: 'umd',
            path: path.resolve('dist', 'web')
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    include: path.resolve(__dirname, 'src')
                },
                {
                    test: path.resolve('src', 'index.js'),
                    loader: 'expose-loader?Whisker'
                }
            ]
        },
        devtool: 'source-map'
    }

];
