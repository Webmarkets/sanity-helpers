// TODO: verbose logging

const Fetcher = require('./Fetcher');
const Extractor = require('./Extractor');
const process = require('process');
let urlToFetch = process.argv[2];

let docFetcher = new Fetcher([urlToFetch]);

docFetcher.getListDocuments().then(docList => {
    docFetcher.cache.commit();
    docList.forEach(document => {
        let seoExtractor = new Extractor(document.data, document.URL);
        console.log(seoExtractor.getPrimarySEO());
    })
})