module.exports = {
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json',
        },
    },
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
        "^.+\\.(js|jsx|mjs)$": "babel-jest"
    },
    "transformIgnorePatterns": [
        "<rootDir>/node_modules/(?!scratch-analysis|scratch-vm)"
    ],

    testMatch: ['**/test/**/*.test.(ts|js)'],
    testEnvironment: 'node',
    collectCoverage: true
}
