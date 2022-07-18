const axios = require('axios');
const fs = require('fs');
const Cache = require('./Cache');

module.exports = class Fetcher {
    constructor(list, options) {
        this.list = list;
        if (options) {
            this.options = options;
        } else {
            this.options = { cacheDir: '/cache' };
        }
        let oldCacheInfo = __dirname + this.options.cacheDir + '/info.json';
        if (fs.existsSync(oldCacheInfo)) {
            let oldCacheData = fs.readFileSync(oldCacheInfo);
            this.cache = new Cache(__dirname + this.options.cacheDir, JSON.parse(oldCacheData.toString()));
        } else {
            this.cache = new Cache(__dirname + this.options.cacheDir);
        }
    }

    async getListDocuments() {
        let pendingDocs = this.list.map(async URL => {
            let fetchedItem = { URL };
            try {
                let retrievedDoc = await this.get(URL);
                fetchedItem.status = "success";
                fetchedItem.data = retrievedDoc;
            } catch (err) {
                let msg = `Failed to retrieve document ${URL}: ${err.message}`;
                console.error(msg);
                fetchedItem.status = "failure";
            }
            return fetchedItem;
        });
        let finishedDocs = await Promise.allSettled(pendingDocs);
        return finishedDocs.map(promiseResult => {
            return promiseResult.value;
        })
    }

    async get(URL) {
        let cachedRef = this.cache.getItemRef(URL);
        if (cachedRef) {
            return await this.getCachedDocument(cachedRef, URL);
        } else {
            return await this.getUncachedDocument(URL);
        }
    }

    async getCachedDocument(cacheRef, URL) {

        let axiosOptions = {
            headers: { 'If-None-Match': `"${cacheRef.ETag}"` },
            validateStatus: () => {
                return true;
            }
        }

        // check if cache item is still valid
        let response = await axios.get(URL, axiosOptions);

        // 304: Not Modified - cache is fine
        // 200: OK - requested resource has been updated
        if (response.status == 304) {
            return this.cache.getItem(URL);
        } else if (response.status == 200) {
            let ETag = response.headers['ETag'];
            this.cache.removeItem(URL);
            if (ETag) {
                // store new item
                this.cache.store(URL, ETag, response.data);
            }
            return response.data;
        } else {
            let message = `Unexpected server status ${response.status} for request ${URL}`;
            throw message;
        }
    }

    async getUncachedDocument(URL) {
        let response = await axios.get(URL);

        if (response.status == 200) {
            let ETag = response.headers['etag'];
            if (ETag) {
                this.cache.store(URL, ETag, response.data);
            }
            return response.data;
        } else {
            let message = `Unexpected server status ${response.status} for request ${URL}`;
            throw message;
        }
    }

    // ! don't forget to cache commit after new entries are written
}