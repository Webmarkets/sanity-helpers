module.exports = class Logger {
    constructor(logLevel) {
        // Log levels: 0 (normal), 1 (verbose)
        if (logLevel) {
            this.logLevel = logLevel;
        } else {
            this.logLevel = 0;
        }
    }

    isInLogLevel(level) {
        if (!level || level <= this.logLevel) {
            return true;
        } else {
            return false;
        }
    }

    success(message, level) {
        if (this.isInLogLevel(level)) console.warn(`\x1b[1;32m[SUCCESS] ${message}\x1b[0m`);
    }

    info(message, level) {
        if (this.isInLogLevel(level)) console.log(`[INFO] ${message}`);
    }

    warn(message, level) {
        if (this.isInLogLevel(level)) console.warn(`\x1b[1;93m[WARNING] ${message}\x1b[0m`);
    }

    error(message, level) {
        if (this.isInLogLevel(level)) console.error(`\x1b[1;31m[ERROR] ${message}\x1b[0m`);
    }
}