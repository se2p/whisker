# The Runner

The Runner is a wrapper around the whisker web client, allowing to run tests automatically in a headless environment (via chrome-headless / (puppeteer)[https://github.com/puppeteer/puppeteer]).

# Installation

Checkout the whisker-web repo and cd into whisker-web folder. Then use `npm i && npm run build` to install the whisker web repo's dependencies. Next execute `cd runner && npm i` to cd into the runner's directory and install it's dependencies.

# Usage

From the whisker web repo's runner's folder you can execute `node index.js -h` to start the runner and whos the help screen:
```
$ > node index.js -h
Usage: index [options]

Options:
  -u, --whiskerURL <URL>        URL of the Whisker instance to run the tests (default: "../dist/index.html")
  -s, --scratchPath <Path>      Scratch project to run (default: "./project.sb3")
  -t, --testPath <Path>         Tests to run (default: "./tests.js")
  -f, --frequency <Integer>     Refreshrate of scratch in hz (default: 30)
  -d, --isHeadless              If should run headless (d like in decapitated)
  -p, --numberOfTabs <Integer>  The number of tabs to execute the tests in (default: 1)
  -c, --isConsoleForwarded      If the browser's console output should be forwarded
  -h, --help                    output usage information
```

The repository already includes some tests and a corresponding test file. You can run those via (with a 10 fold speedup and two parallel executions in a headless chrome instance):
```
node index.js -s project.sb3 -t tests.js -f 300 -d -p 2
```
Now you can check the output of the run, which reflects the content of the output inside the "output" field of a whisker-web instance.

Congratulations, you can run whisker based Scratch Tests now in an automated, accelerated and headless way.
