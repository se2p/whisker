# The Servant

The Servant is a wrapper around the whisker web client, allowing to run tests automatically in a headless environment (via chrome-headless / (puppeteer)[https://github.com/puppeteer/puppeteer]). It is called the Servant as in "Cats don't have owners they have servants".

# Installation

Checkout the whisker-web repo and cd into whisker-web folder. Then use `npm i && npm run build` to install the whisker web repo's dependencies. Next execute `cd servant && npm i` to cd into the servant's directory and install it's dependencies.

Ready to rumble copy pasta script:
```
mkdir whisker && cd whisker && git clone https://github.com/se2p/whisker-main.git && cd whisker-main && npm i && && npm run build cd .. && git clone https://github.com/nobol/whisker-web.git && cd whisker-web && npm i && npm run build && cd servant && npm i
```

# Usage

From the whisker web repo's servant's folder you can execute `node index.js -h` to start the servant and check the help info:
```
$ > node index.js -h
Usage: index [options]

Options:
  -u, --whiskerURL <URL>        File URL of the Whisker instance to run the tests (default:
                                "../dist/index.html")
  -s, --scratchPath <Path>      Scratch project to run
  -t, --testPath <Path>         Tests to run
  -w, --errorWitnessPath <Path> A JSON error witness to replay
  -f, --frequency <Integer>     Refreshrate of scratch in hz (default: 30)
  -d, --isHeadless              If should run headless (d like in decapitated)
  -p, --numberOfTabs <Integer>  The number of tabs to execute the tests in (default: 1)
  -c, --isConsoleForwarded      If the browser's console output should be forwarded (default: false)
  -o, --isLifeOutputCoverage    If the new output of the coverage should be printed regulary (default: false)
  -l, --isLifeLogEnabled        If the new output of the log should be printed regulary (default: false)
  -g  --isGeneticSearch
  -h, --help                    output usage information
```

The repository already includes some tests and a corresponding test file. You can run those via (with a 10 fold speedup and two parallel executions in a headless chrome instance):
```
node index.js -s project.sb3 -t tests.js -f 300 -d -p 2
```
Now you can check the output of the run, which reflects the content of the output inside the "output" field of a whisker-web instance.

Congratulations, you can run whisker based Scratch tests now in an automated, accelerated and headless way.
