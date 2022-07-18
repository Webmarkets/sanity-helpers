const { parse } = require('node-html-parser');
module.exports = class Extractor {
    constructor(HTMLDocument, URL) {
        this.document = parse(HTMLDocument);
        this.URL = URL;
        this.head = this.document.querySelector('head');
        this.body = this.document.querySelector('body');
    }

    getTitle() {
        let title = this.head.querySelector('title');
        return title ? title.innerText : null;
    }

    getDescription() {
        let description = this.head.querySelector('meta[name="description"]');
        if (description) {
            return description.getAttribute('content');
        }
        return null;
    }

    getCanonical() {
        let canonical = this.head.querySelector('link[rel="canonical"]');
        if (!canonical) return null;
        let URL = canonical.getAttribute('href');
        let isCanonical = URL == this.URL;
        return {
            isCanonical,
            URL
        }
    }

    getRobots() {
        // generic implementation, but more specific rules could be added for
        // googlebot or other indexing bots
        let robots = this.head.querySelector('meta[name="robots"]');
        if (!robots) return null;
        let rawDirectives = robots.getAttribute('content');
        let parsedDirectives = rawDirectives.split(',').map(directive => directive.trim());
        return {
            bot: 'robots',
            directives: parsedDirectives
        }
    }

    getPrimarySEO() {
        let data = { URL: this.URL };
        data.title = this.getTitle();
        data.description = this.getDescription();
        data.canonical = this.getCanonical();
        data.robots = this.getRobots();
        return data;
    }
}