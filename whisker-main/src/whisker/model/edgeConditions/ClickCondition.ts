import {Condition} from "./Condition";

export class ClickCondition implements Condition {
    private x: number;
    private y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    check(testDriver): boolean {
        // console.log("for now nothing happens with the mouse click at " + x + y, testDriver);
        return false;
    }

    register(testDriver): void {
    }

    reset(): void {
    }

}
