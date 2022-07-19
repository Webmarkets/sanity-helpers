module.exports = class Logger {
    constructor(logLevel) {
        // Log levels: 0 (normal), 1 (verbose)
        if (logLevel) {
            this.logLevel = logLevel;
        } else {
            this.logLevel = 0;
        }
    }

    log(message) {
        if (message.level > this.logLevel) {
            return;
        } else {
            switch (message.type) {
                case 'info':
                    this.info(message.content);
                    break;
                case 'warning':
                    this.warn(message.content);
                    break;
                case 'error':
                    this.error(message.content);
                    break;
                default:
                    this.info(message.content);
                    return;
            }
        }
    }

    info(messageContent) {
        console.log(`[INFO] ${messageContent}`);
    }

    warn(messageContent) {
        console.warn(`[WARNING]\x1b[1;33m${messageContent}\x1b[0m`);
    }

    error(messageContent) {
        console.error(`[ERROR]\x1b[1;31m${messageContent}\x1b[0m`);
    }
}