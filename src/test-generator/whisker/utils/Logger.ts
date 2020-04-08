export enum LogLevel {
    
    ALWAYS = 0,

    TEACHING = 1,

    DEBUG = 2
}

export interface AnalysisLogger {

    setLogLevel(level: LogLevel): void;

    potentialUnsound(str: string): void;

    potentialIncomplete(str: string): void;

}

export class ConsoleLogger implements AnalysisLogger {

    private _logLevel: LogLevel;

    constructor(logLevel: LogLevel) {
        this._logLevel = logLevel;
    }

    potentialUnsound(str: string): void {
        console.warn('UNSOUND: ' + str);
    }

    potentialIncomplete(str: string): void {
        console.warn('INCOMPLETE: ' + str);
    }

    setLogLevel(logLevel: LogLevel): void {
        this._logLevel = logLevel;
    }
}

export class Logger {

    private static _LOGGER: AnalysisLogger;

    public static defaultLogger(): AnalysisLogger {
        if (!Logger._LOGGER) {
            Logger._LOGGER = new ConsoleLogger(LogLevel.ALWAYS);
        }

        return Logger._LOGGER;
    }

    public static potentialUnsound(str: string): void {
        Logger.defaultLogger().potentialUnsound(str);
    }

    public static potentialIncomplete(str: string): void {
        Logger.defaultLogger().potentialIncomplete(str);
    }

}
