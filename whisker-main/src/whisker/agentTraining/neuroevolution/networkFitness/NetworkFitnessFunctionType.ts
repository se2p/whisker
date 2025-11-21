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
 * An enum that shows all available types of network fitness functions that can be used.
 */
export enum NetworkFitnessFunctionType {
    /**
     * Value for 'score' network fitness.
     */
    SCORE,

    /**
     * Value for 'survive' network fitness.
     */
    SURVIVE,

    /**
     * Value for 'reliableStatement' network fitness.
     */
    COVERAGE,

    /**
     * Value for 'manyObjectiveReliableStatement' network fitness.
     */
    MANY_OBJECTIVE_COVERAGE,

    /**
     * Value for 'cosineNovelty' network fitness.
     */
    NOVELTY_COSINE,

    /**
     * Value for 'eventNovelty' network fitness.
     */
    NOVELTY_EVENTS,

    /**
     * Default value if no network fitness type is set.
     * This is a valid scenario, e.g., when executing already generated dynamic test cases.
     */
    NONE
}
