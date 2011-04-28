# OMeta/JS

OMeta/JS is a JavaScript implementation of OMeta,
an object-oriented language for pattern matching.

This repository is a fork.
I restructured the code to make compilation easier.
There are also NPM package and a command line utility.

To study Ometa/JS and ask questions about the core is better
to contact the [original repository](http://github.com/alexwarth/ometa-js/)
and its author, [Alessandro Warth](http://github.com/alexwarth).

## Usage

### Command line

Compiles Ometa/JS file to CommonJS module that exports objects grammars.

    > ometajs2js --help
    Usage: ometajs2js [options]

    Options:
        -i, --input : pecifies filename to read the input source, if omit use STDIN
        -o, --output : specifies filename to write the output, if omit use STDOUT
        -h, --help : Output help information

### CommonJS module

`require('ometajs')` provides all grammars in Ometa/JS core.

### Examples

Some projects are using this:

 -   [ShmakoWiki](http://github.com/veged/shmakowiki/)
 -   [OmetaHighlighter](http://github.com/veged/ometa-highlighter)
 -   [XJST](http://github.com/veged/xjst)
