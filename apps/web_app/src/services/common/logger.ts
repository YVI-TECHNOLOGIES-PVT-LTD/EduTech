const isDev = import.meta.env.MODE === 'development';

export const logger = {
    debug: (msg: string, ...args: any[]) => {
        if (isDev) {
            console.debug(`[DEBUG] ${msg}`, ...args);
        }
    },
    info: (msg: string, ...args: any[]) => {
        console.info(`[INFO] ${msg}`, ...args);
    },
    warn: (msg: string, ...args: any[]) => {
        console.warn(`[WARN] ${msg}`, ...args);
    },
    error: (msg: string, ...args: any[]) => {
        console.error(`[ERROR] ${msg}`, ...args);
        // Connect to Sentry or monitoring APIs here in production
    }
};
