const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');

module.exports = class Cache {
    constructor(cacheDir, oldCacheInfo) {
        this.cacheDir = cacheDir;
        if (!cacheDir.endsWith('/')) this.cacheDir += '/';
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        this.cacheInfo = oldCacheInfo ? [...oldCacheInfo] : [];
    }

    getItemRef(URL) {
        let existingItem = this.cacheInfo.find(item => item.URL == URL);
        if (!existingItem) return false;
        return existingItem;
    }

    getItem(URL) {
        let existingRef = this.getItemRef(URL);
        if (existingRef) {
            let rawData = fs.readFileSync(this.cacheDir + existingRef.ETag);
            return rawData.toString();
        } else {
            return false;
        }
    }

    // Returns true if an item was removed
    removeItem(URL) {
        let cacheRef = this.getItemRef(URL);
        if (cacheRef && fs.existsSync(this.cacheDir + cacheRef.ETag)) {
            // Remove cache item reference
            this.cacheInfo = this.cacheInfo.filter(item => item.URL != cacheRef.URL);
            fs.rmSync(this.cacheDir + cacheRef.ETag);
            return true;
        } else {
            return false;
        }
    }

    // Returns true if an item was cached
    store(URL, ETag, document) {
        let existingRef = this.getItemRef(URL);

        let writeCacheItem = () => {
            ETag = ETag.replaceAll("\"", "");
            this.cacheInfo.push({ URL, ETag });
            fs.writeFileSync(`${this.cacheDir}` + ETag, document);
            return true;
        }

        if (!existingRef) {
            return writeCacheItem();
        } else if (existingRef.ETag !== ETag) {
            this.removeItem(existingRef.URL);
            return writeCacheItem();
        } else {
            return false;
        }
    }

    commit() {
        if (fs.existsSync(this.cacheDir + 'info.json')) {
            fs.rmSync(this.cacheDir + 'info.json');
        }
        fs.writeFileSync(this.cacheDir + 'info.json', JSON.stringify(this.cacheInfo));
    }
}

class CacheManager {
    constructor(directory) {
        this.directory = directory;
        this.table = this.#initializeTable();
    }

    #initializeTable() {
        if (fs.existsSync(`${this.directory}/table.json`)) {
            let existingTable = fs.readFileSync(`${this.directory}/table.json`);
            existingTable = JSON.parse(existingTable);
            existingTable.map(staticEntry => new CacheEntry(staticEntry));
            return existingTable.filter(entry => {
                try {
                    entry.getDocument(this.directory);
                    return true;
                } catch (err) {
                    return false;
                }
            });
        } else {
            return [];
        }
    }

    findDocument(url) {
        let foundEntry = this.table.find(entry => entry.url == url);
        if (foundEntry) {
            return JSON.stringify(foundEntry.getDocument(this.directory));
        } else {
            return null;
        }
    }

    removeEntry(id) {
        this.table = this.table.filter(entry => {
            if (entry.id == id) {
                entry.removeDocument(this.directory);
                return false;
            } else {
                return true;
            }
        })
    }

    async validate(entry) {
        let axiosConfig = {
            validateStatus: status => { return true }
        }
        if (entry.type == 'etag') {
            axiosConfig.headers = [
                { 'If-None-Match': entry.id }
            ];
        } else {
            axiosConfig.headers = [
                { 'If-Modified-Since': entry.date }
            ]
        }

        let response = await axios.get(entry.url, axiosConfig);
        // 200 = new content
        if (response.status == 200) {
            // TODO: add new entry for new doc
            this.removeEntry(entry.id);
            // 304 = not modified
        } else if (response.status == 304) {

        } else {

        }
    }
}

class CacheEntry {
    constructor({ url, type, id, date, maxAge }) {
        this.url = url;
        this.type = type;
        this.id = id;
        this.date = date;
        this.maxAge = maxAge;
    }

    #getAge() {
        // using unix timestamps
        let created = Math.round(new Date(this.date).getMilliseconds() / 1000);
        let now = Math.round(new Date(this.date).getMilliseconds() / 1000);
        return now - created;
    }

    getDocument(directory) {
        let doc = fs.readFileSync(`${directory}/${this.id}`);
        return doc.toString();
    }

    removeDocument(directory) {
        fs.rmSync(`${directory}/${this.id}`);
    }

    setDocument(directory, document) {
        fs.writeFileSync(`${directory}/${this.id}`, document);
    }

    shouldRevalidate() {
        if (this.type == "etag") {
            return true;
        } else if (this.#getAge() > this.maxAge) {
            return true;
        } else {
            return false;
        }
    }

    serialize() {
        return {
            url: this.url,
            type: this.url,
            id: this.id,
            date: this.date,
            maxAge: this.maxAge
        }
    }
}