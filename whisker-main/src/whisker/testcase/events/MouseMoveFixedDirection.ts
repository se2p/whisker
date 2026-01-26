import {MouseMoveEvent} from "./MouseMoveEvent";
import {ScratchInterface} from "../../scratch/ScratchInterface";
import {NonExhaustiveCaseDistinction} from "../../core/exceptions/NonExhaustiveCaseDistinction";

/**
 * Moves the mouse pointer in a certain direction in the x or y dimension by a fixed magnitude.
 */
export class MouseMoveFixedDirection extends MouseMoveEvent {

    /**
     * Governs how often the mouse should be moved by the specified {@link _moveLength}.
     */
    private _steps: number

    /**
     * Constructs a {@link MouseMoveFixedDirection} event that moves the mouse a fixed number of pixels to a
     * given direction.
     * @param _direction The direction to move the mouse to.
     * @param _moveLength The number of pixels the mouse should be moved in each step.
     */
    constructor(private readonly _direction: MouseMoveDirection, private _moveLength = 5) {
        super(0, 0);
        this._steps = 1;
    }

    override numSearchParameter(): number {
        return 1;
    }

    override getSearchParameterNames(): string[] {
        return ["Steps"];
    }

    override setParameter(args: number[]): [number, number] {
        if (args.length <= 1) {
            throw new Error(`MouseMoveFixedDirection Action expects two parameters but only ${args.length} were given.`);
        }
        this._steps = args[0];
        this._moveLength = args[1];
        // Must be set; otherwise the mouse will always be reset since the event is initialized with (0,0).
        const currentPosition = ScratchInterface.getMousePositionScratch();
        this._x = currentPosition.x;
        this._y = currentPosition.y;

        const scratchBoundaries = ScratchInterface.getStageBounds();

        const moveLength = this._moveLength * this._steps;
        switch (this._direction) {
            case "UP":
                this._y = Math.min(scratchBoundaries.top, this._y + moveLength);
                break;
            case "DOWN":
                this._y = Math.max(scratchBoundaries.bottom, this._y - moveLength);
                break;
            case "LEFT":
                this._x = Math.max(scratchBoundaries.left, this._x - moveLength);
                break;
            case "RIGHT":
                this._x = Math.min(scratchBoundaries.right, this._x + moveLength);
                break;
            default:
                throw new NonExhaustiveCaseDistinction(
                    this._direction,
                    `Mouse direction ${this._direction} not supported!`
                );

        }

        return [this._x, this._y];
    }

    override stringIdentifier(): string {
        return `MouseMoveDirection-${this._direction}`;
    }

    override toString(): string {
        return `MouseMoveDimensionEvent ${this._direction} --> ${Math.trunc(this._steps * this._moveLength)}`;
    }
}

export type MouseMoveDirection = "UP" | "DOWN" | "LEFT" | "RIGHT";
