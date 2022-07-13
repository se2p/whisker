![Whisker Logo](logos/whisker-text-logo.png)

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

```bash
firefox whisker-web/dist/index.html
```

The Servant is a wrapper around the web client, allowing to run tests automatically in a headless environment
(via chrome-headless / [puppeteer](https://github.com/puppeteer/puppeteer)). It is called the Servant as in
"Cats don't have owners they have servants".

To use Whisker on the command line, you can use the Servant node frontend as follows:

```bash
cd servant
node servant.js run -s <Scratch project file> -t <test file>
```

An overview of options is provided using `node servant.js help`:

```bash
Usage: node servant.js [options] [command]

A Testing Utility for Scratch 3.0

Options:
  -h, --help                display help for command
  -V, --version             output the version number

Commands:
  dynamic [options]         dynamic test suites using Neuroevolution
  generate [options]        generate Whisker test suites
  help [options] [command]  display help for command
  model [options]           test with model
  mutation [options]        run mutation tests
  run [options]             run Whisker tests
  witness [options]         generate and replay error witnesses
```
To show further help, additionally pass the name of the command you are interested in, e.g.,
the `run` command: `node servant.js help run`.
```bash
Usage: node servant.js run [options]

run Whisker tests

Options:
  -a, --acceleration <Integer>    acceleration factor (default: 1)
  -d, --headless                  run headless ("d" like in "decapitated")
  -h, --help                      display help for command
  -k, --console-forwarded         forward browser console output
  -l, --live-log                  print new log output regularly
  -o, --live-output-coverage      print new coverage output regularly
  -p, --number-of-tabs <Integer>  number of tabs to execute the tests in (default: 8)
  -s, --scratch-path <Path>       path to file (".sb3") or folder with scratch application(s)
  -t, --test-path <Path>          path to Whisker tests to run (".js")
  -v, --csv-file <Path>           create CSV file with results
  -z, --seed <Integer>            seed Scratch-VM with given integer
```

To run tests in accelerated mode, provide an acceleration factor using the option `-a`. We recommend using an
acceleration factor of at most 10, as very low execution times may lead to non-deterministic program behaviour.

For example, the following command runs tests with a 10 fold speedup and two parallel executions in a headless chrome
instance:

```bash
node servant.js run -s project.sb3 -t tests.js -a 10 -d -p 2
```

## Using Docker (Headless Mode)

Alternatively, you can build and run Whisker in headless mode using docker. This can be beneficial if you want to
conduct large-scale experiments on a computing cluster. To this, create a Docker image for Whisker, for example using
the command
```bash
docker build -t whisker .
```
Now, you can run the dockerized version of Whisker via
```bash
docker run whisker <additional arguments>
```
The main entry point to the container is the wrapper script `whisker-docker.sh`, which calls Whisker's servant in
headless mode (using the flags `-d`, `-k` and `-l`, among others.) Any `<additional arguments>` given by the user will
be forwarded by the script to the servant.

In case you want to copy the artefacts created by Whisker (including redirection of stdout and stderr) to files in a
writable bind mount, you can achieve this for example as follows:
```bash
docker run -v "/on/the/host:/inside/the/container" whisker /inside/the/container -- <Whikser arguments>
```
This will mount the directory `/on/the/host` as `/inside/the/container`, instruct Whisker to copy its output (such as
generated test files and log messages) to files in `/inside/the/container`, and make them accessible to you in the
directory `/on/the/host`.

## Writing Tests

Details on writing Whisker tests in JavaScript can be found
[here](HOWTO.md).

## Generating Tests Automatically

The web interface provides the possibility to automatically generate tests. In the web interface, choose an appropriate
search configuration (examples can be found in the `config` directory), and click `Test Generation`. Warning: This may
take a while! Once the search has completed, the generated tests are loaded into the editor window.

If you run test generation with Servant (command line option `-g`), at the end of the search a file called `tests.js`
is created in the current directory which contains the tests. These can now be loaded into Whisker.

## Contributors

Whisker is developed at the
[Chair of Software Engineering II](https://www.fim.uni-passau.de/lehrstuhl-fuer-software-engineering-ii/)
of  the [University of Passau](https://www.uni-passau.de).

Contributors:

Adina Deiner\
Patric Feldmeier\
Christoph Frädrich\
Gordon Fraser\
Sophia Geserer\
Katharina Götz\
Eva Gründinger\
Nina Körber\
Marvin Kreis\
Sebastian Schweikl\
Andreas Stahlbauer\
Emma Wang\
Phil Werli\
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

```
@misc{götz2022modelbased,
      title={Model-based Testing of Scratch Programs},
      author={Katharina Götz and Patric Feldmeier and Gordon Fraser},
      year={2022},
      eprint={2202.06271},
      archivePrefix={arXiv},
      primaryClass={cs.SE}
}
```

```
@misc{deiner2022automated,
      title={Automated Test Generation for Scratch Programs},
      author={Adina Deiner and Patric Feldmeier and Gordon Fraser and Sebastian Schweikl and Wengran Wang},
      year={2022},
      eprint={2202.06274},
      archivePrefix={arXiv},
      primaryClass={cs.SE}
}
```
