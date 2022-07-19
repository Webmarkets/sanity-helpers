const fs = require('fs');

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