const fs = require('fs');
const { exit } = require('process');
const path = require('path');
const normalizeSlug = require('./normalizeSlug.js');

const readFileAsArray = inputPath => {
    if (!fs.existsSync(inputPath)) {
        console.error(`Path ${inputPath} does not exist. Exiting...`);
        exit(1);
    }

    let file = fs.readFileSync(inputPath);

    if (inputPath.extname(inputPath) == 'txt') {
        file = file.toString();
        return file.split('\n');
    } else if (inputPath.extname(inputPath) == 'json') {
        file = JSON.parse(file);
        if (Array.isArray(file)) {
            return file;
        } else {
            console.error(`Please use an array in input file ${inputPath}`);
            exit(1);
        }
    } else {
        console.error(`File ${path} uses an unsupported file format. Please use a json or txt file.`);
        exit(1);
    }
}

const removeDuplicateElements = arr => {
    return arr.filter((element, index) => {
        return arr.indexOf(element, index) === index;
    });
}

const getFormattedSlugs = slugArray => {
    let uniqueSlugArray = removeDuplicateElements(slugArray);
    return uniqueSlugArray.map(slugLiteral => normalizeSlug(slugLiteral));
}

const primaryList = readFileAsArray(process.argv[2]);
const secondaryList = readFileAsArray(process.argv[3]);

let primaryListf = getFormattedSlugs(primaryList);
let secondaryListf = getFormattedSlugs(secondaryList);

let matchedOutputList = {primaryList: [], secondaryList: [], normalizedList: []};
let unmatchedOutputList = {primaryList: [], primaryNormalizedList: [], secondaryList: [], secondaryNormalizedList: []};
