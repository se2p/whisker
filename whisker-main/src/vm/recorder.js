/**
 * Transforms all events that are recorded by the {@code input-recorder} into string commands for the test file.
 */
class Recorder {

    /**
     * Starts the recorded Scratch project.
     * @returns {string} The green flag test command.
     */
    static greenFlag () {
        return '    t.greenFlag();';
    }

    /**
     * Stops the recorded Scratch project.
     * @returns {string} The end test command.
     */
    static end () {
        return '    t.end();';
    }

    /**
     * Clicks a target on the Scratch stage for a specific number of steps.
     * @param {RenderedTarget} target The rendered target that should be clicked.
     * @param {number} steps The number of steps the action holds on.
     */
    static click (target, steps) {
        if (target.isStage) {
            return Recorder.clickStage();
        } else if (target.isOriginal) {
            return Recorder.clickSprite(target.getName(), steps);
        } else {
            return Recorder.clickClone(target.x, target.y, steps);
        }
    }

    /**
     * Clicks the Scratch stage.
     * @returns {string} The click stage test command.
     */
    static clickStage () {
        return '    t.clickStage();';
    }

    /**
     * Clicks a sprite on the scratch stage for a specific number of steps.
     * @param {string} spriteName The name of the sprite that was clicked.
     * @param {number} steps The number of steps the action takes place.
     * @returns {string} The click sprite test command.
     */
    static clickSprite (spriteName, steps) {
        if (spriteName != null && steps > 0) {
            return '    t.clickSprite(\'' + spriteName + '\', ' + steps + ');';
        }
    }

    /**
     * Clicks a clone of a sprite with the coordinates (x, y) on the scratch stage for a specific number of steps.
     * @param {number} x The x coordinate of the clicked sprite clone.
     * @param {number} y The y coordinate of the clicked sprite clone.
     * @param {number} steps The number of steps the action holds on.
     * @returns {string} The click clone test command.
     */
    static clickClone (x, y, steps) {
        if (x != null && y != null && steps > 0) {
            return '    t.clickCloneByCoords(' + x + ', ' + y + ', ' + steps + ');';
        }
    }

    /**
     * Moves the mouse position to the coordinates (x, y) in a specific number of steps.
     * @param {number} x The x coordinate of the new mouse position.
     * @param {number} y The y coordinate of the new mouse position.
     * @param {number} steps The number of steps the action holds on.
     * @returns {string} The mouse move test command.
     */
    static mouseMove (x, y, steps) {
        if (x != null && y != null && steps > 0) {
            return '    t.mouseMove(' + x + ', ' + y + ', ' + steps + ');';
        }
    }

    /**
     * Presses and holds a key on the keyboard a specific number of steps.
     * @param {string} key The key that is pressed.
     * @param {number} steps The number of steps the action holds on.
     * @returns {string} The key press test command.
     */
    static keyPress (key, steps) {
        if (key != null && steps > 0) {
            return '    t.keyPress(\'' + key + '\', ' + steps + ');';
        }
    }

    /**
     * Types an answer to a question in the scratch project.
     * @param {string} answer The given answer.
     * @returns {string} The type text test command.
     */
    static typeText (answer) {
        if (answer != null) {
            return '    t.typeText(\'' + answer + '\');';
        }
    }

    /**
     * Pauses the Scratch project and waits for a specific number of steps before continuing with the next command.
     * @param {number} steps The number of steps the action holds on.
     * @returns {string} The wait test command.
     */
    static wait (steps) {
        if (steps > 0) {
            return '    await t.wait(' + steps + ');';
        }
    }

}

module.exports = Recorder;
