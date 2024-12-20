import {CheckUtility} from "../../../../src/whisker/model/util/CheckUtility";

export class CheckUtilityMock {

    public pressedKeys: Record<string, boolean>;
    public constIsKeyDown: boolean;
    public addErrorOutput: jest.Mock;
    public registerOnMoveEvent: typeof CheckUtility.prototype.registerOnMoveEvent;
    public registerOnVarEvent: jest.Mock;
    public registerOnVisualChange: typeof CheckUtility.prototype.registerOnVisualChange;
    public registerOutput: typeof CheckUtility.prototype.registerOutput;
    public addTimeLimitFailOutput: jest.Mock;

    constructor(pressedKeys: Record<string, boolean> = {}, constIsKeyDown: boolean = undefined) {
        this.pressedKeys = pressedKeys;
        this.constIsKeyDown = constIsKeyDown;
        this.addErrorOutput = jest.fn();
        this.registerOnMoveEvent = jest.fn();
        this.registerOnVarEvent = jest.fn();
        this.registerOnVisualChange = jest.fn();
        this.addTimeLimitFailOutput = jest.fn();
        this.registerOutput = jest.fn();
    }

    getCheckUtility(): CheckUtility {
        return {
            isKeyDown: (key: string) =>
                this.constIsKeyDown != undefined ? this.constIsKeyDown : (this.pressedKeys)[key] == true,
            addErrorOutput: this.addErrorOutput,
            registerOnMoveEvent: this.registerOnMoveEvent,
            registerVarEvent: this.registerOnVarEvent,
            registerOnVisualChange: this.registerOnVisualChange,
            addTimeLimitFailOutput: this.addTimeLimitFailOutput,
            registerOutput: this.registerOutput
        } as unknown as CheckUtility;
    }
}

export function getDummyCheckUtility(): CheckUtility {
    return new CheckUtilityMock().getCheckUtility();
}
