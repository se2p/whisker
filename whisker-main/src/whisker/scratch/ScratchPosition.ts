export class ScratchPosition {
    private readonly _x: number
    private readonly _y: number;

    constructor(x: number, y: number) {
        this._x = Math.trunc(x);
        this._y = Math.trunc(y);
    }

    /**
     * Calculates the distance to another ScratchPosition on the canvas.
     * @param other the ScratchPosition to which the distance should be calculated.
     * @returns number representing the distance to the given ScratchPosition.
     */
    public distanceTo(other: ScratchPosition): number {
        const delta_x = other._x - this._x;
        const delta_y = other._y - this._y;
        return Math.hypot(delta_x, delta_y);
    }

    /**
     * Moves the current ScratchPosition along a specified angle.
     * @param degree the angle along which the current ScratchPosition should be moved.
     * @param distance defines how far the current ScratchPosition should be moved.
     * @returns ScratchPosition the new ScratchPosition resulting from moving the current ScratchPosition.
     */
    public goInDirection(degree: number, distance: number): ScratchPosition {
        const radian = degree * (Math.PI / 180);
        const x = this._x + distance * Math.cos(radian);
        const y = this._y + distance * Math.sin(radian);
        return new ScratchPosition(x, y);
    }

    /**
     * Games that have a top-down view usually tilt the x and y axis. This function moves a ScratchPosition on the
     * canvas along a specified angle with respect to a tilted x and y axis.
     * @param degree the angle along which the current ScratchPosition should be moved.
     * @param distance defines how far the current ScratchPosition should be moved.
     * @returns ScratchPosition the new ScratchPosition resulting from moving the current ScratchPosition.
     */
    public goInDirectionTilted(degree: number, distance: number): ScratchPosition {
        const radian = degree * (Math.PI / 180);
        const x = this._x + distance * Math.sin(radian);
        const y = this._y + distance * Math.cos(radian);
        return new ScratchPosition(x, y);
    }

    public clone(): ScratchPosition {
        return new ScratchPosition(this.x, this.y);
    }

    public equals(other: ScratchPosition): boolean {
        return other._x === this._x && other._y === this._y;
    }

    public toString(): string {
        return `ScratchPosition(${this.x}/${this.y})`;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }
}
