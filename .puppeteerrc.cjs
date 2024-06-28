const {join} = require('path');

// https://pptr.dev/troubleshooting#could-not-find-expected-browser-locally
// https://pptr.dev/guides/configuration#changing-the-default-cache-directory

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
