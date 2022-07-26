const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');

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
            return existingTable;
            // return existingTable.filter(entry => {
            //     try {
            //         entry.getDocument(this.directory);
            //         return true;
            //     } catch {
            //         return false;
            //     }
            // });
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

    createEntry(url, response) {
        let date = new Date().toISOString();
        let entryConfig = { url, date }

        // if it's using etag caching
        if (response.headers['etag']) {
            let etag = response.headers['etag'];
            etag = etag.replaceAll(/("|(W\/))/i, "");
            entryConfig = {
                ...entryConfig,
                "type": "etag",
                "id": etag,
                "maxAge": 0
            }
        } else {
            let cacheControl = response.headers['cache-control'];
            let maxAge = 0;
            if (cacheControl) {
                maxAge = cacheControl.match(/(?<=max-age=)[0-9]+/)
                maxAge = (parseInt(maxAge[0]) || 0);
            }
            entryConfig.id = crypto.randomUUID();
            entryConfig.type = "date";
        }

        let entry = new CacheEntry(entryConfig);
        entry.setDocument(this.directory, response.data.toString());
        this.table.push(entry);
    }

    updateEntry(existingEntry, response) {
        this.createEntry(existingEntry.url, response);
        existingEntry.removeDocument(this.directory);
        this.removeEntry(existingEntry.id);
    }

    async validate(entry) {
        let axiosConfig = {
            validateStatus: status => { return true },
            'baseURL': entry.url
        }
        if (entry.type == 'etag') {
            axiosConfig.headers = {
                'If-None-Match': entry.id
            };
        } else {
            axiosConfig.headers = {
                'If-Modified-Since': entry.date
            }
        }

        let response = await axios.get("", axiosConfig);
        // 200 = new content
        if (response.status == 200) {
            this.updateEntry(entry, response);
            // 304 = not modified
        } else if (response.status == 304) {
            let date = new Date().toISOString();
            entry.date = date;
        } else {
            let message = `Unexpected response status: ${response.status}`;
            throw message;
        }
        return response.data.toString();
    }

    commit() {
        fs.writeFileSync(this.directory + '/table.json', JSON.stringify(this.table));
    }
}

module.exports = CacheManager;