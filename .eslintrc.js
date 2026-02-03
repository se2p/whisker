module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    env: {
        browser: true,
        node: true,
        es6: true,
    },
    overrides: [
        {
            files: [
                'test/**/*.{js,ts}',
            ],
            plugins: [
                'jest'
            ],
            env: {
                jest: true,
            },
        },
    ],
};
