module.exports = function (api) {
    api.cache(true);

    return {
        presets: [
            [
                '@babel/preset-env',
                {
                    targets: {
                        node: 'current',
                        browsers: [
                            'last 2 Chrome versions',
                            'last 2 Firefox versions',
                            'last 2 Opera versions',
                            'last 2 Safari versions'
                        ]
                    }
                }
            ]
        ],
        env: {
            production: {
                presets: [['minify', {builtIns: false}]]
            }
        }
    };
};
