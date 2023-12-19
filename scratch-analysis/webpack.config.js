const path = require('path');

module.exports = [

    /* JS */
    {
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        target: 'web',
        entry: {
            'scratch-analysis': path.resolve(__dirname, 'index.js')
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
            clean: true,
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    include: path.resolve(__dirname, 'src')
                },
            ]
        },
        resolve: {
            extensions: ['.js']
        },
        devtool: 'source-map',
        stats: 'errors-warnings',
    }
];
