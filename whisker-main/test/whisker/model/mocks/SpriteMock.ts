import Sprite from "../../../../src/vm/sprite";
import {STAGE_NAME} from "../../../../src/assembler/utils/selectors";

export class SpriteMock {
    public readonly _name: string;
    public touchingMouse: boolean;
    public touchingColor: boolean;
    public touchingSprite: boolean;
    public variables: any[];
    public _currentCostumeName: string;
    public _old: SpriteMock;
    public _sayText: string;
    public touchingVerticalEdge: boolean;
    public touchingHorizontalEdge: boolean;
    public _original: boolean;
    public _clones: SpriteMock[];
    private _visible: boolean;
    private _sprite: Sprite;

    constructor(name: string, variables = null, isOriginal = true, isTouchingMouse = true, visible = true,
                isTouchingColor = true, touchingSprite = true, clones: SpriteMock[] = []) {
        this._name = name;
        this._original = isOriginal;
        this.touchingMouse = isTouchingMouse;
        this._visible = visible;
        this.touchingColor = isTouchingColor;
        this.touchingSprite = touchingSprite;
        this.variables = variables;
        this.clones = clones;
        this.updateSprite();
    }

    get clones(): SpriteMock[] {
        return this._clones;
    }

    set clones(value: SpriteMock[]) {
        value.forEach(c => c._original = false);
        this._clones = value;
    }

    get visible(): boolean {
        return this._visible;
    }

    set visible(value: boolean) {
        this._visible = value;
    }

    get sprite(): Sprite {
        return this._sprite;
    }

    get name(): string {
        return this._name;
    }

    get x(): number {
        return this.variables == null ? 0 : this.getValueOfVariableOrUndefined("x") as number;
    }

    get y(): number {
        return this.variables == null ? 0 : this.getValueOfVariableOrUndefined("y") as number;
    }

    get layerOrder(): number {
        return this.variables == null ? 0 : this.getValueOfVariableOrUndefined("layerOrder") as number;
    }

    get effects(): unknown {
        return this.variables == null ? 0 : this.getValueOfVariableOrUndefined("effects");
    }

    get rotationStyle(): string {
        return this.variables == null ? "" : this.getValueOfVariableOrUndefined("rotationStyle") as string;
    }

    get direction(): number {
        return this.variables == null ? 0 : this.getValueOfVariableOrUndefined("direction") as number;
    }

    get size(): number {
        return this.variables == null ? 0 : this.getValueOfVariableOrUndefined("size") as number;
    }

    get sayText(): string {
        return this._sayText || this.variables == null ? this._sayText : this.getValueOfVariableOrUndefined("sayText") as string;
    }

    get currentCostumeName(): string {
        return this._currentCostumeName || this.variables == null ? this._currentCostumeName : this.getValueOfVariableOrUndefined("currentCostumeName") as string;
    }

    get isOriginal(): boolean {
        return this._original;
    }

    get old(): Sprite {
        return this._old._sprite;
    }

    get Sprite(): Sprite {
        return this._sprite;
    }

    get _target(): { sprite: Sprite; isOriginal: boolean } {
        return {sprite: this._sprite, isOriginal: this._original};
    }

    get isStage(): boolean {
        return this._name == STAGE_NAME;
    }

    public static toSpriteArray(array: SpriteMock[]): Sprite[] {
        return array.map(m => m.updateSprite());
    }

    public static stringsToSpriteArray(array: string[]): Sprite[] {
        return SpriteMock.toSpriteArray(array.map(s => new SpriteMock(s)));
    }

    public updateSprite(): Sprite {
        if (this._old != null) {
            this._old.updateSprite();
        }
        this._sprite = this as unknown as Sprite;
        return this._sprite;
    }

    isTouchingMouse(): boolean {
        return this.touchingMouse;
    }

    isTouchingColor(): boolean {
        return this.touchingColor;
    }

    isTouchingSprite(): boolean {
        return this.touchingSprite;
    }

    isTouchingVerticalEdge(): boolean {
        return this.touchingVerticalEdge;
    }

    isTouchingHorizEdge(): boolean {
        return this.touchingHorizontalEdge;
    }

    isTouchingEdge(): boolean {
        return this.touchingVerticalEdge || this.touchingHorizontalEdge;
    }

    getVariables(predicate: (u: unknown) => boolean): unknown[] {
        return !this.variables ? this.variables : this.variables.filter(v => predicate(v));
    }

    getVariable(key: string): unknown {
        return !this.variables ? this.variables : this.variables.filter(v => v.name == key)[0];
    }

    getClones(withClones: boolean): Sprite[] {
        return withClones
            ? [this._sprite, ...this.clones.map(c => c._sprite)]
            : [...this.clones.map(c => c._sprite)];
    }

    getRangeOfX(): { min: number; max: number } {
        return this.boundsOf(-240, 240);
    }

    getRangeOfY(): { min: number; max: number } {
        return this.boundsOf(-180, 180);
    }

    getRangeOfSize(): { min: number; max: number } {
        return this.boundsOf(1, 100);
    }

    private boundsOf(min: number, max: number): { min: number, max: number } {
        return {min, max};
    }

    private getValueOfVariableOrUndefined(key: string): number | string {
        const variable = this.variables.find(v => v.name == key);
        return variable == undefined ? undefined : variable.value;
    }
}
