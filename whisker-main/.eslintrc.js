module.exports = {
    "extends": [
        "../.eslintrc.js",
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/eslint-recommended",
    ],
    "parser": "@typescript-eslint/parser",
    "plugins": [
        "@typescript-eslint",
    ],
    "rules": {
        "@typescript-eslint/no-use-before-define": "off",
        "no-use-before-define": "off",
        "semi": "error"
    },
    "overrides": [
        {
            "files": [
                "*.js"
            ],
            "rules": {
                "@typescript-eslint/no-var-requires": "off"
            }
        },
    ]
};
