const path = require('path');

module.exports = [

    /* Web */
    {
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        target: 'web',
        entry: {
            whisker: path.resolve('src', 'index.js')
        },

        resolve: {
            extensions: ['.tsx', '.ts', '.js']
        },

        output: {
            library: 'Whisker',
            filename: '[name].js',
            libraryTarget: 'umd',
            path: path.resolve('dist', 'web'),
            clean: true,
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
                    loader: 'expose-loader',
                    options: {
                        exposes: 'Whisker'
                    }
                },
                {
                    test: /\.ts|\.tsx$/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            // Speeds up compilation by skipping type checking.
                            // We validate types by invoking tsc separately.
                            transpileOnly: true,

                            // We do not cache previous builds via experimentalWatchApi
                            // as transpileOnly and incremental builds are incompatible.
                            // https://github.com/TypeStrong/ts-loader/issues/1124#issuecomment-657266185
                        }
                    },
                    exclude: path.resolve(__dirname, '/node_modules/'),
                    include: path.resolve(__dirname, 'src')
                }
            ]
        },
        devtool: 'source-map',
        stats: 'errors-warnings',
    },

    /* Node */
    {
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        target: 'node',
        entry: {
            whisker: path.resolve('src', 'index.js')
        },

        output: {
            filename: '[name].js',
            libraryTarget: 'commonjs2',
            path: path.resolve('dist', 'node'),
            clean: true
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],

            // Polyfills for Node.JS core modules
            // https://webpack.js.org/blog/2020-10-10-webpack-5-release/#automatic-nodejs-polyfills-removed
            fallback: {
                "assert": require.resolve("assert/")
            }
        },

        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    include: path.resolve(__dirname, 'src')
                },
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            // Speeds up compilation by skipping type checking.
                            // We validate types by invoking tsc separately.
                            transpileOnly: true,

                            // We do not cache previous builds via experimentalWatchApi
                            // as transpileOnly and incremental builds are incompatible.
                            // https://github.com/TypeStrong/ts-loader/issues/1124#issuecomment-657266185
                        }
                    },
                    exclude: /node_modules/
                }
            ]
        },
        devtool: 'source-map',
        stats: 'errors-warnings',
    }

];
