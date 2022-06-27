const fs = require('fs');
const {InvalidArgumentError} = require('commander');
const {isAbsolute, resolve, dirname} = require('path');

function canonicalize(path) {
    return isAbsolute(path) ? path : resolve(__dirname, path);
}

function mustBeFile(path, extension = "") {
    if (!fs.existsSync(path)) {
        throw new InvalidArgumentError('File must exist.');
    }

    if (!fs.lstatSync(path).isFile()) {
        throw new InvalidArgumentError('Must be a file.')
    }

    if (!path.endsWith(extension)) {
        throw new InvalidArgumentError(`Must be "*${extension}" file.`);
    }
}

function mustBeDirectory(path) {
    if (!fs.existsSync(path)) {
        throw new InvalidArgumentError('Directory must exist.');
    }

    if (!fs.lstatSync(path).isDirectory()) {
        throw new InvalidArgumentError('Must be a directory.')
    }
}

function mustNotExist(path) {
    if (fs.existsSync(path)) {
        throw new InvalidArgumentError('Already exists.');
    }
}

function mustBePositiveInt(value) {
    if (isNaN(value) || value < 1) {
        throw new InvalidArgumentError('Must be positive integer.');
    }
}

function processFilePathExists(path, extension = '') {
    path = canonicalize(path);
    mustBeFile(path, extension);
    return path;
}

function processFilePathNotExists(path) {
    path = canonicalize(path);
    mustNotExist(path);
    mustBeDirectory(dirname(path));
    return path;
}

function processDirPathExists(path) {
    path = canonicalize(path);
    mustBeDirectory(path);
    return path;
}

function processFileOrDirPathExists(path, extension = '') {
    path = canonicalize(path);
    let isDirectory = undefined;

    try {
        mustBeFile(path, extension);
        isDirectory = false;
    } catch {
        try {
            mustBeDirectory(path);
            isDirectory = true;
        } catch {
            throw new InvalidArgumentError(`Must be directory or "*${extension}" file.`);
        }
    }

    return {
        path,
        isDirectory,
    }
}

function processPositiveInt(value) {
    value = parseInt(value);
    mustBePositiveInt(value);
    return value;
}

module.exports = {
    processFilePathExists,
    processDirPathExists,
    processFileOrDirPathExists,
    processFilePathNotExists,
    processPositiveInt,
}
