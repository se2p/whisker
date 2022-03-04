const test0 = async function (t) {
  await t.runForSteps(38);
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
