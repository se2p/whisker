import {MouseMoveEvent} from "./MouseMoveEvent";
import {ScratchInterface} from "../../scratch/ScratchInterface";

/**
 * Moves the mouse pointer in a certain direction in the x or y dimension by a variable magnitude.
 */
export class MouseMoveDimensionEvent extends MouseMoveEvent {

    /**
     * The magnitude to scale the sigmoid activation output with: 240 for the x dimension and 180 for the y dimension.
     */
    private readonly _magnitude: number;

    /**
     * Constructs a MouseMoveDimensionEvent event, which moves the mouse pointer to a certain point in the x or y dimension.
     * @param _dimension the dimension to move the mouse pointer in (x or y)
     */
    constructor(private _dimension: MouseMoveByDimension) {
        super(0, 0);
        this._magnitude = this._dimension == "X" ? 240 : 180;
    }

    override numSearchParameter(): number {
        return 1; // dimension to change
    }

    override getSearchParameterNames(): string[] {
        return ["Length"];
    }

    override setParameter(args: number[]): [number, number] {
        if (args[0] < 0 || args[0] > 1) {
            throw new Error("MouseMoveDimensionEvent Action expects a parameter value between 0 and 1.");
        }

        // Must be set; otherwise the mouse will always be reset since the event is initialised with (0,0).
        const currentPosition = ScratchInterface.getMousePositionScratch();
        this._x = currentPosition.x;
        this._y = currentPosition.y;

        switch (this._dimension) {
            case "X":
                this._x = this._scaleSigmoidToMagnitude(args[0], this.magnitude);
                break;
            case "Y":
                this._y = this._scaleSigmoidToMagnitude(args[0], this.magnitude);
                break;
        }

        return [this._x, this._y];
    }

    override stringIdentifier(): string {
        return `MouseMoveDimensionEvent-${this._dimension}`;
    }

    override toString(): string {
        const value = this._dimension == "X" ? this._x : this._y;
        return `MouseMoveDimensionEvent ${this._dimension} --> ${Math.trunc(value)}`;
    }


    get magnitude(): number {
        return this._magnitude;
    }
}

export type MouseMoveByDimension = "X" | "Y";
