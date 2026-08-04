import * as fs from 'fs';
import * as path from 'path';

/**
 * Enterprise Logger Utility for EduTrack Migration Framework
 * Supports color-coded console output and append-only file logging.
 */
export class Logger {
    private logFilePath: string;

    constructor() {
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
        this.logFilePath = path.join(logsDir, `migration-${timestamp}.log`);
    }

    private formatMessage(level: string, message: string): string {
        const time = new Date().toISOString();
        return `[${time}] [${level}] ${message}`;
    }

    private appendToFile(formatted: string): void {
        fs.appendFileSync(this.logFilePath, formatted + '\n', 'utf8');
    }

    public info(message: string): void {
        const formatted = this.formatMessage('INFO', message);
        console.log(`\x1b[34mℹ ${message}\x1b[0m`); // Blue
        this.appendToFile(formatted);
    }

    public success(message: string): void {
        const formatted = this.formatMessage('SUCCESS', message);
        console.log(`\x1b[32m✔ ${message}\x1b[0m`); // Green
        this.appendToFile(formatted);
    }

    public warn(message: string): void {
        const formatted = this.formatMessage('WARN', message);
        console.log(`\x1b[33m⚠ ${message}\x1b[0m`); // Yellow
        this.appendToFile(formatted);
    }

    public error(message: string): void {
        const formatted = this.formatMessage('ERROR', message);
        console.log(`\x1b[31m✖ ${message}\x1b[0m`); // Red
        this.appendToFile(formatted);
    }

    public plan(message: string): void {
        const formatted = this.formatMessage('PLAN', message);
        console.log(`\x1b[36m[DRY-RUN] ${message}\x1b[0m`); // Cyan
        this.appendToFile(formatted);
    }

    public getLogFilePath(): string {
        return this.logFilePath;
    }
}

export const logger = new Logger();
