module.exports = {
    preset: "jest-puppeteer",
    globals: {
        URL: "dist/index.html",
        ACCELERATION: "1"
    },
    testMatch: [
        "**/test/**/*.test.js"
    ],
    verbose: true
}
