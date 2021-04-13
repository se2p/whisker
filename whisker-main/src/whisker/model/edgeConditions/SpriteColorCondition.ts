import {Condition} from "./Condition";

export class SpriteColorCondition implements Condition {
    private readonly spriteName: string;
    private readonly r: number;
    private readonly g: number;
    private readonly b: number;

    private fulfilled = false;

    constructor(spriteName: string, r: number, g: number, b: number) {
        this.spriteName = spriteName;
        this.r = r;
        this.g = g;
        this.b = b;
    }

    check(testDriver): boolean {
        if (this.fulfilled) {
            console.log("sprite color matched!!!!")
        }


        return this.fulfilled;
    }

    register(testDriver): void {
        let sprite = testDriver.getSprites(sprite => sprite.name.includes(this.spriteName))[0];
        console.log("resgister color")
        testDriver.onSpriteMoved(() => {
            if (!this.fulfilled) {
                console.log("checking color")
                this.fulfilled = sprite.isTouchingColor([this.r, this.g, this.b]);
            }
        });
    }

    reset(): void {
        console.log("reset color")
        this.fulfilled = false;
    }
}
