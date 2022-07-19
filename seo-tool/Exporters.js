const sanityClient = require('@sanity/client');

class Exporter {
    constructor(seoDataList) {
        this.list = seoDataList;
    }

    getShortTitle(seoTitle) {
        let shortTitle = seoTitle.match(/^[^\|\n]+(?=\|*)/);
        if (!shortTitle) {
            console.warn(`Unable to find shorter title for ${seoTitle}`);
        } else {
            return shortTitle.trim();
        }
    }

    removeNullFields(seo) {
        let validSeo = {};
        let fields = Object.keys(seo);
        fields.forEach(field => {
            if (seo[field] !== null) {
                // recursively purge null fields
                if (typeof seo[field] == 'object') {
                    validSeo[field] = this.removeNullFields(seo[field]);
                } else {
                    validSeo[field] = seo[field];
                }
            }
        });
        return validSeo;
    }
}

class SanityExporter extends Exporter {
    constructor(seoDataList, sanityConfig, options) {
        super(seoDataList);
        try {
            this.validateConfig(sanityConfig);
            this.client = sanityClient(sanityConfig);
        } catch (err) {
            throw err;
        }
        this.useDrafts = (options.useDrafts || false);
        if (options.dryRun) {
            console.warn('Dry run is enabled. No documents will be exported.');
            this.dryRun = true;
        } else {
            this.dryRun = false;
        }
    }

    validateConfig(sanityConfig) {
        let requiredKeys = ['projectId', 'dataset', 'apiVersion', 'token'];
        requiredKeys.forEach(key => {
            if (!sanityConfig[key]) {
                let msg = `Missing required key in Sanity configuration: ${key}`;
                throw msg;
            }
        });
    }

    createSanityDocument(data, title, type) {
        let doc = {};
        doc.seo = { ...data };

        if (this.useDrafts) {
            doc._id = "drafts.";
        }

        if (!title) {
            doc.title = doc.seo.title;
        } else {
            doc.title = title;
        }

        if (!type) {
            throw 'Please provide a valid type for new Sanity documents';
        } else {
            doc._type = type;
        }

        return doc;
    }

    async export(type) {
        let sanityDocs = this.list.map(seo => {
            let cleanSeo = super().removeNullFields(seo);
            let title = super().getShortTitle(seo.title);
            return this.createSanityDocument(cleanSeo, title, type);
        })

        let pendingExports = sanityDocs.map(async doc => {
            console.log(`Exporting document ${doc.title}`, 1);
            return await this.client.create(doc, { dryRun: this.dryRun });
        });

        let successfulDocs = 0;
        await Promise.allSettled(pendingExports).then(values => {
            values.forEach(promise => {
                if (promise.status == 'rejected') {
                    console.error(`Failed to export document: ${promise.reason}`);
                } else {
                    console.success(`Exported document`, 1);
                    successfulDocs++;
                }
            });
            console.info(`Successfully exported ${successfulDocs}/${this.list.length} documents`);
        })
    }
}

module.exports = { Exporter, SanityExporter }