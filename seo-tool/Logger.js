const { Console } = require('node:console');

module.exports = class Logger {
    constructor(logLevel) {
        // Log levels: 0 (normal), 1 (verbose)
        if (logLevel) {
            this.logLevel = logLevel;
        } else {
            this.logLevel = 0;
        }
        this.console = new Console({ stdout: process.stdout, stderr: process.stderr })
    }

    validateLog(message, level) {
        if (!level || level <= this.logLevel) {
            if (typeof message == 'object') {
                return JSON.stringify(message, null, 2);
            }
            return message;
        } else {
            return false;
        }
    }

    success(message, level) {
        let validLog = this.validateLog(message, level);
        if (validLog) this.console.warn(`\x1b[1;32m[SUCCESS] ${validLog}\x1b[0m`);
    }

    log(message, level) {
        this.info(message, level);
    }

    info(message, level) {
        let validLog = this.validateLog(message, level);
        if (validLog) this.console.log(`[INFO] ${validLog}`);
    }

    warn(message, level) {
        let validLog = this.validateLog(message, level);
        if (validLog) this.console.warn(`\x1b[1;93m[WARNING] ${validLog}\x1b[0m`);
    }

    error(message, level) {
        let validLog = this.validateLog(message, level);
        if (validLog) this.console.error(`\x1b[1;31m[ERROR] ${validLog}\x1b[0m`);
    }

    exception(error, level) {
        // let validLog = this.validateLog(error.message, level);
        this.console.error(`\x1b[1;31m[EXCEPTION] ${error.message}\x1b[0m`);
        this.console.error(error.cause);
    }
}