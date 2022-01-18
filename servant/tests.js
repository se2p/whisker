const test0 = async function (t) {
  await t.runForSteps(50);
  await t.runForSteps(1);
  await t.runForSteps(96);
  await t.runForSteps(1);
}

module.exports = [
  {
      test: test0,
      name: 'Generated Test',
      description: '',
      categories: []
  }
]
