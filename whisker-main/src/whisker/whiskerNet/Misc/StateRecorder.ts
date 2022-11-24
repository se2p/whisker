import {EventEmitter} from "events";
import Scratch from "whisker-web/src/components/scratch-stage";

export class StateRecorder extends EventEmitter {

    private scratch: Scratch;

    constructor(scratch: Scratch) {
        super();
        this.scratch = scratch;
    }

    public startRecording(): void {
        console.log("STARTED");
    }
}
