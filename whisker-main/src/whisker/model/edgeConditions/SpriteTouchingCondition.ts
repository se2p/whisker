import {Condition} from "./Condition";

export class SpriteTouchingCondition implements Condition {
    private readonly spriteName1: string;
    private readonly spriteName2: string;

    private fulfilled = false;

    constructor(spriteName1: string, spriteName2: string) {
        this.spriteName1 = spriteName1;
        this.spriteName2 = spriteName2;
    }

    check(testDriver): boolean {
        if (this.fulfilled) {
            console.log("sprite toucheeeeeeed!!!!!")
        }
        return this.fulfilled;
    }

    register(testDriver): void {
        let sprite = testDriver.getSprites(sprite => sprite.name.includes(this.spriteName1))[0];
        console.log("register touching")
        testDriver.onSpriteMoved(() => {
            if (!this.fulfilled) {
                console.log("checking touched")
                this.fulfilled = sprite.isTouchingSprite(this.spriteName2);
            }
        });
    }

    reset(): void {
        console.log("reset touching")
        this.fulfilled = false;
    }
}
