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

    isInLogLevel(level) {
        if (!level || level <= this.logLevel) {
            return true;
        } else {
            return false;
        }
    }

    success(message, level) {
        if (this.isInLogLevel(level)) this.console.warn(`\x1b[1;32m[SUCCESS] ${message}\x1b[0m`);
    }

    log(message, level) {
        this.info(message, level);
    }

    info(message, level) {
        if (this.isInLogLevel(level)) this.console.log(`[INFO] ${message}`);
    }

    warn(message, level) {
        if (this.isInLogLevel(level)) this.console.warn(`\x1b[1;93m[WARNING] ${message}\x1b[0m`);
    }

    error(message, level) {
        if (this.isInLogLevel(level)) this.console.error(`\x1b[1;31m[ERROR] ${message}\x1b[0m`);
    }
}