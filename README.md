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

Whisker requires Node.js v24.11.0 and is built using the [yarn](https://classic.yarnpkg.com/lang/en/) (classic) package manager.

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
node servant run -s <Scratch project file> -t <test file>
```

An overview of options is provided using `node servant help`:

```bash
Usage: node servant [options] [command]

A Testing Utility for Scratch 3.0

Options:
  -h, --help                display help for command
  -V, --version             output the version number

Commands:
  open [options]            open the Whisker web interface
  dynamic [options]         dynamic test suites using Neuroevolution
  generate [options]        generate Whisker test suites
  help [options] [command]  display help for command
  model [options]           test with model
  run [options]             run Whisker tests
  witness [options]         generate and replay error witnesses
```
To show further help, additionally pass the name of the command you are interested in, e.g.,
the `run` command: `node servant help run`.
```bash
Usage: node servant run [options]

run Whisker tests

Options:
  -a, --acceleration <Integer>      acceleration factor (default: 1)
  -bm, --max-mutants <Integer>      upper bound of analysed mutants during mutation analysis
  -bt, --mutation-budget <Integer>  timeout for the mutation analysis
  -d, --headless                    run headless ("d" like in "decapitated") (default: false)
  -dm, --download-mutants           downloads the generated mutants
  -h, --help                        display help for command
  -j, --number-of-jobs <Integer>    number of jobs (Chromium tabs) for test execution (default: 1)
  -m, --mutators <String...>        mutation operators to apply
  -s, --scratch-path <Path>         path to file (".sb3") or folder with scratch application(s)
  -t, --test-path <Path>            path to Whisker tests to run (".js")
  -o, --output <Path>               create CSV file with results
  -z, --seed <String>               custom seed for Scratch-VM
  -ta, --trace-attributes           activates tracing of sprite attributes after every executed block (default: false)
  -v, --verbose                     Verbose mode. Prints debug messages. Multiple -v increase verbosity.
```

To run tests in accelerated mode, provide an acceleration factor using the option `-a`. We recommend using an
acceleration factor of at least `10`, but you can also set the acceleration to `Infinity` for maximum acceleration.

For example, the following command runs tests with a 10-fold speedup and two parallel executions in a headless chrome
instance:

```bash
node servant run -s project.sb3 -t tests.js -a 10 -d -j 2
```

## Using Apptainer (Headless Mode)

Alternatively, you can run Whisker in headless mode using Apptainer. This can be beneficial if you want to conduct
large-scale experiments on a computing cluster. To this, build a SIF image of Whisker:
```bash
./build-whisker-container.sh
```
Prerequisites: You need to install Apptainer and Docker on the build machine.
Now, you can run the containerized version of Whisker via
```bash
apptainer run <name-of-the-sif-file>.sif <Whisker args>
```
The main entry point to the container is the wrapper script `whisker-container.sh`, which calls Whisker's servant in
headless mode (using the flags `-d` and `-vv`.) The `<Whisier args>` given by the user will
be forwarded by the script to the servant.

## Writing Tests

Details on writing Whisker tests in JavaScript can be found
[here](HOWTO.md).

## Generating Tests Automatically

The web interface provides the possibility to automatically generate tests. In the web interface, choose an appropriate
search configuration (examples can be found in the `config` directory), and click `Start Test Generation`. Warning: This may
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
Siegfried Steckenbiller\
Emma Wang\
Phil Werli\
Nik Zantner


Whisker is supported by the project FR 2955/3-1 funded by the
"Deutsche Forschungsgemeinschaft".

## References

```
@InProceedings{whisker19,
  author    = {Andreas Stahlbauer and Marvin Kreis and Gordon Fraser},
  title     = {Testing Scratch Programs Automatically},
  booktitle = {{ESEC/SIGSOFT} {FSE}},
  publisher = {{ACM}},
  year      = {2019},
  doi       = {10.1145/3338906.3338910},
}
```

```
@InProceedings{whisker20,
  author    = {Adina Deiner and Christoph Fr{\"{a}}drich and Gordon Fraser and Sophia Geserer and Niklas Zantner},
  title     = {Search-Based Testing for Scratch Programs},
  booktitle = {12th International Symposium on Search-Based Software Engineering},
  series    = {Lecture Notes in Computer Science},
  publisher = {Springer},
  year      = {2020},
  doi       = {10.1007/978-3-030-59762-7_5},
}
```

```
@InProceedings{model22,
  title 		= {Model-based Testing of Scratch Programs},
  author 		= {G{\"o}tz, Katharina and Feldmeier, Patric and Fraser, Gordon},
  booktitle 	= {Proceedings of the International Conference on Software Testing, Verification and Validation (ICST'22)},
  year 			= {2022},
  publisher     = {{IEEE}},
  doi 			= {10.1109/ICST53961.2022.00047}
}
```

```
@Article{whisker23,
  author     = {Adina Deiner and Patric Feldmeier and Gordon Fraser and Sebastian Schweikl and Wengran Wang},
  journal    = {Empirical Software Engineering},
  title      = {Automated Test Generation for Scratch Programs},
  year       = {2023},
  doi        = {10.1007/S10664-022-10255-X},
  publisher  = {Springer Netherlands},
}
```

```
@InProceedings{neuroevolution23,
	author 		= {Feldmeier, Patric and Fraser, Gordon},
	booktitle 	= {Proceedings of the International Conference on Automated Software Engineering (ASE'22)},
	publisher 	= {{ACM}},
	title 		= {Neuroevolution-Based Generation of Tests and Oracles for Games},
	year 		= {2023},
	doi 		= {10.1145/3551349.3556939},
}
```

```
@InProceedings{nuzzlebug24,
  author    = {Adina Deiner and Gordon Fraser},
  title     = {NuzzleBug: Debugging Block-Based Programs in Scratch},
  booktitle = {ACM/IEEE International Conference on Software Engineering (ICSE)},
  publisher = {{IEEE}},
  year      = {2024},
  doi       = {10.1145/3597503.3623331},
}
```

```
@InProceedings{blockbased24,
  author     = {Feldmeier, Patric and Fraser, Gordon and Heuer, Ute and Obermüller, Florian and Steckenbiller, Siegfried},
  booktitle  = {Proceedings of the 24th Koli Calling International Conference on Computing Education Research},
  title      = {A Block-Based Testing Framework for Scratch},
  year       = {2024},
  doi        = {10.1145/3699538.3699547},
  publisher  = {{ACM}}
}
```

```
@InProceedings{novelty24,
  author     = {Feldmeier, Patric and Fraser, Gordon},
  booktitle  = {Proceedings of the 1st ACM International Workshop on Foundations of Applied Software Engineering for Games},
  title      = {Combining Neuroevolution with the Search for Novelty to Improve the Generation of Test Inputs for Games},
  year       = {2024},
  doi        = {10.1145/3663532.3664467},
  publisher  = {{IEEE}}
}
```

```
@Article{repurr25,
  author = {Schweikl, Sebastian and Fraser, Gordon},
  title = {RePurr: Automated Repair of Block-Based Learners’ Programs},
  year = {2025},
  publisher = {{ACM}},
  doi = {10.1145/3715786},
}
```

```
@InProceedings{manyobjective25,
  author     = {Feldmeier, Patric and Schmelz, Katrin and Fraser, Gordon},
  booktitle  = {2025 IEEE Conference on Software Testing, Verification and Validation (ICST)},
  title      = {Many-Objective Neuroevolution for Testing Games},
  year       = {2025},
  doi        = {https://doi.org/10.48550/arXiv.2501.07954},
  publisher  = {{IEEE}}
}
```

```
@Article{learning26,
  author     = {Feldmeier, Patric and Fraser, Gordon},
  journal    = {ACM Transactions on Evolutionary Learning and Optimization},
  title      = {Learning by Viewing: Generating Test Inputs for Games by Integrating Human Gameplay Traces in Neuroevolution},
  year       = {2026},
  doi        = {10.1145/3747189},
  publisher  = {{ACM}}
}
```

```
@InProceedings{10.1145/3832783.3834618,
  author = {Fein, Benedikt and Fraser, Gordon},
  title = {ScratchLog+: Live Analytics of Learners’ Exercise Progress},
  booktitle = {Proceedings of the 41st IEEE/ACM International Conference on Automated Software Engineering},
  year = {2026},
  publisher = {{ACM}},
  doi = {10.1145/3832783.3834618},
}
```





