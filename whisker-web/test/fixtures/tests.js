const testa = async t => {
    t.keyPress('a', 10);
    await t.runForTime(250);
    for (let i = 0; i < 2; i++) {
        t.assert.line = 5; t.assert.ok(true);
        await t.runForTime(250);
    }
};

const testb = async t => {
    t.keyPress('b', 10);
    await t.runForTime(250);
    for (let i = 0; i < 2; i++) {
        t.assert.line = 14; t.assert.ok(i === 0);
        await t.runForTime(250);
    }
};

const testc = async t => {
    t.keyPress('c', 10);
    await t.runForTime(250);
    throw new Error('something unexpected happened');
};

const testabc = async t => {
    t.keyPress('a', 10);
    await t.runForTime(250);
    t.assert.line = 28; t.assert.ok(true);
    t.keyPress('b', 10);
    await t.runForTime(250);
    t.assume.line = 31; t.assume.ok(true);
    t.keyPress('c', 10);
    await t.runForTime(250);
    t.assume.line = 34; t.assume.ok(false);
};

const testConsecutiveAssertions = async t => {
    t.keyPress('a', 10);
    await t.runForTime(250);
    t.assert.line = 40; t.assert.ok(true);
    t.assert.line = 41; t.assert.not(false);
};

const skip = async t => {
    t.keyPress('a', 10);
    await t.runForTime(250);
    t.assert.line = 47; t.assert.ok(true);
};

const all = async t => {
    t.assert.line = 51; t.assert.all();

    t.assert.line = 53; t.assert.all(
        () => {
            t.assert.line = 55; t.assert.ok(true);
        },
        () => {
            t.assert.line = 58; t.assert.equal(1, 1);
        }
    );

    t.assert.line = 62; t.assert.all(
        () => {
            t.assert.line = 64; t.assert.not(false);
        },
        () => {
            t.assert.line = 67; t.assert.ok(true);
        },
        () => {
            t.assert.line = 70; t.assert.equal(1, 2);
        }
    );
};

const any = async t => {
    t.assert.line = 76; t.assert.any(
        () => {
            t.assert.line = 78; t.assert.not(true);
        },
        () => {
            t.assert.line = 81; t.assert.ok(false);
        },
        () => {
            t.assert.line = 84; t.assert.equal(1, 1);
        }
    );

    t.assert.line = 88; t.assert.any(
        () => {
            t.assert.line = 90; t.assert.not(true);
        },
        () => {
            t.assert.line = 93; t.assert.ok(false);
        },
        () => {
            t.assert.line = 96; t.assert.equal(1, 2);
        }
    );
};

const anyEmpty = async t => {
    t.assert.line = 102; t.assert.any();
};

const anyAll = async t => {
    t.assert.line = 106; t.assert.any(
        () => {
            t.assert.line = 108; t.assert.all(
                () => {
                    t.assert.line = 110; t.assert.ok(1 === 1);
                },
                () => {
                    t.assert.line = 113; t.assert.equal(1, 1);
                }
            );
        },
        () => {
            t.assert.line = 118; t.assert.any(
                () => {
                    t.assert.line = 120; t.assert.ok(false);
                }
            );
        }
    );

    t.assert.line = 126; t.assert.all(
        () => {
            t.assert.line = 128; t.assert.all(
                () => {
                    t.assert.line = 130; t.assert.ok(1 === 1);
                },
                () => {
                    t.assert.line = 133; t.assert.equal(1, 1);
                }
            );
        },
        () => {
            t.assert.line = 138; t.assert.any(
                () => {
                    t.assert.line = 140; t.assert.ok(false);
                }
            );
        }
    );
};

const each = async t => {
    t.assert.line = 148; t.assert.each([1, 2, 3], i => {
        t.assert.line = 149; t.assert.less(i, 3);
    });
};

module.exports = [
    {
        test: testa,
        name: 'testa',
        description: 'bla',
        categories: []
    },
    {
        test: testb,
        name: 'testb',
        description: 'blub',
        categories: []
    },
    {
        test: testc,
        name: 'testc',
        description: 'blubber',
        categories: []
    },
    {
        test: testabc,
        name: 'testabc',
        description: 'nix',
        categories: []
    },
    {
        test: testConsecutiveAssertions,
        name: 'consecutive assertions',
        description: 'coverage must not be cleared between consecutive assertions',
        categories: []
    },
    {
        test: skip,
        name: 'skip',
        description: 'this skipped test must not appear in the traces',
        categories: [],
        skip: true
    },
    {
        test: all,
        name: 'all',
        description: 'all assertion must only pass if all nested assertions pass',
        categories: []
    },
    {
        test: any,
        name: 'any',
        description: 'any assertion must only fail if no assertions pass',
        categories: []
    },
    {
        test: anyEmpty,
        name: 'anyEmpty',
        description: 'empty "any" assertion fails',
        categories: []
    },
    {
        test: anyAll,
        name: 'anyAll',
        description: 'tests deeply nested "all" and "any" assertions',
        categories: []
    },
    {
        test: each,
        name: 'each',
        description: 'test with assert.each',
        categories: []
    }
];
