![Whisker Logo](https://raw.githubusercontent.com/se2p/whisker-main/master/logos/whisker-text-logo.jpg)

Whisker is an automated testing framework for [Scratch](https://scratch.mit.edu/) projects.



## Description

Block-based programming environments like *Scratch* foster engagement
with computer programming and are used by millions of young learners.
Scratch allows learners to quickly create entertaining programs and
games, while eliminating syntactical program errors that could
interfere with progress.

However, functional programming errors may still lead to incorrect
programs, and learners and their teachers need to identify and
understand these errors. This is currently an entirely manual process.

Whisker provides automated and property-based testing functionality for Scratch programs.


## Building Whisker

Whisker is built using the [yarn](https://yarnpkg.com/) package manager.

After cloning the repository, install all dependencies using:

```bash
yarn install
```

Now you can build the application using:
```bash
yarn build
```

## Running Whisker

After building Whisker, simply open 'whisker-web/dist/index.html' in your browser (e.g. Firefox)

```
firefox whisker-web/dist/index.html
```

The Servant is a wrapper around the web client, allowing to run tests automatically in a headless environment (via chrome-headless / [puppeteer](https://github.com/puppeteer/puppeteer)). It is called the Servant as in "Cats don't have owners they have servants".

To use Whisker on the command line, you can use the Servant node frontend as follows:

```bash
node servant/servant.js -s <Scratch project file> -t <test file>
```

The full list of options is provided using `node servant/servant.js -h`:

```bash
Usage: servant [options]

Options:
  -u, --whiskerURL <URL>              File URL of the Whisker instance to run the tests (default:
                                      "../whisker-web/dist/index.html")
  -s, --scratchPath <Path>            Scratch application to run, or directory containing results (default:
                                      false)
  -t, --testPath <Path>               Tests to run (default: false)
  -a, --accelerationFactor <Integer>  Acceleration factor (default: 1)
  -v, --csvFile <Path>                Name of CSV File to put output into (default: false)
  -c, --configPath <Path>             Path to a configuration file (default:
                                      "../whisker-main/config/default.json")
  -d, --isHeadless                    If should run headless (d like in decapitated)
  -p, --numberOfTabs <Integer>        The number of tabs to execute the tests in (default: 1)
  -k, --isConsoleForwarded            If the browser's console output should be forwarded (default: false)
  -o, --isLiveOutputCoverage          If new output of the coverage should be printed regularly (default: false)
  -l, --isLiveLogEnabled              If the new output of the log should be printed regularly (default: false)
  -g, --isGeneticSearch               If new tests should be generated via genetic search (default: false)
  -h, --help                          display help for command
```

To run tests in accelerated mode, provide an acceleration factor using the option `-a`. We recommend using an acceleration factor of at most 10, as very low execution times may lead to non-deterministic program behaviour.

For example, the following command runs tests with a 10 fold speedup and two parallel executions in a headless chrome instance:

```
node servant.js -s project.sb3 -t tests.js -a 10 -d -p 2
```



## Writing Tests

Details on writing Whisker tests in JavaScript can be found
[here](HOWTO.md).

## Generating Tests Automatically

The web interface provides the possibility to automatically generate tests. In the web interface, choose an appropriate search configuration (examples can be found in the `config` directory), and click `Run Search`. Warning: This may take a while! Once the search has completed, the generated tests are loaded into the editor window.

If you run test generation with Servant (command line option `-g`), at the end of the search a file called `tests.js`
is created in the current directory which contains the tests. These can now be loaded into Whisker.

## Contributors

Whisker is developed at the
[Chair of Software Engineering II](https://www.fim.uni-passau.de/lehrstuhl-fuer-software-engineering-ii/)
of  the [University of Passau](https://www.uni-passau.de).

Contributors:

Adina Deiner\
Christoph Frädrich\
Gordon Fraser\
Sophia Geserer\
Eva Gründinger\
Marvin Kreis\
Andreas Stahlbauer\
Nik Zantner


Whisker is supported by the project FR 2955/3-1 funded by the
"Deutsche Forschungsgemeinschaft".

## References

```
@inproceedings{DBLP:conf/sigsoft/StahlbauerKF19,
  author    = {Andreas Stahlbauer and
               Marvin Kreis and
               Gordon Fraser},
  title     = {Testing scratch programs automatically},
  booktitle = {{ESEC/SIGSOFT} {FSE}},
  pages     = {165--175},
  publisher = {{ACM}},
  year      = {2019}
}
```

```
@inproceedings{DBLP:conf/ssbse/DeinerFFGZ20,
  author    = {Adina Deiner and Christoph Fr{\"{a}}drich and
               Gordon Fraser and Sophia Geserer and
               Niklas Zantner},
  title     = {Search-Based Testing for Scratch Programs},
  booktitle = {12th International Symposium on Search-Based Software Engineering},
  series    = {Lecture Notes in Computer Science},
  volume    = {12420},
  pages     = {58--72},
  publisher = {Springer},
  year      = {2020},
}
```
