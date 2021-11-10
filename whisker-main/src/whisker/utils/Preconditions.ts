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

import {IllegalArgumentException} from "../core/exceptions/IllegalArgumentException";

/**
 * TODO
 */
export class Preconditions {

    public static checkArgument(condition: boolean, message?: string): void {
        if (!condition) {
            if (message) {
                throw new IllegalArgumentException(message);
            } else {
                throw new IllegalArgumentException("Illegal argument!");
            }
        }
    }

    public static checkNotUndefined<E>(obj: E, message?: string): E {
        if (typeof obj === 'string' || obj instanceof String) {
            // To deal with the case that obj === ""
            return obj;
        }

        if (!obj) {
            if (message) {
                throw new IllegalArgumentException(message);
            } else {
                throw new IllegalArgumentException("Reference must not be undefined.");
            }
        }

        return obj;
    }

    public static checkListSize<T>(list: T[], size: number, message?: string): void {
        if (list.length != size) {
            if (message) {
                throw new IllegalArgumentException(message);
            } else {
                throw new IllegalArgumentException("List does not have expected size.");
            }
        }
    }

    // TODO add needed preconditions

}
