import Sprite from "../../../src/vm/sprite";

export class SpriteMock {
    public readonly name: string;
    public touchingMouse: boolean;
    public touchingColor: boolean;
    public touchingSprite: boolean;
    public variables: any;
    public currentCostumeName: string;
    public clones: SpriteMock[];
    public old: SpriteMock;
    public sayText: string;
    private _original: boolean;
    private _visible: boolean;
    private _sprite: Sprite;

    constructor(name: string, isOriginal = true, isTouchingMouse = true, visible = true,
                isTouchingColor = true, touchingSprite = true, variables = null, clones: SpriteMock[] = []) {
        this.name = name;
        this._original = isOriginal;
        this.touchingMouse = isTouchingMouse;
        this._visible = visible;
        this.touchingColor = isTouchingColor;
        this.touchingSprite = touchingSprite;
        this.variables = variables;
        this.clones = clones;
        this.updateSprite();
    }

    public updateSprite(): Sprite {
        if (this.old != null) {
            this.old.updateSprite();
        }
        this._sprite = {
            name: this.name,
            x: this.variables == null ? 0 : this.getValueOfVariableOrUndefined("x"),
            y: this.variables == null ? 0 : this.getValueOfVariableOrUndefined("y"),
            sayText: this.sayText,
            currentCostumeName: this.currentCostumeName,
            isOriginal: this._original,
            visible: this._visible,
            old: this.old == null ? null : this.old._sprite,
            sprite: this._sprite,
            _target: {sprite: this._sprite, isOriginal: this._original},
            isTouchingMouse: () => this.touchingMouse,
            isTouchingColor: (colors: number[]) => this.touchingColor,
            isTouchingSprite: (sprite: Sprite) => this.touchingSprite,
            getVariables: (predicate) => !this.variables ? this.variables : this.variables.filter(v => predicate(v)),
            getVariable: (key: string) => !this.variables ? this.variables : this.variables.filter(v => v.name == key)[0],
            getClones: (withClones: boolean) => {
                return withClones
                    ? [this._sprite, ...this.clones.map(c => c._sprite)]
                    : [...this.clones.map(c => c._sprite)];
            }
        } as unknown as Sprite;
        return this._sprite;
    }

    private getValueOfVariableOrUndefined(key: string): any {
        const variable = this.variables.find(v => v.name == key);
        return variable == undefined ? undefined : variable.value;
    }

    get sprite(): Sprite {
        return this._sprite;
    }

    set visible(value: boolean) {
        this._visible = value;
        // this.createSprite();
        // TODO check if there is a possibility to change the attribute of the sprite after creation
    }

    public static toSpriteArray(array: SpriteMock[]): Sprite[] {
        return array.map(m => m.updateSprite());
    }

    public static stringsToSpriteArray(array: string[]): Sprite[] {
        return SpriteMock.toSpriteArray(array.map(s => new SpriteMock(s)));
    }
}
