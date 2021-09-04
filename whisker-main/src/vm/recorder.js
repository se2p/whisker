class Recorder {

    /**
     * @returns {string} .
     */
    static greenFlag () {
        return '    t.greenFlag();';
    }

    /**
     * @returns {string} .
     */
    static end () {
        return '    t.end();';
    }

    /**
     * @param {RenderedTarget} target .
     * @param {number} steps .
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
     * @returns {string} .
     */
    static clickStage () {
        return '    t.clickStage();';
    }

    /**
     * @param {string} targetName .
     * @param {number} steps .
     * @returns {string} .
     */
    static clickSprite (targetName, steps) {
        if (targetName != null && steps > 0) {
            return '    t.clickSprite(\'' + targetName + '\', ' + steps + ');';
        }
    }

    /**
     * @param {number} x .
     * @param {number} y .
     * @param {number} steps .
     * @returns {string} .
     */
    static clickClone (x, y, steps) {
        if (x != null && y != null && steps > 0) {
            return '    t.clickClone(' + x + ', ' + y + ', ' + steps + ');';
        }
    }

    /**
     * @param {number} x .
     * @param {number} y .
     * @param {number} steps .
     * @returns {string} .
     */
    static mouseMove (x, y, steps) {
        if (x != null && y != null && steps > 0) {
            return '    t.mouseMove(' + x + ', ' + y + ', ' + steps + ');';
        }
    }

    /**
     * @param {string} key .
     * @param {number} steps .
     * @returns {string} .
     */
    static keyPress (key, steps) {
        if (key != null && steps > 0) {
            return '    t.keyPress(\'' + key + '\', ' + steps + ');';
        }
    }

    /**
     * @param {string} answer .
     * @returns {string} .
     */
    static typeText (answer) {
        if (answer != null) {
            return '    t.typeText(\'' + answer + '\');';
        }
    }

    /**
     * @param {number} steps .
     * @returns {string} .
     */
    static wait (steps) {
        if (steps > 0) {
            return '    await t.wait(' + steps + ');';
        }
    }

}

module.exports = Recorder;
