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

import {RenderedTarget} from 'scratch-vm/src/sprites/rendered-target';
import {Container} from "../../utils/Container";
import {ParameterTypes} from "./ParameterTypes";


export abstract class ScratchEvent {

    /**
     * Applies the event to the VM stored in the Container using the parameters stored in the attributes.
     */
    abstract apply(): Promise<void>;

    /**
     * Returns the number of parameters that will be defined during search.
     */
    abstract numSearchParameter(): number;

    /**
     * Returns the name(s) of parameter(s) defined during search.
     */
    abstract getSearchParameterNames(): string[];

    /**
     * Sets the parameter(s) of this event using the given arguments.
     * @param args the values to which the parameters of this event should be set to
     * @param argType the type of the given arguments decide how they should be interpreted as parameters.
     */
    abstract setParameter(args: number[], argType: ParameterTypes): void;

    /**
     * Returns all parameter(s) of this event.
     */
    abstract getParameter(): (number | string | RenderedTarget) [];

    /**
     * Transforms the event into an executable Whisker-Test statement.
     */
    abstract toJavaScript(): string;

    /**
     * Transforms the event into a string representation.
     */
    abstract toString(): string;

    /**
     * Returns an identifier as string. Events containing parameters defined during search obtain the same
     * identifier and Events whose parameters are determined by the ScratchEventExtractor get different identifiers.
     * The id is used to query the right RegressionNode if search defined parameters for a specific Event are needed.
     */
    abstract stringIdentifier():string;

    /**
     * Fits the given coordinates to the Scratch-Stage.
     * @param x the x-coordinate to fit into the range [-StageWidth/2, StageWidth/2]
     * @param y the y-coordinate to fit into the range [-StageHeight/2, StageHeight]
     */
    protected fitCoordinates(x: number, y: number): { x: number, y: number } {
        const width = Container.vmWrapper.getStageSize().width;
        const height = Container.vmWrapper.getStageSize().height;
        x = (x % width) - (width / 2);
        y = (y % height) - (height / 2);
        return {x, y};
    }
}


