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

    getOpenGraph() {
        let ogData = {
            type: null,
            title: null,
            image: null,
            url: null,
            description: null,
        };
        Object.keys(ogData).forEach(key => {
            let ogElement = this.head.querySelector(`meta[property="og:${key}"]`);
            if (ogElement) ogData[key] = ogElement.getAttribute('content');
        });
        return ogData;
    }

    getTwitterCard() {
        let twData = {
            card: null,
            url: null,
            title: null,
            description: null,
            image: null
        };
        Object.keys(twData).forEach(key => {
            let twElement = this.head.querySelector(`meta[property="twitter:${key}"]`);
            if (twElement) twData[key] = twElement.getAttribute('content');
        });
        return twData;
    }

    logFieldStatus(seoObject) {
        let fields = Object.keys(seoObject);
        fields.forEach(field => {
            if (seoObject[field] === null) {
                console.warn(`Missing field for document ${seoObject.URL}: ${field}`, 1);
            }
        })
    }

    parseRobotsTxt(robotsTxt) {
        let rules = robotsTxt.trim().split(/\n{2}/g);
        return rules.map(rule => {
            let ruleData = {
                userAgent: [],
                allow: [],
                disallow: [],
                sitemap: []
            }
            let directives = rule.split('\n');
            directives.forEach(directive => {
                let match = directive.match(/(.+)(:\s)(.+)/);
                if (match) {
                    let key = match[1];
                    let value = match[3];
                    switch (key.toLowerCase()) {
                        case 'user-agent':
                            ruleData.userAgent.push(value);
                            break;
                        case 'allow':
                            ruleData.allow.push(value);
                            break;
                        case 'disallow':
                            ruleData.disallow.push(value);
                            break;
                        case 'sitemap':
                            ruleData.sitemap.push(value);
                            break;
                        default:
                            console.warn(`Encountered invalid robots.txt key: ${key}`);
                    }
                } else {
                    console.warn(`Unable to parse robots.txt directive: ${directive}`);
                }
            });
            return ruleData;
        });
    }

    getPrimarySEO() {
        let data = { URL: this.URL };
        data.title = this.getTitle();
        data.description = this.getDescription();
        data.canonical = this.getCanonical();
        data.robots = this.getRobots();
        data.openGraph = this.getOpenGraph();
        data.twitterCard = this.getTwitterCard();
        this.logFieldStatus(data);
        return data;
    }
}