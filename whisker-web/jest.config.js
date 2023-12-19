module.exports = {
    preset: "jest-puppeteer",
    globals: {
        URL: "dist/index.html",
        ACCELERATION: "2"
    },
    testMatch: [
        "**/test/**/*.test.js"
    ],
    verbose: true,
    testTimeout: 30000
}
