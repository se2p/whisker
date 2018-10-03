module.exports = function (api) {
    return {
        presets: [
            [
                '@babel/preset-env',
                {
                    targets: {
                        node: 'current',
                        browsers: ['last 2 Chrome versions',
                            'last 2 Firefox versions',
                            'last 2 Opera versions',
                            'last 2 Safari versions'
                        ]
                    },
                    forceAllTransforms: api.env('production')
                }
            ]
        ],
        env: {
            production: {
                presets: ['minify']
            }
        }
    };
};
