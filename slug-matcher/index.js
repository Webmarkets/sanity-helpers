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

let matchedOutputList = { primaryList: [], secondaryList: [], normalizedList: [] };
let unmatchedOutputList = { primaryList: [], primaryNormalizedList: [], secondaryList: [], secondaryNormalizedList: [] };

// main matching logic
for (let i = 0; i < primaryListf.length; i++) {
    let primarySlug = primaryListf[i];
    let matchedSlug = null;

    let j;
    while (!matchedSlug || j < secondaryListf.length) {
        let secondarySlug = secondaryListf[j];
        if (primarySlug.normalized === secondarySlug.normalized) {
            matchedSlug = secondarySlug;
            // remove matched element from secondary array
            secondaryListf.splice(j, 1);
        }
    }

    if (matchedSlug) {
        matchedOutputList.primaryList.push(primarySlug.literal);
        matchedOutputList.secondaryList.push(matchedSlug.literal);
        matchedOutputList.normalizedList.push(primarySlug.normalized);
    } else {
        unmatchedOutputList.primaryList.push(primarySlug.literal);
        unmatchedOutputList.primaryNormalizedList.push(primarySlug.normalized);
    }
}

// get unmatched secondaryList slugs
secondaryListf.forEach(({ literal, normalized }) => {
    unmatchedOutputList.secondaryList.push(literal);
    unmatchedOutputList.secondaryNormalizedList.push(normalized);
});

// TODO arg parsing

/*
Usage:
    slug-matcher [options] <primarySlugFile> <secondarySlugFile> 

Options:
    -o FILE, --ouput=FILE       Specify a file to write to (writes to stdout by default)
    --format=json|netlify|txt   The file format for the ouput
*/