## Description

Block-based programming environments like *Scratch* foster engagement
with computer programming and are used by millions of young learners.
Scratch allows learners to quickly create entertaining programs and
games, while eliminating syntactical program errors that could
interfere with progress.

However, functional programming errors may still lead to incorrect
programs, and learners and their teachers need to identify and
understand these errors. This is currently an entirely manual process.

In our paper on **Testing Scratch Programs Automatically**, we 
introduced a formal testing framework that describes
the problem of Scratch testing in detail. We instantiate this formal
framework with the *Whisker* tool, which provides automated and
property-based testing functionality for Scratch programs.

The implementation of Whisker can be found in this repository. 

![Whisker](https://raw.githubusercontent.com/se2p/whisker-main/master/logos/whisker-text-logo.jpg)

Details on writing Whisker tests in JavaScript can be found
[here](HOWTO.md).

## Contributors

This project is developed at the Chair of Software Engineering II in Passau, Germany.

List of contributors:
- Gordon Fraser
- Marvin Kreis
- Andreas Stahlbauer

## Citing

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
