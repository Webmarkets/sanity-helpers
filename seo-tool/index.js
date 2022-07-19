// TODO: verbose logging

const Fetcher = require('./Fetcher');
const Extractor = require('./Extractor');
const Logger = require('./Logger');
const process = require('process');

let urlToFetch = process.argv[2];
let docFetcher = new Fetcher([urlToFetch]);
let logger = new Logger(0);
// Overwrite console for custom log messages
console = logger;

docFetcher.getListDocuments().then(docList => {
    docFetcher.cache.commit();
    docList.forEach(document => {
        let seoExtractor = new Extractor(document.data, document.URL);
        console.log(seoExtractor.getPrimarySEO());
    })
})