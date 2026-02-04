module.exports = {
    "extends": [
        "eslint:recommended",
        "plugin:node/recommended",
        "../.eslintrc.js",
    ],
    "rules": {
        "no-unpublished-require": "off",
        "no-unused-vars": [
            "error",
            {
                "varsIgnorePattern": "^_",
                "argsIgnorePattern": "^_"
            }
        ],
        "no-constant-condition": [
            "error",
            {
                // We use busy waiting to detect when a Whisker test has finished.
                "checkLoops": false
            }
        ],
        // We use yarn workspaces where each workspace has its own package.json. In addition, there's also a global
        // package.json. Common dependencies are specified there. This feature doesn't seem to play well with the
        // "no-extraneous-require" rule, which is why it's turned it off below.
        "node/no-extraneous-require": "off"
    }
}
