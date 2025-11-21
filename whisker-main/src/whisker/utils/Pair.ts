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

/**
 * An immutable container class to store two elements of the same type.
 *
 * @param <T> The type of the elements in the pair
 * @author Sophia Geserer, Sebastian Schweikl
 */
export type Pair<T, U = T> = Readonly<[T, U]>;

export function pair<T, U>(x: T, y: U): Pair<T, U> {
    return [x, y];
}
