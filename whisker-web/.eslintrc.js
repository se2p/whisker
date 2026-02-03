module.exports = {
    extends: [
        '../.eslintrc.js',
        'scratch',
        'scratch/es6'
    ],
    overrides: [
        {
            files: [
                'test/**/*.{js,ts}'
            ],
            globals: {
                // Global variables provided by jest-puppeteer -> Do not flag these as "undefined" when linting
                page: 'writable',
                browser: 'readonly',
                jestPuppeteer: 'readonly'
            },
            rules: {
                'no-constant-condition': [
                    'error', {
                        // We use busy waiting in our integration tests to detect when a test has finished.
                        checkLoops: false
                    }
                ]
            }
        }
    ],

    // Custom overrides and additions.
    rules: {
        // Let's make this into a warning for now. Eventually, lines that are too long should be broken into shorter
        // ones, and then the rule can be turned into an error to prevent future violations.
        'max-len': 'warn',

        // While we appreciate and encourage you to write JSDocs, we do not think enforcing this rule in general is
        // desirable. (1) For easy to understand functions, JSDocs may not provide additional value. (2) Writing an
        // empty JSDoc or inserting placeholders will remove the error. (3) It creates overhead maintaining and keeping
        // every JSDoc up to date. -> Write JSDocs for public APIs and where you think it makes sense.
        'require-jsdoc': 'off',

        // This rule enforces that operator precedence be made explicit via parentheses, e.g., 3 + (2 * 5) instead of
        // 3 + 2 * 5. For some operations, this definitely makes sense, but for others it seems a bit pedantic.
        'no-mixed-operators': 'off',

        // Defining and invoking local functions inside loops can lead to surprising results, especially when making
        // references to variables declared via `var`. However, since we enforce the use of `let` or `const`, we
        // should never run into those problems.
        'no-loop-func': 'off',

        // This rule only exists for historical reasons and nowadays, it is no longer necessary to use it.
        'no-return-await': 'off',

        // The idea of the rule is: If you defined an async function, you'll likely also want to use await somewhere in
        // the body. However, sometimes your computation is sync but the interface still expects a Promise. Using async
        // functions is a convenient way to automatically create a Promise from a sync computation while also ensuring
        // proper async error handling.
        'require-await': 'off',

        // Adds the `argsIgnorePattern` to the rule inherited by scratch or scratch/es6.
        'no-unused-vars': ['error', {args: 'after-used', varsIgnorePattern: '^_', argsIgnorePattern: '^_'}],

        // As discussed in MR !717, we prefer function declarations over expressions.
        'func-style': 'off',

        'space-before-function-paren': [
            'error', {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always'
            }
        ]
    }
};
