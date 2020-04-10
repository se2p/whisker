/*
 * Copyright (C) 2020 Whisker contributors
 *
 * This file is part of the Whisker test generator for Scratch.
 *
 * Whisker is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Whisker is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Whisker. If not, see http://www.gnu.org/licenses/.
 *
 */

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
