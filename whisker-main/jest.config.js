module.exports = {
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
        // Required for the ntc node package
        'ndf2':null,
        'ndf':null
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
    testPathIgnorePatterns: [
        "/node_modules/",
        "/dist/"
    ],
    testEnvironment: 'node',
    collectCoverage: true
};
