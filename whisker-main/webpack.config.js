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

        // Enable persistent caching with management options
        cache: {
            type: 'filesystem',
            buildDependencies: {
                config: [__filename]
            },
            cacheDirectory: path.resolve(__dirname, '.webpack-cache-web'),
            maxAge: 1000 * 60 * 60, // 1 hour
            compression: 'gzip' // Compress cache files to save space
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
                            transpileOnly: true, // Speeds up compilation by skipping type checking
                            experimentalWatchApi: true, // Enables the experimental watch API for faster incremental builds
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

        // Enable persistent caching with management options
        cache: {
            type: 'filesystem',
            buildDependencies: {
                config: [__filename]
            },
            cacheDirectory: path.resolve(__dirname, '.webpack-cache-node'),
            maxAge: 1000 * 60 * 60, // 1 hour
            compression: 'gzip' // Compress cache files to save space
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
                            transpileOnly: true, // Speeds up compilation by skipping type checking
                            experimentalWatchApi: true, // Enables the experimental watch API for faster incremental builds
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
