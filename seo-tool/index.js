const Fetcher = require('./Fetcher');
const Extractor = require('./Extractor');
const Logger = require('./Logger');
const { DataStore } = require('./Exporters');
const process = require('process');

let urlToFetch = process.argv[2];
let docFetcher = new Fetcher([urlToFetch]);
let logger = new Logger(1);
// Overwrite console for custom log messages
console = logger;

process.on('uncaughtException', exception => {
    console.exception(exception.message);
    process.exit();
})

docFetcher.getListDocuments().then(docList => {
    docFetcher.cache.commit();
    let seoDataList = docList.map(document => {
        let seoExtractor = new Extractor(document.data, document.URL);
        return seoExtractor.getPrimarySEO();
    });

    let exporter = new DataStore(seoDataList);
    exporter.export();
})