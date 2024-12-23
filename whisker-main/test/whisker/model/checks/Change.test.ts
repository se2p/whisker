test.todo("Implement Change tests");

/*

describe('testChange()', () => {
    describe('exception for invalid input', () => {
        const invalidInputs: [string, string, string][] = [
            ["0", "string", "-"],
            ["string", "0", "-"],
            ["string", "0", "+"],
            ["0", "string", "+"],
            ["0", "1", "anything"],
            ["0", "1", null],
            [null, "1", "+"],
            ["0", null, "-"],
        ];
        it.each(invalidInputs)('throw exception for: %s, %s, %s',
            (oldValue, newValue, change) => {
                expect(() => {
                    ModelUtil.testChange(oldValue, newValue, change);
                }).toThrow();
            });
    });

    describe('correct return values', () => {
        const params: [string, string, string, boolean][] = [
            ["0", "-1", "-", true],
            ["-1", "0", "-", false],
            ["1", "1", "-", false],

            ["0", "-1", "+5", false],
            ["-1", "0", "+", true],
            ["1", "1", "+", false],

            ["0", "-1", "=", false],
            ["-1", "0", "=", false],
            ["1", "1", "=", true],

            ["0", "-1", "+=", false],
            ["0", "-1", "-=", true],
        ];
        it.each(params)('testChange(%s, %s, %s) == %s',
            (oldValue, newValue, change, expected) => {
                expect(ModelUtil.testChange(oldValue, newValue, change)).toBe(expected);
            });
    });
});

 */
