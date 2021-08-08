export class ScratchPosition {
    private readonly _x: number
    private readonly _y: number;

    constructor(x: number, y: number) {
        this._x = Math.trunc(x);
        this._y = Math.trunc(y);
    }

    public distanceTo(other: ScratchPosition): number {
        return Math.sqrt(Math.pow(other._x - this._x, 2) + Math.pow(other._y - this._y, 2));
    }

    public goInDirection(degree:number, distance:number): ScratchPosition{
        const radian = degree * (Math.PI / 180);
        const x = this._x + distance * Math.cos(radian)
        const y = this._y + distance * Math.sin(radian);
        return new ScratchPosition(x,y);
    }

    public goInDirectionTilted(degree:number, distance:number): ScratchPosition{
        const radian = degree * (Math.PI / 180);
        const x = this._x + distance * Math.sin(radian)
        const y = this._y + distance * Math.cos(radian);
        return new ScratchPosition(x,y);
    }

    public equals(other: ScratchPosition): boolean {
        return other._x === this._x && other._y === this._y;
    }

    public toString():string{
        return `ScratchPosition(${this.x}/${this.y})`;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }
}
