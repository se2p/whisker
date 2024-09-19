import Sprite from "../../../src/vm/sprite";

export class SpriteMock {
    public readonly name: string;
    public touchingMouse: boolean;
    public touchingColor: boolean;
    public touchingSprite: boolean;
    public variables: any;
    public currentCostumeName: string;
    public clones: SpriteMock[];
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

    public updateSprite() {
        this._sprite = {
            name: this.name,
            x: this.variables == null ? 0 : this.variables.find(v => v.name == "x").value,
            currentCostumeName: this.currentCostumeName,
            isOriginal: this._original,
            visible: this._visible,
            isTouchingMouse: () => this.touchingMouse,
            isTouchingColor: (colors: number[]) => this.touchingColor,
            isTouchingSprite: (sprite: Sprite) => this.touchingSprite,
            getVariables: (key: string) => this.variables,
            getVariable: (key: string) => this.variables[0],
            getClones: (withClones: boolean) => {
                return withClones
                    ? [this._sprite, ...this.clones.map(c => c._sprite)]
                    : [...this.clones.map(c => c._sprite)];
            }
        } as unknown as Sprite;
    }

    get sprite() {
        return this._sprite;
    }

    set visible(value: boolean) {
        this._visible = value;
        // this.createSprite();
        // TODO check if there is a possibility to change the attribute of the sprite after creation
    }

    public static toSpriteMockMap(array: SpriteMock[]): Record<string, Sprite> {
        const map: Record<string, Sprite> = {};
        for (const sprite of array) {
            map[sprite.name] = sprite.sprite;
        }
        return map;
    }
}
