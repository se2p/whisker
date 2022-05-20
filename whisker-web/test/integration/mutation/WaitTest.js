const test0 = async function (t) {
    await t.runForSteps(10);
}

module.exports = [
    {
        test: test0,
        name: 'Generated Test',
        description: '',
        categories: [],
    }
]
