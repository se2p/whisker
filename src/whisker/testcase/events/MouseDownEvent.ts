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

import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchEvent} from "../ScratchEvent";
import {NotYetImplementedException} from "../../core/exceptions/NotYetImplementedException";
import {WaitEvent} from "./WaitEvent";

export class MouseDownEvent implements ScratchEvent {

    apply(vm: VirtualMachine, args: number[]) {
        const stageSize = {
            width: 600,
            height: 480
        };

        const data = {
            device: 'mouse',
            x: args[0],
            y: args[1],
            isDown: !this._isMouseDown(vm),
            canvasWidth: stageSize.width,
            canvasHeight: stageSize.height
        };
        vm.postIOData(data.device, data);

        new WaitEvent().apply(vm); // TODO: tbd

        data.isDown = !data.isDown
        vm.postIOData(data.device, data);
    }

    toJavaScript(): string {
        throw new NotYetImplementedException();
    }

    getNumParameters(): number {
        return 2;
    }

    _isMouseDown(vm: VirtualMachine): boolean {
        return vm.runtime.ioDevices.mouse.getIsDown();
    }
}
